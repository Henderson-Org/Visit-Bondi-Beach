import { describe, expect, it } from 'vitest';
import {
  addDays,
  bucketFor,
  classifyPath,
  daysBetweenInclusive,
  formatBucketLabel,
  generateBuckets,
  isExcludedPath,
  isValidDateString,
  languageLabel,
  pct,
  referrerHost,
  resolveRange,
  sydneyToday,
} from './core';
import { timingSafeEqual, verifySessionToken, createSessionToken } from '@/lib/admin/auth';

describe('language + content id from the rendered URL', () => {
  it('treats an unprefixed path as English', () => {
    expect(classifyPath('/bondi-blog/where-to-find-carpark-bondi-beach')).toEqual({
      path: '/bondi-blog/where-to-find-carpark-bondi-beach',
      language: 'en',
      contentId: '/bondi-blog/where-to-find-carpark-bondi-beach',
    });
  });

  it('reads the language from the locale prefix, not the browser', () => {
    const r = classifyPath('/ja/bondi-blog/how-to-get-to-bondi-beach');
    expect(r.language).toBe('ja');
  });

  it('gives every translation of one article the same content id', () => {
    const en = classifyPath('/bondi-coastal-walk');
    const ja = classifyPath('/ja/bondi-coastal-walk');
    const zh = classifyPath('/zh-cn/bondi-coastal-walk');
    expect(new Set([en.contentId, ja.contentId, zh.contentId]).size).toBe(1);
    // ...while keeping their own distinct real paths.
    expect(new Set([en.path, ja.path, zh.path]).size).toBe(3);
  });

  it('does not mistake a content path that merely starts with letters for a locale', () => {
    expect(classifyPath('/italy-guide').language).toBe('en');
    expect(classifyPath('/deals').language).toBe('en');
  });

  it('normalises query strings, fragments and trailing slashes', () => {
    expect(classifyPath('/ja/bondi-beach/?utm_source=x#top').path).toBe('/ja/bondi-beach');
  });

  it('maps stored codes to readable language names', () => {
    expect(languageLabel('zh-cn')).toBe('Chinese (Simplified)');
    expect(languageLabel('en')).toBe('English');
  });
});

describe('excluding admin and internal traffic', () => {
  it.each(['/admin', '/admin/', '/admin/login', '/api/collect', '/api/admin/login', '/_next/static/x'])(
    'excludes %s',
    (p) => expect(isExcludedPath(p)).toBe(true),
  );

  it.each(['/', '/bondi-beach', '/ja/bondi-beach', '/administrator-guide'])(
    'includes public page %s',
    (p) => expect(isExcludedPath(p)).toBe(false),
  );

  it('still excludes admin when a query string is appended', () => {
    expect(isExcludedPath('/admin?preset=7d')).toBe(true);
  });
});

describe('date validation', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(isValidDateString('2026-08-14')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('14/08/2026')).toBe(false);
    expect(isValidDateString(null)).toBe(false);
  });
});

describe('Sydney timezone boundaries', () => {
  it('uses the Sydney calendar date, not the UTC one', () => {
    // 2026-08-14 22:00 UTC is already 15 Aug in Sydney (UTC+10 in winter).
    expect(sydneyToday(new Date('2026-08-14T22:00:00Z'))).toBe('2026-08-15');
    // 2026-08-14 05:00 UTC is still 14 Aug in Sydney.
    expect(sydneyToday(new Date('2026-08-14T05:00:00Z'))).toBe('2026-08-14');
  });

  it('handles daylight saving (UTC+11 in January)', () => {
    // 2026-01-14 13:30 UTC is 15 Jan 00:30 in Sydney during DST.
    expect(sydneyToday(new Date('2026-01-14T13:30:00Z'))).toBe('2026-01-15');
  });

  it('computes "today" ranges against the Sydney day', () => {
    const r = resolveRange({ preset: 'today' }, new Date('2026-08-14T22:00:00Z'));
    expect(r.from).toBe('2026-08-15');
    expect(r.to).toBe('2026-08-15');
  });
});

describe('date arithmetic', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
  });

  it('counts inclusive day spans', () => {
    expect(daysBetweenInclusive('2026-08-14', '2026-08-14')).toBe(1);
    expect(daysBetweenInclusive('2026-08-01', '2026-08-31')).toBe(31);
  });
});

describe('range presets', () => {
  const now = new Date('2026-08-14T02:00:00Z'); // 12:00 on 14 Aug in Sydney

  it('resolves each quick option', () => {
    expect(resolveRange({ preset: 'today' }, now)).toMatchObject({ from: '2026-08-14', to: '2026-08-14' });
    expect(resolveRange({ preset: '7d' }, now)).toMatchObject({ from: '2026-08-08', to: '2026-08-14' });
    expect(resolveRange({ preset: '30d' }, now)).toMatchObject({ from: '2026-07-16', to: '2026-08-14' });
    expect(resolveRange({ preset: 'year' }, now)).toMatchObject({ from: '2026-01-01', to: '2026-08-14' });
    expect(resolveRange({ preset: 'all' }, now).from).toBe('2000-01-01');
  });

  it('defaults to 30 days when nothing is specified', () => {
    expect(resolveRange({}, now).preset).toBe('30d');
  });

  it('accepts a valid custom range', () => {
    const r = resolveRange({ preset: 'custom', from: '2026-08-01', to: '2026-08-10' }, now);
    expect(r).toMatchObject({ from: '2026-08-01', to: '2026-08-10', preset: 'custom' });
    expect(r.invalid).toBeUndefined();
  });

  it('falls back with an explanation when the start is after the end', () => {
    const r = resolveRange({ preset: 'custom', from: '2026-08-20', to: '2026-08-01' }, now);
    expect(r.preset).toBe('30d');
    expect(r.invalid).toMatch(/after/i);
  });

  it('rejects a malformed date rather than throwing', () => {
    const r = resolveRange({ preset: 'custom', from: 'yesterday', to: '2026-08-01' }, now);
    expect(r.preset).toBe('30d');
    expect(r.invalid).toMatch(/invalid/i);
  });

  it('rejects an absurdly large custom range', () => {
    const r = resolveRange({ preset: 'custom', from: '2000-01-01', to: '2026-08-14' }, now);
    expect(r.invalid).toMatch(/longer than/i);
  });
});

describe('graph bucketing', () => {
  it('chooses an interval appropriate to the range', () => {
    expect(bucketFor({ from: '2026-08-14', to: '2026-08-14' })).toBe('hour');
    expect(bucketFor({ from: '2026-08-08', to: '2026-08-14' })).toBe('day');
    expect(bucketFor({ from: '2026-07-16', to: '2026-08-14' })).toBe('day');
    expect(bucketFor({ from: '2026-01-01', to: '2026-12-31' })).toBe('month');
  });

  it('emits a gap-free series so quiet periods plot as zero', () => {
    expect(generateBuckets({ from: '2026-08-14', to: '2026-08-14' }, 'hour')).toHaveLength(24);
    expect(generateBuckets({ from: '2026-08-01', to: '2026-08-31' }, 'day')).toHaveLength(31);
    expect(generateBuckets({ from: '2026-01-01', to: '2026-12-31' }, 'month')).toHaveLength(12);
  });

  it('rolls month buckets across a year boundary', () => {
    expect(generateBuckets({ from: '2025-11-01', to: '2026-02-28' }, 'month')).toEqual([
      '2025-11', '2025-12', '2026-01', '2026-02',
    ]);
  });

  it('formats readable axis labels', () => {
    expect(formatBucketLabel('2026-08-14T09:00', 'hour')).toBe('09:00');
    expect(formatBucketLabel('2026-08-14', 'day')).toBe('14 Aug');
    expect(formatBucketLabel('2026-08-01', 'month')).toBe('Aug 2026');
  });
});

describe('percentages and referrers', () => {
  it('never divides by zero', () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(25, 200)).toBe(12.5);
  });

  it('extracts a referrer host and tolerates junk', () => {
    expect(referrerHost('https://www.google.com/search?q=bondi')).toBe('www.google.com');
    expect(referrerHost('not a url')).toBeNull();
    expect(referrerHost(null)).toBeNull();
  });
});

describe('admin authorisation', () => {
  const SECRET = 'x'.repeat(40);

  it('compares secrets without leaking length via early exit', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcdef')).toBe(false);
  });

  it('accepts a token it just signed', async () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const token = await createSessionToken(new Date('2026-08-14T00:00:00Z'));
    expect(token).toBeTruthy();
    await expect(verifySessionToken(token!, new Date('2026-08-14T01:00:00Z'))).resolves.toBe(true);
  });

  it('rejects a tampered token', async () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const token = await createSessionToken(new Date('2026-08-14T00:00:00Z'));
    const forged = `${Number(token!.split('.')[0]) + 1}.${token!.split('.')[1]}`;
    await expect(verifySessionToken(forged, new Date('2026-08-14T01:00:00Z'))).resolves.toBe(false);
  });

  it('rejects an expired token', async () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const token = await createSessionToken(new Date('2026-08-14T00:00:00Z'));
    // 12-hour session; 13 hours later it must be refused.
    await expect(verifySessionToken(token!, new Date('2026-08-14T13:00:00Z'))).resolves.toBe(false);
  });

  it('refuses everything when the signing secret is missing or too short', async () => {
    process.env.ADMIN_SESSION_SECRET = 'short';
    expect(await createSessionToken()).toBeNull();
    await expect(verifySessionToken('anything.at-all')).resolves.toBe(false);
    delete process.env.ADMIN_SESSION_SECRET;
    await expect(verifySessionToken('anything.at-all')).resolves.toBe(false);
  });
});
