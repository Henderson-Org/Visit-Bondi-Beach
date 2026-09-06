/**
 * Fitness domain logic. Everything the /fitness pages render comes through here, so a
 * venue is described identically on the hub, its category pages, its own page and in
 * schema - update data/fitnessVenues.ts once and it changes everywhere.
 */
import {
  FITNESS_VENUES,
  SUBURB_LABEL,
  CATEGORY_LABEL,
  type FitnessVenue,
  type FitnessCategory,
  type FitnessSuburb,
} from '@/data/fitnessVenues';

export { SUBURB_LABEL, CATEGORY_LABEL };
export type { FitnessVenue, FitnessCategory, FitnessSuburb };

/** Live venues only. A closed venue keeps its record but leaves every listing. */
export function activeVenues(): FitnessVenue[] {
  return FITNESS_VENUES.filter((v) => v.active !== false);
}

export function getFitnessVenue(id: string): FitnessVenue | undefined {
  return activeVenues().find((v) => v.id === id);
}

/** Full address as a visitor would read it - suburb is never omitted or substituted. */
export function fullAddress(v: FitnessVenue): string {
  return `${v.address}, ${SUBURB_LABEL[v.suburb]} NSW`;
}

export function venuesInCategory(c: FitnessCategory): FitnessVenue[] {
  return activeVenues().filter((v) => v.categories.includes(c));
}

export function venuesInSuburb(s: FitnessSuburb): FitnessVenue[] {
  return activeVenues().filter((v) => v.suburb === s);
}

/** Venues that publish a casual visit, day pass, single session or trial. */
export function casualFriendlyVenues(): FitnessVenue[] {
  return activeVenues().filter((v) => v.casualVisit === 'yes');
}

/**
 * Suburbs that actually have venues, in coastal-then-inland order. Drives the directory's
 * location grouping, so an empty suburb never renders as an empty heading.
 */
export function populatedSuburbs(): FitnessSuburb[] {
  const order: FitnessSuburb[] = ['bondi-beach', 'north-bondi', 'bondi', 'tamarama', 'bronte', 'bondi-junction'];
  return order.filter((s) => venuesInSuburb(s).length > 0);
}

export interface FitnessCollection {
  slug: string;
  category?: FitnessCategory;
  /**
   * For a collection that is not a category but a genuine way people search - "which of
   * these can I use without joining". A predicate over the dataset, so the page can never
   * drift from the venue records it is built from. Set `category` OR `select`, never both.
   */
  select?: (v: FitnessVenue) => boolean;
  title: string;
  h1: string;
  metaDescription: string;
  /** The search intent this page exists to answer. One page, one intent. */
  intent: string;
  intro: string;
}

/**
 * Category pages. A category only earns a page when enough verified venues sit behind it
 * to be worth a visitor's click - `indexableCollections()` enforces that, so we never
 * ship a page listing one venue purely to own a keyword.
 */
export const FITNESS_COLLECTIONS: FitnessCollection[] = [
  {
    slug: 'gyms',
    category: 'gym',
    // RETARGETED off day-pass intent. This page used to claim "gym day pass bondi" in its
    // title, meta and intent, which put it in direct competition with /fitness/day-passes -
    // the page that actually answers that query across every category, not just gyms. The
    // cards here still show each gym's casual terms; what changed is what the page targets.
    title: 'Gyms in Bondi: Every Verified Club, by Suburb',
    h1: 'Gyms in Bondi Beach and Bondi Junction',
    metaDescription:
      'Every verified gym around Bondi - what each one has, and whether it is at Bondi Beach or 2.5 km inland at Bondi Junction. Two very different sets of gyms.',
    intent: 'gyms bondi / bondi beach gym / gym bondi junction',
    intro:
      'Two very different sets of gyms sit within a few kilometres of each other here, and the distinction matters more than the marketing suggests. At Bondi Beach the gyms are small-floor, view-heavy and built around people who train and then swim. In Bondi Junction, 2.5 km inland, they are big indoor clubs inside and around the shopping centre. Every venue below carries its real suburb.',
  },
  {
    slug: 'pilates',
    category: 'pilates',
    title: 'Pilates in Bondi: Reformer & Mat Studios by Suburb',
    h1: 'Pilates studios in Bondi Beach and Bondi Junction',
    metaDescription:
      'Reformer and mat pilates studios around Bondi, each with its real suburb, what it offers, and whether casual classes or intro packs are available.',
    intent: 'pilates bondi / reformer pilates bondi / pilates bondi junction',
    intro:
      'Pilates is the densest fitness category in this part of Sydney, and it splits cleanly by geography. The Bondi Beach studios sit on Hall Street and Curlewis Street a block or two back from the sand; the Bondi Junction studios cluster along Oxford Street near the transport interchange. Most run graded group reformer classes and publish an intro offer for new clients.',
  },
  {
    slug: 'yoga',
    category: 'yoga',
    title: 'Yoga in Bondi Beach: Studios & Drop-in Classes',
    h1: 'Yoga in Bondi Beach',
    metaDescription:
      'Yoga studios around Bondi Beach, what each offers, and which take drop-in classes or trial passes - with every venue’s real suburb.',
    intent: 'yoga bondi / yoga bondi beach / drop in yoga bondi',
    intro:
      'Bondi’s yoga studios are concentrated a block back from the beach rather than on the beachfront itself, which is why visitors often walk straight past them. Drop-in classes are common, so a single session while you are here is straightforward.',
  },
  {
    slug: 'recovery',
    category: 'recovery',
    title: 'Recovery & Wellness in Bondi: Saunas, Ice Baths & Bodywork',
    h1: 'Recovery and wellness around Bondi',
    metaDescription:
      'Saunas, cold plunges, infrared, sound healing and bodywork around Bondi and Bondi Junction — what each venue actually offers, and which suburb it is in.',
    intent: 'recovery bondi / sauna ice bath bondi / wellness bondi junction',
    intro:
      'Recovery has quietly become its own category here, and it splits into two kinds: the hot-and-cold rooms attached to gyms, and standalone studios doing bodywork, light therapy and breathwork. Bondi being Bondi, several of them will also sell you the ocean as the cold plunge, which is free and open all year.',
  },
  {
    // Not a category - a filter. It is also the single most common thing a visitor asks,
    // and the one question the category pages answer only in fragments: gyms, pilates,
    // yoga and recovery each hold part of the answer. Built off the same casualVisit field
    // the cards render, so it cannot drift from the records.
    slug: 'day-passes',
    select: (v) => v.casualVisit === 'yes',
    title: 'Bondi Day Passes: Gyms & Studios You Can Use Casually',
    h1: 'Where you can train in Bondi without joining',
    metaDescription:
      'The gyms, pilates and yoga studios around Bondi that publish a day pass, single session, drop-in class or trial - what each one actually offers, and its real suburb.',
    intent: 'gym day pass bondi / casual gym bondi / drop in classes bondi',
    intro:
      'Almost every visitor asks the same question, and the answer here is usually yes. These are the venues around Bondi whose own site publishes a way in without a membership - a day pass, a single session, a drop-in class or a trial - and what each one actually offers. We do not print prices, because they change constantly; every listing goes straight to the venue’s own page so you are reading today’s terms rather than ours.',
  },
  // NO SWIMMING CATEGORY PAGE, DELIBERATELY. /where-to-swim-at-bondi-beach already owns
  // that intent and is an established page; a /fitness/swimming page would compete with it
  // for the same query and split the signal - the exact cannibalisation this site has spent
  // a lot of effort undoing elsewhere. The pool venues still carry the 'swimming' category
  // so they appear in the directory and on their own pages, and the hub sends swim intent
  // to the existing page. Same reasoning for running: /city2surf-and-running and
  // /bondi-coastal-walk already cover it.
];

/** How many verified venues a category needs before it earns an indexable page. */
export const MIN_VENUES_FOR_PAGE = 2;

export function getCollection(slug: string): FitnessCollection | undefined {
  return FITNESS_COLLECTIONS.find((c) => c.slug === slug);
}

export function venuesForCollection(c: FitnessCollection): FitnessVenue[] {
  if (c.category) return venuesInCategory(c.category);
  if (c.select) return activeVenues().filter(c.select);
  return [];
}

/**
 * Category pages with enough behind them to be worth indexing. A category that falls
 * below the threshold simply has no page - we do not ship a thin one and noindex it,
 * because a page nobody should land on is a page that should not exist.
 */
export function indexableCollections(): FitnessCollection[] {
  return FITNESS_COLLECTIONS.filter((c) => venuesForCollection(c).length >= MIN_VENUES_FOR_PAGE);
}

export function collectionSlugs(): string[] {
  return indexableCollections().map((c) => c.slug);
}

/** Every venue that gets its own page. Currently all of them - each has verified detail. */
export function venuesWithPages(): FitnessVenue[] {
  return activeVenues();
}

/**
 * Sort for listings: venues that take casual visits first (that is what a visitor to the
 * area can actually use), then alphabetically so the order is stable and not editorialised.
 */
export function byVisitorUsefulness(a: FitnessVenue, b: FitnessVenue): number {
  const casual = (v: FitnessVenue) => (v.casualVisit === 'yes' ? 0 : 1);
  return casual(a) - casual(b) || a.name.localeCompare(b.name);
}

/** Distinct categories a venue belongs to, labelled, for display on cards. */
export function categoryLabels(v: FitnessVenue): string[] {
  return v.categories.map((c) => CATEGORY_LABEL[c]);
}
