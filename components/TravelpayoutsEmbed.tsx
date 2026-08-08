'use client';

import Script from 'next/script';
import { isProduction } from '@/lib/site';

/**
 * Travelpayouts web-integration ("tpembars") script for the affiliate account.
 * Injects the Travelpayouts loader into <head> exactly as their dashboard snippet
 * does — reproduced here via next/script so it's managed by the framework instead of
 * a hand-edited <head>.
 *
 * Production-only, matching Analytics/AdSense: monetisation/consent scripts should
 * never run on preview or staging deployments (that would pollute the account and
 * fire ads on non-public builds). It goes live on the production domain, where
 * NEXT_PUBLIC_IS_PRODUCTION=true — i.e. on every page of the live site.
 */
export function TravelpayoutsEmbed() {
  if (!isProduction()) return null;
  return (
    <Script id="travelpayouts-embed" strategy="afterInteractive">
      {`(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.setAttribute("data-cmp-ab", "2");
  script.src = 'https://tpembars.com/MjIwNzk2.js?t=220796';
  document.head.appendChild(script);
})();`}
    </Script>
  );
}
