#!/usr/bin/env node
/**
 * crawl-bodies.mjs — captures full article BODY content from the live site as
 * SAFE STRUCTURED BLOCKS (not raw HTML) for faithful migration. Reads the main
 * content region, extracts ordered p/h2/h3/li/blockquote, decodes entities,
 * drops the title-duplicate and trailing Squarespace cruft (Likes/Previous/
 * email/share).
 *
 * Usage:
 *   node migration/scripts/crawl-bodies.mjs --limit 3
 *   node migration/scripts/crawl-bodies.mjs            # all articles + core pages
 * Output: migration/extracted/bodies/<safe>.json  { url, blocks:[{type,text}] }
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'extracted', 'bodies');
const UA = 'Mozilla/5.0 (compatible; vbb-migration-audit/1.0; read-only)';
const DELAY = 800;
const args = process.argv.slice(2);
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dec = (s = '') =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&#8217;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

const isCruft = (t) =>
  /\bLikes\b.*\b(Previous|Next)\b/i.test(t) ||
  /^\s*\d+\s+Likes/i.test(t) ||
  /@visitbondibeach\.com/i.test(t) ||
  /^(Share|Newsletter|Subscribe|Comments)\b/i.test(t) ||
  /What'?s On\s+Swim\s+Accommodation/i.test(t); // stray nav

function extractBlocks(html, title) {
  const m = html.search(/data-content-field="main-content"/);
  let region = m >= 0 ? html.slice(m) : html;
  region = region.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const blocks = [];
  const re = /<(h2|h3|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let mm;
  const t0 = (title || '').trim().toLowerCase();
  while ((mm = re.exec(region))) {
    const type = mm[1].toLowerCase();
    const text = dec(mm[2]);
    if (!text || text.length < 2) continue;
    if (isCruft(text)) break; // stop at trailing cruft
    if (text.toLowerCase() === t0) continue; // skip title duplicate
    blocks.push({ type: type === 'blockquote' ? 'quote' : type, text });
  }
  return blocks;
}

const safe = (u) => u.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 120);

async function main() {
  const inv = JSON.parse(await readFile(join(ROOT, 'current-site-inventory.json'), 'utf8'));
  let targets = inv.filter((r) => ['blog-post-dated', 'blog-post-legacy', 'core-page'].includes(r.content_type));
  targets = targets.slice(0, limit);
  await mkdir(OUT, { recursive: true });
  console.log(`Fetching bodies for ${targets.length} pages…`);
  let n = 0;
  for (const row of targets) {
    n++;
    try {
      const res = await fetch(row.url, { headers: { 'user-agent': UA } });
      const html = await res.text();
      const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleM ? dec(titleM[1]).replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '') : '';
      const blocks = extractBlocks(html, title);
      const words = blocks.reduce((a, b) => a + b.text.split(' ').length, 0);
      await writeFile(join(OUT, `${safe(row.url)}.json`), JSON.stringify({ url: row.url, blocks, words }, null, 2));
      console.log(`[${n}/${targets.length}] ${blocks.length} blocks / ${words}w  ${row.path}`);
    } catch (e) {
      console.warn(`[${n}/${targets.length}] ERROR ${row.path}: ${e.message}`);
    }
    await sleep(DELAY);
  }
  console.log('Done.');
}
main().catch((e) => { console.error(e); process.exit(1); });
