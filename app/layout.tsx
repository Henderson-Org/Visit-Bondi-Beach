import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/**
 * Fraunces - the brand display serif, self-hosted (no runtime Google Fonts request).
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
import { AnalyticsBeacon } from '@/components/AnalyticsBeacon';
import { TravelpayoutsEmbed } from '@/components/TravelpayoutsEmbed';
import { SITE, siteOrigin, isProduction } from '@/lib/site';
import { organizationJsonLd, websiteJsonLd, authorJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s - ${SITE.name}`,
  },
  description: SITE.description,
  // No default canonical here. Next.js metadata is inherited, so a `canonical: '/'` on the
  // root layout silently makes every page that forgets its own canonical claim to BE the
  // homepage - the one canonical error search engines act on immediately, by dropping the
  // page. Every indexable route sets its own (the homepage included, in app/page.tsx); the
  // only routes without one are /admin and /admin/login, which are noindex and auth-gated,
  // and are better off with no canonical than a wrong one. scripts/seo-regression.mjs
  // checks canonicals against the served URL.
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    locale: 'en_AU',
  },
  twitter: { card: 'summary_large_image' },
  // Belt-and-braces: staging/preview deployments are globally noindex.
  robots: isProduction() ? undefined : { index: false, follow: false },
  // The commit this deployment was built from, baked in at build time. It exists so a
  // FROZEN DEPLOY PIPELINE IS VISIBLE. When the repo moved to the Henderson-Org
  // organisation, Vercel stayed connected to the old owner and silently stopped building;
  // the site kept serving happily for thirteen days because ISR keeps regenerating pages
  // with fresh weather from the live providers, so nothing looked wrong. Only the code was
  // frozen. `npm run deploy:check` compares this value against origin/main and says so.
  other: { 'build-commit': process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 40) ?? 'local' },
};

/**
 * The icons themselves are picked up from the app/ file conventions (icon.svg,
 * favicon.ico, apple-icon.png), so there is no `metadata.icons` block to keep in sync
 * with the files - Next emits the <link> tags from whatever is on disk.
 *
 * themeColor tints the browser UI around the page on Android Chrome and on iOS Safari,
 * and is the same teal as the icon tile.
 */
export const viewport: Viewport = {
  themeColor: '#186576',
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
        {/* First-party analytics. Runs alongside GA4 (which is untouched) and writes to
            our own database, so the site's history survives dropping any third party. */}
        <AnalyticsBeacon />
        <TravelpayoutsEmbed />
      </body>
    </html>
  );
}
