# Performance Audit — visitbondibeach.com

_Audited: 2026-08-09. Method: production build (`next build`, `NEXT_PUBLIC_IS_PRODUCTION=true`),
local production server (`next start`), Lighthouse 11 (mobile, simulated slow-4G) via the
sandbox Chromium, plus code + asset inspection and `next/image` transform probes._

## TL;DR — the reported numbers were stale

The report that prompted this audit showed **LCP 11.2s, FID 173ms, CLS 0**. Two things make
clear it did **not** measure the current site:

1. **FID has not existed as a Core Web Vital since 2024** (replaced by INP). A current report
   would not show FID. This is an old measurement.
2. The site was **migrated off Squarespace to Next.js** during this program. The 11.2s LCP is
   consistent with the old Squarespace build, not the current one.

**Measured reality of the current build (homepage, mobile, Lighthouse 11, slow-4G):**

| Metric | Value | Verdict |
|---|---|---|
| Performance score | **97** | Excellent |
| LCP | **2.5 s** | Good (≤2.5s) |
| FCP | 1.6 s | Good |
| CLS | **0** | Good |
| TBT (lab proxy for INP) | **30 ms** | Excellent |
| Speed Index | 2.6 s | Good |
| TTFB | 10 ms | Excellent |

There is **no 11-second-LCP culprit on the current site.** The premise "one huge thing is
causing an 11s LCP" does not apply post-migration. The work below is verification + hygiene,
not a rescue.

## Architecture (why it's already fast)

- **Rendering:** every page is **Static (○) or SSG (●)** — prerendered HTML, ISR revalidate
  (30m for conditions-driven pages, 1d for guides). **Zero dynamic (per-request) rendering.**
  TTFB is CDN-served static HTML (local probes: homepage 38ms, article 11ms, stay hub 14ms).
- **Hero / LCP element:** the LCP element on the homepage and article templates is the hero
  **`next/image`** with `priority` (so it is preloaded, not lazy-loaded), `fill`, and correct
  `sizes`. It is **server-rendered static HTML** — the title and hero do **not** wait for
  hydration. There is exactly **one** `priority` image per template (homepage, article,
  EditorialHero, planner) — verified; no over-preloading.
- **Images:** self-hosted under `/public/images`, optimised by `next/image` (`remotePatterns: []`
  — no remote/Squarespace hosts). Probed actual bytes served to mobile widths:
  hero **33–53 KB** (w=640–828), a 1 MB source article image **55–73 KB**. Mobile users never
  download the large source files.
- **Fonts:** **system fonts only** — `sans` is the system stack; `display` is declared as
  `Fraunces, Georgia, …serif` but **no web font is actually loaded** (no `next/font`, no
  `@font-face`, no `<link>`, no font files in `/public`). So there is **zero web-font payload
  and zero font-blocking.** (Caveat: this means the intended Fraunces brand font isn't rendering
  — a *design* bug, not a performance one. Fixing it would add payload; see "Open decisions".)
- **Third-party scripts:** GA4 (`components/Analytics.tsx`), AdSense (`components/Adsense.tsx`)
  and Travelpayouts (`components/TravelpayoutsEmbed.tsx`) all load via `next/script`
  `strategy="afterInteractive"`, and the monetisation ones are **production-only**. None are
  render-blocking; none run before hydration. No GTM, Meta Pixel, chat, heatmap or social
  embeds. Klook/affiliate links are plain anchors, not scripts.
- **CSS:** Tailwind, tree-shaken to used classes; no render-blocking third-party CSS.
- **JS:** ~2.9 MB uncompressed across 20 chunks for the **whole app** (all routes); per-route
  first-load is a fraction of that. Client components are limited to genuinely interactive
  pieces (day planner, weather bar, Stay filters, swap buttons); content/hero/nav are server
  components.
- **CLS:** 0 — image dimensions reserved via `fill` + aspect-ratio containers.

## Per-template check

| Template | Rendering | LCP element | Notes |
|---|---|---|---|
| Homepage `/` | Static | Hero `next/image` (priority) | Perf 97, LCP 2.5s measured |
| Article `/bondi-blog/*` | SSG | Hero `next/image` (priority) or H1 | static HTML 65 KB; hero served 55–73 KB mobile |
| Stay hub `/stay` | Static | First card image | HTML 165 KB (many cards), all `sizes`-correct, lazy below fold |
| Stay guide `/stay/[slug]` | SSG | EditorialHero image (priority) | server-rendered |
| Eat & Drink collections | SSG | EditorialHero image | server-rendered |

## Changes made in this audit

1. **Recompressed the 12 oversized source images** (`>460 KB` webp): **7.75 MB → 1.87 MB
   (−5.89 MB, 76%)**, max dimension capped at 2400px, webp q80. Impact is modest for end users
   (mobile already got resized variants) but it cuts repo weight and Vercel on-demand-transform
   cost/cold-cache latency, and shrinks desktop/large-viewport variants. No visible quality loss.
2. Verified `priority` is used only on true LCP hero images, and every `<Image>` has a `sizes`
   attribute (no over-serving).

## Open decisions (flagged, not changed unilaterally)

- **Fraunces brand font isn't loading** (falls back to Georgia). Restoring it *properly* would
  mean `next/font/local` (self-hosted, `font-display: swap`, preload only the display weight
  used above the fold) — adds ~30–50 KB but keeps CWV green. This is a brand vs. payload call.
- The Stay hub HTML is the heaviest (165 KB uncompressed) due to many server-rendered cards.
  It's still fast and fully crawlable; if it ever grows, consider pagination.

## Conclusion

The live site already meets "good" Core Web Vitals on mobile (Perf 97, LCP 2.5s, CLS 0,
INP-proxy 30ms). The 11.2s/FID report was a stale measurement of the pre-migration Squarespace
site. No root-cause performance defect exists on the current site; this audit verified that and
performed image-weight hygiene. Ongoing budgets are in `PERFORMANCE_BUDGET.md`; measured numbers
are in `PERFORMANCE_BEFORE_AFTER.md`.
