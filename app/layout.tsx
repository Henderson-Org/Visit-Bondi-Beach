import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AdsenseScript } from '@/components/Adsense';
import { Analytics } from '@/components/Analytics';
import { TravelpayoutsEmbed } from '@/components/TravelpayoutsEmbed';
import { SITE, siteOrigin, isProduction } from '@/lib/site';
import { organizationJsonLd, websiteJsonLd } from '@/lib/structured-data';

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
    <html lang="en-AU">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
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
