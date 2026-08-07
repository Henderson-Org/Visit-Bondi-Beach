'use client';

import { useEffect } from 'react';

/**
 * A single, deliberately-placed AdSense display unit — NOT Auto Ads.
 * Design goals (owner: "natural fit, don't take over"):
 *  - reserved min-height so it never causes layout shift (CLS)
 *  - clearly labelled "Advertisement"
 *  - production-only; inert until a real ad-unit `slot` id is configured
 *  - on staging, shows a quiet placeholder so placement is reviewable
 *
 * Create ad units in AdSense (Ads → By ad unit → In-article/Display), then pass
 * the numeric `data-ad-slot` id via env (e.g. NEXT_PUBLIC_AD_SLOT_INARTICLE).
 */
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-3425864271290233';
const PROD = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slot, label = 'In-article' }: { slot?: string; label?: string }) {
  useEffect(() => {
    if (PROD && slot) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* AdSense not ready — ignore */
      }
    }
  }, [slot]);

  if (!PROD) {
    return (
      <div
        className="my-8 flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-sand-300 bg-sand-100 text-xs text-ink-500"
        aria-hidden="true"
      >
        Ad placement · {label} (hidden until launch)
      </div>
    );
  }

  if (!slot) return null; // production, but no ad unit configured yet — render nothing

  return (
    <aside aria-label="Advertisement" className="my-8">
      <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-ink-500">Advertisement</p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: 120 }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-ad-layout="in-article"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
