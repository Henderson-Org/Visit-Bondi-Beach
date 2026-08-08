/**
 * Accommodation reconciliation / health check.
 *
 * Run: `npm run audit:stay`  (node --experimental-strip-types)
 *
 * What it does:
 *  - lists every property with its verification status (active, hasGuide, bookingUrl,
 *    lastVerified, source);
 *  - flags stale records (lastVerified older than STALE_DAYS) for re-checking;
 *  - fails on duplicate slugs or missing required fields;
 *  - optionally diffs the dataset against a permitted inventory export
 *    (a JSON array of { name } or { slug }) passed as the first CLI arg — reporting
 *    which of ours are missing from the feed and which feed items are new. It never
 *    mutates data; it only reports, so a temporary Booking.com/Travelpayouts blip can't
 *    delete a property.
 */
import { readFileSync } from 'node:fs';
import { PROPERTIES, type Property } from '../data/accommodation.ts';

const STALE_DAYS = 180;

function daysSince(iso: string): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86_400_000);
}

function requireFields(p: Property): string[] {
  const missing: string[] = [];
  for (const f of ['slug', 'name', 'area', 'type', 'priceBand', 'walkText', 'summary', 'lastReviewed'] as const) {
    if (!p[f]) missing.push(f);
  }
  return missing;
}

let errors = 0;

// Duplicate slugs
const seen = new Set<string>();
for (const p of PROPERTIES) {
  if (seen.has(p.slug)) { console.error(`  ✖ duplicate slug: ${p.slug}`); errors++; }
  seen.add(p.slug);
}

// Field validation
for (const p of PROPERTIES) {
  const missing = requireFields(p);
  if (missing.length) { console.error(`  ✖ ${p.slug}: missing ${missing.join(', ')}`); errors++; }
}

// Inventory table
console.log('\nBondi accommodation directory\n');
console.log(['slug', 'active', 'guide', 'bookingUrl', 'verified', 'age(d)'].join('\t'));
for (const p of PROPERTIES) {
  const age = daysSince(p.lastReviewed);
  console.log([
    p.slug,
    p.active === false ? 'no' : 'yes',
    p.hasGuide ? 'yes' : '—',
    p.bookingUrl ? 'exact' : 'search',
    p.lastReviewed,
    age === Infinity ? '?' : String(age),
  ].join('\t'));
}

// Staleness
const stale = PROPERTIES.filter((p) => daysSince(p.lastReviewed) > STALE_DAYS);
if (stale.length) {
  console.log(`\n⚠ ${stale.length} record(s) older than ${STALE_DAYS} days — re-verify:`);
  for (const p of stale) console.log(`  - ${p.slug} (last ${p.lastReviewed})`);
}

// Optional inventory diff
const feedPath = process.argv[2];
if (feedPath) {
  const feed: Array<{ name?: string; slug?: string }> = JSON.parse(readFileSync(feedPath, 'utf8'));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const feedKeys = new Set(feed.map((f) => norm(f.slug || f.name || '')));
  const ourKeys = new Map(PROPERTIES.map((p) => [norm(p.name), p]));
  console.log(`\nInventory diff vs ${feedPath}:`);
  const missingFromFeed = PROPERTIES.filter((p) => !feedKeys.has(norm(p.name)) && !feedKeys.has(norm(p.slug)));
  const newInFeed = feed.filter((f) => !ourKeys.has(norm(f.name || '')) && ![...ourKeys.values()].some((p) => p.slug === (f.slug || '')));
  console.log(`  On our site but not in feed (review — do NOT auto-delete): ${missingFromFeed.map((p) => p.slug).join(', ') || 'none'}`);
  console.log(`  In feed but not on our site (candidates to add): ${newInFeed.map((f) => f.name || f.slug).join(', ') || 'none'}`);
}

console.log(`\nTotal: ${PROPERTIES.length} properties · active: ${PROPERTIES.filter((p) => p.active !== false).length} · with guide: ${PROPERTIES.filter((p) => p.hasGuide).length} · errors: ${errors}`);
process.exit(errors > 0 ? 1 : 0);
