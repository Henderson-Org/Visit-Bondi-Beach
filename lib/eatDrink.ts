/**
 * Eat & Drink engine — the curation layer over the single venue source of truth
 * (data/bondiVenues.ts). One dataset feeds the Day Planner, the eat-and-drink hub,
 * the category (collection) pages, the individual venue guides, and in-article venue
 * lists — so nothing drifts out of sync across the site.
 *
 * INTEGRITY: selection and copy here are editorial and durable. No volatile facts
 * (hours, prices, menus) are asserted in this layer — those live per-venue in the
 * dataset with `hoursVerified`/`sources`, or are deferred to the venue's own site.
 */
import { BONDI_VENUES, type Venue, type DiningTag, type VenueType } from '@/data/bondiVenues';
import { ZONE_LABEL } from '@/lib/bondiZones';

/* --------------------------------- lookups -------------------------------- */

/** Venues shown in listings (active by default; inactive kept for the record only). */
export function activeVenues(): Venue[] {
  return BONDI_VENUES.filter((v) => v.active !== false);
}

export function getVenue(id: string): Venue | undefined {
  return BONDI_VENUES.find((v) => v.id === id);
}

export function venuesForTag(tag: DiningTag): Venue[] {
  return activeVenues().filter((v) => v.diningTags?.includes(tag));
}

export function venuesOfType(type: VenueType): Venue[] {
  return activeVenues().filter((v) => v.type === type);
}

export function venuesWithGuide(): Venue[] {
  return activeVenues().filter((v) => v.hasGuide);
}

/** Overall editorial standing used for default "featured" ordering (guide first, then quality). */
export function byEditorialStanding(a: Venue, b: Venue): number {
  return (
    Number(Boolean(b.hasGuide)) - Number(Boolean(a.hasGuide)) ||
    b.qualityScore - a.qualityScore ||
    b.localFavouriteScore - a.localFavouriteScore
  );
}

export function venueNeighbourhood(v: Venue): string {
  return v.neighbourhood || ZONE_LABEL[v.zone];
}

/* ------------------------------ collections ------------------------------- */

export interface DiningCollection {
  slug: string;
  tag: DiningTag;
  kicker: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Answer-first paragraph (AEO) — may name specific picks. */
  answer: string;
  intro: string[];
  faqs: { q: string; a: string }[];
  related: { title: string; path: string }[];
}

const HUB = { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' };
const SWIM = { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' };
const THINGS = { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' };
const STAY = { title: 'Where to stay in Bondi', path: '/stay' };

/**
 * The category pages. Each is a real search intent answerable from the dataset with
 * unique, curated content — not an auto-generated filter page. Copy is intentionally
 * durable; specific picks come from the live `select`.
 */
export const DINING_COLLECTIONS: DiningCollection[] = [
  {
    slug: 'best-restaurants-bondi-beach',
    tag: 'best-restaurants',
    kicker: 'Eat & Drink · Restaurants',
    h1: 'The Best Restaurants in Bondi Beach',
    metaTitle: 'The Best Restaurants in Bondi Beach',
    metaDescription:
      'The best restaurants in Bondi Beach, chosen by locals — from iconic ocean-view dining rooms to neighbourhood favourites, with who each suits and what they’re known for.',
    answer:
      'Bondi’s standout restaurants run from the iconic — Icebergs Dining Room above the ocean pool, and Sean’s on Campbell Parade — to buzzy local favourites for seafood, Italian and modern Australian. The right pick depends on whether you want a view, a long lunch or a casual feed near the sand.',
    intro: [
      'Bondi eats far better than its beach-town reputation suggests. You’ve got genuine destination dining alongside the sand, plus a deep bench of neighbourhood restaurants that locals actually book. Below are the ones we rate, with what each is best for.',
    ],
    faqs: [
      { q: 'What is the best restaurant in Bondi Beach?', a: 'For the view and the occasion, Icebergs Dining Room above the ocean pool; for produce-led fine dining, Sean’s on Campbell Parade. The “best” depends on whether you want a view, a long lunch or a casual local feed.' },
      { q: 'Where do locals eat in Bondi?', a: 'Away from the busiest beachfront spots — neighbourhood restaurants for seafood, Italian and modern Australian, many just back from Campbell Parade around Hall Street and Gould Street.' },
    ],
    related: [SWIM, THINGS, STAY],
  },
  {
    slug: 'best-bars-bondi-beach',
    tag: 'best-bars',
    kicker: 'Eat & Drink · Bars',
    h1: 'The Best Bars in Bondi Beach',
    metaTitle: 'The Best Bars in Bondi Beach',
    metaDescription:
      'The best bars in Bondi Beach, from a local — sunset drinks with an ocean view, cocktail spots, wine bars and the classic beachfront pubs, with who each suits.',
    answer:
      'For a drink in Bondi, choose by the mood: sunset cocktails with an ocean view up at Icebergs, wine bars and cocktail spots tucked back from the beach, or the classic beachfront pubs for something easy and lively. Below are the spots worth your evening.',
    intro: [
      'Bondi’s drinking scene spans glamorous ocean-view bars, low-lit cocktail and wine spots, and big beachfront pubs. Here’s where we’d send you depending on the night you’re after.',
    ],
    faqs: [
      { q: 'Where’s the best place for sunset drinks in Bondi?', a: 'The bar at Icebergs, above the ocean pool, is the classic for a sunset drink with a view. The beachfront pubs also catch the golden-hour crowd.' },
      { q: 'Does Bondi have good cocktail bars?', a: 'Yes — there’s a growing set of cocktail and wine bars a street or two back from the beachfront, away from the busiest tourist strip.' },
    ],
    related: [HUB, THINGS, STAY],
  },
  {
    slug: 'cheap-eats-bondi-beach',
    tag: 'cheap-eats',
    kicker: 'Eat & Drink · Cheap eats',
    h1: 'The Best Cheap Eats in Bondi Beach',
    metaTitle: 'Cheap Eats in Bondi Beach: Where to Eat on a Budget',
    metaDescription:
      'Where to eat cheaply in Bondi Beach — the best value feeds near the sand, from fish and chips to takeaway and casual local spots, chosen by locals.',
    answer:
      'You can eat well in Bondi without a big spend: fish and chips on the sand, casual takeaway and no-frills local favourites a short walk back from the beachfront are the best-value feeds. Below are the spots locals rate for a cheap, good meal.',
    intro: [
      'Bondi has a reputation for pricey beachfront dining, but the value is there if you know where to look — especially a block or two back from Campbell Parade. Here are the cheap eats worth walking for.',
    ],
    faqs: [
      { q: 'Where can I eat cheaply in Bondi?', a: 'Casual takeaway and local spots just back from the beachfront offer the best value — fish and chips, quick eats and no-frills favourites, rather than the beachfront dining rooms.' },
      { q: 'Is Bondi expensive to eat in?', a: 'The beachfront dining can be, but there’s plenty of good-value food a short walk back from the sand.' },
    ],
    related: [HUB, THINGS, STAY],
  },
  {
    slug: 'breakfast-brunch-bondi-beach',
    tag: 'breakfast-brunch',
    kicker: 'Eat & Drink · Breakfast',
    h1: 'The Best Breakfast & Brunch in Bondi Beach',
    metaTitle: 'The Best Breakfast & Brunch in Bondi Beach',
    metaDescription:
      'Where to have breakfast and brunch in Bondi Beach — the best cafés for a post-swim coffee or a long weekend brunch, from a team of locals.',
    answer:
      'Bondi is one of Sydney’s great brunch neighbourhoods. For a post-swim breakfast or a long weekend brunch, the standout cafés cluster around Hall Street, Gould Street and the north end of the beach. Below are our picks and what each is best for.',
    intro: [
      'Brunch is a Bondi institution. Whether you want a quick post-surf flat white or a lazy weekend spread, here’s where we go.',
    ],
    faqs: [
      { q: 'Where’s the best brunch in Bondi?', a: 'The cafés around Hall Street, Gould Street and the north end of the beach are the heart of Bondi’s brunch scene. See our picks above for what each is best for.' },
      { q: 'Do Bondi cafés get busy on weekends?', a: 'Yes — weekend mid-morning is peak. Go early for the best tables, or eat on the earlier or later side to skip the queue.' },
    ],
    related: [HUB, SWIM, THINGS],
  },
  {
    slug: 'waterfront-dining-bondi-beach',
    tag: 'waterfront-dining',
    kicker: 'Eat & Drink · With a view',
    h1: 'The Best Ocean-View Dining in Bondi Beach',
    metaTitle: 'Bondi Beach Restaurants With Ocean Views',
    metaDescription:
      'The best restaurants and bars with ocean views in Bondi Beach — where to eat and drink looking out over the sand and the sea, chosen by locals.',
    answer:
      'For a meal with an ocean view in Bondi, the standouts sit right on Campbell Parade and up at the Icebergs headland — Icebergs Dining Room has arguably the most iconic view of all. Below are the spots where the outlook is as good as the food.',
    intro: [
      'Half the point of eating in Bondi is the view. These are the restaurants and bars where you’re looking straight out over the beach or the ocean pool.',
    ],
    faqs: [
      { q: 'Which Bondi restaurant has the best view?', a: 'Icebergs Dining Room and Bar, perched above the ocean pool at the south headland, has the most iconic Bondi dining view. Several Campbell Parade spots also look straight over the sand.' },
    ],
    related: [HUB, SWIM, STAY],
  },
  {
    slug: 'pubs-bondi-beach',
    tag: 'pubs',
    kicker: 'Eat & Drink · Pubs',
    h1: 'The Best Pubs in Bondi Beach',
    metaTitle: 'The Best Pubs in Bondi Beach',
    metaDescription:
      'The best pubs in Bondi Beach — beachfront beers, big screens for the football, pub meals and lively nights, with who each suits, from locals.',
    answer:
      'Bondi’s pubs range from the landmark beachfront Hotel Bondi to lively locals a little back from the sand — good for a beer, a pub feed, or catching the football on the big screens. Below are the ones worth a session.',
    intro: [
      'The Bondi pub is a whole genre: beachfront balconies, big weekend crowds and screens for the game. Here’s where to go and what for.',
    ],
    faqs: [
      { q: 'Where can I watch the football in Bondi?', a: 'Several of the pubs show live sport on big screens, including English football on weekend mornings AEST. Check the individual pub’s socials for which fixtures they’re showing.' },
    ],
    related: [HUB, THINGS, STAY],
  },
  {
    slug: 'vegan-vegetarian-bondi-beach',
    tag: 'vegan-vegetarian',
    kicker: 'Eat & Drink · Plant-based',
    h1: 'The Best Vegan & Vegetarian Food in Bondi Beach',
    metaTitle: 'Vegan & Vegetarian Restaurants in Bondi Beach',
    metaDescription:
      'Where to eat vegan and vegetarian in Bondi Beach — plant-based cafés, healthy bowls and restaurants with strong meat-free options, chosen by locals.',
    answer:
      'Bondi is one of Sydney’s most plant-friendly neighbourhoods, with dedicated vegan and vegetarian spots plus cafés and restaurants that do genuinely good meat-free menus. Below are the best places to eat plant-based near the beach.',
    intro: [
      'Health-focused, plant-based eating is part of Bondi’s DNA. Whether you’re fully vegan or just after a great veggie meal, here’s where we’d point you.',
    ],
    faqs: [
      { q: 'Is Bondi good for vegans?', a: 'Very — it’s one of Sydney’s most plant-friendly areas, with dedicated vegan spots and plenty of cafés and restaurants offering strong vegan and vegetarian options.' },
    ],
    related: [HUB, SWIM, THINGS],
  },
];

export function getCollection(slug: string): DiningCollection | undefined {
  return DINING_COLLECTIONS.find((c) => c.slug === slug);
}

export function collectionSlugs(): string[] {
  return DINING_COLLECTIONS.map((c) => c.slug);
}

/** Curated venues for a collection page, in editorial order (guides first). */
export function venuesForCollection(c: DiningCollection): Venue[] {
  return venuesForTag(c.tag).sort(byEditorialStanding);
}
