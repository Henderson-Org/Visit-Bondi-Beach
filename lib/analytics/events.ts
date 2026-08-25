/**
 * The site's analytics event vocabulary — one place, so an event name is never invented
 * twice with two spellings and every event has a written definition.
 *
 * Rules these events follow:
 *  - Fire on genuine INTENT, never on render. An event that fires when a component mounts
 *    measures our layout, not the visitor, and inflates every rate computed from it.
 *  - Text the visitor typed is debounced and only sent once it has settled, so a search
 *    box does not emit one event per keystroke.
 *  - Never send anything identifying. Query text is the visitor's own words about Bondi;
 *    it is truncated and sent only for the site's own search boxes.
 *  - One event per action. If an action already has an event, reuse it rather than adding
 *    a near-synonym — duplicate events are worse than no event, because they silently
 *    double-count.
 *
 * The GA4 wrapper (lib/analytics.ts) no-ops when gtag is absent, so calling these off
 * production is free and safe.
 */
import { track } from '@/lib/analytics';

export const EVENTS = {
  /** A visitor typed a query into the eat & drink directory's search box (debounced, settled). */
  DIRECTORY_SEARCH: 'directory_search',
  /** A visitor applied or cleared a filter in the eat & drink directory. */
  DIRECTORY_FILTER: 'directory_filter',
  /** A visitor changed the directory's sort order. */
  DIRECTORY_SORT: 'directory_sort',
  /** A visitor typed into the site-wide search (debounced, settled). */
  SITE_SEARCH: 'site_search',
  /** A visitor opened a result from the site-wide search. */
  SITE_SEARCH_RESULT_CLICK: 'site_search_result_click',
} as const;

/**
 * DELIBERATELY NOT TRACKED — venue card clicks.
 *
 * RestaurantCard is a server component rendered 200+ times on the directory. Adding an
 * onClick would make every card a client component and ship the JavaScript to match, on
 * the page most likely to be opened on a phone standing in Bondi. That is a bad trade for
 * a metric we already have: venue page views are recorded by the first-party analytics
 * (app/api/collect), and the referrer tells us which surface sent them. Defining an event
 * we never fire would be worse than either — a documented metric that silently reads zero.
 */

/** How long a search box must be idle before we count the query as intentional. */
export const SEARCH_DEBOUNCE_MS = 800;
/** Queries are truncated before sending — we want the topic, not an essay. */
const MAX_QUERY_CHARS = 64;

const cleanQuery = (q: string) => q.trim().slice(0, MAX_QUERY_CHARS);

/**
 * A settled search query. `resultCount` is the payload that matters: a stream of searches
 * with zero results is the clearest signal of content the site is missing.
 */
export function trackSearch(event: string, query: string, resultCount: number, placement: string): void {
  const q = cleanQuery(query);
  if (q.length < 2) return; // a single character is a keystroke, not a search
  track(event, { query: q, result_count: resultCount, placement });
}

/** A filter application. `value` is null when the filter was cleared. */
export function trackFilter(facet: string, value: string | null, resultCount: number): void {
  track(EVENTS.DIRECTORY_FILTER, {
    facet,
    value: value ?? '(cleared)',
    applied: value !== null,
    result_count: resultCount,
  });
}
