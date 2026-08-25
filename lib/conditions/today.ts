/**
 * "Bondi today" — the dashboard model.
 *
 * The point of this module is EPISTEMIC HONESTY. A conditions dashboard mixes three
 * very different kinds of claim, and presenting them identically is how a travel site
 * ends up asserting things it does not know:
 *
 *   measured  — an observation of the world right now (air temperature, sea-surface
 *               temperature, wave height). Sourced, timestamped, not ours.
 *   forecast  — a model's prediction for later today (max temp, rain chance, UV max,
 *               sunrise/sunset). True only as far as the model is.
 *   derived   — OUR inference from the above (is it a good swim window, how busy it is
 *               likely to be). Never an observation, and must never be dressed as one.
 *
 * Every stat carries its `kind`, so the UI can label it and a reader (or a machine)
 * can tell what is known from what is guessed. Nothing here fabricates: a value we do
 * not have is null and the stat is dropped, rather than being estimated into existence.
 */
import type { Conditions } from './types';
import { roundTemp, surfBand } from './geo';
import { isWetCode } from './wmo';

export type DataKind = 'measured' | 'forecast' | 'derived';

export interface TodayStat {
  key: string;
  label: string;
  value: string;
  /** Short qualifier shown under the value, e.g. "now", "today", "estimate". */
  note?: string;
  kind: DataKind;
}

export type Confidence = 'high' | 'low';

export interface DerivedCall {
  /** One-line verdict. */
  verdict: string;
  /** Why we say so, in plain language - always shown, so the inference is auditable. */
  because: string;
  confidence: Confidence;
}

export interface TodayModel {
  stats: TodayStat[];
  /** "Is it a good time to swim?" - derived, never a safety guarantee. */
  swim: DerivedCall | null;
  /** How busy the beach is likely to be - derived from day/season/weather, never measured. */
  busyness: DerivedCall | null;
  /** Best part of the day to be outside - derived. */
  bestWindow: string | null;
  /** Provenance lines, one per upstream dataset actually used. */
  sources: { label: string; url: string; fetchedAt: string; kind: DataKind }[];
}

/** Format Open-Meteo's local ISO time ("2026-08-08T19:42") as "7:42pm". */
export function clockTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]);
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m[2]}${ampm}`;
}

/** UV bands per ARPANSA / WHO. Used for the label only - the number is the forecast's. */
export function uvBand(uv: number | null): string | null {
  if (uv == null) return null;
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

/**
 * Swim guidance. Deliberately conservative and never a safety claim: the flags and the
 * lifeguards decide whether it is safe, not us. We only say whether conditions look
 * pleasant, and we say so in terms a visitor can check for themselves.
 */
export function swimCall(c: Conditions): DerivedCall | null {
  const water = roundTemp(c.surf?.waterTempC ?? null);
  const wave = c.surf?.waveHeightM ?? null;
  const air = roundTemp(c.today?.maxTempC ?? c.current?.temperatureC ?? null);
  if (water == null && wave == null) return null;

  const reasons: string[] = [];
  if (water != null) reasons.push(`the water is about ${water}°C`);
  if (wave != null) reasons.push(`the swell is running about ${wave.toFixed(1)}m`);
  if (air != null) reasons.push(`the air is around ${air}°C`);
  const because = `Based on today's readings: ${reasons.join(', ')}. Always swim between the red and yellow flags — the lifeguards move them for a reason.`;

  // Big surf dominates every other signal.
  if (wave != null && wave >= 2.0) {
    return { verdict: 'Not a gentle swim day — the surf is up', because, confidence: 'high' };
  }
  if (wave != null && wave >= 1.5) {
    return { verdict: 'Swimmable, but expect solid waves and a strong pull', because, confidence: 'high' };
  }
  if (water != null && water < 16) {
    return { verdict: 'Bracing — short dips unless you are used to cold water', because, confidence: 'high' };
  }
  if (water != null && water >= 20 && (wave == null || wave < 1.2)) {
    return { verdict: 'A good day for a swim', because, confidence: 'high' };
  }
  return { verdict: 'Reasonable for a swim if you do not mind cooler water', because, confidence: 'low' };
}

/**
 * How busy the beach is likely to be.
 *
 * This is an INFERENCE, not a measurement — we hold no crowd data for Bondi and will not
 * invent any. What we do hold is the pattern any local knows: Bondi fills on warm weekend
 * afternoons and empties when it is cold or wet. So this is computed from day of week,
 * air temperature and rain only, labelled an estimate everywhere it appears, and given
 * low confidence whenever the inputs are weak. If a real occupancy source ever exists,
 * this should be replaced by it rather than tuned.
 *
 * `weekday` is 0=Sun..6=Sat (as returned by lib/events.ts weekdayOf).
 */
export function busynessCall(c: Conditions, weekday: number): DerivedCall | null {
  const temp = roundTemp(c.today?.maxTempC ?? c.current?.temperatureC ?? null);
  const rain = c.today?.rainChancePct ?? null;
  const wet = isWetCode(c.current?.weather?.code ?? null);
  if (temp == null) return null;

  const isWeekend = weekday === 0 || weekday === 6;
  const dayWord = isWeekend ? 'a weekend' : 'a weekday';
  const because =
    `An estimate from the day and the forecast — it is ${dayWord} and the day tops out around ${temp}°C` +
    (rain != null ? ` with a ${rain}% chance of rain` : '') +
    '. We do not have live crowd data for Bondi, so treat this as a local rule of thumb, not a measurement.';

  if (wet || (rain != null && rain >= 70)) {
    return { verdict: 'Quiet — the weather will keep most people away', because, confidence: 'low' };
  }
  if (temp >= 26 && isWeekend) {
    return { verdict: 'Very busy — expect a packed beach and no parking', because, confidence: 'high' };
  }
  if (temp >= 26 || (temp >= 22 && isWeekend)) {
    return { verdict: 'Busy, especially late morning to mid-afternoon', because, confidence: 'high' };
  }
  if (temp < 18) {
    return { verdict: 'Quiet — walkers and swimmers rather than sunbathers', because, confidence: 'low' };
  }
  return { verdict: 'Moderate — comfortable without being packed', because, confidence: 'low' };
}

/** Build the full dashboard model. `weekday` comes from the caller so this stays pure. */
export function buildToday(c: Conditions, weekday: number): TodayModel {
  const stats: TodayStat[] = [];

  const air = roundTemp(c.current?.temperatureC ?? null);
  if (air != null) stats.push({ key: 'air', label: 'Air', value: `${air}°C`, note: 'now', kind: 'measured' });

  const water = roundTemp(c.surf?.waterTempC ?? null);
  if (water != null) stats.push({ key: 'water', label: 'Water', value: `${water}°C`, note: 'now', kind: 'measured' });

  const wave = c.surf?.waveHeightM ?? null;
  if (wave != null) {
    const band = surfBand(wave);
    stats.push({
      key: 'surf', label: 'Surf', value: `${wave.toFixed(1)}m`,
      note: band?.label ?? 'now', kind: 'measured',
    });
  }

  const uv = c.today?.uvIndexMax ?? null;
  const band = uvBand(uv);
  if (uv != null && band) {
    stats.push({ key: 'uv', label: 'UV', value: band, note: `peaks at ${Math.round(uv)}`, kind: 'forecast' });
  }

  const max = roundTemp(c.today?.maxTempC ?? null);
  if (max != null) stats.push({ key: 'max', label: 'Max', value: `${max}°C`, note: 'today', kind: 'forecast' });

  const rain = c.today?.rainChancePct ?? null;
  if (rain != null) stats.push({ key: 'rain', label: 'Rain', value: `${rain}%`, note: 'chance today', kind: 'forecast' });

  const sunset = clockTime(c.today?.sunset);
  if (sunset) stats.push({ key: 'sunset', label: 'Sunset', value: sunset, note: 'today', kind: 'forecast' });

  const sunrise = clockTime(c.today?.sunrise);
  if (sunrise) stats.push({ key: 'sunrise', label: 'Sunrise', value: sunrise, note: 'today', kind: 'forecast' });

  const sources: TodayModel['sources'] = [];
  if (c.weatherMeta) {
    sources.push({ label: c.weatherMeta.name, url: c.weatherMeta.url, fetchedAt: c.weatherMeta.fetchedAt, kind: 'forecast' });
  }
  if (c.surfMeta) {
    sources.push({ label: c.surfMeta.name, url: c.surfMeta.url, fetchedAt: c.surfMeta.fetchedAt, kind: 'measured' });
  }
  if (c.tideMeta) {
    sources.push({ label: c.tideMeta.name, url: c.tideMeta.url, fetchedAt: c.tideMeta.fetchedAt, kind: 'measured' });
  }

  return {
    stats,
    swim: swimCall(c),
    busyness: busynessCall(c, weekday),
    bestWindow: c.summary.bestSurfTime,
    sources,
  };
}
