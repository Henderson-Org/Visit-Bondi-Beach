/**
 * Klook/affiliate activity scoring — quality-first. The commercial bonus is deliberately
 * tiny so commission can never outrank a strong free/local experience. A meaningful boost
 * only applies when the visitor explicitly wants active/guided/iconic experiences.
 */
import { KLOOK } from '@/config/scoringWeights';
import { walkMinutes, type Zone } from '@/lib/bondiZones';
import type { KlookActivity } from '@/data/klookActivities';
import type { TimeOfDay } from '@/data/bondiExperiences';
import type { Preferences } from '@/types/preferences';

export interface KlookScore {
  total: number;
  breakdown: Record<string, number>;
}

export function scoreKlook(a: KlookActivity, prefs: Preferences, ctx: { timeOfDay: TimeOfDay; plannedZones: Zone[] }): KlookScore {
  const b: Record<string, number> = {};
  b.editorial = a.editorialScore * KLOOK.editorialWeight;

  const matched = a.fulfillsPreferences.filter((p) => prefs.interests.includes(p)).length;
  b.preferenceFit = Math.min(matched, KLOOK.preferenceFitCap) * KLOOK.preferenceFit;

  // Meaningful boost only for active/guided/iconic intent that the activity actually serves.
  const wantsActive = prefs.interests.includes('fitness') || prefs.interests.includes('iconic') || prefs.interests.includes('family');
  b.intentBoost = wantsActive && matched > 0 ? KLOOK.intentBoost : 0;

  const minDist = ctx.plannedZones.length ? Math.min(...ctx.plannedZones.map((z) => walkMinutes(a.zone, z))) : 8;
  b.geographicFit = Math.max(0, 1 - minDist / 30) * KLOOK.geographicFit;

  b.timeFit = a.idealTimeOfDay.includes(ctx.timeOfDay) ? 6 : 0;

  b.commercialBonus = (a.commercialScore / 10) * KLOOK.commercialBonus;

  // Featured activities are surfaced broadly — but only when they actually match the visitor
  // (matched > 0), so a featured surf lesson never lands on an unrelated food-only day.
  b.featuredBoost = a.featured && matched > 0 ? KLOOK.featuredBoost : 0;

  const total = Object.values(b).reduce((s, n) => s + n, 0);
  return { total, breakdown: b };
}
