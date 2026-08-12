/**
 * Redirect / owned-route registry - the single runtime source of truth for which content paths
 * are 301-redirected (consolidated duplicates, migrated URLs) or served by a dedicated app route.
 *
 * The list lives in content/redirected-paths.json so both this module (runtime) and
 * scripts/build-translations.mjs (build-time guard) read the same data. The actual 301
 * source→destination mappings and the rationale for each redirect live in next.config.mjs;
 * keep this list in sync with those.
 *
 * Why the translation layer cares: a translation must automatically follow its English page's
 * redirect/removal status. If an English article is redirected but its translations lingered,
 * their hreflang (and the survivor's) would point at a 301/404 - the classic way an hreflang
 * cluster rots. `isRedirectedOrOwned` lets the translation layer exclude those bases so a
 * redirected English page never leaves orphaned, mis-linked translations behind.
 */
import registry from '@/content/redirected-paths.json';

/** Paths that 301 elsewhere - must NOT be statically generated (they'd shadow the redirect). */
export const REDIRECTED_PATHS: ReadonlySet<string> = new Set(registry.redirected);

/** Paths in the content index now served by a dedicated app route that owns their canonical. */
export const OWNED_BY_ROUTE: ReadonlySet<string> = new Set(registry.ownedByRoute);

/** True if the English path is redirected or owned by another route (→ no live translations). */
export function isRedirectedOrOwned(path: string): boolean {
  return REDIRECTED_PATHS.has(path) || OWNED_BY_ROUTE.has(path);
}
