/**
 * Editorial config for the Stay category landing pages. Each entry is a real search
 * intent we can answer with unique, useful content — NOT an auto-generated filter page.
 * The `select` function curates which properties appear; copy is authored per page.
 */
import {
  PROPERTIES,
  byBeachProximity,
  priceRank,
  type Property,
} from '@/data/accommodation';

export interface StayCategory {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  heroKicker: string;
  heroImage: string;
  /** Answer-first paragraph (AEO) — may name specific picks. */
  answer: string;
  /** Supporting editorial paragraphs. */
  intro: string[];
  /** Curated property selection for this category. */
  select: () => Property[];
  faqs: { q: string; a: string }[];
  related: { title: string; path: string }[];
}

const HERO_BEACH = '/images/articles/0886b63eac692e12.webp';

const byGuideThenBeach = (a: Property, b: Property) =>
  Number(Boolean(b.hasGuide)) - Number(Boolean(a.hasGuide)) || byBeachProximity(a, b);

export const STAY_CATEGORIES: StayCategory[] = [
  {
    slug: 'best-hotels-bondi-beach',
    h1: 'The Best Hotels in Bondi Beach',
    metaTitle: 'The Best Hotels in Bondi Beach',
    metaDescription:
      'The best hotels in Bondi Beach, chosen by locals — from the beachfront boutique QT Bondi to relaxed value stays, with who each suits and how close they are to the sand.',
    heroKicker: 'Stay · Hotels',
    heroImage: HERO_BEACH,
    answer:
      'The best hotel in Bondi Beach for location and style is QT Bondi, a design-led boutique hotel right on the Campbell Parade beachfront. Hotel Ravesis is the other standout beachfront boutique, while families and longer stays are usually better in an apartment-hotel such as Adina Bondi Beach. Bondi is a boutique beach town rather than a big five-star strip, so the “best” hotel is the one that matches how you want to stay.',
    intro: [
      'Bondi’s hotels are smaller and more characterful than a typical city strip — you’re choosing between beachfront boutiques, an apartment-hotel or a landmark pub hotel, not a row of chains. What almost all the best options share is walkability: on or just behind Campbell Parade, with the sand, the cafés and the coastal walk on your doorstep.',
    ],
    select: () => PROPERTIES.filter((p) => p.type === 'hotel' || p.type === 'pub-hotel').sort(byGuideThenBeach),
    faqs: [
      { q: 'What is the best hotel in Bondi Beach?', a: 'For location and style, QT Bondi — a beachfront boutique hotel on Campbell Parade. For families or longer stays, an apartment-hotel such as Adina Bondi Beach is often the better fit.' },
      { q: 'Are there five-star hotels in Bondi Beach?', a: 'Bondi is a boutique beach town rather than a big five-star hotel strip. The top end is stylish boutique hotels like QT Bondi and Hotel Ravesis, plus premium serviced apartments.' },
      { q: 'Which Bondi hotel is closest to the beach?', a: 'The beachfront boutiques — QT Bondi and Hotel Ravesis — sit directly on Campbell Parade, about a minute from the sand.' },
    ],
    related: [
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Bondi Icebergs & where to swim', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
      { title: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
    ],
  },
  {
    slug: 'family-accommodation-bondi',
    h1: 'Family Accommodation in Bondi',
    metaTitle: 'Family-Friendly Accommodation in Bondi Beach',
    metaDescription:
      'Where families should stay in Bondi Beach — serviced apartments with kitchens and pools, the calmest end of the beach, and practical bases near transport, chosen by locals.',
    heroKicker: 'Stay · Families',
    heroImage: HERO_BEACH,
    answer:
      'Families are usually happiest in a serviced apartment with a kitchen and a pool — Adina Bondi Beach just behind the sand, or Meriton Suites Bondi Junction for value and easy transport. Kitchens, laundry and a pool make a real difference with kids, and North Bondi is the calmest end of the beach for young children.',
    intro: [
      'With children, self-catering changes a trip: an apartment with a kitchen and laundry lets you keep routines and eat in when you need to. A pool is the other big win, giving you a safe swim when the surf is too big. Base yourself near the calmer north end of the beach, or in Bondi Junction if value and airport access matter more than beachfront.',
    ],
    select: () => PROPERTIES.filter((p) => p.bestFor.includes('families')).sort(byGuideThenBeach),
    faqs: [
      { q: 'Where should families stay in Bondi?', a: 'In a serviced apartment with a kitchen and pool — Adina Bondi Beach near the sand, or Meriton Suites Bondi Junction for value and transport. North Bondi is the calmest stretch of beach for young kids.' },
      { q: 'What is the calmest part of Bondi Beach for children?', a: 'The northern end, by the North Bondi kids’ pool and playground, is the most sheltered spot for young children.' },
      { q: 'Do Bondi apartments have kitchens and pools?', a: 'Apartment-hotels like Adina Bondi Beach and Meriton Suites Bondi Junction have in-room kitchens and a pool, which is why they suit families.' },
    ],
    related: [
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Where to swim (calmest spots)', path: '/where-to-swim-at-bondi-beach' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
  },
  {
    slug: 'luxury-hotels-bondi',
    h1: 'Luxury Stays in Bondi',
    metaTitle: 'Luxury Hotels & Stays in Bondi Beach',
    metaDescription:
      'The most upmarket places to stay in Bondi Beach — beachfront boutique hotels and premium apartments. An honest local take on what “luxury” means at Bondi.',
    heroKicker: 'Stay · Luxury',
    heroImage: HERO_BEACH,
    answer:
      'Bondi’s luxury is boutique, not big-brand five-star. The top picks are QT Bondi and Hotel Ravesis — stylish beachfront boutique hotels on Campbell Parade — plus premium serviced apartments for space and views. If you want a large five-star resort, you’ll find those in the Sydney CBD; Bondi’s appeal is being right on the sand with a design-led room.',
    intro: [
      'It’s worth setting expectations honestly: Bondi doesn’t have a strip of grand five-star hotels. What it has is a handful of characterful beachfront boutiques and high-end apartments, where you’re paying for the location and the design rather than a big-hotel lobby. For many travellers that’s exactly the point — you’re a step from the sand, not behind a porte-cochère.',
    ],
    select: () => PROPERTIES.filter((p) => p.bestFor.includes('luxury')).sort(byGuideThenBeach),
    faqs: [
      { q: 'Is there a five-star hotel in Bondi Beach?', a: 'Not in the big-brand sense. Bondi’s top end is boutique beachfront hotels such as QT Bondi and Hotel Ravesis, plus premium serviced apartments. Large five-star hotels are in the Sydney CBD.' },
      { q: 'What is the most upmarket place to stay in Bondi?', a: 'QT Bondi is the best-known design-led beachfront boutique; Hotel Ravesis is the other premium beachfront option, with premium apartments for more space.' },
    ],
    related: [
      { title: 'The best restaurants & bars in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Bondi Icebergs', path: '/where-to-swim-at-bondi-beach' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
  },
  {
    slug: 'budget-accommodation-bondi',
    h1: 'Budget Accommodation near Bondi Beach',
    metaTitle: 'Budget Accommodation near Bondi Beach',
    metaDescription:
      'How to stay near Bondi Beach on a budget — beachfront hostels, the landmark pub hotel and better-value bases in Bondi Junction, with honest local tips on where to save.',
    heroKicker: 'Stay · Budget',
    heroImage: HERO_BEACH,
    answer:
      'The cheapest way to stay right by the sand is a beachfront hostel on Campbell Parade — Noah’s Bondi Beach or Bondi Backpackers — with dorm beds and some private rooms. For a cheaper private room, Bondi Junction is the best value and is only a short bus from the beach. Book ahead for the Sydney summer, when budget beds go fast.',
    intro: [
      'You don’t need a beachfront-hotel budget to wake up near Bondi. The Campbell Parade hostels put you a two-minute walk from the sand for the lowest nightly rates, while Bondi Junction trades a short bus ride for noticeably better value on private rooms. The landmark Hotel Bondi is a mid-budget option right on the beachfront.',
    ],
    select: () => PROPERTIES.filter((p) => priceRank(p.priceBand) <= 2 || p.bestFor.includes('budget')).sort(byGuideThenBeach),
    faqs: [
      { q: 'What is the cheapest way to stay near Bondi Beach?', a: 'A dorm bed in a Campbell Parade hostel such as Noah’s Bondi Beach or Bondi Backpackers is the cheapest option by the sand. For a cheap private room, Bondi Junction is the best value.' },
      { q: 'Are there hostels on Bondi Beach?', a: 'Yes — several backpacker hostels sit on Campbell Parade, opposite the sand at the south end of the beach.' },
      { q: 'Is Bondi Junction cheaper than Bondi Beach?', a: 'Usually. For a similar standard of room you generally pay less in Bondi Junction, in exchange for a short bus ride to the beach.' },
    ],
    related: [
      { title: 'Hostels in Bondi Beach', path: '/stay/hostels-bondi-beach' },
      { title: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
      { title: 'Free & cheap things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
  },
  {
    slug: 'apartments-bondi-beach',
    h1: 'Serviced Apartments in Bondi Beach',
    metaTitle: 'Serviced Apartments & Aparthotels in Bondi Beach',
    metaDescription:
      'The best serviced apartments and aparthotels in and around Bondi Beach — kitchens, laundry and space for families and longer stays, chosen by locals.',
    heroKicker: 'Stay · Apartments',
    heroImage: HERO_BEACH,
    answer:
      'For a serviced apartment in Bondi Beach with a kitchen and space, Adina Bondi Beach (with a pool) and Bondi 38 sit just off Campbell Parade near the sand, while Meriton Suites Bondi Junction offers high-rise apartments with a pool by the transport hub. Apartments suit families and anyone staying more than a couple of nights.',
    intro: [
      'A serviced apartment is the sweet spot for families and longer stays: you get a kitchen, laundry and more room than a hotel, usually for a comparable rate. Near the beach you’ve got Adina and Bondi 38 just behind Campbell Parade; up at Bondi Junction, Meriton Suites trades beachfront for space, a pool and easy transport.',
    ],
    select: () => PROPERTIES.filter((p) => p.type === 'apartments').sort(byGuideThenBeach),
    faqs: [
      { q: 'Where are the best serviced apartments in Bondi Beach?', a: 'Adina Bondi Beach and Bondi 38 are just behind Campbell Parade near the sand; Meriton Suites Bondi Junction offers apartments with a pool by the transport hub.' },
      { q: 'Do Bondi apartments have kitchens?', a: 'Yes — serviced apartments and aparthotels include in-room kitchen facilities, which is what makes them good for families and longer stays.' },
      { q: 'Are apartments cheaper than hotels in Bondi?', a: 'For a family or a longer stay they often work out better value, because you can self-cater and you’re paying for space rather than nightly hotel service.' },
    ],
    related: [
      { title: 'Family accommodation in Bondi', path: '/stay/family-accommodation-bondi' },
      { title: 'Bondi with kids', path: '/bondi-with-kids' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Getting to Bondi', path: '/getting-to-bondi' },
    ],
  },
  {
    slug: 'hotels-near-bondi-beach',
    h1: 'Hotels Near Bondi Beach',
    metaTitle: 'Hotels Near Bondi Beach (Closest to the Sand)',
    metaDescription:
      'The places to stay closest to Bondi Beach, ranked by walk to the sand — beachfront boutiques, apartments and hostels right on or just behind Campbell Parade.',
    heroKicker: 'Stay · Near the beach',
    heroImage: HERO_BEACH,
    answer:
      'The accommodation closest to Bondi Beach sits right on Campbell Parade: QT Bondi and Hotel Ravesis (beachfront boutiques), the beachfront hostels, and serviced apartments just behind them. All are within a couple of minutes’ walk of the sand. Below, everywhere is ordered by how close it is to the beach.',
    intro: [
      'If being able to walk out onto the sand is the priority, stay on or just behind Campbell Parade. The list below is ordered by walking distance to the beach, so the most central options come first — from beachfront boutiques to apartments and hostels a couple of minutes back.',
    ],
    select: () => [...PROPERTIES].sort(byBeachProximity),
    faqs: [
      { q: 'What hotels are closest to Bondi Beach?', a: 'The beachfront boutiques QT Bondi and Hotel Ravesis sit directly on Campbell Parade, opposite the sand — about a minute’s walk to the beach.' },
      { q: 'Can you stay right on Bondi Beach?', a: 'Yes — several hotels, apartments and hostels line Campbell Parade directly across from the sand, so you can be on the beach within a minute or two.' },
      { q: 'How far is Bondi Junction from the beach?', a: 'About a 10-minute bus ride, or a 25–30 minute walk downhill — handy for transport and value, but not walking-distance to the sand.' },
    ],
    related: [
      { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
      { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
      { title: 'Where to eat & drink in Bondi', path: '/bondi-eat-and-drink' },
      { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
    ],
  },
];

export function getStayCategory(slug: string): StayCategory | undefined {
  return STAY_CATEGORIES.find((c) => c.slug === slug);
}

export function stayCategorySlugs(): string[] {
  return STAY_CATEGORIES.map((c) => c.slug);
}
