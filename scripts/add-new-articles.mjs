#!/usr/bin/env node
/**
 * add-new-articles.mjs — create new authored articles from the write-articles workflow.
 * Input: results JSON (arg) = [{path,title,metaDescription,h1,blocks,sources}].
 * Writes a content/bodies/<slug>.json body file AND appends a content/pages.json entry
 * for each (idempotent — updates in place if the path already exists). Never fabricates
 * images: uses the caller-provided hero map.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TODAY = '2026-08-11';
const ORIGIN = 'https://www.visitbondibeach.com';
const HERO = {
  '/bondi-blog/best-wine-bars-in-bondi': '/images/articles/43c111c6fc6a4817.webp',
  '/bondi-blog/where-to-watch-sport-in-bondi': '/images/articles/44e1ef7567545e3a.webp',
};

const SRC = process.argv[2];
const results = JSON.parse(readFileSync(SRC, 'utf8'));
const pagesPath = 'content/pages.json';
const pages = JSON.parse(readFileSync(pagesPath, 'utf8'));
const arr = Array.isArray(pages) ? pages : pages.pages;

const slugFromPath = (p) => p.split('/').filter(Boolean).pop();
const words = (blocks) => blocks.reduce((n, b) => {
  const t = b.text || (b.items || []).map((it) => (typeof it === 'string' ? it : `${it.label || ''}${it.value || ''}${it.q || ''}${it.a || ''}`)).join(' ') || '';
  return n + (t.trim() ? t.trim().split(/\s+/).length : 0);
}, 0);
const stripLinks = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '');

let created = 0;
for (const r of results) {
  const hero = HERO[r.path];
  if (!hero) { console.error('NO HERO for', r.path); continue; }
  const slug = slugFromPath(r.path);
  // 1) body file
  const body = { path: r.path, voice: 'first-person', lastReviewed: TODAY, sources: r.sources || [], title: r.title, blocks: r.blocks };
  writeFileSync(join('content/bodies', `${slug}.json`), JSON.stringify(body, null, 2) + '\n');
  // 2) pages.json entry
  const intro = stripLinks(r.blocks.find((b) => b.type === 'p')?.text || r.metaDescription).slice(0, 320);
  const entry = {
    path: r.path,
    contentType: 'blog-post-legacy',
    section: 'blog',
    title: r.title.includes('Visit Bondi Beach') ? r.title : `${r.title} — Visit Bondi Beach`,
    metaDescription: r.metaDescription,
    canonical: `${ORIGIN}${r.path}`,
    h1: r.h1,
    headings: r.blocks.filter((b) => b.type === 'h2').map((b) => b.text),
    ogImage: hero,
    heroImage: hero,
    intro,
    blocks: null,
    wordCount: words(r.blocks),
    jsonLdTypes: ['WebSite', 'Article'],
    publishedAt: null,
    lastmod: TODAY,
    impressions: 0,
    clicks: 0,
    indexable: true,
    status: 200,
    liveUrl: `${ORIGIN}${r.path}`,
  };
  const idx = arr.findIndex((e) => e.path === r.path);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...entry };
  else arr.push(entry);
  created++;
  console.log(`${idx >= 0 ? 'updated' : 'added'}: ${r.path} (${entry.wordCount}w, ${entry.headings.length} sections)`);
}

writeFileSync(pagesPath, JSON.stringify(arr, null, 2) + '\n');
console.log(`\n${created} article(s) written to content/bodies + content/pages.json`);
