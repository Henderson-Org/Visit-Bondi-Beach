import type { MetadataRoute } from 'next';
import { allPages } from '@/lib/content';
import { PROD_ORIGIN } from '@/lib/site';
import { stayCategorySlugs } from '@/data/stay-categories';
import { guideSlugs } from '@/data/accommodation-guides';
import { eventSlugs } from '@/data/events';
import { collectionSlugs as diningCollectionSlugs, venuesWithPages } from '@/lib/restaurantGuide';
import { allTranslations, availableLocales } from '@/lib/translations';
import { hreflangAlternates, localizedPath } from '@/lib/i18n';

/**
 * XML sitemap generated from the content index. Only indexable pages are included
 * (tag archives are noindex,follow and excluded). URLs use the production domain
 * per the migration checklist.
 */

// Paths that redirect (301) and must NOT appear in the sitemap.
const REDIRECTED = new Set(['/accommodation', '/bondi-blog']);

// Code-defined routes (app/*), not in the content index.
const STATIC_ROUTES: { path: string; priority: number }[] = [
  // First-timer front door - the site's flagship visitor page.
  { path: '/start-here', priority: 0.9 },
  // Stay section
  { path: '/stay', priority: 0.8 },
  { path: '/stay/bondi-beach-vs-bondi-junction', priority: 0.6 },
  { path: '/stay/hostels-bondi-beach', priority: 0.6 },
  ...stayCategorySlugs().map((slug) => ({ path: `/stay/${slug}`, priority: 0.7 })),
  ...guideSlugs().map((slug) => ({ path: `/stay/${slug}`, priority: 0.6 })),
  // Eat & Drink directory - the hub, curated collection pages, and venue pages.
  { path: '/bondi-eat-and-drink', priority: 0.9 },
  ...diningCollectionSlugs().map((slug) => ({ path: `/bondi-eat-and-drink/${slug}`, priority: 0.7 })),
  // Individual venue pages (only venues with real editorial depth get an indexable page,
  // via /bondi-eat-and-drink/venues/[id]; the rest live in the directory listing only).
  ...venuesWithPages().map((r) => ({ path: `/bondi-eat-and-drink/venues/${r.id}`, priority: 0.6 })),
  // What's On (events) + Articles hub
  { path: '/whats-on', priority: 0.9 },
  { path: '/whats-on/today', priority: 0.6 },
  { path: '/whats-on/this-weekend', priority: 0.7 },
  { path: '/whats-on/free', priority: 0.6 },
  { path: '/whats-on/markets', priority: 0.7 },
  ...eventSlugs().map((slug) => ({ path: `/whats-on/${slug}`, priority: 0.6 })),
  { path: '/articles', priority: 0.7 },
  // Bondi Day Planner
  { path: '/plan', priority: 0.7 },
  // Original data feature - the Bondi Coffee Index
  { path: '/bondi-coffee-price-index', priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const fromContent = allPages()
    .filter((p) => p.indexable && !REDIRECTED.has(p.path))
    .map((p) => ({
      url: `${PROD_ORIGIN}${p.path}`,
      lastModified: p.lastmod || p.publishedAt || undefined,
      changeFrequency: (p.section === 'blog' ? 'monthly' : 'weekly') as 'monthly' | 'weekly',
      priority: p.path === '/' ? 1 : p.contentType === 'core-page' ? 0.8 : 0.6,
    }));

  // Static app routes (hubs, /stay, /whats-on, directory) are regenerated on every deploy,
  // so stamp the build date as lastModified - these are the URLs we most want recrawled
  // after an update, and they previously shipped no freshness signal at all.
  const buildDate = new Date();
  const fromStatic = STATIC_ROUTES.map((r) => ({
    url: `${PROD_ORIGIN}${r.path}`,
    lastModified: buildDate,
    changeFrequency: 'weekly' as const,
    priority: r.priority,
  }));

  // Absolute-URL hreflang cluster for a page that has translations: en + each locale + x-default.
  // Attached to the English entry AND every translated entry (Google wants each URL to list the
  // full set including itself), so translations are indexed and never seen as duplicates.
  const absLangs = (path: string): Record<string, string> => {
    const rel = hreflangAlternates(path, availableLocales(path));
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rel)) out[k] = `${PROD_ORIGIN}${v}`;
    return out;
  };

  // Translated pages: one entry per (locale, path), each carrying the reciprocal cluster.
  const fromTranslations = allTranslations().map(({ locale, path }) => ({
    url: `${PROD_ORIGIN}${localizedPath(path, locale)}`,
    lastModified: buildDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    alternates: { languages: absLangs(path) },
  }));

  // De-duplicate by URL (a path may exist both in the content index and as a code route,
  // e.g. /bondi-eat-and-drink is now a real directory route but is still in pages.json).
  const seen = new Set<string>();
  return [...fromStatic, ...fromContent, ...fromTranslations]
    .filter((e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    })
    // Add the hreflang cluster to any English entry that has translations (translated entries
    // already carry theirs above). Leaves untranslated pages exactly as before.
    .map((e) => {
      const path = e.url.slice(PROD_ORIGIN.length) || '/';
      if ('alternates' in e) return e;
      return availableLocales(path).length > 0
        ? { ...e, alternates: { languages: absLangs(path) } }
        : e;
    });
}
