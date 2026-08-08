# Content refresh log

Running record for the systematic article-by-article upgrade (research-first rewrites:
first-person voice, freshness, SEO + AEO structure, FAQs, internal links, sources).

Process per article: understand intent → research current facts + recent openings/closures
(last ~24 months) + competitor-gap → decide keep/change/remove/add → rewrite first-person
(curator voice, no invented personal visits) → structure for SEO + LLM → FAQ → metadata →
flag human checks → deploy. URLs are preserved to protect rankings; the rewrite ships as an
authored body (`content/bodies/*.json`) + SEO override (`content/overrides.json`).

Status legend: ✅ published · 🔬 researched · ⬜ not started

| # | URL | Old title | New title | Reviewed | Primary keyword | Main changes | Added | Removed | Human checks | Internal links | Status |
|---|-----|-----------|-----------|----------|-----------------|--------------|-------|---------|--------------|----------------|--------|
| 1 | /bondi-blog/2025/4/27/top-10-bondi-cafs-in-2025-best-coffee-brunch-by-the-beach | Top 10 Bondi Cafés in 2025 | The Best Cafés in Bondi Beach (2026) | 2026-08-08 | best cafés Bondi Beach | Restructured into intent sections (beachfront brunch / coffee / all-rounders / newer spots), first-person curator voice, added "what's changed", "which café is right for you", 6-Q FAQ, sources + last-reviewed | Cafe Bondi (new), Gertrude & Alice, Sonoma, Lox Stock & Barrel | Bondi Hall (verified **closed**), Glory Days (Pavilion operator unverified — dropped) | Confirm current hours/status of all venues; Cafe Bondi days/hours; Up South, Makaveli/Pocket still trading; Bondi Pavilion food operators | eat-and-drink, whats-on/markets, where-to-swim, things-to-do, whats-on | ✅ |
| 2 | /bondi-blog/2025/4/25/must-experience-bondi-restaurants-our-top-10-best-restaurants-ranked | Must Experience Bondi Restaurants. Our Top 10 Best Restaurants Ranked | The Best Restaurants in Bondi Beach (2026) | 2026-08-08 | best restaurants Bondi Beach | Restructured prose into intent sections (special occasion / beachfront seafood / Italian / newer), first-person curator voice, added "what's changed" + "which restaurant suits you" + 5-Q FAQ, sources + last-reviewed. **Verified incumbents before acting**: Sean's (now "Sean's", formerly Sean's Panorama) and North Bondi Fish are still OPEN — kept. | LULU (newer, Hall St) | Mami's + Promenade (could not corroborate this pass — omitted rather than risk) | Confirm current status/hours of all; LULU days/hours; Totti's & Fish Shop still trading; Bondi Pavilion operators; whether to re-add Mami's/Promenade if verified | eat-and-drink, where-to-swim, getting-to-bondi, things-to-do, whats-on, stay | ✅ |

| 3 | /bondi-blog/bondi-rescue-who-are-the-lifeguards | Who Are The Lifeguards in Bondi Rescue? | Bondi Rescue Lifeguards: Who Are They? | 2026-08-08 | Bondi Rescue lifeguards | Rebuilt the site's **top article by impressions (1,095)** from a thin stub into an authoritative pillar: bios (Hoppo, Harries, Reidy, Maxi, Deano), "what is Bondi Rescue", facts, key moments, "can you meet them", 5-Q FAQ, sources. Verified show status (rested 2025, expected back 2026). | Named lifeguard bios; show history/status; how-to-meet section | Thin generic intro | Confirm current roster/who's still on; confirm 2026 return; individual bios still accurate | dramatic-moments, 20-obscure-facts, /bondi-rescue, where-to-swim, things-to-do | ✅ |

## SEO consolidation (301s to remove keyword cannibalisation)

| Old (301, now noindex) | → Canonical target | Cluster |
|---|---|---|
| /bondi-blog/2026/3/24/bondis-best-cafs-right-now… | /bondi-blog/2025/4/27/top-10-bondi-cafs… (Best Cafés 2026) | Café/coffee |
| /bondi-blog/2025/6/26/ranked-bondis-top-10-coffee-spots… | ↑ same | Café/coffee |
| /bondi-blog/2024/1/19/bondis-best-coffee-shops | ↑ same | Café/coffee |
| /bondi-blog/2024/12/1/ranked-20-most-dramatic-bondi-rescue-rescues | /bondi-blog/2025/1/12/the-20-most-dramatic-moments-on-bondi-rescue | Bondi Rescue |
| /bondi-blog/2025/4/29/behind-the-scenes-at-bondi-rescue… | /bondi-blog/2023/9/5/20-obscure-facts-about-bondi-rescue | Bondi Rescue |
| /bondi-blog/meet-bondi-lifeguards | /bondi-blog/bondi-rescue-who-are-the-lifeguards (pillar) | Bondi Rescue |

No redirect chains (every target is a canonical, non-redirected page); consolidated pages set `indexable:false` + excluded from static generation and sitemap.

## Remaining queue (203 articles total)

Prioritisation: freshness-sensitive recommendation articles first (cafés, restaurants,
bars, things-to-do, events), then evergreen guides, ordered by search demand where known.
Each row is filled in as its article is completed.
