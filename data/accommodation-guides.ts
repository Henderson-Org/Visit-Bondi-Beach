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

};

export function getGuide(slug: string): PropertyGuide | undefined {
  return GUIDES[slug];
}

export function guideSlugs(): string[] {
  return Object.keys(GUIDES);
}
