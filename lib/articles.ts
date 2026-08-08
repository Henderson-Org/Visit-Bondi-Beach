/**
 * Article topic classification for the /articles hub. The editorial posts keep their
 * existing /bondi-blog/* URLs (preserving rankings/backlinks) — this just organises them
 * by topic for browsing, and lets us surface "see more in this section" links.
 */
import { articles, type Page } from '@/lib/content';

export type ArticleTopic =
  | 'things-to-do'
  | 'swim'
  | 'eat-drink'
  | 'coastal-walk'
  | 'getting-here'
  | 'weather'
  | 'family'
  | 'stay'
  | 'general';

export const TOPIC_LABEL: Record<ArticleTopic, string> = {
  'things-to-do': 'Things to do',
  swim: 'Swim',
  'eat-drink': 'Eat & drink',
  'coastal-walk': 'Coastal walk',
  'getting-here': 'Getting here',
  weather: 'Weather',
  family: 'Family',
  stay: 'Stay',
  general: 'General',
};

/** Optional "see the section" link per topic (drives the topic cluster). */
export const TOPIC_SECTION: Partial<Record<ArticleTopic, string>> = {
  'things-to-do': '/things-to-do-in-bondi',
  swim: '/where-to-swim-at-bondi-beach',
  'eat-drink': '/bondi-eat-and-drink',
  'coastal-walk': '/bondi-coastal-walk',
  'getting-here': '/getting-to-bondi',
  weather: '/bondi-weather',
  family: '/bondi-with-kids',
  stay: '/stay',
};

export function articleTopic(p: Page): ArticleTopic {
  const s = `${p.h1 || ''} ${p.title || ''} ${p.path}`.toLowerCase();
  if (/eat|caf|coffee|restaurant|brunch|food|dining|drink|\bbar\b|pub|bakery|gelato|breakfast|dinner/.test(s)) return 'eat-drink';
  if (/hotel|accommodation|hostel|airbnb|where to stay/.test(s)) return 'stay';
  if (/swim|snorkel|icebergs|ocean pool|\brip\b|lifeguard|bondi rescue|water temp|shark/.test(s)) return 'swim';
  if (/\bkid|family|children|toddler|pram|playground/.test(s)) return 'family';
  if (/coastal walk|bronte|tamarama|coogee|clovelly|gordons bay/.test(s)) return 'coastal-walk';
  if (/parking|car ?park|transport|\bbus\b|\btrain\b|airport|getting (to|around)|\bdrive\b|uber|taxi/.test(s)) return 'getting-here';
  if (/weather|temperature|\brain\b|sunrise|sunset|season|best time/.test(s)) return 'weather';
  if (/thing(s)? to do|activities|experience|itinerary|hidden gem|24 hours|day trip|attraction|market|surf|festival|city2surf|city to surf|sculpture|new year|christmas|marathon/.test(s)) return 'things-to-do';
  return 'general';
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
  const order: ArticleTopic[] = ['things-to-do', 'swim', 'eat-drink', 'coastal-walk', 'getting-here', 'weather', 'family', 'stay', 'general'];
  return order.filter((t) => counts.has(t)).map((t) => ({ topic: t, count: counts.get(t)! }));
}
