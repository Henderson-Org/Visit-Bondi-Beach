import { describe, it, expect } from 'vitest';
import { EVENTS, type BondiEvent } from '@/data/events';
import {
  addDays,
  weekdayOf,
  weekendRange,
  endOfMonth,
  resolveEvent,
  isExpired,
  occursOn,
  occursInRange,
  passesDateFilter,
  relativeDay,
  formatTime,
  formatDateRange,
  whenLabel,
} from './events';

// A fixed reference "today": Wednesday 12 August 2026.
const WED = '2026-08-12';

const weekly = (weekday: number): BondiEvent => ({
  id: 'w', slug: 'w', title: 'Weekly', summary: '', description: [], timezone: 'Australia/Sydney',
  recurrence: { freq: 'weekly', weekday }, dateStatus: 'recurring',
  venue: 'v', suburb: 'Bondi Beach', categories: ['markets'], audience: ['everyone'], priceType: 'free',
  status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

const annualTBC = (month: number): BondiEvent => ({
  id: 'a', slug: 'a', title: 'Annual', summary: '', description: [], timezone: 'Australia/Sydney',
  recurrence: { freq: 'annual', month }, dateStatus: 'tbc',
  venue: 'v', suburb: 'Bondi Beach', categories: ['arts'], audience: ['everyone'], priceType: 'free',
  status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

const announced = (startDate: string, endDate: string, month: number): BondiEvent => ({
  id: 'an', slug: 'an', title: 'Announced', summary: '', description: [], timezone: 'Australia/Sydney',
  startDate, endDate, recurrence: { freq: 'annual', month }, dateStatus: 'announced',
  venue: 'v', suburb: 'Bondi Beach', categories: ['arts'], audience: ['everyone'], priceType: 'free',
  status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

const fixedAnnual = (month: number, day: number): BondiEvent => ({
  id: 'f', slug: 'f', title: 'Fixed', summary: '', description: [], timezone: 'Australia/Sydney',
  recurrence: { freq: 'annual', month, day }, dateStatus: 'confirmed',
  venue: 'v', suburb: 'Bondi Beach', categories: ['seasonal'], audience: ['everyone'], priceType: 'varies',
  status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

const oneOff = (startDate: string, endDate?: string): BondiEvent => ({
  id: 'o', slug: 'o', title: 'One-off', summary: '', description: [], timezone: 'Australia/Sydney',
  startDate, endDate, dateStatus: 'announced', venue: 'v', suburb: 'Bondi Beach', categories: ['music'], audience: ['everyone'],
  priceType: 'free', status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

describe('date helpers', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('knows weekdays (0=Sun..6=Sat)', () => {
    expect(weekdayOf('2026-08-12')).toBe(3); // Wednesday
    expect(weekdayOf('2026-08-15')).toBe(6); // Saturday
  });
  it('computes the upcoming weekend from a midweek day', () => {
    expect(weekendRange(WED)).toEqual({ sat: '2026-08-15', sun: '2026-08-16' });
  });
  it('treats Sunday as the current weekend', () => {
    expect(weekendRange('2026-08-16')).toEqual({ sat: '2026-08-15', sun: '2026-08-16' });
  });
  it('finds end of month', () => {
    expect(endOfMonth('2026-08-12')).toBe('2026-08-31');
    expect(endOfMonth('2026-02-10')).toBe('2026-02-28');
  });
});

describe('recurring resolution', () => {
  it('resolves a weekly Saturday event to the next Saturday', () => {
    const r = resolveEvent(weekly(6), WED);
    expect(r.nextDate).toBe('2026-08-15');
    expect(r.exact).toBe(true);
  });
  it('never expires a recurring event', () => {
    expect(isExpired(weekly(6), WED)).toBe(false);
  });
  it('matches occursOn for the weekly weekday only', () => {
    expect(occursOn(weekly(6), '2026-08-15')).toBe(true); // Sat
    expect(occursOn(weekly(6), '2026-08-14')).toBe(false); // Fri
  });
  it('passes the weekend filter for a Saturday market', () => {
    expect(passesDateFilter(weekly(6), 'weekend', WED)).toBe(true);
    expect(passesDateFilter(weekly(0), 'weekend', WED)).toBe(true); // Sunday
    expect(passesDateFilter(weekly(2), 'weekend', WED)).toBe(false); // Tuesday
  });
});

describe('annual date-to-confirm events', () => {
  it('resolves with an approximate sort date but no public exact date', () => {
    const r = resolveEvent(annualTBC(10), WED); // October
    expect(r.nextDate).toBeNull();
    expect(r.exact).toBe(false);
    expect(r.sortDate.startsWith('2026-10')).toBe(true);
  });
  it('is excluded from exact-day filters (we do not know the day)', () => {
    expect(passesDateFilter(annualTBC(10), 'weekend', WED)).toBe(false);
    expect(passesDateFilter(annualTBC(8), 'week', WED)).toBe(false);
  });
  it('surfaces under the month filter when the month matches', () => {
    expect(passesDateFilter(annualTBC(8), 'month', WED)).toBe(true); // August
    expect(passesDateFilter(annualTBC(10), 'month', WED)).toBe(false);
  });
});

describe('one-off events', () => {
  it('expires once fully in the past', () => {
    expect(isExpired(oneOff('2026-08-01'), WED)).toBe(true);
    expect(isExpired(oneOff('2026-08-20'), WED)).toBe(false);
  });
  it('matches a date range', () => {
    expect(occursInRange(oneOff('2026-08-14', '2026-08-16'), '2026-08-15', '2026-08-15')).toBe(true);
    expect(occursInRange(oneOff('2026-09-01'), '2026-08-12', '2026-08-18')).toBe(false);
  });
});

describe('announced concrete editions', () => {
  it('shows the announced start date while the edition is upcoming', () => {
    const r = resolveEvent(announced('2026-10-16', '2026-11-02', 10), WED);
    expect(r.nextDate).toBe('2026-10-16');
    expect(r.exact).toBe(true);
  });
  it('renders a multi-day range as the when-label', () => {
    const r = resolveEvent(announced('2026-10-16', '2026-11-02', 10), WED);
    expect(whenLabel(r)).toBe('16 Oct – 2 Nov 2026');
  });
  it('rolls a passed edition forward to approximate timing (never recycles the old date)', () => {
    const past = announced('2026-05-01', '2026-05-02', 5); // a May edition, finished well before WED (Aug)
    const r = resolveEvent(past, WED);
    expect(r.nextDate).toBeNull(); // no fake exact date is shown
    expect(r.nextDate).not.toBe('2026-05-01'); // the passed date is never recycled
    expect(r.sortDate.slice(0, 4)).toBe('2027'); // its approximate next occurrence is next year
  });
  it('is included in exact-day filters during its run', () => {
    const e = announced('2026-08-14', '2026-08-16', 8);
    expect(passesDateFilter(e, 'weekend', WED)).toBe(true); // Sat 15 / Sun 16 fall in range
  });
});

describe('fixed-day annual (e.g. New Year’s Eve)', () => {
  it('always shows the fixed calendar date — never TBC', () => {
    const r = resolveEvent(fixedAnnual(12, 31), WED);
    expect(r.nextDate).toBe('2026-12-31');
    expect(r.exact).toBe(true);
  });
  it('matches occursOn for that day', () => {
    expect(occursOn(fixedAnnual(12, 31), '2026-12-31')).toBe(true);
    expect(occursOn(fixedAnnual(12, 31), '2026-12-30')).toBe(false);
  });
});

// Data-integrity invariants over the REAL event dataset — these fail the build if an
// event ever lands in a contradictory date state (the class of bug that produced the
// "New Year's Eve → Dates TBC" issue). Mirrors scripts/verify-events.mjs.
describe('event data integrity (real EVENTS)', () => {
  const today = '2026-08-10';
  it('every event has a dateStatus', () => {
    for (const e of EVENTS) expect(e.dateStatus, e.slug).toBeTruthy();
  });
  it('confirmed/announced events can actually produce a shown date', () => {
    for (const e of EVENTS) {
      if (e.dateStatus === 'announced') expect(Boolean(e.startDate), `${e.slug} announced needs startDate`).toBe(true);
      if (e.dateStatus === 'confirmed') {
        const fixedDay = e.recurrence?.freq === 'annual' && e.recurrence.day != null;
        expect(Boolean(e.startDate) || fixedDay, `${e.slug} confirmed needs a date`).toBe(true);
      }
    }
  });
  it('endDate is never before startDate', () => {
    for (const e of EVENTS) if (e.startDate && e.endDate) expect(e.endDate >= e.startDate, e.slug).toBe(true);
  });
  it('tbc events carry no concrete startDate (would contradict the badge)', () => {
    for (const e of EVENTS) if (e.dateStatus === 'tbc') expect(e.startDate, e.slug).toBeUndefined();
  });
  it('no event both has resolvable dates AND still shows the TBC badge', () => {
    for (const e of EVENTS) {
      const r = resolveEvent(e, today);
      if (r.nextDate) expect(e.dateStatus, `${e.slug} resolves a date but is marked tbc`).not.toBe('tbc');
    }
  });
  it('no announced/confirmed edition is silently stale (its dates already passed)', () => {
    for (const e of EVENTS) {
      if ((e.dateStatus === 'announced' || e.dateStatus === 'confirmed') && e.startDate) {
        const end = e.endDate ?? e.startDate;
        expect(end >= today, `${e.slug} ${e.dateStatus} edition (${e.startDate}..${end}) has passed — research next edition`).toBe(true);
      }
    }
  });
});

describe('formatting', () => {
  it('formats relative days', () => {
    expect(relativeDay(WED, WED)).toBe('Today');
    expect(relativeDay('2026-08-13', WED)).toBe('Tomorrow');
    expect(relativeDay('2026-08-15', WED)).toBe('Sat, 15 Aug');
  });
  it('formats times', () => {
    expect(formatTime('09:00')).toBe('9am');
    expect(formatTime('16:30')).toBe('4:30pm');
    expect(formatTime(undefined)).toBeNull();
  });
});
