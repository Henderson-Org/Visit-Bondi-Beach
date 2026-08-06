#!/usr/bin/env node
/**
 * build-content.mjs — turns the raw migration crawl into the site's committed
 * content index (content/pages.json). Run after migration/scripts/crawl-inventory.mjs.
 *
 * Faithful-migration principle: we carry over the REAL title, meta description,
 * canonical, H1, heading outline, images and intro captured from the live site.
 * We never invent facts. Full article bodies are imported in a later pass; until
 * then article pages render the real outline + intro and link to the live original.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const EXTRACTED = join(ROOT, 'migration', 'extracted', 'pages');
const OUT_DIR = join(ROOT, 'content');

const stripHost = (u = '') => u.replace(/^https?:\/\/(www\.)?visitbondibeach\.com/i, '') || '/';

function publishedFromPath(path) {
  const m = path.match(/^\/bondi-blog\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

async function main() {
  const inventory = JSON.parse(await readFile(join(ROOT, 'migration', 'current-site-inventory.json'), 'utf8'));
  const byPath = new Map(inventory.map((r) => [r.path, r]));

  let files = [];
  try { files = (await readdir(EXTRACTED)).filter((f) => f.endsWith('.json')); }
  catch { console.warn('No migration/extracted/pages — run `npm run crawl` first. Building from inventory only.'); }

  const extractedByPath = new Map();
  for (const f of files) {
    try {
      const rec = JSON.parse(await readFile(join(EXTRACTED, f), 'utf8'));
      extractedByPath.set(stripHost(rec.url), rec);
    } catch {}
  }

  const pages = [];
  for (const inv of inventory) {
    const ex = extractedByPath.get(inv.path) || {};
    const isTag = inv.content_type === 'tag';
    const indexable = !isTag && ex.status ? ex.status < 300 : !isTag;
    pages.push({
      path: inv.path,
      contentType: inv.content_type,
      section: inv.section,
      title: (ex.title || '').trim(),
      metaDescription: (ex.metaDescription || '').trim(),
      canonical: (ex.canonical || '').trim(),
      h1: Array.isArray(ex.h1) ? ex.h1[0] || '' : ex.h1 || '',
      headings: Array.isArray(ex.h2) ? ex.h2.slice(0, 20) : [],
      ogImage: ex.og?.image || '',
      heroImage: ex.images?.find((i) => i.src && /squarespace-cdn/.test(i.src))?.src || ex.og?.image || '',
      intro: (ex.contentPreview || '').trim(),
      wordCount: ex.wordCount || 0,
      jsonLdTypes: ex.jsonLdTypes || [],
      publishedAt: publishedFromPath(inv.path),
      lastmod: inv.lastmod || null,
      // Tag archives stay noindex,follow per the audit (thin auto-taxonomy).
      indexable: isTag ? false : indexable,
      status: ex.status ?? null,
      liveUrl: `https://www.visitbondibeach.com${inv.path}`,
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2));

  const withData = pages.filter((p) => p.title).length;
  console.log(`content/pages.json: ${pages.length} pages (${withData} with crawled metadata, ${pages.length - withData} inventory-only).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
