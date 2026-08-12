/**
 * Pure geo/units helpers shared by adapters and the summary engine.
 * No I/O - safe to unit-test in isolation.
 */
import type { Compass } from './types';

const COMPASS_16: Compass[] = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

/** Meteorological bearing (deg, "from") → 16-point compass. */
export function degToCompass(deg: number | null | undefined): Compass | null {
  if (deg == null || Number.isNaN(deg)) return null;
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_16[idx];
}

/** Smallest angle (0–180°) between two bearings. */
export function angularDiff(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** Compass point → wind adjective, e.g. "SW" → "southwesterly". */
export function compassToAdjective(c: Compass | null): string | null {
  if (!c) return null;
  const map: Record<string, string> = {
    N: 'northerly', NNE: 'north-northeasterly', NE: 'northeasterly', ENE: 'east-northeasterly',
    E: 'easterly', ESE: 'east-southeasterly', SE: 'southeasterly', SSE: 'south-southeasterly',
    S: 'southerly', SSW: 'south-southwesterly', SW: 'southwesterly', WSW: 'west-southwesterly',
    W: 'westerly', WNW: 'west-northwesterly', NW: 'northwesterly', NNW: 'north-northwesterly',
  };
  return map[c] ?? null;
}

export type WindStrength = 'calm' | 'light' | 'moderate' | 'fresh' | 'strong';

export function windStrengthWord(kmh: number | null): WindStrength | null {
  if (kmh == null) return null;
  if (kmh < 5) return 'calm';
  if (kmh < 12) return 'light';
  if (kmh < 25) return 'moderate';
  if (kmh < 40) return 'fresh';
  return 'strong';
}

export type WindEffect = 'offshore' | 'onshore' | 'cross-shore' | 'calm';

/**
 * Effect of wind on surf quality for a beach that faces `beachFacingDeg`
 * (the direction the beach looks out to sea). Onshore wind blows in from the
 * ocean (messy); offshore blows out from the land (clean).
 */
export function windEffectOnSurf(
  windFromDeg: number | null,
  windSpeedKmh: number | null,
  beachFacingDeg: number
): WindEffect {
  if (windSpeedKmh != null && windSpeedKmh < 5) return 'calm';
  if (windFromDeg == null) return 'cross-shore';
  const diff = angularDiff(windFromDeg, beachFacingDeg);
  if (diff <= 60) return 'onshore';
  if (diff >= 120) return 'offshore';
  return 'cross-shore';
}

export interface SurfBand {
  lower: number;
  upper: number;
  label: string; // e.g. "1–1.5m"
}

/** Map a wave height (m) to a friendly display range. */
export function surfBand(m: number | null): SurfBand | null {
  if (m == null) return null;
  const bands: SurfBand[] = [
    { lower: 0, upper: 0.5, label: 'under 0.5m' },
    { lower: 0.5, upper: 1, label: '0.5–1m' },
    { lower: 1, upper: 1.5, label: '1–1.5m' },
    { lower: 1.5, upper: 2, label: '1.5–2m' },
    { lower: 2, upper: 3, label: '2–3m' },
    { lower: 3, upper: 99, label: '3m+' },
  ];
  return bands.find((b) => m < b.upper) ?? bands[bands.length - 1];
}

/** Round to a sensible display precision for temperatures. */
export function roundTemp(c: number | null): number | null {
  return c == null ? null : Math.round(c);
}
