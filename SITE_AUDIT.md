# VisitBondiBeach.com — Site Audit & Roadmap

**Operating checklist against the full rebuild brief.** Updated 2026-08-07. Keep this current as work lands.

**Legend:** ✅ Complete · 🟡 Partial · ⬜ Missing · 🔎 Needs review/owner input

## Where the build stands right now

A production-ready Next.js 16 + TypeScript + Tailwind app rebuilds the Squarespace site with **URL preservation as the core guarantee**. Every one of the **440** live URLs is inventoried and routable; **217 indexable**, **223 tag archives** set `noindex,follow`. Build is green (335 static pages). Staging is hard-`noindex` until the production domain is attached.

**This is a strong technical + SEO-preservation foundation, not a finished content platform.** The two biggest remaining bodies of work are (1) importing full article bodies + re-hosting imagery, and (2) building the topical information architecture (hubs, structured location entities, itineraries, planner). Neither is started beyond scaffolding. Content depth must be authored against real sources — it will **not** be mass-generated (per brief §55–56 and repo content rules).

### Headline data (from the migration crawl + `npm run seo:qa`)
- 440 URLs · 217 indexable · 223 `noindex,follow` tag pages
- **172/217 indexable pages have no meta description** → single biggest quick SEO win
- 16 case-sensitive URLs + 1 non-ASCII URL preserved exactly (would 404 on any lowercasing)
- Live schema (verified across all 440 pages): `WebSite` on every page + `Article` on all 203 blog posts; core/static pages were `WebSite`-only. Rebuild preserves article schema (as `BlogPosting`) and **adds** `Organization`, `BreadcrumbList`, `FAQPage`, so it's a net gain, not a regression.
- Google AdSense `ca-pub-3425864271290233` preserved via `public/ads.txt` + production-gated script

---

## Priority 1 — SEO migration & protection

| # | Item | Status | Notes / next action |
|---|---|---|---|
| 3 | Preserve SEO authority / URLs | ✅ | Catch-all route serves every legacy URL 1:1; case-sensitive + encoded slugs handled. |
| 3 | Redirect map, no chains | 🟡 | Host normalization (apex→www, http→https) documented in `migration/redirect-map.*`. Per-URL 301s not needed (URLs preserved). Wire host redirects at Vercel/DNS at launch. |
| 6 | Cannibalisation audit | 🔎 | Multiple overlapping "ultimate guide"/"things to do"/parking/itinerary posts exist (e.g. several travel-guide + parking articles). Needs GSC data to pick the canonical winner per intent, then consolidate + 301. **Owner: Search Console access.** |
| 16 | Unique SEO titles | 🟡 | Real titles carried over; 0 duplicates. Many exceed 60 chars — rewrite pass pending. |
| 17 | Meta descriptions | 🟡 | **172/217 missing** (never set in Squarespace). Authoring pass needed — highest-leverage quick win. |
| 18 | Heading structure (1×H1) | ✅ | One H1 per template; H2/H3 via `.prose-editorial`. |
| 19 | Canonicals | ✅ | Self-referencing canonical per page via `metadataBase` + `alternates.canonical`. |
| 20 | Indexation control | ✅ | Env-gated: staging `noindex` + robots disallow; production flips on `NEXT_PUBLIC_IS_PRODUCTION=true`. Tags `noindex,follow`. |
| 21 | XML sitemap | ✅ | `app/sitemap.ts` — indexable only, production domain, excludes tags. Segment if it grows. |
| 22 | Structured data | 🟡 | Reusable utils: Organization, WebSite, BlogPosting (preserves live `Article`), BreadcrumbList, FAQPage, +author `Person`. Place/TouristAttraction/Restaurant/Hotel pending structured location data (§14). |
| 23 | AEO / AI-answerable | 🟡 | Semantic HTML + breadcrumbs in place. Direct-answer openings depend on full body import (§61). |
| 46 | Search Console readiness | 🟡 | Sitemap/robots/canonicals ready. **Owner: GSC verification + property access.** |
| 50 | Automated SEO QA | ✅ | `npm run seo:qa` flags dup titles/descs, missing meta/H1, long titles, thin pages. |
| 51 | Broken-link checking | ⬜ | Add a link crawler over built output (roadmap). |
| 52 | Content-quality QA | 🟡 | seo:qa covers dupes/thin/missing. Orphan-page + stale-date checks pending. |
| 53 | Correct status codes | ✅ | Real 404 via `not-found`; no soft-404s (unknown paths 404). 410 for retired pages when identified. |

## Priority 2 — Content, IA & freshness

| # | Item | Status | Notes / next action |
|---|---|---|---|
| 2 | Product positioning | 🟡 | Homepage + copy pitched as local destination guide, not blog feed. Deepens with hubs. |
| 4 | Information architecture | ⬜ | Topical sections (Things to Do, Beaches, Walks, Eat & Drink, Families, Transport, Parking, Weather, Itineraries…) not built. Current IA is blog + core pages. **Major roadmap item.** |
| 4 | Breadcrumbs | 🟡 | Component + JSON-LD live (Home → What's On → article). Richer topical trails need the §4 taxonomy. |
| 5 | Topical authority | ⬜ | Requires the hub/entity buildout + content depth. Roadmap. |
| 7 | Content quality standard | 🟡 | Templates + blocks support scannable structure; bodies not yet imported. |
| 8 | Practical info components | ✅ | `QuickFacts`, `LocalTip`, `Callout`, `Faq`, `ItineraryTimeline` built (`components/blocks.tsx`). Ready to populate. |
| 9 | First-hand local authority | 🟡 | LocalTip block ready; author/about signals + "last checked" dates pending (needs content model fields). |
| 10 | Freshness system | 🟡 | Content model carries published/lastmod; add `lastVerified` + `reviewPriority` fields + stale flag. |
| 11 | Fact-checking | 🔎 | Volatile facts (Icebergs hours/prices, transport) must be re-verified against official sources at import. **Owner/agent task at content pass.** |
| 12 | Itineraries | ⬜ | `ItineraryTimeline` component ready; itinerary pages/data not built. High-value roadmap. |
| 13 | Trip planner | ⬜ | Not built. Depends on structured location data (§14). Roadmap. |
| 14 | Structured location entities | ⬜ | Not built — the keystone for planner/maps/filters/schema/related. **Major roadmap item.** |
| 15 | Internal linking | 🟡 | Semantic `relatedPages()` + `RelatedGuides` on articles. Editorial in-body links come with body import. |
| 24 | FAQs (selective) | 🟡 | `Faq` block + FAQPage schema ready; apply only where genuinely useful. |
| 37 | Eat & drink (editorial, not directory) | ⬜ | Editorial hub pages pending; avoid thin venue pages. |
| 38 | Accommodation | ⬜ | Guides pending; affiliate disclosure to follow (see §39/§40). |
| 41 | Blog vs evergreen | 🟡 | Blog preserved; evergreen hub structure pending. |
| 42 | Search functionality | ⬜ | No on-site search yet. Add a simple static index (roadmap). |
| 43 | Related content | ✅ | Semantic `RelatedGuides` (token-overlap, same-section preferred), not random-recent. |
| 56 | No thin programmatic scale | ✅ | Policy honored — no permutation pages generated. |
| 58 | High-value content gaps | 🔎 | Gap list captured in brief §58; prioritize with GSC data. |
| 59 | Terminology consistency | 🟡 | Centralize entity names when structured data lands. |
| 64 | Events handling | ⬜ | Event date logic + evergreen annual URLs pending. |
| 65 | Weather (climate vs forecast) | ⬜ | Seasonal content pending; must not present averages as live forecast. |
| 66 | Safety info | ⬜ | Clear, non-alarmist safety content pending; link SLS/official. |

## Priority 3 — Design, UX, performance, accessibility

| # | Item | Status | Notes / next action |
|---|---|---|---|
| 25 | Design direction | 🟡 | Coastal editorial system (sand/ocean tokens, serif display) in Tailwind config + globals. Photographic hierarchy needs real re-hosted imagery. |
| 26 | Typography | ✅ | Editorial scale, readable line lengths (`max-w-prose`), system serif display + sans. |
| 27 | Photography | 🟡 | Currently Squarespace-CDN originals (allowed in `next.config`). **Re-host + optimise before launch; confirm licensing.** |
| 28 | Image SEO | 🟡 | Alt text carried where present; `next/image` + dimensions/lazy come with re-host pass. |
| 29 | Performance / CWV | ✅ | Static SSG, minimal JS, no heavy libs, no blocking webfonts, AdSense `afterInteractive`. Re-check after imagery. |
| 30 | Mobile-first | ✅ | Mobile nav, tap targets, no horizontal overflow, responsive grids. |
| 31 | Accessibility | 🟡 | Semantic landmarks, skip link, visible focus, reduced-motion. Full WCAG audit pending. |
| 32 | Navigation | 🟡 | Intent-led nav; will slim once §4 hubs exist. Search pending. |
| 33 | Homepage | 🟡 | Not a chronological feed: hero + quick links + latest. Add "plan by time", essential guides, itineraries once built. |
| 34 | Category/hub pages | ⬜ | Real hubs pending (§4). |
| 35 | Maps | ⬜ | Not added; use lightweight/static-first when built. |
| 36 | Location page UX | ⬜ | Depends on structured entities (§14). |
| 44 | Custom 404 | ✅ | Useful 404 with top guides + sections. |
| 45 | Analytics | 🟡 | GA4 `G-KQ2SFKV2EZ` wired (production-only, `afterInteractive`). Custom events (affiliate/planner clicks) pending those features. Verify live after launch. |
| 70 | Design system | 🟡 | Tokens + components consistent; expand as pages grow. |
| 71 | Responsive QA | 🟡 | Built responsive; formal multi-breakpoint QA pending. |
| 72 | Dark mode | ✅ | Intentionally light-first for destination presentation (not implemented — a deliberate choice). |
| 73 | Motion | ✅ | Restrained hovers/fades; reduced-motion respected. |
| 74 | Footer | ✅ | Useful, non-spammy footer. Expand links as hubs land. |

## Cross-cutting: technical, commercial, process

| # | Item | Status | Notes / next action |
|---|---|---|---|
| 39/40 | Commercialisation & trust | 🟡 | **AdSense direct** (pub-3425864271290233) preserved. Owner wants natural fit → **Auto Ads deliberately NOT used**; one labelled in-article `AdSlot` with reserved space (no CLS), inert until owner creates the ad unit + sets `NEXT_PUBLIC_AD_SLOT_INARTICLE`. Affiliate disclosure + editorial-policy pages pending. |
| 48 | Content model | ✅ | **Decision: code-based** (no Sanity) — content in `content/*.json`, separated from components, edited via Git. Simple, fast, versioned. |
| 9 | Author / voice | 🟡 | **Decision: first-person local voice** (owner's own opinion). Author byline + `Person`/`Organization` schema wired (`AUTHOR` in `lib/site.ts`). Owner can supply a real author name/bio → set `NEXT_PUBLIC_AUTHOR_NAME` + type `Person`. |
| 49 | Component system | ✅ | Reusable blocks built; more to come with entities. |
| 54 | Security / code quality | ✅ | Lean deps; no secrets in repo; env-gated config. Next upgraded off CVE build. |
| 55 | Don't overengineer | ✅ | Static-first, minimal deps. |
| 76 | Post-migration monitoring | 🟡 | Plan in `docs/migration.md`; wire GA4 + GSC dashboards post-launch. |
| 81 | Decision docs | ✅ | `docs/` (deployment, migration, seo, content, rollback) + `migration/` audit + this file. |

## Acceptance criteria — site level (brief §78)

✅ Historical URL inventory · ✅ redirect strategy documented · ✅ no redirect chains · ✅ no major pages lost · ✅ sitemap valid · ✅ robots correct · ✅ production indexable (on flag) · ✅ staging non-indexable · ✅ canonicals valid · ✅ schema valid/centralized · 🟡 breadcrumbs (basic) · ✅ 404 works · ⬜ internal-link validation script · ✅ mobile nav · ✅ CWV considered · 🟡 images (re-host pending) · ⬜ analytics · ⬜ major content categories · 🔎 cannibalisation resolution · 🟡 mobile QA · 🟡 a11y QA · 🟡 no placeholder (migration notes are intentional interim) · 🟡 imagery (Squarespace originals interim) · ✅ no AI filler · ⬜ broken-link check · ✅ deploy documented · 🟡 editing process (CMS decision pending).

---

## Roadmap (recommended order — respects brief §79 priority)

1. **Authorize the standalone repo & deploy staging** (blocked on Claude infra — see status doc). Everything below is codeable now.
2. **Meta-description authoring pass** — 172 pages; biggest quick SEO win. Author from real page content; no fabrication.
3. **Full article-body import** — extend crawler to capture body HTML; render faithfully; remove interim "migration note".
4. **Re-host & optimise imagery** — download Squarespace originals, confirm licensing, serve via `next/image`.
5. **Cannibalisation consolidation** — needs GSC data; pick canonical winners, merge, 301.
6. **Information architecture (§4)** — hubs: Things to Do, Beaches & Swimming, Walks, Eat & Drink, Families, Transport, Parking, Weather, Itineraries, Plan Your Visit. Real breadcrumb trails.
7. **Structured location entities (§14)** — powers location pages, maps, filters, planner, related, schema.
8. **Itineraries (§12) + Trip planner (§13)** — from curated structured content.
9. **Analytics + Search Console** (owner IDs) and **post-launch monitoring**.
10. **On-site search, maps, broken-link CI, full a11y/responsive QA.**

Content depth is authored against authoritative sources (Waverley Council, Transport for NSW, Surf Life Saving, official venue/event sites) — never mass-generated.
