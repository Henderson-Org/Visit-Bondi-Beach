/**
 * Per-hub design configuration for the category pages (the site's editable design
 * data layer). Each key is a hub path; the renderer (components/HubView.tsx) reads
 * this to vary hero treatment, section layouts, a practical facts strip and a CTA —
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
export interface HubDesign {
  kicker: string;
  /** Optional explicit hero image (local path). If absent, derived from content. */
  heroImage?: string;
  sectionLayouts: SectionLayout[];
  /** Contextual "perfect for…" entry points (label + which section they lead to). */
  discovery?: { intro: string; items: HubDiscoveryItem[] };
  practical?: HubFact[];
  cta?: HubCta;
}

const DEFAULT: HubDesign = { kicker: 'Bondi guide', sectionLayouts: ['featured', 'grid', 'grid'] };

const HUB_DESIGN: Record<string, HubDesign> = {
  '/bondi-eat-and-drink': {
    kicker: 'Eat & Drink',
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
      text: 'From hidden coffee spots to the best fish and chips on the sand — keep exploring where Bondi eats.',
      href: '/bondi-blog',
      label: 'Browse all food & drink guides',
    },
  },
  '/bondi-with-kids': {
    kicker: 'Family',
    sectionLayouts: ['featured', 'grid', 'grid'],
    discovery: {
      intro: 'Perfect for…',
      items: [
        { label: 'Toddlers', section: 0 },
        { label: 'A calm swim', section: 0 },
        { label: 'Burning energy', section: 1 },
        { label: 'A rainy day', section: 1 },
        { label: 'Family dinner', section: 2 },
      ],
    },
    practical: [
      { label: 'Calmest swim', value: 'South Bondi & the pools' },
      { label: 'Facilities', value: 'Playground · pool · toilets' },
      { label: 'Best for', value: 'All ages' },
      { label: 'Pram-friendly', value: 'Promenade & north end' },
    ],
    cta: {
      title: 'Plan a family day',
      text: 'Where to swim, what to do and where to eat with kids in tow — all in one place.',
      href: '/where-to-swim-at-bondi-beach',
      label: 'Where to swim with children',
    },
  },
  '/things-to-do-in-bondi': {
    kicker: 'Things to do',
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
      text: 'Three hours or three days — there is always another corner of Bondi worth exploring.',
      href: '/bondi-coastal-walk',
      label: 'Walk the coast to Coogee',
    },
  },
  '/bondi-coastal-walk': {
    kicker: 'The coastal walk',
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
    practical: [
      { label: 'Distance', value: '≈ 6 km to Coogee' },
      { label: 'Time', value: '1.5–2 hours' },
      { label: 'Cost', value: 'Free' },
      { label: 'Best light', value: 'Early morning' },
    ],
    cta: {
      title: 'Make a morning of it',
      text: 'Swim the ocean pools, stop for coffee, and finish with brunch — here is how locals do the walk.',
      href: '/bondi-eat-and-drink',
      label: 'Where to refuel along the way',
    },
  },
  '/getting-to-bondi': {
    kicker: 'Getting here',
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
    practical: [
      { label: 'From the CBD', value: '≈ 30 minutes' },
      { label: 'Nearest station', value: 'Bondi Junction' },
      { label: 'Last leg', value: 'Bus to the beach' },
      { label: 'Parking', value: 'Limited & paid' },
    ],
    cta: {
      title: 'Made it to Bondi?',
      text: 'Now for the fun part — here is everything worth doing once you arrive.',
      href: '/things-to-do-in-bondi',
      label: 'Things to do in Bondi',
    },
  },
  '/bondi-rescue': {
    kicker: 'Bondi Rescue',
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
      text: 'The lifeguards you know from the show patrol the beach every day — here is where they work.',
      href: '/where-to-swim-at-bondi-beach',
      label: 'Where to swim safely at Bondi',
    },
  },
  '/bondi-weather': {
    kicker: 'Weather',
    sectionLayouts: ['grid', 'grid', 'grid'],
    cta: {
      title: 'Picked your season?',
      text: 'Whatever the forecast, there is a good day to be had at Bondi — start planning.',
      href: '/things-to-do-in-bondi',
      label: 'Things to do in any weather',
    },
  },
};

export function getHubDesign(path: string): HubDesign {
  return HUB_DESIGN[path] ?? DEFAULT;
}
