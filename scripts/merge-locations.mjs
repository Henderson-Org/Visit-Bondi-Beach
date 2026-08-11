#!/usr/bin/env node
/**
 * merge-locations.mjs — take the research-workflow result and turn it into content:
 *  - validates every internal href against real routes (drops any invalid link),
 *  - assigns verified hero images where we have one (else leaves the page imageless),
 *  - writes data/locations-extra.json (the records the LocationPage template renders),
 *  - upserts content/pages.json metadata entries (title/description/canonical/OG/sitemap).
 * Never fabricates: only passes through what the agents returned, minus bad links.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = 'https://www.visitbondibeach.com';
const TODAY = '2026-08-11';
const SRC = process.argv[2];

// Verified hero images (viewed, not guessed). Locations absent here render imageless.
const HERO = {
  '/marks-park': { image: '/images/articles/d82aa2f9bb88082d.webp', alt: 'A Sculpture by the Sea artwork on the clifftop at Marks Park above the ocean at sunset' },
};

// SEO titles + descriptions for the pages.json metadata layer.
const META = {
  '/tamarama-beach': { title: 'Tamarama Beach: Sydney’s Small, Wild Cove (Visitor Guide)', desc: 'Tamarama is the small, dramatic cove between Bondi and Bronte — scenic but with a strong rip. A local guide to swimming safety, the park, parking and getting there.' },
  '/bronte-beach': { title: 'Bronte Beach: Ocean Pool, Park & Family Guide', desc: 'Bronte Beach — the family favourite with the Bronte Baths ocean pool, the Bogey Hole, a big picnic park and a café strip. A local guide to swimming, parking and transport.' },
  '/ben-buckler': { title: 'Ben Buckler: North Bondi’s Headland & Lookout', desc: 'Ben Buckler is the rocky point above North Bondi with sweeping views over Bondi Beach. A local guide to the lookout, walks, rock-fishing danger and getting there.' },
  '/bondi-pavilion': { title: 'Bondi Pavilion: Bondi Beach’s Cultural Centre', desc: 'The restored Bondi Pavilion is the heritage community and cultural centre on Bondi Beach — theatre, gallery, amenities and food. A local guide to visiting.' },
  '/mackenzies-bay': { title: 'Mackenzies Bay: Bondi’s Seasonal “Secret Beach”', desc: 'Mackenzies Bay is the tiny cove between Bondi and Tamarama where a sandy beach appears only sometimes. A local guide to the coastal-walk stop, with honest safety notes.' },
  '/marks-park': { title: 'Marks Park: Clifftop Views & Sculpture by the Sea', desc: 'Marks Park is the clifftop headland between Bondi and Tamarama — dramatic ocean views, whale watching and the home of Sculpture by the Sea. A local visitor guide.' },
};

const records = JSON.parse(readFileSync(SRC, 'utf8'));

// Build the set of valid internal link targets (existing pages + the new location paths).
const pages = JSON.parse(readFileSync('content/pages.json', 'utf8'));
const valid = new Set(pages.map((p) => p.path));
for (const r of records) valid.add(r.path);
// Known good app-route paths not necessarily in pages.json:
['/bondi-eat-and-drink', '/bondi-eat-and-drink/best-cafes-bondi-beach', '/bondi-eat-and-drink/waterfront-dining-bondi-beach',
 '/bondi-eat-and-drink/north-bondi', '/bondi-eat-and-drink/best-restaurants-bondi-beach', '/stay', '/whats-on', '/plan', '/articles',
 '/bondi-beach', '/north-bondi', '/bondi-icebergs'].forEach((p) => valid.add(p));

const dropped = [];
const keepValidLinks = (arr, kind, loc) =>
  (arr || []).filter((x) => {
    if (!x.href) return kind === 'nearby'; // nearby may be a plain-text place with no page
    if (valid.has(x.href)) return true;
    dropped.push(`${loc} ${kind}: ${x.href}`);
    return false;
  });

const out = [];
for (const r of records) {
  if (!r || !r.path) continue;
  const hero = HERO[r.path];
  const rec = {
    ...r,
    ...(hero ? { heroImage: hero.image, heroImageAlt: hero.alt } : {}),
    nearby: keepValidLinks(r.nearby, 'nearby', r.path),
    relatedGuides: keepValidLinks(r.relatedGuides, 'related', r.path),
    ...(r.nearbyFood ? { nearbyFood: { intro: r.nearbyFood.intro || '', links: keepValidLinks(r.nearbyFood.links, 'food', r.path) } } : {}),
    editorialNotes: [
      ...(r.editorialNotes || []),
      ...(hero ? [] : ['No verified hero image assigned yet — page renders with the plain editorial hero; add a checked image.']),
    ],
  };
  out.push(rec);
}

writeFileSync('data/locations-extra.json', JSON.stringify(out, null, 2) + '\n');

// pages.json metadata entries
for (const r of out) {
  const m = META[r.path];
  if (!m) { console.log('!! no META for', r.path); continue; }
  const hero = (HERO[r.path]?.image) || undefined;
  const entry = {
    path: r.path, contentType: 'core-page', section: 'core',
    title: m.title, metaDescription: m.desc, canonical: `${ORIGIN}${r.path}`,
    h1: r.name, headings: [], ogImage: hero, heroImage: hero, intro: m.desc,
    blocks: null, wordCount: 0, jsonLdTypes: ['Place'], publishedAt: null, lastmod: TODAY,
    impressions: 0, clicks: 0, indexable: true, status: 200, liveUrl: `${ORIGIN}${r.path}`,
  };
  const idx = pages.findIndex((e) => e.path === r.path);
  if (idx >= 0) pages[idx] = { ...pages[idx], ...entry }; else pages.push(entry);
}
writeFileSync('content/pages.json', JSON.stringify(pages, null, 2) + '\n');

console.log(`Wrote ${out.length} location records + pages.json entries.`);
if (dropped.length) { console.log(`Dropped ${dropped.length} invalid links:`); dropped.forEach((d) => console.log('  ' + d)); }
