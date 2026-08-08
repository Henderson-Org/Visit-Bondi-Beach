/**
 * Core Bondi experiences for the Day Planner. Zones drive sequencing; `mustDoScore`
 * lets the algorithm be opinionated about the essentials (the beach, the Icebergs pool,
 * the coastal walk). Market experiences carry `operatingWeekdays` so they're never
 * recommended on a day they don't run.
 */
import type { Zone } from '@/lib/bondiZones';
import type { Interest } from '@/types/preferences';
import type { Weekday } from '@/data/bondiVenues';

export type TimeOfDay = 'early' | 'morning' | 'midday' | 'afternoon' | 'evening';

export interface Experience {
  id: string;
  name: string;
  zone: Zone;
  categories: Interest[];
  durationMins: number;
  /** 0–10 — how essential this is when it matches the visitor (drives the must-do boost). */
  mustDoScore: number;
  idealTimeOfDay: TimeOfDay[];
  /** How much walking the experience itself involves. */
  walkingLevel: 'low' | 'medium' | 'high';
  viewScore: number;
  /** Undefined = available every day. Set for markets and day-specific things. */
  operatingWeekdays?: Weekday[];
  /** Venue ids this experience naturally bundles with. */
  pairsWithVenues?: string[];
  description: string;
  whyGo: string;
}

export const BONDI_EXPERIENCES: Experience[] = [
  {
    id: 'bondi-beach', name: 'Bondi Beach', zone: 'central-bondi',
    categories: ['beach', 'swimming', 'relaxing', 'iconic', 'family', 'photography'],
    durationMins: 60, mustDoScore: 9, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 9,
    description: 'The main event — time on the famous sand between the flags.',
    whyGo: 'You can’t do Bondi without the beach itself.',
  },
  {
    id: 'beach-swim', name: 'Bondi Beach swim', zone: 'central-bondi',
    categories: ['swimming', 'beach', 'fitness', 'iconic'],
    durationMins: 45, mustDoScore: 8, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 7,
    description: 'A dip between the flags on Bondi Beach.',
    whyGo: 'The classic Bondi swim — always patrolled, always worth it.',
  },
  {
    id: 'icebergs-pool', name: 'Bondi Icebergs Ocean Pool', zone: 'south-bondi',
    categories: ['swimming', 'iconic', 'photography', 'fitness', 'beach'],
    durationMins: 45, mustDoScore: 10, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 10, pairsWithVenues: ['icebergs-dining'],
    description: 'The world-famous ocean pool cut into the rocks at the south end.',
    whyGo: 'One of Bondi’s essential experiences — swim it or just take it in.',
  },
  {
    id: 'bondi-bronte-walk', name: 'Bondi to Bronte Coastal Walk', zone: 'tamarama',
    categories: ['coastal-walks', 'photography', 'fitness', 'iconic', 'beach'],
    durationMins: 90, mustDoScore: 9, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'high', viewScore: 10,
    description: 'The clifftop path south past Tamarama to Bronte.',
    whyGo: 'The signature Bondi walk, with the best coastal views in Sydney.',
  },
  {
    id: 'bondi-tamarama-walk', name: 'Bondi to Tamarama walk', zone: 'tamarama',
    categories: ['coastal-walks', 'photography', 'iconic', 'beach'],
    durationMins: 40, mustDoScore: 7, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'medium', viewScore: 9,
    description: 'The shorter clifftop stretch to Tamarama and back.',
    whyGo: 'The coastal-walk highlights when you’re short on time.',
  },
  {
    id: 'tamarama-beach', name: 'Tamarama Beach', zone: 'tamarama',
    categories: ['beach', 'swimming', 'relaxing', 'photography'],
    durationMins: 40, mustDoScore: 5, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 8,
    description: 'The small, pretty cove one beach south of Bondi.',
    whyGo: 'A quieter dip and a scenic pause on the walk.',
  },
  {
    id: 'bronte-beach', name: 'Bronte Beach', zone: 'bronte',
    categories: ['beach', 'swimming', 'relaxing', 'family'],
    durationMins: 45, mustDoScore: 6, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 8,
    description: 'A relaxed family beach with its own ocean baths.',
    whyGo: 'The reward at the end of the coastal walk — and a great coffee stop.',
  },
  {
    id: 'north-bondi-beach', name: 'North Bondi Beach', zone: 'north-bondi',
    categories: ['beach', 'swimming', 'relaxing', 'family'],
    durationMins: 45, mustDoScore: 6, idealTimeOfDay: ['morning', 'midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 7,
    description: 'The calmer northern end of the beach, near the kids’ pool.',
    whyGo: 'The most relaxed, sheltered stretch of sand — good for families.',
  },
  {
    id: 'ben-buckler', name: 'Ben Buckler / North Bondi viewpoint', zone: 'north-bondi',
    categories: ['photography', 'coastal-walks', 'relaxing', 'iconic'],
    durationMins: 30, mustDoScore: 5, idealTimeOfDay: ['early', 'morning', 'afternoon'],
    walkingLevel: 'medium', viewScore: 9,
    description: 'The headland at the north end with sweeping views back over the beach.',
    whyGo: 'The best wide view of Bondi, and a quieter corner.',
  },
  {
    id: 'bondi-pavilion', name: 'Bondi Pavilion', zone: 'central-bondi',
    categories: ['iconic', 'family', 'relaxing'],
    durationMins: 30, mustDoScore: 5, idealTimeOfDay: ['midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 6,
    description: 'The restored beachfront pavilion with community and cultural spaces.',
    whyGo: 'A bit of Bondi heritage right on the promenade.',
  },
  {
    id: 'bondi-markets', name: 'Bondi Markets (Sunday)', zone: 'gould-hall',
    categories: ['markets', 'shopping', 'food', 'coffee'],
    durationMins: 60, mustDoScore: 7, idealTimeOfDay: ['morning', 'midday'],
    walkingLevel: 'low', viewScore: 3, operatingWeekdays: [0],
    description: 'The famous Sunday market for fashion, vintage and design at Bondi Beach Public School.',
    whyGo: 'A Bondi Sunday institution — go early for the best of it.',
  },
  {
    id: 'bondi-farmers-market', name: 'Bondi Farmers Market (Saturday)', zone: 'gould-hall',
    categories: ['markets', 'food', 'coffee', 'shopping'],
    durationMins: 45, mustDoScore: 7, idealTimeOfDay: ['early', 'morning', 'midday'],
    walkingLevel: 'low', viewScore: 3, operatingWeekdays: [6],
    description: 'Saturday-morning produce, coffee and hot food behind the beach.',
    whyGo: 'A relaxed local start to a Saturday, a short walk from the sand.',
  },
  {
    id: 'gould-street', name: 'Gould Street shopping', zone: 'gould-hall',
    categories: ['shopping', 'relaxing'],
    durationMins: 45, mustDoScore: 4, idealTimeOfDay: ['midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 3,
    description: 'The strip of surf, vintage and lifestyle stores behind the beach.',
    whyGo: 'Where to browse Bondi’s shops between beach and food.',
  },
  {
    id: 'bondi-promenade', name: 'Bondi promenade stroll', zone: 'central-bondi',
    categories: ['relaxing', 'photography', 'iconic', 'family'],
    durationMins: 30, mustDoScore: 5, idealTimeOfDay: ['morning', 'midday', 'afternoon', 'evening'],
    walkingLevel: 'low', viewScore: 8,
    description: 'The beachfront promenade past the pool, skate park and street art.',
    whyGo: 'An easy walk that ties the beachfront together.',
  },
  {
    id: 'bondi-sunrise', name: 'Sunrise at Bondi', zone: 'north-bondi',
    categories: ['photography', 'relaxing', 'iconic', 'fitness'],
    durationMins: 40, mustDoScore: 7, idealTimeOfDay: ['early'],
    walkingLevel: 'low', viewScore: 10,
    description: 'Bondi faces east, so sunrise over the water is the local’s secret.',
    whyGo: 'The quietest, most beautiful hour on the beach.',
  },
  {
    id: 'bondi-sunset', name: 'Sunset at Bondi', zone: 'south-bondi',
    categories: ['photography', 'relaxing', 'nightlife', 'iconic'],
    durationMins: 40, mustDoScore: 6, idealTimeOfDay: ['evening'],
    walkingLevel: 'low', viewScore: 9,
    description: 'Golden hour over the headlands, best from the south end near Icebergs.',
    whyGo: 'The natural lead-in to sunset drinks or dinner.',
  },
  {
    id: 'beach-downtime', name: 'Beach downtime', zone: 'central-bondi',
    categories: ['relaxing', 'beach'],
    durationMins: 60, mustDoScore: 4, idealTimeOfDay: ['midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 7,
    description: 'Simply lying on the sand with a towel and a book.',
    whyGo: 'Sometimes the best Bondi plan is no plan at all.',
  },
  {
    id: 'skate-park', name: 'Bondi skate park & street art', zone: 'central-bondi',
    categories: ['photography', 'relaxing', 'family'],
    durationMins: 20, mustDoScore: 4, idealTimeOfDay: ['midday', 'afternoon'],
    walkingLevel: 'low', viewScore: 6,
    description: 'The beachfront skate bowl and the sea-wall murals beside it.',
    whyGo: 'A quick, photogenic slice of Bondi culture on the promenade.',
  },
];

export function getExperience(id: string): Experience | undefined {
  return BONDI_EXPERIENCES.find((e) => e.id === id);
}
