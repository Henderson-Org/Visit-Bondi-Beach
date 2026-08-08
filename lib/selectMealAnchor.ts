/**
 * selectMealAnchor — the pivotal step. When food matters, we pick the best specific
 * venue(s) FIRST and reserve their meal-time blocks, then the rest of the day is built
 * around reaching them. Anchors are chosen for quality (proximity is ignored here on
 * purpose, so a better restaurant isn't dropped to save a short walk).
 */
import { BONDI_VENUES, type Venue, type Weekday } from '@/data/bondiVenues';
import { scoreVenue } from '@/lib/scoreVenue';
import { PACE_TARGET } from '@/config/scoringWeights';
import type { MealSlot, Pace, Preferences } from '@/types/preferences';

export interface MealAnchor {
  slot: MealSlot;
  timeMin: number; // minutes from midnight
  venue: Venue;
  durationMins: number;
  score: number;
  alternatives: { venue: Venue; score: number }[];
}

// Canonical clock time (minutes) for each meal slot.
const SLOT_TIME: Record<MealSlot, number> = {
  coffee: 480, // 8:00
  breakfast: 510, // 8:30
  brunch: 600, // 10:00
  lunch: 780, // 13:00
  dessert: 900, // 15:00
  drinks: 1050, // 17:30
  dinner: 1140, // 19:00
};

interface AnchorOpts {
  windowStart: number;
  windowEnd: number;
  weekday: Weekday;
  foodPriority: boolean;
  pace: Pace;
}

/** Decide which meal slots to try to fill, given the visit window and preferences. */
function plannedSlots(prefs: Preferences, o: AnchorOpts): MealSlot[] {
  const within = (t: number) => t >= o.windowStart && t <= o.windowEnd;
  const wantCoffee = prefs.interests.includes('coffee') || prefs.foodStyles.includes('coffee');
  const wantDrinks =
    prefs.interests.includes('nightlife') ||
    prefs.foodStyles.includes('cocktails') ||
    prefs.foodStyles.includes('sunset-drinks');

  // A short visit for someone who didn't ask about food shouldn't be forced into a full
  // meal — let experiences (a coffee/viewpoint) fill it instead.
  if (!o.foodPriority && !wantCoffee && o.windowEnd - o.windowStart <= 150) return [];

  const slots: MealSlot[] = [];

  // Morning meal (one of coffee / breakfast / brunch), placed at or just after arrival.
  const morningTime = Math.max(o.windowStart, SLOT_TIME.breakfast);
  if (morningTime <= 660 && within(morningTime)) {
    if (wantCoffee && !o.foodPriority) slots.push('coffee');
    else slots.push(morningTime >= SLOT_TIME.brunch ? 'brunch' : 'breakfast');
  }
  if (within(SLOT_TIME.lunch)) slots.push('lunch');
  if (within(SLOT_TIME.drinks) && (wantDrinks || o.foodPriority)) slots.push('drinks');
  if (within(SLOT_TIME.dinner) && o.foodPriority) slots.push('dinner');

  // Trim to a sensible number of food stops.
  const cap = o.foodPriority ? (o.pace === 'relaxed' ? 2 : PACE_TARGET[o.pace].max >= 6 ? 3 : 2) : 1;
  // Short 2-hour visits: at most one meal (unless food is the whole point).
  const shortCap = o.windowEnd - o.windowStart <= 150 ? 1 : cap;
  return dedupeMorning(slots).slice(0, Math.max(1, Math.min(cap, shortCap)));
}

// Never keep two "morning" slots (coffee/breakfast/brunch) at once.
function dedupeMorning(slots: MealSlot[]): MealSlot[] {
  const morning = new Set<MealSlot>(['coffee', 'breakfast', 'brunch']);
  let seenMorning = false;
  const out: MealSlot[] = [];
  for (const s of slots) {
    if (morning.has(s)) {
      if (seenMorning) continue;
      seenMorning = true;
    }
    out.push(s);
  }
  return out;
}

export function selectMealAnchor(prefs: Preferences, o: AnchorOpts): MealAnchor[] {
  const slots = plannedSlots(prefs, o);
  const used = new Set<string>();
  const anchors: MealAnchor[] = [];

  for (const slot of slots) {
    const time = clampToWindow(SLOT_TIME[slot], o);
    const timeStr = toHHMM(time);
    const ranked = BONDI_VENUES.filter((v) => !used.has(v.id))
      .map((v) => ({ venue: v, s: scoreVenue(v, prefs, { slot, weekday: o.weekday, time: timeStr, plannedZones: [], foodPriority: o.foodPriority }) }))
      .filter((r) => r.s.open)
      .sort((a, b) => b.s.total - a.s.total);

    if (ranked.length === 0) continue;
    const top = ranked[0];
    used.add(top.venue.id);
    anchors.push({
      slot,
      timeMin: time,
      venue: top.venue,
      durationMins: top.venue.typicalMealDuration,
      score: top.s.total,
      alternatives: ranked.slice(1, 4).map((r) => ({ venue: r.venue, score: r.s.total })),
    });
  }

  return anchors.sort((a, b) => a.timeMin - b.timeMin);
}

function clampToWindow(t: number, o: AnchorOpts): number {
  return Math.max(o.windowStart, Math.min(t, o.windowEnd - 30));
}

export function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
