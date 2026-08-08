/**
 * Deterministic experience scoring. Opinionated: the essentials (beach, Icebergs pool,
 * coastal walk) carry a must-do boost when they match the visitor, so a strong Bondi day
 * surfaces them even over a longer list of lesser attractions.
 */
import { EXPERIENCE_WEIGHTS, EXPERIENCE_PENALTIES } from '@/config/scoringWeights';
import { walkMinutes, type Zone } from '@/lib/bondiZones';
import type { Experience, TimeOfDay } from '@/data/bondiExperiences';
import type { Weekday } from '@/data/bondiVenues';
import type { Preferences, Walking } from '@/types/preferences';

export interface ExperienceScoreContext {
  weekday: Weekday;
  timeOfDay: TimeOfDay;
  plannedZones: Zone[];
  usedCategoryCounts: Record<string, number>; // for repetition penalty
}

export interface ExperienceScore {
  total: number;
  breakdown: Record<string, number>;
  available: boolean;
}

const WALK_RANK: Record<Walking, number> = { low: 1, medium: 2, high: 3 };
const EXP_WALK_RANK = { low: 1, medium: 2, high: 3 } as const;

export function scoreExperience(e: Experience, prefs: Preferences, ctx: ExperienceScoreContext): ExperienceScore {
  const w = EXPERIENCE_WEIGHTS;
  const b: Record<string, number> = {};

  b.base = w.base;

  const matches = e.categories.filter((c) => prefs.interests.includes(c)).length;
  b.preferenceMatch = Math.min(matches, w.preferenceMatchCap) * w.preferenceMatch;

  // Must-do boost only fires when the visitor matches at least one of its categories.
  b.mustDoBoost = matches > 0 ? (e.mustDoScore / 10) * w.mustDoBoost : 0;

  b.timeOfDayMatch = e.idealTimeOfDay.includes(ctx.timeOfDay) ? w.timeOfDayMatch : 0;

  const minDist = ctx.plannedZones.length ? Math.min(...ctx.plannedZones.map((z) => walkMinutes(e.zone, z))) : 8;
  b.proximityBonus = Math.max(0, 1 - minDist / 30) * w.proximityBonus;

  // Penalties
  const available = !e.operatingWeekdays || e.operatingWeekdays.includes(ctx.weekday);
  b.operatingDayPenalty = available ? 0 : -EXPERIENCE_PENALTIES.operatingDayClosed;

  const walkMismatch = EXP_WALK_RANK[e.walkingLevel] > WALK_RANK[prefs.walking];
  b.walkingMismatchPenalty = walkMismatch ? -EXPERIENCE_PENALTIES.walkingMismatch : 0;

  const rep = e.categories.reduce((s, c) => s + (ctx.usedCategoryCounts[c] || 0), 0);
  b.repetitionPenalty = -Math.min(rep, 3) * (EXPERIENCE_PENALTIES.repetition / 3);

  const total = Object.values(b).reduce((s, n) => s + n, 0);
  return { total, breakdown: b, available };
}
