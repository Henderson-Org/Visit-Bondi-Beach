/**
 * Analytics core - pure, dependency-free logic shared by the collector and the dashboard.
 *
 * Everything here is a pure function so it can be unit-tested without a database,
 * a request or a clock. The impure parts (SQL, cookies) live in db.ts / queries.ts /
 * the route handlers.
 */

import { LOCALES, type Locale } from '@/lib/i18n';

/** Reporting timezone. The site is Australian; day boundaries are Sydney days, never UTC. */
export const SITE_TZ = 'Australia/Sydney';

/** A visit (session) ends after this much inactivity. Documented in docs/analytics.md. */
export const SESSION_INACTIVITY_MINUTES = 30;

/** How long the anonymous visitor cookie lives. 400 days is the browser-enforced maximum. */
export const VISITOR_COOKIE_DAYS = 400;

export const VISITOR_COOKIE = 'vbb_vid';
export const SESSION_COOKIE = 'vbb_sid';

/** Normalised language value stored on every event. 'en' = the English original. */
export type AnalyticsLanguage = 'en' | Locale;

/** Human-facing label for each stored language value. */
export const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  'zh-cn': 'Chinese (Simplified)',
  es: 'Spanish',
  pt: 'Portuguese',
  de: 'German',
  nl: 'Dutch',
  it: 'Italian',
};

export function languageLabel(code: string): string {
  return LANGUAGE_LABEL[code] ?? code;
}

/**
 * Paths that must never appear in public website analytics: the admin panel itself,
 * every API endpoint, and Next.js internals. Checked on the SERVER in the collector,
 * so a hand-crafted POST cannot inject admin traffic into the public numbers.
 */
export function isExcludedPath(pathname: string): boolean {
  const p = pathname.split('?')[0].split('#')[0];
  return (
    p === '/admin' ||
    p.startsWith('/admin/') ||
    p.startsWith('/api/') ||
    p.startsWith('/_next/') ||
    p.startsWith('/_vercel') ||
    p === '/robots.txt' ||
    p === '/sitemap.xml'
  );
}

/**
 * Derive the content language and the canonical content id from the URL.
 *
 * This is the site's ACTUAL rendered-content language, not a browser preference:
 * translated pages are served under a locale prefix (/ja/…, /zh-cn/…) by
 * app/[...slug]/page.tsx via splitLocalePath(), so the first path segment IS the
 * rendered language. English pages have no prefix.
 *
 * `contentId` is the English path the translation belongs to, which means every
 * language version of one article shares a content id and can be compared.
 */
export function classifyPath(pathname: string): {
  path: string;
  language: AnalyticsLanguage;
  contentId: string;
} {
  const clean = (pathname.split('?')[0].split('#')[0] || '/').replace(/\/+$/, '') || '/';
  const segments = clean.split('/').filter(Boolean);
  const first = segments[0];
  if (first && (LOCALES as string[]).includes(first)) {
    const rest = '/' + segments.slice(1).join('/');
    return { path: clean, language: first as Locale, contentId: rest === '/' ? '/' : rest };
  }
  return { path: clean, language: 'en', contentId: clean };
}

/**
 * Normalise an edge geolocation country code to ISO 3166-1 alpha-2, or null.
 *
 * Only the country is kept - never the IP it was derived from, and never a region or
 * city. Anything that is not exactly two letters (including Vercel's 'XX' placeholder
 * for "unknown") becomes null, so the dashboard reports "Unknown" honestly instead of
 * inventing a location.
 */
export function normaliseCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const c = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c) || c === 'XX' || c === 'T1') return null;
  return c;
}

/**
 * Human-readable country name for a code, via Intl (no dependency, no lookup table to
 * fall out of date). Falls back to the raw code if the runtime cannot resolve it.
 */
export function countryLabel(code: string | null): string {
  if (!code) return 'Unknown';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Regional-indicator flag emoji for a country code. Purely decorative. */
export function countryFlag(code: string | null): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** Hostname of a referrer, or null for direct/invalid/same-site-stripped referrers. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Date ranges - all reasoning is in Sydney local dates (YYYY-MM-DD).  *
 * ------------------------------------------------------------------ */

export type Preset = 'today' | '7d' | '30d' | 'year' | 'all' | 'custom';

export interface DateRange {
  /** Inclusive Sydney-local start date, YYYY-MM-DD. */
  from: string;
  /** Inclusive Sydney-local end date, YYYY-MM-DD. */
  to: string;
  preset: Preset;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a well-formed, real calendar date string. */
export function isValidDateString(s: string | null | undefined): s is string {
  if (!s || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * "Today" as a Sydney calendar date. Uses Intl rather than manual offset maths so
 * DST (Sydney observes it) is always correct.
 */
export function sydneyToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Shift a YYYY-MM-DD date by whole days. Calendar-safe (no DST involvement). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Whole days between two Sydney dates, inclusive of both ends. */
export function daysBetweenInclusive(from: string, to: string): number {
  const a = Date.UTC(...(from.split('-').map(Number) as [number, number, number]));
  const b = Date.UTC(...(to.split('-').map(Number) as [number, number, number]));
  return Math.floor((b - a) / 86_400_000) + 1;
}

/** The earliest date we will accept - the site did not exist before this. */
export const EPOCH_DATE = '2000-01-01';

/** Largest custom range we will run, to protect the database from a silly query. */
export const MAX_RANGE_DAYS = 1100;

/**
 * Resolve the dashboard's date range from URL search params.
 *
 * Always returns a usable range - invalid input falls back to the 30-day default
 * rather than throwing, so a malformed shared link never breaks the dashboard.
 * `invalid` explains what was rejected so the UI can say so.
 */
export function resolveRange(
  params: { preset?: string | null; from?: string | null; to?: string | null },
  now: Date = new Date(),
): DateRange & { invalid?: string } {
  const today = sydneyToday(now);
  const preset = (params.preset || '').toLowerCase();

  const fixed = (p: Preset, from: string): DateRange => ({ from, to: today, preset: p });

  switch (preset) {
    case 'today':
      return fixed('today', today);
    case '7d':
      return fixed('7d', addDays(today, -6));
    case '30d':
      return fixed('30d', addDays(today, -29));
    case 'year':
      return fixed('year', `${today.slice(0, 4)}-01-01`);
    case 'all':
      return { from: EPOCH_DATE, to: today, preset: 'all' };
  }

  const { from, to } = params;
  if (from || to || preset === 'custom') {
    if (!isValidDateString(from) || !isValidDateString(to)) {
      return { ...fixed('30d', addDays(today, -29)), invalid: 'Invalid date - showing the last 30 days.' };
    }
    if (from > to) {
      return {
        ...fixed('30d', addDays(today, -29)),
        invalid: 'Start date is after end date - showing the last 30 days.',
      };
    }
    if (daysBetweenInclusive(from, to) > MAX_RANGE_DAYS) {
      return {
        ...fixed('30d', addDays(today, -29)),
        invalid: `Range longer than ${MAX_RANGE_DAYS} days - showing the last 30 days.`,
      };
    }
    return { from, to, preset: 'custom' };
  }

  return fixed('30d', addDays(today, -29));
}

export type Bucket = 'hour' | 'day' | 'month';

/**
 * Grouping for the "Visits over time" graph, chosen from the range length:
 * a single day is hourly, up to ~3 months is daily, longer is monthly.
 */
export function bucketFor(range: { from: string; to: string }): Bucket {
  const days = daysBetweenInclusive(range.from, range.to);
  if (days <= 1) return 'hour';
  if (days <= 92) return 'day';
  return 'month';
}

/** Human label for a bucket key, for chart axes and tooltips. */
export function formatBucketLabel(iso: string, bucket: Bucket): string {
  if (bucket === 'hour') {
    const hh = iso.slice(11, 13);
    return `${hh}:00`;
  }
  const [y, m, d] = iso.slice(0, 10).split('-');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    Number(m) - 1
  ];
  return bucket === 'month' ? `${month} ${y}` : `${Number(d)} ${month}`;
}

/**
 * Every bucket key in a range, in order, including ones with no traffic.
 *
 * The database only returns buckets that have rows, so the graph would otherwise skip
 * quiet periods and imply continuous activity. Filling the gaps with explicit zeros is
 * what makes the line honest.
 */
export function generateBuckets(range: { from: string; to: string }, bucket: Bucket): string[] {
  if (bucket === 'hour') {
    return Array.from({ length: 24 }, (_, h) => `${range.from}T${String(h).padStart(2, '0')}:00`);
  }
  if (bucket === 'day') {
    const out: string[] = [];
    for (let d = range.from; d <= range.to; d = addDays(d, 1)) out.push(d);
    return out;
  }
  const out: string[] = [];
  let [y, m] = [Number(range.from.slice(0, 4)), Number(range.from.slice(5, 7))];
  const [ey, em] = [Number(range.to.slice(0, 4)), Number(range.to.slice(5, 7))];
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Safe percentage of a total, rounded to one decimal. Zero total yields 0. */
export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}
