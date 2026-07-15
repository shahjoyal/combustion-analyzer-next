'use client';

// LegacyPage — see project README for the rationale. In short: rather than
// hand-rewriting thousands of lines of imperative DOM/script logic into
// React state (risking subtly different formulas/behaviour), each original
// page's markup + script is preserved byte-for-byte and mounted here.
//
// `externalScripts` (CDN <script src> tags that were in the original head,
// e.g. Chart.js, XLSX, jsPDF, Plotly, google charts loader, axios) are
// loaded IN ORDER first — exactly matching the original synchronous
// <script> load order — and only once they've all finished do we inject
// the page's own inline script and fire synthetic DOMContentLoaded/load
// events (the real ones already fired before this component mounted).

import { useEffect, useRef } from 'react';

function loadScriptSequentially(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.dataset.legacySrc = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export default function LegacyPage({ bodyHtml, styleCss, scriptSrc, externalScripts, bodyClassName }) {
  const containerRef = useRef(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (injectedRef.current) return; // guard against React StrictMode double-invoke in dev
    injectedRef.current = true;

    if (bodyClassName) document.body.className = bodyClassName;

    let cancelled = false;

    (async () => {
      try {
        for (const src of externalScripts || []) {
          if (cancelled) return;
          await loadScriptSequentially(src);
        }
      } catch (err) {
        console.error('LegacyPage: failed loading external script', err);
      }
      if (cancelled) return;
      await loadScriptSequentially(scriptSrc);
      if (cancelled) return;
      // real DOMContentLoaded/load already fired before this component
      // mounted — re-dispatch synthetic ones for the legacy script's own
      // listeners (DOMContentLoaded / load), exactly matching the timing
      // it expects.
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
      window.dispatchEvent(new Event('load'));
    })();

    return () => {
      cancelled = true;
      if (bodyClassName) document.body.className = '';
    };
  }, [scriptSrc, externalScripts, bodyClassName]);

  return (
    <>
      <link rel="stylesheet" href="/legacy/premium.css" />
      {styleCss ? <style dangerouslySetInnerHTML={{ __html: styleCss }} /> : null}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
