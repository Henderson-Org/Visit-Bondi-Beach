import { describe, it, expect } from 'vitest';
import { exposureOf, weatherAdjustment, weatherNotes, weatherAppliesTo, type PlanWeather } from './weatherFit';
import { generateItinerary } from './generateBondiItinerary';
import type { Preferences } from '@/types/preferences';

const w = (over: Partial<PlanWeather> = {}): PlanWeather => ({
  wet: false, rainChancePct: 10, maxTempC: 24, waveHeightM: 1, waterTempC: 21, uvIndexMax: 5, ...over,
});

describe('exposureOf', () => {
  it('treats water and clifftop activities as exposed', () => {
    expect(exposureOf(['swimming'])).toBe('exposed');
    expect(exposureOf(['coastal-walks'])).toBe('exposed');
    expect(exposureOf(['photography'])).toBe('exposed');
  });
  it('treats eating and drinking as sheltered', () => {
    expect(exposureOf(['food'])).toBe('sheltered');
    expect(exposureOf(['coffee', 'relaxing'])).toBe('sheltered');
    expect(exposureOf(['nightlife'])).toBe('sheltered');
  });
  it('treats markets and shopping as partly exposed', () => {
    expect(exposureOf(['markets'])).toBe('partly');
  });
  it('takes the most exposed category when an activity spans several', () => {
    expect(exposureOf(['food', 'swimming'])).toBe('exposed');
  });
});

describe('weatherAdjustment', () => {
  it('does not move sheltered activities at all, whatever the weather', () => {
    expect(weatherAdjustment(['food'], w({ wet: true, rainChancePct: 95 }))).toBe(0);
    expect(weatherAdjustment(['coffee'], w({ maxTempC: 8 }))).toBe(0);
  });

  it('penalises exposed activities on a wet day', () => {
    expect(weatherAdjustment(['swimming'], w({ wet: true }))).toBeLessThan(0);
    expect(weatherAdjustment(['coastal-walks'], w({ rainChancePct: 80 }))).toBeLessThan(0);
  });

  it('penalises exposed more than partly-exposed', () => {
    const wet = w({ wet: true });
    expect(weatherAdjustment(['coastal-walks'], wet)).toBeLessThan(weatherAdjustment(['markets'], wet));
  });

  it('discourages swimming specifically in big surf, not just being outdoors', () => {
    const big = w({ waveHeightM: 2.5 });
    expect(weatherAdjustment(['swimming'], big)).toBeLessThan(weatherAdjustment(['coastal-walks'], big));
  });

  it('rewards exposed activities on a genuinely good day', () => {
    expect(weatherAdjustment(['swimming'], w({ maxTempC: 28, rainChancePct: 5 }))).toBeGreaterThan(0);
  });

  it('is neutral when every reading is missing, so absent data never reshapes a plan', () => {
    const unknown: PlanWeather = { wet: false, rainChancePct: null, maxTempC: null, waveHeightM: null, waterTempC: null, uvIndexMax: null };
    expect(weatherAdjustment(['swimming'], unknown)).toBe(0);
    expect(weatherAdjustment(['coastal-walks'], unknown)).toBe(0);
  });
});

describe('weatherNotes', () => {
  it('explains a wet-day plan rather than silently reshuffling it', () => {
    const { notes } = weatherNotes(w({ wet: true, rainChancePct: 85 }));
    expect(notes.join(' ')).toMatch(/wet/i);
    expect(notes.join(' ')).toMatch(/under cover/i);
  });
  it('warns about big surf and points at the flags, never calling it safe', () => {
    const { warnings } = weatherNotes(w({ waveHeightM: 2.4 }));
    expect(warnings.join(' ')).toMatch(/flags/i);
    expect(warnings.join(' ')).not.toMatch(/\bis safe\b/i);
  });
  it('warns on very high UV', () => {
    expect(weatherNotes(w({ uvIndexMax: 11 })).warnings.join(' ')).toMatch(/uv/i);
  });
  it('says nothing when the day is unremarkable', () => {
    const { notes, warnings } = weatherNotes(w({ maxTempC: 20, rainChancePct: 20, uvIndexMax: 4, waveHeightM: 1 }));
    expect(notes).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

describe('weatherAppliesTo', () => {
  it('applies only to the day the conditions describe', () => {
    expect(weatherAppliesTo('2026-08-25', '2026-08-25')).toBe(true);
    expect(weatherAppliesTo('2026-08-26', '2026-08-25')).toBe(false);
    expect(weatherAppliesTo('2026-12-25', '2026-08-25')).toBe(false);
  });
});

describe('generateItinerary with weather', () => {
  const prefs: Preferences = {
    date: '2026-08-25', startTime: 'morning', duration: 'full',
    interests: ['swimming', 'beach', 'food', 'coastal-walks'],
    foodStyles: ['brunch'], budget: 2, walking: 'medium', pace: 'balanced',
  };

  it('produces an identical plan to the no-weather call when weather is null', () => {
    const a = generateItinerary(prefs);
    const b = generateItinerary(prefs, null);
    expect(b.items.map((i) => i.refId)).toEqual(a.items.map((i) => i.refId));
    expect(b.notes).toEqual(a.notes);
  });

  it('surfaces the weather advisory ahead of the other notes', () => {
    const wet = generateItinerary(prefs, w({ wet: true, rainChancePct: 90 }));
    expect(wet.notes[0]).toMatch(/wet/i);
  });

  it('still returns a usable plan on a bad-weather day', () => {
    const wet = generateItinerary(prefs, w({ wet: true, rainChancePct: 95, maxTempC: 14, waveHeightM: 3 }));
    expect(wet.items.length).toBeGreaterThan(0);
    expect(wet.advisories.join(' ')).toMatch(/surf/i);
  });
});
