#!/usr/bin/env node
/**
 * build-protected-manifest.mjs — turn the YTD analytics into a machine-readable SEO
 * protection manifest, and CROSS-CHECK every protected URL against the site's current
 * redirect/noindex state so we can flag any protected page that is already being
 * consolidated (which needs explicit approval per the protection brief).
 *
 * Output: seo-protected-pages.json  (+ a console conflict report).
 * URLs were matched to the analytics titles by inspecting actual page titles, not guessed.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const arr = JSON.parse(readFileSync('content/pages.json', 'utf8'));
const byPath = new Map(arr.map((e) => [e.path, e]));
const cfg = readFileSync('next.config.mjs', 'utf8');
const redirects = new Map([...cfg.matchAll(/source:\s*['"]([^'"]+)['"],\s*destination:\s*['"]([^'"]+)['"]/g)].map((m) => [m[1], m[2]]));

// Analytics YTD → verified production URL (confirmed against real page titles).
// priority: 1 = Tier-1 critical, 2 = very high, 3 = proven traffic.
const PROTECTED = [
  { url: '/bondi-blog/bondi-rescue-who-are-the-lifeguards', name: 'Who Are The Lifeguards', views: 3452, share: 13.32, priority: 1 },
  { url: '/bondi-blog/2023/9/5/20-obscure-facts-about-bondi-rescue', name: '20 Obscure Facts About Bondi Rescue', views: 200, share: 0.77, priority: 3 },
  { url: '/bondi-blog/2025/1/12/the-20-most-dramatic-moments-on-bondi-rescue', name: '20 Most Dramatic Moments', views: 247, share: 0.95, priority: 3 },
  { url: '/bondi-blog/2025/4/30/bondi-icebergs-ocean-pool-faq-20-essential-questions-answered-hours-fees-membership-more', name: 'Bondi Icebergs Ocean Pool FAQ', views: 841, share: 3.25, priority: 1 },
  { url: '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool', name: 'Can anyone swim at Bondi Icebergs', views: 534, share: 2.06, priority: 1 },
  { url: '/bondi-blog/2023/10/4/finding-free-parking-at-bondi-beach-made-easy', name: 'Finding Free Parking at Bondi', views: 720, share: 2.78, priority: 1 },
  { url: '/bondi-blog/2025/4/25/ultimate-bondi-beach-parking-guide-free-and-paid-options-for-busy-days', name: 'Ultimate Bondi Beach Parking Guide', views: 415, share: 1.60, priority: 2 },
  { url: '/bondi-blog/2025/6/4/tamarama-coogee-clovelly-beach-parking-ultimate-guide-to-free-paid-spots', name: 'Tamarama, Coogee & Clovelly Parking', views: 448, share: 1.73, priority: 2 },
  { url: '/bondi-blog/2023/11/20/an-insiders-guide-to-finding-a-car-park-at-bronte-beach', name: "Insider's guide to finding a car park (Bronte)", views: 886, share: 3.42, priority: 1 },
  { url: '/bondi-blog/city2surf-results', name: 'City2Surf Results', views: 603, share: 2.33, priority: 1 },
  { url: '/bondi-blog/2024/4/1/city2surf-course-map', name: 'City2Surf Course Map', views: 300, share: 1.16, priority: 2 },
  { url: '/bondi-blog/where-to-go-afterparty-city-to-surf', name: 'City2Surf After-party', views: 278, share: 1.07, priority: 2 },
  { url: '/bondi-blog/ultimate-guide-city-to-surf', name: 'City2Surf Ultimate Runners Guide', views: 451, share: 1.74, priority: 2 },
  { url: '/bondi-blog/2024/3/19/bondis-best-running-routes', name: "Bondi's best running routes", views: 461, share: 1.78, priority: 2 },
  { url: '/bondi-blog/sunrise-sunset-bondi', name: 'Best Sunrise and Sunset', views: 373, share: 1.44, priority: 2 },
  { url: '/bondi-blog/2024/9/12/why-bondi-beach-is-so-famous-history-fame-and-culture', name: 'Why Bondi Beach is So Famous', views: 291, share: 1.12, priority: 2 },
  { url: '/bondi-blog/2023/10/18/bondi-beach-etiquette-guide', name: 'Bondi Beach etiquette guide', views: 287, share: 1.11, priority: 3 },
  { url: '/bondi-blog/2025/5/6/kids-eat-free-in-sydneys-eastern-suburbs-12-family-friendly-dining-deals', name: 'Kids Eat Free', views: 257, share: 0.99, priority: 3 },
  { url: '/bondi-blog/2024/8/28/average-sea-temperatures-at-bondi-beach-month-by-month-guide', name: 'Average Sea Temperatures', views: 227, share: 0.88, priority: 2 },
  { url: '/bondi-blog/2023/9/11/can-you-fly-a-drone-at-bondi-beach-the-dos-and-donts-of-aerial-photography', name: 'Fly a Drone at Bondi', views: 204, share: 0.79, priority: 3 },
  { url: '/bondi-blog/bondi-icebergs-brand-takeover-ranked', name: 'Best brand takeovers at Bondi', views: 188, share: 0.73, priority: 3 },
  { url: '/bondi-blog/2024/9/8/is-it-safe-to-swim-at-bondi-beach-a-complete-guide', name: 'Is it Safe to Swim at Bondi Beach', views: 171, share: 0.66, priority: 2 },
  { url: '/bondi-blog/2025/1/5/catch-the-waves-live-bondi-beach-surf-cam', name: 'Catch the Waves Live (surf cam)', views: 144, share: 0.56, priority: 2 },
  { url: '/bondi-blog/2025/4/27/top-10-bondi-cafs-in-2025-best-coffee-brunch-by-the-beach', name: 'Top 10 Bondi Cafés', views: 142, share: 0.55, priority: 2 },
  { url: '/bondi-blog/2023/11/16/insiders-guide-to-the-bronte-ocean-pool', name: 'Insider Guide to the Bronte ocean pool', views: 139, share: 0.54, priority: 3 },
  { url: '/bondi-blog/2025/1/20/locals-guide-to-free-bbq-spots-at-bondi-bronte-tamarama', name: 'Free BBQ spots', views: 129, share: 0.50, priority: 3 },
  { url: '/bondi-blog/2024/9/18/guide-to-metal-detecting-at-bondi-beach', name: 'Metal Detecting at Bondi', views: 128, share: 0.49, priority: 3 },
  { url: '/bondi-blog/2025/4/25/10-must-try-bondi-beach-bars-backed-in-2025', name: '10 Must-Try Bondi Beach Bars', views: 120, share: 0.46, priority: 3 },
  { url: '/bondi-blog/bondi-commonly-asked-questions', name: 'Bondi Bible (top 20 questions)', views: 118, share: 0.46, priority: 3 },
  { url: '/bondi-blog/2023/12/13/christmas-day-at-bondi-beach', name: 'Christmas Day at Bondi Beach', views: 108, share: 0.42, priority: 3 },
  { url: '/bondi-blog/2025/5/23/rain-or-shine-7-must-do-indoor-activities-in-bondi-beach-on-a-rainy-day', name: 'Rain or Shine (indoor activities)', views: 90, share: 0.35, priority: 3 },
  { url: '/visit-bondi-beach', name: 'About Visit Bondi Beach', views: 89, share: 0.34, priority: 3 },
  { url: '/bondi-blog/what-to-do-bondi-beach-travel-guide', name: 'What To Do In Bondi Beach', views: 465, share: 1.79, priority: 2 },
  { url: '/bondi-blog/best-accommodation-bondi-beach', name: 'Accommodation (blog)', views: 130, share: 0.50, priority: 2 },
  { url: '/bondi-blog/2025/7/19/insider-guide-to-sundays-bondi-opening-hours-top-flavours-queue-hacks', name: 'Insider Guide to Sundays Bondi', views: 353, share: 1.36, priority: 2 },
  { url: '/where-to-swim-at-bondi-beach', name: 'Swimming at Bondi Beach (hub)', views: 849, share: 3.28, priority: 1, note: 'Analytics title "Swimming at Bondi Beach" — CONFIRM: could be a distinct swimming article.' },
  { url: '/bondi-blog/2025/4/25/must-experience-bondi-restaurants-our-top-10-best-restaurants-ranked', name: 'Must Experience Bondi Restaurants', views: 134, share: 0.52, priority: 2 },
];

// Ambiguous analytics rows — candidate URLs (all protected until confirmed).
const NEEDS_CONFIRM = [
  { name: 'Visit Bondi Beach - Ultimate… (2075 views, 8.01%)', candidates: [
    '/bondi-blog/2026/2/21/the-ultimate-bondi-beach-travel-guide-2026-edition',
    '/bondi-blog/2025/4/30/ultimate-bondi-beach-travel-guide-how-to-get-there-when-to-visit-top-things-to-do',
    '/bondi-blog/2025/3/8/the-ultimate-bondi-beach-travel-guide-must-see-spots-hidden-gems',
  ] },
  { name: "An Insider's Guide To Bondi… (490 views)", candidates: [] },
  { name: '2025 City To Surf Beginner’s… (376 views)', candidates: [
    '/bondi-blog/2025/5/6/10-things-you-need-to-know-before-running-the-city2surf',
  ] },
  { name: 'Getting to Bondi Beach From… (227 views)', candidates: [
    '/getting-to-bondi', '/bondi-blog/2024/9/7/getting-to-sydney-marathon-from-bondi-beach',
  ] },
];

// Redirects on protected pages that YOU have explicitly approved (documented exceptions).
const APPROVED_REDIRECTS = {
  '/bondi-blog/2025/4/25/must-experience-bondi-restaurants-our-top-10-best-restaurants-ranked': {
    to: '/bondi-blog/best-restaurants-bondi-beach',
    approvedOn: '2026-08-11',
    reason: 'Same-intent consolidation onto the stronger "best restaurants in Bondi" page. Owner-approved.',
  },
};

// Build the manifest + conflict report.
const manifest = [];
const conflicts = [];
for (const p of PROTECTED) {
  const page = byPath.get(p.url);
  const redirected = redirects.has(p.url);
  const indexable = page ? page.indexable !== false : null;
  const approved = APPROVED_REDIRECTS[p.url];
  const status = redirected ? `REDIRECT -> ${redirects.get(p.url)}` : indexable === false ? 'NOINDEX' : page ? 'live/indexable' : 'NOT-IN-PAGES.JSON';
  if (approved) {
    manifest.push({
      url: p.url, pageName: p.name, priority: p.priority, ytdPageviews: p.views, trafficShare: p.share,
      allowRedirect: true, approvedRedirectTo: approved.to, approvedOn: approved.approvedOn, reason: approved.reason,
      expectedIndexable: false, expectedCanonical: `https://www.visitbondibeach.com${approved.to}`,
    });
    continue;
  }
  manifest.push({
    url: p.url, pageName: p.name, priority: p.priority, ytdPageviews: p.views, trafficShare: p.share,
    allowRedirect: false, expectedIndexable: true, expectedCanonical: `https://www.visitbondibeach.com${p.url}`,
    ...(p.note ? { note: p.note } : {}),
  });
  if (redirected || indexable === false || page == null) {
    conflicts.push({ url: p.url, name: p.name, views: p.views, status });
  }
}

writeFileSync('seo-protected-pages.json', JSON.stringify({
  generated: '2026-08-11',
  note: 'Protected high-traffic URLs (YTD analytics). allowRedirect=false — do not redirect/noindex without explicit approval.',
  pages: manifest,
  needsConfirmation: NEEDS_CONFIRM,
}, null, 2) + '\n');

console.log(`Protected pages: ${manifest.length}`);
console.log(`\n⚠ CONFLICTS — protected pages NOT in a clean live/indexable state (${conflicts.length}):`);
for (const c of conflicts) console.log(`  [${c.views} views] ${c.url}\n      -> ${c.status}`);
if (!conflicts.length) console.log('  none — every protected page is live + indexable.');
