#!/usr/bin/env node
/**
 * classify-freshness.mjs — assigns a `freshnessClass` to every authored body in
 * content/bodies/*.json that does not already declare one.
 *
 * Why this exists: the freshness system (lib/content.ts FRESHNESS_MAX_DAYS +
 * scripts/freshness-audit.mjs) can only schedule a re-check for a page whose class
 * is known. Without a class a page is "unclassified" - it never becomes overdue, so
 * it is never re-checked, which is precisely the stale-travel-content failure mode
 * the system exists to prevent. This backfills the corpus once; new bodies should
 * declare `freshnessClass` in their source file directly.
 *
 * The class is decided by what makes the page WRONG over time, not by topic interest:
 *   live/weekly  - conditions that change within days (not used for authored bodies)
 *   monthly      - fares, parking rates, opening hours, prices: volatile operational facts
 *   quarterly    - venue line-ups (cafés/restaurants/bars open and close constantly)
 *   seasonal     - anything keyed to a season (weather, whales, summer/winter guidance)
 *   annual       - a recurring event whose dates/details change once per edition
 *   evergreen    - history, geography, names, culture: facts that do not decay
 *
 * WHAT COUNTS AS `monthly` (learned the hard way): a topic is not a cadence. The first
 * version of this script classified off topic words alone, and put 66 bodies on a 45-day
 * clock because "bus", "parking" or "cost" appeared three times - which, in a Bondi travel
 * guide, is nearly every page. 28 of them quoted no price and no trading hour anywhere.
 * A page only goes stale monthly if it QUOTES a figure that moves: a dollar amount, or a
 * clock time presented as trading/service hours. "Arrive before 9am to find a park" is
 * advice and does not decay; "$10 for adults" does. So the monthly tier is gated on
 * `volatileFigures()` finding real numbers, and a page about a volatile topic that quotes
 * none is `quarterly` - the guidance can still drift, but no stale number is on the page.
 *
 * Run: node scripts/classify-freshness.mjs [--dry] [--reclassify]
 *   --dry         print what would change, write nothing
 *   --reclassify  also CORRECT bodies that already declare a class (default: only backfill
 *                 missing ones, so a hand-set class is never silently overwritten)
 * Then: node scripts/build-bodies.mjs
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { classify } from './freshness-rules.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BODIES_DIR = join(ROOT, 'content', 'bodies');
const DRY = process.argv.includes('--dry');
const RECLASSIFY = process.argv.includes('--reclassify');


const files = (await readdir(BODIES_DIR)).filter((f) => f.endsWith('.json')).sort();
const counts = {};
let changed = 0, already = 0, unchanged = 0;

for (const f of files) {
  const full = join(BODIES_DIR, f);
  const raw = await readFile(full, 'utf8');
  const rec = JSON.parse(raw);
  const existing = rec.freshnessClass;
  if (existing && !RECLASSIFY) { already++; counts[existing] = (counts[existing] || 0) + 1; continue; }

  const [cls, , via] = classify(rec);
  counts[cls] = (counts[cls] || 0) + 1;
  if (existing === cls) { unchanged++; continue; }
  changed++;
  const move = existing ? `${existing} → ${cls}` : cls;
  if (DRY) { console.log(`${move.padEnd(24)} ${via.padEnd(18)} ${rec.path}`); continue; }

  // Insert freshnessClass immediately after lastReviewed (or after path) so the
  // provenance fields stay grouped, and keep the file's existing formatting.
  rec.freshnessClass = cls;
  const ordered = {};
  for (const k of ['path', 'voice', 'lastReviewed', 'checkType', 'freshnessClass', 'sources', 'blocks']) {
    if (k in rec) ordered[k] = rec[k];
  }
  for (const k of Object.keys(rec)) if (!(k in ordered)) ordered[k] = rec[k];
  await writeFile(full, JSON.stringify(ordered, null, 2) + '\n');
}

console.log(
  `\n${DRY ? '[dry run] ' : ''}${RECLASSIFY ? 'reclassified' : 'classified'} ${changed} file(s); ` +
  (RECLASSIFY ? `${unchanged} already correct.` : `${already} already had a class.`),
);
console.log('distribution:', Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1])));
