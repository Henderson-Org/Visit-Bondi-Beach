#!/usr/bin/env node
/**
 * apply-overrides.mjs — applies the authored SEO overrides in content/overrides.json
 * (title / metaDescription / h1 / indexable) onto the committed content/pages.json
 * in place.
 *
 * Same rationale as scripts/apply-image-map.mjs: build-content.mjs merges overrides
 * during a full rebuild, but that rebuild needs the gitignored migration crawl output,
 * which is absent in a fresh clone. This applies overrides directly to the committed
 * index so authored SEO fields take effect without a re-crawl. Idempotent: fields that
 * already match are left unchanged.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

async function main() {
  const pages = JSON.parse(await readFile(join(ROOT, 'content', 'pages.json'), 'utf8'));
  const overrides = JSON.parse(await readFile(join(ROOT, 'content', 'overrides.json'), 'utf8'));
  const byPath = new Map(pages.map((p) => [p.path, p]));

  let changed = 0;
  const applied = [];
  for (const [path, ov] of Object.entries(overrides)) {
    if (path.startsWith('_')) continue; // skip _comment
    const page = byPath.get(path);
    if (!page) { console.warn(`  (skip) override path not in pages.json: ${path}`); continue; }
    let touched = false;
    for (const field of ['title', 'metaDescription', 'h1']) {
      if (typeof ov[field] === 'string' && ov[field].trim() && page[field] !== ov[field]) {
        page[field] = ov[field];
        touched = true;
      }
    }
    if (typeof ov.indexable === 'boolean' && page.indexable !== ov.indexable) {
      page.indexable = ov.indexable;
      touched = true;
    }
    if (touched) { changed++; applied.push(path); }
  }

  await writeFile(join(ROOT, 'content', 'pages.json'), JSON.stringify(pages, null, 2));
  console.log(`Applied SEO overrides: ${changed} page(s) updated.`);
  for (const p of applied) console.log(`  ~ ${p}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
