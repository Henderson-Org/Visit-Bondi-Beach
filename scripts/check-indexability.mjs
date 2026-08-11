#!/usr/bin/env node
/**
 * check-indexability.mjs — post-deploy smoke test for the ONE operational single-point-of-failure
 * on this site: whole-site indexability + robots.txt hinge on NEXT_PUBLIC_IS_PRODUCTION=true
 * (lib/site.ts). If that env var is missing on the production deploy, robots.txt flips to
 * `Disallow: /` and every page emits `noindex` — silently de-indexing the entire site.
 *
 * This asserts, against a running/deployed origin, that:
 *   1. /robots.txt contains `Allow: /` and does NOT globally `Disallow: /`
 *   2. the homepage HTML does NOT carry a `noindex` robots meta
 *   3. the homepage canonical points at the production host
 *
 * Usage (run after any production deploy):
 *   BASE=https://www.visitbondibeach.com node scripts/check-indexability.mjs
 *   BASE=http://localhost:3000 node scripts/check-indexability.mjs   # against a local prod build
 *
 * Exit code is non-zero on any failure so it can gate/alert a deploy.
 */
import { execFileSync } from 'node:child_process';

const BASE = (process.env.BASE || 'https://www.visitbondibeach.com').replace(/\/$/, '');
const PROD_HOST = 'https://www.visitbondibeach.com';

function get(path) {
  try {
    return execFileSync('curl', ['-sS', '-L', BASE + path], { encoding: 'utf8', timeout: 20000, maxBuffer: 20 * 1024 * 1024 });
  } catch {
    return '';
  }
}

const problems = [];

// 1. robots.txt
const robots = get('/robots.txt');
if (!robots) problems.push('/robots.txt could not be fetched');
else {
  if (!/allow:\s*\/\s*$/im.test(robots) && !/allow:\s*\//i.test(robots)) problems.push('/robots.txt is missing an `Allow: /` rule');
  // A global `Disallow: /` (with nothing after the slash) means the whole site is blocked.
  if (/^\s*disallow:\s*\/\s*$/im.test(robots)) problems.push('/robots.txt has a global `Disallow: /` — the site is blocked (NEXT_PUBLIC_IS_PRODUCTION likely unset)');
}

// 2 + 3. homepage
const home = get('/');
if (!home) problems.push('homepage could not be fetched');
else {
  const robotsMeta = (home.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
  if (/noindex/i.test(robotsMeta)) problems.push(`homepage robots meta is "${robotsMeta}" (noindex — the site would be de-indexed)`);
  const canon = (home.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i) || [])[1] || '';
  if (!canon) problems.push('homepage has no canonical link');
  else if (!canon.startsWith(PROD_HOST)) problems.push(`homepage canonical is "${canon}" (not the production host ${PROD_HOST})`);
}

console.log(`Indexability check against ${BASE}\n${'─'.repeat(56)}`);
if (problems.length === 0) {
  console.log('✓ robots.txt allows crawling · homepage is indexable · canonical on prod host');
  process.exit(0);
}
for (const p of problems) console.log(`  ✖ ${p}`);
console.log(`\n✖ ${problems.length} indexability problem(s) — the production deploy may be de-indexed.`);
process.exit(1);
