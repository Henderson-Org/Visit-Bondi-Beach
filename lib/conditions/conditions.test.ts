import { describe, it, expect } from 'vitest';
import { buildSummary, type SummaryInput } from './summary';
import { degToCompass, windEffectOnSurf, surfBand, windStrengthWord } from './geo';
import type { WeatherConditions, DailyWeatherForecast, SurfConditions, ConditionsLocation } from './types';

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

  it('always produces a headline and a non-empty paragraph', () => {
    const s = buildSummary(input({}));
    expect(s.headline.length).toBeGreaterThan(0);
    expect(s.paragraph.length).toBeGreaterThan(0);
  });
});
