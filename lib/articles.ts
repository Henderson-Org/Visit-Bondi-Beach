/**
 * Article topic classification for the /articles hub. The editorial posts keep their
 * existing /bondi-blog/* URLs (preserving rankings/backlinks) - this just organises them
 * by topic for browsing, and lets us surface "see more in this section" links.
 */
import { articles, type Page } from '@/lib/content';

export type ArticleTopic =
  | 'things-to-do'
  | 'swim'
  | 'surfing'
  | 'eat-drink'
  | 'coastal-walk'
  | 'getting-here'
  | 'parking'
  | 'city2surf'
  | 'itineraries'
  | 'weather'
  | 'family'
  | 'stay'
  | 'general';

export const TOPIC_LABEL: Record<ArticleTopic, string> = {
  'things-to-do': 'Things to do',
  swim: 'Swim',
  surfing: 'Surfing',
  'eat-drink': 'Eat & drink',
  'coastal-walk': 'Coastal walk',
  'getting-here': 'Getting here',
  parking: 'Parking',
  city2surf: 'City2Surf & running',
  itineraries: 'Itineraries',
  weather: 'Weather',
  family: 'Family',
  stay: 'Stay',
  general: 'General',
};

/** Optional "see the section" link per topic (drives the topic cluster). */
export const TOPIC_SECTION: Partial<Record<ArticleTopic, string>> = {
  'things-to-do': '/things-to-do-in-bondi',
  swim: '/where-to-swim-at-bondi-beach',
  surfing: '/bondi-surfing',
  'eat-drink': '/bondi-eat-and-drink',
  'coastal-walk': '/bondi-coastal-walk',
  'getting-here': '/getting-to-bondi',
  parking: '/bondi-parking',
  city2surf: '/city2surf-and-running',
  itineraries: '/itineraries',
  weather: '/bondi-weather',
  family: '/bondi-with-kids',
  stay: '/stay',
};

export function articleTopic(p: Page): ArticleTopic {
  const s = `${p.h1 || ''} ${p.title || ''} ${p.path}`.toLowerCase();
  if (/eat|caf|coffee|restaurant|brunch|food|dining|drink|\bbar\b|pub|bakery|gelato|breakfast|dinner/.test(s)) return 'eat-drink';
  if (/hotel|accommodation|hostel|airbnb|where to stay/.test(s)) return 'stay';
  // Parking BEFORE coastal-walk & getting-here - "a car park at Bronte" is parking, not a
  // coastal-walk or generic-transport spoke. Concentrates the ~2,470-view parking cluster.
  if (/parking|car ?park/.test(s)) return 'parking';
  // City2Surf & running BEFORE things-to-do / coastal / getting-here - also rescues the
  // orphaned Sydney Marathon sub-cluster (getting-to-marathon, carb-load, recovery, …).
  if (/city ?2 ?surf|city[- ]to[- ]surf|heartbreak|marathon|running route|run club|best running/.test(s)) return 'city2surf';
  // Surfing (the sport) BEFORE swim - specific surf terms only, so "surf lifesaving" and
  // "surf lifesaver" stay under swim/safety, not surfing.
  if (/surf(ing| lesson| board| cam| school| break| guide)|learn to surf/.test(s)) return 'surfing';
  if (/swim|snorkel|icebergs|ocean pool|\brip\b|lifeguard|bondi rescue|water temp|shark/.test(s)) return 'swim';
  if (/\bkid|family|children|toddler|pram|playground/.test(s)) return 'family';
  if (/coastal walk|bronte|tamarama|coogee|clovelly|gordons bay/.test(s)) return 'coastal-walk';
  if (/transport|\bbus\b|\btrain\b|airport|getting (to|around)|\bdrive\b|uber|taxi/.test(s)) return 'getting-here';
  if (/weather|temperature|\brain\b|sunrise|sunset|season|best time/.test(s)) return 'weather';
  // Itineraries BEFORE things-to-do - plan-my-visit intent (how long / one day / first-timer).
  if (/itinerary|24 hours|one day|half day|day trip|weekend in bondi|first[- ]time visitor/.test(s)) return 'itineraries';
  if (/thing(s)? to do|activities|experience|hidden gem|attraction|market|festival|sculpture|new year|christmas/.test(s)) return 'things-to-do';
  return 'general';
}

/**
 * The topical hub an article belongs to, for spoke→hub internal linking + breadcrumbs.
 * Returns null for unmapped ('general') topics or when the page IS the hub, so we never
 * self-link. Drives both the topical breadcrumb parent and the "part of {hub}" up-link,
 * giving all ~200 blog spokes an intentional link to their subject hub (concentrating
 * topical authority) instead of only the flat /articles index.
 */
export function articleHub(p: Page): { label: string; path: string } | null {
  const path = TOPIC_SECTION[articleTopic(p)];
  if (!path || p.path === path) return null;
  return { label: TOPIC_LABEL[articleTopic(p)], path };
}

export interface ArticleFacet {
  path: string;
  title: string;
  topic: ArticleTopic;
  date: string; // ISO or ''
}

export function articleFacets(): ArticleFacet[] {
  return articles().map((p) => ({
    path: p.path,
    title: p.h1 || p.title || p.path,
    topic: articleTopic(p),
    date: p.publishedAt || p.lastmod || '',
  }));
}

/** Topics that actually have articles, in display order, with counts. */
export function articleTopicsWithCounts(): { topic: ArticleTopic; count: number }[] {
  const counts = new Map<ArticleTopic, number>();
  for (const f of articleFacets()) counts.set(f.topic, (counts.get(f.topic) || 0) + 1);
  const order: ArticleTopic[] = ['things-to-do', 'itineraries', 'swim', 'surfing', 'eat-drink', 'coastal-walk', 'getting-here', 'parking', 'city2surf', 'weather', 'family', 'stay', 'general'];
  return order.filter((t) => counts.has(t)).map((t) => ({ topic: t, count: counts.get(t)! }));
}
