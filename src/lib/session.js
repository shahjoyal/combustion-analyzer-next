// src/lib/session.js
//
// Next.js route handlers don't have Express-style `req.session` middleware.
// This is a minimal drop-in replacement that preserves the same behaviour
// as the original `express-session` (MemoryStore, httpOnly cookie, 7 day
// maxAge, session destroyed on logout / trial exhaustion): an in-memory
// Map keyed by a random session id stored in an httpOnly cookie.
//
// NOTE: like the original MemoryStore, this does not persist across server
// restarts and does not scale across multiple Node processes. That matches
// the original app's behaviour (it also used the default in-memory store).

import crypto from 'crypto';

const COOKIE_NAME = 'sid';
const MAX_AGE_SECONDS = 7 * 24 * 3600; // 7 days, same as original app.js

if (!global._sessionStore) {
  global._sessionStore = new Map(); // sid -> { userId, expires }
}
const store = global._sessionStore;

function cleanExpired() {
  const now = Date.now();
  for (const [sid, s] of store.entries()) {
    if (s.expires && s.expires < now) store.delete(sid);
  }
}

export function getSessionUserId(request) {
  cleanExpired();
  const sid = request.cookies.get(COOKIE_NAME)?.value;
  if (!sid) return null;
  const s = store.get(sid);
  if (!s) return null;
  return s.userId || null;
}

// Attaches a new session cookie to `response` and stores userId.
export function createSession(response, userId) {
  const sid = crypto.randomUUID();
  store.set(sid, { userId, expires: Date.now() + MAX_AGE_SECONDS * 1000 });
  response.cookies.set(COOKIE_NAME, sid, {
    httpOnly: true,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    sameSite: 'lax',
  });
  return sid;
}

export function destroySession(request, response) {
  const sid = request.cookies.get(COOKIE_NAME)?.value;
  if (sid) store.delete(sid);
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}
