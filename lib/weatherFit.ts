/**
 * Weather-awareness for the day planner.
 *
 * A Bondi day plan that ignores the weather is a brochure. This biases the itinerary
 * towards what the day actually supports and, just as importantly, SAYS SO — a plan that
 * quietly drops the swim is worse than one that explains why.
 *
 * Two honesty constraints shape the design:
 *
 * 1. We only know TODAY. The planner accepts any date; the conditions layer forecasts the
 *    current day. So weather adjustment applies only when the planned date is today, and
 *    the caller is responsible for that check (`weatherAppliesTo`). For any other date the
 *    planner behaves exactly as before rather than applying stale or invented weather.
 *
 * 2. Exposure is DERIVED, not declared. The experience records carry no indoor/outdoor
 *    flag, and adding one across ~40 records would mean inventing a field from the same
 *    categories this reads. Deriving it from `categories` keeps one source of truth and
 *    makes the reasoning auditable.
 */
import type { Interest } from '@/types/preferences';

/** How badly an experience is affected by weather. */
export type Exposure = 'exposed' | 'partly' | 'sheltered';

/**
 * Categories that put you outside with nothing over your head. Swimming and the beach are
 * the obvious ones; the coastal walk and photography are clifftop activities, and fitness
 * here means running the promenade.
 */
const EXPOSED: Interest[] = ['swimming', 'beach', 'coastal-walks', 'photography', 'fitness'];
/** Outside, but you can duck under an awning or leave quickly. */
const PARTLY: Interest[] = ['markets', 'shopping', 'iconic'];

export function exposureOf(categories: Interest[]): Exposure {
  if (categories.some((c) => EXPOSED.includes(c))) return 'exposed';
  if (categories.some((c) => PARTLY.includes(c))) return 'partly';
  return 'sheltered';
}

/** The subset of today's conditions the planner reasons about. */
export interface PlanWeather {
  /** True when it is raining or forecast to. */
  wet: boolean;
  rainChancePct: number | null;
  maxTempC: number | null;
  /** Significant wave height (m) — big surf makes a casual swim a bad plan. */
  waveHeightM: number | null;
  waterTempC: number | null;
  uvIndexMax: number | null;
}

/** Does the planned date fall on the day these conditions describe? */
export function weatherAppliesTo(plannedDate: string, today: string): boolean {
  return plannedDate === today;
}

/**
 * Score adjustment for an experience given the day. Returns 0 when the weather is fine or
 * unknown, so a missing reading never changes the plan.
 *
 * These are nudges, not vetoes: a determined visitor can still want the beach in the rain,
 * and the itinerary keeps the stop if nothing better fits. Magnitudes are in the same units
 * as EXPERIENCE_WEIGHTS (base is 10), so a -12 is decisive but not absolute.
 */
export function weatherAdjustment(categories: Interest[], w: PlanWeather): number {
  const exposure = exposureOf(categories);
  if (exposure === 'sheltered') return 0;

  let adj = 0;
  if (w.wet || (w.rainChancePct != null && w.rainChancePct >= 60)) {
    adj -= exposure === 'exposed' ? 12 : 5;
  }
  if (w.maxTempC != null && w.maxTempC < 16) {
    adj -= exposure === 'exposed' ? 6 : 2;
  }
  // Big surf specifically discourages getting in the water, not being near it.
  if (w.waveHeightM != null && w.waveHeightM >= 2 && categories.includes('swimming')) {
    adj -= 10;
  }
  if (w.waterTempC != null && w.waterTempC < 16 && categories.includes('swimming')) {
    adj -= 5;
  }
  // A genuinely good day nudges the outdoors back up, so a fine forecast reads as one.
  if (!w.wet && w.maxTempC != null && w.maxTempC >= 24 && (w.rainChancePct ?? 0) < 30) {
    adj += exposure === 'exposed' ? 4 : 2;
  }
  return adj;
}

/**
 * Visible advisories for the plan. These are the point of the feature — the itinerary
 * explains what the weather did to it instead of silently reshuffling.
 */
export function weatherNotes(w: PlanWeather): { notes: string[]; warnings: string[] } {
  const notes: string[] = [];
  const warnings: string[] = [];

  if (w.wet || (w.rainChancePct != null && w.rainChancePct >= 60)) {
    notes.push(
      `Today's forecast is wet${w.rainChancePct != null ? ` (${w.rainChancePct}% chance of rain)` : ''}, so we've leaned this plan towards things that work under cover.`,
    );
  } else if (w.maxTempC != null && w.maxTempC >= 24 && (w.rainChancePct ?? 0) < 30) {
    notes.push(`It's a good Bondi day - around ${Math.round(w.maxTempC)}°C and mostly dry - so this plan makes the most of being outside.`);
  }

  if (w.waveHeightM != null && w.waveHeightM >= 2) {
    warnings.push(
      `The surf is running about ${w.waveHeightM.toFixed(1)}m today. Swim between the flags and check with the lifeguards before you get in.`,
    );
  }
  if (w.waterTempC != null && w.waterTempC < 16) {
    notes.push(`The water is about ${Math.round(w.waterTempC)}°C - bracing. The Icebergs pool is the gentler option.`);
  }
  if (w.uvIndexMax != null && w.uvIndexMax >= 8) {
    warnings.push(
      `UV peaks around ${Math.round(w.uvIndexMax)} today (very high). Hat, shirt and shade between 10am and 3pm.`,
    );
  }
  return { notes, warnings };
}
