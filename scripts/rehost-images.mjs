#!/usr/bin/env node
/**
 * rehost-images.mjs — self-hosts every article/OG image so the site no longer
 * depends on the Squarespace CDN (the owner is shutting Squarespace down).
 *
 * What it does:
 *  1. Reads content/pages.json and collects every unique heroImage/ogImage URL
 *     that points at a Squarespace host (query string stripped → the "base URL").
 *  2. Downloads each at ?format=1000w, following redirects (static1.squarespace.com
 *     301s to images.squarespace-cdn.com). Extension is derived from the response
 *     Content-Type, not the URL (the CDN commonly returns image/webp).
 *  3. Saves to public/images/articles/<hash>.<ext>, where <hash> is a stable
 *     sha1 of the base URL (so re-runs are idempotent and dedupe automatically).
 *  4. Writes content/image-map.json: { "<base URL>": "/images/articles/<hash>.<ext>" }.
 *     A base URL that fails to download is left out of the map so build-content
 *     falls back to the original remote URL.
 *
 * Re-runnable: images already present on disk (by hash) are skipped, so this can
 * be run again to pick up only newly added images.
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PAGES = join(ROOT, 'content', 'pages.json');
const OUT_IMG_DIR = join(ROOT, 'public', 'images', 'articles');
const MAP_OUT = join(ROOT, 'content', 'image-map.json');

const CONCURRENCY = 6;
const SIZE_PARAM = 'format=1000w';

const isSquarespace = (u = '') => /squarespace/i.test(u);
const stripQuery = (u = '') => u.split('?')[0].split('#')[0];
const hashOf = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16);

const EXT_BY_TYPE = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function extFromContentType(ct = '', baseUrl = '') {
  const type = ct.split(';')[0].trim().toLowerCase();
  if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
  // Fall back to the URL's own extension if the content-type is unhelpful.
  const m = baseUrl.match(/\.([a-zA-Z0-9]{2,4})$/);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

function withSizeParam(baseUrl) {
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}${SIZE_PARAM}`;
}

async function fileExists(p) {
  try { await stat(p); return true; } catch { return false; }
}

// Find an already-downloaded file for a given hash (any extension).
async function existingForHash(hash) {
  let entries = [];
  try { entries = await readdir(OUT_IMG_DIR); } catch { return null; }
  return entries.find((f) => f.startsWith(`${hash}.`)) || null;
}

async function download(baseUrl) {
  const res = await fetch(withSizeParam(baseUrl), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  const ext = extFromContentType(ct, baseUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error('empty body');
  return { ext, buf };
}

async function main() {
  const pages = JSON.parse(await readFile(PAGES, 'utf8'));

  // Collect unique base URLs (dedupe by base URL, not by hash — a hash could in
  // theory collide, but base-URL identity is what we key the map on).
  const bases = new Set();
  for (const p of pages) {
    for (const key of ['heroImage', 'ogImage']) {
      const u = p[key];
      if (u && isSquarespace(u)) bases.add(stripQuery(u));
    }
  }
  const list = [...bases];
  console.log(`Found ${list.length} unique Squarespace image URLs to re-host.`);

  await mkdir(OUT_IMG_DIR, { recursive: true });

  // Seed the map with any prior run (so a partial run can resume).
  let map = {};
  if (await fileExists(MAP_OUT)) {
    try { map = JSON.parse(await readFile(MAP_OUT, 'utf8')); } catch { map = {}; }
  }

  let downloaded = 0, skipped = 0, failed = 0;
  const failures = [];

  let idx = 0;
  async function worker() {
    while (idx < list.length) {
      const i = idx++;
      const base = list[i];
      const hash = hashOf(base);
      try {
        // Idempotent: reuse an already-downloaded file for this hash.
        const existing = await existingForHash(hash);
        if (existing) {
          map[base] = `/images/articles/${existing}`;
          skipped++;
          continue;
        }
        const { ext, buf } = await download(base);
        const filename = `${hash}.${ext}`;
        await writeFile(join(OUT_IMG_DIR, filename), buf);
        map[base] = `/images/articles/${filename}`;
        downloaded++;
        if (downloaded % 25 === 0) console.log(`  …${downloaded} downloaded`);
      } catch (err) {
        failed++;
        failures.push({ base, error: String(err.message || err) });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Deterministic key order for a clean diff.
  const sorted = {};
  for (const k of Object.keys(map).sort()) sorted[k] = map[k];
  await writeFile(MAP_OUT, JSON.stringify(sorted, null, 2) + '\n');

  console.log(`\nDone. downloaded=${downloaded} skipped(existing)=${skipped} failed=${failed}`);
  console.log(`image-map.json now has ${Object.keys(sorted).length} entries.`);
  if (failures.length) {
    console.log('\nFailures (left pointing at original remote URL):');
    for (const f of failures) console.log(`  ${f.base} — ${f.error}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
