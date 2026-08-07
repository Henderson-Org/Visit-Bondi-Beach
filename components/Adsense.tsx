import Script from 'next/script';
import { isProduction } from '@/lib/site';

/**
 * Google AdSense loader — migrated from the Squarespace site
 * (publisher ca-pub-3425864271290233). Gated to production only so staging /
 * preview deployments never serve ads (AdSense policy + keeps previews clean).
 * The client id is overridable via NEXT_PUBLIC_ADSENSE_CLIENT.
 */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-3425864271290233';

export function AdsenseScript() {
  if (!isProduction()) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
