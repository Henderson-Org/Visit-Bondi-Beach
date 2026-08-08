/**
 * Central accommodation data for the Stay section.
 *
 * EDITORIAL INTEGRITY (non-negotiable — see the Stay brief):
 *  - No invented facts. Every property here is a real, long-established Bondi-area
 *    business. Fields hold durable facts only (type, area, rough walk time, price
 *    positioning, well-known amenities). We do NOT store nightly prices, star ratings
 *    or guest-review scores — those are volatile and belong on the booking sites.
 *  - No fabricated ratings/reviews. There is no guest-rating field. The optional
 *    Visit Bondi Beach score lives in data/accommodation-guides.ts and is an editorial
 *    assessment grounded in verifiable location facts, with its method shown.
 *  - No scraped imagery. `image` is for a rights-cleared photo we actually hold; when
 *    absent the UI shows a tasteful non-photographic fallback (never a stand-in photo
 *    implying it's the property).
 *  - Bookability is a *search/official link*, never a live-availability claim.
 *
 * Adding a property (for the site owner): add an entry to PROPERTIES with real,
 * conservative values and today's date as `lastReviewed`. Cards, filters, comparison
 * tables, category pages and schema pick it up automatically. To publish a full
 * editorial review, add a matching entry to data/accommodation-guides.ts and set
 * `hasGuide: true` — the card then links to the internal guide first.
 */

export type Provider = 'booking' | 'hostelworld' | 'tripadvisor';

export type StayType = 'hotel' | 'boutique-hotel' | 'apartments' | 'hostel' | 'pub-hotel';

export type PriceBand = '$' | '$$' | '$$$' | '$$$$';

/** "Best for" tags — the visitor-facing taxonomy the filters use. */
export type Tag =
  | 'families'
  | 'couples'
  | 'first-time'
  | 'beach-access'
  | 'luxury'
  | 'budget'
  | 'longer-stays'
  | 'groups'
  | 'pool'
  | 'ocean-views';

export const STAY_TYPE_LABEL: Record<StayType, string> = {
  hotel: 'Hotel',
  'boutique-hotel': 'Boutique hotel',
  apartments: 'Serviced apartments',
  hostel: 'Hostel',
  'pub-hotel': 'Pub hotel',
};

export const STAY_TYPE_PLURAL: Record<StayType, string> = {
  hotel: 'Hotels',
  'boutique-hotel': 'Boutique hotels',
  apartments: 'Serviced apartments',
  hostel: 'Hostels',
  'pub-hotel': 'Pub hotels',
};

export const TAG_LABEL: Record<Tag, string> = {
  families: 'Families',
  couples: 'Couples',
  'first-time': 'First-time visitors',
  'beach-access': 'Beach access',
  luxury: 'Luxury',
  budget: 'Budget',
  'longer-stays': 'Longer stays',
  groups: 'Groups',
  pool: 'Pool',
  'ocean-views': 'Ocean views',
};

export const PRICE_LABEL: Record<PriceBand, string> = {
  $: 'Budget',
  $$: 'Mid-range',
  $$$: 'Upper mid-range',
  $$$$: 'Top-end',
};

export interface Amenities {
  /** Property has a pool (guests can use it). */
  pool?: boolean;
  /** On-site or associated parking: how it works, at a high level. */
  parking?: 'onsite' | 'paid' | 'limited' | 'none';
  /** In-room kitchen / kitchenette (self-catering). */
  kitchen?: boolean;
  /** Some rooms have an ocean outlook (never claimed for every room). */
  oceanViews?: boolean;
  /** Free-text accessibility note where genuinely known; omitted otherwise. */
  accessibility?: string;
}

export interface Property {
  slug: string;
  name: string;
  /** Area slug (see AREAS). */
  area: string;
  type: StayType;
  priceBand: PriceBand;
  /** Human neighbourhood/street orientation (durable geography). */
  neighbourhood: string;
  /** Approx. walking minutes to Bondi Beach sand; null when it's a ride, not a walk. */
  walkMinutes: number | null;
  /** Short walk phrasing shown on cards (e.g. "2 min walk", "~10 min by bus"). */
  walkText: string;
  /** One neutral line for cards/lists. */
  summary: string;
  bestFor: Tag[];
  amenities: Amenities;
  providers: Provider[];
  /** Official website, when confidently known; otherwise omitted (CTA falls back to a booking search). */
  officialUrl?: string;
  /** True when a full editorial guide exists at /stay/[slug] (see accommodation-guides.ts). */
  hasGuide?: boolean;
  /** Rights-cleared property photo path; null → non-photographic card fallback. */
  image?: string | null;
  lastReviewed: string;
}

export interface Area {
  slug: string;
  name: string;
  blurb: string;
  toBeach: string;
  bestFor: Tag[];
}

const REVIEWED = '2026-08-08';

export const AREAS: Area[] = [
  {
    slug: 'bondi-beach',
    name: 'Bondi Beach',
    blurb:
      'The beachfront strip along Campbell Parade and the streets just behind it. You wake up near the sand, the cafés and the start of the coastal walk — the classic Bondi base, and the busiest.',
    toBeach: 'On or minutes from the sand',
    bestFor: ['first-time', 'couples', 'beach-access'],
  },
  {
    slug: 'north-bondi',
    name: 'North Bondi',
    blurb:
      'The quieter northern end, above the flags and the North Bondi shops. Still walkable to the beach but calmer and more residential than the Campbell Parade strip.',
    toBeach: 'Short walk to the north end',
    bestFor: ['families', 'longer-stays', 'couples'],
  },
  {
    slug: 'bondi-junction',
    name: 'Bondi Junction',
    blurb:
      'The transport and shopping hub about 10 minutes uphill from the sand, where the train line ends. Easiest to reach from the airport or the city, and generally better value than the beachfront.',
    toBeach: '~10 min by bus (or a 25–30 min walk)',
    bestFor: ['budget', 'first-time', 'longer-stays'],
  },
  {
    slug: 'tamarama',
    name: 'Tamarama',
    blurb:
      'The small, leafy cove one beach south of Bondi on the coastal walk — “Glamarama” to locals. Residential and quiet, a few minutes from Bondi along the clifftop path.',
    toBeach: 'One beach south on the coastal walk',
    bestFor: ['couples', 'longer-stays'],
  },
  {
    slug: 'bronte',
    name: 'Bronte',
    blurb:
      'A relaxed family beach with its own ocean baths, further south along the coastal walk. Leafy and local, a lovely quieter base within reach of Bondi.',
    toBeach: 'Further south on the coastal walk',
    bestFor: ['families', 'longer-stays', 'couples'],
  },
];

/**
 * A conservative set of real, well-established Bondi-area places to stay. Described by
 * durable facts only. Walk times and price bands are approximate editorial positioning,
 * not quotes. Expand this list as new properties are verified.
 */
export const PROPERTIES: Property[] = [
  {
    slug: 'qt-bondi',
    name: 'QT Bondi',
    area: 'bondi-beach',
    type: 'boutique-hotel',
    priceBand: '$$$',
    neighbourhood: 'Campbell Parade beachfront',
    walkMinutes: 1,
    walkText: 'On the beachfront',
    summary: 'Design-led boutique hotel right on Campbell Parade, above the beachfront shops.',
    bestFor: ['couples', 'first-time', 'luxury', 'beach-access', 'ocean-views'],
    amenities: { parking: 'paid', kitchen: false, oceanViews: true },
    providers: ['booking', 'tripadvisor'],
    hasGuide: true,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'adina-bondi-beach',
    name: 'Adina Apartment Hotel Bondi Beach',
    area: 'bondi-beach',
    type: 'apartments',
    priceBand: '$$$',
    neighbourhood: 'Just behind Campbell Parade',
    walkMinutes: 3,
    walkText: '3 min walk',
    summary: 'Apartment-hotel with kitchens and an indoor pool, a short walk back from the beach.',
    bestFor: ['families', 'longer-stays', 'couples', 'beach-access', 'pool'],
    amenities: { pool: true, parking: 'paid', kitchen: true, oceanViews: false },
    providers: ['booking', 'tripadvisor'],
    officialUrl: 'https://www.adinahotels.com/en/hotels/bondi-beach/',
    hasGuide: true,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'bondi-38',
    name: 'Bondi 38 Serviced Apartments',
    area: 'bondi-beach',
    type: 'apartments',
    priceBand: '$$$',
    neighbourhood: 'Campbell Parade, south end',
    walkMinutes: 2,
    walkText: '2 min walk',
    summary: 'Self-contained serviced apartments on Campbell Parade near the south end of the beach.',
    bestFor: ['families', 'longer-stays', 'groups', 'beach-access'],
    amenities: { kitchen: true, parking: 'paid', oceanViews: true },
    providers: ['booking', 'tripadvisor'],
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'hotel-ravesis',
    name: 'Hotel Ravesis',
    area: 'bondi-beach',
    type: 'boutique-hotel',
    priceBand: '$$$',
    neighbourhood: 'Corner of Campbell Parade & Hall Street',
    walkMinutes: 1,
    walkText: 'On the beachfront',
    summary: 'Small beachfront boutique hotel on the Campbell Parade / Hall Street corner.',
    bestFor: ['couples', 'first-time', 'beach-access', 'ocean-views', 'luxury'],
    amenities: { oceanViews: true, parking: 'limited' },
    providers: ['booking', 'tripadvisor'],
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'hotel-bondi',
    name: 'Hotel Bondi',
    area: 'bondi-beach',
    type: 'pub-hotel',
    priceBand: '$$',
    neighbourhood: 'Campbell Parade',
    walkMinutes: 2,
    walkText: '2 min walk',
    summary: 'The landmark pub hotel on Campbell Parade, with rooms above the bars.',
    bestFor: ['budget', 'groups', 'first-time'],
    amenities: { parking: 'none' },
    providers: ['booking'],
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'noahs-bondi-beach',
    name: "Noah's Bondi Beach",
    area: 'bondi-beach',
    type: 'hostel',
    priceBand: '$',
    neighbourhood: 'Campbell Parade, south end',
    walkMinutes: 1,
    walkText: '1 min walk',
    summary: 'Backpacker hostel opposite the beach at the south end of Campbell Parade.',
    bestFor: ['budget', 'groups', 'beach-access'],
    amenities: { kitchen: true, oceanViews: true },
    providers: ['hostelworld', 'booking'],
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'bondi-backpackers',
    name: 'Bondi Backpackers',
    area: 'bondi-beach',
    type: 'hostel',
    priceBand: '$',
    neighbourhood: 'Campbell Parade',
    walkMinutes: 2,
    walkText: '2 min walk',
    summary: 'Backpacker hostel on Campbell Parade, a short walk from the sand.',
    bestFor: ['budget', 'groups'],
    amenities: { kitchen: true },
    providers: ['hostelworld', 'booking'],
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'bondi-beachouse-yha',
    name: 'Bondi Beachouse YHA',
    area: 'north-bondi',
    type: 'hostel',
    priceBand: '$',
    neighbourhood: 'Fletcher Street, above the Tamarama end',
    walkMinutes: 8,
    walkText: '~8 min walk',
    summary: 'Well-known budget hostel on the hill towards Tamarama, with a rooftop and ocean glimpses.',
    bestFor: ['budget', 'groups', 'ocean-views'],
    amenities: { kitchen: true, oceanViews: true },
    providers: ['hostelworld', 'booking'],
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'meriton-bondi-junction',
    name: 'Meriton Suites Bondi Junction',
    area: 'bondi-junction',
    type: 'apartments',
    priceBand: '$$$',
    neighbourhood: 'Beside Westfield & the station',
    walkMinutes: null,
    walkText: '~10 min by bus',
    summary: 'High-rise serviced apartments by the Bondi Junction transport and shopping hub, with a pool.',
    bestFor: ['families', 'longer-stays', 'budget', 'pool', 'ocean-views'],
    amenities: { pool: true, parking: 'onsite', kitchen: true, oceanViews: true },
    providers: ['booking', 'tripadvisor'],
    officialUrl: 'https://www.meritonsuites.com.au/our-hotels/sydney/bondi-junction/',
    hasGuide: false,
    image: null,
    lastReviewed: REVIEWED,
  },
];

/* --------------------------------- lookups -------------------------------- */

export function getArea(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}

export function getProperty(slug: string): Property | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}

export function propertiesByArea(areaSlug: string): Property[] {
  return PROPERTIES.filter((p) => p.area === areaSlug);
}

export function propertiesWithTag(tag: Tag): Property[] {
  return PROPERTIES.filter((p) => p.bestFor.includes(tag));
}

export function propertiesOfType(type: StayType): Property[] {
  return PROPERTIES.filter((p) => p.type === type);
}

export function hostels(): Property[] {
  return propertiesOfType('hostel');
}

/** Areas that currently have at least one property (drives the location filter). */
export function areasWithProperties(): Area[] {
  return AREAS.filter((a) => propertiesByArea(a.slug).length > 0);
}

/** Sort helper: nearest-to-beach first (walk minutes asc; ride-only last). */
export function byBeachProximity(a: Property, b: Property): number {
  const wa = a.walkMinutes ?? 999;
  const wb = b.walkMinutes ?? 999;
  return wa - wb;
}

/** Numeric price rank for sorting/filtering. */
export function priceRank(band: PriceBand): number {
  return band.length;
}
