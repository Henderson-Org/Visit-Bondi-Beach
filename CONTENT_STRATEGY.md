# Content Strategy — derived from Search Console (12 months to 2026-08-07)

Data source: owner's GSC export (Queries + Pages). Totals: **746 clicks / 149,358 impressions (~0.5% CTR).**

## The one-line diagnosis

**The site already ranks — it just doesn't get clicked.** 149k impressions but a 0.5% CTR means titles and meta descriptions (172 pages had none) are the primary bottleneck, not rankings. Fixing titles/descriptions on high-impression pages is the fastest growth lever, ahead of any new content.

## Biggest opportunities (by impressions, ranked)

| Cluster | ~Impressions | Position | Signal | Action |
|---|---:|---|---|---|
| **Bondi Rescue / lifeguards** | ~40,000 | 1–5 | Huge demand, ~0.1–0.7% CTR — ranking wasted | **#1 priority.** Definitive Bondi Rescue hub: who the lifeguards are, names + pictures, "is it staged?", cast, most dramatic moments. Optimised titles/meta done for 5 pages. |
| **Sundays Bondi** (venue) | ~12,000 | 7–9 | "sundays bondi", "+ menu", "+ photos" | Strong venue guide: what to order, hours, queue tips, photos. Title/meta done. |
| **Bronte Beach** | ~10,000 | 3.6 (36 for "bronte") | Adjacent beach, high demand | Bronte guide + Bondi-to-Bronte walk hub; internal-link to Bondi. |
| **City2Surf** | ~4,000 | 2.5–8 | **High CTR (3–7%)** — proven clicker, seasonal (Aug) | Keep + refresh route map, training, afterparty. Title/meta done. |
| **"bondi beach"** (head) | ~3,500 | **22** | Core term ranking poorly | Build the authoritative Bondi Beach guide (hub) to lift the head term. |
| **Practical** (parking, pool, pronunciation, why famous, sea temp) | ~4,000+ | 9–30 | Classic visitor intent | Optimise + strengthen. Titles/meta done for parking, Icebergs, swim, pronunciation, why-famous, sea-temperatures. |

## What's been actioned this pass

- **13 high-impression pages** given authored SEO titles + meta descriptions via `content/overrides.json` (survives re-crawl). Missing-description count: 172 → **~158**.
- Editorial voice + **Visit Bondi Beach Editorial Team** author signals (byline, schema, trust note).

## Next actions (in order)

1. **Finish the meta-description pass** for the remaining high-impression pages (target: 0 missing on any page with >20 impressions). Same overrides mechanism.
2. **Bondi Rescue hub** — consolidate the lifeguards/rescue posts under one authoritative hub with strong internal links; this is where the impressions are.
3. **Import full article bodies** so these pages are genuinely better than the old ones (currently intro + outline).
4. **Bondi Beach core guide** to lift the head term off position 22.
5. **Bronte + coastal-walk hub** to capture the ~10k Bronte impressions.
6. **Seasonal readiness for City2Surf** (proven high-CTR) — refresh before each August.

## Notes

- CTR gains from titles/descriptions typically show within days–weeks of re-crawl; new-content ranking takes longer. Do the CTR fixes first (highest ROI).
- Device/country splits (Devices.csv, Countries.csv) available — mobile-first design already assumed; can segment content if a country skew justifies it.
- Volatile facts in these pages (Sundays hours, Icebergs prices) still get verified at the body-import pass — descriptions above avoid stating them.
