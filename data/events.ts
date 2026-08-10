/**
 * Central event data for the What's On section.
 *
 * INTEGRITY (non-negotiable):
 *  - No invented events, dates, prices or organisers. Every event here is a real,
 *    well-established Bondi happening. Each carries a `dateStatus` (see DateStatus):
 *    'announced'/'confirmed' events store concrete startDate/endDate and a
 *    dateSourceUrl; 'tbc' events genuinely have no published next edition. We never
 *    assert a precise day we can't stand behind, and Event schema only emits real dates.
 *  - Every event stores `dateSourceUrl`/`dateVerifiedAt` (date provenance) plus a
 *    `source`/`lastVerified`. scripts/verify-events.mjs flags passed editions, upcoming
 *    annuals still lacking dates, and stale verifications so this doesn't rot each year.
 *
 * Adding an event (for the site owner): add an entry to EVENTS with real values, today's
 * date as `lastVerified`, and the official source. Recurring? set `recurrence`. Cards,
 * filters, date logic, schema and the today/this-weekend pages pick it up automatically.
 */

export type EventCategory =
  | 'markets'
  | 'music'
  | 'food'
  | 'family'
  | 'sport'
  | 'fitness'
  | 'surf'
  | 'swim'
  | 'arts'
  | 'community'
  | 'wellness'
  | 'nightlife'
  | 'seasonal';

export type Audience = 'everyone' | 'families' | 'kids' | 'adults';
export type PriceType = 'free' | 'paid' | 'varies';
export type EventStatus = 'scheduled' | 'cancelled' | 'postponed';

/**
 * How much we trust the *date* we're showing — the single source of truth for whether a
 * card may show an exact date, an approximate window, or "Dates TBC". This replaces the
 * old boolean `datesToConfirm`, which conflated "exact day unknown" with "not researched".
 *  - confirmed : a fixed, recurring calendar date that never moves (e.g. NYE = 31 Dec).
 *  - announced : the organiser has published THIS edition's concrete start/end dates.
 *  - recurring : a reliable repeating pattern (weekly markets); date computed from recurrence.
 *  - estimated : we only show an approximate window (typicalTiming) — never an asserted day.
 *  - tbc       : the next edition is genuinely not announced yet (the ONLY case that shows TBC).
 */
export type DateStatus = 'confirmed' | 'announced' | 'recurring' | 'estimated' | 'tbc';

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  markets: 'Markets',
  music: 'Music',
  food: 'Food & drink',
  family: 'Family',
  sport: 'Sport',
  fitness: 'Fitness',
  surf: 'Surf',
  swim: 'Swimming',
  arts: 'Arts & culture',
  community: 'Community',
  wellness: 'Wellness',
  nightlife: 'Nightlife',
  seasonal: 'Seasonal',
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  everyone: 'Everyone',
  families: 'Families',
  kids: 'Kids',
  adults: 'Adults',
};

/** 0 = Sunday … 6 = Saturday (matches JS getUTCDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Recurrence {
  freq: 'weekly' | 'annual';
  /** Weekly: which day it runs. */
  weekday?: Weekday;
  /** Annual: approximate month (1–12) for ordering/display when exact date is unset. */
  month?: number;
  /** Annual: a concrete day-of-month when we can verify it (e.g. NYE = 31 Dec). */
  day?: number;
}

export interface RelatedArticle {
  title: string;
  path: string;
}

export interface BondiEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string[];
  /** One-off events: concrete ISO date(s). Recurring events: leave unset, use `recurrence`. */
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM (24h, Sydney)
  endTime?: string; // HH:MM
  timezone: 'Australia/Sydney';
  recurrence?: Recurrence;
  /** Human phrasing for when it's on, esp. for annual events with unconfirmed exact dates. */
  whenText?: string;
  venue: string;
  address?: string;
  suburb: string;
  categories: EventCategory[];
  audience: Audience[];
  priceType: PriceType;
  price?: string;
  ticketUrl?: string;
  officialUrl?: string;
  image?: string | null;
  imageAlt?: string;
  organiser?: string;
  featured?: boolean;
  status: EventStatus;
  /**
   * Trust level for the displayed date (see DateStatus). Drives UI + schema: only
   * 'confirmed'/'announced' present an exact date/range; 'tbc' shows the TBC badge.
   */
  dateStatus: DateStatus;
  /** Human "usual timing" for annual events, shown as secondary context (e.g. "Late October to early November"). */
  typicalTiming?: string;
  /** The calendar year of the edition our startDate/status refers to (freshness tracking). */
  nextEditionYear?: number;
  /** Where the current date came from (authoritative). Kept for provenance, not shown to users. */
  dateSourceUrl?: string;
  dateSourceName?: string;
  /** When the date itself was last checked against the source (YYYY-MM-DD). */
  dateVerifiedAt?: string;
  lastVerified: string; // YYYY-MM-DD
  source?: string;
  relatedArticles?: RelatedArticle[];
}

const VERIFIED = '2026-08-08';

export const EVENTS: BondiEvent[] = [
  {
    id: 'bondi-farmers-market',
    slug: 'bondi-farmers-market',
    title: 'Bondi Farmers Market',
    summary: 'Weekly Saturday farmers market with fresh local produce, coffee and hot food, behind the beach.',
    description: [
      'Every Saturday, the grounds of Bondi Beach Public School on Campbell Parade fill with growers, bakers and food stalls for the Bondi Farmers Market — a relaxed, local start to the weekend a short walk from the sand.',
      'Come for fresh produce, a coffee and a hot breakfast, then wander across to the beach. Exact stallholders vary week to week; check the official page before a special trip.',
    ],
    timezone: 'Australia/Sydney',
    recurrence: { freq: 'weekly', weekday: 6 },
    dateStatus: 'recurring',
    typicalTiming: 'Every Saturday morning, 9am–1pm',
    whenText: 'Every Saturday morning',
    startTime: '09:00',
    endTime: '13:00',
    venue: 'Bondi Beach Public School',
    address: 'Campbell Parade, Bondi Beach NSW 2026',
    suburb: 'Bondi Beach',
    categories: ['markets', 'food'],
    audience: ['everyone', 'families'],
    priceType: 'free',
    officialUrl: 'https://www.bondimarkets.com.au/',
    image: null,
    organiser: 'Bondi Markets',
    featured: true,
    status: 'scheduled',
    lastVerified: VERIFIED,
    source: 'https://www.bondimarkets.com.au/',
    relatedArticles: [
      { title: "Bondi's Saturday Farmers Market: a complete guide", path: '/bondi-blog/2023/8/22/bondis-saturday-farmers-market-your-complete-guide-to-fresh-local-produce-by-the-beach' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
  },
  {
    id: 'bondi-markets-sunday',
    slug: 'bondi-markets-sunday',
    title: 'Bondi Markets (Sunday)',
    summary: 'The famous Sunday market for fashion, vintage, art and design by young Australian makers.',
    description: [
      'On Sundays, the same Bondi Beach Public School grounds host the original Bondi Markets — a long-running favourite for emerging fashion, vintage finds, jewellery, art and homewares from local designers and makers.',
      "It's a Bondi institution and an easy add-on to a beach day or the coastal walk. Stalls change weekly; see the official page for details.",
    ],
    timezone: 'Australia/Sydney',
    recurrence: { freq: 'weekly', weekday: 0 },
    dateStatus: 'recurring',
    typicalTiming: 'Every Sunday, 10am–4pm',
    whenText: 'Every Sunday',
    startTime: '10:00',
    endTime: '16:00',
    venue: 'Bondi Beach Public School',
    address: 'Campbell Parade, Bondi Beach NSW 2026',
    suburb: 'Bondi Beach',
    categories: ['markets'],
    audience: ['everyone', 'families'],
    priceType: 'free',
    officialUrl: 'https://www.bondimarkets.com.au/',
    image: null,
    organiser: 'Bondi Markets',
    featured: true,
    status: 'scheduled',
    lastVerified: VERIFIED,
    source: 'https://www.bondimarkets.com.au/',
    relatedArticles: [
      { title: "Bondi's Sunday Markets: your ultimate guide", path: '/bondi-blog/2023/9/4/bond-market-sunday-guide' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
  },
  {
    id: 'sculpture-by-the-sea-bondi',
    slug: 'sculpture-by-the-sea-bondi',
    title: 'Sculpture by the Sea, Bondi',
    summary: "The world's largest free outdoor sculpture exhibition, along the Bondi to Tamarama coastal walk.",
    description: [
      'Each spring, the Bondi to Tamarama coastal walk becomes a free, open-air gallery for Sculpture by the Sea — over a hundred works set against the cliffs and ocean, and one of Sydney’s signature events.',
      'It is free to visit and hugely popular, so go early or late in the day and on a weekday if you can. Exact dates change each year — check the official site to confirm before you plan around it.',
    ],
    timezone: 'Australia/Sydney',
    startDate: '2026-10-16',
    endDate: '2026-11-02',
    recurrence: { freq: 'annual', month: 10 },
    dateStatus: 'announced',
    typicalTiming: 'Late October to early November',
    nextEditionYear: 2026,
    whenText: 'Annual · late October to early November',
    venue: 'Bondi to Tamarama coastal walk',
    suburb: 'Bondi Beach',
    categories: ['arts', 'family', 'community'],
    audience: ['everyone', 'families'],
    priceType: 'free',
    officialUrl: 'https://sculpturebythesea.com/',
    image: null,
    organiser: 'Sculpture by the Sea',
    featured: true,
    status: 'scheduled',
    dateSourceUrl: 'https://sculpturebythesea.com/bondi/',
    dateSourceName: 'Sculpture by the Sea (official)',
    dateVerifiedAt: '2026-08-10',
    lastVerified: VERIFIED,
    source: 'https://sculpturebythesea.com/',
    relatedArticles: [
      { title: 'A practical guide to Sculpture by the Sea', path: '/bondi-blog/2023/9/21/sculptures-by-the-sea-at-bondi-a-comprehensive-guide-to-art-by-the-ocean' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
    ],
  },
  {
    id: 'city2surf',
    slug: 'city2surf',
    title: 'City2Surf',
    summary: "Sydney's iconic 14 km fun run from the CBD, finishing on Bondi Beach.",
    description: [
      'City2Surf is one of the world’s biggest fun runs — a 14 km route from the Sydney CBD out to the coast, finishing on Bondi Beach, famous for the climb up Heartbreak Hill.',
      'Tens of thousands take part, from elite runners to walkers in costume. Entry is ticketed and dates are set each year; confirm the date and register on the official site.',
    ],
    timezone: 'Australia/Sydney',
    recurrence: { freq: 'annual', month: 8 },
    dateStatus: 'tbc',
    typicalTiming: 'The second Sunday of August',
    nextEditionYear: 2027,
    whenText: 'Next edition August 2027 — dates to be announced',
    venue: 'Finishes at Bondi Beach',
    suburb: 'Bondi Beach',
    categories: ['sport', 'fitness', 'community'],
    audience: ['everyone', 'adults'],
    priceType: 'paid',
    officialUrl: 'https://www.city2surf.com.au/',
    ticketUrl: 'https://www.city2surf.com.au/',
    image: null,
    organiser: 'The Sun-Herald City2Surf',
    featured: true,
    status: 'scheduled',
    // The 2026 race ran on 9 August 2026 and has passed; the 2027 date is not yet published.
    // TBC is therefore accurate here — flagged for re-check by scripts/verify-events.mjs.
    dateSourceUrl: 'https://www.city2surf.com.au/',
    dateSourceName: 'Voltaren City2Surf (official)',
    dateVerifiedAt: '2026-08-10',
    lastVerified: VERIFIED,
    source: 'https://www.city2surf.com.au/',
    relatedArticles: [
      { title: 'The ultimate guide to City2Surf', path: '/bondi-blog/ultimate-guide-city-to-surf' },
      { title: 'Where to go: City2Surf afterparty guide', path: '/bondi-blog/where-to-go-afterparty-city-to-surf' },
    ],
  },
  {
    id: 'festival-of-the-winds',
    slug: 'festival-of-the-winds',
    title: 'Festival of the Winds',
    summary: "Sydney's biggest kite festival — a free, colourful family day on Bondi Beach.",
    description: [
      'Festival of the Winds fills the Bondi sky with kites for a free, family-friendly day on the beach — giant display kites, workshops, music and food stalls.',
      'It is run by Waverley Council and is one of the most family-friendly days on the Bondi calendar. Dates are set each year; confirm on the council’s events page.',
    ],
    timezone: 'Australia/Sydney',
    startDate: '2026-09-13',
    endDate: '2026-09-13',
    recurrence: { freq: 'annual', month: 9 },
    dateStatus: 'announced',
    typicalTiming: 'A Sunday in September',
    nextEditionYear: 2026,
    whenText: 'Annual · a Sunday in September',
    venue: 'Bondi Beach',
    suburb: 'Bondi Beach',
    categories: ['family', 'community', 'arts'],
    audience: ['families', 'everyone'],
    priceType: 'free',
    officialUrl: 'https://www.waverley.nsw.gov.au/recreation/arts_and_culture/major_annual_events/fotw',
    image: null,
    organiser: 'Waverley Council',
    featured: false,
    status: 'scheduled',
    dateSourceUrl: 'https://www.waverley.nsw.gov.au/recreation/arts_and_culture/major_annual_events/fotw',
    dateSourceName: 'Waverley Council (official)',
    dateVerifiedAt: '2026-08-10',
    lastVerified: VERIFIED,
    source: 'https://www.waverley.nsw.gov.au/',
    relatedArticles: [
      { title: 'Festival of the Winds at Bondi Beach', path: '/bondi-blog/2023/9/9/soaring-high-at-bondi-beach-festival-of-the-winds' },
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
    ],
  },
  {
    id: 'flickerfest',
    slug: 'flickerfest',
    title: 'Flickerfest',
    summary: "Australia's leading short film festival, held at the Bondi Pavilion each summer.",
    description: [
      'Flickerfest is Australia’s premier Academy-qualifying short film festival, screening the best short films from Australia and around the world at the open-air Bondi Pavilion.',
      'Warm summer evenings, a beachfront setting and a great program make it a Bondi highlight. Sessions are ticketed; confirm dates and book on the official site.',
    ],
    timezone: 'Australia/Sydney',
    startDate: '2027-01-22',
    endDate: '2027-01-31',
    recurrence: { freq: 'annual', month: 1 },
    dateStatus: 'announced',
    typicalTiming: 'Ten days in late January',
    nextEditionYear: 2027,
    whenText: 'Annual · late January',
    venue: 'Bondi Pavilion',
    address: 'Queen Elizabeth Drive, Bondi Beach NSW 2026',
    suburb: 'Bondi Beach',
    categories: ['arts', 'nightlife'],
    audience: ['adults', 'everyone'],
    priceType: 'paid',
    officialUrl: 'https://flickerfest.com.au/',
    ticketUrl: 'https://flickerfest.com.au/',
    image: null,
    organiser: 'Flickerfest',
    featured: false,
    status: 'scheduled',
    dateSourceUrl: 'https://flickerfest.com.au/tour/',
    dateSourceName: 'Flickerfest (official)',
    dateVerifiedAt: '2026-08-10',
    lastVerified: VERIFIED,
    source: 'https://flickerfest.com.au/',
    relatedArticles: [
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
  },
  {
    id: 'bondi-new-years-eve',
    slug: 'bondi-new-years-eve',
    title: "New Year's Eve at Bondi Beach",
    summary: 'See in the new year on Bondi Beach — a Sydney summer tradition on the sand.',
    description: [
      "Bondi Beach is one of Sydney’s classic spots to see in the new year, with a summer-night atmosphere on the sand. In recent years the beachfront has hosted a ticketed New Year’s Eve event alongside the wider public celebrations.",
      'Access, ticketing and the program change year to year — confirm the current arrangements on the council’s site before you plan your night.',
    ],
    timezone: 'Australia/Sydney',
    recurrence: { freq: 'annual', month: 12, day: 31 },
    dateStatus: 'confirmed',
    typicalTiming: '31 December, every year',
    nextEditionYear: 2026,
    whenText: 'Every 31 December',
    venue: 'Bondi Beach',
    suburb: 'Bondi Beach',
    categories: ['seasonal', 'community', 'nightlife'],
    audience: ['everyone', 'adults'],
    priceType: 'varies',
    officialUrl: 'https://www.waverley.nsw.gov.au/',
    image: null,
    organiser: 'Waverley Council',
    featured: false,
    status: 'scheduled',
    // The date is fixed (31 Dec); only the ticketed program/access varies year to year.
    dateSourceUrl: 'https://www.waverley.nsw.gov.au/',
    dateSourceName: 'Waverley Council (official)',
    dateVerifiedAt: '2026-08-10',
    lastVerified: VERIFIED,
    source: 'https://www.waverley.nsw.gov.au/',
    relatedArticles: [
      { title: "An insider's guide to New Year's Eve in Bondi", path: '/bondi-blog/2023/12/24/insiders-guide-to-new-years-eve-at-bondi-beach' },
    ],
  },
];

export function getEvent(slug: string): BondiEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export function eventSlugs(): string[] {
  return EVENTS.map((e) => e.slug);
}
