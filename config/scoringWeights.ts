/**
 * All tunable weights for the Bondi Day Planner recommendation engine live here.
 * Adjust these to change how opinionated the planner is — e.g. raise `food.restaurantQuality`
 * to make standout restaurants anchor the day even harder. Nothing else needs editing.
 */

/** Weights used when scoring a venue AND the visitor cares about food. */
export const FOOD_WEIGHTS = {
  restaurantQuality: 30,
  cuisineMatch: 20,
  iconicVenue: 12,
  localFavourite: 15,
  geographicFit: 15,
  budgetMatch: 10,
  mealTimeFit: 15,
} as const;

/** Weights used when food is NOT a priority — geography matters more, quality less. */
export const NONFOOD_VENUE_WEIGHTS = {
  restaurantQuality: 14,
  cuisineMatch: 8,
  iconicVenue: 8,
  localFavourite: 8,
  geographicFit: 22,
  budgetMatch: 10,
  mealTimeFit: 12,
} as const;

/** Penalties applied to venues (subtracted). */
export const VENUE_PENALTIES = {
  closed: 1000, // effectively excludes a closed venue
  budgetOver: 12, // per price level above budget
  excessiveTravel: 2, // per walking minute beyond a comfortable threshold
  comfortableTravelMinutes: 12,
} as const;

/** Experience scoring weights. */
export const EXPERIENCE_WEIGHTS = {
  base: 10,
  preferenceMatch: 12, // per matched interest (capped)
  preferenceMatchCap: 3,
  mustDoBoost: 18,
  timeOfDayMatch: 8,
  proximityBonus: 10, // near an anchor
  bundleBonus: 10,
  durationFit: 6,
} as const;

export const EXPERIENCE_PENALTIES = {
  operatingDayClosed: 1000, // e.g. market not on today
  walkingMismatch: 20, // demands more walking than tolerated
  repetition: 14, // similar to something already chosen
  backtracking: 8, // per direction reversal introduced
  weather: 6, // reserved for future live-weather integration
} as const;

/** Target number of stops by pace (excluding walking legs). */
export const PACE_TARGET: Record<'relaxed' | 'balanced' | 'max', { min: number; max: number }> = {
  relaxed: { min: 3, max: 4 },
  balanced: { min: 4, max: 6 },
  max: { min: 6, max: 8 },
};

/**
 * Redundancy control — stops the planner stacking experiences that satisfy the same
 * thing. Tune these to make the day more or less varied.
 */
export const REDUNDANCY = {
  /** Bonus per still-unfulfilled preference an activity satisfies (marginal value). */
  marginalPreferenceValue: 9,
  /** Penalty when an activity's family already appeared in the last N slots (adjacency). */
  sameFamilyAdjacent: 26,
  adjacentWindow: 2,
  /** Medium penalty when every preference an activity satisfies is already fulfilled. */
  alreadyFulfilled: 16,
  /** A preference is "sufficiently fulfilled" once this many activities have satisfied it. */
  fulfilmentThreshold: 1,
  /** Experiences this iconic (mustDoScore) are allowed to repeat a family (distinct enough). */
  distinctMustDo: 9,
} as const;

/** Any unexplained gap longer than this (minutes) gets a downtime block inserted. */
export const MAX_UNEXPLAINED_GAP = 50;

/** Klook / affiliate scoring — quality-first with a deliberately small commercial bonus. */
export const KLOOK = {
  editorialWeight: 2.2, // editorialScore (0–10) × this
  preferenceFit: 12, // per matched preference (capped)
  preferenceFitCap: 3,
  /** Extra boost when the visitor explicitly wants active/guided/learning experiences. */
  intentBoost: 22,
  geographicFit: 10,
  /** The ONLY commercial term — kept small so commission can't outrank quality. */
  commercialBonus: 4, // commercialScore (0–10) × (this / 10)
  /**
   * Boost for an editorially "featured" affiliate activity (e.g. the Bondi surf lesson) so it
   * is suggested across a large share of relevant itineraries. Still only applies when the
   * activity matches the visitor — it never appears on an unrelated day.
   */
  featuredBoost: 20,
} as const;

/** Max affiliate activities per itinerary by duration (defaults; tunable). */
export const MAX_AFFILIATE_ACTIVITIES: Record<'2h' | 'half' | 'full', number> = {
  '2h': 1,
  half: 1,
  full: 2,
};

/** Activity priority tiers. Affiliate status NEVER moves an activity up a tier. */
export const TIER_ONE = new Set(['bondi-beach', 'icebergs-pool', 'bondi-bronte-walk', 'bondi-tamarama-walk', 'bondi-markets', 'bondi-farmers-market', 'beach-swim']);
export const TIER_THREE = new Set(['bondi-promenade', 'skate-park', 'beach-downtime']);
export const TIER_BOOST = { 1: 8, 2: 0, 3: -6 } as const;

export function tierOf(id: string): 1 | 2 | 3 {
  if (TIER_ONE.has(id)) return 1;
  if (TIER_THREE.has(id)) return 3;
  return 2;
}
