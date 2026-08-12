/**
 * Canonical Bondi restaurant directory - the structured source of truth behind the
 * searchable/filterable Eat & Drink product and every "best of" collection.
 *
 * INTEGRITY (non-negotiable, same bar as the rest of the site):
 *  - Every venue is real and verified against ≥1 source; `status` reflects current trading.
 *    Closed/relocated venues are marked, never shown as active.
 *  - Structured fields are durable facts (type, precinct, cuisine, meals) - NOT volatile
 *    ones. We deliberately do NOT store opening hours or phone numbers as fixed facts; the
 *    live source (official site / Google) owns those. `priceBand` is an editorial estimate.
 *  - Editorial fields are first-person Visit Bondi Beach JUDGEMENT, never fabricated
 *    eyewitness ("we'd choose this for…", never "we tried the barramundi").
 *  - `dietary` flags (esp. halal/kosher) are set ONLY where a source genuinely evidences them.
 *
 * Data lives in restaurants.json (machine-merged from research by scripts/merge-venues.mjs);
 * this module adds the types + selectors used across the site.
 */
import restaurantsData from './restaurants.json';

export type Precinct = 'bondi-beach' | 'north-bondi' | 'bondi' | 'campbell-parade' | 'bondi-road' | 'bondi-junction';
export type VenueType = 'cafe' | 'restaurant' | 'bar' | 'pub' | 'bakery' | 'takeaway' | 'dessert' | 'club-hotel';
export type Meal = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'late-night';
export type DiningStyle = 'cafe' | 'casual' | 'fast-casual' | 'fine-dining' | 'beachfront' | 'takeaway' | 'bar' | 'bakery' | 'food-court' | 'market';
export type Suitability = 'kids' | 'families' | 'couples' | 'groups' | 'solo' | 'business' | 'celebrations' | 'tourists' | 'locals';
export type Dietary = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'halal' | 'kosher';
export type Attribute =
  | 'beachfront' | 'ocean-views' | 'outdoor-seating' | 'rooftop' | 'sunset' | 'quiet' | 'lively'
  | 'romantic' | 'dog-friendly' | 'takeaway' | 'delivery' | 'reservations' | 'walk-ins' | 'byo';
export type VenueStatus = 'open' | 'opening-soon' | 'temporarily-closed' | 'permanently-closed' | 'moved' | 'renamed';

export const PRECINCT_LABEL: Record<Precinct, string> = {
  'bondi-beach': 'Bondi Beach', 'north-bondi': 'North Bondi', bondi: 'Bondi',
  'campbell-parade': 'Campbell Parade', 'bondi-road': 'Bondi Road', 'bondi-junction': 'Bondi Junction',
};
export const VENUE_TYPE_LABEL: Record<VenueType, string> = {
  cafe: 'Café', restaurant: 'Restaurant', bar: 'Bar', pub: 'Pub', bakery: 'Bakery',
  takeaway: 'Takeaway', dessert: 'Dessert', 'club-hotel': 'Club / Hotel',
};
export const PRICE_LABEL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

/** Editorial ranking signals (0–10), used to surface the most useful options per context. */
export interface RankingSignals {
  foodScore?: number;
  localReputation?: number;
  uniqueness?: number;
  value?: number;
  viewScore?: number;
  visitorUsefulness?: number;
  kidFriendliness?: number;
}

export interface Restaurant {
  id: string;              // stable slug
  name: string;
  formerName?: string;
  status: VenueStatus;
  type: VenueType;
  precinct: Precinct;
  street?: string;
  address?: string;
  cuisines: string[];      // primary first
  meals: Meal[];
  priceBand: 1 | 2 | 3 | 4;
  diningStyle: DiningStyle[];
  suitability: Suitability[];
  dietary: Dietary[];      // verified only
  attributes: Attribute[];
  // Practical links (real URLs only; NO fixed hours/phone here - those are volatile).
  website?: string;
  bookingUrl?: string;
  instagram?: string;
  menuUrl?: string;
  // Editorial (first-person judgement, never fake eyewitness).
  summary: string;
  whyGo?: string;
  bestFor?: string;
  whatToOrder?: string;
  atmosphere?: string;
  localTip?: string;
  tradeOff?: string;
  ranking?: RankingSignals;
  /** Composite 0–10 used for default ordering within a context (computed at merge time). */
  score?: number;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  lastVerifiedAt: string;  // YYYY-MM-DD
}

const ALL: Restaurant[] = restaurantsData as Restaurant[];

/** Active venues only (what the public directory shows). */
export function restaurants(): Restaurant[] {
  return ALL.filter((r) => r.status === 'open' || r.status === 'opening-soon');
}
export function getRestaurant(id: string): Restaurant | undefined {
  return ALL.find((r) => r.id === id);
}
export function restaurantIds(): string[] {
  return restaurants().map((r) => r.id);
}

/* --------------------------------- filtering -------------------------------- */

export interface RestaurantFilter {
  q?: string;
  type?: VenueType[];
  precinct?: Precinct[];
  cuisine?: string[];
  meal?: Meal[];
  price?: number[];
  diningStyle?: DiningStyle[];
  suitability?: Suitability[];
  dietary?: Dietary[];
  attribute?: Attribute[];
}

const hay = (r: Restaurant) =>
  `${r.name} ${r.formerName ?? ''} ${r.cuisines.join(' ')} ${r.precinct} ${r.street ?? ''} ${r.type} ${r.summary} ${r.bestFor ?? ''}`.toLowerCase();

export function filterRestaurants(f: RestaurantFilter, list: Restaurant[] = restaurants()): Restaurant[] {
  const some = <T,>(sel: T[] | undefined, has: (t: T) => boolean) => !sel || sel.length === 0 || sel.some(has);
  const q = f.q?.trim().toLowerCase();
  return list.filter((r) =>
    (!q || hay(r).includes(q)) &&
    some(f.type, (t) => r.type === t) &&
    some(f.precinct, (p) => r.precinct === p) &&
    some(f.cuisine, (c) => r.cuisines.map((x) => x.toLowerCase()).some((x) => x.includes(c.toLowerCase()))) &&
    some(f.meal, (m) => r.meals.includes(m)) &&
    some(f.price, (p) => r.priceBand === p) &&
    some(f.diningStyle, (d) => r.diningStyle.includes(d)) &&
    some(f.suitability, (s) => r.suitability.includes(s)) &&
    some(f.dietary, (d) => r.dietary.includes(d)) &&
    some(f.attribute, (a) => r.attributes.includes(a)),
  );
}

/** Default ordering: composite score desc, then local reputation, then name. */
export function byScore(a: Restaurant, b: Restaurant): number {
  return (b.score ?? 0) - (a.score ?? 0) || (b.ranking?.localReputation ?? 0) - (a.ranking?.localReputation ?? 0) || a.name.localeCompare(b.name);
}

/* --------------------------- distinct facet values -------------------------- */

export function cuisineFacets(): { value: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of restaurants()) for (const c of r.cuisines) m.set(c, (m.get(c) ?? 0) + 1);
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}
