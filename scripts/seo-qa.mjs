#!/usr/bin/env node
/**
 * seo-qa.mjs — automated SEO QA over the content index (brief §50, §52).
 * Flags duplicate titles, missing/duplicate meta descriptions, missing H1/title,
 * over-long titles, thin pages, and reports indexability counts.
 *
 * Usage: node scripts/seo-qa.mjs         (report)
 *        node scripts/seo-qa.mjs --strict (exit 1 if any error-level issue)
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const norm = (t = '') => t.replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').trim().toLowerCase();

function group(pages, keyFn) {
  const m = new Map();
  for (const p of pages) {
    const k = keyFn(p);
    if (!k) continue;
    (m.get(k) || m.set(k, []).get(k)).push(p);
  }
  return [...m.entries()].filter(([, v]) => v.length > 1);
}

async function main() {
  const pages = JSON.parse(await readFile(join(ROOT, 'content', 'pages.json'), 'utf8'));
  // Authored bodies replace the original crawled content, so pages.json's `wordCount` is
  // stale for them (it still describes the pre-rewrite page). The runtime overlays the
  // override's count (lib/content.ts), so QA must read the same value the site renders -
  // otherwise fully-rewritten articles are reported as thin and real thin pages get lost
  // in the noise.
  let overrides = {};
  try {
    overrides = JSON.parse(await readFile(join(ROOT, 'content', 'body-overrides.json'), 'utf8'));
  } catch {
    /* bodies not built yet - fall back to pages.json counts */
  }
  for (const p of pages) {
    const ov = overrides[p.path];
    if (ov && typeof ov.wordCount === 'number') p.wordCount = ov.wordCount;
  }
  const indexable = pages.filter((p) => p.indexable);
  const issues = { error: [], warn: [] };

  // Duplicate titles / descriptions among indexable pages
  for (const [t, v] of group(indexable, (p) => norm(p.title)))
    issues.error.push(`Duplicate title (${v.length}×): "${t}" — ${v.map((x) => x.path).join(', ')}`);
  for (const [, v] of group(indexable.filter((p) => p.metaDescription), (p) => p.metaDescription.trim().toLowerCase()))
    issues.warn.push(`Duplicate meta description (${v.length}×): ${v.map((x) => x.path).join(', ')}`);

  // Per-page checks
  for (const p of indexable) {
    if (!p.title) issues.error.push(`Missing <title>: ${p.path}`);
    if (!p.h1) issues.warn.push(`Missing H1: ${p.path}`);
    if (!p.metaDescription) issues.warn.push(`Missing meta description: ${p.path}`);
    if (p.title && norm(p.title).length > 60) issues.warn.push(`Title >60 chars: ${p.path}`);
    if (p.wordCount && p.wordCount < 150 && p.contentType !== 'blog-index')
      issues.warn.push(`Thin page (<150 words): ${p.path} (${p.wordCount}w)`);
  }

  // --- Internal links must not point at a URL that 301s ---
  // Linking internally to a redirect spends crawl budget on a hop that resolves nowhere,
  // dilutes the anchor signal, and renders a hub card for a page the visitor never lands
  // on. Six rounds of consolidation left 21 of these behind before this check existed;
  // scripts/fix-internal-links.mjs repairs them.
  const cfg = await readFile(join(ROOT, 'next.config.mjs'), 'utf8');
  const redirectSources = new Set(
    [...cfg.matchAll(/\{\s*source:\s*'([^']+)',\s*destination:\s*'([^']+)'/g)].map((m) => m[1]),
  );
  for (const p of pages) {
    for (const s of p.sections || []) {
      for (const l of s.links || []) {
        if (redirectSources.has(l.path))
          issues.error.push(`Hub link to a redirected URL: ${p.path} § ${s.heading} → ${l.path}`);
        if (l.path === p.path)
          issues.error.push(`Hub link to itself: ${p.path} § ${s.heading}`);
      }
    }
  }
  // In-body markdown links on pages that actually render (a redirected page's body never does).
  for (const [path, ov] of Object.entries(overrides)) {
    if (redirectSources.has(path)) continue;
    for (const m of JSON.stringify(ov).matchAll(/\]\((\/[^)"\s]+)\)/g)) {
      if (redirectSources.has(m[1]))
        issues.error.push(`Body link to a redirected URL: ${path} → ${m[1]}`);
    }
  }

  // --- A protected page must never be redirected or de-indexed ---
  // seo-protected-pages.json records the owner's policy for the site's highest-traffic
  // URLs, with YTD pageview evidence. That evidence is NOT in content/pages.json, whose
  // Search Console impressions are near-zero site-wide post-migration — so a consolidation
  // decision made on impressions alone can look safe while removing a page with real
  // traffic. This check is the backstop: it caught three such redirects on pages carrying
  // 142, 120 and 130 YTD pageviews.
  let protectedPages = [];
  try {
    protectedPages = (JSON.parse(await readFile(join(ROOT, 'seo-protected-pages.json'), 'utf8')).pages || [])
      .filter((p) => p.allowRedirect === false);
  } catch { /* manifest optional */ }
  // An acknowledgedRedirects entry records a protected page the owner has since agreed to
  // redirect. It is deliberately explicit: overriding this policy should be a decision
  // someone wrote down, not a silent edit to the redirect list.
  let acknowledged = new Set();
  try {
    const manifest = JSON.parse(await readFile(join(ROOT, 'seo-protected-pages.json'), 'utf8'));
    acknowledged = new Set(manifest.acknowledgedRedirects || []);
  } catch { /* manifest optional */ }
  const byPath = new Map(pages.map((p) => [p.path, p]));
  for (const prot of protectedPages) {
    if (redirectSources.has(prot.url) && !acknowledged.has(prot.url)) {
      issues.error.push(
        `Protected page is redirected (allowRedirect:false, ${prot.ytdPageviews} YTD views): ${prot.url}`,
      );
    }
    const page = byPath.get(prot.url);
    if (prot.expectedIndexable && page && !page.indexable && !acknowledged.has(prot.url)) {
      issues.error.push(
        `Protected page is not indexable (expectedIndexable, ${prot.ytdPageviews} YTD views): ${prot.url}`,
      );
    }
  }

  const missingDesc = indexable.filter((p) => !p.metaDescription).length;
  console.log('— SEO QA report —');
  console.log(`Total pages:        ${pages.length}`);
  console.log(`Indexable:          ${indexable.length}`);
  console.log(`Noindex (tags etc): ${pages.length - indexable.length}`);
  console.log(`Missing meta desc:  ${missingDesc}/${indexable.length}`);
  console.log(`\nErrors: ${issues.error.length}   Warnings: ${issues.warn.length}\n`);
  issues.error.slice(0, 50).forEach((m) => console.log(`  ✖ ${m}`));
  if (issues.error.length > 50) console.log(`  … +${issues.error.length - 50} more errors`);
  issues.warn.slice(0, 30).forEach((m) => console.log(`  ⚠ ${m}`));
  if (issues.warn.length > 30) console.log(`  … +${issues.warn.length - 30} more warnings`);

  if (strict && issues.error.length) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
