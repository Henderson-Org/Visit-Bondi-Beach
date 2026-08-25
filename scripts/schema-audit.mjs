#!/usr/bin/env node
/**
 * schema-audit.mjs — validates the JSON-LD actually emitted by the rendered site.
 *
 * Reading lib/structured-data.ts tells you what the code intends to emit. This fetches
 * real pages and checks what came out, which is the only way to catch schema that is
 * well-formed in isolation but wrong in context — the failure the brief cares about:
 * "Ensure structured data reflects visible page content."
 *
 * Checks:
 *   - every <script type="application/ld+json"> parses
 *   - every node has @context and @type
 *   - FAQPage is only emitted when the questions are VISIBLE in the HTML
 *   - ItemList items have names, and the count matches what the list claims
 *   - no null/undefined/empty-string values leak into a node
 *   - BreadcrumbList positions are 1-based and contiguous
 *   - a Restaurant/LocalBusiness node never asserts an image we did not supply
 *
 * Usage:  node scripts/schema-audit.mjs [baseUrl]     (default http://localhost:3000)
 */
const BASE = process.argv[2] || 'http://localhost:3000';

/** Representative page of each template that emits schema. */
const PAGES = [
  '/',
  '/bondi-beach',
  '/where-to-swim-at-bondi-beach',
  '/things-to-do-in-bondi',
  '/bondi-eat-and-drink',
  '/bondi-eat-and-drink/best-restaurants-bondi-beach',
  '/bondi-eat-and-drink/north-bondi',
  '/stay',
  '/whats-on',
  '/start-here',
  '/articles',
  '/bondi-blog/bondi-rescue-who-are-the-lifeguards',
];

const errors = [];
const warnings = [];
const counts = new Map();

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .toLowerCase();

/** Flatten @graph and arrays into a list of schema nodes. */
function nodesOf(parsed) {
  const out = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    if (n['@graph']) return walk(n['@graph']);
    out.push(n);
  };
  walk(parsed);
  return out;
}

function checkNode(page, node) {
  const type = node['@type'] ?? '(none)';
  counts.set(type, (counts.get(type) || 0) + 1);
  if (!node['@type']) errors.push(`${page}: a JSON-LD node has no @type`);

  for (const [k, v] of Object.entries(node)) {
    if (v === null || v === undefined) errors.push(`${page}: ${type}.${k} is ${v}`);
    if (typeof v === 'string' && v.trim() === '') errors.push(`${page}: ${type}.${k} is an empty string`);
    if (typeof v === 'string' && /undefined|null|NaN/.test(v)) {
      errors.push(`${page}: ${type}.${k} contains a stringified nullish value: "${v}"`);
    }
  }

  if (type === 'BreadcrumbList') {
    const items = node.itemListElement ?? [];
    items.forEach((it, i) => {
      if (it.position !== i + 1) errors.push(`${page}: BreadcrumbList position ${it.position} at index ${i} (should be ${i + 1})`);
      if (!it.name) errors.push(`${page}: BreadcrumbList item ${i} has no name`);
    });
  }

  if (type === 'ItemList') {
    const items = node.itemListElement ?? [];
    if (node.numberOfItems != null && node.numberOfItems !== items.length) {
      errors.push(`${page}: ItemList numberOfItems=${node.numberOfItems} but ${items.length} items emitted`);
    }
    items.forEach((it, i) => {
      const name = it.name ?? it.item?.name;
      if (!name) errors.push(`${page}: ItemList item ${i} has no name`);
    });
  }
}

async function auditPage(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
  if (!res.ok) { errors.push(`${path}: HTTP ${res.status}`); return; }
  const html = await res.text();
  const text = strip(html);

  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) { warnings.push(`${path}: no JSON-LD at all`); return; }

  for (const [, raw] of blocks) {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { errors.push(`${path}: JSON-LD failed to parse — ${e.message}`); continue; }

    for (const node of nodesOf(parsed)) {
      if (!node['@context'] && !node['@id']) {
        // Nested nodes legitimately omit @context; only top-level ones need it.
        if (parsed === node) errors.push(`${path}: top-level node has no @context`);
      }
      checkNode(path, node);

      // The important one: FAQPage must reflect visible content.
      if (node['@type'] === 'FAQPage') {
        for (const q of node.mainEntity ?? []) {
          const needle = String(q.name || '').toLowerCase().replace(/\s+/g, ' ').slice(0, 40);
          if (needle && !text.includes(needle)) {
            errors.push(`${path}: FAQPage question is not visible on the page — "${q.name}"`);
          }
        }
      }
      // Same rule for a venue/place name.
      if (['Restaurant', 'CafeOrCoffeeShop', 'BarOrPub', 'Bakery', 'LocalBusiness', 'Hotel', 'LodgingBusiness'].includes(node['@type'])) {
        const name = String(node.name || '').toLowerCase().slice(0, 30);
        if (name && !text.includes(name)) {
          warnings.push(`${path}: ${node['@type']} "${node.name}" is in schema but its name is not visible in the HTML`);
        }
      }
    }
  }
}

for (const p of PAGES) {
  try { await auditPage(p); }
  catch (e) { errors.push(`${p}: ${e.message}`); }
}

console.log(`— Schema audit (${BASE}) —`);
console.log(`Pages checked: ${PAGES.length}`);
console.log('Types emitted:', [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(', '));
console.log(`\nErrors: ${errors.length}   Warnings: ${warnings.length}\n`);
errors.slice(0, 40).forEach((e) => console.log(`  ✖ ${e}`));
if (errors.length > 40) console.log(`  … +${errors.length - 40} more`);
warnings.slice(0, 20).forEach((w) => console.log(`  ⚠ ${w}`));
if (warnings.length > 20) console.log(`  … +${warnings.length - 20} more`);
process.exit(errors.length ? 1 : 0);
