import Script from 'next/script';
import { isProduction } from '@/lib/site';

/**
 * Google AdSense loader - migrated from the Squarespace site
 * (publisher ca-pub-3425864271290233). Gated to production only so staging /
 * preview deployments never serve ads (AdSense policy + keeps previews clean).
 * The client id is overridable via NEXT_PUBLIC_ADSENSE_CLIENT.
 *
 * strategy="lazyOnload": ads are pure monetisation, never part of the initial
 * render or the first interaction. Loading them after the window load event
 * (rather than afterInteractive) keeps the adsbygoogle bootstrap off the main
 * thread during the LCP/INP window, protecting interaction latency. Ad slots
 * still fill - AdSlot pushes queue onto adsbygoogle[] and flush once this loads.
 *
 * MOUNTED PER PAGE, NOT IN THE ROOT LAYOUT. It used to sit in app/layout.tsx, which
 * loaded the ad stack on every route: of 878 prerendered pages, 160 render an ad slot
 * and 717 rendered none but still pulled this in. That is not just one script - the
 * adsbygoogle bootstrap drags in the Funding Choices consent frame (15 requests on the
 * homepage alone) plus doubleclick and adtrafficquality, all to fill zero ad units.
 * It now renders only where an AdSlot will actually render, behind the same
 * `isArticle && !page.noAds` condition, so hubs, directories, tools and the obituary
 * carry none of it. No revenue changes: a page with no ad units earns nothing either way.
 */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-3425864271290233';

export function AdsenseScript() {
  if (!isProduction()) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
