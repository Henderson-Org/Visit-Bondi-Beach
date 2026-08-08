/**
 * Open-Meteo Marine adapter (surf/ocean conditions).
 *
 * Provides significant + swell wave height, swell direction/period, wind-wave
 * height and sea-surface (water) temperature — the structured, per-location
 * marine data BOM does not expose in a reusable API (BOM marine forecasts are
 * text-based coastal-waters bulletins). Keyless, free, CC-BY 4.0. We link to
 * BOM's Sydney coastal-waters forecast and Beachsafe for authoritative info.
 *
 * Tide is intentionally left null: no permitted free tide API is configured yet
 * (see TIDES note in docs). We never fabricate it.
 */
import type { GeoPoint, ProviderMeta, SurfConditions, SurfProvider } from '../types';
import { degToCompass } from '../geo';

const BASE = 'https://marine-api.open-meteo.com/v1/marine';
const CURRENT_FIELDS = [
  'wave_height', 'wave_direction', 'wave_period',
  'swell_wave_height', 'swell_wave_direction', 'swell_wave_period',
  'wind_wave_height', 'sea_surface_temperature',
].join(',');
const DAILY_FIELDS = [
  'wave_height_max', 'swell_wave_height_max', 'swell_wave_direction_dominant', 'swell_wave_period_max',
].join(',');

function url(loc: GeoPoint): string {
  const p = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    timezone: 'Australia/Sydney',
    forecast_days: '1',
  });
  return `${BASE}?${p.toString()}`;
}

type Fetcher = (input: string) => Promise<Response>;

interface MarineResponse {
  current?: Record<string, number | string>;
  daily?: Record<string, (number | string | null)[]>;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export function createOpenMeteoSurfProvider(fetcher: Fetcher): SurfProvider {
  return {
    name: 'Open-Meteo Marine',
    async getSurfConditions(loc) {
      const res = await fetcher(url(loc));
      if (!res.ok) throw new Error(`Open-Meteo marine HTTP ${res.status}`);
      const data = (await res.json()) as MarineResponse;
      const c = data.current ?? {};
      const d = data.daily ?? {};
      const first = <T,>(a?: (T | null)[]): T | null => (a && a.length ? a[0] : null);
      const swellDir = num(c.swell_wave_direction);

      const surf: SurfConditions = {
        waveHeightM: num(c.wave_height),
        waveHeightMaxM: num(first(d.wave_height_max)),
        swellHeightM: num(c.swell_wave_height),
        swellDirectionDeg: swellDir,
        swellCompass: degToCompass(swellDir),
        swellPeriodS: num(c.swell_wave_period),
        windWaveHeightM: num(c.wind_wave_height),
        waterTempC: num(c.sea_surface_temperature),
        tide: null, // no permitted free tide source configured yet
      };

      const t = str(c.time as string | undefined);
      const meta: ProviderMeta = {
        name: 'Open-Meteo Marine',
        url: 'https://open-meteo.com/en/docs/marine-weather-api',
        fetchedAt: new Date().toISOString(),
        providerUpdatedAt: t,
        forecastValidTime: t,
      };
      return { surf, meta };
    },
  };
}
