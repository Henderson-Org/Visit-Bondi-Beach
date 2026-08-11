# Technical SEO Audit — visitbondibeach.com

**Scope:** crawlability/indexability, robots, sitemap, canonicalization, redirect hygiene,
metadata, headings, images, JS/hydration, URL structure, orphans/crawl depth, ISR.
**Method:** static analysis of the actual repo (Next.js 16 App Router, SSG+ISR on Vercel).
No live crawl, GSC API, Ahrefs/SEMrush, or PageSpeed field data was available in-session —
Core Web Vitals statements below are **inferred from code (posture), not measured**, and are
labelled as such. Corpus = 458 URLs in `content/pages.json` (210 indexable), plus code-defined
app routes (`/stay`, `/whats-on`, `/bondi-eat-and-drink`, `/plan`, `/articles`).

> Bottom line: this is an unusually well-built migration. Redirect hygiene, environment-aware
> indexing, structured data, image policy and font strategy are all done to a high standard.
> The real technical risks are narrow: a single-env-var dependency for whole-site indexing,
> six thin/orphan category pages that leak equity to the old Squarespace site, and ~36
> over-length titles that truncate in SERPs. Most of the corpus is already clean.

---

## Severity summary

| # | Sev | Finding | File |
|---|-----|---------|------|
| C1 | CRITICAL | Whole-site indexability hinges on one env var (`NEXT_PUBLIC_IS_PRODUCTION`) | `lib/site.ts:34`, `app/robots.ts:10` |
| H1 | HIGH | 6 category pages: indexable + in sitemap, thin, near-duplicate, orphaned, and each links out to the old live site | `app/[...slug]/page.tsx:417-440` |
| H2 | HIGH | External links to the old Squarespace site are plain `<a>` (no `rel=nofollow`) | `app/[...slug]/page.tsx:150-153, 428` |
| M1 | MEDIUM | 36 indexable pages have titles that truncate in SERPs even after the brand-suffix drop | `app/[...slug]/page.tsx:99-100` |
| M2 | MEDIUM | Thin/zero-demand indexable inventory: 65 pages <300 words, 82 with 0 impressions | `content/pages.json` |
| M3 | MEDIUM | Sitemap `STATIC_ROUTES` (the hubs/sections) carry no `lastModified` | `app/sitemap.ts:54-58` |
| M4 | MEDIUM | 3 of 7 topic hubs absent from persistent header/footer nav (deeper crawl path) | `lib/site.ts:60-69` |
| L1 | LOW | `robots` `host` field is non-standard (Yandex-only), ignored by Google | `app/robots.ts:18` |
| L2 | LOW | robots disallows `/search` and `/api/`, neither of which exists as a route | `app/robots.ts:15` |
| L3 | LOW | `/adstxt` crawl-artifact page statically generated as a noindex page | `content/pages.json` |
| L4 | LOW | No explicit AI-crawler allow rules (currently allowed only by the `*` default) | `app/robots.ts` |
| L5 | LOW | Dated URL pattern `/bondi-blog/YYYY/M/D/slug` — cosmetically weak, but keep | corpus-wide |

There is **no genuine "site is broken" defect** — the one CRITICAL is an operational
single-point-of-failure, not a coding bug.

---

## 1. Crawlability & indexability

**How the pieces interact (correct):**
- `generateStaticParams()` (`app/[...slug]/page.tsx:78-82`) enumerates every content path
  except (a) `%`/`+`-encoded slugs, (b) `REDIRECTED_PATHS` (24 consolidated duplicates +
  section swaps), and (c) `OWNED_BY_ROUTE` (`/bondi-eat-and-drink`, owned by its real app
  route). `dynamicParams = true` (line 37) means encoded category/tag archives render
  on-demand instead of at build — a deliberate, safe choice.
- Redirected paths are **excluded from static generation** so the catch-all never renders a
  live page that would shadow the 301. Verified: all 24 `next.config.mjs` redirect sources are
  present in `REDIRECTED_PATHS`, and none are `indexable:true` in `pages.json`, so none leak
  into the sitemap (script-verified: **0 leaks**).
- Per-page indexability is `page.indexable && isProduction()` (`app/[...slug]/page.tsx:101`),
  emitting `robots: { index:false, follow:true }` when false — noindex,**follow** is the right
  choice (link equity still flows). This is layered under a global staging noindex in
  `app/layout.tsx:45`. Belt-and-braces, good.

**Verified non-issue — the MigrationNote is dead code for indexed pages.** `ArticlePage`
renders a "being migrated… view on the live site" note when a page has no body blocks
(`app/[...slug]/page.tsx:412, 146-156`). After merging the 200 authored bodies in
`content/body-overrides.json`, **0 indexable pages** fall into that branch (script-verified).
Every indexed article has real content. The zero-`wordCount` location pages
(`/bondi-beach`, `/north-bondi`, `/tamarama-beach`, etc.) are served by the richer
`LocationPage` template via `getLocation()` (`app/[...slug]/page.tsx:130-131`), not the article
fallback, so their empty `pages.json` body is irrelevant. This is a real strength — no thin
migration stubs are indexed.

**Are the 65 thin indexable pages a liability?** Partially (see M2). Most are short but
legitimate Q&A answer pages; the concern is the tail with **zero search demand**.

---

## 2. robots.ts

`app/robots.ts` is environment-aware and correct in shape:
- Non-production → `{ userAgent: '*', disallow: '/' }` — staging/preview can never be indexed.
- Production → `allow: '/'`, `disallow: ['/api/','/search']`, sitemap on the prod origin,
  plus a `host` directive.

**AI-bot / AEO access (good).** There is **no** `Disallow` targeting GPTBot, PerplexityBot,
ClaudeBot/anthropic-ai, Google-Extended, CCBot, or Bytespider. Because the only rule is
`userAgent: '*' → allow: '/'`, **all AI crawlers are currently allowed** — the correct posture
for Answer-Engine Optimization on a content site that wants to be cited. This pairs well with
the heavy FAQ/answer-first schema. **Keep it this way.**

- **L1** — `host: siteOrigin()` (line 18): the `host` directive is a non-standard Yandex-ism;
  Google/Bing ignore it. Harmless but noise. Safe to drop.
- **L2** — `disallow: ['/api/','/search']` (line 15): neither `/api` nor `/search` exists as a
  route in `app/`. No harm, but it's guarding nothing.
- **L4** — Because AI access is granted only implicitly via `*`, a future broad `Disallow`
  could accidentally catch AI bots. To *lock in* the AEO posture, consider explicit
  `{ userAgent: 'GPTBot', allow: '/' }`-style rules (optional).

---

## 3. sitemap.ts

Structurally sound: merges `STATIC_ROUTES` (app routes) with `fromContent` (indexable content
pages), filters `p.indexable && !REDIRECTED`, and de-dupes by URL
(`app/sitemap.ts:62-67`) so `/bondi-eat-and-drink` (present in both) appears once.
All URLs use `PROD_ORIGIN` regardless of deploy alias — canonically correct.

- **M3** — `STATIC_ROUTES` entries emit **no `lastModified`** (`app/sitemap.ts:54-58`), while
  content pages do (line 49). The hubs and money pages (`/stay`, `/whats-on`,
  `/bondi-eat-and-drink`) are exactly the URLs you most want recrawled after an update, yet
  they ship the weakest freshness signal. Add a `lastmod` (even a per-section constant bumped
  on deploy, or the events/accommodation data's newest `lastVerified`).
- **Note (fine):** the local `REDIRECTED` set (line 16) only lists `/accommodation` and
  `/bondi-blog`; that's sufficient because every *other* redirect source is already
  `indexable:false` and thus filtered by the `indexable` predicate. Verified no redirect
  source reaches the sitemap.
- **H1 interaction:** the 6 `category` pages are `indexable:true`, so they **are** emitted into
  the sitemap today (see §7).

---

## 4. Canonicalization (lib/site.ts)

Strong. `siteOrigin()` returns `PROD_ORIGIN` whenever `isProduction()`, so canonicals / OG /
JSON-LD always print `https://www.visitbondibeach.com` even when served from a `*.vercel.app`
alias (`lib/site.ts:17-27`). `metadataBase` is set once in `app/layout.tsx:31`, and every page
declares a self-referential relative canonical via `alternates.canonical`
(`app/[...slug]/page.tsx:113`, `app/stay/page.tsx:31`, `app/whats-on/page.tsx:23`, homepage
`app/page.tsx:22`). Case-sensitive path resolution with a decoded/normalized fallback
(`lib/content.ts:150-153`) preserves Squarespace's case-sensitive URLs while still resolving
encoded variants — and the canonical always points at the stored path, so a variant can't
self-compete. No issues found.

---

## 5. Redirect hygiene (next.config.mjs)

**Excellent — this is the cleanest part of the codebase.** Script-verified across all 24
redirects:
- **0 redirect chains** (no destination is itself a redirect source).
- **0 loops.**
- **0 sitemap leakage** (no source is indexable).
- Destinations all resolve: 22 exist in `pages.json`; the remaining 2 (`/stay`, `/articles`)
  are real app routes. No dead 301 targets.
- Every consolidation source is mirrored in both `next.config.mjs` and `REDIRECTED_PATHS`
  (`app/[...slug]/page.tsx:43-71`) **and** set `indexable:false` in `pages.json` — the
  three-way consistency the CLAUDE.md prescribes is actually maintained.

The cannibalization-consolidation program (café, Bondi Rescue, "best time to visit",
restaurants, City2Surf, rainy-day clusters) is evidence-based on embedded GSC impressions and
correctly preserves the higher-equity URL. Nothing to fix here.

---

## 6. Metadata generation

**Strengths:** title template `%s — Visit Bondi Beach` (`app/layout.tsx:32-35`); the catch-all
**drops the brand suffix** when `clean + suffix > 60` chars and emits an `absolute` title
instead (`app/[...slug]/page.tsx:99-100`) — a smart, deliberate CTR fix. OG images are
back-filled for hub/core pages from `lib/hubs.ts` (lines 104-109) since those carry no
`ogImage` in `pages.json`. `openGraph.type` correctly switches `article` vs `website`
(line 118). Twitter uses `summary_large_image` globally (`app/layout.tsx:43`) and inherits OG
images via Next's metadata merge — acceptable (**L5**: no per-page Twitter image, but the OG
fallback covers it).

- **M1 — 36 indexable titles still exceed ~60 chars *after* the brand suffix is removed**
  (script-verified). The suffix-drop logic only helps titles that fit once the suffix is gone;
  these are long on their own and will truncate in SERPs regardless. Worst offenders include:
  - `The Complete Guide to Bondi Icebergs: Discover the Iconic Pool, Bistro, and Wellness…` (125)
  - `Bronte Beach Backpackers' Christmas 2025: Ultimate Guide for the Orphan's Christmas…` (95)
  - `25 Essential Hacks for Starting a New Life in Australia: The Ultimate Aussie Arrival…` (90)
  - `Bondi Beach New Year's Eve Festival Returns: Council Approves Iconic Celebration's…` (90)
  - `Bondi's Saturday Farmers Market: Your Complete Guide to Fresh, Local Produce by the…` (89)

  Fix: hand-write shorter `title`s (front-load the keyword, ≤60 chars) for the subset that has
  impressions; leave zero-demand ones for the M2 consolidation pass. This is worth doing —
  CLAUDE.md flags site-wide CTR (~1.2%) as the #1 problem, and truncated titles are a direct
  CTR tax.
- **Meta descriptions:** sourced from `page.metaDescription` and omitted when absent
  (`app/[...slug]/page.tsx:112`) — no fabricated fallbacks. Good, though pages missing one get
  a Google-generated snippet; worth auditing coverage in the content pass (out of scope here).

---

## 7. The category-page problem (H1 / H2)

The 6 `contentType:'category'` pages — `/bondi-blog/category/{Travel, Out+%26+About, City2Surf,
People, History, Swim}` — are all `indexable:true` and have **no body** in `pages.json`. They
render `ArchivePage` (`app/[...slug]/page.tsx:417-440`), which:
1. Shows a thin, **identical** payload on every one of them: the same `recentArticles(6)` grid
   (line 434) — i.e. 6 near-duplicate pages.
2. Emits a prose line "Full archive filtering is being rebuilt during the migration — **view on
   the live site**" with a plain `<a href={page.liveUrl}>` (**line 428**) pointing at the old
   Squarespace site — a followable link **leaking equity to a competing domain**.
3. Is effectively **orphaned**: the only internal linker is `BlogIndex` (the category chips,
   lines 451-463), but `/bondi-blog` is 301'd to `/articles`, so `BlogIndex` never renders in
   production. These pages have no live inbound links yet sit in the sitemap.

**Fix (H1):** either set these `indexable:false` (add to the noindex set — they carry near-zero
demand) so they drop from the sitemap, or replace `ArchivePage` with a real topic archive
(reuse the `/articles` topic facets in `lib/articles.ts`) and delete the live-site escape hatch.
Given the `/articles` hub already organizes posts by topic, **noindexing the 6 legacy category
URLs is the low-risk move.** Note `audit/data-gaps.json` only lists 3 of these
(City2Surf/People/History) — it **undercounts**; Travel, Out+%26+About and Swim are also
indexable.

**Fix (H2):** any remaining external link to `page.liveUrl` (`ArchivePage` line 428 and the
otherwise-dead `MigrationNote` lines 150-153) should be `rel="nofollow noopener"` — the
authored-source links already do this correctly (line 242, 394), so this is just consistency.

---

## 8. Thin / zero-demand inventory (M2)

Among 210 indexable pages: **65 have <300 words**, and **82 have zero GSC impressions**
(script-verified from `audit/page-inventory.csv`). Of the 65 thin pages, only 30 have any
impressions at all (462 total). Much of the "thin" set is legitimate — short answer-cards
(`/bondi-blog/how-to-pronounce-bondi-beach`, `…/is-bondi-icebergs-pool-heated`) that can rank
for a precise query, and location pages whose real content isn't counted in `wordCount`. The
liability is the **zero-impression + genuinely-thin overlap**: these dilute site quality
signals and spend crawl budget without upside. Recommend the same evidence-based treatment
already applied to the 301 clusters: for each zero-demand thin page, either (a) merge into a
stronger sibling and 301, or (b) `indexable:false`. This is a content-pass task, not a code fix,
but the plumbing (`indexable` flag + `REDIRECTED_PATHS` + `next.config` 301) is ready for it.

---

## 9. Image strategy

Solid and enforced. `next.config.mjs:10` sets `remotePatterns: []`, which makes independence
from the Squarespace CDN a hard build/runtime error rather than a convention — any stray remote
image URL fails loudly. All rendering goes through `next/image` with `fill` + explicit `sizes` +
`priority` on LCP heroes (`app/page.tsx:47-55`, `app/[...slug]/page.tsx:339-349`), and images
are self-hosted WebP under `/public/images`. `public/ads.txt` is present (AdSense).

**Inferred CWV posture (not measured):** LCP should be healthy — the hero is a priority
next/image with a `sizes="100vw"` and Vercel's optimizer serves responsive WebP/AVIF. CLS risk
is low: heroes use aspect-ratio containers (`aspect-[16/9]`, `min-h-[78vh]`) so layout is
reserved before paint. **Not measurable in-session:** actual LCP/INP/CLS field values.

---

## 10. JS dependency & hydration

The primary reading experience is **server-rendered and crawlable without JS**: article bodies,
hub sections, breadcrumbs, headings, and all internal links render on the server. Mobile nav is
plain server-rendered `<Link>`s in an overflow-scroll list, explicitly "no JS dependency"
(`components/SiteHeader.tsx:33-44`) — good; no hidden-behind-hamburger crawl trap. Client
interactivity (filter browsers on `/stay`, `/whats-on`, dining) is layered over a fully-rendered
list, so content is present pre-hydration. Third-party JS (AdSense, Analytics, Travelpayouts) is
loaded via dedicated components at the end of `<body>` (`app/layout.tsx:65-67`).
**Inferred:** the ad/analytics scripts are the main INP/main-thread risk; confirm they use
`next/script` with `strategy="afterInteractive"`/`lazyOnload` (out of scope — check
`components/Adsense.tsx`). No hydration-blocking content issues found.

---

## 11. URL structure — the dated blog pattern (L5)

Legacy Squarespace URLs `/bondi-blog/YYYY/M/D/slug` (non-zero-padded month/day) persist for
~185 posts. **Recommendation: keep them.** They are not a ranking penalty — Google treats the
date segment as opaque path. Re-slugging live, ranking URLs would forfeit accrued equity and
backlinks for cosmetic gain; the migration deliberately preserves them
(`next.config.mjs:22-23` comment). Where a dated URL *duplicated* a cleaner one, the
consolidation program already 301'd to the clean slug (e.g. `best-restaurants-bondi-beach`,
`how-to-get-to-bondi-beach`). The only latent downside is that a visible date can look stale in
the SERP; the article template already surfaces an "Updated" date
(`app/[...slug]/page.tsx:316-327`) which mitigates this. No action beyond continuing to mint
**new** posts on clean, dateless slugs (as several already are).

---

## 12. Orphans & crawl depth (M4)

Internal linking is generally strong: every article up-links to its **topical hub** via both a
visible "Part of our {hub} guide" link and the breadcrumb parent (`lib/articles.ts:63-67`,
`lib/content.ts:281-288`) — this gives ~185 blog spokes an intentional hub link rather than only
the flat `/articles` index. `relatedPages()` adds token-scored contextual links
(`lib/content.ts:259-274`). Hubs cross-link via CTA modules (`lib/hubs.ts`).

- **M4** — The persistent header/footer nav (`lib/site.ts:60-69`) lists 8 destinations but
  **omits 3 of the 7 topic hubs**: `/bondi-coastal-walk`, `/bondi-rescue`, `/bondi-weather`.
  They're reachable via homepage quick-links (`app/page.tsx:27-37`) and contextual CTAs, so
  they're not true orphans, but they sit one hop deeper and get no sitewide anchor. Consider
  adding at least Coastal Walk and Weather to the footer's Explore column (cheap, sitewide,
  keyword-rich anchors to important hubs).
- Tag pages (248, all noindex,follow) are effectively orphaned but that's **correct** — they're
  noindex and excluded from the sitemap; no fix needed.
- **L3** — `/adstxt` (a crawl artifact in `pages.json`, `indexable:false`, 37 words) is still
  statically generated as a noindex page rendering `ArticlePage`. Harmless (not in sitemap) but
  junk; add to `REDIRECTED_PATHS`/`OWNED_BY_ROUTE` or drop from the corpus. The real
  `public/ads.txt` file is correctly in place.

---

## 13. ISR / revalidate

Sensible and content-appropriate:
- Hub/core/article pages (catch-all) export **no `revalidate`** → fully static SSG, rebuilt on
  deploy. Correct for evergreen editorial.
- Time-sensitive routes revalidate: `/whats-on` + date/intent pages `1800`s (30 min)
  (`app/whats-on/*`), `/stay`, `/bondi-eat-and-drink`, `/articles`, venue pages `86400`s (24 h).
- The **live water-temp injection** on core-page hubs (`app/[...slug]/page.tsx:183-194`) fetches
  conditions with a `fetch(..., { next: { revalidate: REVALIDATE_SECONDS } })` data-cache TTL
  (`lib/conditions/service.ts:27-34`), which propagates ISR to the otherwise-static route with
  stale-while-revalidate. So "today's" reading refreshes on the fetch cadence rather than
  freezing at build — correctly designed. No issue.

---

## 14. Structured data (cross-check, since the CSV `jsonLdTypes` column is stale)

The real schema lives in `lib/structured-data.ts` and is emitted from the templates — **not**
what the stale `page-inventory.csv` `jsonLdTypes` column shows. Coverage is broad and
integrity-safe: Organization + WebSite (sitewide, `app/layout.tsx:52-59`), the canonical
**Bondi Beach `TouristAttraction`/`Beach`** entity with real geo, containment hierarchy and
Wikipedia/Wikidata `sameAs` (lines 65-96), BlogPosting bound to that entity via `about`
(line 122), BreadcrumbList on articles/hubs, FAQPage **only when the Q&As are visibly rendered**
(`lib/content.ts:297-302`), Event (only with a concrete `startDate`), LodgingBusiness/
FoodEstablishment (durable facts only, **no fabricated ratings/hours**). The
`data-gaps.json.pagesWithoutSchema` list (the 7 hubs) is **inaccurate**: hubs emit
BreadcrumbList + the Bondi Place entity via `CorePageHubView`/`HubView`
(`app/[...slug]/page.tsx:201-214`, `components/HubView.tsx:10`). The genuine gap is that the
`hub` `contentType` in `HubView` does not appear to emit an ItemList/CollectionPage for its
curated links — a minor enhancement opportunity, not a defect. (Schema quality belongs to a
separate audit; noted here only to correct the stale inputs.)

---

## What's already done well (do not "fix")

- **Redirect hygiene:** 0 chains, 0 loops, 0 sitemap leaks, all destinations valid, three-way
  consistency (config ↔ router set ↔ `indexable` flag) maintained.
- **Environment-aware indexing** with belt-and-braces staging noindex (robots + per-page +
  layout).
- **Canonical host discipline** — always prints the prod domain, alias-proof.
- **Image independence enforced** by `remotePatterns: []`.
- **Self-hosted variable font**, single preload, `display:swap`, serif fallback — low CLS risk.
- **No thin migration stubs indexed** — every indexed article has a real authored/crawled body;
  the MigrationNote never fires for an indexable page.
- **Correct heading hierarchy** — exactly one `h1` per template via `EditorialHero`
  (`components/EditorialHero.tsx:42`), h2/h3 below.
- **AI crawlers allowed** — good AEO posture.
- **Answer-first content + FAQ schema gated on visible Q&As** — no schema spam.
- **Smart title CTR handling** — brand suffix dropped when it would overflow 60 chars.

---

## Top 10 technical fixes, ranked

1. **Guarantee `NEXT_PUBLIC_IS_PRODUCTION=true` on the prod deploy, and add a smoke check.**
   (C1) The entire site's indexability + `robots.txt` flips to noindent/Disallow if this env var
   is missing (`lib/site.ts:34`, `app/robots.ts:10`). Add a post-deploy assertion that
   `/robots.txt` contains `Allow: /` and that the homepage lacks a `noindex` — a misconfigured
   deploy silently deindexes everything.
2. **Noindex the 6 legacy `category` pages** (or rebuild them as real archives) and remove the
   old-site escape link. (H1) They're thin, near-duplicate, orphaned, and currently in the
   sitemap. Fastest path: add all 6 to the noindex set so they drop from the sitemap.
3. **Rewrite the ~high-impression subset of the 36 over-length titles** to ≤60 chars,
   keyword-first. (M1) Directly targets the flagged 1.2% site-wide CTR problem.
4. **`rel="nofollow noopener"` on every link to the old Squarespace `liveUrl`** in
   `ArchivePage`/`MigrationNote`. (H2) Stop leaking equity to a competing domain.
5. **Run the thin/zero-demand consolidation pass** — 301 or noindex the ~52 pages that are both
   thin and have zero impressions. (M2) Reuse the existing 301 plumbing.
6. **Add `lastModified` to sitemap `STATIC_ROUTES`.** (M3) The hubs/sections are your most
   update-worthy URLs and currently ship no freshness signal.
7. **Add Coastal Walk + Weather (and ideally Bondi Rescue) to the footer nav.** (M4) Sitewide
   keyword anchors to 3 hubs that are currently one hop deep.
8. **Drop the `/adstxt` crawl-artifact page** from generation (add to `REDIRECTED_PATHS`) — keep
   only the real `public/ads.txt`. (L3)
9. **Trim dead robots directives** (`host`, `/search`, `/api/`) and optionally add explicit
   AI-crawler `allow` rules to lock in AEO. (L1/L2/L4)
10. **Keep the dated blog URLs; only mint new posts on clean slugs.** (L5) Confirm the "Updated"
    date renders so dated URLs don't look stale in SERPs — already implemented; just verify.

*Numbers 1–2 are the only ones with material risk/upside; 3–5 are CTR/quality wins; 6–10 are
hygiene.*
