import { describe, expect, it } from 'vitest';
import { buildInsights, changeLabel, changePct, channelFor, type WeeklyComparison } from './insights';

const period = (o: Partial<WeeklyComparison['cur']> = {}) => ({
  visits: 0,
  visitors: 0,
  pageViews: 0,
  byChannel: { search: 0, social: 0, referral: 0, direct: 0 },
  byLanguage: {} as Record<string, number>,
  ...o,
});

const comparison = (cur = period(), prev = period(), extra: Partial<WeeklyComparison> = {}): WeeklyComparison => ({
  cur,
  prev,
  risers: [],
  fallers: [],
  daysOfData: 60,
  ...extra,
});

describe('referrer channel classification', () => {
  it.each([
    ['www.google.com', 'search'],
    ['google.com.au', 'search'],
    ['www.bing.com', 'search'],
    ['duckduckgo.com', 'search'],
    ['search.brave.com', 'search'],
    ['yandex.ru', 'search'],
  ])('treats %s as search', (host, expected) => expect(channelFor(host)).toBe(expected));

  it.each([
    ['www.facebook.com', 'social'],
    ['t.co', 'social'],
    ['reddit.com', 'social'],
    ['instagram.com', 'social'],
  ])('treats %s as social', (host, expected) => expect(channelFor(host)).toBe(expected));

  it('treats an unknown site as a referral and no referrer as direct', () => {
    expect(channelFor('timeout.com')).toBe('referral');
    expect(channelFor(null)).toBe('direct');
    expect(channelFor('')).toBe('direct');
  });

  it('does not mistake a lookalike domain for a search engine', () => {
    expect(channelFor('notgoogle-fanpage.example')).toBe('referral');
  });
});

describe('change maths', () => {
  it('computes percentage change', () => {
    expect(changePct(120, 100)).toBe(20);
    expect(changePct(80, 100)).toBe(-20);
    expect(changePct(0, 0)).toBe(0);
  });

  it('refuses to invent a percentage with no baseline', () => {
    expect(changePct(10, 0)).toBeNull();
    expect(changeLabel(10, 0)).toBe('no comparison yet');
  });

  it('words changes plainly', () => {
    expect(changeLabel(120, 100)).toBe('up 20%');
    expect(changeLabel(50, 100)).toBe('down 50%');
    expect(changeLabel(100, 100)).toBe('unchanged');
  });
});

describe('insights', () => {
  it('warns that a tiny sample is not a trend', () => {
    const out = buildInsights(comparison(period({ visits: 3 }), period({ visits: 2 })));
    expect(out[0].text).toMatch(/too little to read a trend/i);
  });

  it('reports growth in search visits as good, with the numbers behind it', () => {
    const out = buildInsights(
      comparison(
        period({ visits: 100, pageViews: 200, byChannel: { search: 40, social: 0, referral: 0, direct: 60 } }),
        period({ visits: 90, pageViews: 150, byChannel: { search: 20, social: 0, referral: 0, direct: 70 } }),
      ),
    );
    const s = out.find((i) => i.text.includes('Search engines'))!;
    expect(s.tone).toBe('good');
    expect(s.text).toContain('40 visits');
    expect(s.text).toContain('up 100%');
    expect(s.text).toContain('40% of all visits');
  });

  it('flags a fall in search visits', () => {
    const out = buildInsights(
      comparison(
        period({ visits: 100, byChannel: { search: 10, social: 0, referral: 0, direct: 90 } }),
        period({ visits: 100, byChannel: { search: 30, social: 0, referral: 0, direct: 70 } }),
      ),
    );
    expect(out.find((i) => i.text.includes('Search engines'))!.tone).toBe('bad');
  });

  it('says so plainly when no search traffic exists at all', () => {
    const out = buildInsights(comparison(period({ visits: 50 }), period({ visits: 40 })));
    expect(out.some((i) => /No visits arrived from a search engine/.test(i.text))).toBe(true);
  });

  it('reports translated-content share and its direction', () => {
    const out = buildInsights(
      comparison(
        period({ visits: 100, pageViews: 100, byLanguage: { en: 80, ja: 15, 'zh-cn': 5 } }),
        period({ visits: 100, pageViews: 100, byLanguage: { en: 95, ja: 5 } }),
      ),
    );
    const t = out.find((i) => i.text.includes('Translated pages'))!;
    expect(t.tone).toBe('good');
    expect(t.text).toContain('20 of 100 page views (20%)');
  });

  it('notes when translations get no traffic rather than staying silent', () => {
    const out = buildInsights(
      comparison(period({ visits: 50, pageViews: 50, byLanguage: { en: 50 } }), period({ visits: 40 })),
    );
    expect(out.some((i) => /No page views on any translated page/.test(i.text))).toBe(true);
  });

  it('surfaces the biggest risers and fallers', () => {
    const out = buildInsights(
      comparison(period({ visits: 100, pageViews: 100 }), period({ visits: 100, pageViews: 100 }), {
        risers: [{ pathname: '/a', cur: 50, prev: 10 }],
        fallers: [{ pathname: '/b', cur: 5, prev: 40 }],
      }),
    );
    expect(out.some((i) => i.text.includes('/a') && i.tone === 'good')).toBe(true);
    expect(out.some((i) => i.text.includes('/b') && i.tone === 'bad')).toBe(true);
  });

  it('never produces a numeric score', () => {
    const out = buildInsights(
      comparison(
        period({ visits: 100, pageViews: 200, byChannel: { search: 40, social: 5, referral: 5, direct: 50 } }),
        period({ visits: 80, pageViews: 150, byChannel: { search: 20, social: 5, referral: 5, direct: 50 } }),
      ),
    );
    expect(out.some((i) => /score|\/100|out of 100|grade/i.test(i.text))).toBe(false);
  });
});
