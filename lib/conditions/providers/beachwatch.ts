/**
 * NSW Beachwatch adapter — beach water quality.
 *
 * Beachwatch is the NSW government's beach-pollution monitoring programme (DCCEEW, running
 * since 1989). Its public GeoJSON feed carries every monitored NSW site, so one request
 * covers Bondi and every beach on the Bondi-to-Coogee walk. Keyless and free.
 *
 * Only this one endpoint is public: probing the API for per-site history
 * (`/public/sites/{id}/results`, `/history`, `/samples`) returns 404, and the legacy
 * enterococci download at environment.nsw.gov.au now redirects to the current site. So the
 * feed is a SNAPSHOT, not a series — which is why scripts/snapshot-water-quality.mjs
 * accumulates our own history from it rather than pretending a history endpoint exists.
 */
import type { ProviderMeta } from '../types';
import { parseSite, type WaterQuality } from '@/lib/waterQuality';

const ENDPOINT = 'https://api.beachwatch.nsw.gov.au/public/sites/geojson';

type Fetcher = (input: string) => Promise<Response>;

interface Feature {
  properties?: {
    id?: string;
    siteName?: string;
    pollutionForecast?: string | null;
    pollutionForecastTimeStamp?: string | null;
    latestResult?: string | null;
    latestResultRating?: number | null;
    latestResultObservationDate?: string | null;
  };
}

export interface BeachwatchProvider {
  readonly name: string;
  /** Every monitored site, keyed by Beachwatch's own site name. */
  getAll(): Promise<{ sites: Map<string, WaterQuality>; meta: ProviderMeta }>;
}

export function createBeachwatchProvider(fetcher: Fetcher, now: () => number = Date.now): BeachwatchProvider {
  return {
    name: 'NSW Beachwatch',
    async getAll() {
      const res = await fetcher(ENDPOINT);
      if (!res.ok) throw new Error(`Beachwatch responded ${res.status}`);
      const json = (await res.json()) as { features?: Feature[] };

      const sites = new Map<string, WaterQuality>();
      let newestForecast: string | null = null;
      for (const f of json.features ?? []) {
        const site = parseSite(f.properties ?? {});
        if (!site) continue;
        sites.set(site.siteName.toLowerCase(), site);
        if (site.forecastAt && (!newestForecast || site.forecastAt > newestForecast)) {
          newestForecast = site.forecastAt;
        }
      }

      return {
        sites,
        meta: {
          name: 'NSW Beachwatch',
          url: 'https://www.beachwatch.nsw.gov.au/',
          fetchedAt: new Date(now()).toISOString(),
          // The feed's own stamp: when Beachwatch last issued forecasts. Distinct from
          // fetchedAt, so a stale upstream is visible rather than masked by our fetch time.
          providerUpdatedAt: newestForecast,
          forecastValidTime: newestForecast,
        },
      };
    },
  };
}

/** Beaches we surface, mapped to Beachwatch's exact site names (verified against the feed). */
export const BEACHWATCH_SITES = {
  bondi: 'Bondi Beach',
  tamarama: 'Tamarama Beach',
  bronte: 'Bronte Beach',
  clovelly: 'Clovelly Beach',
  'gordons-bay': 'Gordons Bay (East)',
  coogee: 'Coogee Beach',
} as const;

export type BeachwatchKey = keyof typeof BEACHWATCH_SITES;
