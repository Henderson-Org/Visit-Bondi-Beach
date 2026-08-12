/**
 * Deterministic venue (restaurant/café/bar) scoring. When food is a priority the
 * FOOD_WEIGHTS make quality/cuisine/local-favourite dominate; otherwise geography
 * matters more. Returns a transparent breakdown for the debug view. Numeric scores are
 * never shown to normal users - only the "why it's here" reason is.
 */
import { FOOD_WEIGHTS, NONFOOD_VENUE_WEIGHTS, VENUE_PENALTIES } from '@/config/scoringWeights';
import { walkMinutes, type Zone } from '@/lib/bondiZones';
import { venueOpenAt, type Venue, type Weekday } from '@/data/bondiVenues';
import type { MealSlot, Preferences } from '@/types/preferences';

export interface VenueScoreContext {
  slot: MealSlot;
  weekday: Weekday;
  time: string; // HH:MM the meal would happen
  plannedZones: Zone[]; // zones already in the itinerary (for proximity)
  foodPriority: boolean;
}

export interface VenueScore {
  total: number;
  breakdown: Record<string, number>;
  open: boolean;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function scoreVenue(v: Venue, prefs: Preferences, ctx: VenueScoreContext): VenueScore {
  const w = ctx.foodPriority ? FOOD_WEIGHTS : NONFOOD_VENUE_WEIGHTS;
  const b: Record<string, number> = {};

  b.restaurantQuality = (v.qualityScore / 10) * w.restaurantQuality;

  const styles = prefs.foodStyles.filter((s) => s !== 'no-pref');
  const cuisineFrac = styles.length === 0 ? 0.6 : styles.filter((s) => v.categories.includes(s)).length / styles.length;
  b.cuisineMatch = cuisineFrac * w.cuisineMatch;

  const iconicBase = v.iconicScore / 10;
  b.iconicVenue = clamp01(iconicBase + (prefs.interests.includes('iconic') ? 0.2 : 0)) * w.iconicVenue;

  b.localFavourite = (v.localFavouriteScore / 10) * w.localFavourite;

  const minDist = ctx.plannedZones.length
    ? Math.min(...ctx.plannedZones.map((z) => walkMinutes(v.zone, z)))
    : VENUE_PENALTIES.comfortableTravelMinutes;
  b.geographicFit = clamp01(1 - minDist / 30) * w.geographicFit;

  b.budgetMatch = (v.priceLevel <= prefs.budget ? 1 : 0) * w.budgetMatch;

  b.mealTimeFit = (v.idealMeal.includes(ctx.slot) ? 1 : 0.4) * w.mealTimeFit;

  // View bonus when the visitor cares about photography/views.
  if (prefs.interests.includes('photography')) b.viewBonus = (v.viewScore / 10) * 6;

  // Penalties
  const open = venueOpenAt(v, ctx.weekday, ctx.time);
  b.closedPenalty = open ? 0 : -VENUE_PENALTIES.closed;
  b.budgetOverPenalty = v.priceLevel > prefs.budget ? -(v.priceLevel - prefs.budget) * VENUE_PENALTIES.budgetOver : 0;
  const excess = Math.max(0, minDist - VENUE_PENALTIES.comfortableTravelMinutes);
  b.excessiveTravelPenalty = -excess * VENUE_PENALTIES.excessiveTravel;

  const total = Object.values(b).reduce((s, n) => s + n, 0);
  return { total, breakdown: b, open };
}
