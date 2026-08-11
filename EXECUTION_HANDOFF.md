# Execution Handoff — Dominance Plan

**Date:** 2026-08-11 · **Branch shipped from:** `claude/bondi-beach-migration-a3xd44` → **deployed to `main`** (production) in 5 validated batches. Every batch passed `tsc` · `vitest` (74) · `seo-qa` (0 errors) · production build before deploy, and touched **no protected URL** and fired **no redirect**.

This documents (1) what is now live, (2) what is **blocked on you** and exactly how to unblock it, and (3) the **redirect-approval queue** that needs your yes before anything fires.

---

## 1. What shipped to production (done)

| Batch | What went live |
|-------|----------------|
| **1 — Technical + integrity** | Removed the shared fake venue image from `Restaurant` schema (integrity); noindexed the 6 equity-leaking `category` pages + stopped the followable links to the old Squarespace site; sitemap `lastModified` on static routes; dropped the non-standard robots `host`; **`npm run seo:check-index`** post-deploy guard for the `NEXT_PUBLIC_IS_PRODUCTION` single-point-of-failure. |
| **2 — AEO substrate + author** | New **`answer`** + **`table`** content blocks (extractable answers + semantic comparison tables for AI engines); global **author entity** with a stable `@id` (honest Organization), referenced by every article. Proof retrofit on the swim-safety pillar. |
| **3 — New hubs** | **`/bondi-parking`** (~2,470 YTD views), **`/city2surf-and-running`** (~2,090, rescues the orphaned marathon cluster), **`/bondi-surfing`**, **`/itineraries`** — built above the winners, 27 verified spoke links, corrected classifier order, enriched Swim hub, and a **footer mega-nav** surfacing all 12 hubs sitewide. |
| **4 — Coastal + homepage** | Coastal-walk **`TouristAttraction`+`HowTo`** schema (from the visible route); homepage **"Start here" 12-hub grid** + **"Planning your visit"** band; well-formed hub `ItemList`. |
| **5 — Freshness + CTR** | `freshnessClass`/`checkType` fields + **"Last locally checked" vs "Last reviewed"** convention (suppressed on evergreen) + **`npm run freshness:audit`**; 8 high-traffic over-length titles rewritten ≤60 chars. |
| **6 — Utility** | `datasetJsonLd()` helper ready for the flagship dataset; this handoff. |

New scripts you can run anytime: `npm run seo:check-index` (BASE=…), `npm run freshness:audit`, `npm run seo:regression`, and `node scripts/score-opportunities.mjs`.

---

## 2. Blocked on you — with exact unblock steps

I did **not** fake any of these (the integrity rules and your own protection brief forbid it). Each is small once you provide the missing real input.

### 2.1 Turn on affiliate revenue (fastest money — ~zero code)
`lib/affiliate.ts` is a live Travelpayouts wrapper that returns plain URLs until markers are set, then tracks every CTA.
1. Register at travelpayouts.com; get your **marker** + program IDs (Booking.com, Hostelworld, Tripadvisor).
2. Set env vars in Vercel **Production**: `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`, `NEXT_PUBLIC_TP_P_BOOKING`, `…_HOSTELWORLD`, `…_TRIPADVISOR`.
3. Every `/stay` CTA becomes tracked on the next deploy. **Tell me when the IDs exist** and I'll wire GA4 outbound + `sub_id` capture and add the Viator/GetYourGuide adapter for tours/surf (same wrapper, new program ID).

### 2.2 Named authors → `Person` schema (biggest E-E-A-T win)
The author entity currently ships as the honest **Organization** "editorial team" (no fabricated people). To upgrade to `Person` (the moat national publishers can't fake):
1. Give me **1–4 real names + real bios + real Bondi tenure** (and any real `sameAs`: personal site/LinkedIn/IG).
2. I'll build `data/authors.ts` + `/team/<id>` pages, flip `authorJsonLd()` to `Person` with `homeLocation` → the Bondi place `@id`, and byline each article. (Env shortcut for a single author already exists: `NEXT_PUBLIC_AUTHOR_TYPE=Person` + `NEXT_PUBLIC_AUTHOR_NAME`.)

### 2.3 Real-data assets (I built the plumbing; the facts are yours to collect)
These need on-the-ground data I must not invent:
- **Bondi Coffee Price Index** — the `datasetJsonLd()` helper is ready. Needs a real price census (flat-white prices observed + photographed across the café set). Give me the collected CSV and I'll build `/bondi-coffee-price-index` + the charts + `Dataset` schema.
- **Accessibility guide / coastal-walk facilities (toilets, water)** — need verified facts (Waverley Council + a physical check). Send the verified details and I'll write the pages (conservative, sourced).
- **`/bondi-map`** — I'll build the interactive map + crawlable pin list once facility pins are sourced (never guessed coordinates).
- **Surf-schools / activities directory** (`data/surfSchools.ts`) — I'll ship the type + verify gate + pages once we have the verified operator list (Let's Go Surfing confirmed as Bondi's licensed school).

### 2.4 Newsletter
Needs an ESP account (double opt-in). Provide the ESP and I'll wire capture + a disclosure component.

---

## 3. Redirect-approval queue (needs your explicit yes)

Per your SEO Protection Brief — *"do not implement a redirect without asking me first."* The new hubs are built **around** these; the 301s are **not** fired. Each needs OLD → NEW sign-off:

| # | Proposed 301 | Why | Traffic at stake |
|---|--------------|-----|------------------|
| A | Icebergs "can-anyone-swim" satellites (~6 non-protected pages) → the two protected Icebergs pillars | Consolidate the "can you swim at Icebergs" swarm; **survivors are protected** (841 + 534 YTD) | ~0-view satellites merge into 841+534 pillars |
| B | The 3–4 non-protected "ultimate Bondi travel guide" duplicates → `/bondi-blog/what-to-do-bondi-beach-travel-guide` (465 YTD) | Kill the 6-page cannibal cluster onto the winner | duplicates are 0-view; concentrates onto 465 |
| C | Merge the two protected Bondi *parking* pillars (free-parking 720 ↔ ultimate-parking 415) | They partly cannibalize "bondi parking" | **both protected** — needs sign-off |
| D | `best-accommodation-bondi-beach` (130, protected) → `/stay` | Blog spoke vs the /stay section | protected — needs sign-off |

**Recommendation:** approve **A and B** (survivors are strong, sources are low/zero-traffic dups) — I'll first migrate any richer body into the survivor, then fire the 301 through the existing plumbing. Hold **C and D** unless you want them. Also flagged from the content audit: the earlier-approved `must-experience-restaurants` → `best-restaurants-bondi-beach` redirect currently points into a **thinner** survivor — I should expand `best-restaurants-bondi-beach` (221w) before it keeps absorbing that equity. Say the word and I'll do B + A + the restaurant-survivor expansion in one batch.

---

## 4. Ready-to-build backlog (no blockers — just say go)

These are pure engineering I can do next without any owner input, drawn from the Top-100 (`audit/top-100-opportunities.csv`):
- **Classify all 199 authored bodies** with a `freshnessClass` (the audit currently shows 199 unclassified) → generates the maintenance calendar.
- **AEO-retrofit the P0 clusters** (Icebergs, parking, transport) with `answer` + `table` + FAQ blocks, the way the swim-safety pillar now is.
- **`/coogee-beach` + `/clovelly-beach`** location nodes (conservative, sourced) so the coastal route stops all link.
- **Coastal-walk standalone spokes** (toilets, cafes-before/after, accessibility) — content pass.
- **Bondi-vs-Manly / Bondi-vs-CBD** comparison pages with `table` blocks.

---

## 5. How to verify production right now
```
BASE=https://www.visitbondibeach.com npm run seo:check-index   # indexability guard
BASE=https://www.visitbondibeach.com npm run seo:regression     # protected pages intact
```
Both should pass. The full strategy + evidence is in `VisitBondiBeach.com-Dominance-Plan.md` and `audit/`.
