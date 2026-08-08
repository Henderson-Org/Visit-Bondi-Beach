import { describe, it, expect } from 'vitest';
import { generateItinerary, swapVenue } from './generateBondiItinerary';
import { familyOf } from '@/data/bondiExperiences';
import type { Preferences } from '@/types/preferences';

const SAT = '2026-08-08'; // Saturday
const WED = '2026-08-12'; // Wednesday

const P = (o: Partial<Preferences>): Preferences => ({
  date: SAT, startTime: 'morning', duration: 'full', interests: ['food'], foodStyles: [], budget: 3, walking: 'medium', pace: 'balanced', ...o,
});

function waterBeachCount(items: { refId: string; family?: string }[]) {
  return items.filter((i) => i.family === 'swim-water' || i.family === 'beach').length;
}
function hasUnexplainedGap(warnings: string[]) {
  return warnings.some((w) => w.startsWith('Unexplained'));
}

describe('Test A — 2h swim/beach/views must not stack three water/beach stops', () => {
  const it2 = generateItinerary(P({ interests: ['swimming', 'beach', 'photography'], duration: '2h', startTime: 'midday', pace: 'balanced' }));
  it('does not return three consecutive water/beach experiences', () => {
    expect(waterBeachCount(it2.items)).toBeLessThanOrEqual(2);
  });
  it('surfaces the Icebergs pool (signature) rather than duplicate swims', () => {
    expect(it2.items.map((i) => i.refId)).toContain('icebergs-pool');
  });
  it('does not force a lunch on a short non-food visit', () => {
    expect(it2.items.filter((i) => i.kind === 'venue').length).toBe(0);
  });
});

describe('Test B — food + relaxed + full day: restaurant anchor, no unexplained gaps', () => {
  const it2 = generateItinerary(P({ interests: ['food', 'relaxing', 'beach'], foodStyles: ['modern-au'], budget: 4, duration: 'full', pace: 'relaxed' }));
  it('has a restaurant anchor', () => {
    expect(it2.items.some((i) => i.kind === 'venue')).toBe(true);
  });
  it('leaves no unexplained multi-hour gaps', () => {
    expect(hasUnexplainedGap(it2.warnings)).toBe(false);
  });
  it('has a continuous timeline (each stop starts at/after the previous ends)', () => {
    for (let i = 1; i < it2.items.length; i++) {
      const prev = it2.items[i - 1];
      expect(it2.items[i].startMin).toBeGreaterThanOrEqual(prev.startMin + prev.durationMins - 5);
    }
  });
});

describe('Test C — surfing/active/iconic half day can include a Klook activity', () => {
  const it2 = generateItinerary(P({ interests: ['fitness', 'iconic', 'beach'], foodStyles: [], duration: 'half', startTime: 'morning', pace: 'balanced' }));
  it('includes a bookable Klook activity for an active/iconic visitor', () => {
    expect(it2.items.some((i) => i.isAffiliate)).toBe(true);
  });
  it('never exceeds the affiliate cap (1 for a half day)', () => {
    expect(it2.items.filter((i) => i.isAffiliate).length).toBeLessThanOrEqual(1);
  });
});

describe('Test D — markets + food + low walking: market yes, no forced coastal walk', () => {
  const it2 = generateItinerary(P({ interests: ['markets', 'food', 'coffee'], foodStyles: [], walking: 'low', duration: 'half', startTime: 'morning' }));
  it('includes the Saturday farmers market', () => {
    expect(it2.items.map((i) => i.refId)).toContain('bondi-farmers-market');
  });
  it('does not force the coastal walk on a low-walking visitor', () => {
    expect(it2.items.some((i) => familyOf(i.refId) === 'coastal-walk')).toBe(false);
  });
});

describe('Test E — coastal walk + swimming + high walking + full day', () => {
  const it2 = generateItinerary(P({ interests: ['coastal-walks', 'swimming', 'photography'], foodStyles: [], walking: 'high', duration: 'full', pace: 'balanced' }));
  it('includes a coastal walk', () => {
    expect(it2.items.some((i) => i.family === 'coastal-walk')).toBe(true);
  });
  it('does not over-stack swims', () => {
    expect(it2.items.filter((i) => i.family === 'swim-water').length).toBeLessThanOrEqual(2);
  });
});

describe('regression — anchors, ordering, markets date-awareness, swap', () => {
  it('food fine-dining picks Icebergs and keeps chronological order', () => {
    const it2 = generateItinerary(P({ interests: ['food', 'iconic'], foodStyles: ['fine-dining', 'seafood'], budget: 4 }));
    expect(it2.items.map((i) => i.refId)).toContain('icebergs-dining');
    for (let i = 1; i < it2.items.length; i++) expect(it2.items[i].startMin).toBeGreaterThanOrEqual(it2.items[i - 1].startMin);
  });
  it('never shows a market on a day it does not run', () => {
    const it2 = generateItinerary(P({ date: WED, interests: ['markets', 'food'], walking: 'medium' }));
    const ids = it2.items.map((i) => i.refId);
    expect(ids).not.toContain('bondi-farmers-market');
    expect(ids).not.toContain('bondi-markets');
  });
  it('swapVenue replaces a meal with a different open venue', () => {
    const it2 = generateItinerary(P({ interests: ['food'], foodStyles: ['seafood'], budget: 4 }));
    const idx = it2.items.findIndex((i) => i.kind === 'venue');
    expect(idx).toBeGreaterThanOrEqual(0);
    const before = it2.items[idx].refId;
    const after = swapVenue(it2, idx, P({ interests: ['food'], foodStyles: ['seafood'], budget: 4 }));
    expect(after.items[idx].refId).not.toBe(before);
  });
});

import { getProperty } from '@/data/accommodation';
import { bookingLinkFor } from '@/lib/stay';

describe('Klook links (owner-supplied)', () => {
  const common = [
    P({ interests: ['iconic', 'beach', 'swimming'] }),
    P({ interests: ['beach', 'photography', 'family'] }),
    P({ interests: ['iconic', 'coastal-walks', 'photography'] }),
    P({ interests: ['fitness', 'iconic'], duration: 'half' }),
  ];
  it('featured Bondi surf lesson is suggested across a large share of relevant itineraries', () => {
    const hits = common.filter((s) => generateItinerary(s).items.some((i) => i.refId === 'bondi-surf-lesson')).length;
    expect(hits).toBeGreaterThanOrEqual(3);
  });
  it('surf lesson carries the real Klook affiliate URL', () => {
    const it2 = generateItinerary(P({ interests: ['iconic', 'beach', 'fitness'] }));
    const surf = it2.items.find((i) => i.refId === 'bondi-surf-lesson');
    expect(surf?.affiliateUrl).toBe('https://s.klook.com/c/VweQkBrDwJ');
  });
  it('does NOT appear on an unrelated food/relaxing day', () => {
    const it2 = generateItinerary(P({ interests: ['food', 'relaxing'], foodStyles: ['modern-au'] }));
    expect(it2.items.some((i) => i.refId === 'bondi-surf-lesson')).toBe(false);
  });
  it("Wake Up! Bondi Beach 'Check availability' uses the Klook booking link (not Travelpayouts-wrapped)", () => {
    const p = getProperty('wake-up-bondi-beach')!;
    const link = bookingLinkFor(p, 'stay-card');
    expect(link.href).toBe('https://s.klook.com/c/2XALb2zD3l');
    expect(link.label).toBe('Klook');
  });
});
