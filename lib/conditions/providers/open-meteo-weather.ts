/**
 * Open-Meteo weather adapter.
 *
 * Why Open-Meteo: it's free, keyless, open-licensed (CC-BY 4.0), machine-readable,
 * and blends multiple national models — including the Bureau of Meteorology's
 * ACCESS model for Australia. BOM's own JSON API explicitly forbids reuse
 * ("You must not use, copy or share it"), and its licensed feeds need
 * registration, so Open-Meteo is the best *permitted* structured source. We link
 * to BOM for the authoritative human-readable forecast (see locations.ts).
 *
 * Requests are cached at the fetch layer (see service.ts REVALIDATE_SECONDS), so
 * we do not call the API on every page load. No API key required.
 */
import type { GeoPoint, ProviderMeta, WeatherConditions, DailyWeatherForecast, WeatherProvider } from '../types';
import { degToCompass } from '../geo';
import { weatherFromCode } from '../wmo';

const BASE = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS = [
  'temperature_2m', 'apparent_temperature', 'is_day', 'precipitation', 'weather_code',
  'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'uv_index',
].join(',');
const DAILY_FIELDS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset',
  'uv_index_max', 'precipitation_probability_max', 'wind_speed_10m_max', 'wind_direction_10m_dominant',
].join(',');

function url(loc: GeoPoint): string {
  const p = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    timezone: 'Australia/Sydney',
    forecast_days: '1',
    wind_speed_unit: 'kmh',
  });
  return `${BASE}?${p.toString()}`;
}

// The service passes a caching fetch so requests dedupe + revalidate. We accept
// it as a parameter to keep this adapter free of Next-specific coupling.
type Fetcher = (input: string) => Promise<Response>;

interface OpenMeteoResponse {
  current?: Record<string, number | string>;
  daily?: Record<string, (number | string | null)[]>;
}

async function load(loc: GeoPoint, fetcher: Fetcher): Promise<OpenMeteoResponse> {
  const res = await fetcher(url(loc));
  if (!res.ok) throw new Error(`Open-Meteo weather HTTP ${res.status}`);
  return (await res.json()) as OpenMeteoResponse;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

function meta(providerUpdatedAt: string | null, forecastValidTime: string | null): ProviderMeta {
  return {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com/',
    fetchedAt: new Date().toISOString(),
    providerUpdatedAt,
    forecastValidTime,
  };
}

export function createOpenMeteoWeatherProvider(fetcher: Fetcher): WeatherProvider {
  const parseCurrent = (data: OpenMeteoResponse): WeatherConditions => {
    const c = data.current ?? {};
    const windDir = num(c.wind_direction_10m);
    return {
      temperatureC: num(c.temperature_2m),
      apparentTemperatureC: num(c.apparent_temperature),
      isDay: c.is_day == null ? null : c.is_day === 1 || c.is_day === '1',
      weather: weatherFromCode(num(c.weather_code) ?? undefined),
      windSpeedKmh: num(c.wind_speed_10m),
      windGustKmh: num(c.wind_gusts_10m),
      windDirectionDeg: windDir,
      windCompass: degToCompass(windDir),
      uvIndex: num(c.uv_index),
    };
  };

  const parseDaily = (data: OpenMeteoResponse): DailyWeatherForecast => {
    const d = data.daily ?? {};
    const first = <T,>(a?: (T | null)[]): T | null => (a && a.length ? a[0] : null);
    return {
      date: str(first(d.time)),
      maxTempC: num(first(d.temperature_2m_max)),
      minTempC: num(first(d.temperature_2m_min)),
      rainChancePct: num(first(d.precipitation_probability_max)),
      uvIndexMax: num(first(d.uv_index_max)),
      weather: weatherFromCode(num(first(d.weather_code)) ?? undefined),
      sunrise: str(first(d.sunrise)),
      sunset: str(first(d.sunset)),
      windMaxKmh: num(first(d.wind_speed_10m_max)),
      windDominantDeg: num(first(d.wind_direction_10m_dominant)),
    };
  };

  return {
    name: 'Open-Meteo',
    async getCurrentConditions(loc) {
      const data = await load(loc, fetcher);
      const current = parseCurrent(data);
      const t = str(data.current?.time as string | undefined);
      return { current, meta: meta(t, t) };
    },
    async getDailyForecast(loc) {
      const data = await load(loc, fetcher);
      const today = parseDaily(data);
      return { today, meta: meta(today.date, today.date) };
    },
  };
}
