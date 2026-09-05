/**
 * The fitness dataset carries two promises that are easy to break silently: every venue
 * is shown in its REAL suburb, and nothing is published that was not verified. These
 * tests exist because both failures look fine in a browser.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FITNESS_VENUES, SUBURB_LABEL, SUBURB_POSTCODE } from '@/data/fitnessVenues';
import {
  activeVenues,
  getFitnessVenue,
  venuesInCategory,
  venuesInSuburb,
  casualFriendlyVenues,
  indexableCollections,
  venuesForCollection,
  collectionSlugs,
  fullAddress,
  populatedSuburbs,
  MIN_VENUES_FOR_PAGE,
} from './fitness';

describe('dataset integrity', () => {
  it('has unique venue ids', () => {
    const ids = FITNESS_VENUES.map((v) => v.id);
    expect(new Set(ids).size, 'duplicate venue id').toBe(ids.length);
  });

  it('has no duplicate businesses across categories or suburbs', () => {
    // One record per business is the whole point - a venue in two categories is tagged
    // twice, never entered twice.
    const names = FITNESS_VENUES.map((v) => v.name.toLowerCase().trim());
    expect(new Set(names).size, 'the same business appears twice').toBe(names.length);
  });

  it('gives every venue a real suburb, address and official website', () => {
    for (const v of FITNESS_VENUES) {
      expect(SUBURB_LABEL[v.suburb], `${v.id} has an unknown suburb`).toBeTruthy();
      expect(v.address.trim().length, `${v.id} has no address`).toBeGreaterThan(4);
      expect(v.websiteUrl, `${v.id} has no official website`).toMatch(/^https:\/\//);
    }
  });

  it('records verification sources and a date for every venue', () => {
    for (const v of FITNESS_VENUES) {
      expect(v.sources.length, `${v.id} has no verification sources`).toBeGreaterThan(0);
      for (const s of v.sources) expect(s.url, `${v.id} source is not a URL`).toMatch(/^https:\/\//);
      expect(v.lastVerified, `${v.id} has no lastVerified date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('carries at least one category per venue', () => {
    for (const v of FITNESS_VENUES) {
      expect(v.categories.length, `${v.id} has no category`).toBeGreaterThan(0);
    }
  });
});

describe('Bondi Junction is never presented as Bondi Beach', () => {
  it('keeps the two suburbs on different postcodes', () => {
    expect(SUBURB_POSTCODE['bondi-beach']).toBe('2026');
    expect(SUBURB_POSTCODE['bondi-junction']).toBe('2022');
  });

  it('renders every address with the venue’s own suburb', () => {
    for (const v of FITNESS_VENUES) {
      expect(fullAddress(v)).toContain(SUBURB_LABEL[v.suburb]);
    }
  });

  it('never labels a Bondi Junction venue as being at the beach', () => {
    // The failure this guards against: a venue on Oxford Street rendering as "Bondi Beach"
    // because the brand name says Bondi.
    for (const v of venuesInSuburb('bondi-junction')) {
      expect(fullAddress(v), `${v.id} is in Bondi Junction`).toContain('Bondi Junction');
      expect(fullAddress(v), `${v.id} must not read as Bondi Beach`).not.toContain('Bondi Beach NSW');
    }
  });

  it('does not describe a Bondi Junction venue as beachside in its own copy', () => {
    for (const v of venuesInSuburb('bondi-junction')) {
      // Only AFFIRMATIVE beachside claims are a problem. "not at the beach" is the copy we
      // actively want on these records, so the negated forms are excluded rather than the
      // test being weakened - the first version of this failed on the correct sentence.
      const claim = /(?<!not )(?<!nowhere near )\b(on the sand|beachfront|steps from the beach|by the beach|at the beach)\b/i;
      expect(v.description, `${v.id} description implies it is at the beach`).not.toMatch(claim);
    }
  });

  it('keeps both suburbs represented so the comparison page has two real sides', () => {
    expect(venuesInSuburb('bondi-beach').length).toBeGreaterThan(0);
    expect(venuesInSuburb('bondi-junction').length).toBeGreaterThan(0);
  });
});

describe('no fabricated or volatile detail', () => {
  it('stores no prices anywhere in the dataset', () => {
    // Prices move weekly. The pages send people to the official site instead, so a dollar
    // figure appearing in this file is a bug, not a feature.
    const raw = readFileSync('data/fitnessVenues.ts', 'utf8');
    const body = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(body, 'a price crept into the dataset').not.toMatch(/\$\s?\d/);
  });

  it('stores no ratings or review counts', () => {
    const raw = readFileSync('data/fitnessVenues.ts', 'utf8');
    expect(raw.toLowerCase()).not.toMatch(/\b(rating|reviews?count|stars out of|aggregaterating)\b/);
  });

  it('only claims a casual visit where it is marked verified', () => {
    for (const v of FITNESS_VENUES) {
      expect(['yes', 'unknown'], `${v.id} has an invalid casualVisit value`).toContain(v.casualVisit);
    }
    // Every venue we advertise as casual-friendly must say what the casual option is.
    for (const v of casualFriendlyVenues()) {
      expect(v.casualNote, `${v.id} is marked casual but explains nothing`).toBeTruthy();
    }
  });
});

describe('category pages', () => {
  it('only publishes categories with enough verified venues', () => {
    for (const c of indexableCollections()) {
      expect(venuesForCollection(c).length, `${c.slug} is too thin to publish`).toBeGreaterThanOrEqual(
        MIN_VENUES_FOR_PAGE
      );
    }
  });

  it('gives each category page a distinct intent and title', () => {
    const cols = indexableCollections();
    expect(new Set(cols.map((c) => c.intent)).size, 'two category pages share an intent').toBe(cols.length);
    expect(new Set(cols.map((c) => c.title)).size, 'two category pages share a title').toBe(cols.length);
    expect(new Set(cols.map((c) => c.slug)).size).toBe(cols.length);
  });

  it('returns venues for every published category', () => {
    for (const slug of collectionSlugs()) {
      const c = indexableCollections().find((x) => x.slug === slug)!;
      expect(venuesForCollection(c).length).toBeGreaterThan(0);
    }
  });
});

describe('lookups', () => {
  it('finds a venue by id and ignores unknown ids', () => {
    expect(getFitnessVenue(FITNESS_VENUES[0].id)?.name).toBe(FITNESS_VENUES[0].name);
    expect(getFitnessVenue('not-a-venue')).toBeUndefined();
  });

  it('lists only populated suburbs, beach before junction', () => {
    const s = populatedSuburbs();
    expect(s).toContain('bondi-beach');
    expect(s).toContain('bondi-junction');
    expect(s.indexOf('bondi-beach')).toBeLessThan(s.indexOf('bondi-junction'));
    for (const suburb of s) expect(venuesInSuburb(suburb).length).toBeGreaterThan(0);
  });

  it('excludes inactive venues from every listing', () => {
    const active = activeVenues().map((v) => v.id);
    for (const v of FITNESS_VENUES.filter((x) => x.active === false)) {
      expect(active).not.toContain(v.id);
    }
  });

  it('returns a venue in each category it is tagged with, without duplicating it', () => {
    for (const v of activeVenues()) {
      for (const c of v.categories) {
        const inCat = venuesInCategory(c);
        expect(inCat.filter((x) => x.id === v.id).length, `${v.id} duplicated in ${c}`).toBe(1);
      }
    }
  });
});
