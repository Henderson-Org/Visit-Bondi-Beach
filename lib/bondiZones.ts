/**
 * Bondi micro-zones and the walking geometry between them. Sequencing is driven off
 * these zones (a coastal position line) rather than raw lat/lon precision, so the
 * itinerary reads geographically even when coordinates are approximate.
 */
export type Zone =
  | 'north-bondi'
  | 'central-bondi'
  | 'gould-hall'
  | 'south-bondi'
  | 'tamarama'
  | 'bronte';

export const ZONE_LABEL: Record<Zone, string> = {
  'north-bondi': 'North Bondi',
  'central-bondi': 'Central Bondi Beach',
  'gould-hall': 'Gould & Hall Street',
  'south-bondi': 'South Bondi / Icebergs',
  tamarama: 'Tamarama',
  bronte: 'Bronte',
};

/**
 * Approximate walking-minutes position along the coast, measured from Bronte (south)
 * up to North Bondi. Gould/Hall sits just inland behind central Bondi. Distance between
 * two zones ≈ |position difference| minutes on foot.
 */
const POSITION: Record<Zone, number> = {
  bronte: 0,
  tamarama: 8,
  'south-bondi': 16,
  'central-bondi': 23,
  'gould-hall': 25,
  'north-bondi': 31,
};

/** Approximate walking minutes between two zones. */
export function walkMinutes(a: Zone, b: Zone): number {
  return Math.abs(POSITION[a] - POSITION[b]);
}

export function zonePosition(z: Zone): number {
  return POSITION[z];
}

/**
 * Backtracking penalty for a sequence of zones: rewards moving in one direction along
 * the coast. Any reversal of direction between consecutive legs is penalised.
 */
export function backtrackingPenalty(seq: Zone[]): number {
  let penalty = 0;
  let prevDir = 0;
  for (let i = 1; i < seq.length; i++) {
    const d = Math.sign(POSITION[seq[i]] - POSITION[seq[i - 1]]);
    if (d !== 0 && prevDir !== 0 && d !== prevDir) penalty += 1;
    if (d !== 0) prevDir = d;
  }
  return penalty;
}
