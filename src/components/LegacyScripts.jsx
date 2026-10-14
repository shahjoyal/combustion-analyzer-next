'use client';

// Attaches a page's behaviour script (public/legacy/<page>.js) to the JSX markup
// rendered next to it. Order matters and mirrors the original <script> tags:
//   vendor scripts (Chart.js, Plotly, XLSX, ...) -> API-encryption shim -> page script
// The real DOMContentLoaded/load have already fired by the time React mounts, so
// synthetic ones are dispatched for the page script's own listeners.

import { useEffect } from 'react';

const loading = new Map(); // src -> Promise, so a script is only ever added once

function loadScript(src) {
  if (!loading.has(src)) {
    loading.set(
      src,
      new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.onload = resolve;
        el.onerror = () => {
          loading.delete(src);
          reject(new Error(`Failed to load ${src}`));
        };
        document.body.appendChild(el);
      })
    );
  }
  return loading.get(src);
}

const ENCRYPTION_SCRIPTS = ['/secure-config.js', '/legacy/vendor/crypto-aes.min.js', '/legacy/secure-api.js'];

export default function LegacyScripts({ script, vendors = [] }) {
  const vendorKey = vendors.join('|');

  useEffect(() => {
    const vendorList = vendorKey ? vendorKey.split('|') : [];
    let cancelled = false;

    (async () => {
      try {
        for (const src of vendorList) await loadScript(src);
        for (const src of ENCRYPTION_SCRIPTS) await loadScript(src);
        window.SecureApi?.installAxios?.();
        await loadScript(script);
      } catch (err) {
        console.error('LegacyScripts:', err);
        return;
      }
      if (cancelled) return;
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
      window.dispatchEvent(new Event('load'));
    })();

    return () => {
      cancelled = true;
    };
  }, [script, vendorKey]);

  return null;
}
