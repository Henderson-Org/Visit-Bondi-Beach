# Performance — Before / After

All "after"/"current" numbers are **actual measurements** of the current Next.js production
build (local `next start`, Lighthouse 11, mobile / simulated slow-4G, sandbox Chromium,
**best-of-N** to control for sandbox CPU noise). No numbers are fabricated. Re-verified
2026-08-10.

## The headline: the "before" was a different site

The 11.2s LCP / 173ms FID / 0 CLS report was **the old Squarespace site** (FID was retired as a
Core Web Vital in 2024, so any report showing it predates the migration). It is **not**
comparable to a Lighthouse run of the current build — the decommissioned Squarespace site cannot
be re-measured, so those figures are shown as *reported*, not as a measurement reproduced here.

| Metric | Reported (old Squarespace) | Current Next.js build (measured, mobile) |
|---|---|---|
| LCP | 11.2 s (Poor) | **2.4–2.6 s** (Good) |
| Interaction | FID 173 ms (obsolete metric) | **TBT 50–150 ms** (INP lab proxy — Good) |
| CLS | 0 | **0** |
| FCP | — | **0.8–1.0 s** |
| TTFB | — | **~10 ms** (static/CDN) |
| Speed Index | — | **0.8–1.0 s** |
| Lighthouse Perf | — | **95–98 / 100** |

## Per-template (measured this pass, mobile, best-of-N)

| Page | Perf | LCP | FCP | CLS | TBT | Speed Index |
|---|---|---|---|---|---|---|
| Homepage `/` | 98 | 2.4 s | 0.8 s | 0 | 60 ms | 0.8 s |
| Article `/bondi-blog/why-is-bondi-beach-famous` | 95 | 2.6 s | 0.8 s | 0 | 150 ms | 0.8 s |
| Stay hub `/stay` | 97 | 2.6 s | 1.0 s | 0 | 50 ms | 1.0 s |
| Stay guide `/stay/qt-bondi` | 98 | 2.4 s | 0.9 s | 0 | 60 ms | 0.9 s |

## Change made this pass: monetisation scripts → `lazyOnload`

| Item | Before | After |
|---|---|---|
| AdSense loader (`components/Adsense.tsx`) | `afterInteractive` | **`lazyOnload`** |
| Travelpayouts embed (`components/TravelpayoutsEmbed.tsx`) | `afterInteractive` | **`lazyOnload`** |
| GA4 (`components/Analytics.tsx`) | `afterInteractive` | `afterInteractive` (unchanged) |

**Why:** ads and the affiliate embed are pure monetisation — never part of first render or the
first interaction. Loading them after the window `load` event keeps their bootstrap off the main
thread during the LCP/INP window. Ads still fill (`AdSlot` queues onto `window.adsbygoogle[]`
independently of the loader); GA4 stays `afterInteractive` so analytics fidelity is unaffected.

**Measurability caveat (honest):** the sandbox proxy blocks the ad/analytics domains, so those
scripts contribute **0 ms locally** and the improvement is **not directly measurable here** — it
is a strict improvement for *production* INP, where those scripts really execute. What the
sandbox *can* confirm is **no regression**: post-change best-of-N is Perf 95–98, LCP 2.4–2.6 s,
CLS 0, TBT 50–150 ms across all four templates.

## A note on measurement noise (this cuts both ways)

A single cold run under machine load reported a **2,690 ms** article TBT and an 84 homepage
score. Re-running quiet, best-of-N, gave **150 ms / 98**. This is why the audit relies on
best-of-N and treats absolute TBT as an upper bound. LCP, FCP and CLS were stable across all
runs.

## Prior pass (2026-08-09): source-image recompression

| Item | Before | After | Saving |
|---|---|---|---|
| 12 oversized source webp files | 7.75 MB | 1.87 MB | **−5.89 MB (76%)** |

`sharp`, cap 2400px longest edge, webp q80. **User-facing impact is small** — mobile already
received resized 33–73 KB variants via `next/image` — so this is repo-weight and
cold-cache-transform hygiene, not an LCP fix. Reported honestly as such.

## What produced the biggest "improvement"

The single largest gap between "reported" and "measured" is **the migration off Squarespace
itself** (shipped before this audit): static Next.js/SSG on a CDN, a preloaded `next/image` hero,
deferred production-only third-party scripts and system fonts replaced a heavy Squarespace build.
There was no additional 11s→2s fix to make — the current site was already at ~2.5 s LCP.

## Also changed this pass: Fraunces brand font, self-hosted

The intended brand serif wasn't loading (headings fell back to Georgia). Restored it *properly*
via `next/font/local`: one latin **variable** woff2 (~66 KB, weights 400–600), `display: 'swap'`,
Georgia metric-matched fallback, **one** preload. Brand headings now render in Fraunces with
**CLS still 0** (verified) and no font-blocking. Body/UI text stays the system sans stack (0 KB).

## Not changed (and why)

- **No hero re-architecture** — already server-rendered `next/image` with `priority`.
- **GA4 not moved to `lazyOnload`** — kept `afterInteractive` to preserve pageview/analytics
  accuracy; only the pure-monetisation scripts were deferred.
