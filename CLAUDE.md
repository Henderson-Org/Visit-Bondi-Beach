# Visit Bondi Beach — working notes

`visitbondibeach.com` — a locally-run Bondi Beach travel guide. Next.js 16 (App Router,
React 19, TypeScript, Tailwind), 100% static/SSG + ISR, deployed on Vercel. The editorial
voice is **first person, warm, genuinely local** ("I", "we", "my favourite…"), authored as the
"Visit Bondi Beach Editorial Team". Never corporate, never AI-generic.

> NOTE: this session may also mount a separate `Japan-Travel` repo (a different project,
> "Small Steps Japan"). That repo has its own CLAUDE.md — do not apply its deploy targets or
> brand here. This file governs **Visit Bondi Beach only**.

## Deploy (production = `main`)
- Production (`www.visitbondibeach.com`) serves from **`main`**; Vercel auto-deploys on every
  push to `main`. There is no Vercel CLI in-session — **a push to `main` is the deploy trigger.**
- Day-to-day work happens on the feature branch `claude/bondi-beach-migration-a3xd44`.
- The reliable deploy pattern isolates the deploy from in-flight work: a **git worktree from
  `origin/main`**, copy the changed files in, build, push `main`:
  ```
  git fetch origin main
  git worktree add --detach /tmp/deploy origin/main
  cp <changed files> /tmp/deploy/<paths>            # bodies, code, etc.
  cd /tmp/deploy && node scripts/build-bodies.mjs   # if bodies changed
  cp -al /home/user/Visit-Bondi-Beach/node_modules ./node_modules   # hardlink; do NOT symlink (breaks Turbopack)
  npx tsc --noEmit && node scripts/seo-qa.mjs && NEXT_PUBLIC_IS_PRODUCTION=true npm run build
  git add -A && git commit && git push origin HEAD:main
  cd /home/user/Visit-Bondi-Beach && git worktree remove --force /tmp/deploy && rm -rf /tmp/deploy/node_modules
  ```
- Never deploy a red build or failing tests. Gates: `npx tsc --noEmit` · `npx vitest run` ·
  `node scripts/seo-qa.mjs` (0 errors) · `NEXT_PUBLIC_IS_PRODUCTION=true npm run build`.

## Content pipeline
- Pages live in `content/pages.json` (crawled corpus + **embedded Search Console
  impressions/clicks** — use these to make evidence-based decisions).
- Article bodies: `content/bodies/<slug>.json` → `node scripts/build-bodies.mjs` →
  `content/body-overrides.json` (keyed by page path, overlaid at load in `lib/content.ts`).
  Body blocks: `p/h2/h3/li/quote`, `list`, `localTip`, `callout`, `quickFacts`, `faq`, `itinerary`.
- Events: `data/events.ts` (typed) → `lib/events.ts` (date logic) → What's-On UI. Each event
  carries a `dateStatus` (confirmed/announced/recurring/estimated/tbc); `npm run events:verify`
  flags passed editions, upcoming annuals without dates, and stale verifications.
- Accommodation: `data/accommodation.ts` + `data/accommodation-guides.ts` → `/stay`.
- Dining engine: `data/bondiVenues.ts` + `lib/eatDrink.ts` → `/bondi-eat-and-drink`.

## Non-negotiable integrity rules
- **Never fabricate** venue names, hours, prices, phone numbers, addresses, coordinates, dates,
  transport times, statistics or affiliate links. If a volatile fact isn't confirmed, point to
  the official source (Waverley Council, Transport for NSW, Surf Life Saving, official venue/event
  sites, BoM, ABS) instead of asserting it. Conservative beats wrong.
- Every fact-bearing record carries a source + `lastVerified`/`dateVerifiedAt`.
- Never present a closed/past event as upcoming; never emit fabricated dates into schema.
- Images referenced by media key/local path only (`remotePatterns: []` blocks remote hosts).

## SEO architecture
- Hub-and-spoke: topic hubs (`lib/hubs.ts`) + article spokes. Articles breadcrumb to their
  **topical hub** via `articleTopic`/`articleHub` (`lib/articles.ts`), not the flat `/articles`.
- Titles drop the " — Visit Bondi Beach" brand suffix when it would exceed ~60 chars (CTR).
- Structured data in `lib/structured-data.ts`: Organization, WebSite, BlogPosting, BreadcrumbList,
  FAQPage, Event, LodgingBusiness, and the canonical **Bondi Beach Place/TouristAttraction**
  entity (geo + Sydney→NSW→Australia hierarchy + sameAs Wikipedia/Wikidata); articles bind to it
  via `about` @id. Only emit schema backed by visible content — no schema spam.
- Consolidate cannibalizing near-duplicates via 301 in `next.config.mjs` + `REDIRECTED_PATHS`
  (`app/[...slug]/page.tsx`) + `indexable: false` in pages.json. Preserve the higher-impression
  URL; migrate the richer body into the survivor before redirecting.

## Commit convention
End commit messages with the Co-Authored-By + Claude-Session trailers used across the repo
history. Don't put model IDs in commits/PRs/artifacts.
