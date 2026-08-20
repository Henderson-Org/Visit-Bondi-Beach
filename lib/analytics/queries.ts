import { query } from './db';
import { SITE_TZ, type Bucket, type DateRange } from './core';

/**
 * Dashboard queries.
 *
 * TIMEZONE: every filter and every bucket converts the stored UTC `occurred_at` into
 * Sydney wall-clock time first (`occurred_at AT TIME ZONE 'Australia/Sydney'`) and only
 * then compares or truncates it. Postgres applies the correct DST offset per row, so a
 * "day" is a real Sydney day, never a UTC day. Doing this in SQL rather than shifting
 * timestamps in JavaScript is what keeps the boundaries correct across DST changes.
 *
 * Every query is filtered by the SAME range, so the KPI cards, the graph, Top pages and
 * Page views by language always describe exactly the same period.
 */

/** Shared WHERE clause. $1 = tz, $2 = from date, $3 = to date. */
const IN_RANGE = `
  (occurred_at AT TIME ZONE $1)::date >= $2::date
  AND (occurred_at AT TIME ZONE $1)::date <= $3::date
`;

const rangeParams = (r: DateRange) => [SITE_TZ, r.from, r.to];

export interface Kpis {
  visits: number;
  visitors: number;
  pageViews: number;
  pagesPerVisit: number;
}

export async function fetchKpis(range: DateRange): Promise<Kpis> {
  const rows = await query<{ visits: string; visitors: string; page_views: string }>(
    `SELECT COUNT(DISTINCT session_id) AS visits,
            COUNT(DISTINCT visitor_id) AS visitors,
            COUNT(*)                   AS page_views
     FROM analytics_page_view
     WHERE ${IN_RANGE}`,
    rangeParams(range),
  );
  const r = rows[0];
  const visits = Number(r?.visits ?? 0);
  const pageViews = Number(r?.page_views ?? 0);
  return {
    visits,
    visitors: Number(r?.visitors ?? 0),
    pageViews,
    pagesPerVisit: visits ? Math.round((pageViews / visits) * 10) / 10 : 0,
  };
}

export interface SeriesPoint {
  bucket: string;
  visits: number;
}

/**
 * Visits per time bucket - NOT cumulative. Buckets with no traffic are absent here and
 * filled in as explicit zeros by the caller, so the line never skips a quiet period.
 */
export async function fetchSeries(range: DateRange, bucket: Bucket): Promise<SeriesPoint[]> {
  // `bucket` is a closed union ('hour' | 'day' | 'month') decided by our own code from the
  // range length - never user input - so selecting the trunc unit and format from it is safe.
  const unit = bucket;
  const fmt =
    bucket === 'hour' ? 'YYYY-MM-DD"T"HH24:00' : bucket === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
  const rows = await query<{ bucket: string; visits: string }>(
    `SELECT to_char(date_trunc('${unit}', occurred_at AT TIME ZONE $1), '${fmt}') AS bucket,
            COUNT(DISTINCT session_id) AS visits
     FROM analytics_page_view
     WHERE ${IN_RANGE}
     GROUP BY 1
     ORDER BY 1`,
    rangeParams(range),
  );
  return rows.map((r) => ({ bucket: r.bucket, visits: Number(r.visits) }));
}

export interface TopPage {
  pathname: string;
  pageTitle: string | null;
  language: string;
  pageViews: number;
  visitors: number;
}

/**
 * Top pages by page views. Translations keep their own real path - a /ja/… row stays
 * distinct from its English original and is deliberately NOT merged here.
 */
export async function fetchTopPages(range: DateRange, limit: number, offset = 0): Promise<TopPage[]> {
  const rows = await query<{
    pathname: string;
    page_title: string | null;
    language: string | null;
    page_views: string;
    visitors: string;
  }>(
    `SELECT pathname,
            (array_agg(page_title ORDER BY occurred_at DESC)
               FILTER (WHERE page_title IS NOT NULL))[1] AS page_title,
            (array_agg(language ORDER BY occurred_at DESC))[1] AS language,
            COUNT(*)                   AS page_views,
            COUNT(DISTINCT visitor_id) AS visitors
     FROM analytics_page_view
     WHERE ${IN_RANGE}
     GROUP BY pathname
     ORDER BY page_views DESC, pathname ASC
     LIMIT $4 OFFSET $5`,
    [...rangeParams(range), limit, offset],
  );
  return rows.map((r) => ({
    pathname: r.pathname,
    pageTitle: r.page_title,
    language: r.language ?? 'en',
    pageViews: Number(r.page_views),
    visitors: Number(r.visitors),
  }));
}

/** Distinct pages in range, so the dashboard knows whether "view more" applies. */
export async function countDistinctPages(range: DateRange): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(DISTINCT pathname) AS n FROM analytics_page_view WHERE ${IN_RANGE}`,
    rangeParams(range),
  );
  return Number(rows[0]?.n ?? 0);
}

export interface LanguageRow {
  language: string;
  pageViews: number;
  visitors: number;
}

/**
 * Page views by language, using the language of the RENDERED content (derived from the
 * locale-prefixed URL at collection time) - never the browser's Accept-Language header.
 */
export async function fetchLanguages(range: DateRange): Promise<LanguageRow[]> {
  const rows = await query<{ language: string; page_views: string; visitors: string }>(
    `SELECT language,
            COUNT(*)                   AS page_views,
            COUNT(DISTINCT visitor_id) AS visitors
     FROM analytics_page_view
     WHERE ${IN_RANGE}
     GROUP BY language
     ORDER BY page_views DESC, language ASC`,
    rangeParams(range),
  );
  return rows.map((r) => ({
    language: r.language,
    pageViews: Number(r.page_views),
    visitors: Number(r.visitors),
  }));
}

export interface CountryRow {
  country: string | null;
  visits: number;
  pageViews: number;
}

/**
 * Visits by country, from the edge geolocation recorded at collection time.
 *
 * Rows with no country (local development, or platforms that supply no geolocation)
 * group under NULL and are shown as "Unknown" rather than being dropped, so the totals
 * still reconcile with the KPI cards.
 */
export async function fetchCountries(range: DateRange): Promise<CountryRow[]> {
  const rows = await query<{ country: string | null; visits: string; page_views: string }>(
    `SELECT country,
            COUNT(DISTINCT session_id) AS visits,
            COUNT(*)                   AS page_views
     FROM analytics_page_view
     WHERE ${IN_RANGE}
     GROUP BY country
     ORDER BY visits DESC, page_views DESC, country ASC NULLS LAST`,
    rangeParams(range),
  );
  return rows.map((r) => ({
    country: r.country,
    visits: Number(r.visits),
    pageViews: Number(r.page_views),
  }));
}

export interface AllTimeTotals {
  pageViews: number;
  visits: number;
  visitors: number;
}

/**
 * Lifetime totals across every event ever recorded - deliberately NOT filtered by the
 * selected range. Shown under an explicit "All time" heading so it can never be mistaken
 * for the range-filtered KPI cards above it.
 */
export async function fetchAllTimeTotals(): Promise<AllTimeTotals> {
  const rows = await query<{ page_views: string; visits: string; visitors: string }>(
    `SELECT COUNT(*)                   AS page_views,
            COUNT(DISTINCT session_id) AS visits,
            COUNT(DISTINCT visitor_id) AS visitors
     FROM analytics_page_view`,
  );
  const r = rows[0];
  return {
    pageViews: Number(r?.page_views ?? 0),
    visits: Number(r?.visits ?? 0),
    visitors: Number(r?.visitors ?? 0),
  };
}

/** Sydney date of the earliest recorded event, so the UI can state when tracking began. */
export async function fetchFirstEventDate(): Promise<string | null> {
  const rows = await query<{ d: string | null }>(
    `SELECT to_char(MIN(occurred_at AT TIME ZONE $1), 'YYYY-MM-DD') AS d FROM analytics_page_view`,
    [SITE_TZ],
  );
  return rows[0]?.d ?? null;
}
