/**
 * Maps a content page to sensible planner pre-selections + contextual promo copy, so the
 * end-of-article "turn this into a Bondi day" unit deep-links into /plan?interests=… with
 * the right interests already ticked.
 */
import type { Interest } from '@/types/preferences';

export interface PlannerContext {
  interests: Interest[];
  heading: string;
}

const DEFAULT: PlannerContext = {
  interests: [],
  heading: 'Turn this into a Bondi itinerary',
};

/** Keyword → context rules, checked in order against the page path + title. */
const RULES: { re: RegExp; ctx: PlannerContext }[] = [
  { re: /swim|icebergs|ocean pool|snorkel|rescue|lifeguard/i, ctx: { interests: ['swimming', 'iconic', 'photography'], heading: 'Add a Bondi swim to your day' } },
  { re: /coastal walk|bronte|tamarama|coogee|walk/i, ctx: { interests: ['coastal-walks', 'photography', 'fitness'], heading: 'Build the perfect Bondi coastal day' } },
  { re: /caf|coffee|restaurant|eat|dining|brunch|food|bar\b/i, ctx: { interests: ['food', 'coffee'], heading: 'Build a Bondi day around great food' } },
  { re: /market/i, ctx: { interests: ['markets', 'food', 'shopping'], heading: 'Plan a Bondi market morning' } },
  { re: /kid|family|children/i, ctx: { interests: ['family', 'beach', 'swimming'], heading: 'Plan a family Bondi day' } },
  { re: /stay|hotel|accommodation|hostel/i, ctx: { interests: ['iconic', 'beach', 'food'], heading: 'Plan your Bondi days' } },
  { re: /parking|transport|getting|bus|train/i, ctx: { interests: ['iconic', 'beach'], heading: 'Plan your Bondi day' } },
  { re: /thing(s)? to do|activities|itinerary|surf|fitness|active/i, ctx: { interests: ['iconic', 'beach', 'coastal-walks'], heading: 'Build your perfect Bondi day' } },
];

export function plannerContextFor(pathAndTitle: string): PlannerContext {
  for (const r of RULES) if (r.re.test(pathAndTitle)) return r.ctx;
  return DEFAULT;
}

export function plannerHref(interests: Interest[]): string {
  return interests.length ? `/plan?interests=${interests.join(',')}` : '/plan';
}
