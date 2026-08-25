import { describe, it, expect } from 'vitest';
import {
  COLLECTIONS, collectionIndexDecision, isCollectionIndexable, indexableCollectionSlugs,
  venuesForCollection, getCollection, MIN_INDEXABLE_VENUES,
} from './restaurantGuide';

describe('collection registry integrity', () => {
  it('has unique slugs', () => {
    const slugs = COLLECTIONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every collection its own metaTitle and metaDescription', () => {
    // Duplicate metadata across programmatic pages is the classic index-bloat signature.
    const titles = COLLECTIONS.map((c) => c.metaTitle.toLowerCase());
    const descs = COLLECTIONS.map((c) => c.metaDescription.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
  });

  it('writes a real intro for each collection rather than templating one', () => {
    for (const c of COLLECTIONS) {
      expect(c.intro.length, `${c.slug} intro`).toBeGreaterThan(80);
    }
  });
});

describe('indexability gate', () => {
  it('indexes a collection with enough venues and a distinct intent', () => {
    const d = collectionIndexDecision(getCollection('best-restaurants-bondi-beach')!);
    expect(d.indexable).toBe(true);
  });

  it('de-indexes a second collection declaring an intent another already owns', () => {
    // "best coffee bondi" and "best cafés bondi" are the same query in different words.
    const d = collectionIndexDecision(getCollection('best-coffee-bondi')!);
    expect(d.indexable).toBe(false);
    expect(d.reason).toMatch(/same declared intent/i);
    expect(d.reason).toContain('best-cafes-bondi-beach');
  });

  it('keeps a distinct intent indexable even when it shares most of its venues', () => {
    // Romantic restaurants overlap the best-restaurants list heavily (the good rooms are
    // often the romantic ones) but are a different query with a different results page.
    // A pure venue-overlap rule would wrongly de-index this.
    const d = collectionIndexDecision(getCollection('date-night-bondi-beach')!);
    expect(d.indexable).toBe(true);
  });

  it('de-indexes a collection with too few venues to beat the directory', () => {
    const tiny = { ...getCollection('best-restaurants-bondi-beach')!, slug: 'tiny', intent: 'tiny-test', select: (r: { id: string }) => r.id === '__none__' };
    const d = collectionIndexDecision(tiny);
    expect(d.indexable).toBe(false);
    expect(d.reason).toMatch(/below the/i);
  });

  it('every indexable collection actually clears the venue floor', () => {
    for (const c of COLLECTIONS.filter(isCollectionIndexable)) {
      expect(venuesForCollection(c).length, `${c.slug}`).toBeGreaterThanOrEqual(MIN_INDEXABLE_VENUES);
    }
  });

  it('is deterministic — the earlier collection keeps the index slot', () => {
    const a = COLLECTIONS.findIndex((c) => c.slug === 'best-cafes-bondi-beach');
    const b = COLLECTIONS.findIndex((c) => c.slug === 'best-coffee-bondi');
    expect(a).toBeLessThan(b);
    expect(isCollectionIndexable(COLLECTIONS[a])).toBe(true);
    expect(isCollectionIndexable(COLLECTIONS[b])).toBe(false);
  });

  it('exposes only indexable slugs for the sitemap', () => {
    const sitemap = indexableCollectionSlugs();
    expect(sitemap).not.toContain('best-coffee-bondi');
    expect(sitemap).toContain('best-restaurants-bondi-beach');
    for (const slug of sitemap) expect(isCollectionIndexable(getCollection(slug)!)).toBe(true);
  });

  it('covers the high-value queries named in the brief', () => {
    for (const slug of [
      'best-restaurants-bondi-beach', 'breakfast-brunch-bondi-beach', 'best-cafes-bondi-beach',
      'cheap-eats-bondi-beach', 'waterfront-dining-bondi-beach', 'north-bondi', 'bondi-road',
      'family-friendly-bondi-beach', 'vegan-vegetarian-bondi-beach', 'restaurants-near-bondi-icebergs',
      'late-night-bondi-beach', 'bondi-restaurants-for-groups', 'date-night-bondi-beach',
      'best-lunch-bondi-beach', 'best-dinner-bondi-beach',
    ]) {
      expect(getCollection(slug), slug).toBeDefined();
      expect(isCollectionIndexable(getCollection(slug)!), `${slug} should be indexable`).toBe(true);
    }
  });
});
