/**
 * Pure tide helpers - derive a normalized TideInfo from a list of tide extremes.
 * No I/O and `now` is injected, so it's deterministic and unit-tested.
 */
import type { TideExtreme, TideInfo } from './types';

/**
 * From upcoming/past extremes + the current height, work out whether the tide is
 * rising or falling and when the next high/low are.
 *
 * State: if the next extreme is a high, the tide is rising toward it; if a low,
 * it's falling. If we're essentially at an extreme we report high/low.
 */
export function resolveTide(
  extremes: TideExtreme[],
  currentHeightM: number | null,
  nowMs: number
): TideInfo {
  const sorted = [...extremes].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const future = sorted.filter((e) => Date.parse(e.time) >= nowMs);

  const nextHigh = future.find((e) => e.type === 'high') ?? null;
  const nextLow = future.find((e) => e.type === 'low') ?? null;
  const nextExtreme = future[0] ?? null;

  let state: TideInfo['state'] = null;
  if (nextExtreme) {
    // Within ~10 minutes of the next extreme → treat as at that extreme.
    const mins = (Date.parse(nextExtreme.time) - nowMs) / 60000;
    if (mins <= 10) state = nextExtreme.type;
    else state = nextExtreme.type === 'high' ? 'rising' : 'falling';
  }

  return {
    state,
    heightM: currentHeightM,
    nextHighTime: nextHigh?.time ?? null,
    nextLowTime: nextLow?.time ?? null,
  };
}
