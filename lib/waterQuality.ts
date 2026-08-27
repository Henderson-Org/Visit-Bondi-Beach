/**
 * Beach water quality, from NSW Beachwatch.
 *
 * Beachwatch (NSW DCCEEW, running since 1989) publishes two DIFFERENT things per beach,
 * and conflating them would be exactly the kind of dishonesty the conditions layer exists
 * to prevent:
 *
 *   pollutionForecast  - a FORECAST for today, modelled from rainfall and stormwater.
 *                        "Unlikely" / "Possible" / "Likely". This is about today.
 *   latestResult       - the star rating from the most recent LABORATORY SAMPLE, which is
 *                        typically several days old (sites are sampled roughly every six
 *                        days in season). It describes the day it was taken, NOT today.
 *
 * So every value carries its own date, and the UI is required to show how old a sample is.
 * A week-old "Good" rating presented as the state of the water right now would be a
 * fabrication dressed as data.
 *
 * We never say the water is safe to swim in. Beachwatch grades pollution; the lifeguards
 * and the flags decide swimming safety.
 */

/** Beachwatch's four-level daily pollution forecast. */
export type PollutionForecast = 'unlikely' | 'possible' | 'likely' | 'unknown';

/** Beachwatch's star rating on the most recent sample. */
export type WaterQualityGrade = 'good' | 'fair' | 'poor' | 'unknown';

export interface WaterQuality {
  /** Beachwatch's own site name, e.g. "Bondi Beach". */
  siteName: string;
  /** Stable Beachwatch site id, used as the join key for the accumulating series. */
  siteId: string;
  /** Today's modelled pollution forecast. */
  forecast: PollutionForecast;
  /** When Beachwatch issued that forecast (ISO), or null. */
  forecastAt: string | null;
  /** Grade from the most recent lab sample. */
  grade: WaterQualityGrade;
  /** Beachwatch's numeric star rating (1-4) for that sample, or null. */
  stars: number | null;
  /** When that sample was TAKEN (ISO) - not when we fetched it. */
  sampledAt: string | null;
}

const FORECAST_MAP: Record<string, PollutionForecast> = {
  unlikely: 'unlikely', possible: 'possible', likely: 'likely',
};
const GRADE_MAP: Record<string, WaterQualityGrade> = {
  good: 'good', fair: 'fair', poor: 'poor',
};

/** Normalise one Beachwatch GeoJSON feature's properties. Unknown values become 'unknown'. */
export function parseSite(props: {
  id?: string; siteName?: string;
  pollutionForecast?: string | null; pollutionForecastTimeStamp?: string | null;
  latestResult?: string | null; latestResultRating?: number | null;
  latestResultObservationDate?: string | null;
}): WaterQuality | null {
  if (!props?.siteName || !props?.id) return null;
  const f = (props.pollutionForecast ?? '').trim().toLowerCase();
  const g = (props.latestResult ?? '').trim().toLowerCase();
  return {
    siteName: props.siteName,
    siteId: props.id,
    forecast: FORECAST_MAP[f] ?? 'unknown',
    forecastAt: props.pollutionForecastTimeStamp ?? null,
    grade: GRADE_MAP[g] ?? 'unknown',
    stars: typeof props.latestResultRating === 'number' ? props.latestResultRating : null,
    sampledAt: props.latestResultObservationDate ?? null,
  };
}

/** Whole days between a sample date and `now`. Null when we have no sample date. */
export function sampleAgeDays(w: WaterQuality, now: Date = new Date()): number | null {
  if (!w.sampledAt) return null;
  const t = Date.parse(w.sampledAt);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 86_400_000));
}

/**
 * Beyond this many days a lab sample stops describing anything useful about today's water,
 * so the UI stops leading with it. Beachwatch samples roughly every six days in season, so
 * two sampling cycles is the point at which a rating is more history than status.
 */
export const SAMPLE_STALE_AFTER_DAYS = 14;

export function isSampleStale(w: WaterQuality, now: Date = new Date()): boolean {
  const age = sampleAgeDays(w, now);
  return age == null || age > SAMPLE_STALE_AFTER_DAYS;
}

export const FORECAST_LABEL: Record<PollutionForecast, string> = {
  unlikely: 'Pollution unlikely',
  possible: 'Pollution possible',
  likely: 'Pollution likely',
  unknown: 'No forecast available',
};

export const GRADE_LABEL: Record<WaterQualityGrade, string> = {
  good: 'Good', fair: 'Fair', poor: 'Poor', unknown: 'Not graded',
};

/**
 * Plain-language guidance. Deliberately never says the water IS safe or clean - Beachwatch
 * grades pollution risk, and swimming safety is the lifeguards' call, not a data feed's.
 * Returns null when we hold nothing worth saying, rather than padding.
 */
export function waterAdvice(w: WaterQuality, now: Date = new Date()): string | null {
  if (w.forecast === 'likely') {
    return 'Beachwatch expects pollution here today. The usual local advice is to stay out of the water, especially near stormwater outlets.';
  }
  if (w.forecast === 'possible') {
    return 'Beachwatch says pollution is possible today - most often after rain. Give stormwater outlets a wide berth.';
  }
  if (w.forecast === 'unlikely') {
    const age = sampleAgeDays(w, now);
    const sample =
      w.grade !== 'unknown' && !isSampleStale(w, now) && age != null
        ? ` The last sample, ${age === 0 ? 'taken today' : `${age} day${age === 1 ? '' : 's'} ago`}, graded ${GRADE_LABEL[w.grade].toLowerCase()}.`
        : '';
    return `Beachwatch does not expect pollution here today.${sample}`;
  }
  return null;
}

/**
 * The single rule everyone actually wants: it rained, should I swim?
 * Beachwatch's own long-standing public advice is to avoid swimming for a day at ocean
 * beaches (three at harbour beaches) after heavy rain. Stated as their guidance, attributed.
 */
export const RAIN_RULE =
  'Beachwatch advises avoiding swimming for at least one day after heavy rain at ocean beaches like Bondi, and up to three days at harbour beaches, while stormwater clears.';

export const BEACHWATCH_SOURCE = {
  label: 'NSW Beachwatch',
  url: 'https://www.beachwatch.nsw.gov.au/',
} as const;
