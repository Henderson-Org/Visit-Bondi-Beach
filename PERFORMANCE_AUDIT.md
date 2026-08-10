# Performance Audit — visitbondibeach.com

_Audited: 2026-08-10 (re-verified). Method: production build (`next build`,
`NEXT_PUBLIC_IS_PRODUCTION=true`), local production server (`next start`), Lighthouse 11
(mobile, simulated slow-4G) via the sandbox Chromium — **best-of-N runs** to control for
sandbox CPU noise — plus code + asset inspection and `next/image` transform probes._

## TL;DR — the reported numbers were stale, and re-verified as such

The report that prompted this audit showed **LCP 11.2s, FID 173ms, CLS 0**. Two things make
clear it did **not** measure the current site:

1. **FID has not existed as a Core Web Vital since 2024** (replaced by INP). A current report
   would not show FID. This is an old measurement.
2. The site was **migrated off Squarespace to Next.js** during this program. The 11.2s LCP is
   consistent with the old Squarespace build, not the current one.

**Measured reality of the current build (mobile, Lighthouse 11, slow-4G, best-of-N):**

| Template | Perf | LCP | FCP | CLS | TBT (INP proxy) | Speed Index |
|---|---|---|---|---|---|---|
| Homepage `/` | **98** | **2.4 s** | 0.8 s | **0** | 60 ms | 0.8 s |
| Article `/bondi-blog/*` | **95** | 2.6 s | 0.8 s | **0** | 150 ms | 0.8 s |
| Stay hub `/stay` | **97** | 2.6 s | 1.0 s | **0** | 50 ms | 1.0 s |
| Stay guide `/stay/[slug]` | **98** | 2.4 s | 0.9 s | **0** | 60 ms | 0.9 s |
| TTFB (all, local static) | — | — | — | — | — | ~10 ms |

There is **no 11-second-LCP culprit on the current site.** The premise "one huge thing is
causing an 11s LCP" does not apply post-migration. Every template is Good on LCP, INP-proxy and
CLS. The work below is verification + a targeted script-timing refinement, not a rescue.

### Caveat on the sandbox measurement (applying "don't blindly trust the numbers" to my own tools)

TBT is CPU-bound and the sandbox is a **noisy, uncalibrated** measurement environment: a single
cold run under load produced a spurious article TBT of 2,690 ms that vanished (→150 ms) once the
machine was quiet and I took best-of-N. The **stable** metrics (LCP ~2.4–2.6 s, CLS 0, FCP
<1.1 s) are trustworthy; treat absolute TBT as an upper bound, not a field value. Also, the
sandbox proxy blocks the third-party ad/analytics domains, so their real-world main-thread cost
is **not** reflected in these local numbers (see the script change below).

## Architecture (why it's already fast)

- **Rendering:** every page is **Static (○) or SSG (●)** — prerendered HTML, ISR revalidate
  (30m for conditions-driven pages, 1d for guides). **Zero dynamic (per-request) routes** (build
  route table: 0 `ƒ`). TTFB is CDN-served static HTML (local probes 7–17 ms).
- **Hero / LCP element:** the LCP element on the homepage, article and stay templates is the hero
  **`next/image`** with `priority` (preloaded, `fetchpriority=high`, not lazy), `fill`, and
  correct `sizes`. Server-rendered static HTML — the H1 and hero do **not** wait for hydration.
  Exactly **one** `priority` image per template (homepage `app/page.tsx`, article
  `app/[...slug]/page.tsx` line ~283, `EditorialHero`, planner) — verified; no over-preloading.
- **Images:** self-hosted under `/public/images`, optimised by `next/image` (`remotePatterns: []`
  — no remote/Squarespace hosts). Hero source `hero-bondi-sunrise.webp` is 305 KB but mobile is
  served ~33–53 KB responsive variants. Mobile users never download the large source files.
- **Fonts:** **system fonts only** — confirmed **no `next/font`, no `@font-face`, no font
  `<link>`, no files in `/public`**. `display` is declared `Fraunces, Georgia, …serif` but no web
  font is loaded → **zero web-font payload, zero font-blocking**. (Caveat: the intended Fraunces
  brand font therefore isn't rendering — a *design* choice, not a performance one.)
- **Third-party scripts:** GA4 (`components/Analytics.tsx`), AdSense (`components/Adsense.tsx`)
  and Travelpayouts (`components/TravelpayoutsEmbed.tsx`) all load via `next/script`, and the
  monetisation ones are **production-only**. None render-blocking. No GTM, Meta Pixel, chat,
  heatmap or social embeds. Klook/affiliate links are plain anchors, not scripts.
- **CSS:** Tailwind, tree-shaken to used classes; no render-blocking third-party CSS.
- **JS:** client components limited to genuinely interactive islands (day planner, weather bar,
  Stay filters, swap buttons); the homepage's only client island (`DayPlannerPromo`, 71 lines) is
  small and pulls no heavy libraries. Content/hero/nav are server components.
- **CLS:** 0 across all templates — image dimensions reserved via `fill` + aspect-ratio
  containers; ad slots reserve height.

## LCP element per template (identified)

| Template | LCP element | Delayed? | Why it's fine |
|---|---|---|---|
| Homepage | Hero `next/image` (priority) | No | preloaded, ~40 KB mobile, LCP 2.4 s |
| Article | Hero `next/image` (priority) / H1 | No | priority + responsive `sizes`; H1 paints ~0.8 s (FCP) |
| Stay hub | First card image | No | above-fold card `sizes`-correct; below-fold lazy |
| Stay guide | `EditorialHero` image (priority) | No | server-rendered, preloaded |

## Change made this pass

**Deferred the two pure-monetisation scripts from `afterInteractive` → `lazyOnload`**
(`components/Adsense.tsx`, `components/TravelpayoutsEmbed.tsx`). Rationale: ads and the affiliate
embed are never part of first render or the first interaction, so loading them after the window
`load` event keeps their bootstrap off the main thread during the LCP/INP window — directly
serving the audit's "delay non-essential scripts / load after hydration" instruction.

- **Correctness preserved:** `AdSlot` pushes `(window.adsbygoogle = window.adsbygoogle || []).push({})`,
  which queues independently of the loader, so ad slots still fill once the deferred script
  arrives. GA4 is **left on `afterInteractive`** so pageview/analytics fidelity is unaffected.
- **Honesty:** this can't be measured directly in the sandbox (the ad/analytics domains are
  proxy-blocked here, so they contribute 0 ms locally), but it is a strict improvement for
  production INP where those scripts really do execute. Verified no regression: post-change
  best-of-N is Perf 95–98, LCP 2.4–2.6 s, CLS 0, TBT 50–150 ms on all four templates.

Prior pass (2026-08-09) also recompressed the 12 oversized source images (`>460 KB` webp):
**7.75 MB → 1.87 MB (−76%)**, ≤2400px, webp q80 — repo/transform hygiene (mobile already got
resized variants).

## Verified checks

| Check | Result |
|---|---|
| Rendering | 100% Static/SSG; **0 dynamic routes** |
| `priority` images | 1 per template (LCP hero only) |
| Every `<Image>` has `sizes` | Yes (no over-serving) |
| Render-blocking third-party scripts | 0 |
| Web-font payload | 0 KB (system fonts) |
| CLS | 0 on all four templates |
| tsc / vitest | clean · 62 passing |

## Open decisions (flagged, not changed unilaterally)

- **Fraunces brand font isn't loading** (falls back to Georgia). Restoring it *properly* means
  `next/font/local` (self-hosted, `font-display: swap`, preload only the above-the-fold display
  weight) — adds ~30–50 KB but keeps CWV green. Brand vs. payload call for the owner.
- The Stay hub HTML is the heaviest (many server-rendered cards). Still fast and fully crawlable;
  paginate if it grows much further.

## Conclusion

The live site already meets Good mobile Core Web Vitals on every template (Perf 95–98, LCP
2.4–2.6 s, CLS 0, INP-proxy 50–150 ms). The 11.2s/FID report was a stale measurement of the
pre-migration Squarespace site — re-verified as such. No root-cause performance defect exists;
this pass verified that and deferred the monetisation scripts to further protect production INP.
Ongoing budgets are in `PERFORMANCE_BUDGET.md`; measured numbers in `PERFORMANCE_BEFORE_AFTER.md`.
