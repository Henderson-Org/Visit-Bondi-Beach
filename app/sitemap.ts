import type { MetadataRoute } from 'next';
import { allPages } from '@/lib/content';
import { PROD_ORIGIN } from '@/lib/site';

/**
 * XML sitemap generated from the content index. Only indexable pages are included
 * (tag archives are noindex,follow and excluded). URLs use the production domain
 * per the migration checklist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return allPages()
    .filter((p) => p.indexable)
    .map((p) => ({
      url: `${PROD_ORIGIN}${p.path}`,
      lastModified: p.lastmod || p.publishedAt || undefined,
      changeFrequency: p.section === 'blog' ? 'monthly' : 'weekly',
      priority: p.path === '/' ? 1 : p.contentType === 'core-page' ? 0.8 : 0.6,
    }));
}
