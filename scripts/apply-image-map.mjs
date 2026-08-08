#!/usr/bin/env node
/**
 * apply-image-map.mjs — rewrites heroImage/ogImage in the committed content
 * index (content/pages.json) to their local self-hosted copies using
 * content/image-map.json.
 *
 * Why this exists separately from build-content.mjs: build-content rebuilds
 * pages.json from the migration crawl output (migration/extracted/), which is
 * gitignored and regenerable. In a fresh clone that crawl output is absent, so a
 * full rebuild would strip the committed content. This script instead edits the
 * existing pages.json in place — image fields only — so re-hosting can be applied
 * without needing the crawl. build-content.mjs also applies the same map (via
 * localImage()) so a future full re-crawl produces the same local paths.
 *
 * Idempotent: paths already pointing at /images/articles/ are left untouched.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const httpsify = (u = '') => u.replace(/^http:\/\//i, 'https://');
const stripQuery = (u = '') => u.split('?')[0].split('#')[0];

async function main() {
  const pages = JSON.parse(await readFile(join(ROOT, 'content', 'pages.json'), 'utf8'));
  const map = JSON.parse(await readFile(join(ROOT, 'content', 'image-map.json'), 'utf8'));

  const localImage = (u = '') => {
    if (!u) return u;
    if (u.startsWith('/images/')) return u; // already local
    return map[stripQuery(httpsify(u))] || u; // fall back to original if not mapped
  };

  let rewritten = 0, unmapped = 0;
  for (const p of pages) {
    for (const key of ['heroImage', 'ogImage']) {
      const before = p[key];
      if (!before || !/squarespace/i.test(before)) continue;
      const after = localImage(before);
      if (after !== before) { p[key] = after; rewritten++; }
      else unmapped++;
    }
  }

  await writeFile(join(ROOT, 'content', 'pages.json'), JSON.stringify(pages, null, 2));
  console.log(`Rewrote ${rewritten} image field(s) to local paths. ${unmapped} left remote (unmapped).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
