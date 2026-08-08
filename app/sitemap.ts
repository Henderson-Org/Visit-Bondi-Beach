import type { MetadataRoute } from 'next';
import { allPages } from '@/lib/content';
import { PROD_ORIGIN } from '@/lib/site';

/**
 * XML sitemap generated from the content index. Only indexable pages are included
 * (tag archives are noindex,follow and excluded). URLs use the production domain
 * per the migration checklist.
 */

// Paths that redirect (301) and must NOT appear in the sitemap.
const REDIRECTED = new Set(['/accommodation']);

// Code-defined section routes that live in app/* rather than the content index.
const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: '/stay', priority: 0.8 },
  { path: '/stay/bondi-beach-vs-bondi-junction', priority: 0.6 },
  { path: '/stay/hostels-bondi-beach', priority: 0.6 },
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
