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
