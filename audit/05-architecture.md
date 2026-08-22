# 05 — Information Architecture for Topical Authority (Bondi Beach → visitbondibeach.com)

**Goal:** own the entity "Bondi Beach" in Google's eyes. Build hubs *above* existing winners,
never replacing them. Every high-traffic spoke should breadcrumb up to, and be linked down
from, a topical hub that concentrates authority on one theme.

**Evidence base:** `audit/page-inventory.csv` (458 URLs, YTD pageviews + Search Console),
`seo-protected-pages.json` (37 protected URLs, `allowRedirect:false`), and the live code
(`lib/hubs.ts`, `lib/articles.ts`, `app/[...slug]/page.tsx`, `components/HubView.tsx`,
`app/page.tsx`, `components/SiteHeader.tsx`, `lib/site.ts`, `app/sitemap.ts`, `data/locations.ts`).

> Reading note on traffic: hubs and location pages read `0` YTD pageviews in the CSV — they
> are post-migration pages with no historical GA. **All the demand lives on the `/bondi-blog/*`
> spokes.** The architecture job is to build hubs *over* that proven spoke demand.

---

## 1. Current structure vs the search-intent universe

### What exists today

- **7 topic hubs** (`contentType: hub`, designed in `lib/hubs.ts`):
  `/bondi-eat-and-drink`, `/bondi-with-kids`, `/things-to-do-in-bondi`, `/bondi-coastal-walk`,
  `/getting-to-bondi`, `/bondi-rescue`, `/bondi-weather`.
- **2 core-page hubs** (`getCorePageHub`, hero + explore cards over existing body):
  `/where-to-swim-at-bondi-beach`, plus `/stay` (its own app section).
- **9 location pages** (`data/locations.ts` → `LocationPage`): `/bondi-beach`, `/north-bondi`,
  `/tamarama-beach`, `/bronte-beach`, `/ben-buckler`, `/bondi-pavilion`, `/mackenzies-bay`,
  `/marks-park`, `/bondi-icebergs`.
- **~206 blog spokes** on legacy `/bondi-blog/*` URLs, auto-classified into 8 topics by
  regex (`articleTopic` in `lib/articles.ts`) and up-linked to the matching hub.
- **Primary nav (8 items):** Things to Do · Swim · Eat & Drink · With Kids · Getting Here ·
  Stay · What's On · Articles.

### Where the map is thin — clusters with high spoke traffic and NO hub above them

The regex classifier folds several distinct, high-demand themes into a single generic hub,
diluting them. These are the missing hubs the traffic literally demands:

| Un-hubbed cluster | Proven spoke demand (YTD views) | Currently folded into | Verdict |
|---|---|---|---|
| **Parking** | Bronte carpark **886**, Free parking **720**, Tamarama/Coogee/Clovelly **448**, Ultimate parking **415** + `where-to-find-carpark`, Nielsen Park, ~7 parking tags → **≈2,470+ views** | `getting-here` (regex `parking`) | **New hub — highest priority.** Bigger than most existing hubs. |
| **City2Surf / Running** | Results **603**, Running routes **461**, Ultimate C2S **451**, Course map **300**, Afterparty **278** + a whole orphaned **Sydney Marathon** sub-cluster (8+ pages, all protected/new at 0) → **≈2,090+ views** | split across `things-to-do` + `getting-here` | **New hub.** Seasonal spike (Aug), protected pages orphaned. |
| **Surfing** | Surf cam **144** + `surfing-at-bondi`, `bondi-beach-surf-guide`, surf-lesson/patrol-hours, "beyond the surf" | `swim` / `things-to-do` | **New hub** (thin now, clear topic, cheap to build, high commercial intent = surf lessons). |
| **Swimming & ocean pools** | Swim hub **849**, Icebergs FAQ **841**, Can-anyone-swim **534**, Sea temps **227**, Is-it-safe **171**, Bronte pool **139**, salties/Bondi-to-Bronte swim | core-page hub only | **Promote** `/where-to-swim` core-page → full hub with sub-sections. |
| **Itineraries / how long** | 24-hours-in-bondi, day-trip, 34-best-things, ultimate travel guide, 2026 guide (582) | `things-to-do` | **New hub** (or strong sub-section) — high "plan my visit" intent, ties to `/plan` product. |
| **Transport (umbrella)** | getting-here + parking + "getting to Sydney Marathon from Bondi" + airport | `getting-here` only | **Rename/re-parent** getting-here under a broader **Getting Around** umbrella that also owns Parking. |

Two structural problems to fix alongside the missing hubs:

1. **The regex classifier is lossy.** `articleTopic()` sends anything matching `/parking|
   transport|bus|train/` to `getting-here`, and `/city2surf|surf|sculpture|marathon/` to
   `things-to-do`. Result: the Parking (2,470 views) and City2Surf (2,090 views) clusters have
   **no dedicated parent** — their authority leaks into two over-broad generic hubs. Adding
   the new hubs requires extending `ArticleTopic`, `TOPIC_LABEL`, `TOPIC_SECTION` and the
   `articleTopic` branch order (parking must be tested *before* the generic transport branch;
   running/city2surf *before* the generic things-to-do branch).
2. **No Coogee / Clovelly location page.** The coastal-walk pillar terminates at Coogee, yet
   there is no `/coogee-beach` or `/clovelly-beach` location node — a hole in the single most
   linkable cluster on the site (see §5).

---

## 2. Target information architecture (site-map)

Principle: **3 clicks to anything, hub-and-spoke, no orphans.** New hubs sit *above* today's
winners; the winners keep their URLs and rankings.

```
/  (homepage — "Everything you need to visit Bondi")
│
├─ PLAN & VISIT ─────────────────────────────────────────────
│  ├─ /itineraries ........................... NEW HUB (Plan your visit)
│  │   ├─ /bondi-blog/24-hours-in-bondi-beach          (spoke, keep URL)
│  │   ├─ /bondi-blog/day-trip-bondi-beach-top-tips
│  │   ├─ /bondi-blog/…/ultimate-bondi-beach-travel-guide-…
│  │   ├─ /bondi-blog/…/the-ultimate-bondi-beach-travel-guide-2026-edition
│  │   └─ → /plan  (interactive Day Planner product)
│  ├─ /bondi-weather ......................... HUB (exists)
│  │   ├─ sea-temperatures-month-by-month · best-time-to-visit · sunrise/sunset*
│  └─ /whats-on .............................. events section (exists)
│      └─ today · this-weekend · free · markets · [event]
│
├─ THINGS TO DO ─────────────────────────────────────────────
│  ├─ /things-to-do-in-bondi ................. HUB (exists) — de-scoped to activities/sights
│  │   ├─ 34-best-things · hidden-gems · etiquette · muscle-beach · nightlife
│  │   ├─ metal-detecting · drone/photography* · brand-takeovers
│  │   └─ markets · pavilion events
│  ├─ /bondi-surfing ......................... NEW HUB
│  │   ├─ /bondi-blog/bondi-beach-surf-guide · surfing-at-bondi
│  │   ├─ surf-lessons · surf-cam (protected 144) · patrol-hours · "beyond the surf"
│  │   └─ → /where-to-swim (safety), → /bondi-rescue
│  └─ /city2surf-and-running ................. NEW HUB (seasonal, Aug spike)
│      ├─ ultimate-guide-city-to-surf (451) · city2surf-results (603, live data)
│      ├─ city2surf-course-map (300) · afterparty (278) · running-routes (461)
│      └─ Sydney Marathon sub-cluster: beginners-guide · carb-load · shakeout ·
│          recovery · getting-to-marathon-from-bondi · family-fun (rescue orphans!)
│
├─ SWIM & COAST ─────────────────────────────────────────────
│  ├─ /where-to-swim-at-bondi-beach .......... PROMOTE core-page → full HUB
│  │   ├─ Ocean pools: Icebergs-FAQ (841) · can-anyone-swim (534) · Bronte-pool (139)
│  │   ├─ Safety: is-it-safe (171) · swimming-between-flags · rips · patrol-hours
│  │   ├─ Conditions: sea-temperatures (227, live water temp) · salties ocean swimming
│  │   └─ → /bondi-rescue, → /bondi-with-kids (calm swims)
│  ├─ /bondi-coastal-walk .................... PILLAR HUB (exists) — see §5
│  │   ├─ toilets · cafes-en-route · beaches · swimming-stops · accessibility/prams
│  │   ├─ running-the-walk · sculpture-by-the-sea · whale-watching* · sunrise/sunset*
│  │   └─ location nodes ↓
│  │       ├─ /bondi-beach · /tamarama-beach · /bronte-beach
│  │       ├─ /clovelly-beach  (NEW location) · /coogee-beach (NEW location)
│  │       └─ /mackenzies-bay · /marks-park · /ben-buckler · /bondi-icebergs
│  └─ /bondi-rescue .......................... HUB (exists) — the #1 winner (3,452)
│      ├─ who-are-the-lifeguards (3,452) · 20-obscure-facts · 20-most-dramatic
│      └─ real-or-staged · is-it-safe
│
├─ EAT & DRINK ──────────────────────────────────────────────
│  └─ /bondi-eat-and-drink ................... HUB + directory (exists)
│      ├─ /bondi-eat-and-drink/[collection]  (cafes · bars · brunch · cheap-eats)
│      ├─ /bondi-eat-and-drink/venues/[id]
│      └─ kids-eat-free · free-bbq-spots · Sundays-Bondi (353) · carb-load(→C2S)
│
├─ FAMILY ───────────────────────────────────────────────────
│  └─ /bondi-with-kids ....................... HUB (exists)
│      ├─ kids-school-holidays · kids-eat-free · playgrounds · calm swims
│      └─ pram-friendly walk (→ coastal-walk accessibility)
│
├─ GETTING AROUND ───────────────────────────────────────────  (umbrella rename)
│  ├─ /getting-to-bondi ...................... HUB (exists) — train/bus/airport/driving
│  └─ /bondi-parking ......................... NEW HUB (≈2,470 views of demand)
│      ├─ free-parking-made-easy (720) · ultimate-parking-guide (415)
│      ├─ Bronte-carpark (886) · Tamarama/Coogee/Clovelly-parking (448)
│      └─ where-to-find-carpark · Nielsen-Park · Waverley-park
│
├─ STAY ─────────────────────────────────────────────────────
│  └─ /stay .................................. section (exists)
│      ├─ /stay/[category] · /stay/[guide]
│      ├─ /stay/bondi-beach-vs-bondi-junction · /stay/hostels-bondi-beach
│      └─ best-accommodation-bondi-beach (blog spoke → up-links here)
│
└─ UTILITY ──────────────────────────────────────────────────
   ├─ /articles (flat index, browse-all) · /whats-on
   ├─ /visit-bondi-beach (About) · contact · Instagram
   └─ /plan (Day Planner product)
```

**Net change:** 7 hubs → **12** (add Parking, City2Surf & Running, Surfing, Itineraries;
promote Swim core-page → full hub; keep Coastal-walk as the flagship pillar). Two new location
nodes (Coogee, Clovelly). Getting-here re-framed under a "Getting Around" nav grouping that
also parents Parking.

---

## 3. Hubs table — existing vs new, with the spokes each should adopt

| Hub (path) | Status | Nav group | Adopts these spokes (proven demand) | Notes |
|---|---|---|---|---|
| `/bondi-rescue` | keep | Swim & Coast | who-are-the-lifeguards **3452**, 20-obscure-facts 200, 20-most-dramatic 247, real-or-staged, is-it-safe 171 | Site's biggest winner. Cross-link to Swim. |
| `/where-to-swim-at-bondi-beach` | **promote → full hub** | Swim & Coast | Icebergs-FAQ **841**, can-anyone-swim **534**, sea-temps 227, is-it-safe 171, Bronte-pool 139, salties, flags, bondi-to-bronte-swim | Currently core-page hub (849). Give it real sub-sections (Pools / Safety / Conditions). |
| `/bondi-coastal-walk` | keep (flagship pillar) | Swim & Coast | see §5 — full cluster | Add toilets, cafes, accessibility, running, sculpture, whales spokes. |
| `/bondi-parking` | **NEW** | Getting Around | Bronte-carpark **886**, free-parking **720**, Tamarama/Coogee/Clovelly **448**, ultimate-parking **415**, where-to-find-carpark, Nielsen Park | ~2,470 views with no parent today. **Build first.** |
| `/city2surf-and-running` | **NEW** | Things to Do | C2S-results **603**, running-routes **461**, ultimate-C2S **451**, course-map **300**, afterparty **278**, + Sydney Marathon cluster (8+) | Rescue the orphaned marathon protected pages. Seasonal, live results data. |
| `/bondi-surfing` | **NEW** | Things to Do | surf-cam 144, surf-guide, surfing-at-bondi, surf-lessons, patrol-hours, beyond-the-surf | Thin now; clear entity; commercial intent (lessons). |
| `/itineraries` | **NEW** | Plan & Visit | 24-hours-in-bondi, day-trip-top-tips, 34-best-things, ultimate-travel-guide, 2026-edition 582 | Feeds/receives the `/plan` product. High planning intent. |
| `/getting-to-bondi` | keep (re-scope) | Getting Around | train/bus, airport, from-the-city, driving; **hand parking to new hub** | De-duplicate with Parking hub via clear section boundaries. |
| `/things-to-do-in-bondi` | keep (de-scope) | Things to Do | 34-best-things, hidden-gems, etiquette 287, muscle-beach, nightlife, metal-detecting 128, photography/drone 204, brand-takeovers 188 | Hand surfing/running/itinerary spokes to their new hubs; keep sights/quirky. |
| `/bondi-eat-and-drink` | keep | Eat & Drink | Top-10-cafes 142, must-experience-restaurants 134, 10-bars 120, Sundays-Bondi 353, kids-eat-free 257, free-bbq 129, ice-cream | Already a directory engine. |
| `/bondi-with-kids` | keep | Family | kids-school-holidays, kids-eat-free 257, playgrounds, calm-swims | Cross-link Swim + Coastal accessibility. |
| `/bondi-weather` | keep | Plan & Visit | sea-temps 227, best-time-to-visit, sunrise-sunset 373 (shared w/ coastal) | Live conditions panel already wired. |
| `/stay` | keep | Stay | best-accommodation-bondi-beach 130, hostels, vs-bondi-junction | Own app section. |

**Implementation touch-points for each NEW hub:**
1. `lib/articles.ts` — add topic to `ArticleTopic` union, `TOPIC_LABEL`, `TOPIC_SECTION`, and a
   branch in `articleTopic()` **ordered before** the generic transport/things-to-do branches
   (parking before transport; running/city2surf before things-to-do; surfing before swim).
2. `lib/hubs.ts` — add a `HubDesign` entry (kicker, hero, section layouts, discovery chips,
   practical facts, CTA).
3. `content/pages.json` — add the hub page record (`contentType:'hub'`, curated `sections[]`
   with `links` to the spokes) so `HubView` renders it and `generateStaticParams` builds it.
4. `lib/site.ts` `NAV` + `app/page.tsx` `QUICK_LINKS` — surface in nav (see §6/§7).
5. `app/sitemap.ts` — picked up automatically via content index (hubs are indexable in
   pages.json); no static-route entry needed.

---

## 4. Full nav recommendation

The current flat 8-item primary nav has no room for 12 hubs and mixes altitudes (a pillar hub
"Swim" next to a browse-index "Articles"). Move to a **grouped primary nav with 6 headings**,
each a dropdown/mega-menu of hubs; keep a slim utility nav for tools and conversion.

**Primary nav (6 groups — desktop mega-menu, mobile accordion):**

| Group | Lands on | Menu items (hubs) |
|---|---|---|
| **Things to Do** | `/things-to-do-in-bondi` | Things to do · Surfing · City2Surf & Running · Itineraries |
| **Swim & Coast** | `/where-to-swim-at-bondi-beach` | Where to swim · Ocean pools & safety · Coastal walk (Bondi→Coogee) · Bondi Rescue |
| **Eat & Drink** | `/bondi-eat-and-drink` | Cafes · Bars · Restaurants · Cheap eats (collection pages) |
| **Getting Around** | `/getting-to-bondi` | Getting to Bondi · Parking · From the airport |
| **Plan Your Visit** | `/itineraries` | Itineraries · Weather & sea temps · What's on · **Plan your day →** |
| **Stay** | `/stay` | Where to stay · Hostels · Bondi vs Bondi Junction |
| *(persistent)* **With Kids** | `/bondi-with-kids` | keep as a top-level pill — strong standalone intent |

**Secondary / utility nav (header right or footer-top):** What's On · Articles (browse-all) ·
About · **Plan your day** (button, product entry). Instagram icon.

**Footer nav (crawlable, every hub linked — this is the site's authority backbone):** a 6-column
footer mirroring the groups above, listing *all 12 hubs + all location pages + Stay/Eat
collections*. Footer links are the cheapest way to guarantee no hub is >1 click from any page
and to distribute PageRank sitewide. `SiteHeader.tsx` currently has no footer nav parity — add it.

**Breadcrumb structure** (already the right model in `articleHub()` — extend it to the new hubs):

```
Home › {Topical Hub} › {Article}          ← blog spokes (NOT Home › Articles › …)
Home › Swim & Coast › Coastal walk › Bronte Beach   ← location under pillar
Home › Getting Around › Parking › Free parking at Bondi
```

- Articles breadcrumb to their **topical hub**, never the flat `/articles` (CLAUDE.md rule,
  enforced by `breadcrumbs()` + `articleHub()`).
- Location pages breadcrumb under the **coastal-walk pillar** (they are stops on it), except
  `/bondi-beach`/`/north-bondi` which breadcrumb under Swim & Coast root.
- The visible "Part of our {hub} guide" up-link (already rendered in `ArticlePage`) stays — it
  is the spoke→hub authority signal. Extend `TOPIC_SECTION` so parking/running/surfing spokes
  get theirs.

---

## 5. Internal-linking rules (concrete, not platitudes)

The engine is `relatedPages()` + `articleHub()` + curated hub `sections[]`. Rules:

**A. Hub → spoke (down-links).** Every hub's `sections[].links` in pages.json must list its
adopted spokes by hand (curated, not auto). Rule: **a hub links to every spoke that up-links to
it.** No spoke should up-link to a hub that doesn't link back (bidirectional or it's an orphan).
Target: each hub surfaces 6–15 spoke cards across its sections.

**B. Spoke → hub (up-links).** Every blog spoke emits exactly one "Part of our {hub} guide"
contextual link via `articleHub()` (already built). Rule: **zero spokes may resolve to `general`.**
Audit: run `articleTopicsWithCounts()` — any `general` count >0 means a spoke has no hub;
either add a regex branch or hand-assign. Parking/running/surfing spokes currently mis-route to
transport/things-to-do — fix the branch order so they route to the new hubs.

**C. Spoke ↔ spoke (siblings).** `relatedPages()` should prefer **same-topic siblings first**,
then same-location, then hub-mates. Rule: every spoke shows 3–6 sibling cards, and **each of the
top-20 protected pages must be reachable from at least 3 other protected pages** (they are the
authority anchors — link them densely). E.g. the Bronte-carpark winner (886) should link to
Bronte-pool, Bronte-BBQ, Coastal-walk/Bronte, and Tamarama/Coogee-parking.

**D. Contextual in-body links.** Body blocks (`p`, `list`, `callout`) should carry 2–4 inline
links to *sibling spokes or the pillar*, with **descriptive anchor text = the target's primary
keyword** (never "click here"/"read more"). Rule: the coastal-walk pillar body links out to each
standalone sub-topic; each sub-topic links back to the pillar in its first two paragraphs.

**E. Fixing orphans (the 0-view protected pages).** The Sydney Marathon cluster (8+ pages) and
several coastal spokes are orphaned — indexed but with no curated inbound link. Concrete fix:
  1. Route them to a hub via `articleTopic` (marathon → `city2surf-and-running`; sculpture/whale
     → `coastal-walk`).
  2. Add them to that hub's `sections[].links` so they get a down-link.
  3. Add them to 2–3 sibling `relatedPages` sets.
  4. Ensure the footer's hub column lists the hub (guarantees 1-hop reachability).
A page with (hub up-link + hub down-link + 3 sibling links + footer path) is no longer an orphan.

**F. Tag/category archives (223 tag pages).** These are `noindex,follow` and excluded from
sitemap — correct. Rule: **do not** link them from primary nav or hubs (they'd dilute crawl
budget); they exist only to pass `follow` equity. Leave as-is.

**G. Never self-link / never cross-brand.** `articleHub()` already returns null when the page IS
the hub. Internal linking stays inside `visitbondibeach.com` — never link out to another site
the owner happens to run; an unrelated brand in the link graph dilutes topical authority.

---

## 6. URL-pattern recommendation & 301 migration posture

**Current state:** 141 dated `/bondi-blog/YYYY/M/D/slug` + 65 legacy clean `/bondi-blog/slug`
+ clean hub/section paths (`/bondi-eat-and-drink`, `/stay`, `/whats-on`, `/where-to-swim…`).

**Recommendation — "freeze the past, clean the future":**

1. **Do NOT mass-migrate the dated `/bondi-blog/*` URLs.** They hold the rankings and backlinks;
   37 are explicitly `allowRedirect:false` in `seo-protected-pages.json` (incl. the 3,452-view
   lifeguards page, all parking winners, all City2Surf pages). A blanket date-stripping migration
   would risk the entire revenue base for a cosmetic gain. **The dated pattern is ugly but safe.**
2. **New content ships on clean topical paths**, hub-nested where a hub owns the topic:
   - Editorial/evergreen → `/bondi-blog/<slug>` (clean, dateless — matches the 65 legacy ones).
   - Directory/structured → already correct: `/bondi-eat-and-drink/<collection>`,
     `/stay/<category>`, `/whats-on/<event>`. **Extend this** to new structured hubs if they gain
     sub-pages (e.g. `/bondi-parking/<area>`), but keep adopted spokes on their existing URLs.
3. **Safe 301 posture (already the established pattern — keep using it):** consolidation only,
   never wholesale. To retire a cannibalizing duplicate:
   - Confirm it is **not** in `seo-protected-pages.json` (`allowRedirect:false` is a hard stop).
   - Migrate the richer body into the **higher-impression survivor** first.
   - Add the 301 in `next.config.mjs`, add the source to `REDIRECTED_PATHS`
     (`app/[...slug]/page.tsx`) so it isn't statically generated, set `indexable:false` in
     pages.json, and drop it from the sitemap (`REDIRECTED` set in `app/sitemap.ts`).
   - This is exactly what rounds 1–3 already did (cafes, restaurants, City2Surf-training,
     best-time-to-visit). Continue per-duplicate, evidence-led.
4. **Never** 301 a protected URL, never redirect a live URL to a not-yet-built page, never emit a
   redirect without moving the body first.

**Bottom line:** target pattern for *new* pages = clean topical (`/bondi-blog/<slug>` or
`/<hub>/<sub>`); legacy dated pattern = leave frozen and build hubs above it. Authority comes
from the hub layer and internal links, not from prettier spoke URLs.

---

## 7. Bondi-to-Coogee coastal-walk cluster (flagship)

This is the most linkable, most authoritative cluster the site can own — a 6 km walk with a dozen
sub-intents. Model it as **one pillar + a curated ring of spokes + the beach location nodes**,
with a dense internal-link web. Decide standalone URL vs on-pillar by search demand and depth.

### Pillar
`/bondi-coastal-walk` — the definitive guide. Already has route module + practical facts in
`lib/hubs.ts`. It should carry: the full route map, distance/time/direction, what to bring, and
**link cards to every standalone sub-topic and every beach node.** It is the hub every coastal
spoke up-links to.

### Sub-topics — standalone URL vs on-pillar

| Sub-topic | Treatment | Why |
|---|---|---|
| **Route map / directions** | On pillar | Core of the pillar itself; don't fragment. |
| **Which direction (Bondi→Coogee vs Coogee→Bondi)** | On pillar (H2 + FAQ) | Comparison intent, thin alone; strong as pillar FAQ (feeds FAQPage schema). |
| **Toilets & facilities along the walk** | **Standalone** | High practical search volume ("toilets bondi to coogee"), evergreen, linkable. |
| **Cafes / where to eat before & after** | **Standalone** | Real demand + monetisable; cross-links to `/bondi-eat-and-drink`. |
| **Beaches you pass** | Location nodes (below) | Each beach is its own entity page. |
| **Swimming stops / ocean pools en route** | On pillar section → deep-links to `/where-to-swim` + Bronte/Icebergs pool spokes | Reuse the Swim hub; don't duplicate. |
| **Accessibility / wheelchair / stairs** | **Standalone** | Distinct audience, high-value, evergreen, few competitors. |
| **Prams / with kids** | On pillar section → up-links to `/bondi-with-kids` | Serve via Family hub cross-link, not a new URL. |
| **Running the walk** | Deep-link to `/city2surf-and-running` + `bondis-best-running-routes` (461) | Reuse the Running hub. |
| **Photography spots** | On pillar section (+ drone/photography spoke 204) | Thin alone; strong as pillar section + existing drone spoke. |
| **Sculpture by the Sea** | **Standalone** (seasonal, Oct–Nov) | Big annual event, its own search spike; the 2025 spoke exists. |
| **Whale watching** | **Standalone** (seasonal, May–Nov) | Distinct query set; two whale spokes already exist. |
| **Sunrise / sunset** | On pillar section → shares `sunrise-sunset-bondi` (373) with `/bondi-weather` | One canonical spoke, linked from both pillar and Weather. |

**Standalone URLs to create/adopt (5):** toilets, cafes-before-after, accessibility, sculpture,
whale-watching. Everything else lives as a pillar section that deep-links to the owning hub.

### Location nodes on the walk
Adopt existing + **fill the two gaps**:
`/bondi-beach` → `/tamarama-beach` → `/bronte-beach` → **`/clovelly-beach` (NEW)** →
`/gordons-bay` (optional) → **`/coogee-beach` (NEW)`**, plus off-route `/mackenzies-bay`,
`/marks-park`, `/bondi-icebergs`. Add Coogee + Clovelly to `data/locations.ts` so the pillar's
route stops all resolve to real pages (today Clovelly/Coogee route stops in `lib/hubs.ts` have no
`href`).

### Internal-link web
```
                 ┌───────────────────────────────┐
                 │   /bondi-coastal-walk (PILLAR) │
                 └───────────────────────────────┘
      up-link ▲   ▲   ▲            │ down-link cards to all ▼
   ┌──────────┘   │   └──────────┐ │
[toilets]   [cafes]   [accessibility]  [sculpture]  [whale-watching]
   │            │            │
   └── sibling links across the ring (each standalone links to 2–3 others) ──┘
                 │
  route nodes:  Bondi → Tamarama → Bronte → Clovelly → Coogee
   (each beach page: up-links to pillar + links to prev/next beach + its own
    parking spoke + swimming/pool spoke)
                 │
  cross-hub deep-links OUT:  swimming-stops → /where-to-swim ;
    running → /city2surf-and-running ; prams → /bondi-with-kids ;
    cafes → /bondi-eat-and-drink ; getting there → /getting-to-bondi + /bondi-parking
```
Rule: pillar links **down** to all 5 standalones + all beach nodes; each standalone links **up**
to the pillar in its intro and **sideways** to 2–3 ring siblings; each beach node links up to the
pillar, to its prev/next beach, and to its own parking + pool spoke. The Bronte-carpark winner
(886) and Tamarama/Coogee/Clovelly-parking (448) become the parking entry points for those nodes.

---

## 8. Homepage strategy & wireframe

### Audit of the current homepage (`app/page.tsx`)
**What's already there (good, keep):**
- Full-bleed sunrise hero + H1 + 9 quick-link pills (nav to hubs incl. `/plan`, `/whats-on`).
- **`WeatherSurfSummary` (variant `bar`)** — live conditions strip. ✅ already built.
- **`SurfCam`** — live North Bondi camera iframe. ✅ already built.
- **`DayPlannerPromo`** — product entry point (`/plan`). ✅
- **`UpcomingEvents`** (date-aware, self-hiding) + **`TodayRecommendations`** (conditions-driven). ✅
- Featured guides grid (`featuredArticles(9)`) → `/articles`.
- `bondiPlaceJsonLd()` structured data. ✅

**Gaps for an "Everything you need to visit Bondi" homepage:**
1. No explicit **entry-point grid to the 12 hubs** — the only hub discovery is the hero pill row
   (9 links, easy to miss, no imagery). The homepage should be a visual "front door" to every hub.
2. Live conditions are thin: bar shows weather/surf, but **UV, water temp and tide** exist in the
   conditions service (`lib/conditions/*`, `roundTemp`, water temp injected on Swim hub) yet aren't
   surfaced up top. Pull UV + water temp into the hero conditions strip.
3. No **"planning your visit" band** (first-timer path: how long / when / getting here / where to
   stay) — the highest-intent visitor question ("I'm coming to Bondi, now what?").
4. Featured grid links to flat `/articles`; it should also seed the hub entry grid.

### Ideal homepage wireframe (top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HERO (full-bleed sunrise)                                 │
│    H1: "Bondi Beach like you live here"                      │
│    Sub + 3 primary CTAs: [Plan your day] [Things to do]      │
│                          [Where to swim]                     │
│    ── LIVE CONDITIONS STRIP (overlaid/just below) ──         │
│    Air °C · Water °C · UV · Surf (ft) · Sunrise/Sunset ·     │
│    Flags open?   → deep-links to /bondi-weather, /where-to-swim│
│    (WeatherSurfSummary — extend with UV + water temp)        │
├─────────────────────────────────────────────────────────────┤
│ 2. "START HERE" HUB GRID  ← NEW, the front door              │
│    12 image cards → each hub. Grouped: Things to Do · Swim &  │
│    Coast · Eat & Drink · Getting Around · Plan · Stay.        │
│    (Replaces relying on hero pills alone.)                    │
├─────────────────────────────────────────────────────────────┤
│ 3. PLAN YOUR VISIT band  ← NEW (first-timer conversion path) │
│    4 tiles: How long? (/itineraries) · When to go            │
│    (/bondi-weather) · Getting here (/getting-to-bondi) ·      │
│    Where to stay (/stay).  → then [Build my day → /plan]     │
├─────────────────────────────────────────────────────────────┤
│ 4. DAY PLANNER promo (DayPlannerPromo, homepage variant)     │
│    Product hero — interactive itinerary builder.             │
├─────────────────────────────────────────────────────────────┤
│ 5. LIVE SURF CAM (SurfCam) — genuinely useful, sticky.       │
├─────────────────────────────────────────────────────────────┤
│ 6. WHAT'S ON (UpcomingEvents, limit 3) — date-aware, hides   │
│    if empty.  → /whats-on                                    │
├─────────────────────────────────────────────────────────────┤
│ 7. POPULAR GUIDES (featuredArticles) — lead with the proven  │
│    winners: Lifeguards (3452), Parking, Icebergs, Coastal.   │
│    → /articles                                              │
├─────────────────────────────────────────────────────────────┤
│ 8. TODAY AT BONDI (TodayRecommendations) — conditions-driven │
│    "It's 24° and flat — perfect for the coastal walk."       │
├─────────────────────────────────────────────────────────────┤
│ 9. FOOTER MEGA-NAV  ← NEW/expand: all 12 hubs + all location │
│    pages + Stay/Eat collections, 6 columns. Authority backbone│
│    + About / Instagram / contact.                            │
└─────────────────────────────────────────────────────────────┘
```

**Conversion paths designed in:** (a) *browse* → hub grid (§2); (b) *plan* → Plan band + Day
Planner (§3–4); (c) *right-now* → live conditions + surf cam + Today (§1,5,8); (d) *book* → Stay
tile + Eat directory. Every band deep-links to a hub, so the homepage distributes authority to the
12 hubs on every visit.

**Repo reality check — already built, just surface them:** conditions service + water-temp
injection, `SurfCam`, `WeatherSurfSummary`, `UpcomingEvents`, `TodayRecommendations`,
`DayPlannerPromo`, `bondiPlaceJsonLd`. The new work is sections 2, 3 and 9 (hub grid, plan band,
footer mega-nav) plus extending the conditions strip with UV + water temp.

---

## 9. Build order (highest ROI first)

1. **Parking hub** (`/bondi-parking`) — ~2,470 views of demand, zero parent today. Extend
   `articleTopic` (parking branch before transport), add `HubDesign`, add pages.json hub record,
   wire nav under "Getting Around". Adopt the 4 protected parking winners.
2. **Coastal-walk cluster completion** — add `/coogee-beach` + `/clovelly-beach` locations, create
   the 5 standalone sub-topic spokes (toilets, cafes, accessibility, sculpture, whales), wire the
   link web in §7. Highest authority upside.
3. **Promote Swim core-page → full hub** with Pools/Safety/Conditions sections (adopts Icebergs
   841 + can-anyone-swim 534 + sea-temps 227).
4. **City2Surf & Running hub** — rescue the orphaned Sydney Marathon protected pages before the
   August spike.
5. **Homepage §2/§3/§9** — hub grid + plan band + footer mega-nav (distributes the new hubs'
   authority sitewide).
6. **Surfing hub** + **Itineraries hub** — lower traffic now, cheap to stand up, close the map.

Every step: extend `lib/articles.ts` (topic + branch order), `lib/hubs.ts` (design),
`content/pages.json` (hub record + curated spoke links), `lib/site.ts`/`app/page.tsx` (nav),
then validate `npx tsc --noEmit` · `npx vitest run` · `node scripts/seo-qa.mjs` before deploy.
