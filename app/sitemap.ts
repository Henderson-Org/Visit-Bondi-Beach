import type { MetadataRoute } from 'next';
import { allPages } from '@/lib/content';
import { PROD_ORIGIN } from '@/lib/site';
import { stayCategorySlugs } from '@/data/stay-categories';
import { guideSlugs } from '@/data/accommodation-guides';
import { eventSlugs } from '@/data/events';
import { collectionSlugs as diningCollectionSlugs, venuesWithGuide } from '@/lib/eatDrink';

/**
 * XML sitemap generated from the content index. Only indexable pages are included
 * (tag archives are noindex,follow and excluded). URLs use the production domain
 * per the migration checklist.
 */

// Paths that redirect (301) and must NOT appear in the sitemap.
const REDIRECTED = new Set(['/accommodation', '/bondi-blog']);

// Code-defined routes (app/*), not in the content index.
const STATIC_ROUTES: { path: string; priority: number }[] = [
  // Stay section
  { path: '/stay', priority: 0.8 },
  { path: '/stay/bondi-beach-vs-bondi-junction', priority: 0.6 },
  { path: '/stay/hostels-bondi-beach', priority: 0.6 },
  ...stayCategorySlugs().map((slug) => ({ path: `/stay/${slug}`, priority: 0.7 })),
  ...guideSlugs().map((slug) => ({ path: `/stay/${slug}`, priority: 0.6 })),
  // Eat & Drink engine — collection (category) pages + individual venue guides
  ...diningCollectionSlugs().map((slug) => ({ path: `/bondi-eat-and-drink/${slug}`, priority: 0.7 })),
  ...venuesWithGuide().map((v) => ({ path: `/bondi-eat-and-drink/${v.id}`, priority: 0.6 })),
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

  const fromStatic = STATIC_ROUTES.map((r) => ({
    url: `${PROD_ORIGIN}${r.path}`,
    changeFrequency: 'weekly' as const,
    priority: r.priority,
  }));

  return [...fromContent, ...fromStatic];
}
