import { describe, it, expect } from 'vitest';
import type { BondiEvent } from '@/data/events';
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
} from './events';

// A fixed reference "today": Wednesday 12 August 2026.
const WED = '2026-08-12';

const weekly = (weekday: number): BondiEvent => ({
  id: 'w', slug: 'w', title: 'Weekly', summary: '', description: [], timezone: 'Australia/Sydney',
  recurrence: { freq: 'weekly', weekday },
  venue: 'v', suburb: 'Bondi Beach', categories: ['markets'], audience: ['everyone'], priceType: 'free',
  status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

const annualTBC = (month: number): BondiEvent => ({
  id: 'a', slug: 'a', title: 'Annual', summary: '', description: [], timezone: 'Australia/Sydney',
  recurrence: { freq: 'annual', month }, datesToConfirm: true,
  venue: 'v', suburb: 'Bondi Beach', categories: ['arts'], audience: ['everyone'], priceType: 'free',
  status: 'scheduled', lastVerified: '2026-08-08',
} as unknown as BondiEvent);

const oneOff = (startDate: string, endDate?: string): BondiEvent => ({
  id: 'o', slug: 'o', title: 'One-off', summary: '', description: [], timezone: 'Australia/Sydney',
  startDate, endDate, venue: 'v', suburb: 'Bondi Beach', categories: ['music'], audience: ['everyone'],
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
