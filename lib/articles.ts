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
  // The television series and the people on it. Distinct from swim: this is the show,
  // not beach safety.
  | 'bondi-rescue'
  // Bondi as a subject in itself - history, names, landmarks, culture. These belong to the
  // Bondi Beach entity page, which is the canonical "what is this place" URL.
  | 'history'
  // Know-before-you-go: safety, etiquette, accessibility, costs, crowds. These belong to
  // the first-timer front door, which is where that intent is answered.
  | 'practical'
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
  'bondi-rescue': 'Bondi Rescue',
  history: 'Bondi Beach',
  practical: 'Know before you go',
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
  'bondi-rescue': '/bondi-rescue',
  history: '/bondi-beach',
  practical: '/start-here',
};

export function articleTopic(p: Page): ArticleTopic {
  // Slugs use hyphens, titles use spaces - normalise so a pattern written with spaces
  // matches both. Without this, "how to get to" never matched "how-to-get-to-bondi-beach"
  // and the article fell through to 'general' with no hub and no topical breadcrumb.
  const s = `${p.h1 || ''} ${p.title || ''} ${p.path}`.toLowerCase().replace(/[-_/]+/g, ' ');
  // Word boundaries matter here more than anywhere else in this function, because this is
  // the FIRST test and an unanchored fragment silently steals articles from every topic
  // below it. Two did exactly that: bare `eat` matched "w-eat-her" (so every weather
  // article was filed under Eat & Drink) and bare `pub` matched "pub-lic" (so "public
  // transport" and "can the public swim…" went the same way).
  if (/\beat(s|ing)?\b|caf|coffee|restaurant|brunch|food|dining|drink|\bbars?\b|\bpubs?\b|bakery|gelato|ice cream|breakfast|dinner|nightlife|cocktail|brewery|\bwine\b|totti|speedos|icebergs dining|flavours|off menu/.test(s)) return 'eat-drink';
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
  // The TV series, BEFORE swim - the swim pattern below also matches "bondi rescue", so
  // without this every article about the show filed under Swim and breadcrumbed
  // "Home > Swim > …", even though /bondi-rescue exists as its own hub. Matching the show's
  // full name and not a bare `lifeguard` is deliberate: "Are there lifeguards at Bondi
  // Beach?" and "the lifeguards who ran toward danger" are beach-safety questions and
  // belong under swim, not under a page about a television programme.
  if (/bondi rescue/.test(s)) return 'bondi-rescue';
  if (/swim|snorkel|icebergs|ocean pool|\brip\b|lifeguard|bondi rescue|water temp|water (clean|quality|polluted)|shark|bluebottle|tar ball/.test(s)) return 'swim';
  if (/\bkid|family|children|toddler|pram|playground/.test(s)) return 'family';
  if (/coastal walk|bronte|tamarama|coogee|clovelly|gordons bay/.test(s)) return 'coastal-walk';
  // "how to get to" / "how far is" are the two commonest phrasings of this intent and both
  // previously missed - the pattern only covered the gerund ("getting to").
  if (/transport|\bbus(es)?\b|\btrains?\b|airport|getting (to|around)|how to get (to|around)|how far is|\bferry\b|\bdrive\b|uber|taxi|bondi junction|daylight saving/.test(s)) return 'getting-here';
  if (/weather|temperature|\brain\b|sunrise|sunset|season|best time|\bstorms?\b|winter magic/.test(s)) return 'weather';
  // Itineraries BEFORE things-to-do - plan-my-visit intent (how long / one day / first-timer).
  if (/itinerary|24 hours|one day|half day|day trip|weekend in bondi|first time visitor/.test(s)) return 'itineraries';
  // Know-before-you-go BEFORE things-to-do: safety, etiquette, access, cost and crowding are
  // practical questions, not activities, and belong on the first-timer page.
  if (/safe(ty)?\b|crime|thieves|pickpocket|etiquette|rules|wheelchair|accessib|how much|cost|\bbusy\b|crowd|closed?\b|closures?|drone|lost property|toilets|lockers|shade|umbrella|where to sit|places to sit/.test(s)) return 'practical';
  if (/thing(s)? to do|activities|experience|hidden gem|attraction|market|festival|sculpture|new year|christmas|australia day|anzac|whale|dolphin|golf|metal detect|drummer|muscle beach|\btours?\b|events?\b/.test(s)) return 'things-to-do';
  // Bondi as a subject: history, naming, landmarks, fame, culture.
  if (/histor|heritage|why is bondi|why bondi|famous|pronounce|\bname\b|named|aboriginal|ben buckler|cemetery|man made|the bondi hum|bookstore|film clip|special/.test(s)) return 'history';
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
  const order: ArticleTopic[] = ['things-to-do', 'itineraries', 'swim', 'surfing', 'eat-drink', 'coastal-walk', 'getting-here', 'parking', 'city2surf', 'weather', 'family', 'stay', 'bondi-rescue', 'practical', 'history', 'general'];
  return order.filter((t) => counts.has(t)).map((t) => ({ topic: t, count: counts.get(t)! }));
}
