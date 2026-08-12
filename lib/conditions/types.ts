/**
 * Normalized "today's conditions" model.
 *
 * The UI and summary engine depend ONLY on these internal types - never on a
 * specific provider's response shape. Providers implement the interfaces at the
 * bottom and normalize their responses into these schemas, so a weather or surf
 * source can be swapped or supplemented later without touching the UI.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** 16-point compass bearing. */
export type Compass =
  | 'N' | 'NNE' | 'NE' | 'ENE' | 'E' | 'ESE' | 'SE' | 'SSE'
  | 'S' | 'SSW' | 'SW' | 'WSW' | 'W' | 'WNW' | 'NW' | 'NNW';

export interface WeatherCode {
  code: number;
  label: string; // e.g. "Partly cloudy"
  emoji: string; // e.g. "⛅"
}

/** Provenance for a fetched dataset. Never present forecast data as "live". */
export interface ProviderMeta {
  /** Display name of the source, e.g. "Open-Meteo". */
  name: string;
  /** Link to the source or the authoritative reference behind it. */
  url: string;
  /** When WE fetched it (ISO). */
  fetchedAt: string;
  /** The provider's own data timestamp - model/observation time (ISO), if known. */
  providerUpdatedAt: string | null;
  /** The time/day this data is valid for (ISO), if known. */
  forecastValidTime: string | null;
}

export interface WeatherConditions {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  isDay: boolean | null;
  weather: WeatherCode | null;
  windSpeedKmh: number | null;
  windGustKmh: number | null;
  windDirectionDeg: number | null; // meteorological "from" bearing
  windCompass: Compass | null;
  uvIndex: number | null;
}

export interface DailyWeatherForecast {
  date: string | null;
  maxTempC: number | null;
  minTempC: number | null;
  rainChancePct: number | null;
  uvIndexMax: number | null;
  weather: WeatherCode | null;
  sunrise: string | null; // ISO
  sunset: string | null; // ISO
  windMaxKmh: number | null;
  windDominantDeg: number | null;
}

export interface TideInfo {
  state: 'rising' | 'falling' | 'high' | 'low' | null;
  heightM: number | null;
  nextHighTime: string | null; // ISO
  nextLowTime: string | null; // ISO
}

export interface SurfConditions {
  waveHeightM: number | null; // significant wave height now (surf size proxy)
  waveHeightMaxM: number | null; // today's max
  swellHeightM: number | null;
  swellDirectionDeg: number | null;
  swellCompass: Compass | null;
  swellPeriodS: number | null;
  windWaveHeightM: number | null;
  waterTempC: number | null;
  /** Null when no authoritative tide source is configured - never fabricated. */
  tide: TideInfo | null;
}

/**
 * Destination → data-location mapping. Edited in lib/conditions/locations.ts
 * (the site's data layer). `surf` is null for inland destinations (weather only).
 */
export interface ConditionsLocation {
  key: string; // 'bondi'
  label: string; // 'Bondi'
  displayName: string; // shown in "TODAY IN BONDI"
  inland: boolean;
  weather: GeoPoint & { label: string };
  surf: (GeoPoint & { label: string; beachFacingDeg: number }) | null;
  /** Official beach-safety link (e.g. Beachsafe). */
  safetyUrl: string | null;
  /** Authoritative human-readable forecast to link to (e.g. BOM). */
  authoritativeWeatherUrl: string;
  authoritativeSurfUrl: string | null;
}

export type SurfSuitability = 'beginner' | 'moderate' | 'experienced' | 'poor';

export interface ConditionsSummary {
  /** Short headline, e.g. "Warm and mostly sunny". */
  headline: string;
  /** The primary output: a 2–4 sentence human-readable summary. */
  paragraph: string;
  /** e.g. "Morning" when conditions are best early; null if not indicated. */
  bestSurfTime: string | null;
  /** One-line suitability guidance sentence (general guidance, not safety advice). */
  surfOutlook: string | null;
  suitability: SurfSuitability | null;
  /** Hazard note when surf is elevated; null otherwise. Never claims surf is "safe". */
  safetyNote: string | null;
}

/** The full assembled model consumed by the UI. */
export interface Conditions {
  location: ConditionsLocation;
  current: WeatherConditions | null;
  today: DailyWeatherForecast | null;
  surf: SurfConditions | null;
  weatherMeta: ProviderMeta | null;
  surfMeta: ProviderMeta | null;
  tideMeta: ProviderMeta | null;
  summary: ConditionsSummary;
}

/* ------------------------------------------------------------------ *
 * Provider interfaces - implement these to add or replace a source.  *
 * ------------------------------------------------------------------ */

export interface WeatherProvider {
  readonly name: string;
  getCurrentConditions(loc: GeoPoint): Promise<{ current: WeatherConditions; meta: ProviderMeta }>;
  getDailyForecast(loc: GeoPoint): Promise<{ today: DailyWeatherForecast; meta: ProviderMeta }>;
}

export interface SurfProvider {
  readonly name: string;
  getSurfConditions(loc: GeoPoint): Promise<{ surf: SurfConditions; meta: ProviderMeta }>;
}

/** Optional tide source (activated when configured - see service.ts). */
export interface TideProvider {
  readonly name: string;
  getTide(loc: GeoPoint): Promise<{ tide: TideInfo; meta: ProviderMeta }>;
}

/** A tide extreme (high or low) at a point in time. */
export interface TideExtreme {
  type: 'high' | 'low';
  time: string; // ISO
  heightM: number | null;
}
