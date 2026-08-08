/**
 * Editorial Visit Bondi Beach guides for individual properties (the /stay/[slug]
 * reviews). Kept separate from the base property data so the list stays clean and
 * new reviews can be added without touching the card/filter architecture.
 *
 * INTEGRITY: this is genuine editorial, not a rehash of the hotel's own site. Copy is
 * grounded in durable, verifiable facts (location, geography, what's nearby) and links
 * out to our own guides for anything volatile. The Visit Bondi Beach score is an
 * editorial assessment weighted to what we can actually verify — location, proximity,
 * transport, what's nearby — NOT room quality or service, which we don't score until
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
  /** "Who is it best for?" — one paragraph. */
  bestForProse: string;
  /** "What is the location really like?" paragraphs. */
  location: string[];
  /** Short, answer-first beach-distance line. */
  beachDistance: string;
  /** "Is it good for families?" — one paragraph. */
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
      "Bondi's most stylish beachfront stay — design-led rooms a step from the sand, best for couples and first-timers who don't need a pool.",
    intro:
      'QT Bondi is a boutique design hotel set right on Campbell Parade, directly across from the beach and above the beachfront shops. If you want to walk out of your hotel and onto the sand — with the cafés, the promenade and the start of the coastal walk all at the door — it is about as central as Bondi gets. It suits couples and style-minded first-time visitors more than families or budget travellers.',
    scores: [
      { key: 'location', label: 'Location', score: 9.5, note: 'On Campbell Parade, opposite the beach — the heart of Bondi.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 10, note: 'Directly across from the sand; roughly a one-minute walk.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9.5, note: 'Bondi’s cafés, bars and restaurants are on the doorstep along Campbell Parade and Hall Street.' },
      { key: 'views', label: 'Views', score: 8, note: 'Ocean and beach outlooks from higher, sea-facing rooms (not every room).' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Frequent buses on Campbell Parade; the nearest train is up at Bondi Junction.' },
      { key: 'family', label: 'Family friendliness', score: 6, note: 'A grown-up design hotel — fine for couples; less geared to young families than an apartment.' },
    ],
    whyStay: [
      'The location is the headline: you are on the beachfront itself, so the beach, the promenade, the Sunday markets and the Bondi-to-Coogee coastal walk all begin within a couple of minutes of the lobby.',
      'It is a genuine design hotel rather than a chain — the look and feel are the point, and there is a bar and dining on site, which makes it easy to land, drop your bags and be out on the sand or into a drink without a plan.',
    ],
    bestForProse:
      'Couples and first-time visitors who want to be in the middle of everything and care about a stylish, contemporary room. Less ideal if you need a pool, self-catering, or lots of space for a family — an apartment-hotel suits that better.',
    location: [
      'You are on Campbell Parade, the beachfront strip, at the more central end near Hall Street. Step out and the beach is straight ahead; turn right and you are into Hall Street’s cafés and shops within a minute or two.',
      'Being this central means it can be busy and lively, especially on summer weekends — that buzz is exactly why many people come to Bondi, but light sleepers should ask for a quieter room away from the street.',
    ],
    beachDistance: 'About a one-minute walk — QT Bondi is directly across Campbell Parade from the beach.',
    family:
      'It works for couples and is perfectly comfortable, but it is not a dedicated family set-up: there is no pool and rooms are hotel rooms rather than self-contained apartments. Families who want a kitchen, a pool and more room are usually happier in a serviced apartment nearby.',
    nearby: [
      'Bondi Beach and the promenade — directly across the road',
      'Hall Street cafés and shops — a minute or two north',
      'The Bondi-to-Coogee coastal walk — starts at the south end of the beach',
      'Bondi Icebergs and the ocean pool — at the far south headland',
    ],
    fromAirport:
      'From Sydney Airport, the simplest route is the train to Bondi Junction (about 30–40 minutes with a change at Central), then a short bus or taxi down to the beachfront. A taxi or rideshare direct is roughly 25–35 minutes depending on traffic.',
    toCbd:
      'Into the Sydney CBD: a bus up to Bondi Junction then the train, or a direct bus from Campbell Parade — allow around 30–45 minutes.',
    pros: [
      'Right on the beachfront — you cannot stay much closer to the sand',
      'Distinctive design and a proper on-site bar and dining',
      'Steps from Hall Street, the promenade and the coastal walk',
    ],
    cons: [
      'No pool',
      'Hotel rooms, not self-catering apartments — less suited to families',
      'Beachfront buzz can mean street noise on busy nights',
    ],
    faqs: [
      { q: 'Is QT Bondi on the beach?', a: 'Yes — it sits on Campbell Parade directly opposite Bondi Beach, about a one-minute walk from the sand.' },
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
      'A dependable apartment-hotel for families and longer stays — kitchens, an indoor pool and the beach a few minutes away.',
    intro:
      'Adina Apartment Hotel Bondi Beach is a serviced apartment-hotel just behind Campbell Parade, a short walk from the sand. Because the apartments have kitchens and there is an indoor pool, it is one of the more practical Bondi bases for families and for anyone staying more than a couple of nights — you get space, self-catering and a swim without paying beachfront-hotel rates for a room you only sleep in.',
    scores: [
      { key: 'location', label: 'Location', score: 8.5, note: 'Just behind Campbell Parade — central but a step back from the beachfront bustle.' },
      { key: 'beach', label: 'Proximity to Bondi Beach', score: 9, note: 'Roughly a three-minute walk to the sand.' },
      { key: 'family', label: 'Family friendliness', score: 9, note: 'Apartment layouts, kitchens and an indoor pool make family stays easy.' },
      { key: 'dining', label: 'Food & drink nearby', score: 9, note: 'Campbell Parade and Hall Street cafés and restaurants are a few minutes away.' },
      { key: 'transport', label: 'Transport convenience', score: 7, note: 'Buses along Campbell Parade; train up at Bondi Junction.' },
      { key: 'views', label: 'Views', score: 5, note: 'A practical base rather than a view stay — set back from the seafront.' },
    ],
    whyStay: [
      'The apartments have kitchens and laundry, which changes how a stay feels: you can do breakfast in, keep kids’ routines, and not eat every meal out — a big deal over a week or with young children.',
      'There is an indoor pool, so a swim is not weather- or surf-dependent, and you are still only a few minutes’ walk from the beach, the promenade and the cafés.',
    ],
    bestForProse:
      'Families and longer-stay visitors who want space, a kitchen and a pool, and don’t mind being a short walk back from the seafront rather than directly on it. Couples after a self-catering base will like it too.',
    location: [
      'It sits just behind Campbell Parade, so you are genuinely central — a few minutes on foot to the sand and the cafés — but a step removed from the busiest, noisiest edge of the beachfront.',
      'That slightly-set-back position is part of the appeal for families: easy access to everything, without being right on top of the late-night beachfront buzz.',
    ],
    beachDistance: 'About a three-minute walk to the sand, just behind Campbell Parade.',
    family:
      'This is one of the more family-friendly options at Bondi Beach: self-contained apartments with kitchens give you room and routine, and the indoor pool is a reliable back-up when the surf is too big for little ones. Pair it with our Bondi-with-kids guide for the calmest swim spots and the playground.',
    nearby: [
      'Bondi Beach and the promenade — a few minutes on foot',
      'Campbell Parade and Hall Street cafés — close by',
      'The North Bondi kids’ pool and playground — north end of the beach',
      'The coastal walk to Bronte and Coogee — south end of the beach',
    ],
    fromAirport:
      'From Sydney Airport, train to Bondi Junction (about 30–40 minutes via Central) then a short bus or taxi to the beach; or a direct taxi/rideshare in roughly 25–35 minutes.',
    toCbd:
      'Into the CBD: bus to Bondi Junction and the train, or a direct bus from Campbell Parade — around 30–45 minutes.',
    pros: [
      'Kitchens and laundry — ideal for families and longer stays',
      'Indoor pool, so a swim never depends on the surf',
      'Central but a step back from the beachfront noise',
    ],
    cons: [
      'Not directly on the beachfront (a few minutes’ walk)',
      'Limited ocean views',
      'Apartment-hotel rates rather than budget',
    ],
    faqs: [
      { q: 'How far is Adina Bondi Beach from the beach?', a: 'About a three-minute walk — it is just behind Campbell Parade.' },
      { q: 'Does Adina Bondi Beach have a pool?', a: 'Yes, there is an indoor pool, which makes it a reliable option when the surf is too rough for young children.' },
      { q: 'Is Adina Bondi Beach good for families?', a: 'Yes — self-contained apartments with kitchens, laundry and a pool make it one of the more practical family bases at Bondi Beach.' },
      { q: 'Do the apartments have kitchens?', a: 'Yes — the apartment layouts include kitchen facilities, so you can self-cater, which suits longer stays.' },
    ],
    relatedLinks: [
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Where to swim at Bondi (calmest spots)', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
    alsoConsider: ['bondi-38', 'meriton-bondi-junction', 'qt-bondi'],
  },
};

export function getGuide(slug: string): PropertyGuide | undefined {
  return GUIDES[slug];
}

export function guideSlugs(): string[] {
  return Object.keys(GUIDES);
}
