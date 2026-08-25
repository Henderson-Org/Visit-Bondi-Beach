/**
 * Restaurant-guide curation layer over the comprehensive directory
 * (data/restaurants.ts). This is the richer, near-complete Bondi eating + drinking
 * dataset (200+ verified venues) that powers the searchable /bondi-eat-and-drink hub,
 * the curated "best of" collections, and the individual venue pages.
 *
 * INTEGRITY: selection and copy here are editorial and durable. No volatile facts
 * (hours, prices, phone) are asserted - those defer to each venue's own live source.
 * Every venue in the directory is source-verified with a current `status`.
 */
import collectionBodyData from '@/content/collection-body-overrides.json';
import type { Block, Source, FreshnessClass } from '@/lib/content';
import {
  type Restaurant,
  type VenueType,
  type Precinct,
  type Meal,
  type Suitability,
  type Attribute,
  type Dietary,
  restaurants,
  filterRestaurants,
  byScore,
  PRECINCT_LABEL,
  VENUE_TYPE_LABEL,
} from '@/data/restaurants';

/* --------------------------------- venue page ------------------------------ */

/** A venue earns a standalone, indexable page only when it has real editorial depth. */
export function hasVenuePage(r: Restaurant): boolean {
  return Boolean(r.whyGo && r.whyGo.length > 40 && r.summary);
}

export function venuePageHref(r: Restaurant): string | null {
  return hasVenuePage(r) ? `/bondi-eat-and-drink/venues/${r.id}` : null;
}

export function venuesWithPages(): Restaurant[] {
  return restaurants().filter(hasVenuePage);
}

/**
 * Whether a venue takes bookings - derived purely from verified data (a real booking URL
 * or a sourced "reservations" attribute), never guessed. 'unknown' when we hold no signal,
 * so the page can defer to the venue rather than assert walk-ins. No volatile hours implied.
 */
export function bookingStatus(r: Restaurant): 'reservations' | 'walk-ins' | 'unknown' {
  if (r.bookingUrl || r.attributes.includes('reservations')) return 'reservations';
  if (r.attributes.includes('walk-ins')) return 'walk-ins';
  return 'unknown';
}

/**
 * A venue's founding year IF it's clearly stated in our sourced editorial (a durable fact,
 * not a volatile one). Powers a "serving Bondi since YYYY" institution signal that lets the
 * site treat long-runners as reliable. Returns null when not confidently stated.
 */
const ESTABLISHED_RE = /\b(?:since|established|opened(?: in)?|est\.?|founded(?: in)?|trading since|first opened(?: in)?)\s+(?:in\s+)?((?:19|20)\d{2})\b/i;
export function establishedYear(r: Restaurant): number | null {
  const t = `${r.summary} ${r.whyGo ?? ''} ${r.atmosphere ?? ''}`;
  const m = t.match(ESTABLISHED_RE);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 1900 && y <= 2026 ? y : null;
}

/** External link a card/venue page should surface (own site first, then booking/menu/instagram). */
export function outboundLink(r: Restaurant): { href: string; label: string } | null {
  if (r.website) return { href: r.website, label: 'Visit website' };
  if (r.bookingUrl) return { href: r.bookingUrl, label: 'Book a table' };
  if (r.menuUrl) return { href: r.menuUrl, label: 'View menu' };
  if (r.instagram) return { href: r.instagram, label: 'Instagram' };
  return null;
}

/* ------------------------------ filter options ----------------------------- */

/** Venue types offered as filters, in a sensible visitor order (only those present). */
export const FILTER_TYPES: VenueType[] = ['restaurant', 'cafe', 'bar', 'pub', 'bakery', 'takeaway', 'dessert', 'club-hotel'];
export const FILTER_PRECINCTS: Precinct[] = ['bondi-beach', 'north-bondi', 'campbell-parade', 'bondi-road', 'bondi', 'bondi-junction'];
export const FILTER_MEALS: Meal[] = ['breakfast', 'brunch', 'lunch', 'dinner', 'late-night'];
export const FILTER_SUITABILITY: Suitability[] = ['families', 'couples', 'groups', 'solo', 'celebrations', 'business'];
export const FILTER_ATTRIBUTES: Attribute[] = ['beachfront', 'ocean-views', 'outdoor-seating', 'rooftop', 'sunset', 'romantic', 'lively', 'dog-friendly'];
export const FILTER_DIETARY: Dietary[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal'];

export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: 'Breakfast', brunch: 'Brunch', lunch: 'Lunch', dinner: 'Dinner', 'late-night': 'Late night',
};
export const SUITABILITY_LABEL: Record<Suitability, string> = {
  kids: 'Kids', families: 'Families', couples: 'Couples', groups: 'Groups', solo: 'Solo',
  business: 'Business', celebrations: 'Celebrations', tourists: 'Visitors', locals: 'Locals',
};
export const ATTRIBUTE_LABEL: Record<Attribute, string> = {
  beachfront: 'Beachfront', 'ocean-views': 'Ocean views', 'outdoor-seating': 'Outdoor seating',
  rooftop: 'Rooftop', sunset: 'Sunset', quiet: 'Quiet', lively: 'Lively', romantic: 'Romantic',
  'dog-friendly': 'Dog-friendly', takeaway: 'Takeaway', delivery: 'Delivery',
  reservations: 'Takes bookings', 'walk-ins': 'Walk-ins', byo: 'BYO',
};
export const DIETARY_LABEL: Record<Dietary, string> = {
  vegetarian: 'Vegetarian', vegan: 'Vegan', 'gluten-free': 'Gluten-free',
  'dairy-free': 'Dairy-free', halal: 'Halal', kosher: 'Kosher',
};

/** Compact per-venue facet the client browser filters/sorts on (no card internals needed). */
export interface VenueFacet {
  id: string;
  type: VenueType;
  precinct: Precinct;
  meals: Meal[];
  price: number;
  suitability: Suitability[];
  attributes: Attribute[];
  dietary: Dietary[];
  cuisines: string[];
  score: number;
  hasPage: boolean;
  /** Lowercased haystack for the free-text search box. */
  text: string;
}

export function facetFor(r: Restaurant): VenueFacet {
  return {
    id: r.id,
    type: r.type,
    precinct: r.precinct,
    meals: r.meals,
    price: r.priceBand,
    suitability: r.suitability,
    attributes: r.attributes,
    dietary: r.dietary,
    cuisines: r.cuisines.map((c) => c.toLowerCase()),
    score: r.score ?? 0,
    hasPage: hasVenuePage(r),
    // The searchable haystack. Inlining the full `summary` duplicates text that is also in
    // the server-rendered card beside it, so this looks like an easy byte saving. It is not:
    // truncating it was measured at ~1KB brotli on the whole directory, because the
    // compressor already deduplicates the second copy against the first. The cost would have
    // been real (a word deep in a summary stops being findable), so the full text stays.
    text: `${r.name} ${r.formerName ?? ''} ${r.cuisines.join(' ')} ${PRECINCT_LABEL[r.precinct]} ${r.street ?? ''} ${VENUE_TYPE_LABEL[r.type]} ${r.summary} ${r.bestFor ?? ''}`.toLowerCase(),
  };
}

/** Only offer a filter option when at least one active venue actually has it. */
export function availableTypes(list = restaurants()): VenueType[] {
  return FILTER_TYPES.filter((t) => list.some((r) => r.type === t));
}
export function availablePrecincts(list = restaurants()): Precinct[] {
  return FILTER_PRECINCTS.filter((p) => list.some((r) => r.precinct === p));
}
export function availableMeals(list = restaurants()): Meal[] {
  return FILTER_MEALS.filter((m) => list.some((r) => r.meals.includes(m)));
}
export function availableSuitability(list = restaurants()): Suitability[] {
  return FILTER_SUITABILITY.filter((s) => list.some((r) => r.suitability.includes(s)));
}
export function availableAttributes(list = restaurants()): Attribute[] {
  return FILTER_ATTRIBUTES.filter((a) => list.some((r) => r.attributes.includes(a)));
}
export function availableDietary(list = restaurants()): Dietary[] {
  return FILTER_DIETARY.filter((d) => list.some((r) => r.dietary.includes(d)));
}

/* ------------------------------- collections ------------------------------- */

/**
 * Curated "best of" collections. Each is a predicate over the directory plus editorial
 * framing + SEO metadata. Slugs that already exist on the site (best-restaurants,
 * best-bars, cheap-eats, breakfast-brunch, waterfront-dining, pubs, vegan-vegetarian)
 * are preserved so their ranking equity carries over to the richer lists.
 */
export interface GuideCollection {
  slug: string;
  h1: string;
  kicker: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  /** How the venue set is selected. */
  select: (r: Restaurant) => boolean;
  /** Optional cap so a collection stays curated, not a dump. */
  limit?: number;
  /**
   * 'best-of' = a curated ranked shortlist (the default); 'area' = a precinct landing
   * page that lists everywhere in one part of Bondi. Drives where the hub surfaces it.
   */
  kind?: 'best-of' | 'area';
  /**
   * The search intent this collection is written to own. Two collections sharing an intent
   * are two URLs chasing one query, and the later one is de-indexed. Distinct intents may
   * legitimately share most of their venues ("romantic" vs "best" restaurants), which is
   * why intent — not venue overlap — is the primary duplication test.
   */
  intent?: string;
  /**
   * 'never' keeps the page usable for visitors but out of the index. Use it for a
   * combination that is a genuinely useful filter but not a distinct search intent.
   * Omit to let collectionIndexDecision() judge it on venue count and overlap.
   */
  index?: 'never';
  /** Editorial articles worth surfacing on this collection page (database → article). */
  relatedReads?: { title: string; path: string }[];
}

export const COLLECTIONS: GuideCollection[] = [
  {
    slug: 'best-restaurants-bondi-beach',
    intent: 'restaurants',
    h1: 'The best restaurants in Bondi Beach',
    kicker: 'Best of Bondi',
    intro:
      "The places we'd book first when we want a proper sit-down meal in Bondi - the icons, the sleepers and the ones worth crossing town for, ranked on the food and how well they suit a visit.",
    metaTitle: 'The Best Restaurants in Bondi Beach (2026)',
    metaDescription:
      'A local’s ranked pick of the best restaurants in Bondi Beach - from beachfront icons to neighbourhood sleepers, with what to order and who each suits.',
    select: (r) => r.type === 'restaurant',
    limit: 24,
  },
  {
    slug: 'waterfront-dining-bondi-beach',
    intent: 'waterfront',
    h1: 'Beachfront & ocean-view dining in Bondi',
    kicker: 'With a view',
    intro:
      "Where to eat with the sand in front of you. These are the venues that actually earn the view - whether you want a champagne dinner over the pool or a coffee looking straight down the beach.",
    metaTitle: 'Beachfront & Ocean-View Restaurants in Bondi Beach',
    metaDescription:
      'The best beachfront and ocean-view places to eat and drink in Bondi - which tables really see the water, and what each one is best for.',
    select: (r) => r.attributes.includes('beachfront') || r.attributes.includes('ocean-views'),
  },
  {
    slug: 'breakfast-brunch-bondi-beach',
    intent: 'breakfast',
    h1: 'The best breakfast & brunch in Bondi',
    kicker: 'Morning',
    intro:
      "Bondi does brunch better than almost anywhere in Sydney. Here's where we send people for the first meal of the day - the modern-Australian classics, the coffee specialists and the quiet locals' picks.",
    metaTitle: 'Best Breakfast & Brunch in Bondi Beach',
    metaDescription:
      'Where to eat breakfast and brunch in Bondi Beach, from a local - the cafes and all-day kitchens worth the queue, and the quieter ones that aren’t.',
    select: (r) => (r.meals.includes('breakfast') || r.meals.includes('brunch')) && (r.type === 'cafe' || r.type === 'restaurant'),
    limit: 24,
  },
  {
    slug: 'best-cafes-bondi-beach',
    intent: 'cafes',
    h1: 'The best cafés & coffee in Bondi',
    kicker: 'Coffee',
    intro:
      "The cafes we actually go back to - for the coffee first, then the room, the food and whether there's a table when the beach empties out at 11am.",
    metaTitle: 'The Best Cafés & Coffee in Bondi Beach',
    metaDescription:
      'A local guide to the best cafes and coffee in Bondi Beach - the specialty roasters, the all-day brunch rooms and the under-the-radar locals’ spots.',
    select: (r) => r.type === 'cafe',
    limit: 24,
  },
  {
    slug: 'best-bars-bondi-beach',
    intent: 'bars',
    h1: 'The best bars in Bondi Beach',
    kicker: 'Drinks',
    intro:
      "From sunset wine on the sand to a proper late one, these are the Bondi bars worth planning an evening around - and what each is really like once the beach crowd rolls in.",
    metaTitle: 'The Best Bars in Bondi Beach (2026)',
    metaDescription:
      'Where to drink in Bondi Beach - the wine bars, cocktail rooms and beachfront spots a local rates, with the vibe and best time to go for each.',
    select: (r) => r.type === 'bar' || r.attributes.includes('sunset'),
    limit: 20,
    relatedReads: [
      { title: 'The best wine bars in Bondi', path: '/bondi-blog/best-wine-bars-in-bondi' },
      { title: 'Where to watch live sport in Bondi', path: '/bondi-blog/where-to-watch-sport-in-bondi' },
    ],
  },
  {
    slug: 'cheap-eats-bondi-beach',
    intent: 'cheap-eats',
    h1: 'The best cheap eats in Bondi',
    kicker: 'Under $25',
    intro:
      "You do not have to spend big to eat well in Bondi. These are the tacos, slices, bowls and counter feeds that punch far above their price - most of them a short walk from the sand.",
    metaTitle: 'The Best Cheap Eats in Bondi Beach',
    metaDescription:
      'The best cheap eats in Bondi Beach - a local’s pick of the tacos, pizza, bowls and takeaway that deliver the most for under about $25.',
    select: (r) => r.priceBand <= 2 && (r.type === 'takeaway' || r.type === 'cafe' || r.type === 'bakery' || r.type === 'dessert' || r.diningStyle.includes('fast-casual')),
    limit: 24,
  },
  {
    slug: 'family-friendly-bondi-beach',
    intent: 'family',
    h1: 'The best family-friendly places to eat in Bondi',
    kicker: 'With kids',
    intro:
      "Bondi is an easy place to eat out with children if you know where to go. These are the venues with the space, the menu and the tolerance for a pram and a fussy five-year-old.",
    metaTitle: 'Family-Friendly Restaurants & Cafés in Bondi Beach',
    metaDescription:
      'Where to eat in Bondi Beach with kids - a local’s pick of the family-friendly cafes and restaurants with space, easy menus and a relaxed welcome.',
    select: (r) => r.suitability.includes('families') || r.suitability.includes('kids'),
    limit: 20,
  },
  {
    slug: 'vegan-vegetarian-bondi-beach',
    intent: 'vegan',
    h1: 'The best vegan & vegetarian food in Bondi',
    kicker: 'Plant-based',
    intro:
      "Bondi is one of the best corners of Sydney for eating plant-based. These are the fully vegan kitchens and the omnivore spots that genuinely look after vegetarians - not an afterthought salad in sight.",
    metaTitle: 'The Best Vegan & Vegetarian Restaurants in Bondi',
    metaDescription:
      'Where to eat vegan and vegetarian in Bondi Beach - the dedicated plant-based kitchens and the cafes and restaurants that do it genuinely well.',
    select: (r) => r.dietary.includes('vegan') || r.dietary.includes('vegetarian'),
    limit: 20,
  },
  {
    slug: 'date-night-bondi-beach',
    intent: 'romantic',
    h1: 'The best date-night restaurants in Bondi',
    kicker: 'For two',
    intro:
      "The rooms we'd book for a night that's meant to feel like something - romantic, a little special, and the kind of place where the evening slows down.",
    metaTitle: 'The Best Date-Night Restaurants in Bondi Beach',
    metaDescription:
      'Where to take a date in Bondi Beach - the romantic, special-occasion restaurants a local rates, with the vibe and what to order for each.',
    select: (r) => (r.attributes.includes('romantic') || r.suitability.includes('couples') || r.suitability.includes('celebrations')) && r.type === 'restaurant',
    limit: 18,
  },
  {
    slug: 'pubs-bondi-beach',
    intent: 'pubs',
    h1: 'The best pubs in Bondi',
    kicker: 'Pub',
    intro:
      "The Bondi pubs worth a Sunday afternoon - for the bistro feed, the beer garden or just a schooner within earshot of the surf.",
    metaTitle: 'The Best Pubs in Bondi Beach',
    metaDescription:
      'A local guide to the best pubs in Bondi Beach - the bistros, beer gardens and hotels worth settling into, and what each does best.',
    select: (r) => r.type === 'pub' || r.type === 'club-hotel',
    limit: 16,
    relatedReads: [
      { title: 'Where to watch live sport in Bondi', path: '/bondi-blog/where-to-watch-sport-in-bondi' },
      { title: 'Where to watch the Premier League in Bondi', path: '/bondi-blog/2025/5/25/where-to-watch-english-football-in-bondi-the-best-pubs-and-bars-for-premier-league-fans' },
    ],
  },
  {
    slug: 'bakeries-sweets-bondi-beach',
    intent: 'bakery',
    h1: 'The best bakeries & sweets in Bondi',
    kicker: 'Sweet',
    intro:
      "The croissants, loaves, gelato and after-dinner sugar worth walking for - Bondi's bakeries and dessert spots, ranked on the thing they actually do.",
    metaTitle: 'The Best Bakeries, Gelato & Sweets in Bondi Beach',
    metaDescription:
      'Where to find the best bakeries, pastries, gelato and desserts in Bondi Beach - a local’s pick of what to get and where.',
    select: (r) => r.type === 'bakery' || r.type === 'dessert',
    limit: 18,
  },
  {
    slug: 'late-night-bondi-beach',
    intent: 'late-night',
    h1: 'Late-night eats & drinks in Bondi',
    kicker: 'After dark',
    intro:
      "Where to eat and drink when the sun's long gone - the kitchens that stay open, the bars that run late and the takeaway worth knowing after a big one. Always check the night's hours before you head out.",
    metaTitle: 'Late-Night Eats & Drinks in Bondi Beach',
    metaDescription:
      'Where to eat and drink late in Bondi Beach - a local’s guide to the kitchens, bars and takeaways that keep going after dark.',
    select: (r) => r.meals.includes('late-night') || (r.type === 'bar' && r.meals.includes('dinner')),
    limit: 24,
  },
  {
    slug: 'sunset-rooftop-bondi-beach',
    intent: 'sunset',
    h1: 'The best sunset & rooftop drinks in Bondi',
    kicker: 'Golden hour',
    intro:
      "Bondi faces east, so the magic here is the light on the water rather than a sunset over the sea - these are the rooftops, terraces and west-facing perches where we'd time a drink for golden hour.",
    metaTitle: 'Best Sunset & Rooftop Bars in Bondi Beach',
    metaDescription:
      'Where to catch golden hour with a drink in Bondi - the rooftops, terraces and view bars a local rates for a sunset session.',
    select: (r) => r.attributes.includes('rooftop') || r.attributes.includes('sunset'),
    limit: 16,
  },
  // --- Added for the high-value queries named in the SEO brief. Each is declared with a
  // distinct intent and its own editorial framing; the indexability gate below decides
  // whether it actually reaches the index, so a near-duplicate of an existing collection
  // (e.g. "best coffee" against "best cafés") stays usable but noindex rather than
  // splitting the same intent across two URLs. ---
  {
    slug: 'best-lunch-bondi-beach',
    intent: 'lunch',
    h1: 'Where to have lunch in Bondi',
    kicker: 'Lunch',
    intro:
      "Lunch in Bondi splits two ways: the long, sit-down kind with a view of the water, and the fast, salty kind you eat on a wall with sand on your feet. These are the places we'd pick for either, and they're all open in the middle of the day.",
    metaTitle: 'The Best Lunch Spots in Bondi Beach',
    metaDescription:
      'Where a local goes for lunch in Bondi - long lunches with an ocean view, quick counter feeds and everything in between, ranked.',
    select: (r) => r.meals.includes('lunch'),
    limit: 24,
  },
  {
    slug: 'best-dinner-bondi-beach',
    intent: 'dinner',
    h1: 'Where to have dinner in Bondi',
    kicker: 'Dinner',
    intro:
      "Bondi at night is quieter than the daytime crowds suggest, and better for it. These are the rooms we book for dinner - the special-occasion tables, the reliable neighbourhood standbys and the ones worth the walk up the hill.",
    metaTitle: 'The Best Dinner Spots in Bondi Beach',
    metaDescription:
      'Where to eat dinner in Bondi Beach - a local’s ranked pick of the beachfront rooms, neighbourhood favourites and special-occasion tables.',
    select: (r) => r.meals.includes('dinner'),
    limit: 24,
  },
  {
    slug: 'bondi-restaurants-for-groups',
    intent: 'groups',
    h1: 'Bondi restaurants that work for groups',
    kicker: 'For a group',
    intro:
      "Eating out in a group in Bondi is mostly a logistics problem: who takes a booking, who has a table big enough, and who won't mind a birthday. These are the places that handle it well, from long share tables to pubs with room to spread out.",
    metaTitle: 'Bondi Restaurants for Groups & Big Tables',
    metaDescription:
      'Where to eat in Bondi with a group - venues with big tables, bookings and room to spread out, picked by a local.',
    select: (r) => r.suitability.includes('groups'),
    limit: 20,
  },
  {
    slug: 'restaurants-near-bondi-icebergs',
    intent: 'near-icebergs',
    h1: 'Where to eat near Bondi Icebergs',
    kicker: 'South end',
    intro:
      "The Icebergs end of the beach is the postcard corner, and the eating around it runs from the famous dining room upstairs to the cafés a short walk back up Notts Avenue and along the south end of Campbell Parade. Here's what's actually within a few minutes' walk.",
    metaTitle: 'Where to Eat Near Bondi Icebergs',
    metaDescription:
      'Restaurants, cafés and bars within walking distance of Bondi Icebergs - the south end of the beach, picked by a local.',
    // The south end: the beachfront precinct plus anything explicitly beachfront/ocean-view.
    // Kept to a walkable definition rather than a radius we cannot verify.
    select: (r) =>
      (r.precinct === 'bondi-beach' || r.precinct === 'campbell-parade') &&
      (r.attributes.includes('beachfront') || r.attributes.includes('ocean-views')),
    limit: 20,
  },
  {
    slug: 'best-coffee-bondi',
    intent: 'cafes',
    h1: 'Where to find the best coffee in Bondi',
    kicker: 'Coffee',
    intro:
      "Bondi takes its coffee seriously enough that the queue outside a window at 7am is a normal sight. These are the roasters, windows and cafés we actually walk to.",
    metaTitle: 'The Best Coffee in Bondi Beach',
    metaDescription:
      'Where to get the best coffee in Bondi - the specialty roasters, coffee windows and cafés a local rates.',
    select: (r) => r.type === 'cafe',
    limit: 20,
  },
  // --- Area (precinct) landing pages: everywhere to eat in one pocket of Bondi. ---
  {
    slug: 'north-bondi',
    intent: 'area-north-bondi',
    kind: 'area',
    h1: 'Where to eat & drink in North Bondi',
    kicker: 'North Bondi',
    intro:
      "The quieter, more local end of the beach - up around Gould Street, Blair Street and Ramsgate Avenue. North Bondi is where the neighbourhood actually eats: proper coffee, all-day cafés, low-key dinners and the RSL with the best cheap view in Sydney. Here's everywhere worth knowing.",
    metaTitle: 'Where to Eat & Drink in North Bondi',
    metaDescription:
      'A local’s guide to eating and drinking in North Bondi - the cafés, restaurants, bars and takeaways around Gould Street and the quiet north end.',
    select: (r) => r.precinct === 'north-bondi',
  },
  {
    slug: 'campbell-parade',
    intent: 'area-campbell-parade',
    kind: 'area',
    h1: 'Where to eat & drink on Campbell Parade',
    kicker: 'Campbell Parade',
    intro:
      "The beachfront strip - the row facing the sand where the views, the crowds and the icons are. Campbell Parade runs from the buzzy south end up to North Bondi, taking in beachfront dining, gelato, tacos and the big-name rooms. Everywhere along the front, in one place.",
    metaTitle: 'Where to Eat & Drink on Campbell Parade, Bondi',
    metaDescription:
      'Everywhere to eat and drink along Campbell Parade, Bondi Beach - the beachfront restaurants, cafés, bars and gelato facing the sand.',
    select: (r) => r.precinct === 'campbell-parade',
  },
  {
    slug: 'bondi-road',
    intent: 'area-bondi-road',
    kind: 'area',
    h1: 'Where to eat & drink on Bondi Road',
    kicker: 'Bondi Road',
    intro:
      "The locals' road up the hill from the beach - Bondi Road is where the neighbourhood does its everyday eating: the pub, the fishmonger, the cake shop, Thai and Indian for a Tuesday, and a run of good cafés. Less scene, more substance. Here's the lot.",
    metaTitle: 'Where to Eat & Drink on Bondi Road',
    metaDescription:
      'A local’s guide to eating and drinking on Bondi Road - the pubs, cafés, bakeries and neighbourhood restaurants up the hill from the beach.',
    select: (r) => r.precinct === 'bondi-road',
  },
];

/* ---------------------- collection editorial bodies ------------------------ */

/**
 * First-person editorial migrated onto a collection page when a competing article was
 * consolidated into it. This is what makes the consolidation additive: the surviving URL
 * gains the writing instead of the site losing it, so one page carries both the ranked
 * directory and the local voice.
 *
 * Compiled from content/collection-bodies/*.json by scripts/build-bodies.mjs (same block
 * validation as article bodies).
 */
export interface CollectionBody {
  blocks: Block[];
  wordCount?: number;
  sources?: Source[];
  lastReviewed?: string;
  freshnessClass?: FreshnessClass;
  checkType?: 'local' | 'desk';
}

const COLLECTION_BODIES = collectionBodyData as unknown as Record<string, CollectionBody>;

// The build script cannot import this registry to validate slugs, so assert here: a
// collection body whose slug does not exist would silently render nothing, which is
// exactly the kind of failure that hides for months. Fail the build instead.
{
  const known = new Set(COLLECTIONS.map((c) => c.slug));
  const unknown = Object.keys(COLLECTION_BODIES).filter((s) => !known.has(s));
  if (unknown.length > 0) {
    throw new Error(
      `content/collection-bodies: no such collection slug(s): ${unknown.join(', ')}. ` +
      `Known slugs: ${[...known].sort().join(', ')}`,
    );
  }
}

export function collectionBody(slug: string): CollectionBody | undefined {
  return COLLECTION_BODIES[slug];
}

export function getCollection(slug: string): GuideCollection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
export function collectionSlugs(): string[] {
  return COLLECTIONS.map((c) => c.slug);
}
/** Curated best-of collections (for the hub's "best-of guides" grid). */
export function bestOfCollections(): GuideCollection[] {
  return COLLECTIONS.filter((c) => c.kind !== 'area');
}
/** Precinct landing pages (for the hub's "eat by area" section). */
export function areaCollections(): GuideCollection[] {
  return COLLECTIONS.filter((c) => c.kind === 'area');
}
/** The area landing page for a precinct, if one exists. */
const PRECINCT_PAGE: Partial<Record<Precinct, string>> = {
  'north-bondi': '/bondi-eat-and-drink/north-bondi',
  'campbell-parade': '/bondi-eat-and-drink/campbell-parade',
  'bondi-road': '/bondi-eat-and-drink/bondi-road',
};
export function areaPageFor(precinct: Precinct): string | null {
  return PRECINCT_PAGE[precinct] ?? null;
}

/** The ranked venue set for a collection (score desc), respecting its optional cap. */
export function venuesForCollection(c: GuideCollection): Restaurant[] {
  const picked = restaurants().filter(c.select).sort(byScore);
  return c.limit ? picked.slice(0, c.limit) : picked;
}

/* ------------------------- indexability of a collection -------------------------- *
 *
 * A filter combination is easy to generate and easy to over-generate. The failure mode
 * of programmatic SEO is not "too few pages", it is a long tail of near-identical thin
 * lists that dilute the pages which deserve to rank. So a collection has to EARN its
 * place in the index; the ones that do not still render for visitors, but noindex.
 *
 * Note on what is NOT in the gate: search demand. The site holds no keyword-level data
 * (content/search-demand.json is per-URL Search Console data, not per-query), so a
 * demand threshold here would be a number we made up. Demand is therefore an editorial
 * judgement made when a collection is added — see ACTION REQUIRED in the handover — and
 * the gate enforces only what can actually be verified from the data.
 */

/** Fewer than this many venues and the page is a list too short to beat the directory. */
export const MIN_INDEXABLE_VENUES = 8;
/**
 * Overlap above which two collections with DIFFERENT declared intents are treated as the
 * same page anyway. Set high on purpose. Venue overlap alone cannot detect cannibalisation:
 * "romantic restaurants in Bondi" and "the best restaurants in Bondi" share most of their
 * venues (the good rooms are often the romantic ones) yet are different queries with
 * different results pages, and de-indexing one would lose a query the site should own.
 * Same-intent collisions are caught by the `intent` rule instead, which is the accurate
 * test; this threshold only catches sets that are effectively identical.
 */
export const MAX_COLLECTION_OVERLAP = 0.9;

export type IndexDecision = {
  indexable: boolean;
  /** Why, in one line — surfaced by scripts/seo-qa.mjs so the decision is auditable. */
  reason: string;
};

function overlap(a: Restaurant[], b: Restaurant[]): number {
  if (!a.length || !b.length) return 0;
  const bIds = new Set(b.map((r) => r.id));
  const shared = a.filter((r) => bIds.has(r.id)).length;
  return shared / new Set([...a.map((r) => r.id), ...bIds]).size;
}

/**
 * Whether a collection earns an indexable landing page.
 *
 * Evaluated in declaration order, so an earlier collection keeps the index slot and a
 * later near-duplicate is the one that yields — which makes the outcome deterministic
 * rather than dependent on venue counts that shift as the directory changes.
 */
export function collectionIndexDecision(c: GuideCollection): IndexDecision {
  if (c.index === 'never') {
    return { indexable: false, reason: 'explicitly excluded from the index' };
  }

  const venues = venuesForCollection(c);
  if (venues.length < MIN_INDEXABLE_VENUES) {
    return {
      indexable: false,
      reason: `only ${venues.length} qualifying venue(s), below the ${MIN_INDEXABLE_VENUES} needed to be worth indexing`,
    };
  }

  // Area pages are precinct-exclusive by construction, so they cannot duplicate each
  // other and are not compared against the best-of lists (a precinct page and a "best
  // cafés" page answer different questions even when they share venues).
  if (c.kind !== 'area') {
    for (const other of COLLECTIONS) {
      if (other.slug === c.slug) break; // only compare against earlier collections
      if (other.kind === 'area' || other.index === 'never') continue;

      // Declared same intent = two URLs chasing one query. The earlier collection keeps
      // the index slot, so the outcome is deterministic rather than dependent on venue
      // counts that shift as the directory changes.
      if (c.intent && other.intent && c.intent === other.intent) {
        return {
          indexable: false,
          reason: `same declared intent ("${c.intent}") as /${other.slug}, which already owns that query`,
        };
      }

      const o = overlap(venues, venuesForCollection(other));
      if (o > MAX_COLLECTION_OVERLAP) {
        return {
          indexable: false,
          reason: `${Math.round(o * 100)}% of its venues are already on /${other.slug} — effectively the same list`,
        };
      }
    }
  }

  return { indexable: true, reason: `${venues.length} venues, distinct from the other collections` };
}

export function isCollectionIndexable(c: GuideCollection): boolean {
  return collectionIndexDecision(c).indexable;
}

/** Slugs that should appear in the sitemap (indexable collections only). */
export function indexableCollectionSlugs(): string[] {
  return COLLECTIONS.filter(isCollectionIndexable).map((c) => c.slug);
}

/**
 * The collections a venue actually appears on, for the entity → intent-page up-link.
 *
 * This closes the other half of the hub-and-spoke: collections already link down to
 * venues, but a venue page had no curated link back up, so ~163 entity pages sat at the
 * bottom of the graph passing nothing to the pages meant to rank. Membership is computed
 * from the same `venuesForCollection` the collection page renders, so a venue can never
 * advertise a list it is not actually on (a cap can exclude it even when the predicate
 * matches).
 *
 * Only indexable collections are returned — pointing at noindex pages would spend the
 * venue's outbound equity on URLs we have asked Google to ignore.
 */
export function collectionsForVenue(r: Restaurant): GuideCollection[] {
  return COLLECTIONS.filter(
    (c) => isCollectionIndexable(c) && venuesForCollection(c).some((v) => v.id === r.id),
  );
}

/* --------------------------------- labels ---------------------------------- */

export { PRECINCT_LABEL, VENUE_TYPE_LABEL };

/** A short "X in Precinct" descriptor used on cards and pages. */
export function venueTypeInPrecinct(r: Restaurant): string {
  return `${VENUE_TYPE_LABEL[r.type]} in ${PRECINCT_LABEL[r.precinct]}`;
}

export type { Restaurant };
export { filterRestaurants, byScore, restaurants };
