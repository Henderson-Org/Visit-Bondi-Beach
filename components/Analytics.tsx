import Script from 'next/script';
import { isProduction } from '@/lib/site';

/**
 * Google Analytics 4 - migrated from the Squarespace site (G-KQ2SFKV2EZ).
 * Production-only so staging/preview traffic never pollutes reporting.
 * Override the id via NEXT_PUBLIC_GA_ID. Loaded afterInteractive to protect LCP/INP.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-KQ2SFKV2EZ';

export function Analytics() {
  if (!isProduction() || !GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
