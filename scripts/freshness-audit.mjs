#!/usr/bin/env node
/**
 * freshness-audit.mjs — lists every authored body whose `lastReviewed` is older than its
 * `freshnessClass` cadence allows, so overdue pages surface without anyone having to remember.
 * Run it in CI or before a content pass:  npm run freshness:audit
 *
 * Freshness classes (max days before "overdue"): live 7 · weekly 10 · monthly 45 ·
 * quarterly 100 · seasonal 200 · annual 400 · evergreen 550. Bodies with no freshnessClass
 * are reported as "unclassified" (assign one so the calendar can be generated, not remembered).
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BODIES_DIR = join(ROOT, 'content', 'bodies');
// Cadences come from the shared policy file, the same one lib/content.ts and
// lib/freshness.ts read - so the CLI worklist and the admin worklist can never disagree.
const POLICY = JSON.parse(await readFile(join(ROOT, 'content', 'freshness-policy.json'), 'utf8'));
const MAX_DAYS = POLICY.maxDays;
const DUE_SOON_FRACTION = POLICY.dueSoonAtFraction;

const now = new Date();
const DAY_MS = 86400000;
const daysSince = (iso) => Math.floor((now - new Date(`${iso}T00:00:00Z`)) / DAY_MS);
const addDays = (iso, n) =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);

const files = (await readdir(BODIES_DIR)).filter((f) => f.endsWith('.json'));
const overdue = [];
const dueSoon = [];
const neverVerified = [];
const unclassified = [];
let ok = 0;

for (const f of files.sort()) {
  const rec = JSON.parse(await readFile(join(BODIES_DIR, f), 'utf8'));
  const path = rec.path || f;
  const cls = rec.freshnessClass;
  if (!cls) { unclassified.push(path); continue; }
  // A page with no lastReviewed was authored but never verified. That is its own
  // category, not "overdue" - there is no review to be late for, and the fix is
  // different (verify it once) from re-checking a lapsed page.
  if (!rec.lastReviewed) { neverVerified.push({ path, cls }); continue; }

  const max = MAX_DAYS[cls];
  const age = daysSince(rec.lastReviewed);
  const next = addDays(rec.lastReviewed, max);
  if (age > max) overdue.push({ path, cls, age, max, by: age - max });
  else if (age >= max * DUE_SOON_FRACTION) dueSoon.push({ path, cls, age, max, next });
  else ok++;
}

console.log(`Freshness audit — ${files.length} authored bodies\n${'─'.repeat(60)}`);
console.log(
  `✓ within cadence: ${ok}   ⚠ overdue: ${overdue.length}   ◷ due soon: ${dueSoon.length}   ` +
  `? never verified: ${neverVerified.length}   • unclassified: ${unclassified.length}\n`,
);
if (overdue.length) {
  console.log('OVERDUE (re-check these first):');
  for (const o of overdue.sort((a, b) => b.by - a.by))
    console.log(`  [${o.cls}] ${o.by}d past due (${o.age}d old, max ${o.max})  ${o.path}`);
  console.log('');
}
if (neverVerified.length) {
  console.log('NEVER VERIFIED (no lastReviewed - verify once, then the cadence takes over):');
  for (const n of neverVerified) console.log(`  [${n.cls}]  ${n.path}`);
  console.log('');
}
if (dueSoon.length) {
  console.log('DUE SOON (schedule before they lapse):');
  for (const d of dueSoon.sort((a, b) => a.next.localeCompare(b.next)))
    console.log(`  [${d.cls}] due ${d.next} (${d.age}d old, max ${d.max})  ${d.path}`);
  console.log('');
}
if (unclassified.length) {
  console.log(`UNCLASSIFIED (assign a freshnessClass — see scripts/classify-freshness.mjs): ${unclassified.length} bodies`);
  for (const p of unclassified.slice(0, 20)) console.log(`  ${p}`);
  if (unclassified.length > 20) console.log(`  … +${unclassified.length - 20} more`);
}
// Informational only — never fails the build (freshness is a worklist, not a gate).
process.exit(0);
