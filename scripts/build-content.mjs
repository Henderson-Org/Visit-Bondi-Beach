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
// Force image URLs to https (Squarespace serves some over http://static1.squarespace.com,
// which is mixed-content + not in next/image's allow-list otherwise).
const httpsify = (u = '') => u.replace(/^http:\/\//i, 'https://');

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

  // Full body content (structured blocks) from crawl-bodies.mjs, keyed by path.
  const bodyByPath = new Map();
  try {
    const bdir = join(ROOT, 'migration', 'extracted', 'bodies');
    for (const f of (await readdir(bdir)).filter((x) => x.endsWith('.json'))) {
      const rec = JSON.parse(await readFile(join(bdir, f), 'utf8'));
      if (rec.url && Array.isArray(rec.blocks) && rec.blocks.length) {
        bodyByPath.set(stripHost(rec.url), rec);
      }
    }
  } catch { /* bodies not crawled yet */ }

  // Editorial overrides (authored SEO title/description, indexability, etc.) merged
  // ON TOP of crawled data so hand-authored fields survive a re-crawl. Keyed by path.
  let overrides = {};
  try { overrides = JSON.parse(await readFile(join(ROOT, 'content', 'overrides.json'), 'utf8')); }
  catch { /* none yet */ }

  // Search-demand data (Search Console impressions/clicks per URL), keyed by path.
  // Powers demand-based homepage ranking; absent entries fall back to recency.
  let demand = {};
  try { demand = JSON.parse(await readFile(join(ROOT, 'content', 'search-demand.json'), 'utf8')); }
  catch { /* no demand data */ }

  const pages = [];
  let overrideCount = 0;
  let bodyCount = 0;
  for (const inv of inventory) {
    const ex = extractedByPath.get(inv.path) || {};
    const body = bodyByPath.get(inv.path);
    if (body) bodyCount++;
    const ov = overrides[inv.path] || {};
    if (Object.keys(ov).length) overrideCount++;
    const isTag = inv.content_type === 'tag';
    const indexable = !isTag && ex.status ? ex.status < 300 : !isTag;
    pages.push({
      path: inv.path,
      contentType: inv.content_type,
      section: inv.section,
      title: (ov.title || ex.title || '').trim(),
      metaDescription: (ov.metaDescription || ex.metaDescription || '').trim(),
      canonical: (ex.canonical || '').trim(),
      h1: (ov.h1 || (Array.isArray(ex.h1) ? ex.h1[0] : ex.h1) || '').trim(),
      headings: Array.isArray(ex.h2) ? ex.h2.slice(0, 20) : [],
      ogImage: httpsify(ex.og?.image || ''),
      heroImage: httpsify(
        ex.images?.find((i) => i.src && /squarespace/.test(i.src))?.src || ex.og?.image || ''
      ),
      intro: (ex.contentPreview || '').trim(),
      blocks: body?.blocks || null,
      wordCount: (body && body.words) || ex.wordCount || 0,
      jsonLdTypes: ex.jsonLdTypes || [],
      publishedAt: publishedFromPath(inv.path),
      lastmod: inv.lastmod || null,
      impressions: demand[inv.path]?.impressions || 0,
      clicks: demand[inv.path]?.clicks || 0,
      // Tag archives stay noindex,follow per the audit (thin auto-taxonomy).
      indexable: typeof ov.indexable === 'boolean' ? ov.indexable : isTag ? false : indexable,
      status: ex.status ?? null,
      liveUrl: `https://www.visitbondibeach.com${inv.path}`,
    });
  }

  // Authored net-new pages (hubs / new guides) — full records under content/authored/*.json.
  // These don't come from the crawl; they're first-class indexable pages.
  let authoredCount = 0;
  try {
    const adir = join(ROOT, 'content', 'authored');
    for (const f of (await readdir(adir)).filter((x) => x.endsWith('.json'))) {
      const rec = JSON.parse(await readFile(join(adir, f), 'utf8'));
      if (!rec.path) continue;
      authoredCount++;
      pages.push({
        path: rec.path,
        contentType: rec.contentType || 'hub',
        section: rec.section || 'guide',
        title: (rec.title || '').trim(),
        metaDescription: (rec.metaDescription || '').trim(),
        canonical: '',
        h1: (rec.h1 || rec.title || '').trim(),
        headings: rec.headings || [],
        ogImage: rec.ogImage || '',
        heroImage: rec.heroImage || '',
        intro: rec.intro || '',
        wordCount: rec.wordCount || 0,
        jsonLdTypes: [],
        publishedAt: rec.publishedAt || null,
        lastmod: rec.lastmod || null,
        indexable: rec.indexable !== false,
        status: 200,
        liveUrl: '',
        sections: rec.sections || null,
        authored: true,
      });
    }
  } catch { /* no authored dir yet */ }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2));
  if (authoredCount) console.log(`+ ${authoredCount} authored page(s).`);

  const withData = pages.filter((p) => p.title).length;
  console.log(`content/pages.json: ${pages.length} pages (${withData} with metadata, ${overrideCount} overrides, ${bodyCount} with full body).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
