/**
 * Natural Bondi combinations. Bundles nudge the scoring (via a bonus) so coherent days
 * emerge — the Icebergs pool + Icebergs dining, a market morning, an active loop — without
 * hard-coding a fixed itinerary. A bundle is "active" when the visitor's interests overlap
 * its triggers; experiences/venues in an active bundle get a small bonus.
 */
import type { Interest, Preferences } from '@/types/preferences';

export interface Bundle {
  id: string;
  name: string;
  triggers: Interest[];
  experienceIds: string[];
  venueIds: string[];
}

export const BUNDLES: Bundle[] = [
  { id: 'iconic-bondi', name: 'Iconic Bondi', triggers: ['iconic', 'swimming', 'beach', 'photography'], experienceIds: ['bondi-beach', 'icebergs-pool', 'bondi-tamarama-walk'], venueIds: ['icebergs-dining'] },
  { id: 'north-bondi-morning', name: 'North Bondi Morning', triggers: ['coffee', 'food', 'swimming', 'relaxing'], experienceIds: ['north-bondi-beach', 'ben-buckler', 'beach-swim'], venueIds: ['porch-and-parlour', 'speedos'] },
  { id: 'foodie-bondi', name: 'Foodie Bondi', triggers: ['food', 'coffee', 'nightlife'], experienceIds: ['bondi-beach', 'bondi-promenade'], venueIds: ['seans', 'icebergs-dining', 'raw-bar', 'harrys-bondi', 'shop-wine-bar'] },
  { id: 'market-morning', name: 'Market Morning', triggers: ['markets', 'shopping', 'food', 'coffee'], experienceIds: ['bondi-markets', 'bondi-farmers-market', 'gould-street', 'bondi-beach'], venueIds: ['harrys-bondi', 'seans'] },
  { id: 'active-bondi', name: 'Active Bondi', triggers: ['fitness', 'coastal-walks', 'swimming'], experienceIds: ['beach-swim', 'icebergs-pool', 'bondi-bronte-walk'], venueIds: ['north-bondi-fish'] },
  { id: 'relaxed-bondi', name: 'Relaxed Bondi', triggers: ['relaxing', 'beach', 'food', 'shopping'], experienceIds: ['bondi-beach', 'beach-downtime', 'gould-street'], venueIds: ['seans', 'shop-wine-bar'] },
];

export function activeBundles(prefs: Preferences): Bundle[] {
  return BUNDLES.filter((b) => {
    const overlap = b.triggers.filter((t) => prefs.interests.includes(t)).length;
    return overlap >= 2; // needs a couple of matching interests to activate
  });
}

/** Bonus for an experience or venue id that belongs to an active bundle. */
export function bundleBonus(id: string, active: Bundle[]): number {
  return active.some((b) => b.experienceIds.includes(id) || b.venueIds.includes(id)) ? 8 : 0;
}
