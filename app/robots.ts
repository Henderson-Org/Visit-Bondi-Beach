import type { MetadataRoute } from 'next';
import { isProduction, PROD_ORIGIN } from '@/lib/site';

/**
 * Environment-aware robots. Staging/preview deployments block ALL crawlers so the
 * new site can never be indexed before launch. Production allows crawling and
 * points at the sitemap on the production domain.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  // A single wildcard group with `allow: '/'` is deliberate: it covers every AI/answer-engine
  // crawler (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot…) as well
  // as classic search bots - the correct AEO posture. Do NOT add a named crawler group unless it
  // also repeats `allow: '/'`, or robots' most-specific-group-wins rule would silently exclude it
  // from this allow. (The non-standard `host` directive was dropped - Google/Bing ignore it.)
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/search'] },
    ],
    sitemap: `${PROD_ORIGIN}/sitemap.xml`,
  };
}
