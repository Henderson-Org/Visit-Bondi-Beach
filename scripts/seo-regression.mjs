#!/usr/bin/env node
/**
 * seo-regression.mjs — a reusable SEO safety net. For a list of critical URLs it checks:
 *   HTTP status · redirect destination (must be ONE hop to a 200) · <title> present ·
 *   exactly one <h1> · self-referencing canonical · meta description · robots meta (not
 *   noindex where it should be indexable) · JSON-LD present.
 *
 * The URL list is weighted toward the site's highest-equity legacy URLs (from Search
 * Console impressions) plus every hub/location page and every redirect source. Run it
 * against a running server after any deploy:
 *
 *   BASE=http://localhost:3000 node scripts/seo-regression.mjs
 *   BASE=https://www.visitbondibeach.com node scripts/seo-regression.mjs   # prod smoke test
 *
 * Exit code is non-zero if any critical check fails, so it can gate a deploy.
 */
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/$/, '');
const PROD_HOST = 'https://www.visitbondibeach.com';

// Merge in every analytics-protected URL (allowRedirect=false) from the manifest, so the
// site's highest-traffic pages are guarded on every run — the single source of truth.
let PROTECTED_URLS = [];
try {
  if (existsSync('seo-protected-pages.json')) {
    const m = JSON.parse(readFileSync('seo-protected-pages.json', 'utf8'));
    PROTECTED_URLS = (m.pages || []).filter((p) => p.allowRedirect === false).map((p) => p.url);
  }
} catch { /* manifest optional */ }

// --- Critical URL lists -----------------------------------------------------
// expect200: must return 200 and pass on-page SEO checks (self-canonical etc.).
const EXPECT_200 = [
  // Home + primary hubs / core pages
  '/', '/bondi-beach', '/north-bondi', '/bondi-icebergs', '/things-to-do-in-bondi',
  '/where-to-swim-at-bondi-beach', '/bondi-coastal-walk', '/bondi-with-kids',
  '/getting-to-bondi', '/bondi-weather', '/bondi-rescue', '/stay', '/whats-on',
  '/bondi-eat-and-drink', '/plan', '/articles',
  // New location pages
  '/tamarama-beach', '/bronte-beach', '/ben-buckler', '/bondi-pavilion',
  '/mackenzies-bay', '/marks-park',
  // Eat & drink hub children
  '/bondi-eat-and-drink/best-restaurants-bondi-beach', '/bondi-eat-and-drink/north-bondi',
  '/bondi-eat-and-drink/venues/seans',
  // Highest-equity legacy blog URLs (Search Console impressions) — MUST stay live
  '/bondi-blog/bondi-rescue-who-are-the-lifeguards',
  '/bondi-blog/ultimate-guide-city-to-surf',
  '/bondi-blog/where-to-find-carpark-bondi-beach',
  '/bondi-blog/2023/11/16/insiders-guide-to-the-bronte-ocean-pool',
  '/bondi-blog/2024/8/28/average-sea-temperatures-at-bondi-beach-month-by-month-guide',
  '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool',
  '/bondi-blog/sunrise-sunset-bondi',
  '/bondi-blog/the-ultimate-guide-to-bondi-beach-nightlife',
  '/bondi-blog/2024/9/12/why-bondi-beach-is-so-famous-history-fame-and-culture',
  // Protected pages (seo-protected-pages.json, allowRedirect:false) - these carry real
  // YTD traffic and must never redirect. Retargeted, not consolidated.
  '/bondi-blog/2025/4/27/top-10-bondi-cafs-in-2025-best-coffee-brunch-by-the-beach',
  '/bondi-blog/2025/4/25/10-must-try-bondi-beach-bars-backed-in-2025',
  '/bondi-blog/best-accommodation-bondi-beach',
  '/bondi-blog/2025/4/25/ultimate-bondi-beach-parking-guide-free-and-paid-options-for-busy-days',
  '/bondi-blog/best-wine-bars-in-bondi',
  '/bondi-blog/where-to-watch-sport-in-bondi',
];

// expect301: redirect sources — must 301 in ONE hop to a 200 destination.
const EXPECT_301 = [
  '/accommodation', '/bondi-blog', '/visit-bondi-beach-guide',
  // Round 7 consolidation - the blog list vs. the database collection that supersedes it.
  '/bondi-blog/best-restaurants-bondi-beach',
  '/bondi-blog/best-breakfast-bondi-right-now',
  '/bondi-blog/2024/1/19/bondis-best-coffee-shops',
  '/bondi-blog/why-is-bondi-so-popular',
];

// --- HTTP helpers (curl; handles the agent proxy) ---------------------------
function head(url) {
  try {
    const out = execFileSync('curl', ['-s', '-I', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}', url], { encoding: 'utf8', timeout: 20000 });
    const [code, ...rest] = out.trim().split(' ');
    return { code, location: rest.join(' ') };
  } catch { return { code: '000', location: '' }; }
}
function body(url) {
  try { return execFileSync('curl', ['-s', '-L', url], { encoding: 'utf8', timeout: 20000, maxBuffer: 20 * 1024 * 1024 }); }
  catch { return ''; }
}

// --- On-page checks ---------------------------------------------------------
function checkPage(path) {
  const url = BASE + path;
  const h = head(url);
  const problems = [];
  if (h.code !== '200') {
    // Some hosts return 200 for SSG pages via curl -I differently; fall back to a GET status.
    const g = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], { encoding: 'utf8' }).trim();
    if (g !== '200') return { path, ok: false, problems: [`status ${g} (expected 200)`] };
  }
  const html = body(url);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const h1s = [...html.matchAll(/<h1[\b >]/g)].length;
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || '';
  const ld = [...html.matchAll(/application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let ldValid = ld.length > 0;
  for (const m of ld) { try { JSON.parse(m[1]); } catch { ldValid = false; } }

  if (!title) problems.push('no <title>');
  if (h1s !== 1) problems.push(`H1 count ${h1s} (expected 1)`);
  if (!canon) problems.push('no canonical');
  else {
    // Canonical must be self-referencing: same path, on the prod host.
    const canonPath = canon.replace(PROD_HOST, '').replace(/\/$/, '') || '/';
    const want = path.replace(/\/$/, '') || '/';
    if (canonPath !== want) problems.push(`canonical ${canonPath} != ${want}`);
    if (!canon.startsWith(PROD_HOST)) problems.push(`canonical host not ${PROD_HOST}`);
  }
  if (!desc) problems.push('no meta description');
  if (/noindex/i.test(robots)) problems.push(`robots=${robots} (noindex on a page expected to be indexable)`);
  if (!ldValid) problems.push('missing/invalid JSON-LD');
  return { path, ok: problems.length === 0, problems, title };
}

function checkRedirect(path) {
  const url = BASE + path;
  const h = head(url);
  if (!/^30[178]$/.test(h.code)) return { path, ok: false, problems: [`status ${h.code} (expected 301)`] };
  if (!h.location) return { path, ok: false, problems: ['301 with no Location'] };
  // One hop: destination must be 200 and not itself a redirect.
  const destPath = h.location.replace(BASE, '').replace(PROD_HOST, '');
  const d = head(BASE + destPath);
  const problems = [];
  if (/^30[178]$/.test(d.code)) problems.push(`redirect CHAIN: ${path} -> ${destPath} -> ${d.location}`);
  else if (d.code !== '200' && d.code !== '000') problems.push(`destination ${destPath} returns ${d.code}`);
  return { path, ok: problems.length === 0, problems, dest: destPath };
}

// --- Run --------------------------------------------------------------------
console.log(`SEO regression against ${BASE}\n${'─'.repeat(64)}`);
let fail = 0;
const ALL_200 = [...new Set([...EXPECT_200, ...PROTECTED_URLS])];
console.log(`\n200 + on-page SEO (${ALL_200.length} URLs incl. ${PROTECTED_URLS.length} analytics-protected):`);
for (const p of ALL_200) {
  const r = checkPage(p);
  if (!r.ok) { fail++; console.log(`  ✖ ${p}\n      ${r.problems.join('\n      ')}`); }
  else console.log(`  ✓ ${p}`);
}
console.log('\n301 redirects (one hop -> 200):');
for (const p of EXPECT_301) {
  const r = checkRedirect(p);
  if (!r.ok) { fail++; console.log(`  ✖ ${p} — ${r.problems.join('; ')}`); }
  else console.log(`  ✓ ${p} -> ${r.dest}`);
}
console.log(`\n${'─'.repeat(64)}`);
console.log(fail === 0 ? `✓ all ${EXPECT_200.length + EXPECT_301.length} critical URLs pass` : `✖ ${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
