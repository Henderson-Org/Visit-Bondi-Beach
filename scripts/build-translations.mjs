#!/usr/bin/env node
/**
 * build-translations.mjs — compiles per-locale, per-article translation files from
 * content/translations/<locale>/<slug>.json into a single committed map,
 * content/translation-overrides.json (keyed `${locale}::${path}`), overlaid at load by
 * lib/translations.ts. Same first-class-content model as authored English bodies.
 *
 * Each content/translations/<locale>/<name>.json:
 *   { "path": "/bondi-blog/...", "locale": "ja",
 *     "title": "...", "metaDescription": "...", "h1": "...", "intro": "...",
 *     "blocks": [ ...same block shapes as English bodies... ] }
 *
 * Validation is strict: unknown locale, a path not in pages.json, or a malformed block aborts
 * the build so a broken translation never ships.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIR = join(ROOT, 'content', 'translations');
const PAGES = join(ROOT, 'content', 'pages.json');
const REDIRECTS = join(ROOT, 'content', 'redirected-paths.json');
const OUT = join(ROOT, 'content', 'translation-overrides.json');
const LOCALES = new Set(['ja', 'zh-cn', 'es', 'pt', 'de', 'nl', 'it']);

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const fail = (f, m) => { throw new Error(`content/translations/${f}: ${m}`); };

// Mirror of the English body block validation (kept in lock-step with build-bodies.mjs).
function validateBlock(file, b, i) {
  const where = `block[${i}] (type=${b?.type ?? '?'})`;
  if (!b || typeof b !== 'object') fail(file, `${where}: not an object`);
  switch (b.type) {
    case 'p': case 'h2': case 'h3': case 'li': case 'quote': case 'answer':
      if (!isStr(b.text)) fail(file, `${where}: requires non-empty "text"`); break;
    case 'list':
      if (!Array.isArray(b.items) || !b.items.length) fail(file, `${where}: requires "items"`);
      b.items.forEach((it) => { if (!isStr(it)) fail(file, `${where}: items must be non-empty strings`); }); break;
    case 'localTip':
      if (!isStr(b.text)) fail(file, `${where}: requires "text"`); break;
    case 'callout':
      if (!isStr(b.text)) fail(file, `${where}: requires "text"`);
      if (b.tone && b.tone !== 'note' && b.tone !== 'warning') fail(file, `${where}: bad tone`); break;
    case 'quickFacts':
      if (!Array.isArray(b.items) || !b.items.length) fail(file, `${where}: requires "items"`);
      b.items.forEach((it) => { if (!isStr(it?.label) || !isStr(it?.value)) fail(file, `${where}: item needs label+value`); }); break;
    case 'faq':
      if (!Array.isArray(b.items) || !b.items.length) fail(file, `${where}: requires "items"`);
      b.items.forEach((it) => { if (!isStr(it?.q) || !isStr(it?.a)) fail(file, `${where}: item needs q+a`); }); break;
    case 'table':
      if (!Array.isArray(b.columns) || !b.columns.length) fail(file, `${where}: requires "columns"`);
      if (!Array.isArray(b.rows) || !b.rows.length) fail(file, `${where}: requires "rows"`);
      b.rows.forEach((r, ri) => { if (!Array.isArray(r) || r.length !== b.columns.length) fail(file, `${where}: row[${ri}] must match columns`); }); break;
    case 'itinerary':
      if (!Array.isArray(b.stops) || !b.stops.length) fail(file, `${where}: requires "stops"`);
      b.stops.forEach((s) => { if (!isStr(s?.time) || !isStr(s?.title)) fail(file, `${where}: stop needs time+title`); }); break;
    default:
      fail(file, `${where}: unknown block type "${b.type}"`);
  }
}

async function main() {
  const knownPaths = new Set(JSON.parse(await readFile(PAGES, 'utf8')).map((p) => p.path));
  // A translation must never exist for a redirected/removed English base, or its hreflang would
  // point at a 301/404. Refuse to compile one so stale files are caught here, not shipped silently.
  const redir = JSON.parse(await readFile(REDIRECTS, 'utf8'));
  const redirected = new Set([...(redir.redirected || []), ...(redir.ownedByRoute || [])]);
  const map = {};
  let fileCount = 0;
  for (const locale of LOCALES) {
    let files = [];
    try { files = (await readdir(join(DIR, locale))).filter((f) => f.endsWith('.json')); } catch { continue; }
    for (const f of files.sort()) {
      const rel = `${locale}/${f}`;
      const rec = JSON.parse(await readFile(join(DIR, locale, f), 'utf8'));
      if (rec.locale && rec.locale !== locale) fail(rel, `locale field "${rec.locale}" != folder "${locale}"`);
      if (!isStr(rec.path)) fail(rel, 'missing "path"');
      if (!knownPaths.has(rec.path)) fail(rel, `path "${rec.path}" not in content/pages.json`);
      if (redirected.has(rec.path)) fail(rel, `path "${rec.path}" is redirected/owned (see content/redirected-paths.json) — a translation must not exist for it; remove this file or re-point it at the surviving URL`);
      if (!Array.isArray(rec.blocks) || !rec.blocks.length) fail(rel, 'requires non-empty "blocks"');
      if (!isStr(rec.title) || !isStr(rec.h1)) fail(rel, 'requires "title" and "h1"');
      rec.blocks.forEach((b, i) => validateBlock(rel, b, i));
      const k = `${locale}::${rec.path}`;
      if (map[k]) fail(rel, `duplicate translation for ${k}`);
      map[k] = {
        title: rec.title, h1: rec.h1,
        ...(rec.metaDescription ? { metaDescription: rec.metaDescription } : {}),
        ...(rec.intro ? { intro: rec.intro } : {}),
        blocks: rec.blocks,
      };
      fileCount++;
    }
  }
  const sorted = {};
  for (const k of Object.keys(map).sort()) sorted[k] = map[k];
  await writeFile(OUT, JSON.stringify(sorted, null, 2) + '\n');
  const byLocale = {};
  for (const k of Object.keys(sorted)) { const l = k.split('::')[0]; byLocale[l] = (byLocale[l] || 0) + 1; }
  console.log(`content/translation-overrides.json: ${fileCount} translations` + (fileCount ? ` (${Object.entries(byLocale).map(([l, n]) => `${l} ${n}`).join(', ')})` : ''));
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
