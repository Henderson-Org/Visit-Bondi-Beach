# VisitBondiBeach.com Dominance Plan

**Prepared:** 2026-08-11 · **Method:** nine parallel specialist audits (technical SEO, content
inventory, keyword universe, competitors, architecture, AEO, schema, local-moat/research/links,
commercial/directory/map/measurement), reconciled into one plan. Every workstream was grounded in
the **real codebase** and the site's **first-party data** (Search Console impressions + YTD
pageview analytics), not assumptions.

> **Two ground-truth corrections that shape everything below.**
> 1. **This is not a Squarespace site.** VisitBondiBeach.com is a **Next.js 16 / React 19 /
>    TypeScript app on Vercel** (App Router, SSG+ISR). Every recommendation that a "Squarespace
>    brief" would file under *"maybe, if the CMS allows"* — custom schema, an interactive map, a
>    directory, dynamic visitor data, programmatic pages, per-page metadata, author entities — is
>    **fully buildable in-repo**. There is no migration question to resolve; the platform is
>    already the one you'd migrate *to*.
> 2. **Most of the "platform" already exists.** The audit repeatedly found that the hard
>    engineering is done: a live affiliate engine (`lib/affiliate.ts`), a 167-venue dining
>    directory, a canonical Bondi Beach entity in schema, a typed answer-first content pipeline
>    with FAQ schema, live weather/surf/water-temp panels, a Day Planner, and clean redirect
>    hygiene. **The dominant theme of this plan is *configure, consolidate and surface* — not
>    rebuild.**

Supporting datasets (this directory): `audit/01..09-*.md` (the nine full reports),
`audit/page-inventory.csv` (458 URLs), `audit/page-decisions.csv` (235 keep/merge/redirect
decisions), `audit/03-keyword-universe.csv` (316 queries), `audit/ai-answer-matrix.csv` (74
AI-answer targets), `audit/top-100-opportunities.csv` (scored & ranked), `seo-protected-pages.json`
(37 protected winners), `SEO_PROTECTED_PAGES.md`.

---

## 1. Executive summary

VisitBondiBeach.com is **much further along than a typical "audit me" site**. It already ranks p1
for a healthy spread of practical/experience Bondi queries, owns the Bondi Rescue topic outright,
runs a clean technical build, and ships a content pipeline and schema most competitors can't match.
The job is **not** to fix a broken site — it's to convert a strong, slightly-scattered blog into
the **canonical Bondi knowledge base**: consolidate proven spoke traffic under topic hubs, close a
short list of high-value gaps, systematise answer-engine formatting, switch on revenue that's
already wired, and build two or three genuinely link-worthy original assets.

**The single strategic idea:** *own the entity "Bondi Beach."* Every proven winner (lifeguards,
parking, Icebergs, coastal walk, City2Surf, swimming) should sit under a **hub that concentrates
its authority** and cross-links to its siblings — built **above** the winners, never replacing
them. The competitive opening is precise: the *official* council site (hellobondi.com.au) is
forbidden by charter from recommending a best anything, and the commercial SERPs are ceded wholesale
to OTAs with no editorial decision-layer. **A confident, genuinely-local editorial voice is the one
thing neither the council nor the aggregators can copy** — and it's exactly what visitors search for.

**Where the durable advantage comes from (in priority order):** (1) hub architecture over the
existing traffic; (2) an answer-first/AEO retrofit so the site becomes the *cited* source in AI
answers; (3) a named-author E-E-A-T moat + first-hand freshness that national publishers can't fake;
(4) one flagship original dataset (the Bondi Coffee Price Index) + an interactive Bondi map as
link magnets; (5) turning on the affiliate revenue that already exists, pointed at high-intent pages.

---

## 2. Current competitive position

- **Strengths:** effectively **owns Bondi Rescue** (multiple p1 results); ranks p1 on swim-safety,
  parking, Icebergs (2 results), cafés, whale-watching, best-time/weather, kids, coastal walk.
  Clean technical build; rich, integrity-safe schema; first-person local voice; a real content
  pipeline. These are not starting-from-zero conditions.
- **The real competitors** (not the assumed ones):
  - **hellobondi.com.au** — the *official* Waverley Council tourism site. Appears on nearly every
    practical SERP, current and authoritative. **But charter-bound to neutrality — it will never
    say which café/hotel/restaurant is best.** That is VBB's whole reason to exist.
  - **OTA / aggregator wall** (Booking, Expedia, Hotels.com, KAYAK; OpenTable/Yelp; Viator/
    GetYourGuide/Adrenaline) — own **100% of the commercial SERPs** (hotels, surf lessons, tours)
    with **zero editorial judgment**. The clearest revenue-adjacent gap.
  - **sydneytourism.org** — the closest structural rival (single 3,000-word mega-guides); *admits*
    its own gaps (accessibility, deep seasonal weather, cultural depth).
  - **Thin/foreign travel blogs + forums** holding p1 slots on head terms purely for lack of a
    strong local incumbent — the core displacement thesis.
- **Verdict:** the SERP is **fragmented and beatable**. No single site owns "Bondi Beach." A local
  authority that consolidates and stays fresh can become the incumbent.

*(Full detail: `audit/04-competitors-and-gaps.md` — 21-query SERP table, 9 competitor profiles.)*

---

## 3. Biggest weaknesses

1. **Proven traffic has no hub above it.** The two largest spoke clusters — **Parking (~2,470 YTD
   views)** and **City2Surf/Running (~2,090 views)** — have **no dedicated hub**; a lossy regex
   classifier folds them into over-broad generic hubs, so their authority leaks. (`audit/05`.)
2. **Commercial intent leaks to informational pages.** Surf lessons, airport transfers, tours,
   restaurant/Icebergs bookings, current-year events route to info articles instead of a decision
   page with a CTA — ceding the money query to OTAs. (`audit/03`, `audit/04`.)
3. **AEO is un-systematised.** The substrate is excellent (FAQ schema, answer-first voice, a place
   entity) but there's **no enforced answer-first block and no comparison-table block**, so
   comparison/per-month queries can't be cleanly extracted into AI answers. (`audit/06`.)
4. **E-E-A-T stops at "Organization."** No `Person` schema, no named authors, no author pages —
   the biggest missing trust signal, and the cheapest to fix. (`audit/07`, `audit/08`.)
5. **A handful of integrity/technical debts:** every venue's `Restaurant` schema emits the *same
   shared hero image* (asserts a fake photo of each venue); 6 thin category pages leak equity to the
   old Squarespace site via followable links; whole-site indexability hinges on one env var with no
   guard; 36 titles truncate in SERPs. (`audit/01`, `audit/07`.)
6. **Under-served gap topics:** accessibility, dog-friendly, luggage storage, weddings/groups,
   Bondi-vs-CBD, a real surf-lessons guide — all winnable, several commercial. (`audit/03`, `04`.)

---

## 4. Biggest opportunities

1. **Hub-and-spoke consolidation** over the existing winners (Parking, City2Surf, Swim, Surfing,
   Itineraries) — concentrates authority the site has *already earned*.
2. **The Bondi→Coogee coastal-walk cluster** — the most linkable topic the site can own; a pillar +
   5 spokes + beach nodes with a dense internal-link web. No local authority currently owns it.
3. **AEO retrofit** of the high-demand practical clusters (safety, Icebergs, parking, transport) so
   VBB becomes the *cited* source in AI answers — a structural edge fragmented publishers can't match.
4. **The commercial decision-layer** above the OTAs — "where to stay by area/budget", "best surf
   schools compared", "which tour is worth it" — monetised via the affiliate engine that's already
   built.
5. **Two flagship link magnets:** the **Bondi Coffee Price Index** (annual, honestly collectable,
   press-native) and an **interactive Bondi facilities/accessibility map**.
6. **A named-author moat** + visible "last locally checked" freshness — turning genuine local
   presence into machine-readable E-E-A-T that national publishers structurally cannot fake.

---

## 5. Technical findings (grounded in the repo)

The build is **unusually clean** — redirects verified 0 chains / 0 loops / 0 sitemap leaks; AI
crawlers allowed; canonical host discipline; image independence enforced; no thin migration stubs
indexed; correct heading hierarchy. Do **not** "fix" these. Real issues, by severity:

| Sev | Finding | Fix |
|---|---|---|
| **CRITICAL (operational)** | Whole-site indexability + robots hinge on `NEXT_PUBLIC_IS_PRODUCTION`; unset on a prod deploy → everything de-indexes. No guard. | Assert env in build; post-deploy smoke check that `/robots.txt` has `Allow: /` and home lacks `noindex`. |
| **HIGH** | 6 `category` pages: indexable, thin, near-duplicate, orphaned, each with a **followable link to the old Squarespace site** (`app/[...slug]/page.tsx:428`) — leaking equity to a competitor. | Noindex all 6 (drop from sitemap); `rel="nofollow noopener"` any remaining `liveUrl` link. |
| **MEDIUM** | 36 indexable titles truncate in SERPs after the brand-suffix drop; direct CTR tax (site CTR ~1.2%). | Hand-rewrite the high-impression subset to ≤60 chars, keyword-first. |
| **MEDIUM** | ~52 pages both thin (<300w) **and** zero-impression — quality/crawl dilution. | Merge+301 or noindex via the existing plumbing. |
| **MEDIUM** | Sitemap `STATIC_ROUTES` (hubs/money pages) carry no `lastModified`; 3 of 7 hubs absent from persistent nav. | Add `lastmod`; add Coastal Walk + Weather + Rescue to footer nav. |
| **LOW** | Dead robots directives (`host`, `/search`, `/api/`); `/adstxt` crawl artifact; dated URL pattern. | Trim; keep dated URLs (see §6). |

*Data honesty: Core Web Vitals were **inferred from code** (SSG + next/image + self-hosted font =
low-CLS posture), not measured — no PageSpeed field data in-session.* Full detail + file:line refs:
`audit/01-technical-seo.md`.

---

## 6. Site architecture

**Target: 7 hubs → 12**, all built *above* existing winners; 3-clicks-to-anything; no orphans.

**New hubs** (with the proven spoke demand they concentrate):
- **/bondi-parking** — ~2,470 YTD views, no parent today. **Build first.**
- **/city2surf-and-running** — ~2,090 views + the orphaned Sydney Marathon cluster.
- **/bondi-surfing** — thin now, clear entity, high commercial intent (lessons).
- **/itineraries** — feeds the `/plan` Day Planner.
- **Promote /where-to-swim** core-page → a full Swim hub (Pools / Safety / Conditions).
- Keep **/bondi-coastal-walk** as the flagship pillar (§17).

**Nav:** replace the flat 8-item nav with a **grouped 6-heading mega-menu** (Things to Do · Swim &
Coast · Eat & Drink · Getting Around · Plan Your Visit · Stay; With Kids as a standalone pill) +
a **crawlable footer mega-nav listing all 12 hubs + all location pages** — the authority backbone.

**Breadcrumbs:** articles breadcrumb to their **topical hub** (never flat `/articles`); location
pages breadcrumb under the coastal-walk pillar. The engine (`articleHub()`) is already correct —
extend `articleTopic` branch order so parking/running/surfing spokes route to the new hubs (parking
*before* the generic transport branch; running/city2surf *before* things-to-do).

**Internal-linking rules:** every hub links down to every spoke that up-links to it; each spoke shows
3–6 same-topic siblings; each top-20 protected page is reachable from ≥3 other protected pages;
descriptive keyword anchors, never "click here". Fix the marathon/coastal orphans with hub up-link +
down-link + 3 sibling links + footer path.

**URL posture — "freeze the past, clean the future":** do **not** mass-migrate the 141 dated
`/bondi-blog/YYYY/M/D/` URLs (25 of 37 protected winners live on them — a blanket reslug risks the
whole revenue base for cosmetic gain). Ship **new** content on clean topical slugs; reslug only the
2 genuinely-broken garbage slugs. Full site-map + touch-points: `audit/05-architecture.md`.

---

## 7. Search-intent universe

**316 queries across 28 clusters** (`audit/03-keyword-universe.csv`). Distribution of the mapped
action: **own via existing 200 · belongs-on-hub 81 · NEW page 24 · upgrade existing 11.**

The headline: the site is **remarkably strong on informational coverage** — its weakness is
**commercial/transactional intent and a few service niches**, plus proven content buried on dated
blog URLs rather than consolidated under hubs.

**Biggest gap clusters:** dog-friendly Bondi · practical logistics (luggage storage/lockers, EV
charging, wifi) · occasions & groups (weddings/proposals/hens — highest commercial intent of any
gap) · active-water experiences (SUP/kayak/scuba/yoga) · Bondi-vs-CBD "where to stay". *Demand tiers
are qualitative estimates — no Ahrefs/GSC volumes in-session; stated as such.*

---

## 8. Competitor analysis

Covered in §2; full profiles in `audit/04`. The four strategic reads:
1. **Beat hellobondi on opinion, depth and commercial guidance** it's forbidden to give; *cite it*
   for authoritative facts (patrol hours, rules) rather than fighting it there.
2. **Rank as the decision-layer above the OTAs**, not as a booking engine — capture the research
   query, hand off to booking, monetise via affiliate.
3. **Out-fresh the listicle publishers** (Time Out / Urban List / Man of Many) — they run Sydney-wide
   desks; a local knows *this week* what opened/closed/changed.
4. **Steal the thin SERPs** — wherever a forum thread or foreign blog ranks (is-Bondi-worth-it, Bondi
   vs Manly, alcohol rules, accessibility), a definitive current local page wins.

---

## 9. Content gaps

Prioritised (topic → why winnable → who to displace), from `audit/04` §3:

**Tier 1 (do first):** "Where to stay in Bondi" editorial area/budget guide (displace OTAs as the
layer above them) · consolidated coastal-walk hub · surf-lessons guide (SERP is 100% aggregators) ·
accessibility guide (no mainstream Bondi guide competes) · "is Bondi worth visiting?" (thin SERP).
**Tier 2:** Bondi-vs-Manly comparison hub · a *ranking* Things-to-Do hub · a "Bondi rules" cluster ·
an itineraries hub · a markets guide.
**Tier 3 (defend & extend):** Bondi Rescue · Icebergs · swim-safety · deep seasonal weather — the
moats VBB already leads; keep current each season.
**Cross-cutting:** clean FAQ blocks + schema on the practical long-tail so VBB (not a forum) becomes
the AI-cited source.

---

## 10. Top 100 opportunities (scored & ranked)

Scored on a transparent weighted model (`scripts/score-opportunities.mjs` →
`audit/top-100-opportunities.csv`). **Score = Σ(weight × factor/5)**, factors 1–5:
traffic 20 · ranking-probability 20 · commercial 15 · AI-usefulness 15 · topical-authority 15 ·
backlink 8 · strategic 7.

**Top 30 (ranked):**

| # | Score | Type | Opportunity |
|---|------:|------|-------------|
| 1 | 87.0 | Create | Complete the Bondi→Coogee coastal-walk cluster (pillar + 5 spokes + link web) |
| 2 | 81.8 | Create | Parking hub (/bondi-parking) above the 4 parking winners |
| 3 | 77.4 | Upgrade | Defend & expand the Bondi Rescue moat (site's #1 topic, 3,452 views) |
| 4 | 76.8 | Create | Surf-lessons editorial guide (decision layer above Viator/GYG) |
| 5 | 76.4 | Upgrade | Promote /where-to-swim to a full Swim hub (Pools/Safety/Conditions) |
| 6 | 76.0 | Tool | /bondi-map interactive layered facilities map (flagship link magnet) |
| 7 | 75.6 | Create | Bondi accessibility guide (wheelchair/matting/step-free) — moat + links |
| 8 | 75.0 | Upgrade | Canonical swim-safety hub (rips/flags/patrol/bluebottles/sharks) |
| 9 | 74.8 | Upgrade | Safety-cluster AEO retrofit (12 Qs: answer-first + FAQ + source) |
| 10 | 73.8 | Merge | Consolidate the Icebergs "can you swim / access / hours" swarm (~8 pages) |
| 11 | 73.4 | Create | City2Surf & Running hub — rescue orphaned Sydney Marathon pages |
| 12 | 73.4 | Upgrade | Parking-cluster AEO retrofit (options table + free-spot FAQ) |
| 13 | 73.0 | Tool | Bondi Coffee Price Index — annual flagship dataset |
| 14 | 72.8 | Create | Bondi vs CBD "where to stay" decision page |
| 15 | 72.6 | Tool | Ocean-pool guide + closure/status tracker |
| 16 | 72.6 | Create | Standalone: coastal-walk accessibility (step-free, matting, ramps) |
| 17 | 72.4 | Upgrade | Icebergs-cluster AEO retrofit |
| 18 | 71.6 | Tool | Coastal-walk dataset & map (segment times/gradient/steps/access) |
| 19 | 71.2 | Create | Add `answer` + `table` block types + renderers (AEO substrate) |
| 20 | 71.0 | Create | Standalone: toilets & facilities along the walk |
| 21 | 70.8 | Merge | Consolidate the 6-page "ultimate Bondi travel guide" cluster |
| 22 | 70.8 | Upgrade | Strengthen /things-to-do-in-bondi to rank p1 for the head term |
| 23 | 69.8 | Upgrade | Expand best-restaurants survivor BEFORE it absorbs redirects |
| 24 | 68.8 | Directory | Surf-schools directory (/bondi-surf-schools) |
| 25 | 68.8 | Directory | Activities / experiences directory + affiliate feed |
| 26 | 68.4 | Schema | Coastal-walk TouristAttraction + HowTo schema |
| 27 | 68.4 | Upgrade | Transport AEO retrofit — airport→Bondi options table |
| 28 | 68.4 | Create | Standalone: cafes to eat before/after the walk |
| 29 | 68.0 | Upgrade | Bondi vs Manly (and vs Coogee/Bronte) comparison hub |
| 30 | 66.4 | Create | Dog-friendly Bondi guide |

Full 102-row list (Create 25 · Upgrade 24 · Tool 11 · Technical 11 · Schema 10 · Commercial 9 ·
Merge 6 · Directory 4 · Redirect 2) in `audit/top-100-opportunities.csv`.

---

## 11. Deep dives on the Top 30

Grouped where they form one build. For each: what, why *for this site*, and the exact repo move.

### A. The coastal-walk cluster (#1, #16, #18, #20, #26, #28)
**What:** make `/bondi-coastal-walk` the definitive Bondi→Coogee resource — pillar + 5 standalone
spokes (**toilets**, **cafes before/after**, **accessibility**, **Sculpture by the Sea**, **whale
watching**) + beach nodes, with a dense internal-link web; add **/coogee-beach** and
**/clovelly-beach** location pages (the route currently dead-ends with no `href`); emit
**TouristAttraction + HowTo** schema off the existing route data in `lib/hubs.ts`.
**Why here:** the SERP is a niche single-topic site + scattered blogs — *no local authority owns it*,
and it's the most link-worthy topic Bondi has. **Move:** `data/locations.ts` (2 nodes), 5 new spoke
bodies, `lib/hubs.ts` link cards, `coastalWalkAttractionJsonLd()` + `howToJsonLd()` helpers.

### B. Parking hub (#2, #12)
**What:** `/bondi-parking` above the 4 protected parking winners (Bronte 886, free-parking 720,
Tamarama/Coogee/Clovelly 448, ultimate 415); add an **options table** (car park / cost / free? / walk
to sand) and free-spot FAQ. **Why:** ~2,470 views of demand with no parent, folded into a generic
transport hub today. **Move:** extend `articleTopic`/`TOPIC_LABEL`/`TOPIC_SECTION` (parking branch
*before* transport), `HubDesign` in `lib/hubs.ts`, hub record in `pages.json`, nav under "Getting
Around". **Do not** 301 the winners (protected) — differentiate + cross-link.

### C. Bondi Rescue moat (#3)
**What:** defend and expand the site's strongest territory (who-are-the-lifeguards = 3,452 views,
multiple p1 results). **Why:** it's the one topic VBB already *owns*; national publishers + hotel
content-marketing are the only challengers. **Move:** seasonal refresh, expand lifeguard profiles /
rescue lore, a **Bondi film-&-TV-locations** spoke, dense internal links to Swim & Safety.

### D. Swim & safety (#5, #8, #9, #10, #17)
**What:** promote `/where-to-swim` to a full hub (Pools/Safety/Conditions); build a canonical
swim-safety hub; consolidate the ~8-page Icebergs "can you swim" swarm into the two protected pillars;
AEO-retrofit safety + Icebergs (answer-first + FAQ + SLSA/Council citations). **Why:** highest
direct-answer rate in AI + strong existing demand (Icebergs FAQ 841, can-anyone-swim 534, is-it-safe
171). **Move:** hub record + sections; body retrofits per the AEO recipe; 301 the 6 non-protected
Icebergs satellites (protected FAQ↔can-anyone-swim merge = **owner approval**, see §24).

### E. The commercial decision-layer (#4, #14, #24, #25, #29)
**What:** the pages the OTAs can't write — surf-lessons guide, Bondi-vs-CBD where-to-stay,
Bondi-vs-Manly, a surf-schools directory, an activities/tours directory — each with an affiliate CTA.
**Why:** these SERPs are 100% aggregators with no editorial layer; highest commercial value on the
board. **Move:** new bodies + `data/surfSchools.ts` on the venue template; wire the Viator/GYG
adapter (§19); the "uniquely-useful" gate (§15) before any directory page indexes.

### F. AEO substrate (#9, #12, #17, #19, #27)
**What:** two new block types — **`answer`** (40–55-word self-contained lead under a
question-phrased H2) and **`table`** (semantic comparison table) — then retrofit the P0 clusters.
**Why:** comparison/per-month queries can't currently be extracted; this is the difference between
being read and being *cited*. **Move:** extend the `Block` union in `lib/content.ts`, render in
`components/blocks.tsx`, rebuild bodies.

### G. Flagship link magnets (#6, #13, #15, #18)
**What:** the **Bondi Coffee Price Index** (annual, census of flat-white prices, `Dataset` schema +
downloadable CSV), the **/bondi-map** layered facilities/accessibility map, and an **ocean-pool
closure tracker**. **Why:** maps and indexes are the assets journalists and council/community sites
link to — the single best backlink-earning plays, and highly AI-citable. **Move:** `data/coffeeIndex.ts`
+ `/bondi-coffee-price-index` + `datasetJsonLd`; `/bondi-map` (self-hosted-tile MapLibre or owned SVG)
with a **crawlable pin list** beneath the map.

### H. Accessibility (#7, #16)
**What:** the definitive Bondi accessibility guide (beach wheelchairs, matting days, step-free routes,
accessible parking/toilets) + the coastal-walk accessibility spoke. **Why:** owned only by
specialist-access sites + council; no mainstream Bondi guide competes; requires on-the-ground checking
(which *is* the moat) and attracts disability-org + council links. **Move:** new bodies sourced from
Waverley Council + a physical check; field notes; link from Swim/Coastal/Family hubs.

*(#21 ultimate-guide consolidation, #22 things-to-do strengthening, #23 restaurant-survivor expansion,
#30 dog-friendly — detailed in `audit/02` and `audit/03`.)*

---

## 12. AI / AEO strategy

**Bot access is already correct** — the wildcard `Allow: /` in `app/robots.ts` covers every AI
crawler (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot…). *The only trap:
do NOT add named AI-crawler groups unless each repeats `Allow: /`* (most-specific-group-wins would
silently exclude them). Verify no Vercel/WAF rule 403s those UAs.

**The work is a retrofit, not new pages** — all 74 questions in the AI-answer matrix already map to
existing URLs. Per-page recipe: phrase the top H2 as the literal question → lead with an `answer`
block → `quickFacts` strip (with a live fact where one exists) → 4–6 self-contained FAQs → a `table`
where the answer is comparative/per-month → render `lastReviewed` + `sources` visibly. **P0 clusters:**
safety (12 Qs), Icebergs, parking, transport. Full 74-row matrix: `audit/ai-answer-matrix.csv`.

**Measurement (no paid tool):** run the 74-question panel monthly across AI Overviews / ChatGPT /
Perplexity / Copilot, logging *cited? / which page? / position / accurate?* to a dated CSV; corroborate
with CDN logs (`ChatGPT-User`, `PerplexityBot` hits) + AI-referrer analytics. **Start now** — no
historical AI-citation data exists unless you begin capturing it. Full plan: `audit/06`.

---

## 13. Schema plan

Current coverage is **strong and integrity-safe** — the canonical `#bondi-beach` TouristAttraction
entity (geo + Sydney→NSW→Australia + Wikipedia/Wikidata `sameAs`) is the site's best AEO asset; venues,
locations, events, stay and articles all carry appropriate schema. Priority gaps (`audit/07`):

1. **Author entity (HIGH):** `author` is Organization-typed with no `@id`/`sameAs`. Add a `Person`
   (or honest team-`Organization`) entity with an `@id`, bound via `homeLocation` to the Bondi place
   `@id` — a chain no all-of-Sydney competitor can emit truthfully. Cheapest E-E-A-T/AEO win.
2. **Remove the shared venue image (HIGH, integrity — fix now):** `restaurantJsonLd` passes the same
   hero as every venue's `image`, asserting a fake photo of each. Drop it unless venue-specific.
3. **Coastal-walk TouristAttraction + HowTo (HIGH):** backed by the visible route module.
4. **ItemList on ranked "best X" articles (HIGH):** big AI "top-N" surface; gate on a visible ranked
   list.
5. Medium: hub/`/articles` ItemList completeness; FAQPage on venues/collections *after* a visible Q&A
   is added; stay ItemList `url`s; `Dataset` schema for the Coffee Index.
   **Do not add:** VideoObject for the third-party surf-cam iframe; any rating/hours/price not backed
   by verified data. Copy-paste JSON-LD templates for all five priority types: `audit/07` §4.

---

## 14. Local-authority strategy (the moat)

Replace the anonymous "Editorial Team" slogan with **verifiable, machine-readable first-hand
experience** — the one thing hellobondi (institutional), sydney.com (state-wide) and the OTAs
structurally can't fake:
- **Named authors** (`data/authors.ts`) + `/team/<id>` pages + **`Person` schema** with
  `homeLocation` → Bondi place `@id`, referenced from every article's `author`. *Integrity gate: only
  real people, real tenure — a fabricated bio is worse than an anonymous team.*
- **`fieldNote` block** — signed, dated first-hand observations ("On a still winter morning the
  north-end flags were set wide-left of the ramp…") — the specific, quotable primary content LLMs
  prefer. Only when a real observation exists.
- **Original photography** referenced by media key, with an internal `photo-manifest.json` capture
  ledger (no public attribution machinery, per house rules).
- **First-hand ground detail** where it's most defensible and most searched: surf/swim conditions,
  transport reality, **accessibility**, seasonal patterns — each with a source + `lastVerified`.

Full E-E-A-T→AI mapping: `audit/08` §A.

---

## 15. Directory strategy

**Verdict: extend the proven dining pattern, narrow and deep — never a "list-everything" directory.**
The 167-venue dining set already proves the model is helpful-content-safe (editorial judgment + source
+ verify script per record). Replicate that discipline for **accommodation (P0, data exists), surf
schools (P1), activities/tours (P1), attractions (P1, from `locations.ts`)**; hold fitness/beauty (P2)
and retail (curated collections only).

**The non-negotiable "uniquely-useful" gate** (enforced by extending the `restaurants:verify`
pattern — hard-errors the deploy): every indexable business page must carry original editorial
judgment (`whyGo`), an honest trade-off, a genuinely-local tip, ≥3 related internal links, a
source + `lastVerified` + `confidence`, and a map presence. Can't clear the bar → it's a *collection
mention*, not a standalone page. **Facets stay client-side** (no `?type=cafe` thin-page spam). Sample
surf-school page architecture + the editorial firewall for future sponsored listings: `audit/09` §B.

---

## 16. Bondi map strategy

**Build `/bondi-map` as a standalone, layered, flagship utility** — highest-leverage single feature:
strong on user value (toilets/showers/water/parking/safe-swim/accessibility is exactly what a visitor
needs), backlinks (maps are link magnets — council/accessibility/community sites link them), and AI
(structured place data is citable) — **provided every pin's data also renders as crawlable HTML** (the
map is the UI; the list beneath is the SEO/AI payload). Layers: safety/swimming, accessibility,
facilities, food & stay, do & see, the coastal-walk route.

**Implementation note (the `remotePatterns:[]` reality):** that setting blocks `next/image` remote
hosts, **not** iframes/tiles. Two clean options: **owned SVG** (zero external dependency, maximally
link-worthy) or **MapLibre GL with a self-hosted Bondi tile set in `/public`** (keeps the
everything-local posture; load client-side via `dynamic(ssr:false)`). Facility pins are **facts** —
sourced from Waverley Council with `lastVerified`; never guess coordinates. Thread it through every
location/venue/utility page. Full detail: `audit/09` §C.

---

## 17. Bondi-to-Coogee cluster

The flagship. **One pillar + a curated ring of spokes + beach nodes**, standalone-vs-on-pillar decided
by demand:
- **Standalone URLs (5):** toilets & facilities · cafes before/after · accessibility · Sculpture by
  the Sea (seasonal) · whale watching (seasonal).
- **On-pillar sections** (deep-linking to the owning hub): route/direction, swimming stops (→ Swim
  hub), prams (→ Family), running (→ City2Surf/Running), photography, sunrise/sunset (shared with
  Weather).
- **Beach nodes:** Bondi → Tamarama → Bronte → **Clovelly (NEW)** → **Coogee (NEW)**, plus off-route
  Mackenzies Bay / Marks Park / Icebergs. Each node up-links to the pillar, links prev/next, and links
  its own parking + pool spoke (the Bronte-carpark winner = the Bronte entry point).

Link web + exact treatments: `audit/05` §7.

---

## 18. Homepage redesign

The homepage is **well-equipped but under-surfaced** — `SurfCam`, `WeatherSurfSummary`,
`UpcomingEvents`, `TodayRecommendations`, `DayPlannerPromo`, live water-temp and the Bondi place
schema are **already built**. The missing pieces are presentation:
1. **"Start here" 12-hub front-door grid** (the only hub discovery today is an easy-to-miss pill row).
2. **"Plan your visit" band** (first-timer path: how long / when / getting here / where to stay →
   Build my day).
3. **Footer mega-nav** (all 12 hubs + locations — the authority backbone).
4. **Extend the hero conditions strip** with UV + water temp (both already in the conditions service).

Top-to-bottom wireframe: `audit/05` §8.

---

## 19. Commercial strategy

**Most of it is already built — the near-term job is configuration.** `lib/affiliate.ts` is a live
Travelpayouts wrapper that becomes revenue-tracked the moment env markers are set; `/stay` (24
properties, 8 category pages) is ready to earn today; the dining directory links venue `bookingUrl`s;
Klook surf-lessons is already live. Sequencing:
- **P0 (days, not weeks):** set `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` + program ids → every `/stay` CTA
  tracked (zero code); fill the empty Klook activity placeholders; ship an affiliate-disclosure
  component; wire GA4 outbound + `sub_id` capture (can't be back-filled).
- **P1:** add a **Viator + GetYourGuide adapter** (same wrapper, new program id) for tours/surf; ship
  a `/bondi-luggage-storage` utility page (Bounce/Stasher); surface restaurant booking CTAs; **stand
  up the newsletter now** (compounds regardless of today's low traffic).
- **P2–3:** insurance/transfers (low fit, free once the adapter exists); a **premium-listing system
  with a hard editorial firewall** (labelled, never reorders editorial ranking — "why we'd go" is never
  for sale); then sponsored content / lead-gen / own-brand products.

*Trust rule over everything: commercial score is a tie-breaker, never a ranking driver.* Revenue is
framed relative/qualitative — the site is at migration-stage traffic, so the goal is **mature,
trust-safe monetisation in place as rankings climb**, not chasing today's volume. Full scoring:
`audit/09` §A.

---

## 20. Link acquisition

Ranked linkable assets (not guest posts), from `audit/08` §D — top 5: **Coffee Price Index** ·
**coastal-walk dataset & map** · **accessibility guide** · **"where to swim right now" flags/rip map**
· **ocean-pool guide + closure tracker**. Digital-PR mechanics: ship a reusable CSV/embeddable map so a
journalist can republish in one step; pitch the **annual delta** ("prices up X%"), not the static
asset; lead with the honesty/method (census, photographed, published limitations); seed local
(*Wentworth Courier*, Waverley Council) → metro → national; let the `Dataset` schema + open license
earn passive citations. *Journalist targets are directional categories to verify before pitching — no
live byline lookup this session.*

---

## 21. Original research strategy

**Flagship: the Bondi Beach Coffee Price Index (BCPI).** Chosen because it's the rare asset that's
**collectable honestly and first-hand** (a price on a board is observable and photographable — no
partner data, no fabrication temptation), inherently **annual** (built-in freshness + "up X% YoY"
press hook), sits on the site's highest-demand topic, and is the archetypal cited-reference (the "Big
Mac Index" at neighbourhood scale). Census (not sample) of the tracked café set, a fixed basket
(regular/large/alt-milk flat white), published methodology, an evergreen `/bondi-coffee-price-index`
landing page, `Dataset` JSON-LD, a downloadable CSV, and a fixed collection fortnight each year.
**Flagship #2:** the GPS-measured coastal-walk dataset. Full spec: `audit/08` §C.

---

## 22. Freshness framework

Seven archetypes by cadence (`audit/08` §B): live/near-live → weekly → monthly (café/restaurant/bar
rankings) → quarterly → twice-yearly (seasonal) → yearly (event-anchored) → evergreen. **Two honest
date states:** "Last locally checked" (on-ground) vs "Last reviewed" (desk) — shown on volatile
classes, **suppressed on evergreen** (a stale badge on a history page *reduces* trust). Add a
`freshnessClass` field + a `scripts/freshness-audit.mjs` that flags overdue pages in CI; a guard
asserts any "last locally checked" within N days has a real `fieldNote`/`sources` change (no silent
stamp-bumping). `dateModified` bumps **only** when a real change ships. Maintenance calendar
(weekly → annual, anchored to Bondi's season): `audit/08` §B.4.

---

## 23. Measurement

KPI tree across four axes, **free-tools-first** (`audit/09` §D):
- **Google (GSC):** clicks, impressions, non-brand split, top-3/top-10 counts, keyword-universe
  coverage, share-of-voice on a 30-query seed set, clicks by page-cluster.
- **AI (manual prompt log):** citation rate + share-of-AI-voice across ChatGPT/Perplexity/AIO/Copilot,
  logged monthly to a dated CSV.
- **Authority:** referring domains, branded search, direct traffic, newsletter growth.
- **Commercial:** affiliate CTA clicks by `sub_id`/placement, bookings/commission by line & source
  page, RPV by cluster, assisted conversions (credit the high-traffic top-of-funnel pages).

Monthly dashboard (headline 5 numbers → search → AI → authority → commercial → content health →
5 actions). **Start now, can't be back-filled:** the AI-prompt log and GA4 `sub_id` capture.

---

## 24. 30 / 60 / 90 / 180 / 365-day roadmap

Sequenced for *quality and information gain* — **not** hundreds of mediocre pages. Each phase gates
on `npx tsc --noEmit` · `npx vitest run` · `node scripts/seo-qa.mjs` · production build, and honours
the protection manifest.

**0–30 days — foundations & the highest-ROI hub.**
- Technical CRITICAL/HIGH: env-var guard + smoke check; noindex the 6 category pages + nofollow the
  old-site links; remove the shared venue image (integrity). *(#—, schema)*
- Build the **Parking hub** (adopt the 4 winners; options table). *(#2, #12)*
- Ship the **`answer` + `table` block types**; retrofit the **safety cluster** (AEO). *(#9, #19)*
- **Author entity + named authors + /team pages + Person schema.** *(E-E-A-T)*
- Commercial P0: turn on Travelpayouts; GA4 `sub_id`; disclosure; start the AI-prompt log + newsletter.
- **Outcome:** biggest orphaned cluster hubbed; integrity/technical debts cleared; revenue tracked;
  measurement baselined.

**30–60 days — the flagship cluster + swim.**
- **Coastal-walk cluster**: /coogee + /clovelly nodes, the 5 standalone spokes, TouristAttraction +
  HowTo schema, the link web. *(#1, #16, #20, #26, #28)*
- **Promote the Swim hub**; consolidate the Icebergs swarm (non-protected 301s); AEO-retrofit Icebergs
  + parking. *(#5, #8, #10, #12, #17)*
- Rewrite the 36 over-length titles; run the first thin/zero-demand consolidation batch.
- **Outcome:** the most linkable cluster owned end-to-end; swim/safety consolidated; CTR debt cleared.

**60–90 days — the commercial decision-layer + AEO breadth.**
- **Surf-lessons guide**, **Bondi-vs-CBD**, **Bondi-vs-Manly**; **surf-schools** + **activities**
  directories (with the uniquely-useful gate); Viator/GYG adapter live. *(#4, #14, #24, #25, #29)*
- **City2Surf & Running hub** (before the Aug spike; rescue the marathon orphans). *(#11)*
- Transport AEO table; ItemList on ranked articles; homepage hub-grid + plan band + footer mega-nav.
- **Outcome:** money queries captured with CTAs; a second big cluster hubbed; homepage as a front door.

**90–180 days — flagships & link magnets.**
- **/bondi-map** (crawlable pin list + schema); **Bondi Coffee Price Index** v1 (collect + publish +
  Dataset schema + CSV) and the first PR push; **accessibility guide**; ocean-pool closure tracker.
  *(#6, #7, #13, #15, #18)*
- Surfing + Itineraries hubs; dog-friendly, luggage-storage, weddings gap pages; `freshnessClass` +
  freshness-audit script + "last locally checked" convention.
- **Outcome:** two flagship link assets live; the hub map complete (12 hubs); freshness operationalised.

**180–365 days — compounding.**
- BCPI year-2 (the YoY delta is the real hook); coastal-walk dataset; deepen directories; premium-
  listing system (firewalled); scale the field-note/original-photo program; quarterly AEO re-measure.
- **Outcome:** original data compounding into citations + links; the site is the incumbent Bondi
  authority, not a challenger.

---

## 25. Exact next 20 actions

1. Add a build-time assertion + post-deploy smoke check for `NEXT_PUBLIC_IS_PRODUCTION` (indexability).
2. Noindex the 6 legacy `category` pages; `rel="nofollow noopener"` any link to the old Squarespace `liveUrl`.
3. Remove the shared hero `image` from `restaurantJsonLd` at the venue call site (integrity fix).
4. Add `data/authors.ts` + `/team/<id>` pages + `personJsonLd`; switch `articleJsonLd` author to an `@id` reference.
5. Extend `articleTopic`/`TOPIC_LABEL`/`TOPIC_SECTION` with a `parking` topic (branch before transport).
6. Build the `/bondi-parking` hub (`HubDesign` + `pages.json` record) adopting the 4 parking winners; add a parking options `table`.
7. Add the `answer` + `table` block types to the `Block` union + `components/blocks.tsx` renderers.
8. AEO-retrofit the safety cluster (answer-first H2s + `quickFacts` + 4–6 FAQs + SLSA/Council sources).
9. Render `lastReviewed` + `sources` as visible page furniture on fact-bearing pages.
10. Register Travelpayouts; set the marker + program-id env vars (turns on `/stay` affiliate tracking).
11. Wire GA4 outbound-click events capturing `sub_id`; ship the affiliate-disclosure component.
12. Stand up the newsletter (ESP + double opt-in); start the monthly AI-prompt citation log.
13. Add `/coogee-beach` + `/clovelly-beach` to `data/locations.ts` (fix the dead route stops).
14. Create the 5 coastal-walk standalone spokes (toilets, cafes, accessibility, sculpture, whales) + the link web.
15. Add `coastalWalkAttractionJsonLd()` + `howToJsonLd()` and wire into the coastal-walk hub.
16. Promote `/where-to-swim` to a full hub; 301 the 6 non-protected Icebergs satellites into the pillars.
17. Expand the `best-restaurants-bondi-beach` survivor (221w) *before* it keeps absorbing the redirect.
18. Rewrite the ~high-impression subset of the 36 over-length titles to ≤60 chars, keyword-first.
19. Write the surf-lessons guide + `data/surfSchools.ts` (venue template) + the uniquely-useful verify gate.
20. Build `/bondi-map` v1 (owned SVG or self-hosted-tile MapLibre) with a crawlable pin list + `Place` schema.

**Owner-approval queue (do NOT ship without a yes — protected pages inside cannibal clusters):** the
Icebergs FAQ ↔ can-anyone-swim merge; any parking-winner consolidation; the accommodation-blog → /stay
redirect. Present OLD→NEW + reason + SEO benefit/risk + YTD traffic; wait for approval (`SEO_PROTECTED_PAGES.md`).

---

## If I Owned VisitBondiBeach.com

**What I'd internalise first:** you are not behind — you're *fragmented*. You already own Bondi
Rescue, you rank p1 across the practical long-tail, and your build quality is better than every
competitor including the council. The mistake would be to treat this as a rebuild. It's a
*consolidation*. The winners exist; they just don't ladder up to hubs, and the money queries don't
have a page to land on.

**The four things I'd actually prioritise, in order:**

1. **Hub the traffic you've already earned, then stay fresh.** Parking and City2Surf are bigger than
   most of your existing hubs and have *no parent*. Building those two hubs — and the coastal-walk
   cluster above your best pages — is the highest-certainty ROI on this entire document, because
   you're not betting on new demand, you're concentrating demand you can already see in the analytics.
   Pair it with a visible "last locally checked" cadence. Freshness + consolidation beats volume.

2. **Win the AI citation, not just the blue link.** This is the genuinely durable moat, and almost
   nobody in this niche is doing it deliberately. Your bot access is open, your entity graph is
   built, your FAQ schema works — you are two block types (`answer`, `table`) and an editorial habit
   away from being the source ChatGPT and AI Overviews quote for "is Bondi safe to swim", "where to
   park at Bondi", "Bondi vs Manly". The council can't out-*opinion* you and the OTAs can't
   out-*answer* you. Get there first and it compounds.

3. **Become a real publication, not an anonymous team.** Put two or three named locals on the site
   with real bios and `Person` schema bound to Bondi. This is cheap, it's the single biggest E-E-A-T
   gap, and it's the thing sydney.com and TripAdvisor *structurally cannot fake*. "Written by someone
   who's swum here every season for fifteen years" is your whole competitive identity — make it
   legible to both humans and machines.

4. **Turn on the money that's already plumbed, pointed at the pages people book from.** Flip the
   affiliate switches, add the tours adapter, and write the handful of decision-layer pages (where to
   stay by area, best surf schools, which tour is worth it) the OTAs can't. Then leave the rest of the
   site editorial. Revenue follows rankings — so instrument it now and let it mature as the traffic
   arrives.

**What I'd ignore (or at least deprioritise hard):**
- **Mass-migrating the dated blog URLs.** Cosmetic. It risks your entire protected revenue base for a
  prettier slug. Freeze the past, clean the future.
- **A broad "list everything" directory.** Breadth is a trap and a helpful-content liability. Go deep
  on stay / eat / surf / do / see; refuse thin pages.
- **Travel insurance, sponsored content, own-brand merch, and most P3 monetisation** until the brand
  is established — they're small money and big trust risk today.
- **Chasing 300 new pages.** You have 458 URLs and a *consolidation* problem, not a volume problem.
  Every new page should clear the uniquely-useful bar or it's a collection mention.
- **Vanity technical fixes** (the `host` robots directive, etc.). Real, but noise next to the four
  priorities above.

**The one bet I'd make with conviction:** the combination of **(a) genuinely local, named, first-hand
authority** and **(b) deliberate answer-engine formatting** is a moat that gets *stronger* as search
shifts to AI. The council is neutral, the OTAs are inventory, the publishers are Sydney-wide and stale.
A named local who is demonstrably here, checks things on the ground, publishes an annual coffee index
nobody else can, and formats every answer so an AI can quote it — that's a defensible position the
whole rest of the field is structurally locked out of. Build that, and "Bondi Beach →
VisitBondiBeach.com" stops being an aspiration and becomes the default.

*Where data was unavailable (keyword volumes, AI-citation share, CWV field data, competitor traffic),
this plan says so rather than inventing it. The numbers it does use — impressions, YTD pageviews, word
counts, the protected-page list — are first-party and real.*
