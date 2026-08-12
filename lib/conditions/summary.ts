/**
 * Deterministic written-summary engine.
 *
 * Converts normalized conditions into a short, human-readable summary using
 * rules/templates only - NO LLM call at request time. Pure and side-effect free
 * so the rules are unit-tested (see summary.test.ts).
 *
 * Safety stance: we give general guidance, never definitive safety claims, and
 * never state that surf is "safe". When surf is elevated we add a hazard note
 * pointing people to official warnings and the flags.
 */
import type {
  WeatherConditions, DailyWeatherForecast, SurfConditions, ConditionsLocation,
  ConditionsSummary, SurfSuitability,
} from './types';
import {
  compassToAdjective, windStrengthWord, windEffectOnSurf, surfBand, roundTemp,
} from './geo';

export interface SummaryInput {
  location: ConditionsLocation;
  current: WeatherConditions | null;
  today: DailyWeatherForecast | null;
  surf: SurfConditions | null;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function tempWord(maxC: number | null, currentC: number | null): string {
  const t = maxC ?? currentC;
  if (t == null) return 'Mild';
  if (t < 10) return 'Cold';
  if (t < 15) return 'Cool';
  if (t < 20) return 'Mild';
  if (t < 25) return 'Warm';
  if (t < 30) return 'Hot';
  return 'Very hot';
}

function rainPhrase(pct: number | null): string | null {
  if (pct == null) return null;
  if (pct < 20) return 'only a slight chance of rain';
  if (pct < 45) return 'a chance of a shower';
  if (pct < 70) return 'a good chance of showers';
  return 'showers likely';
}

function swellSizeWord(m: number | null): string {
  if (m == null) return 'moderate';
  if (m < 0.5) return 'tiny';
  if (m < 1) return 'small';
  if (m < 1.5) return 'small-to-moderate';
  if (m < 2.5) return 'moderate';
  return 'large';
}

/** Weather sentence - always available (falls back to current temp). */
function weatherSentence(input: SummaryInput): string {
  const { current, today } = input;
  const label = today?.weather?.label ?? current?.weather?.label ?? null;
  const word = tempWord(today?.maxTempC ?? null, current?.temperatureC ?? null);
  const max = roundTemp(today?.maxTempC ?? null);
  const base = label ? `${word} and ${label.toLowerCase()} today` : `${word} today`;
  return max != null ? `${base}, with a top of ${max}°C.` : `${base}.`;
}

/** Wind + rain sentence. */
function windRainSentence(input: SummaryInput): string | null {
  const { current, today } = input;
  const strength = windStrengthWord(current?.windSpeedKmh ?? null);
  const adj = compassToAdjective(current?.windCompass ?? null);
  const rain = rainPhrase(today?.rainChancePct ?? null);

  let windPart: string | null = null;
  if (strength === 'calm') windPart = 'Winds are light and variable';
  else if (strength && adj) windPart = `Winds are ${strength} and ${adj}`;
  else if (strength) windPart = `Winds are ${strength}`;

  if (windPart && rain) return `${windPart}, with ${rain}.`;
  if (windPart) return `${windPart}.`;
  if (rain) return `There's ${rain}.`;
  return null;
}

/** Surf size + swell sentence (only when surf data exists). */
function surfSentence(surf: SurfConditions | null): string | null {
  if (!surf) return null;
  const band = surfBand(surf.waveHeightM);
  if (!band) return null;
  const swellWord = swellSizeWord(surf.swellHeightM);
  const dir = surf.swellCompass ? `${surf.swellCompass} ` : '';
  let periodNote = '';
  if (surf.swellPeriodS != null) {
    if (surf.swellPeriodS >= 12) periodNote = ' long-period groundswell';
    else if (surf.swellPeriodS < 8) periodNote = ' short-period windswell';
  }
  const swellType = periodNote || ' swell';
  return `Surf is around ${band.label} with a ${swellWord} ${dir}${swellType.trim()}.`;
}

/** Wind-effect-on-surf + best-time sentence. */
function surfQualitySentence(input: SummaryInput, bestTime: string | null): string | null {
  const { surf, current, location } = input;
  if (!surf || !location.surf) return null;
  const effect = windEffectOnSurf(
    current?.windDirectionDeg ?? null,
    current?.windSpeedKmh ?? null,
    location.surf.beachFacingDeg
  );
  const strong = (current?.windSpeedKmh ?? 0) >= 25;

  if (effect === 'offshore') {
    return bestTime === 'Morning'
      ? 'Offshore winds are helping keep it clean, and it should be cleanest early before they increase.'
      : 'Offshore winds are helping keep conditions clean.';
  }
  if (effect === 'onshore') {
    return strong
      ? 'Strong onshore winds will make the surf increasingly messy through the day.'
      : 'Onshore winds mean conditions are likely to get messier as the day goes on.';
  }
  // cross-shore / calm
  if (bestTime === 'Morning') {
    return 'Conditions should be cleanest in the morning before winds increase during the afternoon.';
  }
  return null;
}

/** Optional tide note - only when a tide source supplied a state. */
function tideSentence(surf: SurfConditions | null): string | null {
  const state = surf?.tide?.state;
  if (!state) return null;
  const map: Record<string, string> = {
    rising: 'The tide is coming in.',
    falling: 'The tide is going out.',
    high: "It's around high tide.",
    low: "It's around low tide.",
  };
  return map[state] ?? null;
}

function computeBestSurfTime(input: SummaryInput): string | null {
  const cur = input.current?.windSpeedKmh ?? null;
  const max = input.today?.windMaxKmh ?? null;
  if (cur == null || max == null) return null;
  if (max >= 18 && max - cur >= 6) return 'Morning';
  return null;
}

function computeSuitability(input: SummaryInput): {
  suitability: SurfSuitability | null;
  outlook: string | null;
} {
  const { surf, current, location } = input;
  if (!surf || !location.surf) return { suitability: null, outlook: null };
  const effect = windEffectOnSurf(
    current?.windDirectionDeg ?? null,
    current?.windSpeedKmh ?? null,
    location.surf.beachFacingDeg
  );
  const messy = effect === 'onshore' && (current?.windSpeedKmh ?? 0) >= 20;
  const hMax = surf.waveHeightMaxM ?? surf.waveHeightM;

  if (messy) {
    return { suitability: 'poor', outlook: 'Surf outlook: Messy and wind-affected - poor quality today.' };
  }
  if (hMax == null) return { suitability: null, outlook: null };
  if (hMax >= 2.5) {
    return { suitability: 'experienced', outlook: 'Surf outlook: Sizeable today - best left to experienced surfers.' };
  }
  if (hMax >= 1.5) {
    return { suitability: 'experienced', outlook: 'Surf outlook: A solid size - better suited to experienced surfers.' };
  }
  if (hMax >= 1) {
    return { suitability: 'moderate', outlook: 'Surf outlook: Moderate size - okay for improving surfers.' };
  }
  return {
    suitability: 'beginner',
    outlook: 'Surf outlook: Small and relatively clean - potentially suitable for less experienced surfers at protected beaches.',
  };
}

function computeSafetyNote(input: SummaryInput): string | null {
  const { surf, current, location } = input;
  if (!surf || !location.surf) return null;
  const effect = windEffectOnSurf(
    current?.windDirectionDeg ?? null,
    current?.windSpeedKmh ?? null,
    location.surf.beachFacingDeg
  );
  const messy = effect === 'onshore' && (current?.windSpeedKmh ?? 0) >= 20;
  const hMax = surf.waveHeightMaxM ?? surf.waveHeightM ?? 0;
  if (hMax >= 2 || (hMax >= 1.5 && messy)) {
    return 'Larger surf and strong currents are possible today. Check local beach warnings and swim between the flags.';
  }
  return null;
}

export function buildSummary(input: SummaryInput): ConditionsSummary {
  const bestSurfTime = computeBestSurfTime(input);
  const { suitability, outlook } = computeSuitability(input);
  const safetyNote = computeSafetyNote(input);

  const sentences = [
    weatherSentence(input),
    windRainSentence(input),
    surfSentence(input.surf),
    surfQualitySentence(input, bestSurfTime),
    tideSentence(input.surf),
    safetyNote,
  ].filter((s): s is string => Boolean(s));

  const label = input.today?.weather?.label ?? input.current?.weather?.label ?? null;
  const word = tempWord(input.today?.maxTempC ?? null, input.current?.temperatureC ?? null);
  const headline = label ? `${word} and ${label.toLowerCase()}` : `${cap(word)} today`;

  return {
    headline: cap(headline),
    paragraph: sentences.join(' '),
    bestSurfTime,
    surfOutlook: outlook,
    suitability,
    safetyNote,
  };
}
