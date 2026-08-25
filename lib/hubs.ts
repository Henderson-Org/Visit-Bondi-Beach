/**
 * Per-hub design configuration for the category pages (the site's editable design
 * data layer). Each key is a hub path; the renderer (components/HubView.tsx) reads
 * this to vary hero treatment, section layouts, a practical facts strip and a CTA -
 * so pages differ intentionally rather than sharing one template.
 *
 * `sectionLayouts` is indexed by section order. Missing entries default to 'grid'.
 * Practical facts must stay evergreen/non-volatile (no prices, hours or timetables).
 */
export type SectionLayout = 'featured' | 'carousel' | 'grid';

export interface HubFact {
  label: string;
  value: string;
}
export interface HubCta {
  title: string;
  text: string;
  href: string;
  label: string;
}
/** "Perfect for…" quick-discovery chip → jumps to a section (by index, always valid). */
export interface HubDiscoveryItem {
  label: string;
  section: number;
}
export interface HubRoute {
  title?: string;
  stops: { label: string; sub?: string; href?: string }[];
  note?: string;
}
export interface HubDesign {
  kicker: string;
  /** Optional explicit hero image (local path). If absent, derived from content. */
  heroImage?: string;
  sectionLayouts: SectionLayout[];
  /** Contextual "perfect for…" entry points (label + which section they lead to). */
  discovery?: { intro: string; items: HubDiscoveryItem[] };
  /** Light static route/where-things-are module. */
  route?: HubRoute;
  practical?: HubFact[];
  cta?: HubCta;
}

const DEFAULT: HubDesign = { kicker: 'Bondi guide', sectionLayouts: ['featured', 'grid', 'grid'] };

const HUB_DESIGN: Record<string, HubDesign> = {
  '/bondi-eat-and-drink': {
    kicker: 'Eat & Drink',
    heroImage: '/images/articles/e7f1fa0c61315488.webp',
    sectionLayouts: ['featured', 'carousel', 'carousel'],
    discovery: {
      intro: 'Perfect for…',
      items: [
        { label: 'First coffee', section: 0 },
        { label: 'Brunch', section: 0 },
        { label: 'Long lunch', section: 1 },
        { label: 'Sunset drinks', section: 1 },
        { label: 'A cheap feed', section: 2 },
        { label: 'Something sweet', section: 2 },
      ],
    },
    cta: {
      title: 'Hungry for more?',
      text: 'From hidden coffee spots to the best fish and chips on the sand - keep exploring where Bondi eats.',
      href: '/articles',
      label: 'Browse all food & drink guides',
    },
  },
  '/bondi-with-kids': {
    kicker: 'Family',
    heroImage: '/images/articles/2bb7ceffea6352a6.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Perfect for…',
      items: [
        { label: 'A calm swim', section: 0 },
        { label: 'Burning energy', section: 1 },
        { label: 'A rainy day', section: 1 },
        { label: 'Family dinner', section: 2 },
        { label: 'Toilets & change rooms', section: 3 },
      ],
    },
    practical: [
      { label: 'Calmest swim', value: 'North Bondi & the pools' },
      { label: 'Facilities', value: 'Playground · pool · toilets' },
      { label: 'Best for', value: 'All ages' },
      { label: 'Pram-friendly', value: 'Promenade & north end' },
    ],
    cta: {
      title: 'Plan a family day',
      text: 'Where to swim, what to do and where to eat with kids in tow - all in one place.',
      href: '/where-to-swim-at-bondi-beach',
      label: 'Where to swim with children',
    },
  },
  '/things-to-do-in-bondi': {
    kicker: 'Things to do',
    heroImage: '/images/articles/41ae0d79fa63d41a.webp',
    sectionLayouts: ['featured', 'carousel', 'grid'],
    discovery: {
      intro: 'Perfect for…',
      items: [
        { label: 'First-timers', section: 0 },
        { label: 'On the water', section: 1 },
        { label: 'With a view', section: 1 },
        { label: 'A rainy day', section: 2 },
        { label: 'Free things', section: 2 },
      ],
    },
    cta: {
      title: 'Got more time?',
      text: 'Three hours or three days - there is always another corner of Bondi worth exploring.',
      href: '/bondi-coastal-walk',
      label: 'Walk the coast to Coogee',
    },
  },
  '/bondi-coastal-walk': {
    kicker: 'The coastal walk',
    heroImage: '/images/articles/4f6ca1a5ae308e04.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Perfect for…',
      items: [
        { label: 'First-timers', section: 0 },
        { label: 'A sunrise walk', section: 0 },
        { label: 'Ocean pools', section: 1 },
        { label: 'What to bring', section: 2 },
      ],
    },
    route: {
      title: 'The route: Bondi to Coogee',
      stops: [
        { label: 'Bondi', sub: 'Start · Icebergs', href: '/bondi-beach' },
        { label: 'Tamarama', sub: '“Glamarama”', href: '/tamarama-beach' },
        { label: 'Bronte', sub: 'Ocean baths', href: '/bronte-beach' },
        { label: 'Clovelly', sub: 'Calm snorkelling' },
        { label: 'Gordons Bay', sub: 'Dive trail' },
        { label: 'Coogee', sub: 'Finish' },
      ],
      note: 'About 6 km one way, roughly 1.5–2 hours at an easy pace, following the clifftop path south. Heading the other way (Coogee to Bondi) works just as well.',
    },
    practical: [
      { label: 'Distance', value: '≈ 6 km to Coogee' },
      { label: 'Time', value: '1.5–2 hours' },
      { label: 'Cost', value: 'Free' },
      { label: 'Best light', value: 'Early morning' },
    ],
    cta: {
      title: 'Make a morning of it',
      text: 'Swim the ocean pools, stop for coffee, and finish with brunch - here is how locals do the walk.',
      href: '/bondi-eat-and-drink',
      label: 'Where to refuel along the way',
    },
  },
  '/getting-to-bondi': {
    kicker: 'Getting here',
    heroImage: '/images/articles/1f09a7008740b014.webp',
    sectionLayouts: ['grid', 'grid', 'grid'],
    discovery: {
      intro: 'Getting here by…',
      items: [
        { label: 'Train + bus', section: 0 },
        { label: 'Driving', section: 1 },
        { label: 'Parking', section: 1 },
        { label: 'From the airport', section: 0 },
      ],
    },
    route: {
      title: 'The trip from the city',
      stops: [
        { label: 'Sydney CBD', sub: 'City centre' },
        { label: 'Bondi Junction', sub: 'Train (~15 min)' },
        { label: 'Bondi Beach', sub: 'Bus (~15 min)' },
      ],
      note: 'There is no train to the beach itself - take the train to Bondi Junction, then a short bus ride down to the sand. Times are approximate and vary with traffic.',
    },
    practical: [
      { label: 'From the CBD', value: '≈ 30 minutes' },
      { label: 'Nearest station', value: 'Bondi Junction' },
      { label: 'Last leg', value: 'Bus to the beach' },
      { label: 'Parking', value: 'Limited & paid' },
    ],
    cta: {
      title: 'Made it to Bondi?',
      text: 'Now for the fun part - here is everything worth doing once you arrive.',
      href: '/things-to-do-in-bondi',
      label: 'Things to do in Bondi',
    },
  },
  '/bondi-rescue': {
    kicker: 'Bondi Rescue',
    heroImage: '/images/articles/e65a74989175e57e.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Jump to…',
      items: [
        { label: 'The lifeguards', section: 0 },
        { label: 'Real or staged?', section: 1 },
        { label: 'Famous rescues', section: 2 },
      ],
    },
    cta: {
      title: 'See it for yourself',
      text: 'The lifeguards you know from the show patrol the beach every day - here is where they work.',
      href: '/where-to-swim-at-bondi-beach',
      label: 'Where to swim safely at Bondi',
    },
  },
  '/bondi-weather': {
    kicker: 'Weather',
    heroImage: '/images/hero-bondi-sunrise.webp',
    sectionLayouts: ['grid', 'grid', 'grid'],
    cta: {
      title: 'Picked your season?',
      text: 'Whatever the forecast, there is a good day to be had at Bondi - start planning.',
      href: '/things-to-do-in-bondi',
      label: 'Things to do in any weather',
    },
  },
  '/bondi-parking': {
    kicker: 'Parking',
    heroImage: '/images/articles/85811813958223c1.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Looking for…',
      items: [
        { label: 'Free parking', section: 0 },
        { label: 'Paid & timed bays', section: 0 },
        { label: 'Bronte & the south beaches', section: 1 },
        { label: 'Busy-day tactics', section: 1 },
      ],
    },
    practical: [
      { label: 'Free spots', value: 'Limited & time-limited' },
      { label: 'Paid', value: 'Metered & the Pavilion car park' },
      { label: 'Busiest', value: 'Summer weekends & mornings' },
      { label: 'Tip', value: 'Arrive early or take the 333 bus' },
    ],
    cta: {
      title: 'Skip the parking stress',
      text: 'On a hot Saturday the car parks fill by mid-morning - here is how to actually get to Bondi.',
      href: '/getting-to-bondi',
      label: 'Getting to Bondi without a car',
    },
  },
  '/city2surf-and-running': {
    kicker: 'City2Surf & running',
    heroImage: '/images/articles/4d75d80295180d8e.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Jump to…',
      items: [
        { label: 'City2Surf', section: 0 },
        { label: 'Sydney Marathon', section: 1 },
        { label: 'Training & Heartbreak Hill', section: 1 },
        { label: 'Best running routes', section: 2 },
      ],
    },
    cta: {
      title: 'After the finish line',
      text: 'Recover the local way - the best flat white, a cold swim and where everyone heads to celebrate.',
      href: '/bondi-eat-and-drink',
      label: 'Where to refuel in Bondi',
    },
  },
  '/bondi-surfing': {
    kicker: 'Surfing',
    heroImage: '/images/articles/8d41917ec41299cf.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Perfect for…',
      items: [
        { label: 'First-timers', section: 0 },
        { label: 'Checking the surf', section: 0 },
        { label: 'Knowing the breaks', section: 1 },
      ],
    },
    cta: {
      title: 'Swim, don’t surf, today?',
      text: 'When the waves are dumping, here is where it is calm - and where it is safe to swim.',
      href: '/where-to-swim-at-bondi-beach',
      label: 'Where to swim at Bondi',
    },
  },
  '/itineraries': {
    kicker: 'Plan your visit',
    heroImage: '/images/articles/41ae0d79fa63d41a.webp',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'How long have you got?',
      items: [
        { label: 'A few hours', section: 0 },
        { label: 'One day', section: 0 },
        { label: 'A weekend', section: 1 },
        { label: 'First-time visitor', section: 1 },
      ],
    },
    cta: {
      title: 'Build your own day',
      text: 'Tell us the season and how long you have, and our planner sketches a Bondi day around it.',
      href: '/plan',
      label: 'Plan your Bondi day',
    },
  },
};

export function getHubDesign(path: string): HubDesign {
  return HUB_DESIGN[path] ?? DEFAULT;
}

/**
 * Hub-styled core pages (Swim, Stay): single-article nav pages that get the
 * editorial hero + a curated "explore" cards row, while KEEPING their existing
 * body content (so no SEO copy is lost). `explore.links` must be real page paths.
 */
export interface CorePageHub {
  kicker: string;
  heroImage: string;
  /** Clean hero intro (the crawled intro on these pages is nav boilerplate). */
  intro: string;
  explore: { heading: string; links: { title: string; path: string }[] };
}

const CORE_PAGE_HUBS: Record<string, CorePageHub> = {
  '/where-to-swim-at-bondi-beach': {
    kicker: 'Swim',
    heroImage: '/images/articles/a4708829a45f32eb.webp',
    intro:
      "Where to swim at Bondi - from the flags on the beach to the Icebergs pool and the calm ocean baths nearby. Here's how to pick the right spot for the day.",
    explore: {
      heading: 'Ocean pools, safety & conditions',
      links: [
        { title: 'Bondi Icebergs: 20 essential questions', path: '/bondi-blog/2025/4/30/bondi-icebergs-ocean-pool-faq-20-essential-questions-answered-hours-fees-membership-more' },
        { title: 'Can anyone swim at Bondi Icebergs?', path: '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool' },
        { title: 'Bronte ocean pool', path: '/bondi-blog/2023/11/16/insiders-guide-to-the-bronte-ocean-pool' },
        { title: 'Is it safe to swim at Bondi?', path: '/bondi-blog/2024/9/8/is-it-safe-to-swim-at-bondi-beach-a-complete-guide' },
        { title: 'Water temperature, month by month', path: '/bondi-blog/2024/8/28/average-sea-temperatures-at-bondi-beach-month-by-month-guide' },
        { title: 'The Bondi Rescue lifeguards', path: '/bondi-rescue' },
        { title: 'Swimming with kids', path: '/bondi-with-kids' },
      ],
    },
  },
  // NOTE: /accommodation was replaced by the dedicated /stay section (app/stay/*)
  // and 301-redirects there (see next.config.mjs). It is intentionally not a
  // core-page hub any more.
};

export function getCorePageHub(path: string): CorePageHub | undefined {
  return CORE_PAGE_HUBS[path];
}
