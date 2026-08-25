import { describe, it, expect } from 'vitest';
import { buildToday, swimCall, busynessCall, uvBand, clockTime } from './today';
import type { Conditions } from './types';

/** Minimal Conditions stub; only the fields the dashboard reads are set. */
const conds = (over: {
  air?: number | null; max?: number | null; rain?: number | null; uv?: number | null;
  water?: number | null; wave?: number | null; code?: number | null; sunset?: string | null;
}): Conditions =>
  ({
    location: { key: 'bondi', label: 'Bondi', displayName: 'Bondi', inland: false,
      weather: { lat: 0, lon: 0, label: '' }, surf: { lat: 0, lon: 0, label: '', beachFacingDeg: 90 },
      safetyUrl: null, authoritativeWeatherUrl: '', authoritativeSurfUrl: null },
    current: { temperatureC: over.air ?? null, apparentTemperatureC: null, isDay: true,
      weather: over.code != null ? { code: over.code, label: '', emoji: '' } : null,
      windSpeedKmh: null, windGustKmh: null, windDirectionDeg: null, windCompass: null, uvIndex: null },
    today: { date: null, maxTempC: over.max ?? null, minTempC: null, rainChancePct: over.rain ?? null,
      uvIndexMax: over.uv ?? null, weather: null, sunrise: null, sunset: over.sunset ?? null,
      windMaxKmh: null, windDominantDeg: null },
    surf: { waveHeightM: over.wave ?? null, waveHeightMaxM: null, swellHeightM: null,
      swellDirectionDeg: null, swellCompass: null, swellPeriodS: null, windWaveHeightM: null,
      waterTempC: over.water ?? null, tide: null },
    weatherMeta: null, surfMeta: null, tideMeta: null,
    summary: { headline: '', paragraph: '', bestSurfTime: null, surfOutlook: null, suitability: null, safetyNote: null },
  }) as Conditions;

const SAT = 6, WED = 3;

describe('clockTime / uvBand', () => {
  it('formats a local ISO time as a 12-hour clock', () => {
    expect(clockTime('2026-08-25T19:42')).toBe('7:42pm');
    expect(clockTime('2026-08-25T06:05')).toBe('6:05am');
    expect(clockTime('2026-08-25T00:30')).toBe('12:30am');
    expect(clockTime(null)).toBeNull();
  });
  it('bands UV per the standard thresholds', () => {
    expect(uvBand(2)).toBe('Low');
    expect(uvBand(5)).toBe('Moderate');
    expect(uvBand(7)).toBe('High');
    expect(uvBand(10)).toBe('Very high');
    expect(uvBand(12)).toBe('Extreme');
    expect(uvBand(null)).toBeNull();
  });
});

describe('stat provenance', () => {
  it('labels observations as measured and predictions as forecast', () => {
    const m = buildToday(conds({ air: 22, water: 21, wave: 1.2, max: 25, rain: 10, uv: 9, sunset: '2026-08-25T17:12' }), WED);
    const kind = (k: string) => m.stats.find((s) => s.key === k)?.kind;
    expect(kind('air')).toBe('measured');
    expect(kind('water')).toBe('measured');
    expect(kind('surf')).toBe('measured');
    expect(kind('max')).toBe('forecast');
    expect(kind('rain')).toBe('forecast');
    expect(kind('uv')).toBe('forecast');
    expect(kind('sunset')).toBe('forecast');
  });

  it('omits a stat entirely rather than inventing a value', () => {
    const m = buildToday(conds({ air: 22 }), WED);
    expect(m.stats.map((s) => s.key)).toEqual(['air']);
    expect(m.stats.some((s) => s.value.includes('NaN') || s.value.includes('null'))).toBe(false);
  });

  it('produces no stats at all when every provider failed', () => {
    expect(buildToday(conds({}), WED).stats).toHaveLength(0);
  });
});

describe('swimCall', () => {
  it('leads with the surf when it is big, regardless of temperature', () => {
    expect(swimCall(conds({ water: 23, wave: 2.4 }))!.verdict).toMatch(/not a gentle swim/i);
  });
  it('calls a warm, small-surf day good', () => {
    expect(swimCall(conds({ water: 22, wave: 0.8 }))!.verdict).toMatch(/good day for a swim/i);
  });
  it('warns on cold water', () => {
    expect(swimCall(conds({ water: 14, wave: 0.6 }))!.verdict).toMatch(/bracing/i);
  });
  it('never claims the water is safe, and always points at the flags', () => {
    for (const c of [conds({ water: 22, wave: 0.5 }), conds({ water: 14, wave: 2.5 })]) {
      const call = swimCall(c)!;
      expect(`${call.verdict} ${call.because}`).not.toMatch(/\bis safe\b|\bsafe to swim\b/i);
      expect(call.because).toMatch(/flags/i);
    }
  });
  it('returns null when there is no water or wave reading to reason from', () => {
    expect(swimCall(conds({ air: 25 }))).toBeNull();
  });
});

describe('busynessCall', () => {
  it('is always framed as an estimate and admits we hold no crowd data', () => {
    const call = busynessCall(conds({ max: 28 }), SAT)!;
    expect(call.because).toMatch(/estimate/i);
    expect(call.because).toMatch(/do not have live crowd data/i);
  });
  it('rates a hot weekend busiest', () => {
    expect(busynessCall(conds({ max: 30 }), SAT)!.verdict).toMatch(/very busy/i);
  });
  it('rates a cold or wet day quiet', () => {
    expect(busynessCall(conds({ max: 15 }), SAT)!.verdict).toMatch(/quiet/i);
    expect(busynessCall(conds({ max: 28, rain: 80 }), SAT)!.verdict).toMatch(/quiet/i);
  });
  it('distinguishes a warm weekday from a warm weekend', () => {
    const weekend = busynessCall(conds({ max: 23 }), SAT)!.verdict;
    const weekday = busynessCall(conds({ max: 23 }), WED)!.verdict;
    expect(weekend).not.toBe(weekday);
  });
  it('returns null without a temperature rather than guessing', () => {
    expect(busynessCall(conds({ rain: 10 }), SAT)).toBeNull();
  });
});
