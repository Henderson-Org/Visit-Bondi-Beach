/**
 * Restaurant-anchor-first itinerary generation.
 *
 * 1. If food matters, pick the best venue(s) and reserve their meal-time blocks
 *    (selectMealAnchor). 2. Score experiences against preferences. 3. Fill the gaps
 *    around the anchors with the strongest experiences that fit the time and flow
 *    geographically (minimising backtracking). The meal is the anchor, not an
 *    afterthought.
 */
import { BONDI_EXPERIENCES, getExperience, type Experience, type TimeOfDay } from '@/data/bondiExperiences';
import { BONDI_VENUES, getVenue, type Venue, type Weekday } from '@/data/bondiVenues';
import { scoreExperience } from '@/lib/scoreExperience';
import { scoreVenue } from '@/lib/scoreVenue';
import { selectMealAnchor, toHHMM } from '@/lib/selectMealAnchor';
import { walkMinutes, ZONE_LABEL, type Zone } from '@/lib/bondiZones';
import { PACE_TARGET } from '@/config/scoringWeights';
import { activeBundles, bundleBonus } from '@/lib/bundles';
import { foodIsPriority, type MealSlot, type Preferences, type StartTime, type Duration } from '@/types/preferences';

/* ------------------------------- time helpers ------------------------------ */

const START_MIN: Record<StartTime, number> = { sunrise: 390, morning: 510, midday: 690, afternoon: 840, evening: 1050 };
const DURATION_MIN: Record<Duration, number> = { '2h': 120, half: 300, full: 540 };
const DAY_END_CAP = 1320; // 22:00

export function windowFor(p: Preferences): { start: number; end: number } {
  const start = START_MIN[p.startTime];
  return { start, end: Math.min(start + DURATION_MIN[p.duration], DAY_END_CAP) };
}

export function weekdayOf(dateIso: string): Weekday {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() as Weekday;
}

function timeOfDay(min: number): TimeOfDay {
  if (min < 420) return 'early';
  if (min < 660) return 'morning';
  if (min < 840) return 'midday';
  if (min < 1020) return 'afternoon';
  return 'evening';
}

/* --------------------------------- types ---------------------------------- */

export interface ItineraryItem {
  key: string;
  kind: 'venue' | 'experience';
  refId: string;
  title: string;
  zone: Zone;
  startMin: number;
  durationMins: number;
  why: string;
  booking?: 'recommended' | 'essential';
  priceLevel?: number;
  websiteUrl?: string;
  slot?: MealSlot;
  walkToNextMins?: number;
  hoursVerified?: boolean;
  debug?: Record<string, unknown>;
}

export interface Itinerary {
  items: ItineraryItem[];
  weekday: Weekday;
  window: { start: number; end: number };
  foodPriority: boolean;
  notes: string[];
}

/* ------------------------------ why-it's-here ------------------------------ */

const INTEREST_WORD: Record<string, string> = {
  food: 'food', coffee: 'coffee', swimming: 'swimming', beach: 'beach time', 'coastal-walks': 'coastal walks',
  markets: 'markets', shopping: 'shopping', photography: 'views', relaxing: 'a relaxed pace', fitness: 'staying active',
  iconic: 'iconic Bondi', family: 'family-friendly spots', nightlife: 'drinks',
};

function whyVenue(v: Venue, prefs: Preferences, slot: MealSlot): string {
  const styleHits = prefs.foodStyles.filter((s) => s !== 'no-pref' && v.categories.includes(s));
  const bits: string[] = [];
  if (prefs.interests.includes('food')) bits.push('you told us food is a priority');
  if (styleHits.length) bits.push(`you're after ${styleHits.slice(0, 2).map((s) => s.replace('-', ' ')).join(' and ')}`);
  if (v.iconicScore >= 8 && prefs.interests.includes('iconic')) bits.push('you wanted iconic Bondi');
  const lead = bits.length ? bits.join(', ') : 'it’s one of Bondi’s standout spots';
  return `Because ${lead}, ${v.name} is one of the strongest ${slot} matches for your day — we’ve built the ${slot === 'dinner' || slot === 'drinks' ? 'evening' : slot === 'lunch' ? 'afternoon' : 'morning'} around it so you arrive without backtracking.`;
}

function whyExperience(e: Experience, prefs: Preferences): string {
  const hits = e.categories.filter((c) => prefs.interests.includes(c)).map((c) => INTEREST_WORD[c]).filter(Boolean);
  if (hits.length) return `You selected ${hits.slice(0, 3).join(', ')}, and ${e.name.toLowerCase()} fits naturally here in your day.`;
  return `${e.name} is one of Bondi’s essentials — worth including while you’re nearby.`;
}

/* --------------------------------- engine --------------------------------- */

function computeGaps(win: { start: number; end: number }, anchors: ItineraryItem[]): { start: number; end: number }[] {
  const sorted = [...anchors].sort((a, b) => a.startMin - b.startMin);
  const gaps: { start: number; end: number }[] = [];
  let cursor = win.start;
  for (const a of sorted) {
    if (a.startMin - cursor >= 25) gaps.push({ start: cursor, end: a.startMin });
    cursor = Math.max(cursor, a.startMin + a.durationMins);
  }
  if (win.end - cursor >= 25) gaps.push({ start: cursor, end: win.end });
  return gaps;
}

/** Detour cost of visiting `z` between two neighbouring zones (0 = on the way). */
function detour(prev: Zone | null, z: Zone, next: Zone | null): number {
  if (prev && next) return walkMinutes(prev, z) + walkMinutes(z, next) - walkMinutes(prev, next);
  if (prev) return walkMinutes(prev, z);
  if (next) return walkMinutes(z, next);
  return 0;
}

export function generateItinerary(prefs: Preferences): Itinerary {
  const window = windowFor(prefs);
  const weekday = weekdayOf(prefs.date);
  const foodPriority = foodIsPriority(prefs);
  const notes: string[] = [];

  // 1. Anchors
  const anchors = selectMealAnchor(prefs, { windowStart: window.start, windowEnd: window.end, weekday, foodPriority, pace: prefs.pace });
  const anchorItems: ItineraryItem[] = anchors.map((a) => ({
    key: `v-${a.venue.id}`,
    kind: 'venue',
    refId: a.venue.id,
    title: a.venue.name,
    zone: a.venue.zone,
    startMin: a.timeMin,
    durationMins: a.durationMins,
    why: whyVenue(a.venue, prefs, a.slot),
    booking: a.venue.bookingRequired ? 'essential' : a.venue.bookingRecommended ? 'recommended' : undefined,
    priceLevel: a.venue.priceLevel,
    websiteUrl: a.venue.websiteUrl,
    slot: a.slot,
    hoursVerified: a.venue.hoursVerified,
    debug: { total: a.score, alternatives: a.alternatives.map((x) => ({ id: x.venue.id, score: Math.round(x.score) })) },
  }));

  const plannedZones = anchorItems.map((i) => i.zone);
  const anchorExpPairs = new Set(anchors.flatMap((a) => a.venue.nearbyExperiences));
  const bundles = activeBundles(prefs);

  // 2. Fill gaps with experiences
  const target = PACE_TARGET[prefs.pace];
  const wantExtra = Math.max(target.min - anchorItems.length, Math.min(target.max - anchorItems.length, 6));
  const used = new Set<string>();
  const usedCat: Record<string, number> = {};
  const expItems: ItineraryItem[] = [];

  const gaps = computeGaps(window, anchorItems);
  const sortedAnchors = [...anchorItems].sort((a, b) => a.startMin - b.startMin);

  for (const gap of gaps) {
    let cursor = gap.start;
    const prevAnchor = [...sortedAnchors].reverse().find((a) => a.startMin + a.durationMins <= gap.start) || null;
    const nextAnchor = sortedAnchors.find((a) => a.startMin >= gap.end) || null;

    while (gap.end - cursor >= 25 && expItems.length < wantExtra) {
      const tod = timeOfDay(cursor);
      const candidates = BONDI_EXPERIENCES.filter((e) => !used.has(e.id) && e.durationMins <= gap.end - cursor + 10)
        .map((e) => {
          const sc = scoreExperience(e, prefs, { weekday, timeOfDay: tod, plannedZones, usedCategoryCounts: usedCat });
          const detourCost = detour(prevAnchor?.zone ?? (expItems.at(-1)?.zone ?? null), e.zone, nextAnchor?.zone ?? null);
          const bundle = (anchorExpPairs.has(e.id) ? 10 : 0) + bundleBonus(e.id, bundles);
          return { e, sc, adjusted: sc.total - detourCost * 1.2 + bundle };
        })
        .filter((c) => c.sc.available && c.sc.breakdown.walkingMismatchPenalty === 0)
        .sort((a, b) => b.adjusted - a.adjusted);

      if (candidates.length === 0) break;
      const pick = candidates[0];
      // Stop filling a gap if the best remaining option is a poor fit (keeps days curated).
      if (pick.adjusted < 8 && expItems.length >= target.min - anchorItems.length) break;

      used.add(pick.e.id);
      pick.e.categories.forEach((c) => (usedCat[c] = (usedCat[c] || 0) + 1));
      expItems.push({
        key: `e-${pick.e.id}`,
        kind: 'experience',
        refId: pick.e.id,
        title: pick.e.name,
        zone: pick.e.zone,
        startMin: cursor,
        durationMins: pick.e.durationMins,
        why: whyExperience(pick.e, prefs),
        debug: { total: Math.round(pick.sc.total), adjusted: Math.round(pick.adjusted), breakdown: pick.sc.breakdown },
      });
      cursor += pick.e.durationMins + 10; // rough walk buffer
    }
  }

  // 3. Merge + order by time, then compute walking legs
  const items = [...anchorItems, ...expItems].sort((a, b) => a.startMin - b.startMin);
  for (let i = 0; i < items.length - 1; i++) {
    items[i].walkToNextMins = walkMinutes(items[i].zone, items[i + 1].zone);
  }

  if (items.length === 0) notes.push('No stops matched — try widening your interests or time.');
  if (anchorItems.some((i) => i.hoursVerified === false)) notes.push('Some opening hours are indicative — confirm before you go.');

  return { items, weekday, window, foodPriority, notes };
}

/* -------------------------------- swapping -------------------------------- */

/** Replace one experience with the next-best unused one that fits its time/zone. */
export function swapExperience(it: Itinerary, index: number, prefs: Preferences): Itinerary {
  const item = it.items[index];
  if (!item || item.kind !== 'experience') return it;
  const usedIds = new Set(it.items.map((i) => i.refId));
  const tod = timeOfDay(item.startMin);
  const plannedZones = it.items.filter((_, i) => i !== index).map((i) => i.zone);
  const usedCat: Record<string, number> = {};

  const ranked = BONDI_EXPERIENCES.filter((e) => !usedIds.has(e.id) && e.durationMins <= item.durationMins + 30)
    .map((e) => ({ e, sc: scoreExperience(e, prefs, { weekday: it.weekday, timeOfDay: tod, plannedZones, usedCategoryCounts: usedCat }) }))
    .filter((c) => c.sc.available && c.sc.breakdown.walkingMismatchPenalty === 0)
    .sort((a, b) => b.sc.total - a.sc.total);
  if (!ranked.length) return it;

  const e = ranked[0].e;
  const items = it.items.slice();
  items[index] = { ...item, key: `e-${e.id}`, refId: e.id, title: e.name, zone: e.zone, durationMins: e.durationMins, why: whyExperience(e, prefs), debug: { total: Math.round(ranked[0].sc.total) } };
  recomputeWalks(items);
  return { ...it, items };
}

/** Replace one meal venue with the next-best open, on-budget, meal-appropriate one. */
export function swapVenue(it: Itinerary, index: number, prefs: Preferences): Itinerary {
  const item = it.items[index];
  if (!item || item.kind !== 'venue' || !item.slot) return it;
  const usedIds = new Set(it.items.map((i) => i.refId));
  const timeStr = toHHMM(item.startMin);
  const plannedZones = it.items.filter((_, i) => i !== index).map((i) => i.zone);

  const ranked = BONDI_VENUES.filter((v) => !usedIds.has(v.id))
    .map((v) => ({ v, s: scoreVenue(v, prefs, { slot: item.slot!, weekday: it.weekday, time: timeStr, plannedZones, foodPriority: it.foodPriority }) }))
    .filter((r) => r.s.open && r.v.priceLevel <= prefs.budget)
    .sort((a, b) => b.s.total - a.s.total);
  if (!ranked.length) return it;

  const v = ranked[0].v;
  const items = it.items.slice();
  items[index] = {
    ...item, key: `v-${v.id}`, refId: v.id, title: v.name, zone: v.zone, durationMins: v.typicalMealDuration,
    why: whyVenue(v, prefs, item.slot), booking: v.bookingRequired ? 'essential' : v.bookingRecommended ? 'recommended' : undefined,
    priceLevel: v.priceLevel, websiteUrl: v.websiteUrl, hoursVerified: v.hoursVerified, debug: { total: Math.round(ranked[0].s.total) },
  };
  recomputeWalks(items);
  return { ...it, items };
}

function recomputeWalks(items: ItineraryItem[]) {
  for (let i = 0; i < items.length; i++) {
    items[i].walkToNextMins = i < items.length - 1 ? walkMinutes(items[i].zone, items[i + 1].zone) : undefined;
  }
}

export { ZONE_LABEL, getVenue, getExperience };
