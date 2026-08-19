'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * First-party page-view beacon.
 *
 * Deliberately tiny: no library, no bundle of any consequence, one POST per page view,
 * fired after paint. It never blocks rendering and never affects layout, so Core Web
 * Vitals are unaffected.
 *
 * Inflation guards:
 *  - Runs in an effect, so server rendering and Next.js route PREFETCHES never fire it
 *    (prefetch fetches payloads; it does not mount and run effects).
 *  - A ref remembers the last path sent, so React StrictMode's double-invoke in
 *    development, and any re-render, cannot send twice.
 *  - Each view carries a UUID; the server upserts on it, so a browser-level retry of
 *    the same beacon collapses to one row.
 *  - /admin and /api paths are skipped here and rejected again on the server.
 *  - Disabled unless NEXT_PUBLIC_ANALYTICS_ENABLED is explicitly 'true', so local
 *    development and test runs never write to production analytics.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true') return;
    if (!pathname) return;
    if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/')) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    const payload = JSON.stringify({
      eventId: crypto.randomUUID(),
      pathname,
      title: document.title,
      // Same-origin referrers are dropped: internal navigation is already visible in
      // the page-view sequence, and this keeps the field to genuine external sources.
      referrer: document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : null,
    });

    // Defer past first paint so the beacon can never compete with rendering work.
    const send = () => {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon?.('/api/collect', blob)) return;
        void fetch('/api/collect', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          credentials: 'same-origin',
        }).catch(() => {});
      } catch {
        /* analytics must never throw into the page */
      }
    };

    const id = window.setTimeout(send, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
