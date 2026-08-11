/**
 * Restaurant-guide curation layer over the comprehensive directory
 * (data/restaurants.ts). This is the richer, near-complete Bondi eating + drinking
 * dataset (200+ verified venues) that powers the searchable /bondi-eat-and-drink hub,
 * the curated "best of" collections, and the individual venue pages.
 *
 * INTEGRITY: selection and copy here are editorial and durable. No volatile facts
 * (hours, prices, phone) are asserted — those defer to each venue's own live source.
 * Every venue in the directory is source-verified with a current `status`.
 */
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
  /** Editorial articles worth surfacing on this collection page (database → article). */
  relatedReads?: { title: string; path: string }[];
}

export const COLLECTIONS: GuideCollection[] = [
  {
    slug: 'best-restaurants-bondi-beach',
    h1: 'The best restaurants in Bondi Beach',
    kicker: 'Best of Bondi',
    intro:
      "The places we'd book first when we want a proper sit-down meal in Bondi — the icons, the sleepers and the ones worth crossing town for, ranked on the food and how well they suit a visit.",
    metaTitle: 'The Best Restaurants in Bondi Beach (2026)',
    metaDescription:
      'A local’s ranked pick of the best restaurants in Bondi Beach — from beachfront icons to neighbourhood sleepers, with what to order and who each suits.',
    select: (r) => r.type === 'restaurant',
    limit: 24,
  },
  {
    slug: 'waterfront-dining-bondi-beach',
    h1: 'Beachfront & ocean-view dining in Bondi',
    kicker: 'With a view',
    intro:
      "Where to eat with the sand in front of you. These are the venues that actually earn the view — whether you want a champagne dinner over the pool or a coffee looking straight down the beach.",
    metaTitle: 'Beachfront & Ocean-View Restaurants in Bondi Beach',
    metaDescription:
      'The best beachfront and ocean-view places to eat and drink in Bondi — which tables really see the water, and what each one is best for.',
    select: (r) => r.attributes.includes('beachfront') || r.attributes.includes('ocean-views'),
  },
  {
    slug: 'breakfast-brunch-bondi-beach',
    h1: 'The best breakfast & brunch in Bondi',
    kicker: 'Morning',
    intro:
      "Bondi does brunch better than almost anywhere in Sydney. Here's where we send people for the first meal of the day — the modern-Australian classics, the coffee specialists and the quiet locals' picks.",
    metaTitle: 'Best Breakfast & Brunch in Bondi Beach',
    metaDescription:
      'Where to eat breakfast and brunch in Bondi Beach, from a local — the cafes and all-day kitchens worth the queue, and the quieter ones that aren’t.',
    select: (r) => (r.meals.includes('breakfast') || r.meals.includes('brunch')) && (r.type === 'cafe' || r.type === 'restaurant'),
    limit: 24,
  },
  {
    slug: 'best-cafes-bondi-beach',
    h1: 'The best cafés & coffee in Bondi',
    kicker: 'Coffee',
    intro:
      "The cafes we actually go back to — for the coffee first, then the room, the food and whether there's a table when the beach empties out at 11am.",
    metaTitle: 'The Best Cafés & Coffee in Bondi Beach',
    metaDescription:
      'A local guide to the best cafes and coffee in Bondi Beach — the specialty roasters, the all-day brunch rooms and the under-the-radar locals’ spots.',
    select: (r) => r.type === 'cafe',
    limit: 24,
  },
  {
    slug: 'best-bars-bondi-beach',
    h1: 'The best bars in Bondi Beach',
    kicker: 'Drinks',
    intro:
      "From sunset wine on the sand to a proper late one, these are the Bondi bars worth planning an evening around — and what each is really like once the beach crowd rolls in.",
    metaTitle: 'The Best Bars in Bondi Beach (2026)',
    metaDescription:
      'Where to drink in Bondi Beach — the wine bars, cocktail rooms and beachfront spots a local rates, with the vibe and best time to go for each.',
    select: (r) => r.type === 'bar' || r.attributes.includes('sunset'),
    limit: 20,
    relatedReads: [
      { title: 'The best wine bars in Bondi', path: '/bondi-blog/best-wine-bars-in-bondi' },
      { title: 'Where to watch live sport in Bondi', path: '/bondi-blog/where-to-watch-sport-in-bondi' },
    ],
  },
  {
    slug: 'cheap-eats-bondi-beach',
    h1: 'The best cheap eats in Bondi',
    kicker: 'Under $25',
    intro:
      "You do not have to spend big to eat well in Bondi. These are the tacos, slices, bowls and counter feeds that punch far above their price — most of them a short walk from the sand.",
    metaTitle: 'The Best Cheap Eats in Bondi Beach',
    metaDescription:
      'The best cheap eats in Bondi Beach — a local’s pick of the tacos, pizza, bowls and takeaway that deliver the most for under about $25.',
    select: (r) => r.priceBand <= 2 && (r.type === 'takeaway' || r.type === 'cafe' || r.type === 'bakery' || r.type === 'dessert' || r.diningStyle.includes('fast-casual')),
    limit: 24,
  },
  {
    slug: 'family-friendly-bondi-beach',
    h1: 'The best family-friendly places to eat in Bondi',
    kicker: 'With kids',
    intro:
      "Bondi is an easy place to eat out with children if you know where to go. These are the venues with the space, the menu and the tolerance for a pram and a fussy five-year-old.",
    metaTitle: 'Family-Friendly Restaurants & Cafés in Bondi Beach',
    metaDescription:
      'Where to eat in Bondi Beach with kids — a local’s pick of the family-friendly cafes and restaurants with space, easy menus and a relaxed welcome.',
    select: (r) => r.suitability.includes('families') || r.suitability.includes('kids'),
    limit: 20,
  },
  {
    slug: 'vegan-vegetarian-bondi-beach',
    h1: 'The best vegan & vegetarian food in Bondi',
    kicker: 'Plant-based',
    intro:
      "Bondi is one of the best corners of Sydney for eating plant-based. These are the fully vegan kitchens and the omnivore spots that genuinely look after vegetarians — not an afterthought salad in sight.",
    metaTitle: 'The Best Vegan & Vegetarian Restaurants in Bondi',
    metaDescription:
      'Where to eat vegan and vegetarian in Bondi Beach — the dedicated plant-based kitchens and the cafes and restaurants that do it genuinely well.',
    select: (r) => r.dietary.includes('vegan') || r.dietary.includes('vegetarian'),
    limit: 20,
  },
  {
    slug: 'date-night-bondi-beach',
    h1: 'The best date-night restaurants in Bondi',
    kicker: 'For two',
    intro:
      "The rooms we'd book for a night that's meant to feel like something — romantic, a little special, and the kind of place where the evening slows down.",
    metaTitle: 'The Best Date-Night Restaurants in Bondi Beach',
    metaDescription:
      'Where to take a date in Bondi Beach — the romantic, special-occasion restaurants a local rates, with the vibe and what to order for each.',
    select: (r) => (r.attributes.includes('romantic') || r.suitability.includes('couples') || r.suitability.includes('celebrations')) && r.type === 'restaurant',
    limit: 18,
  },
  {
    slug: 'pubs-bondi-beach',
    h1: 'The best pubs in Bondi',
    kicker: 'Pub',
    intro:
      "The Bondi pubs worth a Sunday afternoon — for the bistro feed, the beer garden or just a schooner within earshot of the surf.",
    metaTitle: 'The Best Pubs in Bondi Beach',
    metaDescription:
      'A local guide to the best pubs in Bondi Beach — the bistros, beer gardens and hotels worth settling into, and what each does best.',
    select: (r) => r.type === 'pub' || r.type === 'club-hotel',
    limit: 16,
    relatedReads: [
      { title: 'Where to watch live sport in Bondi', path: '/bondi-blog/where-to-watch-sport-in-bondi' },
      { title: 'Where to watch the Premier League in Bondi', path: '/bondi-blog/2025/5/25/where-to-watch-english-football-in-bondi-the-best-pubs-and-bars-for-premier-league-fans' },
    ],
  },
  {
    slug: 'bakeries-sweets-bondi-beach',
    h1: 'The best bakeries & sweets in Bondi',
    kicker: 'Sweet',
    intro:
      "The croissants, loaves, gelato and after-dinner sugar worth walking for — Bondi's bakeries and dessert spots, ranked on the thing they actually do.",
    metaTitle: 'The Best Bakeries, Gelato & Sweets in Bondi Beach',
    metaDescription:
      'Where to find the best bakeries, pastries, gelato and desserts in Bondi Beach — a local’s pick of what to get and where.',
    select: (r) => r.type === 'bakery' || r.type === 'dessert',
    limit: 18,
  },
  {
    slug: 'late-night-bondi-beach',
    h1: 'Late-night eats & drinks in Bondi',
    kicker: 'After dark',
    intro:
      "Where to eat and drink when the sun's long gone — the kitchens that stay open, the bars that run late and the takeaway worth knowing after a big one. Always check the night's hours before you head out.",
    metaTitle: 'Late-Night Eats & Drinks in Bondi Beach',
    metaDescription:
      'Where to eat and drink late in Bondi Beach — a local’s guide to the kitchens, bars and takeaways that keep going after dark.',
    select: (r) => r.meals.includes('late-night') || (r.type === 'bar' && r.meals.includes('dinner')),
    limit: 24,
  },
  {
    slug: 'sunset-rooftop-bondi-beach',
    h1: 'The best sunset & rooftop drinks in Bondi',
    kicker: 'Golden hour',
    intro:
      "Bondi faces east, so the magic here is the light on the water rather than a sunset over the sea — these are the rooftops, terraces and west-facing perches where we'd time a drink for golden hour.",
    metaTitle: 'Best Sunset & Rooftop Bars in Bondi Beach',
    metaDescription:
      'Where to catch golden hour with a drink in Bondi — the rooftops, terraces and view bars a local rates for a sunset session.',
    select: (r) => r.attributes.includes('rooftop') || r.attributes.includes('sunset'),
    limit: 16,
  },
  // --- Area (precinct) landing pages: everywhere to eat in one pocket of Bondi. ---
  {
    slug: 'north-bondi',
    kind: 'area',
    h1: 'Where to eat & drink in North Bondi',
    kicker: 'North Bondi',
    intro:
      "The quieter, more local end of the beach — up around Gould Street, Blair Street and Ramsgate Avenue. North Bondi is where the neighbourhood actually eats: proper coffee, all-day cafés, low-key dinners and the RSL with the best cheap view in Sydney. Here's everywhere worth knowing.",
    metaTitle: 'Where to Eat & Drink in North Bondi',
    metaDescription:
      'A local’s guide to eating and drinking in North Bondi — the cafés, restaurants, bars and takeaways around Gould Street and the quiet north end.',
    select: (r) => r.precinct === 'north-bondi',
  },
  {
    slug: 'campbell-parade',
    kind: 'area',
    h1: 'Where to eat & drink on Campbell Parade',
    kicker: 'Campbell Parade',
    intro:
      "The beachfront strip — the row facing the sand where the views, the crowds and the icons are. Campbell Parade runs from the buzzy south end up to North Bondi, taking in beachfront dining, gelato, tacos and the big-name rooms. Everywhere along the front, in one place.",
    metaTitle: 'Where to Eat & Drink on Campbell Parade, Bondi',
    metaDescription:
      'Everywhere to eat and drink along Campbell Parade, Bondi Beach — the beachfront restaurants, cafés, bars and gelato facing the sand.',
    select: (r) => r.precinct === 'campbell-parade',
  },
  {
    slug: 'bondi-road',
    kind: 'area',
    h1: 'Where to eat & drink on Bondi Road',
    kicker: 'Bondi Road',
    intro:
      "The locals' road up the hill from the beach — Bondi Road is where the neighbourhood does its everyday eating: the pub, the fishmonger, the cake shop, Thai and Indian for a Tuesday, and a run of good cafés. Less scene, more substance. Here's the lot.",
    metaTitle: 'Where to Eat & Drink on Bondi Road',
    metaDescription:
      'A local’s guide to eating and drinking on Bondi Road — the pubs, cafés, bakeries and neighbourhood restaurants up the hill from the beach.',
    select: (r) => r.precinct === 'bondi-road',
  },
];

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

/* --------------------------------- labels ---------------------------------- */

export { PRECINCT_LABEL, VENUE_TYPE_LABEL };

/** A short "X in Precinct" descriptor used on cards and pages. */
export function venueTypeInPrecinct(r: Restaurant): string {
  return `${VENUE_TYPE_LABEL[r.type]} in ${PRECINCT_LABEL[r.precinct]}`;
}

export type { Restaurant };
export { filterRestaurants, byScore, restaurants };
