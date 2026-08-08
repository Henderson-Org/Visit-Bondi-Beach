/**
 * Conditions-driven recommendations.
 *
 * Turns today's normalized Conditions into a short contextual nudge plus a small,
 * CURATED set of real on-site guides — e.g. "it's wet today → indoor things to do",
 * "small clean surf → relaxed swim spots". Deterministic (no LLM), grounded only in
 * pages we know exist (curated below), so it never invents a recommendation.
 *
 * This is the first step of using weather/surf as an input to the wider site: the
 * same `Conditions` model can later feed a fuller recommendation engine.
 */
import type { Conditions } from './types';
import { isWetCode } from './wmo';

export type RecommendationCategory =
  | 'wet' | 'cold' | 'great-outdoors' | 'good-surf' | 'small-surf' | 'default';

export interface RecommendedLink {
  path: string;
  title: string;
  blurb: string;
}
export interface Recommendation {
  category: RecommendationCategory;
  message: string;
  links: RecommendedLink[];
}

// Curated links, keyed for reuse across buckets. Paths are real, indexable pages.
const L = {
  indoor: { path: '/bondi-blog/2025/5/23/rain-or-shine-7-must-do-indoor-activities-in-bondi-beach-on-a-rainy-day', title: 'Indoor things to do', blurb: '7 rainy-day activities in Bondi' },
  eatDrink: { path: '/bondi-eat-and-drink', title: 'Eat & drink', blurb: 'Where the locals go' },
  bondiRescue: { path: '/bondi-rescue', title: 'Bondi Rescue', blurb: 'The lifeguards and the show' },
  thingsToDo: { path: '/things-to-do-in-bondi', title: 'Things to do', blurb: 'The essentials, ranked' },
  coastalWalk: { path: '/bondi-coastal-walk', title: 'Coastal walk', blurb: 'Bondi to Coogee' },
  swim: { path: '/where-to-swim-at-bondi-beach', title: 'Where to swim', blurb: 'Best spots for a dip' },
  withKids: { path: '/bondi-with-kids', title: 'With kids', blurb: 'Family-friendly Bondi' },
  brontePool: { path: '/bondi-blog/2023/11/16/insiders-guide-to-the-bronte-ocean-pool', title: 'Bronte ocean pool', blurb: 'Free saltwater baths' },
  icebergs: { path: '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool', title: 'Bondi Icebergs pool', blurb: 'Can anyone swim there?' },
  weather: { path: '/bondi-weather', title: 'Best time to visit', blurb: 'Bondi through the seasons' },
} as const;

const BUCKETS: Record<RecommendationCategory, { message: string; links: RecommendedLink[] }> = {
  wet: {
    message: "It's looking wet in Bondi today — here's where to head indoors.",
    links: [L.indoor, L.eatDrink, L.bondiRescue],
  },
  cold: {
    message: 'A cooler one today — ease into Bondi the cosy way.',
    links: [L.eatDrink, L.indoor, L.weather],
  },
  'great-outdoors': {
    message: 'A cracking Bondi day — make the most of it outside.',
    links: [L.thingsToDo, L.coastalWalk, L.swim, L.withKids],
  },
  'good-surf': {
    message: "There's some swell about today — a good day to be near the water.",
    links: [L.swim, L.coastalWalk, L.thingsToDo],
  },
  'small-surf': {
    message: 'Small, gentle surf today — a relaxed day for a swim.',
    links: [L.swim, L.brontePool, L.icebergs, L.withKids],
  },
  default: {
    message: 'Whatever today brings, here are some good places to start.',
    links: [L.thingsToDo, L.swim, L.eatDrink, L.coastalWalk],
  },
};

/** Choose the single most relevant category for today (priority-ordered). */
export function pickCategory(c: Conditions): RecommendationCategory {
  const rainHigh = (c.today?.rainChancePct ?? 0) >= 50;
  const wetNow = isWetCode(c.current?.weather?.code) || isWetCode(c.today?.weather?.code);
  if (rainHigh || wetNow) return 'wet';

  const maxT = c.today?.maxTempC ?? c.current?.temperatureC ?? null;
  if (maxT != null && maxT < 16) return 'cold';

  const code = c.today?.weather?.code ?? c.current?.weather?.code ?? 99;
  const clear = code <= 1;
  if (clear && maxT != null && maxT >= 22 && (c.today?.rainChancePct ?? 0) < 30) return 'great-outdoors';

  if (c.surf) {
    if (c.summary.suitability === 'moderate' || c.summary.suitability === 'experienced') return 'good-surf';
    if (c.summary.suitability === 'beginner') return 'small-surf';
  }
  return 'default';
}

export function recommendFromConditions(c: Conditions): Recommendation {
  const category = pickCategory(c);
  const bucket = BUCKETS[category];
  return { category, message: bucket.message, links: bucket.links };
}
