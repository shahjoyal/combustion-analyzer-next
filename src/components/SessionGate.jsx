'use client';

// SessionGate
// -----------------------------------------------------------------------------
// Re-authenticates a user who comes back to a page in a *new* browser tab
// (e.g. via a bookmark after closing the tab). Until they sign in again the whole
// page is blurred, inert (no clicks, no keyboard focus, no scrolling) and a
// sign-in card sits on top.
//
// How it decides:
//   - On a successful login we store `ca_tab_auth = '1'` in sessionStorage.
//     sessionStorage lives only as long as the tab, so closing the tab clears it.
//     Refreshing the page / navigating inside the same tab keeps it.
//   - The login page clears the flag (so logging out always requires a new login).
//   - A tiny inline script in <head> (see RootShell) sets <html data-ca-auth="ok|locked">
//     before first paint, so a locked page is never visible un-blurred and a
//     signed-in tab never flashes the overlay.
//
// The login call goes through the same encrypted fetch shim (public/legacy/secure-api.js)
// that the normal login page uses, so no server change is needed.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import '@/styles/session-gate.css';

export const TAB_AUTH_KEY = 'ca_tab_auth';
const LOGIN_PATHS = new Set(['/', '/login.html']); // pages that must never be gated
const UNGATED_PATHS = new Set(['/admin.html']);    // standalone utility page, no login flow

const secureReady = () =>
  !!window.__secureApiInstalled || (window.__SECURE_CFG && window.__SECURE_CFG.enabled === false);

// The encryption shim is attached asynchronously by <LegacyScripts>; wait for it
// so the login request is encrypted exactly like on the normal login page.
async function waitForSecureApi(ms = 8000) {
  const start = Date.now();
  while (!secureReady() && Date.now() - start < ms) {
    await new Promise((r) => setTimeout(r, 100));
  }
}

export default function SessionGate() {
  const pathname = usePathname() || '/';
  const isLoginPage = LOGIN_PATHS.has(pathname);
  const isUngated = UNGATED_PATHS.has(pathname);

  // 'checking' (server render / first paint) -> 'locked' | 'open'; 'leaving' = fade-out after login
  const [state, setState] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const pwRef = useRef(null);

  // Decide lock state once on the client.
  useEffect(() => {
    if (isLoginPage) {
      // Landing on the login page = a fresh start; make sure the tab is not marked as signed in.
      try { sessionStorage.removeItem(TAB_AUTH_KEY); } catch (e) {}
      return;
    }
    let ok = false;
    try { ok = sessionStorage.getItem(TAB_AUTH_KEY) === '1'; } catch (e) {}
    setState(ok ? 'open' : 'locked');
    document.documentElement.setAttribute('data-ca-auth', ok ? 'ok' : 'locked');
  }, [isLoginPage]);

  const locked = state === 'checking' || state === 'locked';

  // Make everything except the gate unclickable / unfocusable / unscrollable while locked.
  useEffect(() => {
    if (isLoginPage || isUngated) return;
    const touched = [];
    if (locked) {
      Array.from(document.body.children).forEach((el) => {
        if (el === rootRef.current || el.hasAttribute('data-ca-gate') || el.contains(rootRef.current)) return;
        if (!el.inert) { el.inert = true; touched.push(el); }
      });
      document.documentElement.classList.add('ca-locked');
    }
    return () => {
      touched.forEach((el) => { el.inert = false; });
      document.documentElement.classList.remove('ca-locked');
    };
  }, [locked, isLoginPage, isUngated]);

  // When the lock screen appears: pre-fill the e-mail of the existing session (if any) and focus.
  useEffect(() => {
    if (state !== 'locked') return;
    let cancelled = false;
    (async () => {
      try {
        await waitForSecureApi(4000);
        const res = await fetch('/auth/status', { credentials: 'include' });
        const data = await res.json();
        if (!cancelled && data && data.authenticated && data.email) {
          setEmail((cur) => cur || data.email);
        }
      } catch (e) { /* no prefill - user can type it */ }
      if (!cancelled) pwRef.current?.focus();
    })();
    return () => { cancelled = true; };
  }, [state]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const em = email.trim();
    if (!em || !password) { setError('Please enter your email and password.'); return; }

    setBusy(true);
    setError('');
    try {
      await waitForSecureApi();
      const res = await fetch('/auth/login', {
        method: 'POST',
        credentials: 'include', // store the new session cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password }),
      });
      let data = {};
      try { data = await res.json(); } catch (err) {}
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setPassword('');
        pwRef.current?.focus();
        return;
      }
      try {
        sessionStorage.setItem(TAB_AUTH_KEY, '1');
        localStorage.setItem('isLoggedIn', 'true'); // the legacy page scripts still read this
      } catch (err) {}
      setPassword('');
      setState('leaving'); // fade the overlay out, then drop it
      setTimeout(() => {
        document.documentElement.setAttribute('data-ca-auth', 'ok');
        setState('open');
      }, 380);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoginPage || isUngated || state === 'open') return null;

  return (
    <div
      ref={rootRef}
      data-ca-gate=""
      className={`ca-gate${state === 'leaving' ? ' ca-gate--out' : ''}${state === 'checking' ? ' ca-gate--checking' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ca-gate-title"
    >
      <form className="ca-gate__card" onSubmit={handleSubmit} noValidate>
        <img className="ca-gate__logo" src="/images/abhitech-logo.png" alt="" />
        <div className="ca-gate__lock" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </div>
        <h2 id="ca-gate-title">Please sign in again</h2>
        <p className="ca-gate__sub">
          For your security, sign in again to continue to this page.
        </p>

        <label className="ca-gate__field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@company.com"
            disabled={busy}
          />
        </label>

        <label className="ca-gate__field">
          <span>Password</span>
          <div className="ca-gate__pw">
            <input
              ref={pwRef}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder="Enter your password"
              disabled={busy}
            />
            <button
              type="button"
              className="ca-gate__eye"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              aria-pressed={showPw}
              tabIndex={-1}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {showPw && <path d="M4 4l16 16" />}
              </svg>
            </button>
          </div>
        </label>

        <div className="ca-gate__error" role="alert" aria-live="polite">{error}</div>

        <button type="submit" className="ca-gate__submit" disabled={busy}>
          {busy ? <span className="ca-gate__spinner" aria-hidden="true" /> : null}
          <span>{busy ? 'Signing in…' : 'Sign in'}</span>
        </button>

        <a className="ca-gate__alt" href="/login.html">Go to the login page instead</a>
      </form>
    </div>
  );
}