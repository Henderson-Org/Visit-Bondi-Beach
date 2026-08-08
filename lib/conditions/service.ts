/**
 * Conditions service — orchestrates the weather + surf providers, caches at the
 * fetch layer, and assembles the normalized `Conditions` the UI renders.
 *
 * Caching: every upstream request goes through `cachingFetch`, which uses Next's
 * fetch cache with `revalidate` (see REVALIDATE_SECONDS). So the APIs are called
 * server-side at most once per revalidation window — NOT on every page load — and
 * Next serves the last good response while it revalidates (stale-while-revalidate),
 * which covers brief provider outages. Identical URLs dedupe to one request.
 *
 * Swapping providers: change the two factory calls below. Any object implementing
 * WeatherProvider / SurfProvider works; nothing else in the app needs to change.
 */
import type { Conditions, ConditionsLocation, WeatherProvider, SurfProvider } from './types';
import { getDestination } from './locations';
import { createOpenMeteoWeatherProvider } from './providers/open-meteo-weather';
import { createOpenMeteoSurfProvider } from './providers/open-meteo-surf';
import { buildSummary } from './summary';

/** Cache window for upstream data (seconds). 30 min balances freshness vs. load. */
export const REVALIDATE_SECONDS = 1800;

const cachingFetch = (input: string): Promise<Response> =>
  fetch(input, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { accept: 'application/json' },
  });

// --- Active providers. Replace these two lines to change data sources. ---
const weatherProvider: WeatherProvider = createOpenMeteoWeatherProvider(cachingFetch);
const surfProvider: SurfProvider = createOpenMeteoSurfProvider(cachingFetch);

async function loadWeather(loc: ConditionsLocation) {
  try {
    const [{ current, meta }, { today }] = await Promise.all([
      weatherProvider.getCurrentConditions(loc.weather),
      weatherProvider.getDailyForecast(loc.weather),
    ]);
    return { current, today, meta };
  } catch (err) {
    console.error('[conditions] weather provider failed:', err);
    return { current: null, today: null, meta: null };
  }
}

async function loadSurf(loc: ConditionsLocation) {
  if (loc.inland || !loc.surf) return { surf: null, meta: null };
  try {
    const { surf, meta } = await surfProvider.getSurfConditions(loc.surf);
    return { surf, meta };
  } catch (err) {
    console.error('[conditions] surf provider failed:', err);
    return { surf: null, meta: null };
  }
}

/** Fetch + assemble today's conditions for a destination key (e.g. "bondi"). */
export async function getConditions(destinationKey?: string): Promise<Conditions> {
  const location = getDestination(destinationKey);
  const [weather, surfResult] = await Promise.all([loadWeather(location), loadSurf(location)]);

  const summary = buildSummary({
    location,
    current: weather.current,
    today: weather.today,
    surf: surfResult.surf,
  });

  return {
    location,
    current: weather.current,
    today: weather.today,
    surf: surfResult.surf,
    weatherMeta: weather.meta,
    surfMeta: surfResult.meta,
    summary,
  };
}
