/**
 * Klook (and other) bookable affiliate activities for the Day Planner.
 *
 * IMPORTANT — no invented URLs. There were no Klook links anywhere in the repo, so every
 * `affiliateUrl` below is an empty placeholder for the site owner to paste their real
 * Klook affiliate link into. Activities with no `affiliateUrl` still appear in the planner
 * (they're real Bondi experiences) but show a "Bookable experience" label instead of a
 * live "Book on Klook" button, so nothing links to a fabricated URL.
 *
 * Commercial score never dominates: the planner is quality-first (see scoreKlook +
 * scoringWeights.KLOOK). A mediocre affiliate product must not beat Icebergs, the coastal
 * walk, Sean's or the markets.
 */
import type { Zone } from '@/lib/bondiZones';
import type { Interest } from '@/types/preferences';
import type { TimeOfDay, Family } from '@/data/bondiExperiences';

export type KlookActivityType = 'surf-lesson' | 'board-hire' | 'tour' | 'photography' | 'coastal-experience';

export interface KlookActivity {
  id: string;
  name: string;
  activityType: KlookActivityType;
  zone: Zone;
  family: Family;
  fulfillsPreferences: Interest[];
  durationMins: number;
  idealTimeOfDay: TimeOfDay[];
  /** 0–10 editorial quality of the experience itself (independent of commission). */
  editorialScore: number;
  /** 0–10 commercial value — used ONLY for a small tie-breaker bonus. */
  commercialScore: number;
  isAffiliate: true;
  affiliateProvider: 'klook';
  /** Paste the real Klook affiliate URL here. Empty = shown as a non-linked bookable. */
  affiliateUrl: string;
  bookingRecommended: boolean;
  bookingDuration: string; // human, e.g. "1.5–2 hours"
  bookingLocation: string;
  commissionCategory?: string;
  /** Editorially featured — surfaced across a large share of relevant itineraries. */
  featured?: boolean;
  shortDescription: string;
  whyGo: string;
  lastVerified: string;
}

const V = '2026-08-08';

export const KLOOK_ACTIVITIES: KlookActivity[] = [
  {
    id: 'bondi-surf-lesson',
    name: 'Bondi Beach 2-hour surf lesson',
    activityType: 'surf-lesson',
    zone: 'central-bondi',
    family: 'swim-water',
    fulfillsPreferences: ['fitness', 'iconic', 'beach', 'family', 'photography', 'swimming'],
    durationMins: 120,
    idealTimeOfDay: ['early', 'morning', 'midday'],
    editorialScore: 8.5,
    commercialScore: 8,
    isAffiliate: true,
    affiliateProvider: 'klook',
    affiliateUrl: 'https://s.klook.com/c/VweQkBrDwJ',
    bookingRecommended: true,
    bookingDuration: '2 hours',
    bookingLocation: 'Bondi Beach',
    commissionCategory: 'activities',
    featured: true,
    shortDescription: 'A beginner-friendly 2-hour small-group surf lesson on Bondi Beach with boards and wetsuits included.',
    whyGo: 'The classic active, iconic Bondi experience — learn to surf on the most famous beach in Australia.',
    lastVerified: V,
  },
  {
    id: 'bondi-board-hire',
    name: 'Bondi surfboard & wetsuit hire',
    activityType: 'board-hire',
    zone: 'central-bondi',
    family: 'swim-water',
    fulfillsPreferences: ['fitness', 'beach'],
    durationMins: 90,
    idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    editorialScore: 7,
    commercialScore: 6,
    isAffiliate: true,
    affiliateProvider: 'klook',
    affiliateUrl: '',
    bookingRecommended: false,
    bookingDuration: '1–4 hours',
    bookingLocation: 'Bondi Beach',
    commissionCategory: 'activities',
    shortDescription: 'Hire a board and wetsuit and paddle out at Bondi if you already surf.',
    whyGo: 'For confident surfers who just want to get in the water without a lesson.',
    lastVerified: V,
  },
  {
    id: 'bondi-coastal-photo-walk',
    name: 'Bondi coastal photography experience',
    activityType: 'photography',
    zone: 'tamarama',
    family: 'coastal-walk',
    fulfillsPreferences: ['photography', 'coastal-walks', 'iconic'],
    durationMins: 120,
    idealTimeOfDay: ['early', 'morning', 'afternoon'],
    editorialScore: 7,
    commercialScore: 6,
    isAffiliate: true,
    affiliateProvider: 'klook',
    affiliateUrl: '',
    bookingRecommended: true,
    bookingDuration: '2 hours',
    bookingLocation: 'Bondi to Tamarama coastal walk',
    commissionCategory: 'experiences',
    shortDescription: 'A guided photo walk along the Bondi coastline for keepsake shots and the best vantage points.',
    whyGo: 'For photography-minded visitors who want guided help capturing the coast.',
    lastVerified: V,
  },
  {
    id: 'sydney-eastern-beaches-tour',
    name: 'Sydney Eastern Beaches sightseeing tour',
    activityType: 'tour',
    zone: 'central-bondi',
    family: 'culture',
    fulfillsPreferences: ['iconic', 'photography'],
    durationMins: 180,
    idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    editorialScore: 6.5,
    commercialScore: 7,
    isAffiliate: true,
    affiliateProvider: 'klook',
    affiliateUrl: '',
    bookingRecommended: true,
    bookingDuration: 'Half day',
    bookingLocation: 'Bondi & the Eastern Beaches',
    commissionCategory: 'tours',
    shortDescription: 'A guided tour taking in Bondi and Sydney’s Eastern Beaches, good for first-time visitors.',
    whyGo: 'A convenient way to see Bondi in context if you’re short on time or new to Sydney.',
    lastVerified: V,
  },
];

export function getKlookActivity(id: string): KlookActivity | undefined {
  return KLOOK_ACTIVITIES.find((a) => a.id === id);
}

/** Only activities that are safe to surface (real Bondi experiences; URL optional). */
export function activeKlookActivities(): KlookActivity[] {
  return KLOOK_ACTIVITIES;
}
