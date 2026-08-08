import { describe, it, expect } from 'vitest';
import { generateItinerary, swapVenue } from './generateBondiItinerary';
import type { Preferences } from '@/types/preferences';

const SAT = '2026-08-08'; // Saturday
const WED = '2026-08-12'; // Wednesday

const base: Preferences = {
  date: SAT, startTime: 'morning', duration: 'full',
  interests: ['food', 'swimming', 'iconic', 'coastal-walks'],
  foodStyles: ['fine-dining', 'seafood'], budget: 4, walking: 'high', pace: 'balanced',
};

describe('restaurant-anchor-first generation', () => {
  it('anchors the day on a real venue when food is a priority', () => {
    const it2 = generateItinerary(base);
    const venues = it2.items.filter((i) => i.kind === 'venue');
    expect(venues.length).toBeGreaterThan(0);
    // A meal anchor should carry a slot and a why.
    expect(venues[0].slot).toBeTruthy();
    expect(venues[0].why.length).toBeGreaterThan(10);
  });

  it('picks a high-end iconic venue for a fine-dining + views + iconic visitor', () => {
    const it2 = generateItinerary(base);
    const ids = it2.items.map((i) => i.refId);
    // Icebergs is the strongest match for fine-dining + seafood + iconic + views.
    expect(ids).toContain('icebergs-dining');
  });

  it('keeps items in chronological order with walking legs', () => {
    const it2 = generateItinerary(base);
    for (let i = 1; i < it2.items.length; i++) {
      expect(it2.items[i].startMin).toBeGreaterThanOrEqual(it2.items[i - 1].startMin);
    }
    // every item but the last has a walk leg
    it2.items.slice(0, -1).forEach((i) => expect(typeof i.walkToNextMins).toBe('number'));
  });
});

describe('date-aware markets', () => {
  it('includes the Saturday farmers market on a Saturday when markets are wanted', () => {
    const it2 = generateItinerary({ ...base, interests: ['markets', 'food', 'coffee'], foodStyles: [], walking: 'medium' });
    expect(it2.items.map((i) => i.refId)).toContain('bondi-farmers-market');
  });

  it('never shows a market on a day it does not run', () => {
    const it2 = generateItinerary({ ...base, date: WED, interests: ['markets', 'food', 'coffee'], foodStyles: [], walking: 'medium' });
    const ids = it2.items.map((i) => i.refId);
    expect(ids).not.toContain('bondi-farmers-market');
    expect(ids).not.toContain('bondi-markets');
  });
});

describe('short visit', () => {
  it('a food-focused 2-hour visit revolves around one meal', () => {
    const it2 = generateItinerary({ ...base, duration: '2h', startTime: 'midday', pace: 'relaxed' });
    const venues = it2.items.filter((i) => i.kind === 'venue');
    expect(venues.length).toBe(1);
    expect(it2.items.length).toBeLessThanOrEqual(3);
  });
});

describe('swap', () => {
  it('swapVenue replaces a meal with a different open venue', () => {
    const it2 = generateItinerary(base);
    const idx = it2.items.findIndex((i) => i.kind === 'venue');
    const before = it2.items[idx].refId;
    const after = swapVenue(it2, idx, base);
    expect(after.items[idx].refId).not.toBe(before);
    expect(after.items[idx].kind).toBe('venue');
  });
});
