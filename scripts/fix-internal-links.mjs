#!/usr/bin/env node
/**
 * fix-internal-links.mjs — repoints internal links that aim at a URL which 301s.
 *
 * Linking internally to a redirect is a slow leak: it spends crawl budget on a hop that
 * resolves nowhere, dilutes the anchor signal, and (on hub pages, which are built from
 * curated link lists) renders a card for a page the visitor will never actually land on.
 * Six rounds of content consolidation left 21 of these behind.
 *
 * This resolves each link to the FINAL destination by following the redirect map to a
 * fixed point, then:
 *   - drops the link entirely if it would now point at the page it sits on (a self-link),
 *   - drops it if the same destination is already linked in that section (a duplicate),
 *   - otherwise rewrites the path in place, keeping the curated title.
 *
 * Run: node scripts/fix-internal-links.mjs [--dry]
 * The equivalent check runs in scripts/seo-qa.mjs, which fails on any link to a redirect.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DRY = process.argv.includes('--dry');

const cfg = await readFile(join(ROOT, 'next.config.mjs'), 'utf8');
const REDIRECTS = new Map(
  [...cfg.matchAll(/\{\s*source:\s*'([^']+)',\s*destination:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
);

/** Follow the redirect map to its fixed point (guards against an accidental cycle). */
function resolve(path) {
  let cur = path;
  const seen = new Set();
  while (REDIRECTS.has(cur)) {
    if (seen.has(cur)) throw new Error(`redirect cycle at ${cur}`);
    seen.add(cur);
    cur = REDIRECTS.get(cur);
  }
  return cur;
}

const pagesPath = join(ROOT, 'content', 'pages.json');
const pages = JSON.parse(await readFile(pagesPath, 'utf8'));
const byPath = new Map(pages.map((p) => [p.path, p]));

/**
 * The title a link should carry once repointed. A curated title describes the page it was
 * written for, so after a repoint it can actively mislead ("The definitive guide to Bondi's
 * best restaurants" pointing at the directory collection). Prefer the destination's own
 * heading; fall back to the curated title when the destination is a code route we cannot
 * read here (the dining collections are titled from their registry, so those are covered
 * by the explicit map below).
 */
const COLLECTION_TITLES = {
  '/bondi-eat-and-drink/best-restaurants-bondi-beach': 'The best restaurants in Bondi Beach',
  '/bondi-eat-and-drink/best-cafes-bondi-beach': 'The best cafés in Bondi',
  '/bondi-eat-and-drink/best-bars-bondi-beach': 'The best bars in Bondi',
  '/bondi-eat-and-drink/breakfast-brunch-bondi-beach': 'The best breakfast & brunch in Bondi',
  '/bondi-eat-and-drink/cheap-eats-bondi-beach': 'The best cheap eats in Bondi',
  '/bondi-eat-and-drink/vegan-vegetarian-bondi-beach': 'Vegan & vegetarian in Bondi',
  '/bondi-eat-and-drink/waterfront-dining-bondi-beach': 'Beachfront & ocean-view dining',
  '/bondi-eat-and-drink/pubs-bondi-beach': 'The best Bondi pubs',
  '/itineraries': 'Bondi itineraries: a few hours to a full day',
  '/things-to-do-in-bondi': 'Things to do in Bondi',
  '/where-to-swim-at-bondi-beach': 'Where to swim at Bondi Beach',
  '/stay': 'Where to stay in Bondi',
  '/stay/hostels-bondi-beach': 'Hostels in Bondi Beach',
  '/whats-on': "What's on in Bondi",
  '/bondi-weather': 'Bondi weather & when to visit',
  '/start-here': 'Start here: first-time visitor guide',
};

function titleFor(target, fallback) {
  if (COLLECTION_TITLES[target]) return COLLECTION_TITLES[target];
  const p = byPath.get(target);
  const t = (p?.h1 || p?.title || '').replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').trim();
  return t || fallback;
}

let rewritten = 0, dropped = 0, retitled = 0;
for (const page of pages) {
  for (const section of page.sections || []) {
    if (!Array.isArray(section.links)) continue;
    const kept = [];
    const seenTargets = new Set();
    for (const link of section.links) {
      const target = resolve(link.path);

      // Dedupe applies to EVERY link, not just repointed ones: a repoint can collide with
      // a link that was already correct, which would leave two cards on the same target.
      if (seenTargets.has(target)) {
        console.log(`  drop (duplicate)  ${page.path} § ${section.heading}: ${link.path} -> ${target}`);
        dropped++;
        continue;
      }
      if (target === page.path) {
        console.log(`  drop (self-link)  ${page.path} § ${section.heading}: ${link.path} -> ${target}`);
        dropped++;
        continue;
      }

      seenTargets.add(target);
      if (target === link.path) { kept.push(link); continue; }

      const title = titleFor(target, link.title);
      if (title !== link.title) retitled++;
      console.log(`  repoint           ${page.path} § ${section.heading}: ${link.path} -> ${target}`);
      if (title !== link.title) console.log(`      retitle: "${link.title}" -> "${title}"`);
      kept.push({ ...link, title, path: target });
      rewritten++;
    }
    section.links = kept;
  }
}

if (!DRY) {
  await writeFile(pagesPath, JSON.stringify(pages, null, 1) + '\n');
}
console.log(`\n${DRY ? '[dry run] ' : ''}repointed ${rewritten} (retitled ${retitled}), dropped ${dropped} hub link(s).`);
