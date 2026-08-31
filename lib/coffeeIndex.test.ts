/**
 * The Bondi Coffee Index publishes its raw observations at /data/bondi-coffee-index.csv —
 * the URL the page's download link and its Dataset schema `distribution` both point at.
 * That published copy is a byte copy of the source dataset, written by scripts/coffee-index.mjs.
 *
 * It was previously copied by hand and drifted: a venue's suburb was present in the source
 * and blank in the published file, so the dataset we offered to Google Dataset Search and to
 * anyone downloading it disagreed with the dataset the page's own figures were computed from.
 * These tests fail if that ever happens again.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import derived from '@/data/bondi-coffee-index.derived.json';

const SOURCE = 'data/bondi-coffee-index.csv';
const PUBLISHED = 'public/data/bondi-coffee-index.csv';

describe('published coffee index CSV', () => {
  it('is byte-identical to the source dataset', () => {
    expect(readFileSync(PUBLISHED, 'utf8')).toBe(readFileSync(SOURCE, 'utf8'));
  });

  it('carries one row per observation, plus a header', () => {
    const lines = readFileSync(PUBLISHED, 'utf8').trim().split('\n');
    // Notes are quoted and may contain commas, but no field contains a newline, so a line
    // count is a valid row count here.
    expect(lines.length - 1).toBe(derived.totalObservations);
  });

  it('names every column the derived metrics read', () => {
    const header = readFileSync(PUBLISHED, 'utf8').split('\n')[0].split(',').map((h) => h.trim());
    for (const col of ['venue_id', 'venue_name', 'suburb', 'year', 'price_aud', 'source_url', 'confidence']) {
      expect(header, `missing column ${col}`).toContain(col);
    }
  });
});

describe('derived metrics agree with the published dataset', () => {
  it('was generated from the source dataset', () => {
    expect(derived.generatedFrom).toBe(SOURCE);
  });

  it('ranks every current-year venue with the suburb the dataset records', () => {
    // The drift that prompted these tests was an empty suburb, which renders as a blank cell
    // on the page rather than an error.
    for (const row of derived.ranked) {
      expect(row.suburb, `${row.venue_id} has no suburb`).toBeTruthy();
    }
  });
});
