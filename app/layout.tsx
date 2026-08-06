import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
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
        {!isProduction() && (
          <div className="bg-ocean-900 text-sand-50 text-center text-xs py-1.5 px-4">
            Staging preview · not indexed · content migrating from Squarespace
          </div>
        )}
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
