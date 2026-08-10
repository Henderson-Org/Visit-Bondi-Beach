#!/usr/bin/env node
/**
 * restaurants-audit.mjs — freshness + integrity audit for the Bondi restaurant directory.
 *
 * Run: `npm run restaurants:verify` (or `node scripts/restaurants-audit.mjs`).
 *
 * Flags, so the directory never quietly rots:
 *  - STALE:    lastVerifiedAt older than the freshness window (default 180 days).
 *  - NOSOURCE: an active venue with no source URL (violates the integrity rule).
 *  - THINCOPY: an active venue with no real editorial (no venue page will be built).
 *  - LOWCONF:  low-confidence records worth a second look.
 *  - DUPE:     two active venues sharing a slug id.
 *  - BADENUM:  a field value outside the allowed vocabulary (catches merge drift).
 *
 * Exits non-zero only on hard integrity errors (NOSOURCE, DUPE, BADENUM) so it can gate
 * a deploy; freshness/thin/low-confidence are warnings (reported, non-blocking).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const DATA = join(ROOT, 'data', 'restaurants.json');
const EXCLUDED = join(ROOT, 'data', 'restaurants-excluded.json');

const FRESH_DAYS = Number(process.env.FRESH_DAYS || 180);
// Fixed "today" for deterministic CI (the site pins a build date); override via env.
const TODAY = process.env.AUDIT_TODAY || '2026-08-10';

const PRECINCTS = new Set(['bondi-beach', 'north-bondi', 'bondi', 'campbell-parade', 'bondi-road', 'bondi-junction']);
const TYPES = new Set(['cafe', 'restaurant', 'bar', 'pub', 'bakery', 'takeaway', 'dessert', 'club-hotel']);
const MEALS = new Set(['breakfast', 'brunch', 'lunch', 'dinner', 'late-night']);
const STATUS = new Set(['open', 'opening-soon', 'temporarily-closed', 'permanently-closed', 'moved', 'renamed']);

const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

const all = JSON.parse(readFileSync(DATA, 'utf8'));
const active = all.filter((r) => r.status === 'open' || r.status === 'opening-soon');

const warn = [];
const err = [];
const seen = new Map();

for (const r of all) {
  if (seen.has(r.id)) err.push(`DUPE     ${r.id} — duplicate slug (also: ${seen.get(r.id)})`);
  else seen.set(r.id, r.name);
  if (!STATUS.has(r.status)) err.push(`BADENUM  ${r.id} — status "${r.status}"`);
  if (!TYPES.has(r.type)) err.push(`BADENUM  ${r.id} — type "${r.type}"`);
  if (!PRECINCTS.has(r.precinct)) err.push(`BADENUM  ${r.id} — precinct "${r.precinct}"`);
  for (const m of r.meals || []) if (!MEALS.has(m)) err.push(`BADENUM  ${r.id} — meal "${m}"`);
}

for (const r of active) {
  if (!Array.isArray(r.sources) || r.sources.length === 0) err.push(`NOSOURCE ${r.id} — active venue with no source`);
  if (!r.lastVerifiedAt) warn.push(`STALE    ${r.id} — no lastVerifiedAt`);
  else if (days(r.lastVerifiedAt, TODAY) > FRESH_DAYS) warn.push(`STALE    ${r.id} — verified ${r.lastVerifiedAt} (${days(r.lastVerifiedAt, TODAY)}d ago)`);
  if (!r.whyGo || r.whyGo.length < 40) warn.push(`THINCOPY ${r.id} — no venue page (thin editorial)`);
  if (r.confidence === 'low') warn.push(`LOWCONF  ${r.id} — low confidence`);
}

// ---- report -----------------------------------------------------------------
const byType = {};
const byPrecinct = {};
for (const r of active) {
  byType[r.type] = (byType[r.type] || 0) + 1;
  byPrecinct[r.precinct] = (byPrecinct[r.precinct] || 0) + 1;
}
const withPage = active.filter((r) => r.whyGo && r.whyGo.length >= 40).length;

console.log(`\nBondi restaurant directory audit  (freshness window ${FRESH_DAYS}d, as of ${TODAY})`);
console.log('─'.repeat(64));
console.log(`Active venues:        ${active.length}`);
console.log(`With venue pages:     ${withPage}`);
let excludedCount = 0;
try { excludedCount = JSON.parse(readFileSync(EXCLUDED, 'utf8')).length; } catch { /* optional */ }
console.log(`Excluded (verified closed/not-found): ${excludedCount}`);
console.log(`By type:              ${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`By precinct:          ${Object.entries(byPrecinct).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log('─'.repeat(64));

if (warn.length) {
  console.log(`\n⚠ ${warn.length} warnings:`);
  for (const w of warn.slice(0, 40)) console.log('  ' + w);
  if (warn.length > 40) console.log(`  … +${warn.length - 40} more`);
}
if (err.length) {
  console.log(`\n✖ ${err.length} integrity errors:`);
  for (const e of err) console.log('  ' + e);
  console.log('');
  process.exit(1);
}
console.log(err.length || warn.length ? '' : '\n✓ clean');
console.log('✓ no integrity errors\n');
