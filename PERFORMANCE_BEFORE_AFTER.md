# Performance — Before / After

All "after"/"current" numbers are **actual measurements** of the current Next.js production
build (local `next start`, Lighthouse 11, mobile / simulated slow-4G, sandbox Chromium). No
numbers are fabricated.

## The headline: the "before" was a different site

The 11.2s LCP / 173ms FID / 0 CLS report was **the old Squarespace site** (FID was retired as a
Core Web Vital in 2024, so any report showing it predates the migration). It is **not**
comparable to a Lighthouse run of the current build — I cannot re-measure the decommissioned
Squarespace site, so those figures are shown as *reported*, not as a measurement I reproduced.

| Metric | Reported (old Squarespace) | Current Next.js build (measured) |
|---|---|---|
| LCP | 11.2 s (Poor) | **2.5 s** (Good) |
| Interaction | FID 173 ms (obsolete metric) | **TBT 30 ms** (INP lab proxy — Good) |
| CLS | 0 | **0** |
| FCP | — | **1.6 s** |
| TTFB | — | **~10 ms** (static/CDN) |
| Speed Index | — | **2.6 s** |
| Lighthouse Perf | — | **97 / 100** |

## Verified facts about the current build

| Check | Result |
|---|---|
| Rendering | 100% Static/SSG (prerendered); 0 dynamic routes |
| Homepage HTML (uncompressed) | 79.6 KB |
| Article HTML | 65.3 KB |
| Stay hub HTML | 165 KB |
| Hero image served to mobile (`next/image`, w=640–828) | **33 / 44 / 53 KB** |
| 1 MB source article image served to mobile | **55 / 73 KB** |
| Web-font payload | 0 KB (system fonts) |
| Render-blocking third-party scripts | 0 (all `afterInteractive`) |
| `priority` images | 1 per template (LCP hero only) |

## Change made this pass: source-image recompression

| Item | Before | After | Saving |
|---|---|---|---|
| 12 oversized source webp files | 7.75 MB | 1.87 MB | **−5.89 MB (76%)** |

Method: `sharp`, cap 2400px longest edge, webp q80. **User-facing impact is small** — mobile
already received resized 33–73 KB variants via `next/image` — so this is repo-weight and
cold-cache-transform hygiene, not an LCP fix. Reported honestly as such.

## What produced the biggest "improvement"

The single largest gap between "reported" and "measured" is **the migration off Squarespace
itself** (already shipped before this audit): static Next.js/SSG on a CDN, a preloaded
`next/image` hero, deferred third-party scripts and system fonts replaced a heavy Squarespace
build. There was no additional 11s→2s fix to make in this audit because the current site was
already at 2.5s LCP.

## Not changed (and why)

- **No web font added** — would add payload; the site is intentionally system-font. (The
  intended Fraunces brand font not loading is a separate design decision — see the audit.)
- **No hero re-architecture** — the hero is already server-rendered `next/image` with `priority`.
- **No script removal** — analytics/AdSense/Travelpayouts are all deferred and production-only;
  removing them would break monetisation/analytics for no CWV gain.
