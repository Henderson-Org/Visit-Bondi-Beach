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
const BODIES_DIR = join(HERE, '..', 'content', 'bodies');
const MAX_DAYS = { live: 7, weekly: 10, monthly: 45, quarterly: 100, seasonal: 200, annual: 400, evergreen: 550 };

const now = new Date();
const daysSince = (iso) => Math.floor((now - new Date(iso)) / 86400000);

const files = (await readdir(BODIES_DIR)).filter((f) => f.endsWith('.json'));
const overdue = [];
const unclassified = [];
let ok = 0;

for (const f of files.sort()) {
  const rec = JSON.parse(await readFile(join(BODIES_DIR, f), 'utf8'));
  const cls = rec.freshnessClass;
  if (!cls) { unclassified.push(rec.path || f); continue; }
  if (cls === 'evergreen') { ok++; continue; }
  if (!rec.lastReviewed) { overdue.push({ path: rec.path || f, cls, age: '∞ (no lastReviewed)' }); continue; }
  const age = daysSince(rec.lastReviewed);
  if (age > MAX_DAYS[cls]) overdue.push({ path: rec.path || f, cls, age: `${age}d (max ${MAX_DAYS[cls]})` });
  else ok++;
}

console.log(`Freshness audit — ${files.length} authored bodies\n${'─'.repeat(60)}`);
console.log(`✓ within cadence: ${ok}   ⚠ overdue: ${overdue.length}   • unclassified: ${unclassified.length}\n`);
if (overdue.length) {
  console.log('OVERDUE (review these):');
  for (const o of overdue.sort((a, b) => a.cls.localeCompare(b.cls))) console.log(`  [${o.cls}] ${o.age}  ${o.path}`);
  console.log('');
}
if (unclassified.length) {
  console.log(`UNCLASSIFIED (assign a freshnessClass): ${unclassified.length} bodies`);
  for (const p of unclassified.slice(0, 20)) console.log(`  ${p}`);
  if (unclassified.length > 20) console.log(`  … +${unclassified.length - 20} more`);
}
// Informational only — never fails the build (freshness is a worklist, not a gate).
process.exit(0);
