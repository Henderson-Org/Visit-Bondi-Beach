#!/usr/bin/env node
/**
 * score-opportunities.mjs — build the Top 100 SEO/AEO opportunity list for the
 * VisitBondiBeach.com Dominance Plan from a curated opportunity set drawn from the
 * nine audit workstreams (audit/01..09). Scoring is a transparent weighted model so
 * the ranking is reproducible, not hand-waved.
 *
 * Weighted score (0–100) = Σ (weight_i × factor_i / 5), factors scored 1–5:
 *   t traffic-potential 20 · c commercial-value 15 · r ranking-probability 20 ·
 *   a AI-answer-usefulness 15 · o topical-authority 15 · b backlink-potential 8 ·
 *   s strategic-importance 7          (weights sum to 100)
 *
 * type ∈ Create | Upgrade | Merge | Redirect | Tool | Directory | Technical | Schema | Commercial
 * Output: audit/top-100-opportunities.csv  (+ console Top 30).
 */
import { writeFileSync } from 'node:fs';

const W = { t: 20, c: 15, r: 20, a: 15, o: 15, b: 8, s: 7 };
// [name, type, cluster, t,c,r,a,o,b,s]
const OPS = [
  ['Parking hub (/bondi-parking) above the 4 parking winners', 'Create', 'Architecture', 5,2,5,3,5,3,5],
  ['Complete the Bondi→Coogee coastal-walk cluster (pillar + 5 spokes + link web)', 'Create', 'Coastal', 4,3,5,4,5,5,5],
  ['Bondi Coffee Price Index — annual flagship dataset (/bondi-coffee-price-index)', 'Tool', 'Research', 3,2,4,4,4,5,5],
  ['Turn on Travelpayouts affiliate tracking (env markers) on /stay CTAs', 'Commercial', 'Commercial', 2,5,1,1,2,1,5],
  ['/bondi-map interactive layered facilities map (flagship link magnet)', 'Tool', 'Features', 3,3,4,4,4,5,5],
  ['Promote /where-to-swim to a full Swim hub (Pools/Safety/Conditions)', 'Upgrade', 'Architecture', 5,2,4,4,4,3,4],
  ['Named authors + bios + /team pages + Person schema (@id → Bondi place)', 'Schema', 'E-E-A-T', 2,1,4,4,4,2,5],
  ['Consolidate the 6-page "ultimate Bondi travel guide" cannibal cluster', 'Merge', 'Cannibalization', 4,2,4,3,5,2,4],
  ['Add `answer` + `table` block types + renderers (AEO substrate)', 'Create', 'AEO', 3,2,4,5,4,2,5],
  ['Guard NEXT_PUBLIC_IS_PRODUCTION + post-deploy indexability smoke check', 'Technical', 'Technical', 2,2,1,2,3,1,5],
  ['City2Surf & Running hub — rescue orphaned Sydney Marathon pages', 'Create', 'Architecture', 4,2,5,3,4,3,4],
  ['Surf lessons editorial guide (decision layer above Viator/GYG)', 'Create', 'Gap', 3,5,5,4,3,2,4],
  ['Bondi accessibility guide (wheelchair/matting/step-free) — moat + links', 'Create', 'Gap', 3,2,5,4,4,5,4],
  ['Consolidate the Icebergs "can you swim / access / hours" swarm (~8 pages)', 'Merge', 'Cannibalization', 4,2,4,5,4,2,4],
  ['Viator + GetYourGuide provider adapter (tours/surf revenue)', 'Commercial', 'Commercial', 2,5,2,1,3,1,4],
  ['Bondi vs CBD "where to stay" decision page', 'Create', 'Gap', 3,5,4,4,3,2,4],
  ['Safety cluster AEO retrofit (12 Qs: answer-first + FAQ + source)', 'Upgrade', 'AEO', 4,1,5,5,4,2,4],
  ['Homepage: 12-hub front-door grid + plan band + footer mega-nav', 'Upgrade', 'Architecture', 3,3,3,2,5,2,5],
  ['Surf schools directory (/bondi-surf-schools) on the venue template', 'Directory', 'Directory', 2,5,4,3,4,2,4],
  ['Expand best-restaurants-bondi-beach survivor BEFORE it absorbs redirects', 'Upgrade', 'Cannibalization', 3,4,4,3,4,2,4],
  ['Defend & expand the Bondi Rescue moat (site’s #1 topic, 3,452 views)', 'Upgrade', 'Moat', 5,2,5,3,4,3,4],
  ['Coastal-walk TouristAttraction + HowTo schema', 'Schema', 'Schema', 3,2,4,4,4,3,4],
  ['Parking cluster AEO retrofit (options table + free-spot FAQ)', 'Upgrade', 'AEO', 4,1,5,5,4,2,3],
  ['Dog-friendly Bondi guide (rules + nearby dog beaches + cafes)', 'Create', 'Gap', 3,2,5,4,3,2,3],
  ['Canonical swim-safety hub (rips/flags/patrol/bluebottles/sharks)', 'Upgrade', 'Moat', 4,1,5,5,4,3,3],
  ['Ocean-pool guide + closure/status tracker (Icebergs/Bronte)', 'Tool', 'Features', 4,2,4,4,4,4,3],
  ['ItemList schema on ranked "best X" articles (AI top-N surface)', 'Schema', 'Schema', 3,3,4,4,3,2,3],
  ['Rewrite the 36 over-length titles (≤60ch, keyword-first) for CTR', 'Technical', 'Technical', 4,2,3,2,3,1,3],
  ['Noindex the 6 legacy category pages + remove old-site escape link', 'Technical', 'Technical', 2,1,3,1,4,1,4],
  ['Strengthen /things-to-do-in-bondi to actually rank p1 for the head term', 'Upgrade', 'Moat', 4,3,4,3,4,2,4],
  ['Transport AEO retrofit — airport→Bondi options table', 'Upgrade', 'AEO', 3,3,4,5,3,2,3],
  ['Render lastReviewed + sources visibly on fact-bearing pages', 'Upgrade', 'AEO', 2,1,3,4,3,1,4],
  ['/bondi-luggage-storage utility page (Bounce/Stasher affiliate)', 'Create', 'Gap', 2,4,5,4,2,2,3],
  ['"Is Bondi worth visiting?" consideration/persuasion page', 'Create', 'Gap', 3,1,5,4,3,2,3],
  ['Itineraries hub (feeds the /plan Day Planner)', 'Create', 'Architecture', 3,3,3,4,4,2,4],
  ['Remove the shared generic venue image from Restaurant schema (integrity)', 'Schema', 'Integrity', 1,1,2,1,3,1,4],
  ['Bondi rules cluster (alcohol-free zones/BBQ/dogs/drones/fishing)', 'Merge', 'AEO', 3,1,4,5,4,2,3],
  ['Surfing hub (/bondi-surfing) — thin now, high commercial intent', 'Create', 'Architecture', 2,4,4,3,4,2,4],
  ['Bondi vs Manly (and vs Coogee/Bronte) comparison hub', 'Upgrade', 'Gap', 3,2,5,4,3,3,3],
  ['Icebergs cluster AEO retrofit (definitional + volatile-price handling)', 'Upgrade', 'AEO', 4,2,4,5,4,2,3],
  ['Coastal-walk dataset & map (segment times/gradient/steps/access)', 'Tool', 'Research', 3,2,4,4,4,5,4],
  ['freshnessClass field + scripts/freshness-audit.mjs + calendar', 'Technical', 'Freshness', 2,1,3,3,3,1,4],
  ['"Last locally checked: [date]" visible convention (volatile classes)', 'Upgrade', 'Freshness', 3,1,4,4,3,2,4],
  ['Standalone: toilets & facilities along the Bondi→Coogee walk', 'Create', 'Coastal', 3,1,5,5,4,3,3],
  ['Standalone: cafes to eat before/after the coastal walk', 'Create', 'Coastal', 3,4,4,4,3,2,3],
  ['GA4 outbound-click + sub_id capture (per-page revenue attribution)', 'Commercial', 'Commercial', 1,4,1,1,2,1,4],
  ['Newsletter capture (compounding owned audience) — start early', 'Commercial', 'Commercial', 1,3,1,1,3,2,4],
  ['Weddings / proposals / functions lead-gen page', 'Create', 'Gap', 2,5,4,3,3,2,3],
  ['fieldNote block convention (signed/dated first-hand observation)', 'Create', 'E-E-A-T', 2,1,3,4,3,2,4],
  ['Activities / experiences directory + affiliate feed', 'Directory', 'Directory', 3,5,3,3,4,2,4],
  ['/stay directory-style surfacing + affiliate CTAs (P0 revenue)', 'Upgrade', 'Commercial', 3,5,3,2,3,2,4],
  ['Fill Klook activity affiliate placeholders (board hire/photo walk/tour)', 'Commercial', 'Commercial', 1,4,1,1,2,1,3],
  ['Deep seasonal weather + sea-temp extension (rainfall/wind/storm)', 'Upgrade', 'Moat', 3,1,4,4,4,3,3],
  ['Standalone: coastal-walk accessibility (step-free, matting, ramps)', 'Create', 'Coastal', 3,1,5,4,4,5,4],
  ['Affiliate disclosure component (layout + inline on CTAs)', 'Commercial', 'Commercial', 1,3,1,1,2,1,4],
  ['Consolidate swim-safety / where-to-swim cannibal cluster', 'Merge', 'Cannibalization', 4,1,4,4,4,2,3],
  ['Add /coogee-beach location page (coastal-walk terminus)', 'Create', 'Architecture', 2,1,3,3,3,2,3],
  ['Add /clovelly-beach location page (coastal-walk stop)', 'Create', 'Architecture', 2,1,3,3,3,2,3],
  ['Expand city2surf-course-map stub (55w) before it absorbs equity', 'Upgrade', 'Cannibalization', 3,1,4,3,3,2,3],
  ['Kids/family hub consolidation (scattered kids posts → /bondi-with-kids)', 'Upgrade', 'Architecture', 3,2,4,3,4,2,3],
  ['nofollow noopener on every link to the old Squarespace liveUrl', 'Technical', 'Technical', 1,1,2,1,4,1,3],
  ['Systematize 4–6 self-contained FAQs per practical page + FAQPage', 'Upgrade', 'AEO', 3,1,4,5,3,2,4],
  ['"Where to swim right now" flags/rip live safety map', 'Tool', 'Features', 3,1,4,4,3,4,3],
  ['Baseline AI-citation measurement (74-question panel, all engines)', 'Technical', 'Measurement', 1,1,1,3,2,1,4],
  ['Grouped 6-heading mega-nav (replace flat 8-item nav)', 'Upgrade', 'Architecture', 2,2,2,1,4,1,4],
  ['Thin/zero-demand consolidation pass (~52 pages: 301 or noindex)', 'Technical', 'Cannibalization', 2,1,3,2,3,1,3],
  ['Active-water experiences (SUP/kayak/scuba/bike/yoga) commercial pages', 'Create', 'Gap', 2,4,3,3,3,2,3],
  ['Markets definitive guide (Farmers Sat / Markets Sun / seasonal)', 'Merge', 'Moat', 2,2,4,3,3,2,2],
  ['Bondi film & TV locations map (Bondi Rescue tourism)', 'Create', 'Gap', 2,2,4,3,3,3,3],
  ['HubView + /articles ItemList completeness (real item objects)', 'Schema', 'Schema', 2,1,3,3,3,1,2],
  ['Fix 2 garbage Squarespace slugs (REPLACE + 301)', 'Redirect', 'Cannibalization', 1,1,3,1,3,1,2],
  ['Dataset JSON-LD helper (backs BCPI + coastal dataset)', 'Schema', 'Schema', 2,1,3,4,3,4,3],
  ['Restaurant booking CTAs (surface existing bookingUrl on venue pages)', 'Commercial', 'Commercial', 1,3,1,1,2,1,2],
  ['Original photography program + internal capture manifest', 'Create', 'E-E-A-T', 2,1,3,3,3,3,3],
  ['Internal-link orphan fix (marathon/coastal 0-view protected pages)', 'Upgrade', 'Architecture', 2,1,3,2,4,1,4],
  ['Sitemap lastModified on STATIC_ROUTES (hubs/money pages)', 'Technical', 'Technical', 1,1,2,1,3,1,2],
  ['Footer: add Coastal Walk + Weather + Rescue hubs (sitewide anchors)', 'Technical', 'Architecture', 2,1,2,1,4,1,3],
  ['Getting-there / transport small-batch merges (nearest-station etc.)', 'Merge', 'Cannibalization', 2,1,3,3,3,2,3],
  ['Standalone: Sculpture by the Sea (seasonal Oct–Nov)', 'Create', 'Coastal', 3,2,4,3,3,3,3],
  ['Standalone: whale watching on the coast (seasonal May–Nov)', 'Create', 'Coastal', 3,3,4,3,3,3,3],
  ['Attractions directory from locations.ts (beaches/pools/landmarks)', 'Directory', 'Directory', 2,2,3,3,4,2,3],
  ['EV charging / wifi / practical-services utility page', 'Create', 'Gap', 1,1,5,4,2,1,2],
  ['Bondi event calendar — structured, embeddable feed', 'Tool', 'Features', 2,2,3,3,3,3,3],
  ['Water-temperature year dataset + chart (fold into weather hub)', 'Tool', 'Research', 2,1,3,3,3,3,2],
  ['Cheapest-eats-in-Bondi index (BCPI companion, cost-of-living)', 'Tool', 'Research', 2,2,3,3,3,3,2],
  ['Accommodation blog → /stay interlink (keep, don’t redirect protected)', 'Upgrade', 'Cannibalization', 2,4,3,2,3,1,3],
  ['Best-of collection pages: add FAQPage + ordered ItemList', 'Schema', 'Schema', 2,2,3,4,3,2,2],
  ['Sunrise/sunset & golden-hour calculator (photographer-shareable)', 'Tool', 'Features', 2,1,3,3,3,3,2],
  ['Weather/temperature cannibal tidy (broken-slug redirects)', 'Redirect', 'Cannibalization', 2,1,3,3,3,1,2],
  ['Bondi-with-kids facilities map layer (playgrounds/shade/change)', 'Tool', 'Features', 2,2,3,3,3,3,3],
  ['Monthly measurement dashboard + report cadence', 'Technical', 'Measurement', 1,2,1,2,2,1,4],
  ['Fitness / yoga / pilates directory (P2, keep-fresh gate)', 'Directory', 'Directory', 2,2,3,2,3,2,2],
  ['"What’s changed since last time" required section on recommendation pages', 'Upgrade', 'Freshness', 2,2,3,4,3,2,3],
  ['Sunday’s Bondi / secret-eats freshness cadence (beat listicle publishers)', 'Upgrade', 'Moat', 2,3,3,3,3,2,3],
  ['verify-script "uniquely-useful" gate for each new directory category', 'Technical', 'Directory', 1,1,1,1,2,1,3],
  ['WebSite @id + SearchAction (only if real search ships) + Org logo', 'Schema', 'Schema', 1,1,2,2,2,1,2],
  ['bluebottle / marine-stinger season tracker (seasonal press hook)', 'Tool', 'Research', 2,1,3,3,3,3,2],
  ['howToJsonLd helper (rip-escape, Totti’s booking, C2S training)', 'Schema', 'AEO', 2,1,3,4,2,1,2],
  ['Are-Airbnb-legal / accommodation-legality explainer (distinct query)', 'Upgrade', 'Gap', 1,2,4,3,2,1,2],
  ['Airport transfers product in the activities/affiliate feed', 'Commercial', 'Commercial', 2,3,2,1,2,1,2],
  ['Icebergs entity sameAs (Wikipedia/official) on sub-entity', 'Schema', 'Schema', 1,1,3,3,3,2,2],
  ['Premium/sponsored-listing system with a hard editorial firewall', 'Commercial', 'Commercial', 1,4,1,1,2,1,3],
];

const rows = OPS.map((o) => {
  const [name, type, cluster, t, c, r, a, oo, b, s] = o;
  const score = W.t*t/5 + W.c*c/5 + W.r*r/5 + W.a*a/5 + W.o*oo/5 + W.b*b/5 + W.s*s/5;
  return { name, type, cluster, t, c, r, a, o: oo, b, s, score: Math.round(score * 10) / 10 };
});
rows.sort((x, y) => y.score - x.score);

const esc = (v) => { const s = String(v); return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const head = ['rank','score','type','cluster','opportunity','traffic','commercial','rankWin','aiUseful','topicalAuth','backlink','strategic'];
const out = [head.join(',')];
rows.forEach((r, i) => out.push([i+1, r.score, r.type, r.cluster, r.name, r.t, r.c, r.r, r.a, r.o, r.b, r.s].map(esc).join(',')));
writeFileSync('audit/top-100-opportunities.csv', out.join('\n') + '\n');

console.log(`Scored ${rows.length} opportunities. Weights: t${W.t} c${W.c} r${W.r} a${W.a} o${W.o} b${W.b} s${W.s}\n`);
console.log('RANK  SCORE  TYPE        OPPORTUNITY');
rows.slice(0, 30).forEach((r, i) => console.log(String(i+1).padStart(3), String(r.score).padStart(6), (r.type+'').padEnd(11), r.name));
const byType = {}; rows.forEach(r => byType[r.type] = (byType[r.type]||0)+1);
console.log('\nType mix:', Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join('  '));
