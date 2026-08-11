#!/usr/bin/env node
/**
 * build-search-index.mjs — compiles a compact, static search index to
 * public/search-index.json for the client-side site search (components/SiteSearch.tsx).
 * The site is fully static, so search runs in the browser over this prebuilt index —
 * no server, no third-party search service.
 *
 * Sources (every entry is a REAL, indexable URL so search never links to a dead page):
 *  - content/pages.json: indexable pages (articles, hubs, core pages, location pages),
 *    excluding tag/category archives (noindex) and redirect sources.
 *  - data/restaurants.json: venues that earn a standalone page (whyGo > 40 chars + summary).
 *  - a small set of code-defined app routes (Stay, What's On, Eat & Drink, Planner, Coffee Index).
 *
 * Run as part of the build (npm run build:search); output is committed + served from /public.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const clean = (s) => (s || '').replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').replace(/&amp;/g, '&').replace(/&mdash;/g, '—').trim();
const catFor = (e) => {
  if (e.contentType === 'hub' || e.contentType === 'core-page') return 'Guide';
  if (e.contentType === 'blog-post-dated' || e.contentType === 'blog-post-legacy') return 'Article';
  return 'Page';
};

const pages = JSON.parse(readFileSync('content/pages.json', 'utf8'));
const entries = [];

for (const e of pages) {
  if (e.indexable === false) continue;
  if (e.contentType === 'tag' || e.contentType === 'category') continue;
  if (e.path === '/') continue;
  const title = clean(e.h1 || e.title);
  if (!title) continue;
  entries.push({
    t: title,
    p: e.path,
    c: catFor(e),
    k: `${title} ${clean(e.metaDescription)} ${e.section || ''}`.toLowerCase().slice(0, 200),
  });
}

// Venues with a standalone page (same rule as lib/restaurantGuide.hasVenuePage).
const restaurants = JSON.parse(readFileSync('data/restaurants.json', 'utf8'));
for (const r of restaurants) {
  if (r.status !== 'open') continue;
  if (!(r.whyGo && r.whyGo.length > 40 && r.summary)) continue;
  entries.push({
    t: r.name,
    p: `/bondi-eat-and-drink/venues/${r.id}`,
    c: 'Eat & drink',
    k: `${r.name} ${(r.cuisines || []).join(' ')} ${r.precinct || ''} ${r.type || ''} café restaurant`.toLowerCase(),
  });
}

// Code-defined app routes not present in pages.json.
const ROUTES = [
  { t: 'Where to stay in Bondi', p: '/stay', c: 'Guide', k: 'stay accommodation hotels hostels apartments where to stay' },
  { t: "What's On in Bondi", p: '/whats-on', c: 'Guide', k: 'events whats on markets festivals what to do' },
  { t: 'Bondi Eat & Drink', p: '/bondi-eat-and-drink', c: 'Guide', k: 'restaurants cafes bars eat drink food dining coffee' },
  { t: 'Plan your Bondi day', p: '/plan', c: 'Tool', k: 'plan itinerary day planner build my day' },
  { t: 'The Bondi Coffee Index', p: '/bondi-coffee-price-index', c: 'Data', k: 'coffee price index flat white cost cafe how much' },
  { t: 'All Bondi guides', p: '/articles', c: 'Guide', k: 'articles guides blog all' },
];
for (const r of ROUTES) {
  if (!entries.some((x) => x.p === r.p)) entries.push({ ...r, k: r.k.toLowerCase() });
}

// De-dupe by path, stable order (guides/routes first feel handled by client scoring anyway).
const seen = new Set();
const out = entries.filter((e) => (seen.has(e.p) ? false : (seen.add(e.p), true)));

writeFileSync('public/search-index.json', JSON.stringify(out));
console.log(`public/search-index.json: ${out.length} entries (${out.filter((e) => e.c === 'Article').length} articles, ${out.filter((e) => e.c === 'Eat & drink').length} venues, ${out.filter((e) => e.c === 'Guide').length} guides).`);
