import { describe, it, expect } from 'vitest';
import { buildSummary, type SummaryInput } from './summary';
import { degToCompass, windEffectOnSurf, surfBand, windStrengthWord } from './geo';
import { pickCategory, recommendFromConditions } from './recommend';
import { resolveTide } from './tide';
import type { TideExtreme } from './types';
import type { WeatherConditions, DailyWeatherForecast, SurfConditions, ConditionsLocation, Conditions } from './types';

const BONDI: ConditionsLocation = {
  key: 'bondi', label: 'Bondi', displayName: 'Bondi', inland: false,
  weather: { lat: -33.89, lon: 151.27, label: 'Bondi' },
  surf: { lat: -33.89, lon: 151.28, label: 'Bondi', beachFacingDeg: 110 },
  safetyUrl: 'https://beachsafe.org.au/beach/bondi-beach',
  authoritativeWeatherUrl: 'https://www.bom.gov.au/places/nsw/bondi-beach/',
  authoritativeSurfUrl: null,
};

function weather(p: Partial<WeatherConditions>): WeatherConditions {
  return {
    temperatureC: 22, apparentTemperatureC: 22, isDay: true,
    weather: { code: 1, label: 'Mostly sunny', emoji: '🌤️' },
    windSpeedKmh: 8, windGustKmh: 15, windDirectionDeg: 20,
    windCompass: degToCompass(20), uvIndex: 5, ...p,
  };
}
function daily(p: Partial<DailyWeatherForecast>): DailyWeatherForecast {
  return {
    date: '2026-01-15', maxTempC: 26, minTempC: 19, rainChancePct: 10, uvIndexMax: 9,
    weather: { code: 1, label: 'Mostly sunny', emoji: '🌤️' },
    sunrise: '2026-01-15T06:00', sunset: '2026-01-15T20:00',
    windMaxKmh: 14, windDominantDeg: 20, ...p,
  };
}
function surf(p: Partial<SurfConditions>): SurfConditions {
  return {
    waveHeightM: 0.8, waveHeightMaxM: 0.9, swellHeightM: 0.7,
    swellDirectionDeg: 160, swellCompass: degToCompass(160), swellPeriodS: 9,
    windWaveHeightM: 0.1, waterTempC: 21, tide: null, ...p,
  };
}
const input = (o: Partial<SummaryInput>): SummaryInput => ({
  location: BONDI, current: weather({}), today: daily({}), surf: surf({}), ...o,
});

describe('geo helpers', () => {
  it('converts degrees to compass', () => {
    expect(degToCompass(0)).toBe('N');
    expect(degToCompass(90)).toBe('E');
    expect(degToCompass(180)).toBe('S');
    expect(degToCompass(270)).toBe('W');
    expect(degToCompass(null)).toBeNull();
  });

  it('classifies wind as offshore/onshore for a beach facing 110°', () => {
    // Bondi faces ~110° (ESE). Westerly (from 270°) blows out to sea = offshore.
    expect(windEffectOnSurf(270, 15, 110)).toBe('offshore');
    // Easterly (from 110°) blows in from the sea = onshore.
    expect(windEffectOnSurf(110, 15, 110)).toBe('onshore');
    // Very light wind = calm regardless of direction.
    expect(windEffectOnSurf(110, 2, 110)).toBe('calm');
  });

  it('bands wave heights into friendly ranges', () => {
    expect(surfBand(0.3)?.label).toBe('under 0.5m');
    expect(surfBand(0.8)?.label).toBe('0.5–1m');
    expect(surfBand(1.2)?.label).toBe('1–1.5m');
    expect(surfBand(2.4)?.label).toBe('2–3m');
    expect(surfBand(4)?.label).toBe('3m+');
  });

  it('describes wind strength', () => {
    expect(windStrengthWord(3)).toBe('calm');
    expect(windStrengthWord(8)).toBe('light');
    expect(windStrengthWord(18)).toBe('moderate');
    expect(windStrengthWord(45)).toBe('strong');
  });
});

describe('written-summary engine', () => {
  it('reports a low chance of rain plainly', () => {
    const s = buildSummary(input({ today: daily({ rainChancePct: 5 }) }));
    expect(s.paragraph).toContain('only a slight chance of rain');
  });

  it('flags morning as best when winds increase during the day', () => {
    const s = buildSummary(input({
      current: weather({ windSpeedKmh: 6, windDirectionDeg: 270, windCompass: 'W' }),
      today: daily({ windMaxKmh: 28 }),
    }));
    expect(s.bestSurfTime).toBe('Morning');
    expect(s.paragraph.toLowerCase()).toContain('before they increase');
  });

  it('describes small surf as around 0.5–1m', () => {
    const s = buildSummary(input({ surf: surf({ waveHeightM: 0.7, swellHeightM: 0.6 }) }));
    expect(s.paragraph).toContain('around 0.5–1m');
    expect(s.paragraph).toContain('small');
  });

  it('flags large surf with a hazard note and experienced suitability', () => {
    const s = buildSummary(input({
      surf: surf({ waveHeightM: 2.6, waveHeightMaxM: 2.8, swellHeightM: 2.6, swellPeriodS: 13 }),
    }));
    expect(s.paragraph).toContain('2–3m');
    expect(s.suitability).toBe('experienced');
    expect(s.safetyNote).toContain('swim between the flags');
  });

  it('says offshore winds keep it clean when wind blows off the land', () => {
    const s = buildSummary(input({
      current: weather({ windSpeedKmh: 12, windDirectionDeg: 270, windCompass: 'W' }),
      today: daily({ windMaxKmh: 14 }),
    }));
    expect(s.paragraph.toLowerCase()).toContain('offshore winds are helping keep');
  });

  it('warns that strong onshore winds make it messy', () => {
    const s = buildSummary(input({
      current: weather({ windSpeedKmh: 30, windDirectionDeg: 110, windCompass: 'ESE' }),
      surf: surf({ waveHeightM: 1.2, waveHeightMaxM: 1.3 }),
    }));
    expect(s.paragraph.toLowerCase()).toContain('messy');
    expect(s.suitability).toBe('poor');
  });

  it('labels small clean surf as beginner-friendly', () => {
    const s = buildSummary(input({
      current: weather({ windSpeedKmh: 8, windDirectionDeg: 270, windCompass: 'W' }),
      surf: surf({ waveHeightM: 0.6, waveHeightMaxM: 0.8 }),
    }));
    expect(s.suitability).toBe('beginner');
    expect(s.surfOutlook).toContain('potentially suitable');
  });

  it('never states the surf is safe', () => {
    for (const h of [0.4, 1.0, 1.8, 3.2]) {
      const s = buildSummary(input({ surf: surf({ waveHeightM: h, waveHeightMaxM: h }) }));
      const text = `${s.paragraph} ${s.surfOutlook ?? ''} ${s.safetyNote ?? ''}`.toLowerCase();
      expect(text).not.toMatch(/\bsafe\b/);
    }
  });

  it('omits surf sentences when there is no surf data (inland / missing)', () => {
    const s = buildSummary(input({ surf: null }));
    expect(s.paragraph).not.toContain('Surf is');
    expect(s.suitability).toBeNull();
    expect(s.safetyNote).toBeNull();
    // Weather sentence still present.
    expect(s.paragraph.toLowerCase()).toContain('today');
  });

  // This previously asserted a non-empty paragraph for empty input, which locked in a
  // fabrication: with no temperature the summary said "Mild today". Saying nothing is the
  // correct behaviour when we know nothing.
  it('says nothing rather than inventing a temperature when there is no reading', () => {
    const s = buildSummary(input({ current: null, today: null, surf: null }));
    expect(s.paragraph.toLowerCase()).not.toContain('mild');
    expect(s.headline.toLowerCase()).not.toContain('mild');
  });

  it('does not invent a temperature word when only the marine provider responded', () => {
    // The real partial-outage shape: weather 404s, surf succeeds.
    const s = buildSummary(input({ current: null, today: null }));
    expect(s.paragraph.toLowerCase()).not.toContain('mild today');
    // It should still describe the surf it actually has.
    expect(s.paragraph.length).toBeGreaterThan(0);
  });
});

function conditions(o: Partial<SummaryInput>): Conditions {
  const i = input(o);
  return {
    location: i.location, current: i.current, today: i.today, surf: i.surf,
    weatherMeta: null, surfMeta: null, tideMeta: null,
    water: null, waterMeta: null, summary: buildSummary(i),
  };
}

describe('conditions-driven recommendations', () => {
  it('recommends indoor options when rain is likely', () => {
    const r = recommendFromConditions(conditions({ today: daily({ rainChancePct: 80 }) }));
    expect(r.category).toBe('wet');
    expect(r.links.some((l) => /indoor/i.test(l.title))).toBe(true);
  });

  it('treats a wet weather code as wet even if rain % is low', () => {
    const c = conditions({
      current: weather({ weather: { code: 63, label: 'Rain', emoji: '🌧️' } }),
      today: daily({ rainChancePct: 10 }),
    });
    expect(pickCategory(c)).toBe('wet');
  });

  it('suggests getting outside on a warm, clear day', () => {
    const r = recommendFromConditions(conditions({
      current: weather({ weather: { code: 0, label: 'Clear', emoji: '☀️' }, temperatureC: 27 }),
      today: daily({ weather: { code: 0, label: 'Clear', emoji: '☀️' }, maxTempC: 28, rainChancePct: 5 }),
    }));
    expect(r.category).toBe('great-outdoors');
  });

  it('points to relaxed swim spots when surf is small and clean (and it is not a peak beach day)', () => {
    // Partly cloudy + mild so the "great outdoors" branch doesn't take priority,
    // isolating the small-surf branch.
    const r = recommendFromConditions(conditions({
      current: weather({ weather: { code: 2, label: 'Partly cloudy', emoji: '⛅' }, temperatureC: 19, windSpeedKmh: 8, windDirectionDeg: 270, windCompass: 'W' }),
      today: daily({ weather: { code: 2, label: 'Partly cloudy', emoji: '⛅' }, maxTempC: 20, rainChancePct: 10 }),
      surf: surf({ waveHeightM: 0.6, waveHeightMaxM: 0.8 }),
    }));
    expect(r.category).toBe('small-surf');
    expect(r.links.some((l) => /swim|pool/i.test(l.title))).toBe(true);
  });

  it('flags a cold day', () => {
    const c = conditions({ today: daily({ maxTempC: 13, rainChancePct: 10 }) });
    expect(pickCategory(c)).toBe('cold');
  });

  it('always returns a non-empty message and at least one real link', () => {
    const r = recommendFromConditions(conditions({}));
    expect(r.message.length).toBeGreaterThan(0);
    expect(r.links.length).toBeGreaterThan(0);
    for (const l of r.links) expect(l.path.startsWith('/')).toBe(true);
  });
});

describe('tide resolution', () => {
  const now = Date.parse('2026-01-15T10:00:00Z');
  const extremes: TideExtreme[] = [
    { type: 'low', time: '2026-01-15T08:00:00Z', heightM: 0.3 },
    { type: 'high', time: '2026-01-15T14:00:00Z', heightM: 1.6 },
    { type: 'low', time: '2026-01-15T20:00:00Z', heightM: 0.4 },
  ];

  it('reports rising when the next extreme is a high', () => {
    const t = resolveTide(extremes, 0.9, now);
    expect(t.state).toBe('rising');
    expect(t.nextHighTime).toBe('2026-01-15T14:00:00Z');
    expect(t.heightM).toBe(0.9);
  });

  it('reports falling when the next extreme is a low', () => {
    const t = resolveTide(extremes, 1.4, Date.parse('2026-01-15T15:00:00Z'));
    expect(t.state).toBe('falling');
    expect(t.nextLowTime).toBe('2026-01-15T20:00:00Z');
  });

  it('reports the extreme itself when we are essentially at it', () => {
    const t = resolveTide(extremes, 1.6, Date.parse('2026-01-15T13:55:00Z'));
    expect(t.state).toBe('high');
  });

  it('adds a tide note to the written summary when tide is known', () => {
    const s = buildSummary(input({
      surf: surf({ tide: { state: 'rising', heightM: 0.9, nextHighTime: '2026-01-15T14:00:00Z', nextLowTime: '2026-01-15T20:00:00Z' } }),
    }));
    expect(s.paragraph).toContain('tide is coming in');
  });
});
