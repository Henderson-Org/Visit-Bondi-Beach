/**
 * Central accommodation data for the Stay section.
 *
 * EDITORIAL INTEGRITY (non-negotiable — see the Stay brief):
 *  - No invented facts. Every property here is a long-established, publicly-verifiable
 *    Bondi-area business, described only by durable facts that are matters of public
 *    record: its accommodation *type* and its rough *location/area*. We deliberately do
 *    NOT store prices, star ratings, review scores, amenity lists or anything volatile —
 *    those change and would go stale or mislead.
 *  - No fabricated ratings/reviews. There are no rating fields here by design, so no page
 *    can accidentally emit an AggregateRating.
 *  - No scraped imagery. There are no per-property image fields — the UI never shows a
 *    hotel photo we don't have rights to. Cards are typographic.
 *  - Bookability is expressed only as "which providers you can search this on", never as
 *    a live-availability or open/closed claim. The affiliate CTA runs a *search* on the
 *    provider (see lib/affiliate.ts), so we never present a specific room as bookable.
 *
 * Adding a property (documented for the site owner):
 *  1. Add an entry to PROPERTIES with a real name, the correct `area` slug, a `type`,
 *     a neutral one-line `summary` (no prices/ratings), `bestFor` traveller tags, the
 *     `providers` you can search it on, and today's date as `lastReviewed`.
 *  2. That's it — the affiliate CTAs, cards, schema and internal links are generated
 *     automatically. No URLs to hand-maintain.
 */

export type Provider = 'booking' | 'hostelworld' | 'tripadvisor';

export type StayType = 'hotel' | 'boutique-hotel' | 'apartments' | 'hostel' | 'pub-hotel';

export type TravellerType =
  | 'couples'
  | 'families'
  | 'budget'
  | 'first-time'
  | 'long-stay'
  | 'groups';

export const STAY_TYPE_LABEL: Record<StayType, string> = {
  hotel: 'Hotel',
  'boutique-hotel': 'Boutique hotel',
  apartments: 'Serviced apartments',
  hostel: 'Hostel',
  'pub-hotel': 'Pub hotel',
};

export const TRAVELLER_LABEL: Record<TravellerType, string> = {
  couples: 'Couples',
  families: 'Families',
  budget: 'Budget',
  'first-time': 'First-time visitors',
  'long-stay': 'Longer stays',
  groups: 'Groups',
};

export interface Area {
  slug: string;
  name: string;
  /** Neutral, evergreen orientation — no prices, hours or volatile facts. */
  blurb: string;
  /** Rough walking orientation to the sand (durable geography, not a promise). */
  toBeach: string;
  bestFor: TravellerType[];
}

export interface Property {
  slug: string;
  name: string;
  /** Area slug (see AREAS). */
  area: string;
  type: StayType;
  /** One neutral line: type + rough location only. No prices, ratings or amenities. */
  summary: string;
  bestFor: TravellerType[];
  /** Providers this property can be *searched* on (drives the affiliate CTAs). */
  providers: Provider[];
  /** Date the entry was last editorially reviewed (YYYY-MM-DD). */
  lastReviewed: string;
}

const REVIEWED = '2026-08-08';

export const AREAS: Area[] = [
  {
    slug: 'bondi-beach',
    name: 'Bondi Beach',
    blurb:
      'The beachfront strip along Campbell Parade and the streets just behind it. You wake up near the sand, the cafés and the start of the coastal walk — the classic Bondi base, and the busiest.',
    toBeach: 'On or a few minutes from the sand',
    bestFor: ['first-time', 'couples', 'families'],
  },
  {
    slug: 'north-bondi',
    name: 'North Bondi',
    blurb:
      'The quieter northern end, above the flags and the North Bondi shops. Still walkable to the beach but calmer and more residential than the Campbell Parade strip.',
    toBeach: 'Short walk to the north end of the beach',
    bestFor: ['families', 'long-stay', 'couples'],
  },
  {
    slug: 'bondi-junction',
    name: 'Bondi Junction',
    blurb:
      'The transport and shopping hub about a 10-minute bus ride uphill from the sand. Where the train line ends, so it is the easiest place to reach from the airport or the city — and generally better value than the beachfront.',
    toBeach: 'Roughly 10 minutes by bus (or a 25–30 minute walk downhill)',
    bestFor: ['budget', 'first-time', 'long-stay'],
  },
  {
    slug: 'tamarama-bronte',
    name: 'Tamarama & Bronte',
    blurb:
      'The next beaches south along the coastal walk. Leafier, quieter and more residential — a good base if you want the Eastern Beaches without the Bondi crowds.',
    toBeach: 'On the Bondi-to-Coogee coastal walk, one beach south',
    bestFor: ['couples', 'long-stay', 'families'],
  },
];

/**
 * A small, deliberately conservative set of long-established Bondi-area businesses.
 * Each is described only by its type and rough location. Kept intentionally short and
 * honest rather than padded out — this is a guide, not a directory.
 */
export const PROPERTIES: Property[] = [
  {
    slug: 'qt-bondi',
    name: 'QT Bondi',
    area: 'bondi-beach',
    type: 'hotel',
    summary: 'Design-led hotel right on the Campbell Parade beachfront, above the shops.',
    bestFor: ['couples', 'first-time'],
    providers: ['booking', 'tripadvisor'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'adina-bondi-beach',
    name: 'Adina Apartment Hotel Bondi Beach',
    area: 'bondi-beach',
    type: 'apartments',
    summary: 'Apartment-style hotel rooms a short walk back from the beach near Campbell Parade.',
    bestFor: ['families', 'long-stay', 'couples'],
    providers: ['booking', 'tripadvisor'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'bondi-38',
    name: 'Bondi 38 Serviced Apartments',
    area: 'bondi-beach',
    type: 'apartments',
    summary: 'Self-contained serviced apartments on Campbell Parade, near the south end of the beach.',
    bestFor: ['families', 'long-stay', 'groups'],
    providers: ['booking', 'tripadvisor'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'hotel-ravesis',
    name: 'Hotel Ravesis',
    area: 'bondi-beach',
    type: 'boutique-hotel',
    summary: 'Small boutique hotel on the corner of Campbell Parade and Hall Street, facing the beach.',
    bestFor: ['couples', 'first-time'],
    providers: ['booking', 'tripadvisor'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'hotel-bondi',
    name: 'Hotel Bondi',
    area: 'bondi-beach',
    type: 'pub-hotel',
    summary: 'The landmark pub hotel on Campbell Parade, with accommodation above the bars.',
    bestFor: ['budget', 'groups', 'first-time'],
    providers: ['booking'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'noahs-bondi-beach',
    name: "Noah's Bondi Beach",
    area: 'bondi-beach',
    type: 'hostel',
    summary: 'Backpacker hostel at the south end of Campbell Parade, opposite the beach.',
    bestFor: ['budget', 'groups'],
    providers: ['hostelworld', 'booking'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'bondi-backpackers',
    name: 'Bondi Backpackers',
    area: 'bondi-beach',
    type: 'hostel',
    summary: 'Backpacker hostel on Campbell Parade, a short walk from the sand.',
    bestFor: ['budget', 'groups'],
    providers: ['hostelworld', 'booking'],
    lastReviewed: REVIEWED,
  },
  {
    slug: 'meriton-bondi-junction',
    name: 'Meriton Suites Bondi Junction',
    area: 'bondi-junction',
    type: 'apartments',
    summary: 'High-rise serviced apartments beside the Bondi Junction transport and shopping hub.',
    bestFor: ['families', 'long-stay', 'budget'],
    providers: ['booking', 'tripadvisor'],
    lastReviewed: REVIEWED,
  },
];

export function getArea(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}

export function propertiesByArea(areaSlug: string): Property[] {
  return PROPERTIES.filter((p) => p.area === areaSlug);
}

export function propertiesForTraveller(t: TravellerType): Property[] {
  return PROPERTIES.filter((p) => p.bestFor.includes(t));
}

export function hostels(): Property[] {
  return PROPERTIES.filter((p) => p.type === 'hostel');
}
