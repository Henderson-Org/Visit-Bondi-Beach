/**
 * Fitness & wellness venue dataset — the single source of truth behind /fitness.
 *
 * INTEGRITY RULES FOR THIS FILE (they are the whole point of it):
 *
 *  1. Every record is a real business verified against its OWN official website on the
 *     date in `lastVerified`, with the URLs used recorded in `sources`. A venue we could
 *     not verify does not go in, however well known it is.
 *  2. SUBURB IS A FACT, NOT A MARKETING CHOICE. `suburb` is the real suburb from the
 *     venue's own published address. Bondi Junction is NOT Bondi Beach — it is a separate
 *     suburb (postcode 2022) about 2.5 km inland, and describing a Bondi Junction business
 *     as being at the beach is exactly the error this field exists to prevent.
 *  3. NO INVENTED FACTS. No prices, ratings, reviews, class timetables or facilities that
 *     the official site does not state. Volatile things (prices, timetables) are
 *     deliberately NOT stored — the pages send people to the official site instead. Where
 *     a field is unknown it is omitted, never guessed.
 *  4. One record per business. Categories are tags on the record, so a venue that does
 *     both yoga and pilates appears on both category pages without being duplicated.
 *
 * To add a venue: verify it on its official site, then append a record with its real
 * suburb, the categories it genuinely offers, and the source URLs you checked. Every
 * page, category listing, map module and schema block picks it up automatically.
 */

/** Real suburbs. Separate entries because they are separate places with separate postcodes. */
export type FitnessSuburb = 'bondi-beach' | 'bondi-junction' | 'north-bondi' | 'bondi' | 'tamarama' | 'bronte';

export const SUBURB_LABEL: Record<FitnessSuburb, string> = {
  'bondi-beach': 'Bondi Beach',
  'bondi-junction': 'Bondi Junction',
  'north-bondi': 'North Bondi',
  bondi: 'Bondi',
  tamarama: 'Tamarama',
  bronte: 'Bronte',
};

export const SUBURB_POSTCODE: Record<FitnessSuburb, string> = {
  'bondi-beach': '2026',
  'bondi-junction': '2022',
  'north-bondi': '2026',
  bondi: '2026',
  tamarama: '2026',
  bronte: '2024',
};

/**
 * What a visitor is actually looking for. These drive the category pages, so each one
 * has to describe a real search intent - not a keyword permutation.
 */
export type FitnessCategory =
  | 'gym'
  | 'pilates'
  | 'yoga'
  | 'swimming'
  | 'recovery'
  | 'personal-training'
  | 'group-classes';

export const CATEGORY_LABEL: Record<FitnessCategory, string> = {
  gym: 'Gyms',
  pilates: 'Pilates',
  yoga: 'Yoga',
  swimming: 'Swimming',
  recovery: 'Recovery & wellness',
  'personal-training': 'Personal training',
  'group-classes': 'Group classes',
};

export interface FitnessVenue {
  id: string;
  name: string;
  suburb: FitnessSuburb;
  /** Street address exactly as the venue publishes it, without the suburb/postcode tail. */
  address: string;
  categories: FitnessCategory[];
  /** One or two factual sentences. Describes what it is, never how good it is. */
  description: string;
  /**
   * Can someone train here without joining? 'yes' only where the official site states a
   * casual visit, single session, day pass or trial. 'unknown' is the honest default and
   * renders as "check the official site" rather than a guess.
   */
  casualVisit: 'yes' | 'unknown';
  /** What the official site says the casual option IS - never the price, which moves. */
  casualNote?: string;
  /** Membership / class model in the venue's own terms. */
  membershipModel?: string;
  /** Only facilities the official site actually lists. */
  facilities?: string[];
  /** Only where the venue publishes accessibility information. Omitted otherwise. */
  accessibility?: string;
  websiteUrl: string;
  bookingUrl?: string;
  phone?: string;
  /** Opening hours as published. Omitted when the site states none - never invented. */
  openingHours?: string;
  /** ISO date the record was last checked against the sources below. */
  lastVerified: string;
  /** The URLs actually used to verify this record. */
  sources: { label: string; url: string }[];
  /** Hidden from listings but kept for the record if a venue closes. */
  active?: boolean;
}

const V = '2026-09-05';

export const FITNESS_VENUES: FitnessVenue[] = [
  /* ─────────────── Bondi Beach ─────────────── */
  {
    id: 'beachouse-bondi',
    name: 'Beachouse Bondi',
    suburb: 'bondi-beach',
    address: 'L1/180 Campbell Parade',
    categories: ['gym', 'recovery'],
    description:
      'A gym on the first floor above Campbell Parade, directly opposite the beach, paired with 38° The Bathhouse recovery rooms in the same building.',
    casualVisit: 'yes',
    casualNote: 'The site lists single entry passes alongside weekly and prepaid options.',
    membershipModel: 'Weekly, prepaid and single entry passes, managed through their app.',
    facilities: ['Gym floor with free weights and machines', 'Magnesium hot pools', 'Cold plunge', 'Sauna', 'Steam room'],
    websiteUrl: 'https://www.beachousebondi.com/',
    phone: '0484 243 085',
    openingHours: 'Mon–Thu 6am–9pm, Fri 6am–8pm, Sat–Sun 7am–5:30pm',
    lastVerified: V,
    sources: [{ label: 'Beachouse Bondi — official site', url: 'https://www.beachousebondi.com/' }],
  },
  {
    id: 'the-well-bondi',
    name: 'The Well Bondi',
    suburb: 'bondi-beach',
    address: '78 Campbell Parade',
    categories: ['gym', 'recovery', 'personal-training', 'group-classes'],
    description:
      'A gym and recovery space on Campbell Parade combining a training floor, group classes, personal training and a recovery zone.',
    casualVisit: 'yes',
    casualNote: 'The site publishes single sessions and packs as well as membership.',
    membershipModel: 'Membership, or single sessions and class packs.',
    facilities: ['Gym floor', 'Recovery zone', 'Personal training', 'Group classes'],
    websiteUrl: 'https://thewellbondi.com.au/',
    bookingUrl: 'https://thewellbondi.com.au/membership/single-sessions-packs/',
    phone: '02 9057 2100',
    lastVerified: V,
    sources: [
      { label: 'The Well Bondi — official site', url: 'https://thewellbondi.com.au/' },
      { label: 'The Well Bondi — single sessions & packs', url: 'https://thewellbondi.com.au/membership/single-sessions-packs/' },
    ],
  },
  {
    id: 'bondi-icebergs-gym',
    name: 'Bondi Icebergs Gym',
    suburb: 'bondi-beach',
    address: '1 Notts Avenue',
    categories: ['gym', 'personal-training'],
    description:
      'A gym in the Icebergs building at the southern end of Bondi Beach, in the same clifftop complex as the ocean pool.',
    casualVisit: 'unknown',
    websiteUrl: 'https://www.bondiicebergsgym.com/',
    lastVerified: V,
    sources: [{ label: 'Bondi Icebergs Gym — official site', url: 'https://www.bondiicebergsgym.com/' }],
  },
  {
    id: 'bondi-icebergs-pool',
    name: 'Bondi Icebergs Club Pool',
    suburb: 'bondi-beach',
    address: '1 Notts Avenue',
    categories: ['swimming'],
    description:
      'The saltwater ocean pool at the southern end of Bondi Beach — a 50m main pool and a separate children’s pool, cut into the rocks so the surf washes over the edge at high tide.',
    casualVisit: 'unknown',
    casualNote: 'The club publishes pool hours but not casual entry terms — check before you go.',
    membershipModel: 'Swimming and social memberships are offered alongside public pool access.',
    facilities: ['50m main pool', 'Children’s pool', 'Sauna', 'Change rooms'],
    websiteUrl: 'https://icebergs.com.au/pool-conditions/',
    phone: '(02) 9130 4804',
    openingHours: 'Mon–Fri 6am–6:30pm, Sat–Sun 6:30am–6:30pm. Closed Thursdays for cleaning, weather depending.',
    lastVerified: V,
    sources: [{ label: 'Bondi Icebergs Club — pool conditions', url: 'https://icebergs.com.au/pool-conditions/' }],
  },
  {
    id: 'bodymindlife-bondi',
    name: 'BodyMindLife Bondi Beach',
    suburb: 'bondi-beach',
    address: '40 Hall Street',
    categories: ['yoga', 'pilates', 'group-classes', 'recovery'],
    description:
      'A yoga and reformer pilates studio on Hall Street, a block back from the beach, running classes seven days a week.',
    casualVisit: 'yes',
    casualNote: 'Drop-in class passes and an introductory trial pass are both published, the trial at the Bondi Beach studio only.',
    membershipModel: 'Weekly membership covering yoga and pilates, or drop-in passes.',
    facilities: ['Yoga studios', 'Reformer pilates', 'Sauna therapy', 'Air filtration and infrared heating'],
    websiteUrl: 'https://www.bodymindlife.com/',
    bookingUrl: 'https://www.bodymindlife.com/our-classes',
    openingHours: 'Classes seven days; studios open 15 minutes before each class.',
    lastVerified: V,
    sources: [{ label: 'BodyMindLife — official site', url: 'https://www.bodymindlife.com/' }],
  },
  {
    id: 'fluidform-bondi',
    name: 'Fluidform Pilates Bondi',
    suburb: 'bondi-beach',
    address: '136–138 Curlewis Street',
    categories: ['pilates', 'group-classes'],
    description:
      'A reformer and mat pilates studio on Curlewis Street, running graded group classes and smaller equipment sessions.',
    casualVisit: 'yes',
    casualNote: 'Casual single classes and a new-client intro pack are both published.',
    membershipModel: 'Weekly membership, class packs, or casual single classes.',
    facilities: ['Reformer studio', 'Mat and small equipment classes'],
    websiteUrl: 'https://www.fluidformpilates.com/our-studios/bondi-pilates-studio/',
    lastVerified: V,
    sources: [{ label: 'Fluidform Pilates — Bondi studio', url: 'https://www.fluidformpilates.com/our-studios/bondi-pilates-studio/' }],
  },
  {
    id: 'balance-moves-bondi',
    name: 'Balance Moves Bondi',
    suburb: 'bondi-beach',
    address: '72–74 Hall Street',
    categories: ['pilates', 'group-classes'],
    description:
      'A pilates and barre studio on Hall Street offering reformer and mat classes, barre, and private and pregnancy sessions.',
    casualVisit: 'unknown',
    membershipModel: 'Group classes plus private, duet and pregnancy pilates.',
    websiteUrl: 'https://www.balancemoves.com.au/',
    lastVerified: V,
    sources: [{ label: 'Balance Moves — official site', url: 'https://www.balancemoves.com.au/' }],
  },

  {
    id: 'sarana-bondi',
    name: 'Sarana Bondi — Yoga & Pilates',
    suburb: 'bondi-beach',
    address: '4 Jaques Avenue',
    categories: ['yoga', 'pilates', 'group-classes'],
    description:
      'A yoga and pilates studio on Jaques Avenue, just off Campbell Parade behind the north end of the beach, running both disciplines from the one space.',
    casualVisit: 'unknown',
    websiteUrl: 'https://saranabondi.com.au/',
    lastVerified: V,
    sources: [{ label: 'Sarana Bondi — official site', url: 'https://saranabondi.com.au/' }],
  },
  {
    id: 'kiel-x-vrtus',
    name: 'Kiel x VRTUS',
    suburb: 'bondi-beach',
    address: '207 Bondi Road',
    categories: ['pilates', 'recovery'],
    description:
      'A reformer pilates studio on Bondi Road sharing its site with VRTUS physiotherapy, so rehab and pilates run from the same address.',
    casualVisit: 'unknown',
    websiteUrl: 'https://www.vrtus.com.au/',
    phone: '0475 849 161',
    lastVerified: V,
    // Their own site publishes this address as "Bondi Beach, NSW 2026", so that is what we
    // record - we do not second-guess a business about its own published address.
    sources: [{ label: 'VRTUS — official site', url: 'https://www.vrtus.com.au/' }],
  },
  {
    id: 'lean-bean-fitness-bondi',
    name: 'Lean Bean Fitness Bondi',
    suburb: 'bondi',
    address: '178 Beach House Lane, Campbell Parade',
    categories: ['pilates', 'group-classes'],
    description: 'A pilates studio off Campbell Parade running small group classes, with an online streaming option as well.',
    casualVisit: 'yes',
    casualNote: 'A seven-day free trial is published on their site.',
    websiteUrl: 'https://leanbeanfitness.com/',
    lastVerified: V,
    // Published by the venue as "Bondi NSW 2026" rather than Bondi Beach.
    sources: [{ label: 'Lean Bean Fitness — contact page', url: 'https://leanbeanfitness.com/contact' }],
  },
  {
    id: 'the-wellness-studio-bondi',
    name: 'The Wellness Studio',
    suburb: 'bondi',
    address: '290 Bondi Road (access via Castlefield Lane)',
    categories: ['yoga', 'pilates', 'recovery', 'group-classes'],
    description:
      'A studio on Bondi Road running yin and infrared-heated vinyasa yoga, mat pilates and holistic healing sessions. They also operate a second studio in Bronte.',
    casualVisit: 'unknown',
    facilities: ['Infrared heated studio', 'Yoga and mat pilates', 'Energy healing and sound healing'],
    websiteUrl: 'https://www.thewellnessstudio.com.au/',
    lastVerified: V,
    sources: [{ label: 'The Wellness Studio — official site', url: 'https://www.thewellnessstudio.com.au/' }],
  },

  /* ─────────────── North Bondi (2026, the quieter end past the beach) ─────────────── */
  {
    id: 'body-by-berner',
    name: 'Body By Berner',
    suburb: 'north-bondi',
    address: '300 Campbell Parade',
    categories: ['pilates', 'group-classes', 'recovery'],
    description:
      'A pilates studio at the North Bondi end of Campbell Parade that also runs sound healing, breathwork and meditation alongside its classes.',
    casualVisit: 'yes',
    casualNote: 'An introductory offer covering unlimited classes for new clients is published on their site.',
    membershipModel: 'Memberships and class packs, with an intro offer for new clients.',
    facilities: ['Pilates studio', 'Sound healing', 'Breathwork and meditation'],
    websiteUrl: 'https://www.bodybyberner.com/',
    lastVerified: V,
    sources: [{ label: 'Body By Berner — official site', url: 'https://www.bodybyberner.com/' }],
  },
  {
    id: 'gemma-clarke-pilates',
    name: 'Gemma Clarke Pilates',
    suburb: 'north-bondi',
    address: '10 Curlewis Street',
    categories: ['pilates', 'personal-training'],
    description: 'A small pilates studio on Curlewis Street at the North Bondi end, working with small groups and individuals.',
    casualVisit: 'unknown',
    websiteUrl: 'https://www.gemmaclarkepilates.com/',
    lastVerified: V,
    sources: [{ label: 'Gemma Clarke Pilates — official site', url: 'https://www.gemmaclarkepilates.com/' }],
  },
  {
    id: 'sea-sculpt-pilates',
    name: 'Sea Sculpt Pilates',
    suburb: 'north-bondi',
    address: '111 Ramsgate Avenue',
    categories: ['pilates', 'group-classes'],
    description:
      'A pilates studio at Ben Buckler in North Bondi that also runs sessions outdoors, including at Tamarama Beach — one of the few genuinely open-air options around here.',
    casualVisit: 'unknown',
    casualNote: 'Their site publishes booking rules and a live timetable — check there before a first class.',
    websiteUrl: 'https://www.seasculptpilates.com.au/',
    lastVerified: V,
    sources: [{ label: 'Sea Sculpt Pilates — official site', url: 'https://www.seasculptpilates.com.au/' }],
  },

  /* ─────────────── Bondi Junction (a separate suburb, 2.5km inland) ─────────────── */
  {
    id: 'healing-on-spring',
    name: 'Healing on Spring',
    suburb: 'bondi-junction',
    address: '1/60 Spring Street',
    categories: ['recovery'],
    description:
      'A recovery and wellness studio on Spring Street offering red light therapy and lymphatic drainage massage. It is a recovery space rather than a gym or class studio.',
    casualVisit: 'unknown',
    facilities: ['Red light therapy', 'Lymphatic drainage massage'],
    websiteUrl: 'https://healingonspring.com/',
    lastVerified: V,
    sources: [{ label: 'Healing on Spring — official site', url: 'https://healingonspring.com/' }],
  },
  {
    id: 'virgin-active-bondi-junction',
    name: 'Virgin Active Bondi Westfield',
    suburb: 'bondi-junction',
    address: 'Level 1, 500 Oxford Street (Westfield Bondi Junction)',
    categories: ['gym', 'pilates', 'recovery', 'group-classes'],
    description:
      'A large indoor club inside Westfield Bondi Junction, with a full gym floor, reformer pilates and group classes, and a recovery area. Despite the brand name it is in Bondi Junction, not at the beach.',
    casualVisit: 'yes',
    casualNote: 'A free trial is offered through their site; day-pass terms are not published.',
    facilities: [
      'Large gym floor',
      'Reformer pilates and group classes',
      'Infrared and traditional saunas',
      'Cold plunge and spa',
      'Large changerooms',
      'Health food cafe',
      'Co-working space',
    ],
    websiteUrl: 'https://www.virginactive.com.au/locations/bondi-westfield',
    bookingUrl: 'https://www.virginactive.com.au/free-trial',
    phone: '(02) 8260 5800',
    openingHours: 'Mon–Thu 5:30am–10pm, Fri 5:30am–9pm, Sat–Sun & public holidays 6:30am–7pm',
    lastVerified: V,
    sources: [{ label: 'Virgin Active Bondi Westfield — official page', url: 'https://www.virginactive.com.au/locations/bondi-westfield' }],
  },
  {
    id: 'kx-pilates-bondi-junction',
    name: 'KX Pilates Bondi Junction',
    suburb: 'bondi-junction',
    address: '4/360 Oxford Street',
    categories: ['pilates', 'group-classes'],
    description: 'A group reformer pilates studio on Oxford Street, running fixed-format 50-minute classes.',
    casualVisit: 'yes',
    casualNote: 'An introductory pack for new clients is published on the studio page.',
    membershipModel: 'Group reformer classes, with an intro pack for new clients.',
    websiteUrl: 'https://kxpilates.com/au/studio/bondi-junction-pilates-studio',
    phone: '(02) 9184 7941',
    lastVerified: V,
    sources: [{ label: 'KX Pilates — Bondi Junction studio', url: 'https://kxpilates.com/au/studio/bondi-junction-pilates-studio' }],
  },
  {
    id: 'the-loft-pilates-bondi-junction',
    name: 'The Loft Pilates Bondi Junction',
    suburb: 'bondi-junction',
    address: '434 Oxford Street',
    categories: ['pilates', 'group-classes'],
    description: 'A pilates studio at the eastern end of Oxford Street, close to the Bondi Junction transport interchange.',
    casualVisit: 'unknown',
    casualNote: 'The studio publishes a pricing and trials page — check it for current casual options.',
    websiteUrl: 'https://www.theloftpilates.com.au/bondi',
    phone: '+61 451 096 657',
    lastVerified: V,
    sources: [{ label: 'The Loft Pilates — Bondi Junction', url: 'https://www.theloftpilates.com.au/bondi' }],
  },
];
