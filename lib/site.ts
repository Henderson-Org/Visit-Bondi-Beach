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
    "The local's guide to Sydney's Bondi Beach — where to swim, eat, stay and explore across Bondi and the Eastern Beaches.",
  instagram: 'https://instagram.com/visitbondibeach',
} as const;

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
  tagline: 'Bondi locals',
  bio: 'We’re a team of five Bondi locals with more than 60 years of living at Bondi Beach between us — writing the guides we wish visitors had.',
} as const;

export const NAV = [
  { label: 'Swim', href: '/where-to-swim-at-bondi-beach' },
  { label: 'Eat & Drink', href: '/bondi-eat-and-drink' },
  { label: 'With Kids', href: '/bondi-with-kids' },
  { label: 'Coastal Walk', href: '/bondi-coastal-walk' },
  { label: 'Getting Here', href: '/getting-to-bondi' },
  { label: 'Stay', href: '/accommodation' },
  { label: "What's On", href: '/bondi-blog' },
] as const;
