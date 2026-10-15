'use client';

// Behaviour of the two toolbar "hubs" on the coal table page:
//   left  : "Select Coal"  -> Select / Select Range / Edit / Delete
//   right : "Download"     -> Template / Whole page PDF / Selected Excel / Selected PDF
// Hover or click a hub -> its buttons slide out in one line and everything else hides.
//   hover : opens it while the mouse is over the hub, closes shortly after it leaves
//   click : opens it and PINS it (stays open); click again to close
//   Esc / click outside / choosing a download action closes it
//
// This lives in React (not in public/legacy/coal_table.js) on purpose, so the toolbar keeps
// working no matter how the legacy script is cached or loaded.

import { useEffect } from 'react';

export default function useToolbarHubs() {
  useEffect(() => {
    const toolbar = document.getElementById('coalToolbar');
    if (!toolbar) return undefined;

    const ac = new AbortController();
    const on = (target, type, fn, opts) => target.addEventListener(type, fn, { ...opts, signal: ac.signal });

    const hubs = Array.from(toolbar.querySelectorAll('.tb-hub'));
    const canHover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
    let openHub = null;
    let pinned = false;
    let suppressHub = null; // after clicking a hub closed, don't re-open it until the mouse leaves
    let openTimer = null;
    let closeTimer = null;

    const searchIsFocused = () => document.activeElement && document.activeElement.id === 'searchInput';

    function setOpen(hub, isPinned) {
      clearTimeout(closeTimer);
      openHub = hub;
      pinned = !!hub && !!isPinned;
      toolbar.setAttribute('data-open', hub ? hub.getAttribute('data-hub') : 'none');
      hubs.forEach((h) => {
        const isOn = h === hub;
        h.classList.toggle('is-open', isOn);
        h.classList.toggle('is-pinned', isOn && pinned);
        const t = h.querySelector('.tb-trigger');
        if (t) t.setAttribute('aria-expanded', String(isOn));
      });
    }
    function close() {
      clearTimeout(openTimer);
      setOpen(null, false);
    }
    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { if (!pinned) close(); }, 300);
    }
    window.__closeToolbarHubs = close; // used by coal_table.js after a download

    hubs.forEach((hub) => {
      const trigger = hub.querySelector('.tb-trigger');
      if (!trigger) return;

      on(trigger, 'click', (e) => {
        e.stopPropagation();
        clearTimeout(openTimer);
        if (openHub === hub && pinned) {          // pinned -> click closes it
          suppressHub = hub;
          close();
        } else {                                  // closed, or only open from hover -> click pins it
          setOpen(hub, true);
          trigger.classList.remove('tb-pulse');
          void trigger.offsetWidth;               // restart the little "pressed" animation
          trigger.classList.add('tb-pulse');
        }
      });
      on(trigger, 'animationend', () => trigger.classList.remove('tb-pulse'));

      if (canHover) {
        on(hub, 'mouseenter', () => {
          clearTimeout(closeTimer);
          if (openHub === hub || pinned || suppressHub === hub || searchIsFocused()) return; // don't hide the search box while typing
          clearTimeout(openTimer);
          openTimer = setTimeout(() => setOpen(hub, false), 90);
        });
        on(hub, 'mouseleave', () => {
          clearTimeout(openTimer);
          if (suppressHub === hub) suppressHub = null;
          if (openHub === hub) scheduleClose();
        });
      }

      if (hub.getAttribute('data-hub') === 'download') {
        hub.querySelectorAll('.tb-strip button').forEach((b) => {
          on(b, 'click', () => setTimeout(close, 150)); // fold the strip away after a download action
        });
      }
    });

    on(document, 'click', (e) => {
      if (openHub && pinned && !openHub.contains(e.target)) close();
    });
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // ---- keep the selected-row counter + "Selected" download buttons in sync with the ticked rows ----
    function syncSelection() {
      const n = document.querySelectorAll('input[type="checkbox"]:checked').length;
      const any = n > 0;
      toolbar.querySelectorAll('.js-download-selected').forEach((b) => { b.disabled = !any; });
      const badge = document.getElementById('selCountBadge');
      if (badge && badge.textContent !== String(n)) badge.textContent = String(n);
      const grp = toolbar.querySelector('.tb-actions');
      if (grp) grp.classList.toggle('has-selection', any);
    }
    const later = () => setTimeout(syncSelection, 0);
    on(document, 'change', later);
    on(document, 'click', later);

    let raf = 0;
    const tableArea = document.querySelector('.table-wrapper');
    const mo = tableArea
      ? new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(syncSelection); })
      : null;
    if (mo) mo.observe(tableArea, { childList: true, subtree: true });
    syncSelection();

    return () => {
      ac.abort();
      if (mo) mo.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      if (window.__closeToolbarHubs === close) delete window.__closeToolbarHubs;
    };
  }, []);
}