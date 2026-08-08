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
