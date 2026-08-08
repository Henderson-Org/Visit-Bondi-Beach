/**
 * Restaurant-anchor-first itinerary generation with preference-fulfilment, redundancy
 * control, Klook affiliate activities and gap-free scheduling.
 *
 * Flow: 1) meal anchors (selectMealAnchor) → 2) score candidates (experiences + Klook) →
 * 3) pack gaps by marginal preference value (favour stops that cover NEW interests),
 * penalising same-family adjacency and already-fulfilled preferences → 4) fill any residual
 * gap before an anchor with a labelled downtime block so there are no unexplained gaps →
 * 5) validate.
 */
import { BONDI_EXPERIENCES, getExperience, familyOf, type Experience, type TimeOfDay, type Family } from '@/data/bondiExperiences';
import { BONDI_VENUES, getVenue, type Venue, type Weekday } from '@/data/bondiVenues';
import { KLOOK_ACTIVITIES, type KlookActivity } from '@/data/klookActivities';
import { scoreExperience } from '@/lib/scoreExperience';
import { scoreVenue } from '@/lib/scoreVenue';
import { scoreKlook } from '@/lib/scoreKlook';
import { selectMealAnchor, toHHMM } from '@/lib/selectMealAnchor';
import { walkMinutes, ZONE_LABEL, type Zone } from '@/lib/bondiZones';
import { PACE_TARGET, REDUNDANCY, MAX_UNEXPLAINED_GAP, MAX_AFFILIATE_ACTIVITIES, TIER_BOOST, tierOf } from '@/config/scoringWeights';
import { activeBundles, bundleBonus } from '@/lib/bundles';
import { foodIsPriority, type Interest, type MealSlot, type Preferences, type StartTime, type Duration } from '@/types/preferences';

/* ------------------------------- time helpers ------------------------------ */

const START_MIN: Record<StartTime, number> = { sunrise: 390, morning: 510, midday: 690, afternoon: 840, evening: 1050 };
const DURATION_MIN: Record<Duration, number> = { '2h': 120, half: 300, full: 540 };
const DAY_END_CAP = 1320;

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
  kind: 'venue' | 'experience' | 'klook' | 'downtime';
  refId: string;
  title: string;
  zone: Zone;
  family?: Family;
  startMin: number;
  durationMins: number;
  why: string;
  booking?: 'recommended' | 'essential';
  priceLevel?: number;
  websiteUrl?: string;
  slot?: MealSlot;
  isAffiliate?: boolean;
  affiliateUrl?: string;
  affiliateProvider?: string;
  bookingDuration?: string;
  activityType?: string;
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
  warnings: string[];
  hasAffiliate: boolean;
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
  return `Because ${lead}, ${v.name} is one of the strongest ${slot} matches for your day — we’ve built the ${slot === 'dinner' || slot === 'drinks' ? 'evening' : slot === 'lunch' ? 'afternoon' : 'morning'} around it.`;
}
function whyExperience(e: Experience, newlyFulfilled: Interest[]): string {
  const hits = newlyFulfilled.map((c) => INTEREST_WORD[c]).filter(Boolean);
  if (hits.length) return `You wanted ${hits.slice(0, 3).join(', ')}, and ${e.name.toLowerCase()} covers that here — it slots in without doubling up on what you've already done.`;
  return `${e.name} is one of Bondi’s essentials — worth including while you’re nearby.`;
}
function whyKlook(a: KlookActivity, prefs: Preferences): string {
  const hits = a.fulfillsPreferences.filter((p) => prefs.interests.includes(p)).map((c) => INTEREST_WORD[c]).filter(Boolean);
  const lead = hits.length ? `You selected ${hits.slice(0, 2).join(' and ')}` : 'It’s a strong, hands-on Bondi experience';
  return `${lead}, and this is a bookable experience that fits naturally into your day. ${a.whyGo}`;
}

/* --------------------------------- helpers -------------------------------- */

function computeGaps(win: { start: number; end: number }, anchors: ItineraryItem[]): { start: number; end: number; endsAtAnchor: boolean }[] {
  const sorted = [...anchors].sort((a, b) => a.startMin - b.startMin);
  const gaps: { start: number; end: number; endsAtAnchor: boolean }[] = [];
  let cursor = win.start;
  for (const a of sorted) {
    if (a.startMin - cursor >= 20) gaps.push({ start: cursor, end: a.startMin, endsAtAnchor: true });
    cursor = Math.max(cursor, a.startMin + a.durationMins);
  }
  if (win.end - cursor >= 20) gaps.push({ start: cursor, end: win.end, endsAtAnchor: false });
  return gaps;
}
function detour(prev: Zone | null, z: Zone, next: Zone | null): number {
  if (prev && next) return walkMinutes(prev, z) + walkMinutes(z, next) - walkMinutes(prev, next);
  if (prev) return walkMinutes(prev, z);
  if (next) return walkMinutes(z, next);
  return 0;
}

/* --------------------------------- engine --------------------------------- */

export function generateItinerary(prefs: Preferences): Itinerary {
  const window = windowFor(prefs);
  const weekday = weekdayOf(prefs.date);
  const foodPriority = foodIsPriority(prefs);
  const notes: string[] = [];
  const warnings: string[] = [];

  // Preference-fulfilment tracking: interest -> how many stops already satisfy it.
  const fulfil = new Map<Interest, number>();
  const bump = (ints: Interest[]) => ints.forEach((i) => { if (prefs.interests.includes(i)) fulfil.set(i, (fulfil.get(i) || 0) + 1); });
  const marginalValue = (ints: Interest[]) =>
    ints.filter((i) => prefs.interests.includes(i) && (fulfil.get(i) || 0) < REDUNDANCY.fulfilmentThreshold).length;
  const allFulfilled = (ints: Interest[]) => {
    const matched = ints.filter((i) => prefs.interests.includes(i));
    return matched.length > 0 && matched.every((i) => (fulfil.get(i) || 0) >= REDUNDANCY.fulfilmentThreshold);
  };

  // 1. Meal anchors
  const anchors = selectMealAnchor(prefs, { windowStart: window.start, windowEnd: window.end, weekday, foodPriority, pace: prefs.pace });
  const anchorItems: ItineraryItem[] = anchors.map((a) => {
    bump(a.venue.suitableFor);
    return {
      key: `v-${a.venue.id}`, kind: 'venue', refId: a.venue.id, title: a.venue.name, zone: a.venue.zone,
      family: 'culture', startMin: a.timeMin, durationMins: a.durationMins, why: whyVenue(a.venue, prefs, a.slot),
      booking: a.venue.bookingRequired ? 'essential' : a.venue.bookingRecommended ? 'recommended' : undefined,
      priceLevel: a.venue.priceLevel, websiteUrl: a.venue.websiteUrl, slot: a.slot, hoursVerified: a.venue.hoursVerified,
      debug: { total: Math.round(a.score), alternatives: a.alternatives.map((x) => ({ id: x.venue.id, score: Math.round(x.score) })) },
    };
  });

  const plannedZones = anchorItems.map((i) => i.zone);
  const anchorExpPairs = new Set(anchors.flatMap((a) => a.venue.nearbyExperiences));
  const bundles = activeBundles(prefs);
  const maxAffiliate = MAX_AFFILIATE_ACTIVITIES[prefs.duration];

  // 2. Fill gaps
  const target = PACE_TARGET[prefs.pace];
  const used = new Set<string>(anchorItems.map((i) => i.refId));
  const familySeq: Family[] = [];
  let affiliateCount = 0;
  const expItems: ItineraryItem[] = [];
  const totalStops = () => anchorItems.length + expItems.length;

  const gaps = computeGaps(window, anchorItems);
  const sortedAnchors = [...anchorItems].sort((a, b) => a.startMin - b.startMin);

  for (const gap of gaps) {
    let cursor = gap.start;
    const prevAnchor = [...sortedAnchors].reverse().find((a) => a.startMin + a.durationMins <= gap.start) || null;
    const nextAnchor = sortedAnchors.find((a) => a.startMin >= gap.end) || null;
    const prevZoneOf = () => expItems.at(-1)?.zone ?? prevAnchor?.zone ?? null;

    // Redundancy-aware adjustment: marginal preference value up; same-family adjacency,
    // already-fulfilled preferences and detours down; tier boost; bundle bonus.
    const adjust = (base: number, id: string, zone: Zone, fam: Family, fulfils: Interest[], mustDo: number, isAffiliate: boolean): number => {
      let v = base;
      v += marginalValue(fulfils) * REDUNDANCY.marginalPreferenceValue;
      if (allFulfilled(fulfils)) v -= REDUNDANCY.alreadyFulfilled;
      const recent = familySeq.slice(-REDUNDANCY.adjacentWindow);
      if (recent.includes(fam)) v -= mustDo >= REDUNDANCY.distinctMustDo ? REDUNDANCY.sameFamilyAdjacent * 0.4 : REDUNDANCY.sameFamilyAdjacent;
      v += TIER_BOOST[tierOf(id)];
      v -= detour(prevZoneOf(), zone, nextAnchor?.zone ?? null) * 1.2;
      if (!isAffiliate) v += (anchorExpPairs.has(id) ? 10 : 0) + bundleBonus(id, bundles);
      return v;
    };

    while (gap.end - cursor >= 25 && totalStops() < target.max) {
      const tod = timeOfDay(cursor);
      const remaining = gap.end - cursor;

      type Cand = { kind: 'experience' | 'klook'; id: string; zone: Zone; family: Family; dur: number; fulfils: Interest[]; adjusted: number; base: number; mustDo: number; isAffiliate: boolean; breakdown: Record<string, number> };
      const cands: Cand[] = [];

      // Experiences
      for (const e of BONDI_EXPERIENCES) {
        if (used.has(e.id) || e.durationMins > remaining + 10) continue;
        const sc = scoreExperience(e, prefs, { weekday, timeOfDay: tod, plannedZones, usedCategoryCounts: {} });
        if (!sc.available || sc.breakdown.walkingMismatchPenalty !== 0) continue;
        const fam = familyOf(e.id);
        const adjusted = adjust(sc.total, e.id, e.zone, fam, e.categories, e.mustDoScore, false);
        cands.push({ kind: 'experience', id: e.id, zone: e.zone, family: fam, dur: e.durationMins, fulfils: e.categories, adjusted, base: sc.total, mustDo: e.mustDoScore, isAffiliate: false, breakdown: sc.breakdown });
      }
      // Klook (respecting the affiliate cap)
      if (affiliateCount < maxAffiliate) {
        for (const a of KLOOK_ACTIVITIES) {
          if (used.has(a.id) || a.durationMins > remaining + 10) continue;
          const sc = scoreKlook(a, prefs, { timeOfDay: tod, plannedZones });
          const adjusted = adjust(sc.total, a.id, a.zone, a.family, a.fulfillsPreferences, 5, true);
          cands.push({ kind: 'klook', id: a.id, zone: a.zone, family: a.family, dur: a.durationMins, fulfils: a.fulfillsPreferences, adjusted, base: sc.total, mustDo: 5, isAffiliate: true, breakdown: sc.breakdown });
        }
      }

      if (cands.length === 0) break;
      cands.sort((x, y) => y.adjusted - x.adjusted);
      const pick = cands[0];
      // Keep days curated: stop packing once we've met the minimum and the best left is weak.
      if (pick.adjusted < 8 && totalStops() >= target.min) break;

      const newly = pick.fulfils.filter((i) => prefs.interests.includes(i) && (fulfil.get(i) || 0) < REDUNDANCY.fulfilmentThreshold);
      used.add(pick.id);
      familySeq.push(pick.family);
      bump(pick.fulfils);
      if (pick.isAffiliate) affiliateCount++;

      if (pick.kind === 'experience') {
        const e = getExperience(pick.id)!;
        expItems.push({
          key: `e-${e.id}`, kind: 'experience', refId: e.id, title: e.name, zone: e.zone, family: pick.family,
          startMin: cursor, durationMins: e.durationMins, why: whyExperience(e, newly),
          debug: { total: Math.round(pick.base), adjusted: Math.round(pick.adjusted), marginal: newly.length, family: pick.family, breakdown: pick.breakdown },
        });
        cursor += e.durationMins + 10;
      } else {
        const a = KLOOK_ACTIVITIES.find((k) => k.id === pick.id)!;
        expItems.push({
          key: `k-${a.id}`, kind: 'klook', refId: a.id, title: a.name, zone: a.zone, family: pick.family,
          startMin: cursor, durationMins: a.durationMins, why: whyKlook(a, prefs),
          isAffiliate: true, affiliateUrl: a.affiliateUrl || undefined, affiliateProvider: a.affiliateProvider,
          bookingDuration: a.bookingDuration, activityType: a.activityType, booking: a.bookingRecommended ? 'recommended' : undefined,
          debug: { total: Math.round(pick.base), adjusted: Math.round(pick.adjusted), marginal: newly.length, affiliate: true, breakdown: pick.breakdown },
        });
        cursor += a.durationMins + 10;
      }
    }

    // Fill a residual gap that ends at an anchor with a labelled downtime block (no unexplained gaps).
    const residual = gap.end - cursor;
    if (gap.endsAtAnchor && residual >= MAX_UNEXPLAINED_GAP) {
      const zone: Zone = prevZoneOf() ?? nextAnchor?.zone ?? 'central-bondi';
      expItems.push({
        key: `d-${cursor}`, kind: 'downtime', refId: 'downtime', title: 'Free time on the beach', zone,
        family: 'downtime', startMin: cursor, durationMins: residual,
        why: 'Some deliberate downtime — relax on the sand, grab an ice cream or people-watch on the promenade before the next stop.',
        debug: { downtime: true },
      });
    }
  }

  // 3. Merge + order + walking legs
  const items = [...anchorItems, ...expItems].sort((a, b) => a.startMin - b.startMin);
  for (let i = 0; i < items.length - 1; i++) items[i].walkToNextMins = walkMinutes(items[i].zone, items[i + 1].zone);

  // 4. Validation
  validate(items, prefs, warnings);
  if (items.length === 0) notes.push('No stops matched — try widening your interests or time.');
  if (anchorItems.some((i) => i.hoursVerified === false)) notes.push('Some opening hours are indicative — confirm before you go.');

  return { items, weekday, window, foodPriority, notes, warnings, hasAffiliate: items.some((i) => i.isAffiliate) };
}

/* ------------------------------- validation ------------------------------- */

function validate(items: ItineraryItem[], prefs: Preferences, warnings: string[]) {
  const fams: Record<string, number> = {};
  let affiliates = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.family) fams[it.family] = (fams[it.family] || 0) + 1;
    if (it.isAffiliate) affiliates++;
    if (i > 0) {
      const prev = items[i - 1];
      const gap = it.startMin - (prev.startMin + prev.durationMins);
      if (gap > MAX_UNEXPLAINED_GAP && it.kind !== 'downtime' && prev.kind !== 'downtime') {
        warnings.push(`Unexplained ${gap}-min gap before ${it.title}.`);
      }
      if (it.startMin < prev.startMin + prev.durationMins - 5) warnings.push(`${it.title} overlaps the previous stop.`);
    }
  }
  if ((fams['swim-water'] || 0) > 2) warnings.push('More than two water stops — consider trimming.');
  if ((fams['coastal-walk'] || 0) > 1) warnings.push('More than one coastal walk.');
  const meals = items.filter((i) => i.kind === 'venue').length;
  if (prefs.duration !== 'full' && meals > 2) warnings.push('Too many meals for the time available.');
  if (affiliates > MAX_AFFILIATE_ACTIVITIES[prefs.duration]) warnings.push('Too many affiliate activities.');
}

/* -------------------------------- swapping -------------------------------- */

export function swapExperience(it: Itinerary, index: number, prefs: Preferences): Itinerary {
  const item = it.items[index];
  if (!item || (item.kind !== 'experience' && item.kind !== 'downtime')) return it;
  const usedIds = new Set(it.items.map((i) => i.refId));
  const tod = timeOfDay(item.startMin);
  const plannedZones = it.items.filter((_, i) => i !== index).map((i) => i.zone);
  const ranked = BONDI_EXPERIENCES.filter((e) => !usedIds.has(e.id) && e.durationMins <= item.durationMins + 40)
    .map((e) => ({ e, sc: scoreExperience(e, prefs, { weekday: it.weekday, timeOfDay: tod, plannedZones, usedCategoryCounts: {} }) }))
    .filter((c) => c.sc.available && c.sc.breakdown.walkingMismatchPenalty === 0)
    .sort((a, b) => b.sc.total - a.sc.total);
  if (!ranked.length) return it;
  const e = ranked[0].e;
  const items = it.items.slice();
  items[index] = { ...item, key: `e-${e.id}`, kind: 'experience', refId: e.id, title: e.name, zone: e.zone, family: familyOf(e.id), why: whyExperience(e, e.categories.filter((c) => prefs.interests.includes(c))), debug: { total: Math.round(ranked[0].sc.total) } };
  recomputeWalks(items);
  return { ...it, items };
}

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
  items[index] = { ...item, key: `v-${v.id}`, refId: v.id, title: v.name, zone: v.zone, why: whyVenue(v, prefs, item.slot),
    booking: v.bookingRequired ? 'essential' : v.bookingRecommended ? 'recommended' : undefined, priceLevel: v.priceLevel, websiteUrl: v.websiteUrl, hoursVerified: v.hoursVerified, debug: { total: Math.round(ranked[0].s.total) } };
  recomputeWalks(items);
  return { ...it, items };
}

function recomputeWalks(items: ItineraryItem[]) {
  for (let i = 0; i < items.length; i++) items[i].walkToNextMins = i < items.length - 1 ? walkMinutes(items[i].zone, items[i + 1].zone) : undefined;
}

export { ZONE_LABEL, getVenue, getExperience };
