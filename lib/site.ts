/**
 * Central site configuration and environment-aware URL/indexing logic.
 *
 * SEO-critical rule: the production canonical host is https://www.visitbondibeach.com.
 * Any deployment whose host is NOT the production domain (Vercel preview URLs,
 * localhost, staging) must be treated as non-indexable so it never competes with
 * the live Squarespace site or, later, the live production site.
 */
export const PROD_HOST = 'www.visitbondibeach.com';
export const PROD_ORIGIN = `https://${PROD_HOST}`;

/**
 * Resolve the canonical origin for the current deployment.
 * On production we always emit the real domain so canonicals/sitemap/OG are correct
 * even when served from a *.vercel.app alias.
 */
export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, '');
  // In production, always emit the real canonical domain - even when the request
  // is served from a *.vercel.app alias - so canonicals/OG/JSON-LD never point at
  // the Vercel URL. This means launch needs only NEXT_PUBLIC_IS_PRODUCTION=true.
  if (isProduction()) return PROD_ORIGIN;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

/**
 * Is this deployment the real production site? Only then do we allow indexing.
 * Controlled explicitly via NEXT_PUBLIC_IS_PRODUCTION=true (set in Vercel's
 * Production environment only) so staging/preview stay noindex by default.
 */
export function isProduction(): boolean {
  return process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true';
}

export const SITE = {
  name: 'Visit Bondi Beach',
  tagline: "The local's guide to Sydney's Bondi Beach",
  description:
    "The local's guide to Sydney's Bondi Beach - where to swim, eat, stay and explore across Bondi and the Eastern Beaches.",
  instagram: 'https://instagram.com/visitbondibeach',
} as const;

/**
 * The brand suffix appended by the root layout's title template (`%s - Visit Bondi Beach`).
 */
export const BRAND_SUFFIX = ` - ${SITE.name}`;

/**
 * Returns a Next.js `title` value that keeps the descriptive, keyword-bearing part of a
 * title visible in the SERP. The layout template appends BRAND_SUFFIX (20 chars) to every
 * plain-string title, which pushes long titles past Google's ~60-char cutoff and truncates
 * exactly the words that earn the click. So: keep the suffix only while the FULL rendered
 * title still fits; otherwise emit `{ absolute }` (no suffix).
 *
 * Callers must pass the bare title WITHOUT the suffix - the length test has to be applied
 * to the rendered result, not the input, which is the bug this helper exists to prevent.
 * `app/[...slug]` implements the same rule inline for content pages; code routes (venues,
 * stay, what's-on, dining collections) should use this.
 */
export function seoTitle(clean: string): string | { absolute: string } {
  const bare = clean.replace(new RegExp(`\\s*${BRAND_SUFFIX}\\s*$`, 'i'), '').trim();
  return bare.length + BRAND_SUFFIX.length > 60 ? { absolute: bare } : bare;
}

/**
 * Editorial author. Content is written in a first-person local voice (the owner's
 * own opinion / local knowledge), so first-person is legitimate. Default attributes
 * to the local brand; set NEXT_PUBLIC_AUTHOR_NAME to a real person + switch `type`
 * to 'Person' for stronger E-E-A-T once a named author + bio is provided.
 */
export const AUTHOR = {
  name: process.env.NEXT_PUBLIC_AUTHOR_NAME || 'Visit Bondi Beach Editorial Team',
  type: (process.env.NEXT_PUBLIC_AUTHOR_TYPE as 'Person' | 'Organization') || 'Organization',
  url: `${PROD_ORIGIN}/visit-bondi-beach`,
  // Stable @id for the author entity so every article references ONE resolvable author
  // (see authorJsonLd in lib/structured-data.ts). Kept as a fragment on the author page.
  id: `${PROD_ORIGIN}/visit-bondi-beach#editorial-team`,
  tagline: 'Bondi locals',
  bio: 'We’re a team of five Bondi locals with more than 60 years of living at Bondi Beach between us - writing the guides we wish visitors had.',
  // What the team is expert in - ties the author entity to the topics it covers for E-E-A-T.
  knowsAbout: ['Bondi Beach', 'Eastern Suburbs Sydney', 'ocean swimming', 'coastal walks', 'Sydney travel'],
} as const;

export const NAV = [
  { label: 'Start Here', href: '/start-here' },
  { label: 'Things to Do', href: '/things-to-do-in-bondi' },
  { label: 'Swim', href: '/where-to-swim-at-bondi-beach' },
  { label: 'Eat & Drink', href: '/bondi-eat-and-drink' },
  { label: 'With Kids', href: '/bondi-with-kids' },
  { label: 'Getting Here', href: '/getting-to-bondi' },
  { label: 'Stay', href: '/stay' },
  { label: "What's On", href: '/whats-on' },
  { label: 'Articles', href: '/articles' },
] as const;

/**
 * The full topic-hub set, grouped for the footer mega-nav (the site's crawlable authority
 * backbone: every hub is one click from every page). Groups mirror the target IA - a spoke
 * should never be more than a couple of hops from any page. Keep every href a real hub page.
 */
export const HUB_NAV: { group: string; items: { label: string; href: string }[] }[] = [
  { group: 'Plan your visit', items: [
    { label: 'First time? Start here', href: '/start-here' },
    { label: 'Itineraries', href: '/itineraries' },
    { label: 'Weather & sea temps', href: '/bondi-weather' },
    { label: "What's On", href: '/whats-on' },
    { label: 'Plan your day', href: '/plan' },
  ] },
  { group: 'Things to do', items: [
    { label: 'Things to do', href: '/things-to-do-in-bondi' },
    { label: 'Surfing', href: '/bondi-surfing' },
    { label: 'City2Surf & running', href: '/city2surf-and-running' },
    { label: 'With kids', href: '/bondi-with-kids' },
  ] },
  { group: 'Swim & coast', items: [
    { label: 'Where to swim', href: '/where-to-swim-at-bondi-beach' },
    { label: 'Coastal walk', href: '/bondi-coastal-walk' },
    { label: 'Bondi Rescue', href: '/bondi-rescue' },
  ] },
  { group: 'Eat, stay & get here', items: [
    { label: 'Eat & drink', href: '/bondi-eat-and-drink' },
    { label: 'Where to stay', href: '/stay' },
    { label: 'Getting to Bondi', href: '/getting-to-bondi' },
    { label: 'Parking', href: '/bondi-parking' },
  ] },
] as const;
