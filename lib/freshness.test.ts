import { describe, it, expect } from 'vitest';
import { reviewState } from './freshness';
import type { Page } from './content';

/** Minimal Page stub - reviewState only reads the freshness/provenance fields. */
const page = (over: Partial<Page>): Page =>
  ({
    path: '/x', title: 'X', h1: 'X', contentType: 'blog-post-legacy', section: 'blog',
    metaDescription: '', canonical: '', headings: [], ogImage: '', heroImage: '', intro: '',
    wordCount: 0, jsonLdTypes: [], publishedAt: null, lastmod: null, indexable: true,
    status: 200, liveUrl: '', authoredBody: true, ...over,
  }) as Page;

const NOW = new Date('2026-08-25T00:00:00Z');

describe('reviewState', () => {
  it('derives nextReviewAt from lastReviewed + the class cadence', () => {
    // monthly = 45 days: 2026-08-01 + 45d = 2026-09-15
    const r = reviewState(page({ freshnessClass: 'monthly', lastReviewed: '2026-08-01' }), NOW);
    expect(r.nextReviewAt).toBe('2026-09-15');
    expect(r.ageDays).toBe(24);
    expect(r.status).toBe('ok');
    expect(r.overdueByDays).toBe(0);
  });

  it('flags a page past its cadence as overdue, with the days past due', () => {
    // monthly, reviewed 60 days ago (max 45) -> 15 days overdue
    const r = reviewState(page({ freshnessClass: 'monthly', lastReviewed: '2026-06-26' }), NOW);
    expect(r.status).toBe('overdue');
    expect(r.overdueByDays).toBe(15);
  });

  it('flags the tail of the window as due-soon before it lapses', () => {
    // monthly, 80% of 45d = 36d. Reviewed 40 days ago -> due-soon, not yet overdue.
    const r = reviewState(page({ freshnessClass: 'monthly', lastReviewed: '2026-07-16' }), NOW);
    expect(r.status).toBe('due-soon');
    expect(r.overdueByDays).toBe(0);
  });

  it('separates never-verified from unclassified', () => {
    expect(reviewState(page({ freshnessClass: 'monthly', lastReviewed: null }), NOW).status)
      .toBe('never-verified');
    expect(reviewState(page({ freshnessClass: null, lastReviewed: '2026-08-01' }), NOW).status)
      .toBe('unclassified');
  });

  it('still applies a (long) cadence to evergreen pages so they are re-read eventually', () => {
    const fresh = reviewState(page({ freshnessClass: 'evergreen', lastReviewed: '2026-08-01' }), NOW);
    expect(fresh.status).toBe('ok');
    // 550 days is the evergreen max; 600 days ago is overdue.
    const stale = reviewState(page({ freshnessClass: 'evergreen', lastReviewed: '2025-01-01' }), NOW);
    expect(stale.status).toBe('overdue');
  });

  it('carries the verification method and sources through unchanged', () => {
    const r = reviewState(
      page({
        freshnessClass: 'quarterly',
        lastReviewed: '2026-08-01',
        checkType: 'local',
        sources: [{ label: 'Waverley Council', url: 'https://waverley.nsw.gov.au' }],
      }),
      NOW,
    );
    expect(r.verificationMethod).toBe('local');
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0].label).toBe('Waverley Council');
  });
});
