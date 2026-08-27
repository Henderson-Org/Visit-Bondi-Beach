import { describe, it, expect } from 'vitest';
import {
  parseSite, sampleAgeDays, isSampleStale, waterAdvice, RAIN_RULE,
  FORECAST_LABEL, GRADE_LABEL, SAMPLE_STALE_AFTER_DAYS, type WaterQuality,
} from './waterQuality';

const NOW = new Date('2026-08-27T00:00:00Z');

/** The exact shape the live Beachwatch feed returned for Bondi on 2026-08-27. */
const BONDI_LIVE = {
  id: '405ce99c-7a0b-43f7-8d28-2ee0b65eebb5',
  siteName: 'Bondi Beach',
  pollutionForecast: 'Unlikely',
  pollutionForecastTimeStamp: '2026-08-27T03:30:00.48+00:00',
  latestResult: 'Fair',
  latestResultRating: 3,
  latestResultObservationDate: '2026-08-20T10:00:00+10:00',
};

const site = (over: Partial<WaterQuality> = {}): WaterQuality => ({
  siteName: 'Bondi Beach', siteId: 'x', forecast: 'unlikely', forecastAt: null,
  grade: 'good', stars: 4, sampledAt: '2026-08-26T10:00:00+10:00', ...over,
});

describe('parseSite', () => {
  it('normalises the real Beachwatch payload', () => {
    const w = parseSite(BONDI_LIVE)!;
    expect(w.siteName).toBe('Bondi Beach');
    expect(w.forecast).toBe('unlikely');
    expect(w.grade).toBe('fair');
    expect(w.stars).toBe(3);
    expect(w.sampledAt).toBe('2026-08-20T10:00:00+10:00');
  });

  it('maps every value Beachwatch actually publishes', () => {
    // The four forecast values and three grades observed across all 245 sites in the feed.
    for (const [raw, want] of [['Unlikely', 'unlikely'], ['Possible', 'possible'], ['Likely', 'likely']] as const) {
      expect(parseSite({ ...BONDI_LIVE, pollutionForecast: raw })!.forecast).toBe(want);
    }
    for (const [raw, want] of [['Good', 'good'], ['Fair', 'fair'], ['Poor', 'poor']] as const) {
      expect(parseSite({ ...BONDI_LIVE, latestResult: raw })!.grade).toBe(want);
    }
  });

  it('degrades unknown or absent values to "unknown" rather than guessing', () => {
    expect(parseSite({ ...BONDI_LIVE, pollutionForecast: 'Forecast not available' })!.forecast).toBe('unknown');
    expect(parseSite({ ...BONDI_LIVE, pollutionForecast: null })!.forecast).toBe('unknown');
    expect(parseSite({ ...BONDI_LIVE, latestResult: null })!.grade).toBe('unknown');
    expect(parseSite({ ...BONDI_LIVE, latestResultRating: null })!.stars).toBeNull();
  });

  it('rejects a feature with no site name or id', () => {
    expect(parseSite({ siteName: 'Bondi Beach' })).toBeNull();
    expect(parseSite({ id: 'abc' })).toBeNull();
  });
});

describe('sample age', () => {
  it('reports how old the LAB SAMPLE is, not how fresh our fetch was', () => {
    // Sampled 2026-08-20T10:00+10:00 (= 00:00Z), "now" is 2026-08-27T00:00Z → exactly
    // 7 days, even though we fetched the feed today.
    expect(sampleAgeDays(parseSite(BONDI_LIVE)!, NOW)).toBe(7);
  });

  it('treats a missing sample date as stale rather than as fresh', () => {
    expect(sampleAgeDays(site({ sampledAt: null }), NOW)).toBeNull();
    expect(isSampleStale(site({ sampledAt: null }), NOW)).toBe(true);
  });

  it('goes stale after two sampling cycles', () => {
    const fresh = site({ sampledAt: '2026-08-25T10:00:00+10:00' });
    const old = site({ sampledAt: '2026-08-01T10:00:00+10:00' });
    expect(isSampleStale(fresh, NOW)).toBe(false);
    expect(isSampleStale(old, NOW)).toBe(true);
    expect(SAMPLE_STALE_AFTER_DAYS).toBe(14);
  });
});

describe('waterAdvice', () => {
  it('never says the water is safe or clean, whatever the grade', () => {
    for (const f of ['unlikely', 'possible', 'likely'] as const) {
      for (const g of ['good', 'fair', 'poor'] as const) {
        const text = waterAdvice(site({ forecast: f, grade: g }), NOW) ?? '';
        expect(text, `${f}/${g}`).not.toMatch(/\bis safe\b|\bsafe to swim\b|\bwater is clean\b/i);
      }
    }
  });

  it('attributes every claim to Beachwatch rather than asserting it ourselves', () => {
    for (const f of ['unlikely', 'possible', 'likely'] as const) {
      expect(waterAdvice(site({ forecast: f }), NOW)).toMatch(/beachwatch/i);
    }
  });

  it('escalates its language with the forecast', () => {
    expect(waterAdvice(site({ forecast: 'likely' }), NOW)).toMatch(/stay out of the water/i);
    expect(waterAdvice(site({ forecast: 'possible' }), NOW)).toMatch(/possible/i);
    expect(waterAdvice(site({ forecast: 'unlikely' }), NOW)).toMatch(/does not expect/i);
  });

  it('quotes a recent sample with its age, so nothing reads as a reading of right now', () => {
    const text = waterAdvice(site({ forecast: 'unlikely', grade: 'good', sampledAt: '2026-08-25T10:00:00+10:00' }), NOW)!;
    expect(text).toMatch(/2 days ago/);
    expect(text).toMatch(/good/i);
  });

  it('drops a stale sample from the advice instead of presenting week-old data as current', () => {
    const text = waterAdvice(site({ forecast: 'unlikely', grade: 'good', sampledAt: '2026-06-01T10:00:00+10:00' }), NOW)!;
    expect(text).not.toMatch(/last sample/i);
  });

  it('says nothing at all when there is no forecast', () => {
    expect(waterAdvice(site({ forecast: 'unknown' }), NOW)).toBeNull();
  });
});

describe('rain rule', () => {
  it('states Beachwatch guidance and distinguishes ocean from harbour beaches', () => {
    expect(RAIN_RULE).toMatch(/beachwatch/i);
    expect(RAIN_RULE).toMatch(/one day/i);
    expect(RAIN_RULE).toMatch(/three days/i);
    expect(RAIN_RULE).toMatch(/harbour/i);
  });
});

describe('labels', () => {
  it('covers every enum value, so the UI can never render undefined', () => {
    for (const k of ['unlikely', 'possible', 'likely', 'unknown'] as const) {
      expect(FORECAST_LABEL[k]).toBeTruthy();
    }
    for (const k of ['good', 'fair', 'poor', 'unknown'] as const) {
      expect(GRADE_LABEL[k]).toBeTruthy();
    }
  });
});
