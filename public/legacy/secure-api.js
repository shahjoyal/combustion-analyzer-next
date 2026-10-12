/*
 * secure-api.js - browser half of the project-wide API encryption.
 *
 * Same scheme as src/lib/encryption.utils.js (AES-256-CBC, hex, JSON):
 *     { "encryptedData": "<hex>" }
 *
 * Loaded by <LegacyPage> after axios and before each page script. It wraps
 * window.fetch and axios so the existing page code keeps working unchanged:
 *   - JSON request bodies to same-origin API URLs are encrypted
 *   - encrypted JSON responses are decrypted back into ordinary JSON/text
 *   - FormData uploads and binary downloads (xlsx) pass straight through
 *
 * Needs window.__SECURE_CFG (from /secure-config.js) and window.CryptoJS
 * (vendor/crypto-aes.min.js).
 */
(function () {
  'use strict';
  if (window.__secureApiInstalled) {
    if (window.SecureApi) window.SecureApi.installAxios(); // axios may have loaded since
    return;
  }

  var cfg = window.__SECURE_CFG;
  var CJ = window.CryptoJS;
  if (!cfg || !cfg.enabled) return; // encryption switched off on the server
  if (!CJ || !cfg.key || !cfg.iv) {
    console.error('[secure-api] missing config or CryptoJS - API calls will NOT be encrypted');
    return;
  }
  window.__secureApiInstalled = true;

  var KEY = CJ.enc.Utf8.parse(cfg.key);
  var IV = CJ.enc.Utf8.parse(cfg.iv);
  var OPTS = { iv: IV, mode: CJ.mode.CBC, padding: CJ.pad.Pkcs7 };

  function encryptData(data) {
    return CJ.AES.encrypt(JSON.stringify(data), KEY, OPTS).ciphertext.toString(CJ.enc.Hex);
  }
  function decryptData(hex) {
    var plain = CJ.AES.decrypt({ ciphertext: CJ.enc.Hex.parse(hex) }, KEY, OPTS).toString(CJ.enc.Utf8);
    return JSON.parse(plain);
  }
  window.SecureApi = { encryptData: encryptData, decryptData: decryptData };

  // Only our own API is encrypted - never CDNs, static files or the config script.
  function isApiUrl(u) {
    try {
      var url = new URL(String(u), window.location.href);
      if (url.origin !== window.location.origin) return false;
      var p = url.pathname;
      return !(p.indexOf('/legacy/') === 0 || p.indexOf('/_next/') === 0 || p === '/secure-config.js');
    } catch (e) {
      return false;
    }
  }

  function isEnvelope(o) {
    return !!o && typeof o === 'object' && typeof o.encryptedData === 'string';
  }

  /* ----------------------------- fetch ----------------------------- */
  var origFetch = window.fetch.bind(window);

  function headerValue(h, name) {
    if (!h) return '';
    if (typeof h.get === 'function') return h.get(name) || '';
    var k = Object.keys(h).filter(function (x) { return x.toLowerCase() === name.toLowerCase(); })[0];
    return k ? String(h[k]) : '';
  }

  window.fetch = function (input, init) {
    if (typeof input !== 'string' && !(input instanceof URL)) return origFetch(input, init); // Request objects: untouched
    if (!isApiUrl(input)) return origFetch(input, init);

    var nextInit = init;
    if (init && typeof init.body === 'string' && /json/i.test(headerValue(init.headers, 'Content-Type'))) {
      var parsed;
      try { parsed = JSON.parse(init.body); } catch (e) { parsed = undefined; }
      if (parsed !== undefined && !isEnvelope(parsed)) {
        nextInit = Object.assign({}, init, { body: JSON.stringify({ encryptedData: encryptData(parsed) }) });
      }
    }

    return origFetch(input, nextInit).then(function (res) {
      if (!/json/i.test(res.headers.get('content-type') || '')) return res;
      return res.clone().text().then(function (text) {
        var env;
        try { env = JSON.parse(text); } catch (e) { return res; }
        if (!isEnvelope(env)) return res;

        var data;
        try { data = decryptData(env.encryptedData); } catch (e) {
          console.error('[secure-api] could not decrypt response', e);
          return res;
        }
        var headers = new Headers(res.headers);
        headers.delete('content-length');
        var body;
        if (env.contentType) { // text/* response (e.g. CSV) that was wrapped
          headers.set('content-type', env.contentType);
          body = typeof data === 'string' ? data : JSON.stringify(data);
        } else {
          body = JSON.stringify(data);
        }
        return new Response(body, { status: res.status, statusText: res.statusText, headers: headers });
      });
    });
  };

  /* ----------------------------- axios ----------------------------- */
  function installAxios(ax) {
    if (!ax || ax.__secureInstalled || !ax.interceptors) return;
    ax.__secureInstalled = true;

    ax.interceptors.request.use(function (config) {
      var url = /^https?:/i.test(config.url || '') ? config.url : (config.baseURL || '') + (config.url || '');
      if (!isApiUrl(url)) return config;
      var method = String(config.method || 'get').toLowerCase();
      if (method === 'get' || method === 'head' || config.data === undefined || config.data === null) return config;
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) return config;

      var data = config.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return config; }
      }
      if (data && typeof data === 'object' && !isEnvelope(data)) {
        config.data = { encryptedData: encryptData(data) }; // axios JSON-stringifies this next
      }
      return config;
    });

    function unwrap(response) {
      if (response && isEnvelope(response.data)) {
        try { response.data = decryptData(response.data.encryptedData); } catch (e) {
          console.error('[secure-api] could not decrypt response', e);
        }
      }
      return response;
    }
    ax.interceptors.response.use(unwrap, function (error) {
      if (error && error.response) unwrap(error.response);
      return Promise.reject(error);
    });
  }

  window.SecureApi.installAxios = function () { installAxios(window.axios); };
  installAxios(window.axios);
})();
