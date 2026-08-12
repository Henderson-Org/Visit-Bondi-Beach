/**
 * Bondi location pages - the structured content model behind the reusable destination-page
 * template. One record here fully describes a place (Bondi Beach, North Bondi, Icebergs, a
 * headland, a park, a precinct); the template in components/location/LocationPage.tsx renders
 * it. New location pages are added mostly by adding a record here, not by writing custom code.
 *
 * INTEGRITY (same bar as the rest of the site):
 *  - Facts are durable and verified. Volatile facts (exact fees, seasonal hours) are stated
 *    only when a source confirms them and always point at the official source for live status.
 *  - `coordinates` are included ONLY where publicly documented (Wikipedia/Wikidata); omitted
 *    otherwise rather than guessed. The map uses a place-name query, so it never needs us to
 *    assert lat/lng ourselves.
 *  - `editorialNotes` flags anything that still needs a local/editorial check before relying on it.
 */

export type LocationCategory = 'beach' | 'ocean-pool' | 'park' | 'landmark' | 'precinct' | 'walk' | 'market';
/** The most semantically accurate schema.org type for the place. */
export type LocationSchemaType = 'Beach' | 'Park' | 'TouristAttraction' | 'LandmarksOrHistoricalBuildings' | 'Place';

export interface LocationQuickFact {
  label: string;
  value: string;
}
export interface LocationActivity {
  title: string;
  detail: string;
}
export interface GettingThereMode {
  mode: 'walk' | 'bus' | 'train' | 'drive' | 'parking' | 'rideshare';
  label: string;
  detail: string;
}
export interface NearbyPlace {
  name: string;
  /** Internal link when we have a page for it; omitted otherwise (rendered as plain text). */
  href?: string;
  description: string;
  /** Approximate walk, e.g. "5 min walk". Only when reasonably known. */
  walk?: string;
  image?: string;
}
export interface NearbyFoodLink {
  title: string;
  href: string;
  description: string;
}
export interface LocationFaq {
  q: string;
  a: string;
}
export interface RelatedGuideLink {
  title: string;
  href: string;
}
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface LocationPageData {
  slug: string;
  path: string;
  name: string; // H1
  /** One useful sentence for the hero + meta. */
  shortDescription: string;
  category: LocationCategory;
  schemaType: LocationSchemaType;
  heroImage?: string;
  heroImageAlt?: string;
  /** Verified public coordinates only (Wikipedia/Wikidata). Omit rather than guess. */
  coordinates?: GeoCoordinates;
  /** Place-name query for the embedded map (never asserts our own coordinates). */
  mapQuery: string;
  /** Wikipedia/Wikidata entity URLs for schema `sameAs`, when the place is a documented entity. */
  sameAs?: string[];
  quickFacts: LocationQuickFact[];
  whyVisit: string[];
  activities: LocationActivity[];
  localTips: string[];
  bestTime: string[];
  gettingThere: GettingThereMode[];
  nearby: NearbyPlace[];
  nearbyFood?: { intro: string; links: NearbyFoodLink[] };
  faqs: LocationFaq[];
  relatedGuides: RelatedGuideLink[];
  sources: { label: string; url: string }[];
  lastReviewed: string; // YYYY-MM-DD
  /** Anything still needing editorial/local verification (not rendered on the page). */
  editorialNotes?: string[];
}

export const CATEGORY_LABEL: Record<LocationCategory, string> = {
  beach: 'Beach',
  'ocean-pool': 'Ocean pool',
  park: 'Park & reserve',
  landmark: 'Landmark',
  precinct: 'Neighbourhood',
  walk: 'Coastal walk',
  market: 'Market',
};

/* ============================================================================
 * Records
 * ==========================================================================*/

const BONDI_BEACH: LocationPageData = {
  slug: 'bondi-beach',
  path: '/bondi-beach',
  name: 'Bondi Beach',
  shortDescription:
    'Bondi Beach is a one-kilometre crescent of sand in Sydney’s Eastern Suburbs - patrolled year-round, backed by Campbell Parade’s cafés, and home to the Icebergs ocean pool and the start of the Bondi to Coogee coastal walk.',
  category: 'beach',
  schemaType: 'Beach',
  heroImage: '/images/hero-bondi-sunrise.webp',
  heroImageAlt:
    'Sunrise over Bondi Beach and the Icebergs ocean pool, with swimmers in the pool and the North Bondi headland across the bay',
  coordinates: { lat: -33.8908, lng: 151.2743 },
  mapQuery: 'Bondi Beach, NSW 2026, Australia',
  sameAs: ['https://en.wikipedia.org/wiki/Bondi_Beach', 'https://www.wikidata.org/wiki/Q21919992'],
  quickFacts: [
    { label: 'Best for', value: 'Swimming, surfing, people-watching, cafés' },
    { label: 'Swimming', value: 'Patrolled - always swim between the red-and-yellow flags' },
    { label: 'Lifeguards', value: 'Professional lifeguards 7 days; 6am–7pm through summer' },
    { label: 'Toilets & showers', value: 'Yes - at Bondi Pavilion and the North Bondi amenities' },
    { label: 'Parking', value: 'Metered on Campbell Parade & Notts Ave; fills early on warm days' },
    { label: 'Public transport', value: 'Train to Bondi Junction, then 333 or 380 bus' },
    { label: 'Accessibility', value: 'Beach wheelchairs, accessible toilets, shower & beach ramp at the north end' },
    { label: 'Dogs', value: 'Not allowed on the beach or in the ocean pools (assistance animals excepted)' },
    { label: 'Best time', value: 'Sunrise for calm and space; weekday mornings out of summer' },
  ],
  whyVisit: [
    'Bondi is the most famous beach in Australia for a reason: a wide, north-facing arc of sand within half an hour of the city, with reliable surf, a big patrolled swimming area, and a promenade that stays busy from the dawn swimmers to late-evening walkers.',
    'What makes Bondi worth a proper visit rather than a quick look is how much sits around the sand - the Icebergs pool on the southern headland, the Bondi to Coogee walk starting at the same end, the cafés and bars along Campbell Parade, and the grassy Bondi Park behind the beach for a picnic out of the wind.',
  ],
  activities: [
    { title: 'Swim between the flags', detail: 'The patrolled area shifts with conditions - check the flags and the lifeguard tower before you go in. The southern end near Icebergs holds a strong rip; the middle-to-north is usually the easier swim.' },
    { title: 'Surf', detail: 'Bondi is a beginner-to-intermediate beach break. North Bondi is the mellower end; the south end is stronger and more localised. Several surf schools run lessons on the sand.' },
    { title: 'Walk to Coogee', detail: 'The famous coastal walk starts at the southern end by Icebergs and runs ~6 km past Tamarama, Bronte, Clovelly and Gordons Bay to Coogee.' },
    { title: 'Watch the sunrise', detail: 'Bondi faces roughly east, so it gets the sunrise rather than the sunset - the headland by Icebergs is the classic spot, and the light on the pool is the reason for most Bondi postcards.' },
    { title: 'Picnic in Bondi Park', detail: 'The grassed park behind the beach has shade, barbecues and the Pavilion - a good fallback when the sand is too hot or too windy.' },
    { title: 'Eat & drink on Campbell Parade', detail: 'The beachfront strip and the streets behind it (Hall Street, Gould Street) hold most of Bondi’s cafés, bakeries and restaurants.' },
  ],
  localTips: [
    'For calmer water and fewer people, walk to the northern (North Bondi) end - the swell is smaller there and the flags are usually easier.',
    'Parking on Campbell Parade fills by mid-morning on any warm weekend; come before 9am, use the side streets up the hill, or skip the car and take the bus from Bondi Junction.',
    'Afternoon shade lands at the southern end under the Icebergs cliff first - useful when the middle of the beach is baking.',
    'The best-known photo is from the Icebergs viewpoint at the south end looking back along the sand - go at first light before the pool fills.',
    'Toilets and showers are busiest at the Pavilion; the North Bondi amenities at the top of the beach are usually quieter.',
  ],
  bestTime: [
    'Early morning is Bondi at its best - cooler sand, space to swim, and the sunrise light. In summer the beach is busiest from late morning to mid-afternoon, especially on weekends and on hot days when the whole city seems to arrive.',
    'Bondi is a year-round beach. Spring and autumn give warm days without the peak crowds; winter is quiet, clear and good for the coastal walk, though the water is cold. Whale-watching season (roughly May–November) adds another reason to walk the headlands.',
  ],
  gettingThere: [
    { mode: 'train', label: 'Train', detail: 'Take the Eastern Suburbs & Illawarra line to Bondi Junction - the nearest station - then a bus or a ~25–30 minute downhill walk to the beach.' },
    { mode: 'bus', label: 'Bus', detail: 'From Bondi Junction interchange, the 333 (to/from the City) and 380 (Watsons Bay) run down to Bondi Beach, and the 381 loops to Tamarama. The 333 is the fastest connection.' },
    { mode: 'drive', label: 'Driving', detail: 'Roughly 30 minutes from the CBD outside peak. Traffic on Campbell Parade is slow on warm weekends.' },
    { mode: 'parking', label: 'Parking', detail: 'Metered parking on Campbell Parade and Notts Avenue, plus side streets up the hill (check signs for time limits). It fills early in summer.' },
    { mode: 'rideshare', label: 'Rideshare', detail: 'Drop-off and pick-up work well along Campbell Parade; expect surge pricing when the beach empties out at the end of a hot day.' },
  ],
  nearby: [
    { name: 'North Bondi', href: '/north-bondi', description: 'The quieter, family end of the beach, with a grassy reserve, a children’s rock pool and North Bondi’s cafés.', walk: '10 min walk' },
    { name: 'Bondi Icebergs', href: '/bondi-icebergs', description: 'The famous saltwater ocean pool on the southern headland, run by the Icebergs winter swimming club.', walk: '5 min walk' },
    { name: 'Bondi to Coogee coastal walk', href: '/bondi-coastal-walk', description: 'The 6 km clifftop walk south past Tamarama and Bronte to Coogee - starts at the Icebergs end.', walk: 'Starts here' },
    { name: 'Tamarama Beach', href: '/tamarama-beach', description: 'A small, dramatic cove one headland south - pretty but with a strong rip; better for sunbathing than swimming.', walk: '15 min walk' },
  ],
  nearbyFood: {
    intro: 'Campbell Parade and the streets behind it hold most of Bondi’s eating and drinking.',
    links: [
      { title: 'Where to eat & drink in Bondi', href: '/bondi-eat-and-drink', description: 'The full searchable directory of Bondi cafés, restaurants and bars.' },
      { title: 'Beachfront & ocean-view dining', href: '/bondi-eat-and-drink/waterfront-dining-bondi-beach', description: 'The venues that actually see the water.' },
      { title: 'Best cafés & coffee', href: '/bondi-eat-and-drink/best-cafes-bondi-beach', description: 'Where locals go for a morning coffee.' },
    ],
  },
  faqs: [
    { q: 'Can you swim at Bondi Beach?', a: 'Yes - Bondi is patrolled by professional lifeguards seven days a week. Always swim between the red-and-yellow flags, which mark the safest area on the day. The southern end near Icebergs holds a persistent rip, so the middle-to-northern end is usually the easier swim.' },
    { q: 'Is there parking at Bondi Beach?', a: 'There is metered street parking on Campbell Parade, Notts Avenue and the surrounding streets, but it fills early on warm days and weekends. Taking the train to Bondi Junction and a bus down is often faster than finding a space.' },
    { q: 'How do you get to Bondi Beach without a car?', a: 'Take a train to Bondi Junction, then the 333 or 380 bus to the beach (about 10–15 minutes), or walk down in roughly 25–30 minutes. The 333 runs to and from the City.' },
    { q: 'Are there toilets and showers at Bondi Beach?', a: 'Yes - there are public toilets and showers at Bondi Pavilion in the middle of the beach and at the North Bondi amenities at the northern end.' },
    { q: 'Can you take dogs to Bondi Beach?', a: 'No. Dogs are not permitted on Bondi Beach, in the intertidal area or in the ocean pools. They must be on a leash in surrounding public areas. Assistance animals are permitted.' },
    { q: 'Is Bondi Beach accessible for wheelchairs?', a: 'Yes. Waverley Council provides beach wheelchairs (adult and child) in lockers on the promenade at the northern end, with accessible toilets, an outdoor shower and a beach-access ramp nearby.' },
  ],
  relatedGuides: [
    { title: 'Things to do in Bondi', href: '/things-to-do-in-bondi' },
    { title: 'Where to swim at Bondi Beach', href: '/where-to-swim-at-bondi-beach' },
    { title: 'The Bondi to Coogee coastal walk', href: '/bondi-coastal-walk' },
    { title: 'Bondi with kids', href: '/bondi-with-kids' },
    { title: 'Getting to Bondi', href: '/getting-to-bondi' },
    { title: 'Where to eat & drink in Bondi', href: '/bondi-eat-and-drink' },
  ],
  sources: [
    { label: 'Waverley Council - Beach safety & lifeguards', url: 'https://www.waverley.nsw.gov.au/recreation/beaches_and_coast/our_lifeguards' },
    { label: 'Waverley Council - Access Bondi (accessibility)', url: 'https://www.waverley.nsw.gov.au/community/disability_inclusion/access_bondi' },
    { label: 'Waverley Council - Dogs in public places', url: 'https://www.waverley.nsw.gov.au/recreation/beaches_and_coast' },
    { label: 'Transport NSW - route 333', url: 'https://transportnsw.info/routes/details/sydney-buses-network/333/30333' },
  ],
  lastReviewed: '2026-08-11',
  editorialNotes: [
    'Parking meter rates/time limits and exact summer lifeguard tower hours change - confirm against Waverley Council before quoting specifics.',
  ],
};

const NORTH_BONDI: LocationPageData = {
  slug: 'north-bondi',
  path: '/north-bondi',
  name: 'North Bondi',
  shortDescription:
    'North Bondi is the quieter northern end of Bondi Beach - grassy parkland, a children’s rock pool, calmer swimming and a cluster of well-loved cafés up around Gould Street.',
  category: 'precinct',
  schemaType: 'Place',
  heroImage: '/images/articles/e65a74989175e57e.webp',
  heroImageAlt: 'Surfers in the water at the northern end of Bondi Beach, with the North Bondi headland and houses behind',
  mapQuery: 'North Bondi Beach, NSW 2026, Australia',
  quickFacts: [
    { label: 'Best for', value: 'Families, calmer swimming, coffee, a quieter beach day' },
    { label: 'Swimming', value: 'Usually the calmest end of Bondi; a children’s rock pool (Wally Weekes)' },
    { label: 'Lifeguards', value: 'Northern lifeguard tower patrolled in summer; main tower year-round' },
    { label: 'Toilets & showers', value: 'Yes - the North Bondi amenities at the top of the beach' },
    { label: 'Parking', value: 'Ramsgate Avenue & side streets; limited on warm days' },
    { label: 'Public transport', value: '333 bus terminates at North Bondi; also the 380' },
    { label: 'Accessibility', value: 'Beach wheelchairs, accessible toilets, shower & the beach ramp are all at this end' },
    { label: 'Distance from Bondi Beach centre', value: 'About a 10-minute walk along the promenade' },
    { label: 'Best time', value: 'Weekday mornings; late afternoon on the grass out of the wind' },
  ],
  whyVisit: [
    'North Bondi is the northern end of Bondi Beach and is where a lot of locals actually spend their beach day: the swell is smaller, there’s a grassy reserve to spread out on, and the cafés up around Gould Street and Ramsgate Avenue are a short barefoot walk from the sand.',
    'It suits families and anyone who finds the middle of Bondi too busy. The children’s rock pool, the calmer flagged swimming, the skate park and the shaded grass make it an easier place to bring young kids than the surf-club end, and the accessible facilities - beach wheelchairs, ramp, accessible toilets - are all concentrated here.',
  ],
  activities: [
    { title: 'Swim in calmer water', detail: 'The northern end usually has the smallest swell at Bondi and is the easier place to get in. Still swim between the flags - conditions change with the tide and wind.' },
    { title: 'Bring the kids to the rock pool', detail: 'Wally Weekes pool - the small children’s rock pool at the northern end - is a sheltered spot for young children when the surf is up.' },
    { title: 'Picnic on the reserve', detail: 'The grassy North Bondi reserve behind the sand is a good spot out of the wind, with the skate park and playground nearby.' },
    { title: 'Get a coffee', detail: 'North Bondi’s café strip around Gould Street and Ramsgate Avenue is a short walk up from the beach - see our café guide for the pick.' },
    { title: 'Walk the northern headland', detail: 'The path north past the North Bondi Surf Club leads up towards Ben Buckler point, with wide views back over the whole beach.' },
  ],
  localTips: [
    'This is the end to head for when central Bondi is packed - the flagged swimming here is usually calmer and less crowded.',
    'All of Bondi’s accessible gear - the beach wheelchairs, the accessible toilets, the outdoor shower and the beach ramp - is at this north end, near the Wally Weekes children’s pool.',
    'Park on Ramsgate Avenue or the streets above it early; it’s tighter than the main Campbell Parade parking and goes quickly on warm days.',
    'The grass gets afternoon sun and shelter from the southerly - a better late-afternoon spot than the exposed middle of the beach.',
    'The 333 bus terminates up here, so it’s often easier to get a seat catching it at the North Bondi end than in the middle of the beach.',
  ],
  bestTime: [
    'Weekday mornings are the sweet spot - calm water, easy parking and quiet cafés. On summer weekends North Bondi fills up too, but it still tends to be calmer than the middle of the beach.',
    'Late afternoon on the grassy reserve is a local favourite once the sun comes off the sand, especially in the warmer months. Being the north end, it holds the light late in the day.',
  ],
  gettingThere: [
    { mode: 'walk', label: 'Walk from Bondi Beach', detail: 'About 10 minutes along the promenade from the centre of the beach to the North Bondi amenities.' },
    { mode: 'bus', label: 'Bus', detail: 'The 333 bus terminates at North Bondi; the 380 also runs to this end. From the City, the 333 is the direct route.' },
    { mode: 'train', label: 'Train', detail: 'Train to Bondi Junction, then the 333 or 380 bus to North Bondi.' },
    { mode: 'parking', label: 'Parking', detail: 'Metered parking on Ramsgate Avenue and the surrounding streets - more limited than the main beachfront, and it fills early on warm days.' },
  ],
  nearby: [
    { name: 'Bondi Beach', href: '/bondi-beach', description: 'The main beach and promenade, with the Pavilion, the flags and Campbell Parade’s cafés.', walk: '10 min walk' },
    { name: 'Ben Buckler', href: '/ben-buckler', description: 'The rocky northern point above North Bondi, with big ocean views and the fishing rock ledges.', walk: '10 min walk' },
    { name: 'Bondi Icebergs', href: '/bondi-icebergs', description: 'The ocean pool at the far southern end of the beach.', walk: '20 min walk' },
    { name: 'Bondi to Coogee coastal walk', href: '/bondi-coastal-walk', description: 'The clifftop walk south to Coogee, starting at the Icebergs end of the beach.', walk: '20 min to the start' },
  ],
  nearbyFood: {
    intro: 'North Bondi’s cafés cluster up around Gould Street and Ramsgate Avenue, a short walk from the sand.',
    links: [
      { title: 'Where to eat & drink in North Bondi', href: '/bondi-eat-and-drink/north-bondi', description: 'Everywhere to eat and drink at this end of the beach.' },
      { title: 'Best cafés & coffee in Bondi', href: '/bondi-eat-and-drink/best-cafes-bondi-beach', description: 'The pick of Bondi’s coffee, including the North Bondi favourites.' },
    ],
  },
  faqs: [
    { q: 'Can you swim at North Bondi?', a: 'Yes. North Bondi is usually the calmer end of Bondi Beach and is patrolled - swim between the red-and-yellow flags. There is also a small children’s rock pool (Wally Weekes) at the northern end for young kids.' },
    { q: 'Is North Bondi quieter than Bondi Beach?', a: 'Generally, yes. North Bondi is the northern end of the same beach, and it tends to be calmer and less crowded than the middle, with a grassy reserve and a more local, family feel - though it still gets busy on summer weekends.' },
    { q: 'Is North Bondi good for families and children?', a: 'It’s the easier end for families: calmer swimming, the children’s rock pool, a grassy reserve with a playground and skate park, and the beach’s accessible facilities and ramp are all here.' },
    { q: 'Is there parking at North Bondi?', a: 'There is metered street parking on Ramsgate Avenue and the surrounding streets, but it is more limited than the main beachfront and fills early on warm days.' },
    { q: 'How long does it take to walk to North Bondi from Bondi Beach?', a: 'About 10 minutes along the promenade from the centre of Bondi Beach to the North Bondi end.' },
    { q: 'Is North Bondi accessible?', a: 'Yes - the northern end is where Bondi’s accessible facilities are concentrated: beach wheelchairs, accessible and ambulant toilets, an outdoor shower and a beach-access ramp near the children’s pool.' },
  ],
  relatedGuides: [
    { title: 'Where to swim at Bondi Beach', href: '/where-to-swim-at-bondi-beach' },
    { title: 'Bondi with kids', href: '/bondi-with-kids' },
    { title: 'Things to do in Bondi', href: '/things-to-do-in-bondi' },
    { title: 'Where to eat & drink in North Bondi', href: '/bondi-eat-and-drink/north-bondi' },
    { title: 'Getting to Bondi', href: '/getting-to-bondi' },
  ],
  sources: [
    { label: 'Waverley Council - Access Bondi (accessibility, north-end facilities)', url: 'https://www.waverley.nsw.gov.au/community/disability_inclusion/access_bondi' },
    { label: 'Waverley Council - Beaches & coast', url: 'https://www.waverley.nsw.gov.au/recreation/beaches_and_coast' },
    { label: 'Transport NSW - route 333 (North Bondi terminus)', url: 'https://transportnsw.info/routes/details/sydney-buses-network/333/30333' },
  ],
  lastReviewed: '2026-08-11',
  editorialNotes: [
    'Confirm the current name/operating status of the children’s rock pool (“Wally Weekes”) and the exact café list on Gould Street before relying on specifics.',
    'No North-Bondi-specific verified coordinates included in JSON-LD (map uses a place-name query instead).',
  ],
};

const BONDI_ICEBERGS: LocationPageData = {
  slug: 'bondi-icebergs',
  path: '/bondi-icebergs',
  name: 'Bondi Icebergs',
  shortDescription:
    'Bondi Icebergs is the famous saltwater ocean pool on the southern headland of Bondi Beach - a 50-metre pool where waves wash straight over the edge, run by the Bondi Icebergs winter swimming club and open to the public most days.',
  category: 'ocean-pool',
  schemaType: 'TouristAttraction',
  heroImage: '/images/articles/f89e71f5c2cdf51f.webp',
  heroImageAlt: 'The Bondi Icebergs ocean pool full of swimmers on a sunny day, with Bondi Beach and the town behind',
  coordinates: { lat: -33.8928, lng: 151.2742 },
  mapQuery: 'Bondi Icebergs Pool, Notts Avenue, Bondi Beach NSW 2026',
  sameAs: ['https://en.wikipedia.org/wiki/Bondi_Icebergs_Club'],
  quickFacts: [
    { label: 'What it is', value: 'A 50m saltwater ocean pool + a separate children’s pool, on the south headland' },
    { label: 'Public access', value: 'Open to the public 7 days (subject to tides & swim races)' },
    { label: 'Opening hours', value: 'Mon–Fri 6am–6:30pm, Sat–Sun 6:30am–6:30pm (check official for the day)' },
    { label: 'Closed', value: 'Thursdays for cleaning - often open Thursdays in summer when tides allow' },
    { label: 'Cost', value: 'A small entry fee applies for the pool (see official site)' },
    { label: 'Best for', value: 'Lap swimming, the view, the classic Bondi photo, a post-swim meal' },
    { label: 'Accessibility', value: 'Clifftop site with stairs - check with the club for access' },
    { label: 'Best time', value: 'Early morning at high tide, when the waves wash over the edge' },
  ],
  whyVisit: [
    'Bondi Icebergs is the ocean pool cut into the rocks at the southern end of Bondi Beach - the one in every aerial photo, where the surf breaks straight over the wall into the lap lanes. It has been home to the Bondi Icebergs winter swimming club since 1929, and the public can swim in the pool most days for a small fee.',
    'It’s worth the visit even if you don’t swim: the view back along the full length of Bondi from the pool deck is the beach’s signature outlook, and the Icebergs Club building above it houses a casual bistro and the well-known dining room, both looking straight down the coast.',
  ],
  activities: [
    { title: 'Swim laps in the ocean pool', detail: 'The 50-metre pool is filled and flushed by the sea, so it’s cold, salty and often washed by waves at high tide - a completely different swim to the beach. There’s a separate smaller pool for children.' },
    { title: 'Take the classic Bondi photo', detail: 'From the pool deck and the headland path above it, you get the postcard view back along the whole beach. First light, before the pool fills, is best.' },
    { title: 'Eat or drink with the view', detail: 'The Icebergs Club building above the pool has a casual bistro and the more formal dining room and bar, both with the length of Bondi in front of them.' },
    { title: 'Start the coastal walk', detail: 'The Bondi to Coogee walk begins right here on the southern headland - the pool is the first landmark on the route.' },
    { title: 'Watch the winter swimmers', detail: 'The Icebergs club swims through winter (that’s the name) - the Sunday morning club races from May are a Bondi institution to watch.' },
  ],
  localTips: [
    'Go early. At first light the pool is quiet, the water is glassy between sets, and the photo back along the beach is at its best before the crowds arrive.',
    'High tide is when it’s spectacular - that’s when the waves wash over the pool wall. Low tide is calmer and warmer but far less dramatic.',
    'It’s closed on Thursdays for cleaning for much of the year, so don’t plan a Thursday swim without checking the pool’s live status first.',
    'You don’t have to swim to enjoy it - you can walk out onto the headland path above the pool for the same view for free.',
    'The dining room upstairs books out; the casual bistro is the easier option for a spontaneous meal with the same outlook.',
  ],
  bestTime: [
    'Early morning is the time to come - quiet water, the sunrise light on the pool, and the beach photo before the day’s crowds. The pool opens from 6am on weekdays and 6:30am on weekends.',
    'The pool is at its most dramatic at high tide, when the surf breaks over the edge; it’s calmer and warmer at low tide. It closes on Thursdays for cleaning outside the summer peak, so check the official pool conditions page for the day you’re planning.',
  ],
  gettingThere: [
    { mode: 'walk', label: 'Walk from Bondi Beach', detail: 'About 5 minutes from the middle of the beach: follow the promenade to the southern end and up Notts Avenue.' },
    { mode: 'bus', label: 'Bus', detail: 'Take any Bondi Beach bus (333 or 380) to the southern end of Campbell Parade, then walk up Notts Avenue.' },
    { mode: 'train', label: 'Train', detail: 'Train to Bondi Junction, then a bus to Bondi Beach and a short walk to the southern headland.' },
    { mode: 'parking', label: 'Parking', detail: 'Metered parking on Notts Avenue and Campbell Parade nearby - limited and it fills early on warm days.' },
  ],
  nearby: [
    { name: 'Bondi Beach', href: '/bondi-beach', description: 'The main beach and promenade begin right below the pool on the southern headland.', walk: '5 min walk' },
    { name: 'Bondi to Coogee coastal walk', href: '/bondi-coastal-walk', description: 'The clifftop walk to Coogee starts at the Icebergs headland.', walk: 'Starts here' },
    { name: 'Tamarama Beach', href: '/tamarama-beach', description: 'The first cove south on the coastal walk - small, scenic and rip-prone.', walk: '15 min walk' },
    { name: 'North Bondi', href: '/north-bondi', description: 'The quieter, family end of the beach at the far northern side.', walk: '20 min walk' },
  ],
  nearbyFood: {
    intro: 'The Icebergs Club building holds two of Bondi’s best-known view venues, and Campbell Parade’s cafés are a short walk down.',
    links: [
      { title: 'Beachfront & ocean-view dining', href: '/bondi-eat-and-drink/waterfront-dining-bondi-beach', description: 'The venues that really see the water, Icebergs included.' },
      { title: 'Where to eat & drink in Bondi', href: '/bondi-eat-and-drink', description: 'The full Bondi food & drink directory.' },
    ],
  },
  faqs: [
    { q: 'Can the public swim at Bondi Icebergs?', a: 'Yes. Although Icebergs is a private winter swimming club, the ocean pool is open to the public most days for a small entry fee, subject to tides and swimming races. Check the club’s pool-conditions page for the day you’re planning.' },
    { q: 'What are the Bondi Icebergs pool opening hours?', a: 'The pool generally opens 6am–6:30pm on weekdays and 6:30am–6:30pm on weekends, though times vary with tides and events. Confirm on the official pool-conditions page before you go.' },
    { q: 'Is the Icebergs pool heated?', a: 'No. It’s an ocean pool filled and flushed by the sea, so the water is cold and salty - colder than a heated pool and often washed by waves at high tide.' },
    { q: 'When is Bondi Icebergs closed?', a: 'The pool is closed on Thursdays for cleaning for much of the year, though it often opens on Thursdays in summer when the tides allow. It can also close briefly for big surf, races or events.' },
    { q: 'How do you get to Bondi Icebergs?', a: 'It’s at the southern end of Bondi Beach on Notts Avenue - about a 5-minute walk from the middle of the beach, or a short walk up from the southern Campbell Parade bus stops.' },
    { q: 'Do you need to be a member to visit?', a: 'No. You don’t need to be a member to swim in the public pool or to eat at the bistro or dining room in the club building above it.' },
  ],
  relatedGuides: [
    { title: 'Where to swim at Bondi Beach', href: '/where-to-swim-at-bondi-beach' },
    { title: 'The Bondi to Coogee coastal walk', href: '/bondi-coastal-walk' },
    { title: 'Things to do in Bondi', href: '/things-to-do-in-bondi' },
    { title: 'Beachfront & ocean-view dining', href: '/bondi-eat-and-drink/waterfront-dining-bondi-beach' },
  ],
  sources: [
    { label: 'Bondi Icebergs - Pool conditions (hours & closures)', url: 'https://icebergs.com.au/pool-conditions/' },
    { label: 'Bondi Icebergs - Pool', url: 'http://icebergs.com.au/home-3/pool/' },
    { label: 'Wikipedia - Bondi Icebergs Club', url: 'https://en.wikipedia.org/wiki/Bondi_Icebergs_Club' },
  ],
  lastReviewed: '2026-08-11',
  editorialNotes: [
    'Exact public entry fee not asserted - confirm the current amount on icebergs.com.au before publishing a price.',
    'Pool hours and Thursday-cleaning are sourced from the official site but are seasonal/tide-dependent; the page points visitors to the live pool-conditions page.',
    'Accessibility of the clifftop pool (stairs) not fully documented - verify with the club before stating step-free access.',
  ],
};

// Additional location records live in content JSON so new pages are added as data, not code.
import extraLocations from './locations-extra.json';

export const LOCATIONS: LocationPageData[] = [
  BONDI_BEACH,
  NORTH_BONDI,
  BONDI_ICEBERGS,
  ...(extraLocations as LocationPageData[]),
];

const BY_PATH = new Map(LOCATIONS.map((l) => [l.path, l]));
export function getLocation(path: string): LocationPageData | undefined {
  return BY_PATH.get(path);
}
export function locationPaths(): string[] {
  return LOCATIONS.map((l) => l.path);
}
