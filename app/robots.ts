import type { MetadataRoute } from 'next';
import { isProduction, siteOrigin, PROD_ORIGIN } from '@/lib/site';

/**
 * Environment-aware robots. Staging/preview deployments block ALL crawlers so the
 * new site can never be indexed before launch. Production allows crawling and
 * points at the sitemap on the production domain.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/search'] },
    ],
    sitemap: `${PROD_ORIGIN}/sitemap.xml`,
    host: siteOrigin(),
  };
}
