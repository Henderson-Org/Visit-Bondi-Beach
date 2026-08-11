#!/usr/bin/env node
/**
 * add-location-pages.mjs — upsert content/pages.json entries for the location pages so they
 * route (via [...slug]), carry unique title/meta/canonical/OG, and appear in the sitemap.
 * The rich body is rendered by the LocationPage template from data/locations.ts; these entries
 * just carry the page-level metadata. Idempotent: updates in place if the path already exists.
 *
 * Reads the meta table below (kept here, not in the TS data module, to avoid importing TS).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGIN = 'https://www.visitbondibeach.com';
const TODAY = '2026-08-11';

const META = [
  {
    path: '/bondi-beach',
    title: 'Bondi Beach: Visitor Guide, Swimming, Parking & Getting There',
    metaDescription:
      'A local visitor guide to Bondi Beach — swimming and the flags, lifeguards, parking, buses, accessibility, the Icebergs pool and where to eat.',
    h1: 'Bondi Beach',
    heroImage: '/images/hero-bondi-sunrise.webp',
  },
  {
    path: '/north-bondi',
    title: 'North Bondi: Beach, Swimming, Cafés & Parking Guide',
    metaDescription:
      'North Bondi is the quieter northern end of Bondi Beach — calmer swimming, a children’s rock pool, a grassy reserve and good cafés. A local guide to visiting.',
    h1: 'North Bondi',
    heroImage: '/images/articles/e65a74989175e57e.webp',
  },
  {
    path: '/bondi-icebergs',
    title: 'Bondi Icebergs: Ocean Pool Visitor Guide',
    metaDescription:
      'Visiting the Bondi Icebergs ocean pool — public access and hours, the famous view, when it’s closed, how to get there and where to eat, from a local.',
    h1: 'Bondi Icebergs',
    heroImage: '/images/articles/f89e71f5c2cdf51f.webp',
  },
];

const pagesPath = 'content/pages.json';
const arr = JSON.parse(readFileSync(pagesPath, 'utf8'));

for (const m of META) {
  const entry = {
    path: m.path,
    contentType: 'core-page',
    section: 'core',
    title: m.title,
    metaDescription: m.metaDescription,
    canonical: `${ORIGIN}${m.path}`,
    h1: m.h1,
    headings: [],
    ogImage: m.heroImage,
    heroImage: m.heroImage,
    intro: m.metaDescription,
    blocks: null,
    wordCount: 0,
    jsonLdTypes: ['Place'],
    publishedAt: null,
    lastmod: TODAY,
    impressions: 0,
    clicks: 0,
    indexable: true,
    status: 200,
    liveUrl: `${ORIGIN}${m.path}`,
  };
  const idx = arr.findIndex((e) => e.path === m.path);
  if (idx >= 0) {
    // Preserve crawled impressions/clicks; refresh the presentational + meta fields.
    arr[idx] = { ...arr[idx], ...entry, impressions: arr[idx].impressions ?? 0, clicks: arr[idx].clicks ?? 0 };
    console.log('updated:', m.path);
  } else {
    arr.push(entry);
    console.log('added:  ', m.path);
  }
}

// Consolidate the thin, 0-impression /visit-bondi-beach-guide into the new /bondi-beach page.
const guide = arr.find((e) => e.path === '/visit-bondi-beach-guide');
if (guide) {
  guide.indexable = false;
  console.log('noindex: /visit-bondi-beach-guide (301 -> /bondi-beach in next.config)');
}

writeFileSync(pagesPath, JSON.stringify(arr, null, 2) + '\n');
console.log('done.');
