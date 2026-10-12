// src/lib/encryption.utils.js
//
// Same scheme as the shared encryption.utils.js: AES-256-CBC, hex output,
// JSON in / JSON out. Wire format is unchanged so other services that already
// speak this format stay compatible:
//
//   request / response body  ->  { "encryptedData": "<hex>" }
//
// Differences from the original file:
//   * key / IV come from env (ENCRYPTION_KEY = 32 chars, ENCRYPTION_IV = 16 chars)
//     instead of being hard-coded. The original values are kept ONLY as a
//     development fallback so the app runs out of the box - set real values in
//     production (see .env.example).
//   * the key/IV are length-checked so a bad value fails loudly.

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Development fallback only (values from the original encryption.utils.js).
const DEV_KEY = 'qwertyuiopasdfghjklzxcvbnm123456';
const DEV_IV = '1234567890123456';

let warned = false;

export function getCryptoConfig() {
  const keyStr = process.env.ENCRYPTION_KEY || DEV_KEY;
  const ivStr = process.env.ENCRYPTION_IV || DEV_IV;

  const secretKey = Buffer.from(keyStr, 'utf8');
  const iv = Buffer.from(ivStr, 'utf8');

  if (secretKey.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 bytes for AES-256 (got ${secretKey.length})`);
  }
  if (iv.length !== 16) {
    throw new Error(`ENCRYPTION_IV must be exactly 16 bytes (got ${iv.length})`);
  }

  if (!warned && (!process.env.ENCRYPTION_KEY || !process.env.ENCRYPTION_IV)) {
    warned = true;
    console.warn('[encryption] ENCRYPTION_KEY / ENCRYPTION_IV not set - using the built-in development key. Set them in .env.local for production.');
  }

  return { keyStr, ivStr, secretKey, iv };
}

export function isEncryptionEnabled() {
  return String(process.env.ENCRYPTION_ENABLED ?? 'true').toLowerCase() !== 'false';
}

export function encryptData(data) {
  try {
    const { secretKey, iv } = getCryptoConfig();
    const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
}

export function decryptData(encryptedData) {
  try {
    const { secretKey, iv } = getCryptoConfig();
    const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
}
