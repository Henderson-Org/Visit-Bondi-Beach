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
      // /admin is disallowed as an extra signal only. The actual protection is the
      // authentication enforced in middleware.ts - robots.txt is a request, not a lock,
      // and a disallowed path can still be discovered. Never treat this line as security.
      // `/search` used to be listed here and was removed: site search is entirely
      // client-side (components/SiteSearch.tsx filters /search-index.json and navigates
      // straight to the result), so no /search URL has ever existed. Disallowing a path
      // that 404s tells crawlers nothing and hides the fact that there are no crawlable
      // search-results URLs to worry about. Re-add it if a real search route is built.
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] },
    ],
    sitemap: `${PROD_ORIGIN}/sitemap.xml`,
  };
}
