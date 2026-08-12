/**
 * Editorial Visit Bondi Beach guides for individual properties (the /stay/[slug]
 * reviews). Kept separate from the base property data so the list stays clean and
 * new reviews can be added without touching the card/filter architecture.
 *
 * INTEGRITY: this is genuine editorial, not a rehash of the hotel's own site. Copy is
 * grounded in durable, verifiable facts (location, geography, what's nearby) and links
 * out to our own guides for anything volatile. The Visit Bondi Beach score is an
 * editorial assessment weighted to what we can actually verify - location, proximity,
 * transport, what's nearby - NOT room quality or service, which we don't score until
 * independently assessed. The methodology is shown to the reader, and we only score a
 * property when we have enough grounded information to justify it.
 */

/** A single scored criterion (0–10). Only include criteria we can genuinely justify. */
export interface ScoreLine {
  key: string;
  label: string;
  score: number;
  note: string;
}

export interface GuideLink {
  title: string;
  path: string;
}

export interface PropertyGuide {
  slug: string;
  /** One-line hero verdict. */
  verdict: string;
  /** Answer-first intro paragraph (AEO). */
  intro: string;
  scores: ScoreLine[];
  /** "Why stay here?" paragraphs. */
  whyStay: string[];
  /** "Who is it best for?" - one paragraph. */
  bestForProse: string;
  /** "What is the location really like?" paragraphs. */
  location: string[];
  /** Short, answer-first beach-distance line. */
  beachDistance: string;
  /** "Is it good for families?" - one paragraph. */
  family: string;
  /** "What's nearby?" bullets. */
  nearby: string[];
  /** Airport → property, one line. */
  fromAirport: string;
  /** Property → Sydney CBD, one line. */
  toCbd: string;
  pros: string[];
  cons: string[];
  faqs: { q: string; a: string }[];
  /** Contextual internal links into the rest of the site (topic cluster). */
  relatedLinks: GuideLink[];
  /** Slugs of other properties worth considering. */
  alsoConsider: string[];
}

/** Overall score = mean of the provided criteria, to one decimal. Null if none. */
export function overallScore(scores: ScoreLine[]): number | null {
  if (!scores.length) return null;
  const mean = scores.reduce((s, l) => s + l.score, 0) / scores.length;
  return Math.round(mean * 10) / 10;
}

export const GUIDES: Record<string, PropertyGuide> = {
  'qt-bondi': {
    slug: 'qt-bondi',
    verdict:
      "Bondi's most stylish beachfront stay - design-led rooms a step from the sand, best for couples and first-timers who don't need a pool.",
    intro:
      'QT Bondi is a boutique design hotel set right on Campbell Parade, directly across from the beach and above the beachfront shops. If you want to walk out of your hotel and onto the sand - with the cafés, the promenade and the start of the coastal walk all at the door - it is about as central as Bondi gets. It suits couples and style-minded first-time visitors more than families or budget travellers.',
    scores: [
      { key: 'location', label: 'Location', score: 9.5, note: 'On Campbell Parade, opposite the beach - the heart of Bondi.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 10, note: 'Directly across from the sand; roughly a one-minute walk.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9.5, note: 'Bondi’s cafés, bars and restaurants are on the doorstep along Campbell Parade and Hall Street.' },
      { key: 'views', label: 'Views', score: 8, note: 'Ocean and beach outlooks from higher, sea-facing rooms (not every room).' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Frequent buses on Campbell Parade; the nearest train is up at Bondi Junction.' },
      { key: 'family', label: 'Family friendliness', score: 6, note: 'A grown-up design hotel - fine for couples; less geared to young families than an apartment.' },
    ],
    whyStay: [
      'The location is the headline: you are on the beachfront itself, so the beach, the promenade, the Sunday markets and the Bondi-to-Coogee coastal walk all begin within a couple of minutes of the lobby.',
      'It is a genuine design hotel rather than a chain - the look and feel are the point, and there is a bar and dining on site, which makes it easy to land, drop your bags and be out on the sand or into a drink without a plan.',
    ],
    bestForProse:
      'Couples and first-time visitors who want to be in the middle of everything and care about a stylish, contemporary room. Less ideal if you need a pool, self-catering, or lots of space for a family - an apartment-hotel suits that better.',
    location: [
      'You are on Campbell Parade, the beachfront strip, at the more central end near Hall Street. Step out and the beach is straight ahead; turn right and you are into Hall Street’s cafés and shops within a minute or two.',
      'Being this central means it can be busy and lively, especially on summer weekends - that buzz is exactly why many people come to Bondi, but light sleepers should ask for a quieter room away from the street.',
    ],
    beachDistance: 'About a one-minute walk - QT Bondi is directly across Campbell Parade from the beach.',
    family:
      'It works for couples and is perfectly comfortable, but it is not a dedicated family set-up: there is no pool and rooms are hotel rooms rather than self-contained apartments. Families who want a kitchen, a pool and more room are usually happier in a serviced apartment nearby.',
    nearby: [
      'Bondi Beach and the promenade - directly across the road',
      'Hall Street cafés and shops - a minute or two north',
      'The Bondi-to-Coogee coastal walk - starts at the south end of the beach',
      'Bondi Icebergs and the ocean pool - at the far south headland',
    ],
    fromAirport:
      'From Sydney Airport, the simplest route is the train to Bondi Junction (about 30–40 minutes with a change at Central), then a short bus or taxi down to the beachfront. A taxi or rideshare direct is roughly 25–35 minutes depending on traffic.',
    toCbd:
      'Into the Sydney CBD: a bus up to Bondi Junction then the train, or a direct bus from Campbell Parade - allow around 30–45 minutes.',
    pros: [
      'Right on the beachfront - you cannot stay much closer to the sand',
      'Distinctive design and a proper on-site bar and dining',
      'Steps from Hall Street, the promenade and the coastal walk',
    ],
    cons: [
      'No pool',
      'Hotel rooms, not self-catering apartments - less suited to families',
      'Beachfront buzz can mean street noise on busy nights',
    ],
    faqs: [
      { q: 'Is QT Bondi on the beach?', a: 'Yes - it sits on Campbell Parade directly opposite Bondi Beach, about a one-minute walk from the sand.' },
      { q: 'Does QT Bondi have a pool?', a: 'No. If a pool matters, a nearby apartment-hotel such as Adina Bondi Beach has one; QT’s draw is its beachfront location and design.' },
      { q: 'Is QT Bondi good for families?', a: 'It is comfortable but geared to couples and design-minded travellers. Families wanting a kitchen, a pool and more space are usually better in a serviced apartment.' },
      { q: 'How do I get to QT Bondi from the airport?', a: 'Train to Bondi Junction then a short bus or taxi to the beachfront (about 30–40 minutes), or a direct taxi/rideshare in roughly 25–35 minutes.' },
    ],
    relatedLinks: [
      { title: 'The best places to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Bondi Icebergs & where to swim', path: '/where-to-swim-at-bondi-beach' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
    alsoConsider: ['hotel-ravesis', 'adina-bondi-beach', 'bondi-38'],
  },

  'adina-bondi-beach': {
    slug: 'adina-bondi-beach',
    verdict:
      'A dependable apartment-hotel for families and longer stays - kitchens, a pool and the beach a few minutes away.',
    intro:
      'Adina Apartment Hotel Bondi Beach is a serviced apartment-hotel just behind Campbell Parade, a short walk from the sand. Because the apartments have kitchens and there is a pool, it is one of the more practical Bondi bases for families and for anyone staying more than a couple of nights - you get space, self-catering and a swim without paying beachfront-hotel rates for a room you only sleep in.',
    scores: [
      { key: 'location', label: 'Location', score: 8.5, note: 'Just behind Campbell Parade - central but a step back from the beachfront bustle.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 9, note: 'Roughly a three-minute walk to the sand.' },
      { key: 'family', label: 'Family friendliness', score: 9, note: 'Apartment layouts, kitchens and a pool make family stays easy.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'Campbell Parade and Hall Street cafés and restaurants are a few minutes away.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; train up at Bondi Junction.' },
      { key: 'views', label: 'Views', score: 5, note: 'A practical base rather than a view stay - set back from the seafront.' },
    ],
    whyStay: [
      'The apartments have kitchens and laundry, which changes how a stay feels: you can do breakfast in, keep kids’ routines, and not eat every meal out - a big deal over a week or with young children.',
      'There is an outdoor pool, so a calm swim doesn’t depend on the surf, and you are still only a few minutes’ walk from the beach, the promenade and the cafés.',
    ],
    bestForProse:
      'Families and longer-stay visitors who want space, a kitchen and a pool, and don’t mind being a short walk back from the seafront rather than directly on it. Couples after a self-catering base will like it too.',
    location: [
      'It sits just behind Campbell Parade, so you are genuinely central - a few minutes on foot to the sand and the cafés - but a step removed from the busiest, noisiest edge of the beachfront.',
      'That slightly-set-back position is part of the appeal for families: easy access to everything, without being right on top of the late-night beachfront buzz.',
    ],
    beachDistance: 'About a three-minute walk to the sand, just behind Campbell Parade.',
    family:
      'This is one of the more family-friendly options at Bondi Beach: self-contained apartments with kitchens give you room and routine, and the pool is a reliable back-up when the surf is too big for little ones. Pair it with our Bondi-with-kids guide for the calmest swim spots and the playground.',
    nearby: [
      'Bondi Beach and the promenade - a few minutes on foot',
      'Campbell Parade and Hall Street cafés - close by',
      'The North Bondi kids’ pool and playground - north end of the beach',
      'The coastal walk to Bronte and Coogee - south end of the beach',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus or taxi to the beach; or a direct taxi/rideshare in roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'Kitchens and laundry - ideal for families and longer stays',
      'Outdoor pool, so a swim never depends on the surf',
      'Central but a step back from the beachfront noise',
    ],
    cons: [
      'Not directly on the beachfront (a few minutes’ walk)',
      'Limited ocean views',
      'Apartment-hotel rates rather than budget',
    ],
    faqs: [
      { q: 'How far is Adina Bondi Beach from the beach?', a: 'About a three-minute walk - it is just behind Campbell Parade.' },
      { q: 'Does Adina Bondi Beach have a pool?', a: 'Yes, there is a pool, which makes it a reliable option when the surf is too rough for young children.' },
      { q: 'Is Adina Bondi Beach good for families?', a: 'Yes - self-contained apartments with kitchens, laundry and a pool make it one of the more practical family bases at Bondi Beach.' },
      { q: 'Do the apartments have kitchens?', a: 'Yes - the apartment layouts include kitchen facilities, so you can self-cater, which suits longer stays.' },
    ],
    relatedLinks: [
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Where to swim at Bondi (calmest spots)', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['bondi-38', 'meriton-bondi-junction', 'qt-bondi'],
  },

  'hotel-ravesis': {
    slug: 'hotel-ravesis',
    verdict:
      'An intimate beachfront boutique on the Campbell Parade corner - small, characterful and about as close to the sand as a hotel gets, best for couples.',
    intro:
      'Hotel Ravesis is a small beachfront boutique hotel on the corner of Campbell Parade and Hall Street, directly opposite Bondi Beach. It is one of only a handful of places you can stay right on the seafront, and being a compact, long-running boutique rather than a big chain is much of its appeal - you get an ocean-view room a step from the sand, with the cafés and bars of Hall Street immediately behind you. It suits couples and design-minded travellers more than families.',
    scores: [
      { key: 'location', label: 'Location', score: 9.5, note: 'On the Campbell Parade / Hall Street corner - the beachfront, at the lively Hall Street end.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 10, note: 'Directly opposite the sand; about a one-minute walk across Campbell Parade.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9.5, note: 'A restaurant on site, with Hall Street’s cafés, bars and restaurants immediately behind.' },
      { key: 'views', label: 'Views', score: 8.5, note: 'Ocean and beach outlooks from the seafront rooms (not every room faces the water).' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Frequent buses along Campbell Parade; the nearest train is up at Bondi Junction.' },
      { key: 'family', label: 'Family friendliness', score: 5.5, note: 'A small grown-up boutique - fine for couples, but no pool and limited space for families.' },
    ],
    whyStay: [
      'The location is genuinely special: a beachfront hotel on the corner of Hall Street means you step out to the promenade and the sand on one side and into Bondi’s best café-and-bar strip on the other.',
      'It is small and characterful rather than a corporate hotel, and several rooms look straight out over the water - the kind of ocean-view beachfront room that is rare and books out fast at Bondi.',
    ],
    bestForProse:
      'Couples and first-time visitors who want to wake up on the beachfront with a view, and value character and location over facilities. Less suited to families or anyone who wants a pool, a gym or lots of space - an apartment-hotel is a better fit for that.',
    location: [
      'You are on Campbell Parade at the Hall Street corner, which is arguably the best-connected spot on the beachfront: the beach and promenade are directly across the road, and Hall Street’s cafés, bakeries, bars and the Bondi institutions around it are a few steps inland.',
      'It is a lively, central position, so summer weekends are busy and there can be street noise - that buzz is exactly what draws people to this end of Bondi, but light sleepers should ask about a quieter room.',
    ],
    beachDistance: 'About a one-minute walk - Hotel Ravesis sits directly across Campbell Parade from the sand.',
    family:
      'It is a small beachfront boutique rather than a family base: there is no pool and rooms are compact hotel rooms, not self-contained apartments. Families who want a kitchen, a pool and more room will be more comfortable at a nearby apartment-hotel such as Adina Bondi Beach.',
    nearby: [
      'Bondi Beach and the promenade - directly across the road',
      'Hall Street cafés, bakeries and bars - immediately behind the hotel',
      'The Bondi-to-Coogee coastal walk - starts at the south end of the beach',
      'Bondi Icebergs and the ocean pool - at the far south headland',
    ],
    fromAirport:
      'From Sydney Airport, the easiest route is the train to Bondi Junction (about 30–40 minutes via Central), then a short bus or taxi down to the beachfront. A direct taxi or rideshare is roughly 25–35 minutes depending on traffic.',
    toCbd:
      'Into the Sydney CBD: a bus up to Bondi Junction then the train, or a direct bus from Campbell Parade - allow around 30–45 minutes.',
    pros: [
      'A genuine beachfront position, opposite the sand',
      'Ocean-view rooms and an on-site restaurant',
      'On the Hall Street corner - Bondi’s best café-and-bar strip at the door',
    ],
    cons: [
      'No pool and limited facilities',
      'Compact boutique rooms, not apartments - less suited to families',
      'Beachfront-corner buzz can mean street noise on busy nights',
    ],
    faqs: [
      { q: 'Is Hotel Ravesis on Bondi Beach?', a: 'Yes - it sits on the corner of Campbell Parade and Hall Street, directly opposite the beach, about a one-minute walk from the sand.' },
      { q: 'Does Hotel Ravesis have ocean views?', a: 'Some rooms look out over the beach and ocean from the seafront position, though not every room faces the water - request a sea-facing room when you book.' },
      { q: 'Does Hotel Ravesis have a pool?', a: 'No. Its draw is the beachfront location; if a pool matters, a nearby apartment-hotel such as Adina Bondi Beach has one.' },
      { q: 'Is Hotel Ravesis good for families?', a: 'It is better for couples. Families wanting a kitchen, a pool and more space are usually happier in a serviced apartment nearby.' },
    ],
    relatedLinks: [
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Bondi Icebergs & where to swim', path: '/where-to-swim-at-bondi-beach' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
    alsoConsider: ['qt-bondi', 'bondi-38', 'hotel-bondi'],
  },

  'bondi-38': {
    slug: 'bondi-38',
    verdict:
      'Self-contained apartments on Campbell Parade near the south end - space, a kitchen and the beach two minutes away, good for families and longer stays.',
    intro:
      'Bondi 38 Serviced Apartments sit right on Campbell Parade towards the quieter south end of the beach, near the start of the coastal walk. Because the apartments are self-contained with kitchens, they suit families, groups and anyone staying more than a night or two who wants room to spread out and the option to self-cater - while still being a two-minute walk from the sand.',
    scores: [
      { key: 'location', label: 'Location', score: 9, note: 'On Campbell Parade at the calmer south end, near the coastal-walk trailhead.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 9.5, note: 'About a two-minute walk to the sand.' },
      { key: 'family', label: 'Family friendliness', score: 8, note: 'Self-contained apartments with kitchens give families space and self-catering.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'Campbell Parade cafés at the door; Hall Street a short walk north.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; train up at Bondi Junction.' },
      { key: 'views', label: 'Views', score: 7.5, note: 'Some apartments have an ocean or beach outlook from the Campbell Parade frontage.' },
    ],
    whyStay: [
      'These are proper self-contained apartments, so you get a kitchen, more room than a hotel and the option to eat in - which changes how a longer stay or a family trip feels.',
      'The south-end position is a sweet spot: you are on the beachfront and a short walk from the cafés, but at the calmer end near where the Bondi-to-Coogee coastal walk begins.',
    ],
    bestForProse:
      'Families, groups of friends and longer-stay visitors who want space, a kitchen and a beachfront address, and don’t need a pool or hotel service. Couples who like self-catering will be comfortable here too.',
    location: [
      'Bondi 38 is on Campbell Parade near the south end of the beach, so the sand and promenade are straight across the road and the coastal walk starts a short stroll away.',
      'This end is a little calmer than the central Hall Street stretch, while still being genuinely on the beachfront - a good balance of location and relative quiet.',
    ],
    beachDistance: 'About a two-minute walk - Bondi 38 is on Campbell Parade near the south end of the beach.',
    family:
      'It is a practical family base: self-contained apartments with kitchens mean space, laundry options and the ability to keep routines and eat in. There is no pool, so pair it with our Bondi-with-kids guide for the calmest swim spots and the North Bondi children’s pool.',
    nearby: [
      'Bondi Beach and the promenade - directly across the road',
      'The Bondi-to-Coogee coastal walk - starts nearby at the south end',
      'Bondi Icebergs and the ocean pool - a short walk south',
      'Hall Street cafés and shops - a few minutes north',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus or taxi to the beachfront; or a direct taxi/rideshare in roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'Self-contained apartments with kitchens - space and self-catering',
      'Beachfront address at the calmer south end',
      'Steps from the coastal walk and Icebergs',
    ],
    cons: [
      'No pool',
      'Apartment servicing rather than full hotel service',
      'Beachfront rooms can catch Campbell Parade noise',
    ],
    faqs: [
      { q: 'How far is Bondi 38 from the beach?', a: 'About a two-minute walk - it is on Campbell Parade near the south end of Bondi Beach.' },
      { q: 'Do Bondi 38 apartments have kitchens?', a: 'Yes - they are self-contained serviced apartments with kitchen facilities, which is what makes them good for families and longer stays.' },
      { q: 'Is Bondi 38 good for families?', a: 'Yes - the apartment layouts and self-catering suit families and groups; just note there is no pool.' },
      { q: 'Is Bondi 38 close to the coastal walk?', a: 'Very - the Bondi-to-Coogee coastal walk begins a short stroll south, near the Icebergs end of the beach.' },
    ],
    relatedLinks: [
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
    ],
    alsoConsider: ['adina-bondi-beach', 'ultimate-apartments-bondi-beach', 'qt-bondi'],
  },

  'hotel-bondi': {
    slug: 'hotel-bondi',
    verdict:
      'The landmark beachfront pub hotel - a slice of Bondi history right on Campbell Parade, with simple rooms above the bars, best for a lively, sociable stay.',
    intro:
      'Hotel Bondi is the grand old landmark on Campbell Parade - the pink Art Deco building on the beachfront that has been a Bondi institution for decades. It is a pub hotel, which means simple rooms above a busy complex of bars and restaurants, so you trade quiet and polish for an unbeatable beachfront position and a genuinely sociable atmosphere. It suits first-timers and groups who want to be in the thick of it more than couples after calm.',
    scores: [
      { key: 'location', label: 'Location', score: 9, note: 'On Campbell Parade, on the beachfront - the landmark corner of Bondi.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 9.5, note: 'About a two-minute walk across Campbell Parade to the sand.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'Bars and restaurants in the building itself, with more along Campbell Parade and Hall Street.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; the nearest train is at Bondi Junction.' },
      { key: 'views', label: 'Views', score: 7, note: 'Some rooms look toward the beach from the historic Campbell Parade frontage.' },
      { key: 'family', label: 'Family friendliness', score: 4.5, note: 'A pub hotel above busy bars - lively rather than a quiet family base.' },
    ],
    whyStay: [
      'You are staying inside a genuine Bondi landmark, right on the beachfront - the sort of address that puts the beach, the promenade and the buzz of Campbell Parade immediately at your door.',
      'With bars and restaurants in the building and the beach across the road, it is an easy, sociable base for a first Bondi trip or a group weekend - you barely need to make a plan.',
    ],
    bestForProse:
      'First-time visitors and groups who want a lively, no-fuss beachfront base and don’t mind pub-hotel simplicity or noise. Not the pick for families or anyone after a quiet, polished room - look at an apartment-hotel or a boutique for that.',
    location: [
      'Hotel Bondi sits on Campbell Parade on the beachfront, so the sand and promenade are straight across the road and you are surrounded by cafés, bars and shops.',
      'Because it is a pub with a busy hospitality complex below, expect noise, especially on summer weekends - that energy is the point, but it is worth knowing before you book.',
    ],
    beachDistance: 'About a two-minute walk - Hotel Bondi is on the beachfront strip of Campbell Parade.',
    family:
      'It is not really a family choice: the rooms sit above a lively bar-and-restaurant complex, so it is better suited to adults after a sociable stay. Families are usually happier in a serviced apartment such as Adina Bondi Beach, with a kitchen and a pool.',
    nearby: [
      'Bondi Beach and the promenade - directly across the road',
      'Bars and restaurants - in the building and along Campbell Parade',
      'Hall Street cafés and shops - a couple of minutes away',
      'The coastal walk and Icebergs - a short walk to the south end',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus or taxi to the beachfront; or a direct taxi/rideshare in roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'A genuine beachfront landmark, opposite the sand',
      'Bars and restaurants in the building - sociable and convenient',
      'Central to everything on Campbell Parade and Hall Street',
    ],
    cons: [
      'Rooms sit above busy bars - expect noise',
      'Simple pub-hotel rooms rather than polished or self-catering',
      'Not suited to families or light sleepers',
    ],
    faqs: [
      { q: 'Is Hotel Bondi on the beach?', a: 'Yes - it is the landmark building on Campbell Parade, on the beachfront, about a two-minute walk from the sand.' },
      { q: 'Is Hotel Bondi noisy?', a: 'It can be - the rooms are above a busy bar-and-restaurant complex, so it is lively, particularly on summer weekends.' },
      { q: 'Is Hotel Bondi good for families?', a: 'Less so. As a pub hotel it suits groups and first-timers wanting a sociable base; families are usually more comfortable in a nearby serviced apartment.' },
      { q: 'What kind of hotel is Hotel Bondi?', a: 'It is a historic beachfront pub hotel - simple rooms above a bar-and-dining complex, valued for its landmark location rather than its facilities.' },
    ],
    relatedLinks: [
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Bondi Icebergs & where to swim', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['hotel-ravesis', 'wake-up-bondi-beach', 'qt-bondi'],
  },

  'noahs-bondi-beach': {
    slug: 'noahs-bondi-beach',
    verdict:
      'A backpacker classic directly opposite the sand at the south end - the cheapest way to wake up on the beachfront, with a rooftop and ocean views.',
    intro:
      'Noah’s Bondi Beach is a long-running backpacker hostel right on Campbell Parade at the south end of the beach, opposite the sand and near the start of the coastal walk. For budget travellers it is about as good as a location gets - you are across the road from the beach for hostel prices, with a shared kitchen, a rooftop and ocean views. It suits solo travellers, backpackers and groups happy with dorms or simple private rooms.',
    scores: [
      { key: 'location', label: 'Location', score: 9.5, note: 'On Campbell Parade at the south end, opposite the sand and by the coastal-walk start.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 10, note: 'Directly across the road - about a one-minute walk to the sand.' },
      { key: 'value', label: 'Value for money', score: 9, note: 'Beachfront position at hostel rates - hard to beat on price this close to the sand.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'Campbell Parade cafés at the door; a shared kitchen for self-catering.' },
      { key: 'views', label: 'Views', score: 8.5, note: 'Ocean outlooks and a rooftop looking over the beach.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; train up at Bondi Junction.' },
    ],
    whyStay: [
      'The price-to-location ratio is the whole story: you are directly opposite Bondi Beach for backpacker money, which almost nowhere else offers.',
      'A shared kitchen keeps costs down, and the rooftop and ocean views give you a beachfront hangout without a beachfront-hotel bill - ideal for a sociable, budget-minded trip.',
    ],
    bestForProse:
      'Backpackers, solo travellers and groups on a budget who want to be on the beachfront and are happy with a dorm bed or a simple private room. Not aimed at families or anyone wanting hotel comforts or quiet.',
    location: [
      'Noah’s sits on Campbell Parade at the south end of the beach, so you step out almost directly onto the sand, with Icebergs and the coastal walk a short walk to the south and the cafés of Hall Street a few minutes north.',
      'It is a lively, social, backpacker atmosphere in a prime beachfront spot, so expect buzz rather than calm - exactly what most guests are there for.',
    ],
    beachDistance: 'About a one-minute walk - Noah’s is directly across Campbell Parade from the south end of the beach.',
    family:
      'As a backpacker hostel built around dorms and a social scene, it is not set up for families. Families on a budget are usually better in a serviced apartment a little back from the beach, or in Bondi Junction for value.',
    nearby: [
      'Bondi Beach and the promenade - directly across the road',
      'The Bondi-to-Coogee coastal walk - starts nearby at the south end',
      'Bondi Icebergs and the ocean pool - a short walk south',
      'Campbell Parade and Hall Street cafés - at the door and a little north',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus to Campbell Parade; a taxi or rideshare direct is roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'Directly opposite the beach at backpacker prices',
      'Shared kitchen, rooftop and ocean views',
      'Steps from the coastal walk and Icebergs',
    ],
    cons: [
      'Dorm-focused and social - not quiet',
      'Basic facilities compared with a hotel',
      'Not suited to families',
    ],
    faqs: [
      { q: 'Is Noah’s Bondi Beach on the beach?', a: 'Yes - it is on Campbell Parade at the south end, directly opposite the sand, about a one-minute walk to the beach.' },
      { q: 'Does Noah’s have private rooms?', a: 'Alongside dorm beds it has some simple private rooms, though it is primarily a backpacker hostel.' },
      { q: 'Is there a kitchen at Noah’s Bondi Beach?', a: 'Yes - there is a shared guest kitchen, which helps keep costs down on a longer stay.' },
      { q: 'Is Noah’s good for families?', a: 'Not really - it is a social, dorm-focused backpacker hostel. Families are usually better in a serviced apartment or in Bondi Junction.' },
    ],
    relatedLinks: [
      { title: 'Budget things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['wake-up-bondi-beach', 'bondi-backpackers', 'bondi-beachouse-yha'],
  },

  'bondi-backpackers': {
    slug: 'bondi-backpackers',
    verdict:
      'A friendly, well-placed backpacker hostel on Campbell Parade - cheap beds a couple of minutes from the sand, good for a sociable budget stay.',
    intro:
      'Bondi Backpackers is a budget hostel on Campbell Parade, a short walk from the beach. It gives solo travellers and groups a cheap, sociable base right on Bondi’s main beachfront strip, with a shared kitchen for self-catering. It is a straightforward backpacker option - dorms and simple rooms, location over luxury.',
    scores: [
      { key: 'location', label: 'Location', score: 9, note: 'On Campbell Parade, Bondi’s main beachfront strip.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 9, note: 'About a two-minute walk to the sand.' },
      { key: 'value', label: 'Value for money', score: 8.5, note: 'Budget beds a couple of minutes from the beach.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'Campbell Parade cafés at the door; a shared kitchen for self-catering.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; train up at Bondi Junction.' },
      { key: 'family', label: 'Family friendliness', score: 4, note: 'A social backpacker hostel - not geared to families.' },
    ],
    whyStay: [
      'You are on Campbell Parade, so the beach, the promenade and the cafés are a two-minute walk away for backpacker prices.',
      'It is a sociable, budget-friendly base with a shared kitchen - easy to meet people and keep costs down, which is exactly what most guests want at Bondi.',
    ],
    bestForProse:
      'Backpackers, solo travellers and groups who want a cheap, social base on the beachfront strip and are happy with dorms or basic private rooms. Not designed for families or travellers after quiet and comfort.',
    location: [
      'Bondi Backpackers is on Campbell Parade, Bondi’s main beachfront road, so you are a couple of minutes from the sand and right among the cafés, shops and buses.',
      'It is a lively spot in the middle of everything, so expect a social atmosphere and some street noise rather than calm.',
    ],
    beachDistance: 'About a two-minute walk - Bondi Backpackers is on Campbell Parade, a short stroll from the sand.',
    family:
      'This is a social backpacker hostel rather than a family stay. Families on a budget will be more comfortable in a serviced apartment set back from the beach, or in Bondi Junction for better-value private rooms.',
    nearby: [
      'Bondi Beach and the promenade - a couple of minutes away',
      'Campbell Parade cafés and shops - at the door',
      'Hall Street - a short walk for more cafés and bakeries',
      'The coastal walk and Icebergs - towards the south end of the beach',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus to Campbell Parade; a direct taxi or rideshare is roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'Budget beds a couple of minutes from the beach',
      'On Campbell Parade, in the middle of everything',
      'Shared kitchen for cheap self-catering',
    ],
    cons: [
      'Social and dorm-focused - not quiet',
      'Basic facilities',
      'Not suited to families',
    ],
    faqs: [
      { q: 'How far is Bondi Backpackers from the beach?', a: 'About a two-minute walk - it is on Campbell Parade, Bondi’s main beachfront strip.' },
      { q: 'Does Bondi Backpackers have a kitchen?', a: 'Yes - there is a shared guest kitchen for self-catering, which helps keep a longer stay cheap.' },
      { q: 'Is Bondi Backpackers good for solo travellers?', a: 'Yes - it is a sociable budget hostel that suits solo travellers and groups wanting to meet people.' },
      { q: 'Is it suitable for families?', a: 'Not really - it is a backpacker hostel. Families are usually better in a serviced apartment or in Bondi Junction.' },
    ],
    relatedLinks: [
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['noahs-bondi-beach', 'wake-up-bondi-beach', 'bondi-beachouse-yha'],
  },

  'bondi-beachouse-yha': {
    slug: 'bondi-beachouse-yha',
    verdict:
      'A well-run YHA on the hill towards Tamarama - a little further from the sand, but a rooftop, ocean glimpses and a calmer setting make it a budget favourite.',
    intro:
      'Bondi Beachouse YHA is a well-known budget hostel on Fletcher Street, up the hill towards the Tamarama end of Bondi. It is a slightly longer walk to the main beach than the Campbell Parade hostels, but you trade that for a quieter, more residential setting, a sociable rooftop with ocean glimpses and the reliable standard of the YHA network. It suits budget travellers, solo visitors and groups who don’t mind an eight-minute walk to the sand.',
    scores: [
      { key: 'location', label: 'Location', score: 7.5, note: 'On Fletcher Street towards Tamarama - residential and calmer than the beachfront strip.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 7.5, note: 'About an eight-minute walk down to the sand.' },
      { key: 'value', label: 'Value for money', score: 8.5, note: 'Dependable YHA standard at budget rates, with a rooftop.' },
      { key: 'views', label: 'Views', score: 7.5, note: 'Ocean glimpses from the elevated position and rooftop.' },
      { key: 'dining', label: 'Food & drink nearby', score: 7, note: 'A walk down to the Campbell Parade and Hall Street cafés; a shared kitchen on site.' },
      { key: 'transport', label: 'Transport convenience', score: 6.5, note: 'Buses along the beachfront a walk away; train up at Bondi Junction.' },
    ],
    whyStay: [
      'It is a dependable, well-run YHA - a known quantity for budget travellers - with a shared kitchen and a sociable rooftop that catches ocean glimpses.',
      'The Fletcher Street position is calmer and more residential than the beachfront hostels, which some travellers prefer, and it sits handily towards the Tamarama end and the coastal walk.',
    ],
    bestForProse:
      'Budget travellers, solo visitors and groups who want a reliable, sociable hostel and don’t mind being a short uphill walk from the main beach. Good for those who value a calmer base and a rooftop over being directly on Campbell Parade.',
    location: [
      'The hostel is on Fletcher Street, on the hill above the southern, Tamarama end of Bondi - a residential pocket a little removed from the beachfront bustle.',
      'It is about an eight-minute walk down to the main beach, and you are well placed for the quieter Tamarama end and the coastal walk south towards Bronte and Coogee.',
    ],
    beachDistance: 'About an eight-minute walk downhill to the main beach, from an elevated spot towards Tamarama.',
    family:
      'As a budget hostel it is more suited to solo travellers and groups than families, though the calmer setting is a little more relaxed than the beachfront hostels. Families wanting space and a kitchen are still usually better in a serviced apartment.',
    nearby: [
      'Bondi Beach - about an eight-minute walk downhill',
      'Tamarama Beach and the coastal walk - towards the south',
      'Campbell Parade and Hall Street cafés - a walk down to the beachfront',
      'Bondi Icebergs - near the south end of the beach',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a bus towards Bondi and a short walk up; a direct taxi or rideshare is roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from the beachfront - around 30–45 minutes.',
    pros: [
      'Reliable YHA standard at budget rates',
      'Rooftop with ocean glimpses; shared kitchen',
      'Calmer, residential setting near Tamarama and the coastal walk',
    ],
    cons: [
      'A short uphill walk from the main beach, not on it',
      'Further from the Campbell Parade cafés than beachfront hostels',
      'Hostel facilities rather than hotel comforts',
    ],
    faqs: [
      { q: 'How far is Bondi Beachouse YHA from the beach?', a: 'About an eight-minute walk downhill to the main beach - it sits up on Fletcher Street towards the Tamarama end.' },
      { q: 'Does it have a kitchen and rooftop?', a: 'Yes - there is a shared guest kitchen and a rooftop with ocean glimpses, a well-known feature of this hostel.' },
      { q: 'Is Bondi Beachouse YHA quiet?', a: 'It is calmer than the Campbell Parade hostels thanks to its residential, elevated position, while still being sociable.' },
      { q: 'Is it good for the coastal walk?', a: 'Yes - it is well placed towards the Tamarama end, close to the Bondi-to-Coogee coastal walk.' },
    ],
    relatedLinks: [
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['noahs-bondi-beach', 'bondi-backpackers', 'wake-up-bondi-beach'],
  },

  'meriton-bondi-junction': {
    slug: 'meriton-bondi-junction',
    verdict:
      'High-rise serviced apartments by the Bondi Junction station and Westfield - space, a pool and unbeatable transport, best for families and value.',
    intro:
      'Meriton Suites Bondi Junction is a high-rise apartment-hotel right by the Bondi Junction transport interchange and Westfield shopping centre, about ten minutes from the beach by bus. You trade a beachfront address for noticeably more space, a pool, in-room kitchens and the easiest transport in the area - the train line ends here - which makes it a strong-value pick for families and longer stays.',
    scores: [
      { key: 'location', label: 'Location', score: 7.5, note: 'By Bondi Junction station and Westfield - the area’s transport and shopping hub, uphill from the beach.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 5.5, note: 'Not walking distance - about a 10-minute bus ride down to the sand.' },
      { key: 'family', label: 'Family friendliness', score: 8.5, note: 'Roomy apartments with kitchens and a pool, next to shops and transport.' },
      { key: 'transport', label: 'Transport convenience', score: 9.5, note: 'Beside the train interchange - the fastest route to the CBD and airport.' },
      { key: 'value', label: 'Value for money', score: 8, note: 'More space for your money than the beachfront, with a pool.' },
      { key: 'views', label: 'Views', score: 7.5, note: 'Wide city and coast views from the higher floors of the tower.' },
    ],
    whyStay: [
      'The apartments are genuinely roomy, with kitchens and laundry and a pool in the building - a practical, comfortable base for a family or a longer stay.',
      'The transport is the trump card: you are beside the Bondi Junction interchange, so the CBD is a quick train ride and the airport is straightforward, with frequent buses down to the beach.',
    ],
    bestForProse:
      'Families and longer-stay visitors who want space, a kitchen, a pool and effortless transport, and are happy to bus down to the beach. Also good value for anyone prioritising a comfortable apartment and city access over a beachfront address.',
    location: [
      'You are in Bondi Junction, the shopping and transport hub about ten minutes uphill from the sand, right by Westfield and the station where the train line terminates.',
      'It is a busy, built-up area rather than a beach setting, but that is the trade: everything - trains, buses, shops, supermarkets - is on your doorstep, and the beach is a short, frequent bus ride away.',
    ],
    beachDistance: 'Not walking distance - about a 10-minute bus ride (or a 25–30 minute downhill walk) to Bondi Beach.',
    family:
      'This is one of the more practical family bases in the area: large apartments with kitchens and laundry, a pool for a reliable swim, and shops and supermarkets next door for stocking up. The short bus to the beach is a fair trade for the extra space and value.',
    nearby: [
      'Westfield Bondi Junction and supermarkets - next door',
      'Bondi Junction train and bus interchange - beside the building',
      'Bondi Beach - about a 10-minute bus ride',
      'Centennial Park - a short distance towards the city',
    ],
    fromAirport:
      'From Sydney Airport, the train to Bondi Junction is the simplest route - roughly 30–40 minutes with a change at Central - and the hotel is beside the station. A taxi or rideshare is around 20–30 minutes.',
    toCbd:
      'Into the Sydney CBD: the train from Bondi Junction is quick and frequent, roughly 15 minutes to Town Hall or Central.',
    pros: [
      'Spacious apartments with kitchens and a pool',
      'Beside the train interchange - superb transport to the CBD and airport',
      'Next to Westfield and supermarkets; strong value',
    ],
    cons: [
      'Not walking distance to the beach (a short bus ride)',
      'A busy, built-up setting rather than a beachy one',
      'High-rise hotel scale rather than boutique character',
    ],
    faqs: [
      { q: 'How far is Meriton Suites Bondi Junction from Bondi Beach?', a: 'About a 10-minute bus ride down to the sand - it is up at Bondi Junction, beside the station, not on the beach.' },
      { q: 'Does it have a pool and kitchens?', a: 'Yes - the apartments have in-room kitchens and there is a pool in the building, which is why it suits families and longer stays.' },
      { q: 'Is Bondi Junction a good base for families?', a: 'Yes - you get space, a pool, supermarkets and excellent transport, at better value than the beachfront, in exchange for a short bus to the sand.' },
      { q: 'Is it easy to reach the city from here?', a: 'Very - the train interchange is next door, with a quick, frequent service into the Sydney CBD.' },
    ],
    relatedLinks: [
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
      { title: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
    alsoConsider: ['holiday-inn-bondi-junction', 'quest-bondi-junction', 'adina-bondi-beach'],
  },

  'wake-up-bondi-beach': {
    slug: 'wake-up-bondi-beach',
    verdict:
      'A modern beachfront hostel opposite the sand - dorms and private rooms, a rooftop terrace and a bar, best for a social budget stay right on Campbell Parade.',
    intro:
      'Wake Up! Bondi Beach is a modern hostel on Campbell Parade, directly opposite the beach, with dorms, private rooms, a shared kitchen, a rooftop terrace and a bar. It is one of the best-value ways to stay right on the Bondi beachfront, with a sociable atmosphere and a location that puts the sand, the promenade and the cafés at your door. It suits backpackers, solo travellers and groups.',
    scores: [
      { key: 'location', label: 'Location', score: 9.5, note: 'On Campbell Parade, opposite the beach - right on the beachfront strip.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 10, note: 'Directly across the road - about a one-minute walk to the sand.' },
      { key: 'value', label: 'Value for money', score: 9, note: 'A modern beachfront hostel at budget rates, with private-room options.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'A bar and rooftop on site, with Campbell Parade cafés across the road.' },
      { key: 'views', label: 'Views', score: 8.5, note: 'Ocean outlooks and a rooftop terrace over the beachfront.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; train up at Bondi Junction.' },
    ],
    whyStay: [
      'You are directly opposite the beach for hostel prices - a modern, sociable base with a rooftop terrace and a bar that make the most of the beachfront position.',
      'The mix of dorms and private rooms means it works for backpackers and for travellers who want budget rates but their own room, all with a shared kitchen to keep costs down.',
    ],
    bestForProse:
      'Backpackers, solo travellers and groups who want a modern, social base right on the beachfront and are happy with a dorm or a simple private room. Not designed for families or travellers after quiet and hotel comforts.',
    location: [
      'Wake Up! is on Campbell Parade opposite the sand, so you are right on the beachfront with the promenade, the cafés and the buses immediately around you.',
      'It is a lively, social hostel with an on-site bar and rooftop, so expect atmosphere rather than calm - which is exactly what most guests come for.',
    ],
    beachDistance: 'About a one-minute walk - Wake Up! is directly across Campbell Parade from the beach.',
    family:
      'As a social, dorm-focused hostel with a bar, it is aimed at backpackers and groups rather than families. Families on a budget are usually more comfortable in a serviced apartment, or up at Bondi Junction for value.',
    nearby: [
      'Bondi Beach and the promenade - directly across the road',
      'Campbell Parade cafés and shops - at the door',
      'Hall Street cafés and bakeries - a short walk north',
      'The coastal walk and Icebergs - towards the south end of the beach',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus to Campbell Parade; a direct taxi or rideshare is roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'Directly opposite the beach at budget rates',
      'Modern hostel with a rooftop terrace and bar',
      'Dorms and private rooms; shared kitchen',
    ],
    cons: [
      'Social and lively - not quiet',
      'Hostel facilities rather than hotel comforts',
      'Not suited to families',
    ],
    faqs: [
      { q: 'Is Wake Up! Bondi Beach on the beach?', a: 'Yes - it is on Campbell Parade directly opposite the sand, about a one-minute walk to the beach.' },
      { q: 'Does Wake Up! have private rooms?', a: 'Yes - alongside dorms it offers private rooms, so you can get budget rates with your own space.' },
      { q: 'Is there a rooftop and bar?', a: 'Yes - there is a rooftop terrace and a bar on site, part of what makes it a sociable beachfront base.' },
      { q: 'Is it good for families?', a: 'Not really - it is a social hostel aimed at backpackers and groups. Families are usually better in a serviced apartment.' },
    ],
    relatedLinks: [
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['noahs-bondi-beach', 'bondi-backpackers', 'hotel-bondi'],
  },

  'ultimate-apartments-bondi-beach': {
    slug: 'ultimate-apartments-bondi-beach',
    verdict:
      'Good-value self-contained apartments on O’Brien Street - a kitchen, a seasonal pool and parking a short walk back from the sand, handy for families.',
    intro:
      'Ultimate Apartments Bondi Beach is a set of self-contained apartments on O’Brien Street, a short walk back from the beach. With kitchenettes, a seasonal outdoor pool and on-site parking, it is a practical mid-budget base for families and longer stays who want space and self-catering without paying beachfront rates - and, unusually for Bondi, somewhere to park.',
    scores: [
      { key: 'location', label: 'Location', score: 8, note: 'On O’Brien Street, a short walk back from Campbell Parade and the beach.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 8, note: 'About a six-minute walk to the sand.' },
      { key: 'family', label: 'Family friendliness', score: 8, note: 'Self-contained apartments with kitchenettes, a pool and parking.' },
      { key: 'value', label: 'Value for money', score: 8, note: 'Mid-budget apartments with a pool and parking, near the beach.' },
      { key: 'dining', label: 'Food & drink nearby', score: 8, note: 'A short walk to the Campbell Parade and Hall Street cafés.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses on Campbell Parade a short walk away; on-site parking if you drive.' },
    ],
    whyStay: [
      'The apartments are self-contained with kitchenettes, so you get space, self-catering and a more homely base than a hotel room - good for families and stays of several nights.',
      'A seasonal outdoor pool and on-site parking are genuinely useful at Bondi, where parking is hard to find, and you are still only a short walk from the sand and the cafés.',
    ],
    bestForProse:
      'Families and longer-stay visitors who want space, a kitchen, a pool and - importantly at Bondi - parking, and don’t mind being a few minutes’ walk back from the beach. A sensible mid-budget alternative to the beachfront apartment-hotels.',
    location: [
      'The apartments are on O’Brien Street, a residential street a short walk behind Campbell Parade, so you are close to the beach and the cafés but a step back from the busiest beachfront edge.',
      'That slightly-set-back position is quieter than the seafront, and having parking on site makes it a practical choice if you are driving into Bondi.',
    ],
    beachDistance: 'About a six-minute walk - Ultimate Apartments is on O’Brien Street, a short stroll back from the sand.',
    family:
      'It is a practical family option: self-contained apartments with kitchenettes give you room and self-catering, the seasonal pool is a bonus for a warm-weather swim, and on-site parking helps if you are travelling with a car. Pair it with our Bondi-with-kids guide for the calmest swim spots.',
    nearby: [
      'Bondi Beach and the promenade - about a six-minute walk',
      'Campbell Parade and Hall Street cafés - a short walk away',
      'Bondi Icebergs and the coastal walk - towards the south end',
      'North Bondi shops and the kids’ pool - towards the north end',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus towards the beach; a direct taxi or rideshare is roughly 25–35 minutes. There is on-site parking if you drive.',
    toCbd:
      'Into the CBD: a bus to Bondi Junction and the train, or a direct bus from Campbell Parade - around 30–45 minutes.',
    pros: [
      'Self-contained apartments with kitchenettes',
      'Seasonal outdoor pool and on-site parking - rare at Bondi',
      'Quieter, set-back street a short walk from the sand',
    ],
    cons: [
      'A few minutes’ walk from the beach, not on it',
      'Pool is seasonal rather than year-round',
      'Apartment servicing rather than full hotel service',
    ],
    faqs: [
      { q: 'How far is Ultimate Apartments Bondi Beach from the beach?', a: 'About a six-minute walk - it is on O’Brien Street, a short stroll back from Campbell Parade.' },
      { q: 'Does it have parking?', a: 'Yes - there is on-site parking, which is a real advantage at Bondi where street parking is difficult.' },
      { q: 'Is there a pool?', a: 'Yes - there is a seasonal outdoor pool, alongside kitchenettes in the apartments.' },
      { q: 'Is it good for families?', a: 'Yes - the self-contained apartments, pool and parking make it a practical mid-budget family base a short walk from the sand.' },
    ],
    relatedLinks: [
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
      { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
    ],
    alsoConsider: ['bondi-38', 'adina-bondi-beach', 'meriton-bondi-junction'],
  },

  'quest-bondi-junction': {
    slug: 'quest-bondi-junction',
    verdict:
      'Studio aparthotel steps from the Bondi Junction interchange - self-catering and superb transport at good value, best for longer and business stays.',
    intro:
      'Quest Bondi Junction is a studio aparthotel about 200 metres from the Bondi Junction transport interchange, where the train line ends. With in-room kitchen facilities and excellent transport, it is a practical, good-value base for longer stays, small families and business travellers who want self-catering and easy access to the city and airport, with the beach a short bus ride away.',
    scores: [
      { key: 'location', label: 'Location', score: 7.5, note: 'About 200 m from the Bondi Junction interchange - the area’s transport hub.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 5.5, note: 'Not walking distance - about a 10-minute bus ride to the sand.' },
      { key: 'transport', label: 'Transport convenience', score: 9.5, note: 'Steps from the train interchange - quick to the CBD and straightforward to the airport.' },
      { key: 'value', label: 'Value for money', score: 8, note: 'Self-contained studios at good value, near shops and transport.' },
      { key: 'dining', label: 'Food & drink nearby', score: 8, note: 'Westfield Bondi Junction and its food options a short walk away.' },
      { key: 'family', label: 'Family friendliness', score: 7, note: 'Studios with kitchen facilities suit small families and longer stays.' },
    ],
    whyStay: [
      'You are a couple of hundred metres from the Bondi Junction interchange, so the CBD is a quick train ride and the airport is easy - hard to beat for a stay that mixes beach and city.',
      'The studios are self-contained with kitchen facilities, which keeps a longer or business stay comfortable and lets you self-cater, with Westfield’s shops and supermarkets close by.',
    ],
    bestForProse:
      'Longer-stay, business and small-family travellers who value self-catering and outstanding transport, and are happy to bus down to the beach. A sensible-value base for combining Bondi with the rest of Sydney.',
    location: [
      'Quest is in Bondi Junction, a short walk from the interchange and Westfield, in the busy shopping-and-transport hub about ten minutes uphill from the sand.',
      'It is a practical, built-up setting rather than a beach one - you are trading the seafront for convenience, value and the fastest transport in the area.',
    ],
    beachDistance: 'Not walking distance - about a 10-minute bus ride (or a 25–30 minute downhill walk) to Bondi Beach.',
    family:
      'The studio apartments with kitchen facilities work well for small families and longer stays, with supermarkets and shops next door for stocking up. Larger families wanting a pool and more room may prefer a bigger apartment-hotel nearby such as Meriton Suites.',
    nearby: [
      'Bondi Junction interchange (train and buses) - about 200 m',
      'Westfield Bondi Junction and supermarkets - a short walk',
      'Bondi Beach - about a 10-minute bus ride',
      'Centennial Park - a short distance towards the city',
    ],
    fromAirport:
      'From Sydney Airport, the train to Bondi Junction is the simplest route - roughly 30–40 minutes with a change at Central - leaving a short walk to the aparthotel. A taxi or rideshare is around 20–30 minutes.',
    toCbd:
      'Into the Sydney CBD: the train from Bondi Junction is quick and frequent - roughly 15 minutes to Town Hall or Central.',
    pros: [
      'Steps from the train interchange - excellent transport',
      'Self-contained studios with kitchen facilities',
      'Good value, next to Westfield and supermarkets',
    ],
    cons: [
      'Not walking distance to the beach (a short bus ride)',
      'Studios are compact rather than spacious',
      'A busy junction setting rather than a beachy one',
    ],
    faqs: [
      { q: 'How far is Quest Bondi Junction from the beach?', a: 'About a 10-minute bus ride - it is up at Bondi Junction, near the interchange, not on the beach.' },
      { q: 'Do the studios have kitchens?', a: 'Yes - they are self-contained studio apartments with kitchen facilities, good for self-catering on a longer stay.' },
      { q: 'Is it well connected to the city?', a: 'Very - it is about 200 m from the Bondi Junction train interchange, a quick ride into the Sydney CBD.' },
      { q: 'Is it good value?', a: 'Yes - for self-catering, transport and access to shops it is good value, in exchange for a short bus to the beach.' },
    ],
    relatedLinks: [
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
      { title: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
    ],
    alsoConsider: ['meriton-bondi-junction', 'holiday-inn-bondi-junction', 'adina-bondi-beach'],
  },

  'holiday-inn-bondi-junction': {
    slug: 'holiday-inn-bondi-junction',
    verdict:
      'A full-service hotel by the Bondi Junction station and Westfield - a reliable, well-connected base with a pool, best for first-timers and families who want hotel service.',
    intro:
      'Holiday Inn & Suites Sydney Bondi Junction is a full-service hotel in the heart of Bondi Junction, close to the train station and Westfield. Unlike most Bondi-area stays it offers proper hotel service and a pool in a well-known, dependable brand, with the beach a short bus ride away. It suits first-time visitors and families who want the reassurance of a full hotel and excellent transport more than a beachfront address.',
    scores: [
      { key: 'location', label: 'Location', score: 7.5, note: 'In central Bondi Junction, by the station and Westfield - the transport and shopping hub.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 5.5, note: 'Not walking distance - about a 10-minute bus ride to the sand.' },
      { key: 'transport', label: 'Transport convenience', score: 9.5, note: 'By the train interchange - fast to the CBD and straightforward to the airport.' },
      { key: 'dining', label: 'Food & drink nearby', score: 8.5, note: 'Westfield’s dining and the Junction’s restaurants and bars nearby; dining on site.' },
      { key: 'family', label: 'Family friendliness', score: 8, note: 'Full hotel service, suites and a pool, next to shops and transport.' },
      { key: 'views', label: 'Views', score: 7, note: 'City and district views from the upper floors.' },
    ],
    whyStay: [
      'It is a proper full-service hotel - reception, housekeeping, a pool and dining on site - which is relatively rare in the Bondi area and reassuring for first-timers and families.',
      'The Bondi Junction location gives you the best transport around: the train to the CBD is quick, the airport is easy, and Westfield’s shops and restaurants are on the doorstep, with frequent buses down to the beach.',
    ],
    bestForProse:
      'First-time visitors and families who want the dependability of a full-service hotel and a pool, with superb transport and shopping, and are happy to take a short bus to the beach. Good, too, for anyone combining Bondi with the wider city.',
    location: [
      'The hotel is in central Bondi Junction, by the station and Westfield, in the busy shopping-and-transport hub about ten minutes uphill from Bondi Beach.',
      'It is an urban, well-connected setting rather than a beach one - you are choosing hotel comfort, service and transport over a seafront position, with the beach a short, frequent bus ride away.',
    ],
    beachDistance: 'Not walking distance - about a 10-minute bus ride (or a 25–30 minute downhill walk) to Bondi Beach.',
    family:
      'It works well for families who want hotel service rather than an apartment: there is a pool, room options that suit families, and Westfield’s shops, food and supermarkets right there. The short bus to the beach is the trade-off for the comfort and convenience.',
    nearby: [
      'Westfield Bondi Junction and supermarkets - nearby',
      'Bondi Junction train and bus interchange - close by',
      'Bondi Beach - about a 10-minute bus ride',
      'Centennial Park - a short distance towards the city',
    ],
    fromAirport:
      'From Sydney Airport, the train to Bondi Junction is the simplest route - roughly 30–40 minutes with a change at Central - leaving a short walk to the hotel. A taxi or rideshare is around 20–30 minutes.',
    toCbd:
      'Into the Sydney CBD: the train from Bondi Junction is quick and frequent - roughly 15 minutes to Town Hall or Central.',
    pros: [
      'Full-service hotel with a pool - uncommon in the Bondi area',
      'By the train interchange - excellent transport to the CBD and airport',
      'Next to Westfield’s shops, dining and supermarkets',
    ],
    cons: [
      'Not walking distance to the beach (a short bus ride)',
      'A busy urban setting rather than a beachy one',
      'Chain-hotel scale rather than boutique character',
    ],
    faqs: [
      { q: 'How far is the Holiday Inn Bondi Junction from the beach?', a: 'About a 10-minute bus ride down to Bondi Beach - the hotel is up at Bondi Junction, by the station, not on the sand.' },
      { q: 'Does it have a pool?', a: 'Yes - it is a full-service hotel with a pool, alongside on-site dining and hotel service.' },
      { q: 'Is Bondi Junction a good base for first-time visitors?', a: 'Yes - the transport is excellent for seeing both Bondi and the wider city, and a full-service hotel is reassuring on a first trip, in exchange for a short bus to the beach.' },
      { q: 'How far is the city from here?', a: 'Very close by train - roughly 15 minutes from the Bondi Junction interchange into the Sydney CBD.' },
    ],
    relatedLinks: [
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
      { title: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
    ],
    alsoConsider: ['meriton-bondi-junction', 'quest-bondi-junction', 'adina-bondi-beach'],
  },
};

export function getGuide(slug: string): PropertyGuide | undefined {
  return GUIDES[slug];
}

export function guideSlugs(): string[] {
  return Object.keys(GUIDES);
}
