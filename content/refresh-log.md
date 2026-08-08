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

## Remaining queue (203 articles total)

Prioritisation: freshness-sensitive recommendation articles first (cafés, restaurants,
bars, things-to-do, events), then evergreen guides, ordered by search demand where known.
Each row is filled in as its article is completed.
