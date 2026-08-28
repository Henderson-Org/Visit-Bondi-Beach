import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RESCUE_SEASONS } from '@/data/rescue-statistics';
import {
  seasons, latestSeason, earliestSeason, averageRescues, busiestSeason, quietestSeason,
  shareOfNsw, rescuesPerHundredThousandVisits, changeFirstToLatest, withMetric,
} from './rescueStats';

describe('dataset integrity', () => {
  it('has a unique, chronologically ordered set of seasons', () => {
    const s = seasons();
    expect(new Set(s.map((x) => x.season)).size).toBe(s.length);
    expect(s.map((x) => x.endYear)).toEqual([...s.map((x) => x.endYear)].sort((a, b) => a - b));
  });

  it('gives every season a real source URL and page', () => {
    for (const s of RESCUE_SEASONS) {
      expect(s.source.url, s.season).toMatch(/^https:\/\/www\.surflifesaving\.com\.au\/.+\.pdf$/);
      expect(s.source.page, s.season).toBeGreaterThan(0);
      expect(s.source.title, s.season).toContain('Surf Life Saving NSW');
    }
  });

  it('never carries a zero or negative rescue count', () => {
    // A zero would almost certainly be a parse failure rather than a real season.
    for (const s of RESCUE_SEASONS) expect(s.rescues, s.season).toBeGreaterThan(0);
  });

  it('keeps branch rescues below the NSW total for that season', () => {
    // A branch figure exceeding the state total means the columns were misread.
    for (const s of RESCUE_SEASONS) {
      expect(s.rescues, s.season).toBeLessThan(s.nswRescues);
    }
  });

  it('represents an unverified figure as null rather than zero or a guess', () => {
    const unreconciled = RESCUE_SEASONS.find((s) => s.season === '2022/23')!;
    expect(unreconciled.preventativeActions).toBeNull();
    expect(withMetric('preventativeActions')).toHaveLength(RESCUE_SEASONS.length - 1);
  });
});

describe('derived statistics', () => {
  it('picks the right extremes', () => {
    expect(busiestSeason().season).toBe('2016/17');
    expect(quietestSeason().season).toBe('2019/20');
    expect(latestSeason().season).toBe('2023/24');
    expect(earliestSeason().season).toBe('2016/17');
  });

  it('averages only over the seasons we actually have', () => {
    const expected = Math.round(RESCUE_SEASONS.reduce((n, s) => n + s.rescues, 0) / RESCUE_SEASONS.length);
    expect(averageRescues()).toBe(expected);
  });

  it('computes the branch share of NSW rescues', () => {
    const latest = latestSeason();
    expect(shareOfNsw(latest)).toBeCloseTo(Math.round((latest.rescues / latest.nswRescues) * 1000) / 10, 5);
    // Sanity: a single branch should be a meaningful but minority share of the state.
    for (const s of RESCUE_SEASONS) {
      expect(shareOfNsw(s), s.season).toBeGreaterThan(0);
      expect(shareOfNsw(s), s.season).toBeLessThan(100);
    }
  });

  it('normalises rescues against attendance, and returns null without it', () => {
    const latest = latestSeason();
    expect(rescuesPerHundredThousandVisits(latest)).toBeGreaterThan(0);
    expect(rescuesPerHundredThousandVisits({ ...latest, attendance: null })).toBeNull();
  });

  it('reports first-to-latest change against the real endpoints', () => {
    const c = changeFirstToLatest();
    expect(c.from.season).toBe('2016/17');
    expect(c.to.season).toBe('2023/24');
    expect(c.pct).toBeLessThan(0); // 1,801 -> 1,166
  });
});

describe('published CSV', () => {
  const csv = readFileSync('public/data/bondi-area-rescue-statistics.csv', 'utf8').trim().split('\n');

  it('has one row per season plus a header', () => {
    expect(csv).toHaveLength(RESCUE_SEASONS.length + 1);
  });

  it('matches the source data exactly, so the download can never drift from the page', () => {
    const rows = csv.slice(1).map((l) => l.split(','));
    for (const s of seasons()) {
      const row = rows.find((r) => r[0] === s.season);
      expect(row, `${s.season} missing from CSV`).toBeDefined();
      expect(Number(row![2]), `${s.season} rescues`).toBe(s.rescues);
      expect(row![3] === '' ? null : Number(row![3]), `${s.season} preventative`).toBe(s.preventativeActions);
      expect(Number(row![6]), `${s.season} NSW total`).toBe(s.nswRescues);
      expect(row!.slice(-2)[0], `${s.season} source url`).toBe(s.source.url);
    }
  });
});
