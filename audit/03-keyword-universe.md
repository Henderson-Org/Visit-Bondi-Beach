# Bondi Beach Search-Intent Universe

**Purpose:** map the comprehensive set of search intents Visit Bondi Beach must own to become
the canonical Bondi resource — for both classic SEO and AI answer-engine citation. Each query is
mapped to an existing live URL (from `audit/page-inventory.csv`) or flagged **GAP**, with a
recommended action.

**Deliverable:** `audit/03-keyword-universe.csv` — **316 queries across 28 intent clusters.**

> ## Data-honesty note (read first)
> This session has **no Ahrefs / SEMrush / Keyword Planner access**, so there are **no measured
> monthly search volumes here**. `demand_tier_est` and `commercial_tier_est` are **qualitative
> estimates (H/M/L)** based on travel-search behaviour and query intent, not measured data.
> `ai_citation_potential` estimates how likely an AI answer engine is to cite a well-built page
> for that query (favours specific, factual, list/FAQ-shaped intents). WebSearch was used only to
> sanity-check autocomplete / "people also ask" / current ranking for a few head terms
> ("things to do in bondi", "is it safe to swim at bondi") — both confirmed the clusters below and
> that the site already ranks for some of them.

## CSV columns
`query | intent_cluster | intent_type | funnel_stage | demand_tier_est | commercial_tier_est | ai_citation_potential | mapped_url_or_gap | recommended_action`

- **intent_type:** informational / commercial / transactional / navigational / comparison
- **funnel_stage:** TOFU (discover) / MOFU (evaluate) / BOFU (act/book)
- **recommended_action:** `own via existing` (page already targets it — hold/refresh) ·
  `upgrade existing` (page exists but under-serves the intent) · `belongs-on-hub` (no dedicated
  page needed; fold into a hub/pillar) · `NEW page` (genuine content gap)

## The 28 clusters (by size)
Food & drink (32) · Seasonal & events (26) · Things to do (23) · Practical Q&A (23) ·
Core destination (23) · Transport & getting there (21) · Icebergs & ocean pools (16) ·
Accommodation (15) · Itineraries & planning (14) · Coastal walk (13) · Swimming (12) ·
Safety & hazards (11) · Surfing & surf lessons (10) · Neighbourhoods & nearby (8) ·
Comparisons (8) · Kids & family (7) · Tours & experiences (6) · Occasions & groups (6) ·
Fitness & wellness (6) · Bondi Rescue & pop culture (6) · Photography/sunrise/sunset (6) ·
Moving & living (5) · Costs & money (4) · Practical services & EV (4) · Dog-friendly (3) ·
Backpacker & budget (3) · Accessibility & inclusion (3) · Cruise & day visitors (2)

## Coverage headline
The site is **remarkably strong on informational Bondi intent** — it already has dedicated pages
for the overwhelming majority of the high-demand destination, swimming, safety, transport, coastal
walk, Icebergs, events, and "why famous / how to pronounce / is it safe" queries. Of 316 queries:

| Action | Count | Meaning |
|---|---|---|
| own via existing | 200 | Intent already has a targeted page — maintain/refresh |
| belongs-on-hub | 81 | No new page needed — answer as a section on a hub/pillar |
| NEW page | 24 | Genuine content gap worth a dedicated page |
| upgrade existing | 11 | Page exists but under-serves the intent (esp. commercial/booking) |

The strategic weakness is **not informational coverage — it is commercial/transactional and a few
service niches**, plus the fact that many strong articles are buried as dated blog posts rather
than consolidated under crawlable hubs.

## Biggest GAP clusters (weak or no coverage)
1. **Dog-friendly Bondi** (GAP): "dog friendly bondi", "dog beaches near bondi", "dog friendly
   cafes bondi" — no page at all, yet steady evergreen demand and high AI-citation potential
   (clear factual answer about dog rules/nearby dog beaches). **Top new-page candidate.**
2. **Practical services & logistics** (GAP): "luggage storage / lockers bondi", "EV charging near
   bondi", "wifi at bondi". High utility, low competition, very AI-citation-friendly.
3. **Occasions & groups** (GAP): weddings, proposals, hens/bucks, birthdays. Highest *commercial*
   intent of any gap cluster (venue/vendor affiliate potential) with zero current coverage.
4. **Active-water experiences** (GAP within Things to do): SUP, kayak, scuba, bike hire, yoga/
   pilates studios — commercial MOFU/BOFU intents the dining/surf engine model could extend to.
5. **Bondi vs CBD "where to stay"** decision content — a high-value comparison the accommodation
   hub doesn't yet answer head-on.
6. **Film locations / "where is Bondi Rescue filmed"** — pop-culture tourism hook, currently only
   implied by the `/bondi-rescue` hub.

## Under-served (page exists, upgrade) — the commercial leak
The site's biggest *revenue-relevant* weakness is that transactional queries route to
informational articles: **surf lessons/board hire, airport transfers, Icebergs restaurant &
Totti's bookings, tours, NYE/Sculpture 2026 dated pages.** These are `upgrade existing` — add
booking CTAs, pricing ranges (sourced), and current-year freshness, or they leak to OTAs and
aggregators.

## Structural recommendation
Many `own via existing` mappings point at **dated `/bondi-blog/YYYY/M/D/...` URLs** (e.g. best
restaurants, best coffee, parking, NYE, Sculpture by the Sea). Per the repo's hub-and-spoke SEO
model, the durable evergreen intents should be consolidated onto the **topic hubs**
(`/bondi-eat-and-drink`, `/getting-to-bondi`, `/bondi-icebergs`, `/things-to-do-in-bondi`,
`/bondi-coastal-walk`) with spokes breadcrumbing up — and near-duplicate dated posts 301'd into the
survivor. That both concentrates authority and gives AI engines one clean, canonical URL to cite.

## Top 25 highest-value target queries
Ranked on combined demand × commercial/AI-citation value × strategic winnability (own it or close a
gap). Volumes are **estimated tiers, not measured**.

| # | Query | Cluster | Why it's top-value | Status |
|---|---|---|---|---|
| 1 | things to do in bondi beach | Things to do | Highest-demand head term; feeds every downstream intent | own via `/things-to-do-in-bondi` |
| 2 | where to stay in bondi beach | Accommodation | H demand + H commercial; core booking intent | own via `/accommodation` |
| 3 | bondi beach hotels | Accommodation | Transactional BOFU; direct revenue | own via `/accommodation` |
| 4 | best restaurants in bondi | Food & drink | H demand + H commercial; strong AI-citation | own via existing (consolidate to hub) |
| 5 | bondi surf lessons | Surfing | Transactional, high commercial; **upgrade** to booking intent | upgrade `/bondi-beach-surf-guide` |
| 6 | is it safe to swim at bondi beach | Swimming | H demand, top AI-citation; site already ranks | own via existing |
| 7 | bondi to coogee walk | Coastal walk | Iconic H-demand info term; anchor for the walk hub | own via `/bondi-coastal-walk` |
| 8 | sydney airport to bondi beach | Transport | H demand; transfer affiliate upside | upgrade `/getting-to-bondi` article |
| 9 | bondi icebergs | Icebergs | Signature entity; huge branded + info demand | own via `/bondi-icebergs` |
| 10 | bondi beach parking / free parking | Transport | Persistent high-intent utility query | own via existing |
| 11 | best coffee in bondi | Food & drink | H demand, strong AI-citation, affiliate/aff-content upside | own via existing |
| 12 | bondi vs manly | Comparisons | High-demand decision query; strong AI-citation | own via existing |
| 13 | bondi beach new years eve | Seasonal | H seasonal demand; refresh to current year | upgrade dated NYE pages |
| 14 | how to get to bondi beach | Transport | H demand gateway query | own via existing |
| 15 | best breakfast / brunch bondi | Food & drink | H demand, H AI-citation, commercial | own via existing |
| 16 | bondi beach tours | Tours | H commercial; **upgrade** with booking CTAs | upgrade `/tours` |
| 17 | best bars in bondi | Food & drink | H demand + H commercial nightlife | own via existing |
| 18 | bondi icebergs entry fee / hours | Icebergs | High-intent factual; top AI-citation | own via existing |
| 19 | best time to visit bondi beach | Seasonal | H demand planning query | own via existing |
| 20 | dog friendly bondi | Dog-friendly | **GAP**; evergreen demand, high AI-citation, no page | NEW page |
| 21 | luggage storage / lockers bondi | Practical services | **GAP**; high-utility, low-competition, AI-citation | NEW page |
| 22 | bondi vs cbd where to stay | Accommodation | **GAP**; high-value MOFU decision content | NEW page |
| 23 | bondi beach weather | Seasonal | H demand; supports every planning journey | own via `/bondi-weather` |
| 24 | one day in bondi itinerary | Itineraries | H AI-citation, strong MOFU planning intent | own via `/24-hours-in-bondi-beach` |
| 25 | bondi beach with kids | Kids & family | H demand family segment; commercial upside | own via `/bondi-with-kids` |

## How to use this
1. **Protect the 200 "own via existing"** — these are the canonical wins; keep them fresh and
   consolidate dated duplicates onto hubs.
2. **Fix the 11 "upgrade existing"** — this is where booking revenue leaks (surf, transfers, tours,
   restaurant bookings, current-year events).
3. **Ship the 24 "NEW page" gaps** — prioritise dog-friendly, luggage storage/lockers,
   Bondi-vs-CBD, weddings/proposals, and active-water experiences.
4. **Fold the 81 "belongs-on-hub"** intents into hub sections + FAQ schema rather than thin pages —
   this is what wins AI-answer citations without diluting the site.
