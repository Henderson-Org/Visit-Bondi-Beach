/**
 * WorldTides tide adapter (https://www.worldtides.info).
 *
 * Tide is astronomical prediction, so there's no permitted free BOM/gov JSON API
 * for it (BOM's API forbids reuse) and Open-Meteo doesn't provide tides. WorldTides
 * is a clean tide-only API with a free tier that requires an API key. This adapter
 * activates ONLY when TIDE_API_KEY is set (see service.ts); with no key, tide stays
 * null and the UI simply omits it — never fabricated.
 *
 * An Australian alternative with richer local tide data is WillyWeather (also
 * key/subscription based); it can be dropped in behind the same TideProvider
 * interface without touching the UI.
 */
import type { GeoPoint, ProviderMeta, TideExtreme, TideProvider } from '../types';
import { resolveTide } from '../tide';

type Fetcher = (input: string) => Promise<Response>;

interface WorldTidesResponse {
  extremes?: { dt: number; type: string; height?: number }[];
  heights?: { dt: number; height: number }[];
}

export function createWorldTidesProvider(fetcher: Fetcher, apiKey: string, nowMs: () => number): TideProvider {
  return {
    name: 'WorldTides',
    async getTide(loc: GeoPoint) {
      const url =
        `https://www.worldtides.info/api/v3?extremes&heights&lat=${loc.lat}&lon=${loc.lon}` +
        `&key=${encodeURIComponent(apiKey)}`;
      const res = await fetcher(url);
      if (!res.ok) throw new Error(`WorldTides HTTP ${res.status}`);
      const data = (await res.json()) as WorldTidesResponse;

      const extremes: TideExtreme[] = (data.extremes ?? []).map((e) => ({
        type: /high/i.test(e.type) ? 'high' : 'low',
        time: new Date(e.dt * 1000).toISOString(),
        heightM: typeof e.height === 'number' ? e.height : null,
      }));

      // Current height ≈ the heights sample closest to now.
      const now = nowMs();
      let currentHeightM: number | null = null;
      if (Array.isArray(data.heights) && data.heights.length) {
        const closest = data.heights.reduce((best, h) =>
          Math.abs(h.dt * 1000 - now) < Math.abs(best.dt * 1000 - now) ? h : best
        );
        currentHeightM = typeof closest.height === 'number' ? closest.height : null;
      }

      const tide = resolveTide(extremes, currentHeightM, now);
      const meta: ProviderMeta = {
        name: 'WorldTides',
        url: 'https://www.worldtides.info/',
        fetchedAt: new Date(now).toISOString(),
        providerUpdatedAt: new Date(now).toISOString(),
        forecastValidTime: null,
      };
      return { tide, meta };
    },
  };
}
