// GET /secure-config.js
//
// Hands the browser-side encryption helper (public/legacy/secure-api.js) the
// same key/IV the server uses, straight from env, so there is one source of
// truth. NOTE: anything the browser can decrypt, a user of the browser can
// read - see README "API encryption" for what this does and doesn't protect.

import { getCryptoConfig, isEncryptionEnabled } from '@/lib/encryption.utils';

export async function GET() {
  const enabled = isEncryptionEnabled();
  const cfg = enabled ? getCryptoConfig() : null;
  const body = `window.__SECURE_CFG = ${JSON.stringify({
    enabled,
    key: cfg ? cfg.keyStr : null,
    iv: cfg ? cfg.ivStr : null,
  })};\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
