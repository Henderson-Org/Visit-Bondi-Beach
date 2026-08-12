/**
 * Event date logic - Sydney-aware, recurrence-capable. Pure functions so they're
 * testable (see lib/events.test.ts) and safe to run at build/ISR time.
 *
 * All calendar maths anchors dates at UTC-noon to avoid DST edge cases; we only ever
 * care about the Sydney *calendar date*, which we read via Intl.
 */
import { EVENTS, type BondiEvent, type EventCategory, type Audience, type PriceType } from '@/data/events';

/* ------------------------------- date helpers ------------------------------ */

/** The Sydney UTC offset in effect on a given date, e.g. "+10:00" (AEST) or "+11:00" (AEDT). */
export function sydneyOffset(ymd: string): string {
  const dt = new Date(`${ymd}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Sydney', timeZoneName: 'longOffset' }).formatToParts(dt);
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = tz.match(/([+-]\d{2}:\d{2})/);
  return m ? m[1] : '+10:00';
}

/** Today's date in Sydney as YYYY-MM-DD. */
export function sydneyToday(now: Date = new Date()): string {
  // en-CA renders as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}
function dateToYmd(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}
export function addDays(ymd: string, n: number): string {
  const dt = ymdToDate(ymd);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dateToYmd(dt);
}
/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(ymd: string): number {
  return ymdToDate(ymd).getUTCDay();
}
function yearOf(ymd: string): number {
  return Number(ymd.slice(0, 4));
}
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The Saturday and Sunday of the current-or-upcoming weekend, relative to `today`. */
export function weekendRange(today: string): { sat: string; sun: string } {
  const wd = weekdayOf(today);
  if (wd === 0) return { sat: addDays(today, -1), sun: today }; // Sunday → weekend is Sat–today
  const toSat = (6 - wd + 7) % 7;
  const sat = addDays(today, toSat);
  return { sat, sun: addDays(sat, 1) };
}

/** Last day (YYYY-MM-DD) of the calendar month that `ymd` falls in. */
export function endOfMonth(ymd: string): string {
  const [y, m] = ymd.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
  return `${y}-${pad(m)}-${pad(last)}`;
}

/* ---------------------------- occurrence logic ----------------------------- */

function nextWeekly(today: string, weekday: number): string {
  const delta = (weekday - weekdayOf(today) + 7) % 7;
  return addDays(today, delta);
}

function nextAnnual(today: string, month: number, day?: number, forceYear?: number): { date: string; exact: boolean } {
  const d = day ?? 15;
  // When the next edition's year is known (e.g. this year's has passed), anchor to it so we
  // never recycle a past edition; otherwise use this-year-or-next.
  if (forceYear != null) return { date: `${forceYear}-${pad(month)}-${pad(d)}`, exact: day != null };
  const y = yearOf(today);
  let candidate = `${y}-${pad(month)}-${pad(d)}`;
  if (candidate < today) candidate = `${y + 1}-${pad(month)}-${pad(d)}`;
  return { date: candidate, exact: day != null };
}

export interface ResolvedEvent {
  event: BondiEvent;
  /** Concrete next date when we can state it; null when only approximate (annual, date TBC). */
  nextDate: string | null;
  /** Always present - used purely for chronological ordering. */
  sortDate: string;
  /** True when nextDate is a verified concrete date (safe for Event schema). */
  exact: boolean;
}

/** Is a one-off event fully in the past relative to `today`? Recurring events never expire. */
export function isExpired(e: BondiEvent, today: string): boolean {
  if (e.recurrence) return false;
  if (!e.startDate) return false;
  return (e.endDate ?? e.startDate) < today;
}

export function resolveEvent(e: BondiEvent, today: string): ResolvedEvent {
  // 1. A concrete announced/confirmed edition (start–end) that hasn't finished yet always
  //    wins - this is the exact date the organiser has published.
  if (e.startDate && (e.endDate ?? e.startDate) >= today) {
    return { event: e, nextDate: e.startDate, sortDate: e.startDate, exact: true };
  }
  // 2. Weekly recurrence → next occurrence (always concrete).
  if (e.recurrence?.freq === 'weekly' && e.recurrence.weekday != null) {
    const d = nextWeekly(today, e.recurrence.weekday);
    return { event: e, nextDate: d, sortDate: d, exact: true };
  }
  // 3. Annual recurrence. Present a concrete day ONLY for a genuinely fixed calendar date
  //    (e.g. NYE = 31 Dec, dateStatus 'confirmed'). For an annual whose specific edition has
  //    passed or isn't announced, we show approximate timing rather than a recycled/guessed day.
  if (e.recurrence?.freq === 'annual' && e.recurrence.month != null) {
    const { date } = nextAnnual(today, e.recurrence.month, e.recurrence.day, e.nextEditionYear);
    const fixedDay = e.recurrence.day != null && e.dateStatus === 'confirmed';
    return { event: e, nextDate: fixedDay ? date : null, sortDate: date, exact: fixedDay };
  }
  // 4. One-off: a future date was returned by #1; a past one-off is excluded by isExpired.
  return { event: e, nextDate: e.startDate ?? null, sortDate: e.startDate ?? today, exact: Boolean(e.startDate) };
}

/** Does the event occur on a specific date (exact-day semantics only)? */
export function occursOn(e: BondiEvent, ymd: string): boolean {
  if (e.recurrence?.freq === 'weekly' && e.recurrence.weekday != null) {
    return weekdayOf(ymd) === e.recurrence.weekday;
  }
  // A concrete announced/confirmed edition (its published start–end range).
  if (e.startDate) return ymd >= e.startDate && ymd <= (e.endDate ?? e.startDate);
  // A fixed-day annual (e.g. NYE = 31 Dec) - the only annual we treat as an exact day.
  if (e.recurrence?.freq === 'annual' && e.recurrence.day != null && e.dateStatus === 'confirmed') {
    return ymd.slice(5) === `${pad(e.recurrence.month!)}-${pad(e.recurrence.day)}`;
  }
  return false;
}

/** Does the event have at least one exact-day occurrence within [start, end]? */
export function occursInRange(e: BondiEvent, start: string, end: string): boolean {
  if (e.recurrence?.freq === 'weekly' && e.recurrence.weekday != null) {
    // A 7+ day range always contains the weekday; otherwise scan.
    for (let d = start; d <= end; d = addDays(d, 1)) if (weekdayOf(d) === e.recurrence.weekday) return true;
    return false;
  }
  if (e.startDate) return e.startDate <= end && (e.endDate ?? e.startDate) >= start;
  if (e.recurrence?.freq === 'annual' && e.recurrence.day != null && e.dateStatus === 'confirmed') {
    const y = yearOf(start);
    for (const yr of [y, y + 1]) {
      const cand = `${yr}-${pad(e.recurrence.month!)}-${pad(e.recurrence.day)}`;
      if (cand >= start && cand <= end) return true;
    }
    return false;
  }
  return false;
}

/* ------------------------------- collections ------------------------------- */

/** All current/upcoming events, resolved to their next date and sorted chronologically. */
export function upcomingEvents(today: string = sydneyToday()): ResolvedEvent[] {
  return EVENTS.filter((e) => !isExpired(e, today))
    .map((e) => resolveEvent(e, today))
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate));
}

export type DateFilter = 'today' | 'tomorrow' | 'weekend' | 'week' | 'month';

/** Whether an event passes a named date filter (exact-day filters exclude date-TBC annuals). */
export function passesDateFilter(e: BondiEvent, filter: DateFilter, today: string): boolean {
  switch (filter) {
    case 'today':
      return occursOn(e, today);
    case 'tomorrow':
      return occursOn(e, addDays(today, 1));
    case 'weekend': {
      const { sat, sun } = weekendRange(today);
      return occursOn(e, sat) || occursOn(e, sun);
    }
    case 'week':
      return occursInRange(e, today, addDays(today, 6));
    case 'month':
      // Month scope also surfaces annual events whose month matches (date TBC).
      if (occursInRange(e, today, endOfMonth(today))) return true;
      if (e.recurrence?.freq === 'annual' && e.recurrence.month === Number(today.slice(5, 7))) return true;
      return false;
  }
}

/* --------------------------------- facets ---------------------------------- */

/** Serializable facet for the client browser - includes precomputed date membership. */
export interface EventFacet {
  slug: string;
  categories: EventCategory[];
  audience: Audience[];
  price: PriceType;
  date: Record<DateFilter, boolean>;
}

export function buildEventFacet(e: BondiEvent, today: string): EventFacet {
  return {
    slug: e.slug,
    categories: e.categories,
    audience: e.audience,
    price: e.priceType,
    date: {
      today: passesDateFilter(e, 'today', today),
      tomorrow: passesDateFilter(e, 'tomorrow', today),
      weekend: passesDateFilter(e, 'weekend', today),
      week: passesDateFilter(e, 'week', today),
      month: passesDateFilter(e, 'month', today),
    },
  };
}

/* -------------------------------- formatting ------------------------------- */

export function formatEventDate(ymd: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(ymdToDate(ymd));
}

export function formatEventDateLong(ymd: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(ymdToDate(ymd));
}

export function formatTime(hhmm?: string): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return m === 0 ? `${hr}${ampm}` : `${hr}:${pad(m)}${ampm}`;
}

/** Format a start–end span compactly, e.g. "16 Oct – 2 Nov 2026" or "22–31 Jan 2027". */
export function formatDateRange(start: string, end: string): string {
  const s = ymdToDate(start), e = ymdToDate(end);
  const day = (d: Date) => d.getUTCDate();
  const mon = (d: Date) => new Intl.DateTimeFormat('en-AU', { month: 'short', timeZone: 'UTC' }).format(d);
  const yr = end.slice(0, 4);
  if (start === end) return formatEventDateLong(start);
  if (start.slice(0, 7) === end.slice(0, 7)) return `${day(s)}–${day(e)} ${mon(e)} ${yr}`; // same month
  return `${day(s)} ${mon(s)} – ${day(e)} ${mon(e)} ${yr}`;
}

/**
 * Short, human "when" label for a card. Priority: a concrete announced range → a single
 * confirmed date → typical recurring timing → the human whenText. "Dates to be confirmed"
 * only ever appears as the final fallback, and only for genuinely unannounced (tbc) events.
 */
export function whenLabel(r: ResolvedEvent): string {
  const e = r.event;
  // Announced multi-day edition → show the full range (dominant, exact).
  if (r.nextDate && e.startDate && e.endDate && e.endDate !== e.startDate && r.nextDate === e.startDate) {
    return formatDateRange(e.startDate, e.endDate);
  }
  if (r.nextDate) {
    const time = formatTime(e.startTime);
    return time ? `${relativeDay(r.nextDate)} · ${time}` : relativeDay(r.nextDate);
  }
  return e.whenText ?? e.typicalTiming ?? 'Dates to be confirmed';
}

/** "Today" / "Tomorrow" / "Sat 15 Aug" relative to the Sydney date. */
export function relativeDay(ymd: string, today: string = sydneyToday()): string {
  if (ymd === today) return 'Today';
  if (ymd === addDays(today, 1)) return 'Tomorrow';
  return formatEventDate(ymd);
}
