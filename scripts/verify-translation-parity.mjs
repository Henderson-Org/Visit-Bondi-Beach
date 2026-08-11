#!/usr/bin/env node
/**
 * verify-translation-parity.mjs — guarantees every translation mirrors its English source
 * block-for-block. A translation must be a COMPLETE rendering of the article, never a summary:
 * same block count, same order, same `type` values, and same sub-counts (list items, quickFacts
 * items, faq items, table columns×rows). Also checks the translated title/h1/metaDescription are
 * present and that the "Bondi" proper noun survives untranslated. Run after build-translations.mjs.
 *
 * Exit non-zero on any mismatch so CI/deploy blocks partial or drifted translations.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIR = join(ROOT, 'content', 'translations');
const LOCALES = ['ja', 'zh-cn', 'es', 'pt'];

const pages = JSON.parse(await readFile(join(ROOT, 'content', 'pages.json'), 'utf8'));
const bodies = JSON.parse(await readFile(join(ROOT, 'content', 'body-overrides.json'), 'utf8'));
const pageByPath = new Map(pages.map((p) => [p.path, p]));

/** English source blocks for a path: authored body override wins, else blocks in pages.json. */
function englishBlocks(path) {
  return bodies[path]?.blocks ?? pageByPath.get(path)?.blocks ?? null;
}

function sig(b) {
  switch (b?.type) {
    case 'list': return `list:${b.items?.length}`;
    case 'quickFacts': return `quickFacts:${b.items?.length}`;
    case 'faq': return `faq:${b.items?.length}`;
    case 'table': return `table:${b.columns?.length}x${b.rows?.length}`;
    default: return b?.type ?? '?';
  }
}

let problems = 0;
let checked = 0;
for (const loc of LOCALES) {
  let files = [];
  try { files = (await readdir(join(DIR, loc))).filter((f) => f.endsWith('.json')); } catch { continue; }
  for (const f of files.sort()) {
    const rel = `${loc}/${f}`;
    const rec = JSON.parse(await readFile(join(DIR, loc, f), 'utf8'));
    const errs = [];
    const src = englishBlocks(rec.path);
    if (!src) { console.log(`FAIL ${rel}: no English source blocks for path "${rec.path}"`); problems++; continue; }
    if (!rec.title?.trim()) errs.push('empty title');
    if (!rec.h1?.trim()) errs.push('empty h1');
    if (!rec.metaDescription?.trim()) errs.push('empty metaDescription');
    const b = rec.blocks || [];
    if (b.length !== src.length) errs.push(`block count ${b.length} != English ${src.length}`);
    const bs = b.map(sig), ss = src.map(sig);
    for (let i = 0; i < Math.max(bs.length, ss.length); i++) {
      if (bs[i] !== ss[i]) errs.push(`block[${i}] ${bs[i] ?? '—'} != English ${ss[i] ?? '—'}`);
    }
    if (!JSON.stringify(rec).includes('Bondi')) errs.push('proper noun "Bondi" missing');
    checked++;
    if (errs.length) { console.log(`FAIL ${rel}:\n  - ${errs.join('\n  - ')}`); problems++; }
    else console.log(`OK   ${rel} (${b.length} blocks)`);
  }
}
console.log(problems
  ? `\n✗ ${problems} translation(s) do not mirror their English source.`
  : `\n✓ ${checked} translation(s) mirror their English source structure.`);
process.exit(problems ? 1 : 0);
