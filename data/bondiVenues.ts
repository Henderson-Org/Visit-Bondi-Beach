/**
 * Bondi venue dataset for the Day Planner.
 *
 * INTEGRITY: real, well-known Bondi-area venues only. Editorial 0–10 scores
 * (quality/localFavourite/iconic/view) are our opinionated weightings - that's by
 * design. Factual, volatile fields (opening days/hours) are structured so they can be
 * maintained, and each carries `hoursVerified`: where false, the hours are sensible
 * placeholders to be confirmed (see README). Coordinates are approximate; sequencing
 * runs off `zone`, not raw lat/lon. No prices or menus are invented.
 *
 * Add a venue: append an object below with a unique id, a `zone`, `idealMeal`,
 * price/scores and opening days/hours. It's picked up by scoring and generation
 * automatically.
 */
import type { Zone } from '@/lib/bondiZones';
import type { FoodStyle, Interest, MealSlot } from '@/types/preferences';

export type VenueType = 'cafe' | 'restaurant' | 'bar' | 'takeaway' | 'bakery' | 'pub';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

/**
 * Collection tags - the visitor-facing dining taxonomy that powers the eat & drink
 * category pages, hub sections and in-article venue lists. A venue can carry several.
 * Editorial, durable groupings (NOT volatile facts).
 */
export type DiningTag =
  | 'best-restaurants'
  | 'fine-dining'
  | 'cheap-eats'
  | 'breakfast-brunch'
  | 'cafe-coffee'
  | 'waterfront-dining'
  | 'seafood'
  | 'best-bars'
  | 'cocktail-bars'
  | 'sunset-drinks'
  | 'pubs'
  | 'sports-bars'
  | 'late-night'
  | 'vegan-vegetarian'
  | 'family-friendly'
  | 'date-night'
  | 'groups'
  | 'bakery-sweets';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  cuisine: string[];
  zone: Zone;
  latitude: number;
  longitude: number;
  priceLevel: 1 | 2 | 3 | 4;
  qualityScore: number; // 0–10 editorial
  localFavouriteScore: number; // 0–10
  iconicScore: number; // 0–10
  viewScore: number; // 0–10
  /** Food styles this venue satisfies (matched against the visitor's foodStyles). */
  categories: FoodStyle[];
  /** Broader interests this venue supports. */
  suitableFor: Interest[];
  idealMeal: MealSlot[];
  idealTimeOfDay: ('early' | 'morning' | 'midday' | 'afternoon' | 'evening')[];
  openingDays: Weekday[];
  openingHours: { open: string; close: string }; // typical daily window, 24h
  hoursVerified: boolean;
  bookingRecommended: boolean;
  bookingRequired: boolean;
  typicalMealDuration: number; // minutes
  atmosphere: string[];
  dietaryOptions: string[];
  nearbyExperiences: string[]; // experience ids
  shortDescription: string;
  whyGo: string;
  websiteUrl: string;
  image: string | null;
  lastVerified: string;

  /* ---- Article/guide engine fields (optional; the planner ignores these) ---- */
  /** Human neighbourhood/street orientation (durable geography), e.g. "Hall Street". */
  neighbourhood?: string;
  /** Street address where verified (durable public fact); omitted otherwise. */
  address?: string;
  /** Collection memberships that drive category pages, hub sections and in-article lists. */
  diningTags?: DiningTag[];
  /** One durable, factual "known for" note (a signature dish/drink/feature) - never invented. */
  signatureNote?: string;
  /** Official booking/reservation URL (or affiliate deep link) when verified. */
  bookingUrl?: string;
  /** True when a full editorial venue guide exists at /bondi-eat-and-drink/<id>. */
  hasGuide?: boolean;
  /** Directory status. Inactive venues are hidden from listings but kept for the record. */
  active?: boolean;
  /** Where the venue's durable details were verified. */
  sources?: { label: string; url: string }[];
}

const V = '2026-08-08';

export const BONDI_VENUES: Venue[] = [
  {
    id: 'seans',
    name: "Sean's",
    type: 'restaurant',
    cuisine: ['modern-australian'],
    zone: 'central-bondi',
    latitude: -33.8869, longitude: 151.2743,
    priceLevel: 4,
    qualityScore: 9.5, localFavouriteScore: 9.5, iconicScore: 8, viewScore: 4,
    categories: ['modern-au', 'special-occasion', 'fine-dining'],
    suitableFor: ['food', 'relaxing', 'iconic'],
    idealMeal: ['lunch', 'dinner'],
    idealTimeOfDay: ['midday', 'afternoon', 'evening'],
    openingDays: [0, 3, 4, 5, 6],
    openingHours: { open: '12:00', close: '22:00' },
    hoursVerified: true,
    bookingRecommended: true, bookingRequired: true,
    typicalMealDuration: 120,
    atmosphere: ['intimate', 'understated', 'special'],
    dietaryOptions: ['vegetarian'],
    nearbyExperiences: ['bondi-beach', 'bondi-promenade', 'icebergs-pool'],
    shortDescription: 'Sean Moran’s beloved, produce-led Bondi institution on Campbell Parade, going since 1993.',
    whyGo: 'A standout, ingredient-first long lunch or dinner - one of the great Bondi dining experiences.',
    neighbourhood: 'Campbell Parade',
    diningTags: ['best-restaurants', 'fine-dining', 'date-night'],
    websiteUrl: 'https://seansbondi.com/',
    image: null,
    lastVerified: V,
  },
  {
    id: 'icebergs-dining',
    name: 'Icebergs Dining Room and Bar',
    type: 'restaurant',
    cuisine: ['italian', 'seafood'],
    zone: 'south-bondi',
    latitude: -33.8915, longitude: 151.2769,
    priceLevel: 4,
    qualityScore: 9, localFavouriteScore: 8, iconicScore: 10, viewScore: 10,
    categories: ['modern-au', 'fine-dining', 'special-occasion', 'cocktails', 'sunset-drinks', 'seafood'],
    suitableFor: ['food', 'iconic', 'photography', 'nightlife', 'relaxing'],
    idealMeal: ['lunch', 'dinner', 'drinks'],
    idealTimeOfDay: ['midday', 'afternoon', 'evening'],
    openingDays: [0, 2, 3, 4, 5, 6],
    openingHours: { open: '12:00', close: '22:00' },
    hoursVerified: false,
    bookingRecommended: true, bookingRequired: true,
    typicalMealDuration: 120,
    atmosphere: ['glamorous', 'iconic', 'view'],
    dietaryOptions: ['vegetarian', 'gluten-free'],
    nearbyExperiences: ['icebergs-pool', 'bondi-beach', 'bondi-tamarama-walk'],
    shortDescription: 'Glamorous cliff-top Italian above the Icebergs pool - one of Sydney’s most iconic dining views.',
    whyGo: 'Food and one of Bondi’s most iconic locations in one experience - book for lunch, sunset drinks or dinner.',
    neighbourhood: 'Notts Avenue, above the Icebergs pool',
    diningTags: ['best-restaurants', 'fine-dining', 'waterfront-dining', 'seafood', 'sunset-drinks', 'best-bars', 'date-night'],
    websiteUrl: 'https://idrb.com/',
    image: null,
    lastVerified: V,
  },
  {
    id: 'raw-bar',
    name: 'Raw Bar',
    type: 'restaurant',
    cuisine: ['japanese', 'sushi', 'seafood'],
    zone: 'central-bondi',
    latitude: -33.8894, longitude: 151.2751,
    priceLevel: 3,
    qualityScore: 8.5, localFavouriteScore: 9, iconicScore: 6, viewScore: 3,
    categories: ['japanese', 'seafood', 'casual'],
    suitableFor: ['food'],
    idealMeal: ['lunch', 'dinner'],
    idealTimeOfDay: ['midday', 'afternoon', 'evening'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '12:00', close: '21:30' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 75,
    atmosphere: ['casual', 'buzzy', 'local'],
    dietaryOptions: ['gluten-free'],
    nearbyExperiences: ['bondi-beach', 'gould-street', 'bondi-promenade'],
    shortDescription: 'Long-running Bondi sushi and sashimi spot on Campbell Parade - a local casual-quality favourite.',
    whyGo: 'The pick for Japanese and seafood done casually but well, a short walk from the sand.',
    neighbourhood: 'Campbell Parade',
    diningTags: ['best-restaurants', 'seafood'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'north-bondi-fish',
    name: 'North Bondi Fish',
    type: 'restaurant',
    cuisine: ['seafood'],
    zone: 'north-bondi',
    latitude: -33.8873, longitude: 151.2792,
    priceLevel: 3,
    qualityScore: 8, localFavouriteScore: 8, iconicScore: 7, viewScore: 9,
    categories: ['seafood', 'casual', 'cocktails'],
    suitableFor: ['food', 'relaxing', 'family', 'iconic'],
    idealMeal: ['lunch', 'dinner', 'drinks'],
    idealTimeOfDay: ['midday', 'afternoon', 'evening'],
    openingDays: [0, 3, 4, 5, 6],
    openingHours: { open: '12:00', close: '22:00' },
    hoursVerified: true,
    bookingRecommended: true, bookingRequired: false,
    typicalMealDuration: 90,
    atmosphere: ['beachfront', 'relaxed', 'view'],
    dietaryOptions: ['gluten-free'],
    nearbyExperiences: ['north-bondi-beach', 'ben-buckler', 'bondi-beach'],
    shortDescription: 'Beachfront seafood at the north end of Bondi - sashimi, calamari, fish and chips with the sand at the door.',
    whyGo: 'The most beachfront seafood lunch in Bondi, relaxed enough for families.',
    neighbourhood: 'Ramsgate Avenue, North Bondi',
    diningTags: ['best-restaurants', 'seafood', 'waterfront-dining', 'family-friendly'],
    websiteUrl: 'https://northbondifish.com.au/',
    image: null,
    lastVerified: V,
  },
  {
    id: 'porch-and-parlour',
    name: 'Porch & Parlour',
    type: 'cafe',
    cuisine: ['cafe', 'healthy'],
    zone: 'north-bondi',
    latitude: -33.8877, longitude: 151.2785,
    priceLevel: 2,
    qualityScore: 8.5, localFavouriteScore: 9, iconicScore: 6, viewScore: 4,
    categories: ['brunch', 'coffee', 'healthy', 'casual'],
    suitableFor: ['food', 'coffee', 'relaxing', 'family'],
    idealMeal: ['coffee', 'breakfast', 'brunch'],
    idealTimeOfDay: ['early', 'morning', 'midday'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '07:00', close: '15:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 60,
    atmosphere: ['relaxed', 'local', 'dog-friendly'],
    dietaryOptions: ['vegetarian', 'vegan', 'gluten-free'],
    nearbyExperiences: ['north-bondi-beach', 'bondi-beach'],
    shortDescription: 'A long-running North Bondi brunch favourite built around local produce and good coffee.',
    whyGo: 'The morning anchor for a relaxed, healthy North Bondi start - pea pancakes and a flat white.',
    neighbourhood: 'Wairoa Avenue, North Bondi',
    diningTags: ['breakfast-brunch', 'cafe-coffee', 'vegan-vegetarian', 'family-friendly'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'speedos',
    name: 'Speedos Cafe',
    type: 'cafe',
    cuisine: ['cafe', 'healthy'],
    zone: 'north-bondi',
    latitude: -33.8869, longitude: 151.2801,
    priceLevel: 2,
    qualityScore: 8, localFavouriteScore: 8, iconicScore: 7, viewScore: 8,
    categories: ['brunch', 'coffee', 'healthy'],
    suitableFor: ['food', 'coffee', 'photography', 'relaxing'],
    idealMeal: ['coffee', 'breakfast', 'brunch'],
    idealTimeOfDay: ['early', 'morning', 'midday'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '06:30', close: '14:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 60,
    atmosphere: ['beachy', 'view', 'photogenic'],
    dietaryOptions: ['vegetarian', 'vegan'],
    nearbyExperiences: ['north-bondi-beach', 'ben-buckler', 'bondi-sunrise'],
    shortDescription: 'North Bondi café with ocean views, healthy brunch plates and a photogenic setting.',
    whyGo: 'The best view-first breakfast to kick off a North Bondi morning.',
    neighbourhood: 'Ramsgate Avenue, North Bondi',
    diningTags: ['breakfast-brunch', 'cafe-coffee', 'waterfront-dining', 'vegan-vegetarian'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'bills',
    name: 'bills Bondi',
    type: 'cafe',
    cuisine: ['cafe', 'modern-australian'],
    zone: 'gould-hall',
    latitude: -33.8901, longitude: 151.2748,
    priceLevel: 3,
    qualityScore: 8.5, localFavouriteScore: 7.5, iconicScore: 8, viewScore: 3,
    categories: ['brunch', 'coffee', 'modern-au'],
    suitableFor: ['food', 'coffee', 'iconic'],
    idealMeal: ['breakfast', 'brunch', 'lunch'],
    idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '07:00', close: '22:00' },
    hoursVerified: true,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 75,
    atmosphere: ['light', 'iconic', 'classic'],
    dietaryOptions: ['vegetarian', 'gluten-free'],
    nearbyExperiences: ['hall-street', 'bondi-beach'],
    shortDescription: 'The Sydney institution founded by Bill Granger - famous ricotta hotcakes and sweetcorn fritters, on Hall Street.',
    whyGo: 'A benchmark Bondi brunch and a slice of Sydney food history.',
    neighbourhood: 'Hall Street',
    diningTags: ['breakfast-brunch', 'cafe-coffee'],
    websiteUrl: 'https://www.bills.com.au/locations/bondi-beach',
    image: null,
    lastVerified: V,
  },
  {
    id: 'lox-stock-barrel',
    name: 'Lox Stock & Barrel',
    type: 'cafe',
    cuisine: ['cafe', 'jewish-deli'],
    zone: 'gould-hall',
    latitude: -33.8904, longitude: 151.2741,
    priceLevel: 2,
    qualityScore: 8, localFavouriteScore: 8.5, iconicScore: 6, viewScore: 2,
    categories: ['brunch', 'casual', 'coffee'],
    suitableFor: ['food', 'coffee'],
    idealMeal: ['breakfast', 'brunch', 'lunch'],
    idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '07:00', close: '15:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 60,
    atmosphere: ['neighbourhood', 'deli'],
    dietaryOptions: ['vegetarian'],
    nearbyExperiences: ['hall-street', 'bondi-beach'],
    shortDescription: 'A Bondi take on a Jewish deli - artisan bagels and generous brunch plates on Glenayr Avenue.',
    whyGo: 'The bagel-led breakfast or easy weekday lunch a little back from the beach.',
    neighbourhood: 'Glenayr Avenue',
    diningTags: ['breakfast-brunch', 'cafe-coffee', 'cheap-eats'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'tottis',
    name: "Totti's Bondi",
    type: 'restaurant',
    cuisine: ['italian'],
    zone: 'gould-hall',
    latitude: -33.8917, longitude: 151.2668,
    priceLevel: 3,
    qualityScore: 8.5, localFavouriteScore: 8, iconicScore: 7, viewScore: 3,
    categories: ['modern-au', 'special-occasion', 'casual'],
    suitableFor: ['food', 'relaxing', 'nightlife'],
    idealMeal: ['lunch', 'dinner'],
    idealTimeOfDay: ['midday', 'afternoon', 'evening'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '12:00', close: '22:00' },
    hoursVerified: false,
    bookingRecommended: true, bookingRequired: true,
    typicalMealDuration: 120,
    atmosphere: ['convivial', 'sunny', 'group'],
    dietaryOptions: ['vegetarian'],
    nearbyExperiences: ['bondi-beach'],
    shortDescription: 'Merivale’s crowd-pleasing Italian behind The Royal on Bondi Road - famous wood-fired bread and share plates.',
    whyGo: 'The go-to for a group Italian lunch or a long, boozy afternoon.',
    neighbourhood: 'Bondi Road (behind The Royal)',
    diningTags: ['best-restaurants', 'groups', 'date-night'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'harrys-bondi',
    name: "Harry's Bondi",
    type: 'cafe',
    cuisine: ['cafe', 'coffee'],
    zone: 'central-bondi',
    latitude: -33.8896, longitude: 151.2739,
    priceLevel: 2,
    qualityScore: 8.5, localFavouriteScore: 9, iconicScore: 6, viewScore: 2,
    categories: ['coffee', 'brunch', 'casual'],
    suitableFor: ['coffee', 'food'],
    idealMeal: ['coffee', 'breakfast', 'brunch'],
    idealTimeOfDay: ['early', 'morning', 'midday'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '06:00', close: '14:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 30,
    atmosphere: ['local', 'coffee-first'],
    dietaryOptions: ['vegan', 'dairy-free'],
    nearbyExperiences: ['bondi-beach', 'bondi-promenade'],
    shortDescription: 'A Bondi coffee benchmark since 1997, with batch brew, espresso and specialty lattes near the beach.',
    whyGo: 'The best quick, quality coffee stop before a swim or the walk.',
    neighbourhood: 'Jaques Avenue',
    diningTags: ['cafe-coffee', 'breakfast-brunch', 'cheap-eats'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'bondi-hardware',
    name: 'Bondi Hardware',
    type: 'cafe',
    cuisine: ['cafe', 'bar'],
    zone: 'gould-hall',
    latitude: -33.8914, longitude: 151.2726,
    priceLevel: 2,
    qualityScore: 7.5, localFavouriteScore: 7.5, iconicScore: 5, viewScore: 2,
    categories: ['brunch', 'coffee', 'casual', 'cocktails'],
    suitableFor: ['food', 'coffee', 'nightlife'],
    idealMeal: ['brunch', 'lunch', 'drinks'],
    idealTimeOfDay: ['morning', 'midday', 'afternoon', 'evening'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '07:00', close: '22:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 75,
    atmosphere: ['relaxed', 'all-day'],
    dietaryOptions: ['vegetarian', 'vegan'],
    nearbyExperiences: ['gould-street', 'bondi-beach'],
    shortDescription: 'An all-day café and bar off Gould Street that rolls from brunch into evening drinks.',
    whyGo: 'A flexible all-day spot when you want food and drinks in one place.',
    neighbourhood: 'Gould Street',
    diningTags: ['cafe-coffee', 'breakfast-brunch', 'best-bars'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'drake-eatery',
    name: 'Drake Eatery',
    type: 'restaurant',
    cuisine: ['modern-australian'],
    zone: 'gould-hall',
    latitude: -33.8909, longitude: 151.2665,
    priceLevel: 3,
    qualityScore: 8, localFavouriteScore: 8, iconicScore: 5, viewScore: 2,
    categories: ['modern-au', 'brunch', 'casual'],
    suitableFor: ['food', 'coffee'],
    idealMeal: ['breakfast', 'brunch', 'lunch', 'dinner'],
    idealTimeOfDay: ['morning', 'midday', 'afternoon', 'evening'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '07:00', close: '21:00' },
    hoursVerified: false,
    bookingRecommended: true, bookingRequired: false,
    typicalMealDuration: 90,
    atmosphere: ['neighbourhood', 'quality'],
    dietaryOptions: ['vegetarian'],
    nearbyExperiences: ['bondi-beach'],
    shortDescription: 'A well-regarded Bondi Road bistro doing seasonal modern-Australian day to night.',
    whyGo: 'A quieter, quality alternative away from the beachfront crush.',
    neighbourhood: 'Bondi Road',
    diningTags: ['best-restaurants', 'breakfast-brunch'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'makaveli',
    name: 'Makaveli',
    type: 'cafe',
    cuisine: ['cafe', 'bar'],
    zone: 'north-bondi',
    latitude: -33.8875, longitude: 151.2758,
    priceLevel: 2,
    qualityScore: 7.5, localFavouriteScore: 7.5, iconicScore: 5, viewScore: 3,
    categories: ['coffee', 'brunch', 'casual', 'cocktails'],
    suitableFor: ['coffee', 'food', 'nightlife'],
    idealMeal: ['coffee', 'brunch', 'lunch', 'drinks'],
    idealTimeOfDay: ['morning', 'midday', 'afternoon', 'evening'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '07:00', close: '22:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 60,
    atmosphere: ['laid-back', 'day-to-night'],
    dietaryOptions: ['vegetarian'],
    nearbyExperiences: ['north-bondi-beach', 'bondi-beach'],
    shortDescription: 'Café by day, cocktail bar by night on Glenayr Avenue - pastries and coffee, then share plates and drinks.',
    whyGo: 'A relaxed start that can roll into the afternoon or evening.',
    neighbourhood: 'Glenayr Avenue, North Bondi',
    diningTags: ['cafe-coffee', 'breakfast-brunch', 'best-bars', 'cocktail-bars'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
  {
    id: 'shop-wine-bar',
    name: 'The Shop & Wine Bar',
    type: 'bar',
    cuisine: ['wine-bar', 'modern-australian'],
    zone: 'gould-hall',
    latitude: -33.8888, longitude: 151.2766,
    priceLevel: 3,
    qualityScore: 8, localFavouriteScore: 8.5, iconicScore: 5, viewScore: 3,
    categories: ['cocktails', 'sunset-drinks', 'casual', 'modern-au'],
    suitableFor: ['food', 'nightlife', 'relaxing'],
    idealMeal: ['drinks', 'dinner'],
    idealTimeOfDay: ['afternoon', 'evening'],
    openingDays: [0, 1, 2, 3, 4, 5, 6],
    openingHours: { open: '16:00', close: '23:00' },
    hoursVerified: false,
    bookingRecommended: false, bookingRequired: false,
    typicalMealDuration: 75,
    atmosphere: ['cosy', 'wine-focused', 'local'],
    dietaryOptions: ['vegetarian'],
    nearbyExperiences: ['gould-street', 'bondi-sunset'],
    shortDescription: 'A cosy little Bondi wine bar off Curlewis Street - a local pick for an evening glass and a snack.',
    whyGo: 'The spot for a low-key sunset or evening drink away from the big beachfront venues.',
    neighbourhood: 'Curlewis Street',
    diningTags: ['best-bars', 'cocktail-bars', 'sunset-drinks', 'date-night'],
    websiteUrl: '',
    image: null,
    lastVerified: V,
  },
];

export function getVenue(id: string): Venue | undefined {
  return BONDI_VENUES.find((v) => v.id === id);
}

/** Is a venue open on the given weekday at the given HH:MM? */
export function venueOpenAt(v: Venue, weekday: Weekday, hhmm: string): boolean {
  if (!v.openingDays.includes(weekday)) return false;
  return hhmm >= v.openingHours.open && hhmm <= v.openingHours.close;
}
