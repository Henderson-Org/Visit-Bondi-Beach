# Visit Bondi Beach — Content Inventory & Rationalization

**Prepared:** 2026-08-11 · **Corpus:** `content/pages.json` (458 URLs) + `audit/page-inventory.csv` (real YTD analytics on ~37 protected pages) + `seo-protected-pages.json` (37 winners) · **Companion data:** `audit/page-decisions.csv` (235 per-page decisions).

---

## 1. Executive summary

The site is **458 crawled URLs**: 15 core-page, 7 hub, 6 category, 1 blog-index, 206 blog posts (141 dated `/bondi-blog/YYYY/M/D/…` + 65 clean-slug legacy), and **223 tag pages**. Indexability is already disciplined — **210 indexable / 248 noindex**, and *all 223 tag pages are noindex*. A meaningful amount of cannibalization consolidation has **already shipped**: `next.config.mjs` carries **24 live 301s** across café, rescue, "why famous", "best time to visit", ice-cream, restaurants, rainy-day and City2Surf-training clusters. This audit finds what remains.

**Headline findings:**

1. **Data-honesty caveat, up front.** `impressions`/`clicks` in the corpus are a *sparse* Search Console snapshot (most pages show 0 = missing data, not zero demand), and `ytdPageviews` exists **only** for the ~37 protected pages. Every "0 ytd" below means *unmeasured*, not *dead*. Decisions here lean on wordCount, title/H1/intent overlap, and slug structure — signals I can actually see — and I flag where traffic data is absent.
2. **The `0 wordCount` trap.** All 7 hubs, all 8 beach/landmark Place pages, and `/bondi-icebergs` show `wordCount: 0` in the crawl because they are **app-rendered** (`components/HubView.tsx` ← `lib/hubs.ts`; `app/[...slug]/page.tsx` with Place schema) — the crawler never captured their component output. **These are NOT thin pages.** `data-gaps.json` lists 15 of them inside its "65 thin indexable" bucket; that is a false positive. Real thin-page count is ~50, not 65.
3. **Biggest open cannibalization cluster: "ultimate Bondi Beach travel guide."** At least **6** near-identical pages compete. Survivor is clear (`/bondi-blog/what-to-do-bondi-beach-travel-guide`, 465 ytd, 1982w, protected); 3–4 non-protected duplicates should 301 into it. None of the *sources* are protected → no approval needed.
4. **Second biggest: the Bondi Icebergs "can you swim" swarm.** ~8 pages all answer "can \[public/kids/anyone] swim at Bondi Icebergs." Two are protected pillars (the 841-ytd FAQ and the 534-ytd `can-anyone-swim`); the other ~6 are 0-ytd satellites that should redirect in.
5. **A protected page is being 301'd into a *thinner* survivor.** `must-experience-bondi-restaurants` (134 ytd, **1118w**, `allowRedirect:true`) is redirected to `best-restaurants-bondi-beach` (**221w**, 0 ytd). Per the CLAUDE.md rule "migrate the richer body into the survivor before redirecting," the survivor must be expanded first — right now link-equity flows into a stub.
6. **Two garbage Squarespace slugs are still indexable** (`…/l0k8f8ky8s4yf6dxrl7mo9r4s25vx7`, `…/bsc783vqaltyo7486wej3c50fmnhni`). Both hold real content ("Bondi vs Bondi Junction", "Best Bondi Instagram Accounts"). Migrate to clean slugs with 301s.
7. **Dated-URL migration is NOT recommended as a blanket move** — see §4. 25 of the 37 protected winners *live on* dated URLs; a wholesale reslug would touch every one of them.

**Decision mix (235 rows):** KEEP 163 · REDIRECT 37 · MERGE 12 · EXPAND 11 · NOINDEX 10 · UPDATE 1 · REPLACE 1. Four rows carry a **REQUIRES OWNER APPROVAL** flag (protected pages in a cannibal cluster).

---

## 2. Cannibalization clusters

Survivor picked by: protected status → real ytd → impressions → wordCount. **"Already done"** = a 301 already exists in `next.config.mjs`. Actions on non-protected sources are safe; anything touching a protected URL is flagged.

### Cluster A — "Ultimate Bondi Beach travel guide" (OPEN — highest priority)
**Survivor:** `/bondi-blog/what-to-do-bondi-beach-travel-guide` — 465 ytd · 1982w · protected.

| Member | ytd | w | Action |
|---|---|---|---|
| what-to-do-bondi-beach-travel-guide | 465 | 1982 | **KEEP** — canonical pillar |
| 2026/2/21/…ultimate-bondi-beach-travel-guide-2026-edition | 0 | 582 | **REDIRECT** → survivor |
| 2025/4/30/ultimate-bondi-beach-travel-guide-how-to-get-there… | 0 | 662 | **REDIRECT** → survivor |
| 2025/3/8/the-ultimate-bondi-beach-travel-guide-must-see-spots-hidden-gems | 0 | 446 | **REDIRECT** → survivor |
| 2024/12/13/bondi-beach-travel-guide-50-frequently-asked-questions… | 0 | 2166 | **UPDATE** — retitle to pure FAQ intent, keep + interlink (strong asset, different SERP) |
| 24-hours-in-bondi-beach | 0 | 177 | **MERGE** itinerary section → survivor, then 301 |
| day-trip-bondi-beach-top-tips | 0 | 211 | **MERGE** → survivor, then 301 |

No source here is protected → ship without approval. This is the "3 competing ultimate guides" the brief flagged — it's actually 6.

### Cluster B — Bondi Icebergs "can you swim / access / hours" (OPEN — high priority)
**Two protected pillars:** `2025/4/30/bondi-icebergs-ocean-pool-faq…` (841 ytd, comprehensive FAQ) and `can-anyone-swim-at-bondi-icebergs-swimming-pool` (534 ytd, public-access Q).

| Member | ytd/imp | w | Action |
|---|---|---|---|
| 2025/4/30/…icebergs-ocean-pool-faq | 841 ytd | 563 | **KEEP** pillar (absorb satellite Qs) |
| can-anyone-swim-at-bondi-icebergs-swimming-pool | 534 ytd | 653 | **KEEP** — *REQUIRES OWNER APPROVAL* to merge with FAQ |
| 2024/9/21/can-the-public-swim-at-bondi-icebergs-ocean-pool | 9 imp | 884 | **REDIRECT** → can-anyone-swim |
| 2025/1/5/who-can-swim-at-bondi-icebergs-ocean-pool | 2 imp | 520 | **REDIRECT** → can-anyone-swim |
| 2025/4/29/can-kids-swim-at-bondi-icebergs-family-swimming-guide | 6 imp | 421 | **REDIRECT** (fold kids note first) |
| access-bondi-icebergs-pool | 5 imp | 202 | **REDIRECT** → can-anyone-swim |
| is-bondi-icebergs-pool-heated | 12 imp | 90 | **MERGE** → FAQ, then 301 |
| how-long-is-bondi-icebergs-poo *(broken slug)* | 3 imp | 144 | **MERGE** → FAQ, then 301 |
| 2017/8/28/bondi-icebergs-the-famous-bondi-pool | — | 326 | **MERGE** history → FAQ, then 301 |
| 2025/4/2/bondi-icebergs-closed-due-to-destructive-waves | 1 imp | 195 | **NOINDEX** (stale news) |

### Cluster C — Swim safety / where to swim (OPEN)
**Survivor:** `/where-to-swim-at-bondi-beach` — 849 ytd · core · protected (currently WebSite-only schema; needs Beach/TouristAttraction).

- **KEEP (protected):** `2024/9/8/is-it-safe-to-swim-at-bondi-beach-a-complete-guide` (171 ytd, 940w) — distinct "is it safe" query; differentiate + interlink.
- **REDIRECT →** survivor: `2023/11/7/the-safest-place-to-swim-at-bondi-beach` (184w, 15 imp); `safe-swimming-bondi-beach` (228w).
- **MERGE →** survivor: `swimming-between-flags-bondi-beach` (268w); `2025/1/5/understanding-bondi-beach-safety-signs` (238w).

### Cluster D — Parking (OPEN — but survivors are protected → APPROVAL)
Four parking winners, **all protected**. Two genuinely cannibalize ("bondi parking"):

| Member | ytd | w | Action |
|---|---|---|---|
| 2023/11/20/…car-park-at-bronte-beach | 886 | 297 | **KEEP** — distinct Bronte location |
| 2023/10/4/finding-free-parking-at-bondi-beach-made-easy | 720 | 178 | **KEEP** — *APPROVAL* to consolidate; overlaps ↓ |
| 2025/4/25/ultimate-bondi-beach-parking-guide-free-and-paid-options | 415 | 548 | **KEEP** — *APPROVAL*; comprehensive pillar |
| 2025/6/4/tamarama-coogee-clovelly-beach-parking… | 448 | 938 | **KEEP** — distinct neighbouring beaches |
| tag/parking · tag/car+parking · tag/free+parking | 0 | ~90 | noindex (already) |

**Recommendation:** don't redirect (both are top-25 traffic). Differentiate the two Bondi pages — one "free parking" focus, one "complete free+paid" — and cross-link. Owner sign-off needed either way.

### Cluster E — City2Surf (mostly settled; training already consolidated)
Top 4 all protected → **KEEP**: `city2surf-results` (603), `ultimate-guide-city-to-surf` (451), `city2surf-course-map` (300 — but **55w**, **EXPAND** with a real course description; strong 135-imp query), `where-to-go-afterparty-city-to-surf` (278). `2025/5/6/10-things-…before-running` (971w, 62 imp) KEEP. Training-plan trio + 2017 post → **already redirected** to the Heartbreak-Hill pillar.

### Cluster F — Weather / temperature (OPEN, low stakes)
Two protected pillars: `sunrise-sunset-bondi` (373) and `2024/8/28/average-sea-temperatures…` (227).
- **REDIRECT →** sea-temp: `Bondi-beach-temperature` (396w, 17 imp — *also a broken capital-B slug*).
- **MERGE:** `2023/9/22/el-nio…sea-temperature` (broken slug) → sea-temp; `2023/9/20/chasing-sunrise…` (553w) → sunrise-sunset.
- **NOINDEX:** `2023/12/20/christmas-2024-bondi-weather-forecast` (stale).

### Cluster G — Getting there / transport (OPEN)
Pillar = the `/getting-to-bondi` hub. `how-to-get-to-bondi-beach` is already a 301 *destination* but is only 204w → **EXPAND** or fold into the hub. **MERGE** `nearest-train-station-bondi-beach` (164w, 9 imp) into it. `where-is-bondi-junction` (158w) → **EXPAND** (distinct query). The garbage slug `2023/4/1/l0k8…` (content = "Bondi vs Bondi Junction") → **REDIRECT** to `where-is-bondi-junction`.

### Cluster H — Accommodation: blog vs `/stay` section (OPEN)
`/stay` (8 subpages) is the section pillar. `best-accommodation-bondi-beach` (130 ytd, protected) → **KEEP** + interlink (*APPROVAL* to redirect). `accommodation-options-for-backpackers` (580w) → **REDIRECT** to `/stay/hostels-bondi-beach`. `are-airbnb-legal-in-sydney-bondi` (183w) → **EXPAND** (distinct legal query).

### Cluster I — Restaurants (already consolidated, but survivor is a stub)
`best-restaurants-bondi-beach` is the redirect destination for two pages — including the protected, richer `must-experience…` (134 ytd, 1118w) — yet is only **221w**. **EXPAND** the survivor / migrate the richer body **before** relying on the redirect. Flagged because it inverts the "richest page wins" rule.

### Cluster J — Café / coffee (DONE)
`2025/4/27/top-10-bondi-cafs-in-2025` survives; the 2026/3/24, 2025/6/26 and 2024/1/19 dups are **already 301'd** in. No action.

**Tag pages (223):** all noindex — no cannibalization risk to the index. Housekeeping only: prune orphan tags with 0 associated posts. Treated as one summary row in the CSV.

---

## 3. The 65 "thin indexable" pages — bucketed

First, **remove the 15 false positives** (`0 wordCount` app-rendered structural pages): 7 hubs, 8 Place pages / `/bondi-icebergs`. These are **KEEP** (they render rich content the crawler missed; several also need schema added — see `data-gaps.json` `pagesWithoutSchema`). That leaves ~50 genuinely thin pages:

**→ EXPAND (real query, too shallow) — 11**
`city2surf-course-map` (55w/135 imp), `how-to-pronounce-bondi-beach` (50w/28 imp), `where-is-bondi-junction`, `best-restaurants-bondi-beach` (survivor stub), `bondi-beach-toilets-showers-change-rooms` (0w — *investigate empty render*), `surfing-at-bondi`, `bondi-muscle-beach`, `are-airbnb-legal-in-sydney-bondi`, `2024/1/20/is-bondi-beach-water-clean-or-polluted`, `2025/1/5/…wheelchair-access`, `how-to-get-to-bondi-beach`.

**→ MERGE into a pillar/hub then 301 — ~12**
`24-hours-in-bondi-beach` & `day-trip-bondi-beach-top-tips` → travel-guide pillar; `hidden-gems-bondi-beach` → travel-guide; `nearest-train-station-bondi-beach` → how-to-get-to; `swimming-between-flags`, `2025/1/5/…safety-signs` → where-to-swim; `is-bondi-icebergs-pool-heated`, `how-long-is-bondi-icebergs-poo` → icebergs FAQ; `ben-buckler-name-history` → `/ben-buckler`; `el-nino…`, `chasing-sunrise…` → weather pillars; `2017/8/28/…famous-bondi-pool` → icebergs FAQ.

**→ REDIRECT (exact-intent dup) — see clusters B/C/F/H above + garbage slugs**
The two garbage slugs (`l0k8…`, `bsc783…`), `Bondi-beach-temperature`, `safe-swimming-bondi-beach`, `2023/11/7/safest-place-to-swim`, the icebergs satellites, `2023/11/9/2024-bondi-beach-event-calendar` → `/whats-on`, `accommodation-options-for-backpackers` → `/stay/hostels`.

**→ NOINDEX (thin + low value / stale / off-topic) — ~10**
`2024/9/16/how-to-find-a-housemate-in-bondi-beach` (off-topic), `2024/12/26/can-you-jump-from-the-cliff-at-bronte-beach` (97w + liability), `2024/4/6/storm-chaos-forced-closures…` (stale), `2025/4/2/bondi-icebergs-closed-due-to-destructive-waves` (stale), `2023/12/20/christmas-2024-…forecast` (stale), `bondi-winter-magic`, thin category pages `category/City2Surf` `/People` `/History` (<280w).

**→ KEEP (thin but genuine distinct long-tail; refresh only) — remainder**
`2023/9/11/…drone…` (protected, 204 ytd), `2024/1/25/…dolphins…`, `2023/8/8/does-bondi-beach-get-busy`, `2024/9/21/the-bondi-hum-real-or-hoax`, `2024/10/1/…crumbl-cookie-scam`, `2023/10/1/daylight-saving…`, `2023/12/26/gwyneth-paltrow…`, `2017/5/7/bondis-most-famous-residents`, `is-bondi-beach-patrolled-by-lifeguards`.

---

## 4. The dated `/bondi-blog/YYYY/M/D/` URL pattern — recommendation

**Scope:** 141 dated URLs (126 indexable), spanning 2017–2026. Year mix: 2023 (38), 2024 (37), 2025 (56). Clean-slug legacy posts number 65. So the site runs a **split convention** — some posts on dated paths, some on clean slugs — a legacy of the Squarespace migration.

**Recommendation: DO NOT bulk-migrate dated URLs to clean slugs. Retire the *pattern* for new posts only, and reslug case-by-case.**

Rationale / risk quantification:
- **25 of the 37 protected winners are dated URLs** (e.g. the 841-ytd Icebergs FAQ, 886-ytd Bronte parking, 720-ytd free-parking, 461-ytd running routes, 353-ytd Sunday's-opening-hours). `seo-protected-pages.json` sets `allowRedirect:false` and an `expectedCanonical` on the dated path for each. A blanket reslug would fire 301s on **every protected winner at once** — maximal risk (temporary ranking wobble, redirect chains, canonical churn) for cosmetic gain. Google ranks dated URLs perfectly well.
- **Backlinks & Search Console history** attach to the live dated URLs; reslugging resets that URL's measured history and needs GSC re-processing.
- The existing `next.config.mjs` philosophy is explicit and correct: *"individual /bondi-blog/[post] article URLs are preserved exactly to keep their rankings and backlinks."* Only the blog *index* was redirected.

What to do instead:
1. **New posts:** publish on clean, hub-scoped slugs (the `articleTopic`/`articleHub` architecture in `lib/articles.ts`), not dated paths. Stop minting `/YYYY/M/D/` URLs.
2. **Reslug only where a slug is genuinely broken**, never in bulk: the 2 garbage-ID slugs (`l0k8…`, `bsc783…`) → **REPLACE** with clean slugs + 301; the mojibake slugs (`el-nio` for "el niño", `how-long-is-…-poo` for "pool") → fix on the same page a redirect is already planned for.
3. **Protected dated URLs:** leave exactly as-is. Any reslug of these is **REQUIRES OWNER APPROVAL** and should be declined absent a compelling reason.
4. If a future clean-slug taxonomy is ever adopted wholesale, do it **incrementally, lowest-traffic-first**, one small batch per deploy, watching GSC — not as a big-bang.

**Net:** the dated pattern is a cosmetic wart, not an SEO liability. The ROI of mass migration is negative given the protected-page concentration. Kill it going forward; leave the archive alone.

---

## 5. Priority action list (ship order)

1. **Cluster A (travel-guide) redirects** — 3–4 non-protected 301s into the 1982w pillar. No approval. Highest cannibal relief.
2. **Cluster B (icebergs) satellite redirects** — ~6 non-protected 301s into the two protected pillars.
3. **Expand the two protected stubs feeding redirects** — `best-restaurants-bondi-beach` (221w) and `city2surf-course-map` (55w) — *before* they absorb equity.
4. **Cluster C/F/G/H** small-batch 301s + merges (non-protected sources).
5. **Fix the 2 garbage slugs + mojibake slugs** (REPLACE/301).
6. **NOINDEX** the ~10 stale/off-topic thin pages; **noindex** the 3 thin category pages.
7. **Add schema** to the 7 hubs + the schema-less core pages (`data-gaps.json.pagesWithoutSchema`), incl. Beach/TouristAttraction on `/where-to-swim-at-bondi-beach`.
8. **Owner-approval queue:** parking consolidation (D), icebergs FAQ↔can-anyone-swim merge (B), accommodation blog→/stay (H). Present, don't ship.

All per-page rows, with `cannibalWith` targets and priority, are in **`audit/page-decisions.csv`**.
