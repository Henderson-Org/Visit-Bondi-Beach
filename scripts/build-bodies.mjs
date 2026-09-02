#!/usr/bin/env node
/**
 * build-bodies.mjs — compiles authored first-person article bodies from the
 * per-article source files in content/bodies/*.json into a single committed map,
 * content/body-overrides.json (keyed by page path), which lib/content.ts overlays
 * onto the crawled content at load time.
 *
 * Why a separate authored source (mirrors content/overrides.json for SEO fields):
 *  - The owner is rewriting every article in a first-person voice. Authored bodies
 *    must REPLACE the crawled body and SURVIVE a re-crawl. Keeping them in their own
 *    files (not in pages.json) means a re-crawl never clobbers editorial work.
 *  - One file per article keeps diffs and git history clean while rewriting one at a
 *    time.
 *
 * Each content/bodies/<name>.json:
 *   {
 *     "path": "/bondi-blog/2025/10/13/some-article",   // required, must match a page
 *     "voice": "first-person",                          // optional, informational
 *     "lastReviewed": "2026-08-08",                     // optional YYYY-MM-DD
 *     "sources": [{ "label": "...", "url": "https://..." }],  // optional
 *     "blocks": [ ...see block types below... ]         // required, non-empty
 *   }
 *
 * Block types:
 *   { "type": "p"|"h2"|"h3"|"li"|"quote", "text": "..." }
 *   { "type": "list", "items": ["...", "..."] }
 *   { "type": "localTip", "text": "..." }
 *   { "type": "callout", "tone": "note"|"warning", "title": "...", "text": "..." }
 *   { "type": "quickFacts", "items": [{ "label": "...", "value": "..." }] }
 *   { "type": "faq", "items": [{ "q": "...", "a": "..." }] }
 *   { "type": "itinerary", "stops": [{ "time": "...", "title": "...", "detail": "..." }] }
 *
 * Validation is strict: an unknown block type or a missing required field aborts
 * the build so a malformed authored body never reaches the site.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BODIES_DIR = join(ROOT, 'content', 'bodies');
const PAGES = join(ROOT, 'content', 'pages.json');
const OUT = join(ROOT, 'content', 'body-overrides.json');
// Editorial bodies for the dining COLLECTION routes (/bondi-eat-and-drink/<slug>).
// Those pages are generated from data/restaurants.ts, so they have no entry in
// content/pages.json and cannot live in the map above. They get their own directory
// and output map, keyed by collection slug, but reuse this file's block validation
// so a collection body and an article body obey exactly the same rules.
const COLLECTION_BODIES_DIR = join(ROOT, 'content', 'collection-bodies');
const COLLECTION_OUT = join(ROOT, 'content', 'collection-body-overrides.json');

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const countWords = (s = '') => (s.trim() ? s.trim().split(/\s+/).length : 0);

function fail(file, msg) {
  throw new Error(`content/bodies/${file}: ${msg}`);
}

// Validate one block; return the words it contributes (for wordCount).
function validateBlock(file, b, i) {
  const where = `block[${i}] (type=${b?.type ?? '?'})`;
  if (!b || typeof b !== 'object') fail(file, `${where}: not an object`);
  switch (b.type) {
    case 'p':
    case 'h2':
    case 'h3':
    case 'li':
    case 'quote':
    case 'answer':
      if (!isNonEmptyString(b.text)) fail(file, `${where}: requires non-empty "text"`);
      return countWords(b.text);
    case 'table': {
      if (!Array.isArray(b.columns) || !b.columns.length) fail(file, `${where}: requires non-empty "columns"`);
      b.columns.forEach((c) => { if (!isNonEmptyString(c)) fail(file, `${where}: every column must be a non-empty string`); });
      if (!Array.isArray(b.rows) || !b.rows.length) fail(file, `${where}: requires non-empty "rows"`);
      let words = 0;
      b.rows.forEach((row, ri) => {
        if (!Array.isArray(row) || row.length !== b.columns.length) fail(file, `${where}: row[${ri}] must have ${b.columns.length} cells to match columns`);
        row.forEach((cell) => { if (typeof cell !== 'string') fail(file, `${where}: row[${ri}] cells must be strings`); words += countWords(cell); });
      });
      return words + b.columns.reduce((n, c) => n + countWords(c), 0);
    }
    case 'list':
      if (!Array.isArray(b.items) || !b.items.length) fail(file, `${where}: requires non-empty "items"`);
      b.items.forEach((it) => { if (!isNonEmptyString(it)) fail(file, `${where}: every item must be a non-empty string`); });
      return b.items.reduce((n, it) => n + countWords(it), 0);
    case 'localTip':
      if (!isNonEmptyString(b.text)) fail(file, `${where}: requires non-empty "text"`);
      return countWords(b.text);
    case 'callout':
      if (!isNonEmptyString(b.text)) fail(file, `${where}: requires non-empty "text"`);
      if (b.tone && b.tone !== 'note' && b.tone !== 'warning') fail(file, `${where}: tone must be "note" or "warning"`);
      return countWords(b.text) + countWords(b.title || '');
    case 'quickFacts':
      if (!Array.isArray(b.items) || !b.items.length) fail(file, `${where}: requires non-empty "items"`);
      b.items.forEach((it) => { if (!isNonEmptyString(it?.label) || !isNonEmptyString(it?.value)) fail(file, `${where}: each item needs "label" and "value"`); });
      return b.items.reduce((n, it) => n + countWords(it.value), 0);
    case 'faq':
      if (!Array.isArray(b.items) || !b.items.length) fail(file, `${where}: requires non-empty "items"`);
      b.items.forEach((it) => { if (!isNonEmptyString(it?.q) || !isNonEmptyString(it?.a)) fail(file, `${where}: each item needs "q" and "a"`); });
      return b.items.reduce((n, it) => n + countWords(it.q) + countWords(it.a), 0);
    case 'itinerary':
      if (!Array.isArray(b.stops) || !b.stops.length) fail(file, `${where}: requires non-empty "stops"`);
      b.stops.forEach((s) => { if (!isNonEmptyString(s?.time) || !isNonEmptyString(s?.title)) fail(file, `${where}: each stop needs "time" and "title"`); });
      return b.stops.reduce((n, s) => n + countWords(s.title) + countWords(s.detail || ''), 0);
    default:
      fail(file, `${where}: unknown block type "${b.type}"`);
  }
}

async function main() {
  const pages = JSON.parse(await readFile(PAGES, 'utf8'));
  const knownPaths = new Set(pages.map((p) => p.path));

  let files = [];
  try { files = (await readdir(BODIES_DIR)).filter((f) => f.endsWith('.json')); }
  catch { /* no bodies dir yet — emit an empty map */ }

  const map = {};
  for (const f of files.sort()) {
    const rec = JSON.parse(await readFile(join(BODIES_DIR, f), 'utf8'));
    if (!isNonEmptyString(rec.path)) fail(f, 'missing "path"');
    if (!knownPaths.has(rec.path)) fail(f, `path "${rec.path}" does not match any page in content/pages.json`);
    if (map[rec.path]) fail(f, `duplicate path "${rec.path}" (already authored in another file)`);
    if (!Array.isArray(rec.blocks) || !rec.blocks.length) fail(f, 'requires a non-empty "blocks" array');
    if (rec.lastReviewed && !/^\d{4}-\d{2}-\d{2}$/.test(rec.lastReviewed)) fail(f, 'lastReviewed must be YYYY-MM-DD');
    if (rec.checkType && rec.checkType !== 'local' && rec.checkType !== 'desk') fail(f, 'checkType must be "local" or "desk"');
    const FRESHNESS = ['live', 'weekly', 'monthly', 'quarterly', 'seasonal', 'annual', 'evergreen'];
    if (rec.freshnessClass && !FRESHNESS.includes(rec.freshnessClass)) fail(f, `freshnessClass must be one of ${FRESHNESS.join(', ')}`);
    if (rec.sources) {
      if (!Array.isArray(rec.sources)) fail(f, '"sources" must be an array');
      rec.sources.forEach((s) => { if (!isNonEmptyString(s?.label) || !isNonEmptyString(s?.url)) fail(f, 'each source needs "label" and "url"'); });
    }

    let wordCount = 0;
    rec.blocks.forEach((b, i) => { wordCount += validateBlock(f, b, i); });

    map[rec.path] = {
      blocks: rec.blocks,
      wordCount,
      ...(rec.sources ? { sources: rec.sources } : {}),
      ...(rec.lastReviewed ? { lastReviewed: rec.lastReviewed } : {}),
      // freshnessClass/checkType are validated above and MUST be emitted: lib/content.ts
      // overlays them onto the Page, the renderer uses freshnessClass to suppress the
      // visible "checked" date on evergreen pages and checkType to choose the wording
      // ("Last locally checked" vs "Last reviewed"), and the maintenance calendar reads
      // the class to schedule the next review. Dropping them here silently disabled all
      // three - every page fell back to the undated/desk default regardless of its source file.
      ...(rec.freshnessClass ? { freshnessClass: rec.freshnessClass } : {}),
      // Must be emitted, like freshnessClass above: lib/content.ts overlays it onto the
      // Page and the renderer uses it to suppress in-article ads on sensitive pages.
      ...(rec.noAds ? { noAds: true } : {}),
      ...(rec.checkType ? { checkType: rec.checkType } : {}),
      ...(rec.voice ? { voice: rec.voice } : {}),
    };
  }

  // Deterministic key order for clean diffs.
  const sorted = {};
  for (const k of Object.keys(map).sort()) sorted[k] = map[k];
  await writeFile(OUT, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`content/body-overrides.json: ${Object.keys(sorted).length} authored body(ies) from ${files.length} file(s).`);

  await buildCollectionBodies();
}

/**
 * Editorial bodies for the dining collection routes, keyed by collection slug.
 *
 * These exist so consolidating a strong editorial article into its database collection
 * ADDS the writing to the surviving page instead of discarding it. A collection page
 * then carries both the ranked directory (from data/restaurants.ts) and the local
 * editorial voice, which is the whole point of the consolidation.
 *
 * The slug is NOT validated here - this script cannot import the TypeScript collection
 * registry. lib/restaurantGuide.ts asserts at module load that every key in the emitted
 * map matches a real collection, so a typo fails the build there rather than silently
 * rendering nothing.
 */
async function buildCollectionBodies() {
  let files = [];
  try { files = (await readdir(COLLECTION_BODIES_DIR)).filter((f) => f.endsWith('.json')); }
  catch { /* no collection bodies yet — emit an empty map */ }

  const map = {};
  for (const f of files.sort()) {
    const rec = JSON.parse(await readFile(join(COLLECTION_BODIES_DIR, f), 'utf8'));
    if (!isNonEmptyString(rec.collection)) fail(f, 'missing "collection" (the collection slug)');
    if (map[rec.collection]) fail(f, `duplicate collection "${rec.collection}"`);
    if (!Array.isArray(rec.blocks) || !rec.blocks.length) fail(f, 'requires a non-empty "blocks" array');
    if (rec.lastReviewed && !/^\d{4}-\d{2}-\d{2}$/.test(rec.lastReviewed)) fail(f, 'lastReviewed must be YYYY-MM-DD');
    if (rec.checkType && rec.checkType !== 'local' && rec.checkType !== 'desk') fail(f, 'checkType must be "local" or "desk"');
    const FRESHNESS = ['live', 'weekly', 'monthly', 'quarterly', 'seasonal', 'annual', 'evergreen'];
    if (rec.freshnessClass && !FRESHNESS.includes(rec.freshnessClass)) fail(f, `freshnessClass must be one of ${FRESHNESS.join(', ')}`);
    if (rec.sources) {
      if (!Array.isArray(rec.sources)) fail(f, '"sources" must be an array');
      rec.sources.forEach((s) => { if (!isNonEmptyString(s?.label) || !isNonEmptyString(s?.url)) fail(f, 'each source needs "label" and "url"'); });
    }

    let wordCount = 0;
    rec.blocks.forEach((b, i) => { wordCount += validateBlock(f, b, i); });

    map[rec.collection] = {
      blocks: rec.blocks,
      wordCount,
      ...(rec.sources ? { sources: rec.sources } : {}),
      ...(rec.lastReviewed ? { lastReviewed: rec.lastReviewed } : {}),
      ...(rec.freshnessClass ? { freshnessClass: rec.freshnessClass } : {}),
      // Must be emitted, like freshnessClass above: lib/content.ts overlays it onto the
      // Page and the renderer uses it to suppress in-article ads on sensitive pages.
      ...(rec.noAds ? { noAds: true } : {}),
      ...(rec.checkType ? { checkType: rec.checkType } : {}),
    };
  }

  const sorted = {};
  for (const k of Object.keys(map).sort()) sorted[k] = map[k];
  await writeFile(COLLECTION_OUT, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`content/collection-body-overrides.json: ${Object.keys(sorted).length} collection body(ies) from ${files.length} file(s).`);
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
