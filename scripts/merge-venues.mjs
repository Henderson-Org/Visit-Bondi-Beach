#!/usr/bin/env node
/**
 * merge-venues.mjs — normalise researched+enriched venue records into data/restaurants.json.
 *
 * Input : scratchpad venues-enriched.json (array of raw enrichment agent outputs).
 * Output: data/restaurants.json (the typed Restaurant[] the site consumes).
 *
 * Rules:
 *  - Keep only currently-trading venues (status open|opening-soon). Closed/moved/not-found
 *    are dropped from the public directory (kept in a sidecar report for the record).
 *  - Slugify a stable id; map cuisines/meals/etc. through; compute a composite `score`.
 *  - De-duplicate by id (later, higher-confidence records win).
 *  - Never invents fields: missing → omitted/empty.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const SRC = process.argv[2] || join('/tmp/claude-0/-home-user/cca2e8e4-6485-5d39-a528-4b61409b7ab1/scratchpad', 'venues-enriched.json');
const OUT = join(ROOT, 'data', 'restaurants.json');
const REPORT = join(ROOT, 'data', 'restaurants-excluded.json');

const slug = (s) =>
  (s || '').toLowerCase().replace(/&/g, ' and ').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const clampBand = (n) => Math.min(4, Math.max(1, Number(n) || 2));
// Decode the handful of HTML entities that can leak in from source titles / args.
const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
const arr = (x) => (Array.isArray(x) ? x.filter(Boolean).map((v) => (typeof v === 'string' ? decodeEntities(v) : v)) : []);
const clean = (s) => (typeof s === 'string' ? decodeEntities(s.trim()) : undefined);

// Composite 0–10 for default ordering. Weights favour food + local reputation + usefulness,
// with a smaller view contribution. Missing signals fall back to a neutral 5.
function composite(r) {
  const g = (k) => (typeof r?.[k] === 'number' ? r[k] : 5);
  const w = { foodScore: 0.34, localReputation: 0.24, visitorUsefulness: 0.18, uniqueness: 0.12, value: 0.07, viewScore: 0.05 };
  let s = 0, tot = 0;
  for (const [k, wt] of Object.entries(w)) { s += g(k) * wt; tot += wt; }
  return Math.round((s / tot) * 10) / 10;
}

if (!existsSync(SRC)) {
  console.error(`No enrichment input at ${SRC} — nothing to merge yet.`);
  process.exit(0);
}
const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const TODAY = '2026-08-10';

const kept = new Map();
const excluded = [];
for (const v of raw) {
  if (!v || !v.candidateName) continue;
  const name = clean(v.currentName) || clean(v.candidateName);
  const status = v.status || 'open';
  // Active = currently trading. 'renamed'/'moved' venues are still open (under the current
  // name/address the enrichment resolved), so they stay in the directory. Only genuinely
  // gone venues are excluded.
  const ACTIVE = new Set(['open', 'opening-soon', 'renamed', 'moved']);
  if (!ACTIVE.has(status)) {
    excluded.push({ name, status, note: v.formerName || '', sources: arr(v.sources).slice(0, 2) });
    continue;
  }
  // Normalise renamed/moved to 'open' for display (they are open); keep formerName for the record.
  const displayStatus = status === 'renamed' || status === 'moved' ? 'open' : status;
  const id = clean(v.slug) ? slug(v.slug) : slug(name);
  if (!id) continue;
  const rec = {
    id,
    name,
    ...(v.formerName ? { formerName: clean(v.formerName) } : {}),
    // renamed/moved venues are still trading — display them as 'open' (formerName keeps
    // the history) so the site's `restaurants()` (status open/opening-soon) includes them.
    status: displayStatus,
    type: v.type || 'restaurant',
    precinct: v.precinct || 'bondi-beach',
    ...(clean(v.street) ? { street: clean(v.street) } : {}),
    ...(clean(v.address) ? { address: clean(v.address) } : {}),
    cuisines: arr(v.cuisines).length ? arr(v.cuisines) : ['—'],
    meals: arr(v.meals),
    priceBand: clampBand(v.priceBand),
    diningStyle: arr(v.diningStyle),
    suitability: arr(v.suitability),
    dietary: arr(v.dietary),
    attributes: arr(v.attributes),
    ...(clean(v.website) ? { website: clean(v.website) } : {}),
    ...(clean(v.bookingUrl) ? { bookingUrl: clean(v.bookingUrl) } : {}),
    ...(clean(v.instagram) ? { instagram: clean(v.instagram) } : {}),
    ...(clean(v.menuUrl) ? { menuUrl: clean(v.menuUrl) } : {}),
    summary: clean(v.summary) || '',
    ...(clean(v.whyGo) ? { whyGo: clean(v.whyGo) } : {}),
    ...(clean(v.bestFor) ? { bestFor: clean(v.bestFor) } : {}),
    ...(clean(v.whatToOrder) ? { whatToOrder: clean(v.whatToOrder) } : {}),
    ...(clean(v.atmosphere) ? { atmosphere: clean(v.atmosphere) } : {}),
    ...(clean(v.localTip) ? { localTip: clean(v.localTip) } : {}),
    ...(clean(v.tradeOff) ? { tradeOff: clean(v.tradeOff) } : {}),
    ...(v.ranking ? { ranking: v.ranking } : {}),
    score: composite(v.ranking || {}),
    confidence: v.confidence || 'medium',
    sources: arr(v.sources),
    lastVerifiedAt: TODAY,
  };
  const prev = kept.get(id);
  const rank = { high: 3, medium: 2, low: 1 };
  if (!prev || (rank[rec.confidence] || 0) >= (rank[prev.confidence] || 0)) kept.set(id, rec);
}

// Second-pass de-dup by normalised display name: a renamed/moved venue and its new-name
// twin (e.g. "Red Coco Thai" → "Grab Thai Bondi", plus a separate "Grab Thai" candidate)
// resolve to the same place but different slug ids. Collapse them, keeping the higher-
// confidence / higher-score record and preferring the one that already has a formerName.
const nameKey = (r) => slug(r.name);
const byName = new Map();
const rankC = { high: 3, medium: 2, low: 1 };
for (const rec of kept.values()) {
  const nk = nameKey(rec);
  const prev = byName.get(nk);
  if (!prev) { byName.set(nk, rec); continue; }
  const better =
    (rankC[rec.confidence] || 0) - (rankC[prev.confidence] || 0) ||
    (rec.score ?? 0) - (prev.score ?? 0) ||
    (rec.formerName ? 1 : 0) - (prev.formerName ? 1 : 0);
  const winner = better >= 0 ? rec : prev;
  const loser = better >= 0 ? prev : rec;
  // Preserve a formerName and merge sources from the dropped twin.
  if (!winner.formerName && loser.formerName) winner.formerName = loser.formerName;
  winner.sources = [...new Set([...(winner.sources || []), ...(loser.sources || [])])].slice(0, 8);
  byName.set(nk, winner);
}

const out = [...byName.values()].sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name));
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
writeFileSync(REPORT, JSON.stringify(excluded, null, 2) + '\n');
console.log(`merged ${out.length} active venues -> data/restaurants.json (${excluded.length} excluded as closed/not-found -> data/restaurants-excluded.json)`);
