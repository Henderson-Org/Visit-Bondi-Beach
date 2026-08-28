/**
 * Derived statistics over the Sydney Branch rescue series.
 *
 * As everywhere else on this site, derived values are computed, never stored — so a
 * summary can never drift from the rows it summarises. Every function tolerates gaps in
 * the series, because the series genuinely has gaps and filling them would mean inventing
 * seasons that were never verified.
 */
import { RESCUE_SEASONS, type RescueSeason } from '@/data/rescue-statistics';

export function seasons(): RescueSeason[] {
  return [...RESCUE_SEASONS].sort((a, b) => a.endYear - b.endYear);
}

export function latestSeason(): RescueSeason {
  return seasons()[seasons().length - 1];
}

export function earliestSeason(): RescueSeason {
  return seasons()[0];
}

/** Mean rescues across the verified seasons. */
export function averageRescues(): number {
  const s = seasons();
  return Math.round(s.reduce((n, x) => n + x.rescues, 0) / s.length);
}

export function busiestSeason(): RescueSeason {
  return seasons().reduce((a, b) => (b.rescues > a.rescues ? b : a));
}

export function quietestSeason(): RescueSeason {
  return seasons().reduce((a, b) => (b.rescues < a.rescues ? b : a));
}

/**
 * The share of NSW rescues this branch accounted for, per season. A useful, honest way
 * to convey how busy this stretch of coast is without claiming a per-beach number.
 */
export function shareOfNsw(s: RescueSeason): number {
  return Math.round((s.rescues / s.nswRescues) * 1000) / 10;
}

/** Rescues per 100,000 beach visits — normalises for how busy the beaches were. */
export function rescuesPerHundredThousandVisits(s: RescueSeason): number | null {
  if (!s.attendance) return null;
  return Math.round((s.rescues / s.attendance) * 100_000 * 10) / 10;
}

/**
 * Change from the first to the most recent verified season, as a percentage.
 * Deliberately described as first-to-latest rather than "a trend": with gaps in the
 * series and only five data points, a regression line would imply more than we know.
 */
export function changeFirstToLatest(): { pct: number; from: RescueSeason; to: RescueSeason } {
  const from = earliestSeason();
  const to = latestSeason();
  return { pct: Math.round(((to.rescues - from.rescues) / from.rescues) * 1000) / 10, from, to };
}

/** Seasons that carry a verified value for a given metric. */
export function withMetric<K extends keyof RescueSeason>(key: K): RescueSeason[] {
  return seasons().filter((s) => s[key] != null);
}
