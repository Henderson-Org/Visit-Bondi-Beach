#!/usr/bin/env node
/**
 * crawl-inventory.mjs — Phase-2 extraction crawler for the VisitBondiBeach migration.
 *
 * Reads migration/current-site-inventory.json and fetches every live URL, extracting
 * full per-page metadata + content signals so the new site is built from real data,
 * never from memory. Dependency-free (Node 18+ built-in fetch). Non-destructive:
 * read-only GET requests against the live Squarespace site, politely rate-limited.
 *
 * Usage:
 *   node migration/scripts/crawl-inventory.mjs            # crawl all URLs
 *   node migration/scripts/crawl-inventory.mjs --limit 20 # first 20 (smoke test)
 *   node migration/scripts/crawl-inventory.mjs --only core-page,blog-post-dated
 *
 * Output:
 *   migration/extracted/pages/<safe-slug>.json   # one record per URL
 *   migration/extracted/pages-index.json          # combined summary array
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');                       // migration/
const OUT = join(ROOT, 'extracted');
const UA = 'Mozilla/5.0 (compatible; vbb-migration-audit/1.0; read-only)';
const DELAY_MS = 800;                                // be polite to the live site

const args = process.argv.slice(2);
const getArg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const limit = getArg('--limit') ? parseInt(getArg('--limit'), 10) : Infinity;
const only = getArg('--only') ? getArg('--only').split(',') : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- tiny HTML helpers (regex-based; good enough for metadata extraction) ---
const dec = (s = '') => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&#8217;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&').trim();
const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')); return m ? dec(m[1]) : ''; };
const metaBy = (html, key, val) => {
  const re = new RegExp(`<meta[^>]*${key}\\s*=\\s*["']${val}["'][^>]*>`, 'i');
  const m = html.match(re); return m ? attr(m[0], 'content') : '';
};
const firstTag = (html, tag) => { const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')); return m ? dec(m[1].replace(/<[^>]+>/g, ' ')) : ''; };
const allTags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map((m) => dec(m[1].replace(/<[^>]+>/g, ' '))).filter(Boolean);

function extract(url, status, html) {
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const canonical = (head.match(/<link[^>]*rel=["']canonical["'][^>]*>/i) || [''])[0];
  const jsonld = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => { try { return JSON.parse(m[1]); } catch { return { _unparsed: m[1].slice(0, 200) }; } });
  const images = [...html.matchAll(/<img[^>]*>/gi)].map((m) => ({ src: attr(m[0], 'src') || attr(m[0], 'data-src'), alt: attr(m[0], 'alt') }))
    .filter((i) => i.src);
  const links = [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi)].map((m) => dec(m[1]));
  const internal = links.filter((h) => h.startsWith('/') || h.includes('visitbondibeach.com'));
  const external = links.filter((h) => /^https?:\/\//i.test(h) && !h.includes('visitbondibeach.com'));
  return {
    url, status,
    title: firstTag(head, 'title'),
    metaDescription: metaBy(head, 'name', 'description'),
    canonical: canonical ? attr(canonical, 'href') : '',
    robots: metaBy(head, 'name', 'robots'),
    h1: allTags(html, 'h1'),
    h2: allTags(html, 'h2'),
    og: { title: metaBy(head, 'property', 'og:title'), description: metaBy(head, 'property', 'og:description'), image: metaBy(head, 'property', 'og:image'), url: metaBy(head, 'property', 'og:url'), type: metaBy(head, 'property', 'og:type') },
    twitter: { card: metaBy(head, 'name', 'twitter:card'), title: metaBy(head, 'name', 'twitter:title'), description: metaBy(head, 'name', 'twitter:description'), image: metaBy(head, 'name', 'twitter:image') },
    wordCount: bodyText ? bodyText.split(' ').length : 0,
    jsonLdTypes: jsonld.flatMap((j) => (Array.isArray(j) ? j : [j]).map((x) => x && x['@type']).filter(Boolean)),
    jsonLd: jsonld,
    imageCount: images.length,
    images: images.slice(0, 60),
    imagesMissingAlt: images.filter((i) => !i.alt).length,
    internalLinkCount: internal.length,
    externalLinkCount: external.length,
    externalLinks: [...new Set(external)].slice(0, 60),
    contentPreview: bodyText.slice(0, 500),
  };
}

const safe = (u) => u.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 120);

async function main() {
  const inv = JSON.parse(await readFile(join(ROOT, 'current-site-inventory.json'), 'utf8'));
  let targets = inv.filter((r) => !only || only.includes(r.content_type)).slice(0, limit);
  await mkdir(join(OUT, 'pages'), { recursive: true });
  console.log(`Crawling ${targets.length} URLs (delay ${DELAY_MS}ms)…`);
  const index = [];
  let n = 0;
  for (const row of targets) {
    n++;
    try {
      const res = await fetch(row.url, { headers: { 'user-agent': UA }, redirect: 'manual' });
      const status = res.status;
      const html = status < 300 ? await res.text() : '';
      const rec = status < 300 ? extract(row.url, status, html) : { url: row.url, status, redirectLocation: res.headers.get('location') || '' };
      rec.content_type = row.content_type;
      await writeFile(join(OUT, 'pages', `${safe(row.url)}.json`), JSON.stringify(rec, null, 2));
      index.push({ url: row.url, status, content_type: row.content_type, title: rec.title || '', h1: (rec.h1 && rec.h1[0]) || '', wordCount: rec.wordCount || 0, jsonLdTypes: rec.jsonLdTypes || [], imagesMissingAlt: rec.imagesMissingAlt ?? null });
      console.log(`[${n}/${targets.length}] ${status} ${row.url}`);
    } catch (e) {
      index.push({ url: row.url, status: 'ERROR', error: String(e) });
      console.warn(`[${n}/${targets.length}] ERROR ${row.url}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }
  await writeFile(join(OUT, 'pages-index.json'), JSON.stringify(index, null, 2));
  console.log(`\nDone. Wrote ${index.length} records to migration/extracted/`);
}
main().catch((e) => { console.error(e); process.exit(1); });
