import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/**
 * Fraunces — the brand display serif, self-hosted (no runtime Google Fonts request).
 * One latin variable woff2 (~66 KB) covers the weight axis we use (400 body headings,
 * 600 for the occasional font-semibold heading). `display: 'swap'` avoids invisible
 * text; `preload` emits a single preload for this one file (the display face), so we
 * never over-preload. Exposed as the --font-display CSS var consumed by tailwind's
 * `font-display` family (Georgia stays the fallback, so CLS/CWV stay green).
 */
const fraunces = localFont({
  src: './fonts/fraunces-latin-var.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  preload: true,
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
});
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AdsenseScript } from '@/components/Adsense';
import { Analytics } from '@/components/Analytics';
import { TravelpayoutsEmbed } from '@/components/TravelpayoutsEmbed';
import { SITE, siteOrigin, isProduction } from '@/lib/site';
import { organizationJsonLd, websiteJsonLd, authorJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    locale: 'en_AU',
  },
  twitter: { card: 'summary_large_image' },
  // Belt-and-braces: staging/preview deployments are globally noindex.
  robots: isProduction() ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={fraunces.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd()) }}
        />
      </head>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <AdsenseScript />
        <Analytics />
        <TravelpayoutsEmbed />
      </body>
    </html>
  );
}
