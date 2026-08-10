# Performance Budget — visitbondibeach.com

Targets to hold on every template, **mobile-first** (Lighthouse mobile / slow-4G is the
reference; real mobile networks are faster). Current build already meets all of these — these
are guardrails against regressions.

## Core Web Vitals (mobile)

| Metric | Budget | Current (homepage, measured) |
|---|---|---|
| LCP | **< 2.5 s** (aim < 2.0 s) | 2.5 s |
| INP | **< 200 ms** (TBT lab proxy < 200 ms) | TBT 30 ms |
| CLS | **< 0.1** (aim 0) | 0 |
| FCP | < 1.8 s | 1.6 s |
| TTFB | < 200 ms | ~10 ms (static/CDN) |

## Resource budgets

| Resource | Budget | Notes |
|---|---|---|
| First-load JS (per route) | **< 200 KB** gzipped | keep content/hero/nav as server components |
| Above-the-fold image (mobile, served) | **< 100 KB** | via `next/image` responsive `sizes`; hero currently 33–53 KB |
| Any single source image | **≤ 460 KB** | recompress above this (webp q80, ≤2400px) |
| Web fonts | **0–1 family, ≤ 50 KB** | currently 0 (system fonts); if Fraunces is added, self-host + `font-display: swap` + preload the single display weight only |
| Render-blocking third-party scripts | **0** | all third-party via `next/script` `afterInteractive`+ production-only |

## Rules

1. **One `priority` image per page** — the LCP hero only. Never mark card/below-fold images `priority`.
2. **Every `<Image>` needs `sizes`** — prevents over-serving on mobile.
3. **New third-party scripts default to `afterInteractive` or `lazyOnload`**; never render-blocking; production-only for monetisation/analytics.
4. **Keep pages Static/SSG.** Add `dynamic`/per-request rendering only when genuinely required; prefer ISR `revalidate`.
5. **No web font added without self-hosting + `font-display: swap` + preloading only the above-the-fold weight.**
6. **Reserve dimensions** for any image/embed/ad slot so CLS stays 0.
7. **Content stays server-rendered / crawlable** — never move indexable content behind client-only rendering to chase a JS number.

## How to check before shipping

```
NEXT_PUBLIC_IS_PRODUCTION=true npm run build      # confirm all routes stay ○/● (Static/SSG)
npm run start                                     # local prod
npx lighthouse@11 http://localhost:3000/ --form-factor=mobile --only-categories=performance \
  --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=/tmp/lh.json
```
Fail the change if LCP > 2.5s, CLS ≥ 0.1, or TBT > 200ms on any tested template.
