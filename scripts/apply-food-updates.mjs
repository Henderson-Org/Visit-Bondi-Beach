#!/usr/bin/env node
/**
 * apply-food-updates.mjs — apply the food-article workflow results to body files.
 *
 * Input: a JSON file (arg) = the workflow result array [{path, blocks, report, file, tier}].
 * For each result it re-validates the blocks against the same rules build-bodies enforces,
 * and only writes valid ones — merging the new blocks into the existing body file (keeping
 * path/voice/sources, bumping lastReviewed). Invalid or empty results are skipped and listed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TODAY = '2026-08-11';
const BODIES = 'content/bodies';
const SRC = process.argv[2];
if (!SRC || !existsSync(SRC)) { console.error('usage: node scripts/apply-food-updates.mjs <results.json>'); process.exit(1); }

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
function validateBlock(b, i) {
  if (!b || typeof b !== 'object') return `block[${i}] not an object`;
  switch (b.type) {
    case 'p': case 'h2': case 'h3': case 'li': case 'quote': case 'localTip':
      return isStr(b.text) ? null : `block[${i}] ${b.type} needs text`;
    case 'callout':
      if (!isStr(b.text)) return `block[${i}] callout needs text`;
      if (b.tone && b.tone !== 'note' && b.tone !== 'warning') return `block[${i}] bad tone`;
      return null;
    case 'list':
      if (!Array.isArray(b.items) || !b.items.length) return `block[${i}] list needs items`;
      return b.items.every(isStr) ? null : `block[${i}] list items must be strings`;
    case 'quickFacts':
      if (!Array.isArray(b.items) || !b.items.length) return `block[${i}] quickFacts needs items`;
      return b.items.every((it) => isStr(it?.label) && isStr(it?.value)) ? null : `block[${i}] quickFacts item needs label+value`;
    case 'faq':
      if (!Array.isArray(b.items) || !b.items.length) return `block[${i}] faq needs items`;
      return b.items.every((it) => isStr(it?.q) && isStr(it?.a)) ? null : `block[${i}] faq item needs q+a`;
    case 'itinerary':
      if (!Array.isArray(b.stops) || !b.stops.length) return `block[${i}] itinerary needs stops`;
      return b.stops.every((s) => isStr(s?.time) && isStr(s?.title)) ? null : `block[${i}] itinerary stop needs time+title`;
    default:
      return `block[${i}] unknown type "${b.type}"`;
  }
}

const results = JSON.parse(readFileSync(SRC, 'utf8'));
const applied = [], skipped = [], opportunities = [];
let linked = 0, closures = 0, expanded = 0;

for (const r of results) {
  if (!r || !r.file || !Array.isArray(r.blocks) || !r.blocks.length) { skipped.push(`${r?.path || '?'}: empty/no blocks`); continue; }
  const file = join(BODIES, r.file);
  if (!existsSync(file)) { skipped.push(`${r.path}: body file ${r.file} not found`); continue; }
  const orig = JSON.parse(readFileSync(file, 'utf8'));
  // Validate every block
  const errs = r.blocks.map(validateBlock).filter(Boolean);
  if (errs.length) { skipped.push(`${r.path}: ${errs.slice(0, 2).join('; ')}`); continue; }
  // Sanity: don't accept a result that gutted the article (>25% shrink in block count).
  if (r.blocks.length < Math.ceil(orig.blocks.length * 0.75)) {
    skipped.push(`${r.path}: block count dropped ${orig.blocks.length}->${r.blocks.length} (guard)`); continue;
  }
  const merged = { ...orig, blocks: r.blocks, lastReviewed: TODAY };
  writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
  applied.push(r.path);
  const rep = r.report || {};
  linked += (rep.venuesLinked || []).length;
  closures += (rep.closuresFixed || []).length;
  if (rep.expanded) expanded++;
  for (const o of rep.opportunities || []) opportunities.push(`[${r.path.split('/').pop()}] ${o}`);
  if ((rep.closuresFixed || []).length) console.log(`  ${r.path}\n    closures: ${rep.closuresFixed.join(' | ')}`);
}

console.log(`\nApplied ${applied.length} / ${results.length}. Venue links added: ${linked}. Closures fixed: ${closures}. Expanded: ${expanded}.`);
if (skipped.length) { console.log(`\nSKIPPED ${skipped.length}:`); for (const s of skipped) console.log('  ' + s); }
if (opportunities.length) {
  console.log(`\nOPPORTUNITIES flagged (${opportunities.length}):`);
  for (const o of opportunities) console.log('  - ' + o);
  writeFileSync('/tmp/food-opportunities.txt', opportunities.join('\n'));
}
