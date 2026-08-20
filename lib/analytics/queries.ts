import { query } from './db';
import { SITE_TZ, addDays, daysBetweenInclusive, type Bucket, type DateRange } from './core';
import {
  channelFor,
  type PeriodMetrics,
  type WeeklyComparison,
} from './insights';

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

/**
 * Rolling week-on-week comparison: the last 7 Sydney days against the 7 before them.
 *
 * "Every 7 days" is implemented as a rolling window computed on each load rather than a
 * scheduled job, so the panel is always current, needs no cron, and cannot silently go
 * stale if a scheduler fails.
 */
export async function fetchWeeklyComparison(today: string): Promise<WeeklyComparison> {
  const curFrom = addDays(today, -6);
  const prevFrom = addDays(today, -13);
  const prevTo = addDays(today, -7);
  const params = [SITE_TZ, prevFrom, today, curFrom];

  // $4 splits the 14-day window into the current and previous weeks in one pass.
  const PERIOD = `CASE WHEN (occurred_at AT TIME ZONE $1)::date >= $4::date THEN 'cur' ELSE 'prev' END`;
  const WINDOW = `(occurred_at AT TIME ZONE $1)::date >= $2::date AND (occurred_at AT TIME ZONE $1)::date <= $3::date`;

  const [totals, channels, langs, pages, firstDay] = await Promise.all([
    query<{ period: string; visits: string; visitors: string; page_views: string }>(
      `SELECT ${PERIOD} AS period,
              COUNT(DISTINCT session_id) AS visits,
              COUNT(DISTINCT visitor_id) AS visitors,
              COUNT(*)                   AS page_views
       FROM analytics_page_view WHERE ${WINDOW} GROUP BY 1`,
      params,
    ),
    // Channel is a property of the VISIT, so count distinct sessions per referrer host.
    query<{ period: string; referrer_host: string | null; visits: string }>(
      `SELECT ${PERIOD} AS period, referrer_host, COUNT(DISTINCT session_id) AS visits
       FROM analytics_page_view WHERE ${WINDOW} GROUP BY 1, 2`,
      params,
    ),
    query<{ period: string; language: string; page_views: string }>(
      `SELECT ${PERIOD} AS period, language, COUNT(*) AS page_views
       FROM analytics_page_view WHERE ${WINDOW} GROUP BY 1, 2`,
      params,
    ),
    query<{ pathname: string; cur: string; prev: string }>(
      `SELECT pathname,
              COUNT(*) FILTER (WHERE (occurred_at AT TIME ZONE $1)::date >= $4::date) AS cur,
              COUNT(*) FILTER (WHERE (occurred_at AT TIME ZONE $1)::date <  $4::date) AS prev
       FROM analytics_page_view WHERE ${WINDOW} GROUP BY pathname`,
      params,
    ),
    query<{ d: string | null }>(
      `SELECT to_char(MIN(occurred_at AT TIME ZONE $1), 'YYYY-MM-DD') AS d FROM analytics_page_view`,
      [SITE_TZ],
    ),
  ]);

  const blank = (): PeriodMetrics => ({
    visits: 0,
    visitors: 0,
    pageViews: 0,
    byChannel: { search: 0, social: 0, referral: 0, direct: 0 },
    byLanguage: {},
  });
  const cur = blank();
  const prev = blank();
  const pick = (p: string) => (p === 'cur' ? cur : prev);

  for (const r of totals) {
    const m = pick(r.period);
    m.visits = Number(r.visits);
    m.visitors = Number(r.visitors);
    m.pageViews = Number(r.page_views);
  }
  for (const r of channels) {
    pick(r.period).byChannel[channelFor(r.referrer_host)] += Number(r.visits);
  }
  for (const r of langs) {
    const m = pick(r.period);
    m.byLanguage[r.language] = (m.byLanguage[r.language] ?? 0) + Number(r.page_views);
  }

  const moved = pages
    .map((r) => ({ pathname: r.pathname, cur: Number(r.cur), prev: Number(r.prev) }))
    .filter((m) => m.cur + m.prev >= 5); // ignore noise from near-zero pages
  const risers = moved.filter((m) => m.cur > m.prev).sort((a, b) => b.cur - b.prev - (a.cur - a.prev));
  const fallers = moved.filter((m) => m.cur < m.prev).sort((a, b) => a.cur - a.prev - (b.cur - b.prev));

  // How many days of history actually exist, so the panel can caveat a short baseline.
  const first = firstDay[0]?.d ?? today;
  const daysOfData = Math.max(1, daysBetweenInclusive(first, today));

  return { cur, prev, risers, fallers, daysOfData };
}

/** Sydney date of the earliest recorded event, so the UI can state when tracking began. */
export async function fetchFirstEventDate(): Promise<string | null> {
  const rows = await query<{ d: string | null }>(
    `SELECT to_char(MIN(occurred_at AT TIME ZONE $1), 'YYYY-MM-DD') AS d FROM analytics_page_view`,
    [SITE_TZ],
  );
  return rows[0]?.d ?? null;
}
