// src/lib/withEncryption.js
//
// Route wrapper that applies the project-wide encryption to an API route.
// The original handlers are untouched: they still call `await req.json()` and
// return `NextResponse.json(...)`, and see only plain objects.
//
//   REQUEST   JSON body { encryptedData: "<hex>" }  ->  decrypted, handed to the
//             handler as an ordinary JSON request.
//             Not touched: GET/HEAD/OPTIONS, empty bodies, and non-JSON bodies
//             (multipart file uploads).
//   RESPONSE  JSON bodies            ->  { encryptedData: "<hex>" }
//             text/* bodies (CSV)    ->  { encryptedData: "<hex>", contentType }
//             Not touched: binary downloads (xlsx), empty bodies, 204/304.
//             Status code and headers (incl. Set-Cookie) are preserved.
//
// Usage:   export const POST = withEncryption(withAlerts('POST /x', handlePOST));
//
// Env:
//   ENCRYPTION_ENABLED=false         turn the whole thing off (debugging)
//   ALLOW_PLAINTEXT_REQUESTS=true    also accept un-encrypted JSON request bodies
//                                    (responses are still encrypted)

import { NextRequest, NextResponse } from 'next/server';
import { encryptData, decryptData, isEncryptionEnabled } from '@/lib/encryption.utils';

const NO_BODY_STATUS = new Set([101, 204, 205, 304]);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const isJsonType = (ct) => /\bjson\b/i.test(ct || '');
const isTextType = (ct) => /^text\//i.test(ct || '');
const allowPlaintext = () => String(process.env.ALLOW_PLAINTEXT_REQUESTS || '').toLowerCase() === 'true';

function rebuildRequest(req, bodyText) {
  const headers = new Headers(req.headers);
  headers.delete('content-length'); // body length changed
  return new NextRequest(req.url, {
    method: req.method,
    headers,
    body: bodyText,
    signal: req.signal,
  });
}

// Returns { req } to continue, or { error: Response } to short-circuit.
async function decryptRequest(req) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return { req };
  if (!isJsonType(req.headers.get('content-type'))) return { req }; // multipart etc.

  const raw = await req.text();
  if (!raw || !raw.trim()) return { req: rebuildRequest(req, raw) };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }

  if (parsed && typeof parsed === 'object' && typeof parsed.encryptedData === 'string') {
    let plain;
    try {
      plain = decryptData(parsed.encryptedData);
    } catch {
      return { error: NextResponse.json({ error: 'Invalid encrypted payload' }, { status: 400 }) };
    }
    return { req: rebuildRequest(req, JSON.stringify(plain)) };
  }

  if (allowPlaintext()) return { req: rebuildRequest(req, raw) };
  return { error: NextResponse.json({ error: 'Encrypted payload required' }, { status: 400 }) };
}

export async function encryptResponse(res) {
  if (!res || typeof res.headers?.get !== 'function' || typeof res.clone !== 'function') return res;
  if (NO_BODY_STATUS.has(res.status)) return res;

  const contentType = res.headers.get('content-type') || '';
  const json = isJsonType(contentType);
  if (!json && !isTextType(contentType)) return res; // binary downloads etc.

  const bodyText = await res.clone().text();
  if (!bodyText) return res;

  let envelope;
  if (json) {
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return res;
    }
    envelope = { encryptedData: encryptData(data) };
  } else {
    envelope = { encryptedData: encryptData(bodyText), contentType };
  }

  const headers = new Headers(res.headers);
  headers.set('content-type', 'application/json');
  headers.set('cache-control', 'no-store');
  headers.delete('content-length');
  return new NextResponse(JSON.stringify(envelope), {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export function withEncryption(handler) {
  return async function encrypted(req, ...rest) {
    if (!isEncryptionEnabled()) return handler(req, ...rest);

    const { req: plainReq, error } = await decryptRequest(req);
    if (error) return encryptResponse(error);

    const res = await handler(plainReq, ...rest);
    return encryptResponse(res);
  };
}
