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
 * Run: node scripts/classify-freshness.mjs [--dry]
 * Then: node scripts/build-bodies.mjs
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BODIES_DIR = join(ROOT, 'content', 'bodies');
const DRY = process.argv.includes('--dry');

/**
 * Ordered rules — FIRST match wins, so the most volatile signal takes precedence.
 * Each rule tests the page path + title + the body's plain text.
 */
const RULES = [
  // --- monthly: operational facts with a price or a timetable attached ---
  [/\bparking\b|\bcarpark\b|\bcar[- ]parks?\b|\bparking[- ]meters?\b|\bticket[- ]machine\b/i, 'monthly',
    'parking rates, time limits and bay rules change with council pricing'],
  [/\bfares?\b|\bopal\b|\btimetables?\b|\btrains?\b|\bbuses\b|\bbus\b|\bferry\b|\btransport\b|\bairport\b|how[- ]to[- ]get[- ]to|how[- ]far[- ]is|getting[- ]to[- ]bondi|getting[- ]from/i, 'monthly',
    'fares and timetables are set by Transport for NSW and change without notice'],
  [/\bprices?\b|\bcosts?\b|\bcheap\b|\bbudget\b|how[- ]much[- ]does|\bentry[- ]fee\b|\bfees\b/i, 'monthly',
    'prices move; a stale figure is worse than no figure'],
  [/opening[- ]hours|open[- ]late|\btrading[- ]hours\b/i, 'monthly', 'trading hours change seasonally and on short notice'],

  // --- quarterly: venue line-ups ---
  [/\brestaurants?\b|\bcaf[eé]s?\b|\bcoffee\b|\bbars?\b|\bpubs?\b|\bbrunch\b|\bbreakfast\b|\blunch\b|\bdinner\b|\beats?\b|\bfood\b|\bdining\b|\bbakery\b|ice[- ]cream|\bgelato\b|\bvegan\b|\bvegetarian\b|\btakeaway\b|\bnightlife\b|\bdrinks?\b/i,
    'quarterly', 'venues open, close and change hands constantly'],
  [/\baccommodation\b|\bhotels?\b|\bhostels?\b|\bairbnb\b|where[- ]to[- ]stay|\bbackpackers?\b|\bhousemate\b/i, 'quarterly',
    'properties change ownership, standards and availability'],
  [/\bshopping\b|\bmarkets?\b|\bbookstore\b|\bgyms?\b|surf[- ]school|\blessons?\b|\btours?\b/i, 'quarterly',
    'operators and offerings change through the year'],

  // --- annual: a recurring event with per-edition detail ---
  [/city2surf|city[- ]to[- ]surf|\bmarathon\b|\bfestival\b|\bsculptures?\b|new[- ]years?\b|\bnye\b|\bchristmas\b|australia[- ]day|\banzac\b|event[- ]calendar/i,
    'annual', 'a recurring edition whose dates and details are reset each year'],

  // --- seasonal: keyed to time of year ---
  [/\bweather\b|\btemperatures?\b|\bseasons?\b|\bsummer\b|\bwinter\b|\bautumn\b|\bspring\b|\bwhales?\b|best[- ]time[- ]to|\bsunrise\b|\bsunset\b|\buv\b|\brain\b|\bstorms?\b|\bswell\b/i,
    'seasonal', 'guidance is keyed to the time of year'],
  [/\bswim\w*\b|\bsurf\w*\b|\bflags?\b|\bpatrol\w*\b|\blifeguards?\b|\bsharks?\b|\brips?\b|\bbluebottles?\b|water[- ]quality|beach[- ]safety/i,
    'seasonal', 'patrol seasons, water conditions and hazards vary through the year'],

  // --- evergreen: facts that do not decay ---
  [/\bhistor\w*\b|\borigins?\b|why[- ]is[- ]bondi|why[- ]bondi|\bfamous\b|\bpronounce\b|\bmeaning\b|\bnamed\b|\baboriginal\b|\bheritage\b|\barchitecture\b|man[- ]made|\bgeograph\w*\b|\bcemetery\b/i,
    'evergreen', 'historical and factual material that does not decay'],
];

/**
 * Minimum times a pattern must appear in the BODY to classify off body text alone.
 * A single mention of "bus" or "cost" is incidental in almost any travel article; a
 * repeated one means the page actually carries that kind of fact. The path has no
 * such threshold - a slug naming the topic is decisive on its own.
 */
const BODY_MIN_HITS = 3;

/** Fallback when nothing matches: a visitor guide that should still be re-read yearly. */
const DEFAULT_CLASS = 'annual';
const DEFAULT_WHY = 'general visitor guidance - re-read once a year for drift';

function textOf(rec) {
  const parts = [rec.path];
  for (const b of rec.blocks || []) {
    if (typeof b.text === 'string') parts.push(b.text);
    if (Array.isArray(b.items)) {
      for (const it of b.items) {
        if (typeof it === 'string') parts.push(it);
        else if (it && typeof it === 'object') parts.push(it.label ?? '', it.value ?? '', it.q ?? '', it.a ?? '');
      }
    }
  }
  return parts.join(' ');
}

function classify(rec) {
  // The path carries the strongest topical signal - a slug naming the topic is
  // decisive, so test it first and take the first (most volatile) match.
  const path = rec.path;
  for (const [re, cls, why] of RULES) if (re.test(path)) return [cls, why, 'path'];

  // Otherwise fall back to the body, but only on a REPEATED signal - one passing
  // mention of a bus or a price is incidental in a travel article and would
  // otherwise drag most of the corpus into the monthly bucket.
  const body = textOf(rec);
  for (const [re, cls, why] of RULES) {
    const hits = body.match(new RegExp(re.source, 'gi'));
    if (hits && hits.length >= BODY_MIN_HITS) return [cls, why, `body×${hits.length}`];
  }
  return [DEFAULT_CLASS, DEFAULT_WHY, 'default'];
}

const files = (await readdir(BODIES_DIR)).filter((f) => f.endsWith('.json')).sort();
const counts = {};
let changed = 0, already = 0;

for (const f of files) {
  const full = join(BODIES_DIR, f);
  const raw = await readFile(full, 'utf8');
  const rec = JSON.parse(raw);
  if (rec.freshnessClass) { already++; counts[rec.freshnessClass] = (counts[rec.freshnessClass] || 0) + 1; continue; }

  const [cls, , via] = classify(rec);
  counts[cls] = (counts[cls] || 0) + 1;
  changed++;
  if (DRY) { console.log(`${cls.padEnd(10)} ${via.padEnd(7)} ${rec.path}`); continue; }

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

console.log(`\n${DRY ? '[dry run] ' : ''}classified ${changed} file(s); ${already} already had a class.`);
console.log('distribution:', Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1])));
