# 09 — Commercial Strategy, Directory, Interactive Map & Measurement

_Working synthesis file. Grounded in the real repo state as of 2026-08-11._
_Scope: Visit Bondi Beach only (Next.js 16 / Vercel / SSG+ISR). Not Squarespace — a directory,
interactive map, programmatic pages, affiliate deep-links and dashboards are all buildable in-repo._

## What already exists (don't rebuild — leverage)

Before any new work, the audit found that a surprising amount of the "commercial platform" is
**already shipped**. This changes the sequencing dramatically — most near-term revenue is a
*configuration + CTA-surfacing* job, not a build.

| Asset | Where | State | Commercial readiness |
|---|---|---|---|
| **Affiliate engine** | `lib/affiliate.ts` | Live. Travelpayouts wrapper. Providers: Booking.com, Hostelworld, Tripadvisor. Klook deep-links pass through untouched. | **Functional now, un-monetised until env markers set.** Returns plain provider URL when `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` + program id are absent; wraps in tracked `tp.media/r` redirect the moment they're set. |
| **Accommodation / `/stay`** | `data/accommodation.ts`, `data/accommodation-guides.ts` | ~24 properties, 8 category guide pages (`best-hotels`, `luxury`, `budget`, `hostels`, `family`, `apartments`, `hotels-near`, `bondi-vs-junction`), per-property guides at `/stay/[slug]`. Each property already carries `providers[]` + optional `bookingUrl` deep link. | **Ready to earn today.** Turn on the marker → every "Check availability" CTA becomes tracked. |
| **Dining directory** | `data/restaurants.json` (165 open), `data/bondiVenues.ts`, `lib/eatDrink.ts` | 167 venue pages at `/bondi-eat-and-drink/[slug]`, 11 best-of collections, `Restaurant`/`Cafe`/`BarOrPub`/`Bakery` schema, client-side filtering (no facet-URL spam). | Directory pattern **already proven**. This is the template for Workstream B. |
| **Activities** | `data/klookActivities.ts` | Surf lesson has a **live Klook affiliate link** (`s.klook.com/c/VweQkBrDwJ`); board hire / photo walk / tour are real experiences with empty `affiliateUrl` placeholders. | Partly monetised. Tours & activities is the biggest un-captured line. |
| **Location pages + maps** | `data/locations.ts`, `data/locations-extra.json`, `components/location/LocationMap.tsx` | Destination-page template; each place embeds a **Google Maps place-query iframe** (no API key, no coordinates asserted). | The map primitive already bypasses `remotePatterns:[]` (iframe, not `next/image`). Foundation for Workstream C. |
| **Events / `/whats-on`** | `data/events.ts`, `lib/events.ts` | Typed events with `dateStatus`, sub-pages (today / weekend / free / markets). | Monetisable via event-adjacent booking CTAs (tickets, tours near event dates). |

**Traffic reality (grounds every revenue estimate):** GSC data in `audit/page-inventory.csv`
shows the site is at **migration / early-index stage** — top page is `bondi-rescue-who-are-the-lifeguards`
at 1,095 impressions / 7 clicks; total site clicks are double digits. The commercial plan is
therefore **built for the traffic that's coming, not the traffic that's here** — the priority is
to have tracked, trust-safe monetisation *in place and mature* as rankings climb, not to chase
revenue off today's volume. Revenue figures below are deliberately **relative/qualitative with
stated assumptions**, never fabricated dollar amounts.

---

## A. Commercial strategy

### A.1 Guiding principles (trust is the asset)

1. **Editorial independence is the moat.** The first-person "genuinely local" voice is why anyone
   would trust a recommendation enough to book. Monetisation must never reorder recommendations.
   Rule: **commercial score is only ever a tie-breaker**, never a ranking driver — this is already
   how `scoreKlook` / `scoreVenue` behave; keep it.
2. **Monetise the decision the visitor already wants to make.** People arriving on "best hotels
   Bondi" or "learn to surf Bondi" have *already decided to book something* — an affiliate CTA there
   is a helpful shortcut, not an intrusion. That's high-fit revenue. A pop-up newsletter gate or a
   travel-insurance banner on a lifeguard-trivia page is low-fit and trust-damaging.
3. **Never fabricate to sell.** No invented payout rates presented as fact, no "sponsored" content
   that reads as editorial, no fake urgency ("2 rooms left!"). Disclosure on every affiliate surface.
4. **Prefer the network you already run.** Travelpayouts already powers the affiliate engine and
   *also* hosts Viator, GetYourGuide, Booking.com, Hostelworld and insurance products. Adding tours
   or insurance is a **new provider adapter + program id in `lib/affiliate.ts`**, not a new integration.

### A.2 The monetisation surfaces, scored

Scoring is **relative** (H/M/L), with each score's assumption stated. Composite priority favours
things that are (high expected revenue) × (high strategic fit) × (high trust-safety) × (low effort,
because the infra exists).

**Assumptions applied throughout:** affiliate commissions are industry-published rates
(Booking.com/Hostelworld/Viator/GetYourGuide ≈ **8%** via Travelpayouts; GetYourGuide ≈ 7% via Awin;
Bounce/Stasher luggage ≈ **10%** direct; travel insurance ≈ 10–25% of premium). Conversion and
traffic are unknown at this stage, so "expected revenue" ranks *potential given intent-match and
booking value*, not a dollar forecast. AOV logic: a hotel booking (multi-night, high ticket) pays
far more per conversion than a $12 luggage stash, so hotel/tour lines rank highest on revenue even
at similar %.

| # | Surface | Expected rev (assumption) | Strategic fit | Trust-safety | Effort (infra state) | Priority |
|---|---|---|---|---|---|---|
| 1 | **Accommodation affiliate** (Booking/Hostelworld/Tripadvisor on `/stay`) | **H** — high ticket, multi-night AOV, 8%; `/stay` already targets high-intent queries | **H** — `/stay` exists, on-brand | **H** — CTA = "check availability", no fabricated price | **Trivial** — set env marker; code shipped | **P0 (turn on now)** |
| 2 | **Tours & activities** (Viator + GetYourGuide via Travelpayouts; Klook already live) | **H** — surf lessons, coastal tours, whale watching; 8%; strong Bondi intent | **H** — pairs with planner + activities data | **H** if editorially chosen first, CTA second | **Low** — add provider adapter + program id; reuse Klook pattern | **P0/P1** |
| 3 | **Surf lessons** (Let's Go Surfing — Bondi's only licensed school — via Klook/GYG/Viator) | **M-H** — iconic "learn to surf Bondi" intent, mid ticket | **H** — signature Bondi activity | **H** — one genuinely-best operator; easy to endorse honestly | **Low** — a subset of #2 | **P1** |
| 4 | **Luggage storage** (Bounce / Stasher, 10% direct) | **M** — low ticket but high conversion; day-tripper pain point | **H** — real visitor need (where to leave bags before the beach) | **H** — pure utility, no editorial conflict | **Low** — direct signup + a `/bondi-luggage-storage` utility page | **P1** |
| 5 | **Restaurant bookings** (SevenRooms/TheFork/OpenTable deep links on the 167 venue pages) | **M** — low/no direct commission in AU, but drives partnerships & UX | **H** — directory already links `bookingUrl` | **H** — links to venue's own booking, no price claims | **Low** — surface existing `bookingUrl` as a clear CTA | **P1** |
| 6 | **Newsletter** (owned audience — the compounding asset) | **M (indirect)** — no direct rev; multiplies every other line via repeat visits & email promos | **H** — de-risks Google/AI dependency | **H** — opt-in, value-first (events, conditions, openings) | **Med** — needs ESP + double opt-in + a genuine content cadence | **P1 (start capturing early)** |
| 7 | **Transport** (airport transfers, Opal info, rideshare) | **L-M** — transfers pay (via GYG/Klook), Opal itself doesn't | **M** — useful but thin margin | **H** — utility framing | **Low** — a transfer product in the activities feed | **P2** |
| 8 | **Travel insurance** (HeyMondo/SafetyWing/EKTA via Travelpayouts) | **M** — high % of premium, but low contextual fit for a single-suburb guide | **L-M** — Bondi visitors rarely buy insurance *on a beach guide* | **M** — must be clearly non-editorial, disclosed | **Low** — Travelpayouts adapter | **P2** |
| 9 | **Local partnerships / premium listings** (paid featured placement in directory) | **M-H** at scale — recurring local ad revenue | **M** — powerful once directory has traffic & is the local authority | **Risk: H** — must be *labelled*, never reorder editorial ranking, never buy a "why we'd go" | **Med** — needs a labelled `sponsored` field + firewall | **P2 (after directory has authority)** |
| 10 | **Sponsored content** (paid editorial features for venues/events) | **M-H** per placement | **M** | **Risk: H** — the fastest way to burn the moat if done badly | **Med** — needs disclosure system + editorial firewall | **P3 (only once brand is established)** |
| 11 | **Lead-gen** (weddings/events/functions enquiries to venues) | **M** — high-value leads (function bookings) | **M** — narrow but lucrative niche | **M** — must be transparent it's an enquiry form | **Med** — form + routing + consent | **P3** |
| 12 | **Visitor products** (own-brand: printable guides, map poster, merch) | **L-M** — brand upside, low volume | **M** — reinforces brand, no third-party dependency | **H** — fully owned, no conflict | **Med-High** — product + fulfilment | **P3** |

### A.3 Recommended sequencing

**Phase 0 — flip the switches already built (days, not weeks).**
- Register with Travelpayouts; set `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` + `NEXT_PUBLIC_TP_P_BOOKING`
  / `_HOSTELWORLD` / `_TRIPADVISOR`. Every `/stay` CTA becomes tracked instantly — **zero code**.
- Fill the empty `affiliateUrl` placeholders in `data/klookActivities.ts` with real Klook links
  (board hire, coastal photo walk, eastern-beaches tour). The surf lesson is already live.
- Add UTM/`sub_id` discipline (the engine already builds `sub_id` from `campaign`/`placement` — make
  every CTA pass a placement string so GSC/GA4 can attribute revenue by page).
- Add a persistent, honest **affiliate disclosure** component (once, in the layout footer + inline on
  monetised CTAs).

**Phase 1 — capture the highest-intent, on-brand lines.**
- Extend `lib/affiliate.ts` with a **`viator` and `getyourguide` provider adapter** (both on
  Travelpayouts — same wrapper, new program id). Surface tours/surf lessons on: activity data,
  the planner, `/whats-on` event pages, and relevant articles.
- Ship a `/bondi-luggage-storage` utility page (Bounce/Stasher) — answers a real query, converts well.
- Surface the existing restaurant `bookingUrl` fields as a clear "Book a table" CTA on venue pages.
- **Stand up the newsletter now** even at low traffic — the list compounds; capture is cheap early.

**Phase 2 — build recurring / owned revenue as authority grows.**
- Add insurance + transfers to the activities feed (low fit, but free once the adapter exists).
- Design the **premium-listing / sponsored system with a hard editorial firewall** (see B.6). Only
  turn on once the directory is demonstrably the local authority (referring domains + branded search).

**Phase 3 — brand-led lines.** Sponsored editorial, lead-gen forms, own-brand products. These need
an established brand to be credible and non-damaging.

### A.4 Revenue-per-visitor framing (with stated assumptions)

Do **not** publish or rely on invented RPV dollars. Track RPV as
`affiliate + product revenue ÷ sessions` once GA4 + affiliate dashboards report. Model the *shape*:
- **Highest RPV pages** will be `/stay/*` and any "learn to surf / best tours" pages (booking intent
  × high AOV). Instrument these first.
- **Lowest RPV, highest traffic** pages (Bondi Rescue trivia, parking, City to Surf) monetise poorly
  directly — their job is **top-of-funnel + newsletter capture + internal links** to the money pages.
  Treat their value as audience-building, measured by assisted conversions and email signups, not RPV.

---

## B. Directory strategy

### B.1 Verdict: **Yes — but as a controlled expansion of the proven dining pattern, not a generic "list everything" directory.**

The dining directory (`/bondi-eat-and-drink`, 167 source-verified pages with first-person editorial
judgement + `Restaurant` schema + client-side facets) already **proves the model works and is
Google-helpful-content-safe**. The strategic move is to **replicate that exact discipline** across a
small number of high-intent Bondi categories — and to *refuse* to build thin category pages just to
have them.

**Why extend:**
- **SEO:** "bondi [category]" and "[venue] bondi" are real, winnable long-tail clusters. Each
  non-thin business page is an indexable entity that can rank and can be cited by AI answers.
- **Head start:** the schema, verification pipeline (`npm run restaurants:verify`), collection/ranking
  engine, and page template already exist. Marginal cost per new category is far lower than greenfield.
- **Monetisation:** directory pages are the natural home for affiliate CTAs (hotels, surf schools,
  activities) *and* future premium listings — but only credibly once they're genuinely useful.
- **Internal linking + entity authority:** a structured directory tightly interlinks with the map,
  the planner, `/stay`, and articles, reinforcing the canonical Bondi Beach place entity.

**The real risk — thin-content / Google helpful-content:** a directory of 500 auto-generated
"[Business] is a business in Bondi" stubs is a **liability**, not an asset. The dining set avoids this
by carrying editorial judgement, a source, and a verification date on every record. **Non-negotiable
gate: no category ships until every page in it clears the "uniquely useful" bar (B.5).**

### B.2 Recommended category scope (ranked by build-priority)

| Category | Build? | Rationale | Data source |
|---|---|---|---|
| Restaurants/cafés/bars | ✅ **Done** | Shipped (167). | `restaurants.json` |
| **Accommodation** | ✅ **P0** | Already structured in `accommodation.ts`; highest revenue; just needs directory-style surfacing + LodgingBusiness schema (already have it). | `accommodation.ts` |
| **Surf schools / board hire** | ✅ **P1** | Tiny set (Let's Go Surfing is *the* licensed Bondi school + a handful of hire outlets), signature intent, easy to be genuinely useful, directly monetisable. | new `data/surfSchools.ts` |
| **Activities / experiences / tours** | ✅ **P1** | Coastal walk operators, whale watching, photo tours, boot camps, ocean-pool swims. Pairs with the activities affiliate line. | extend `klookActivities.ts` / new `activities.ts` |
| **Attractions / landmarks / beaches / pools** | ✅ **P1** | Already partly modelled in `locations.ts`; free, high informational + AI value, anchors the map. | `locations.ts` (+extra) |
| **Gyms / fitness / yoga / pilates** | ⚠️ **P2** | Bondi is a fitness capital (real search demand), but low direct monetisation and higher churn. Build only if editorial can keep it fresh. | new `data/fitness.ts` |
| **Beauty / wellness (salons, spas, massage)** | ⚠️ **P2/P3** | Search demand exists; monetisation thin, churn high, editorial cost high. Lower priority. | new |
| **Shops / retail** | ❌ **Hold** | Highest churn, lowest intent, thinnest content risk. Only as curated "best of" *collections*, never an exhaustive directory. | — |

**Principle:** breadth is a trap. Ship **deep, verified, editorially-judged** coverage of the
categories a Bondi visitor actually searches (stay, eat, surf, do, see) before touching the long tail.

### B.3 Information architecture

```
/                                   (home)
├── /stay                           accommodation hub  ── LodgingBusiness ── [P0, exists]
│   ├── /stay/[category]            best-hotels, luxury, budget, hostels, family, apartments … [exists]
│   └── /stay/[slug]                property page (guide)                                       [exists]
├── /bondi-eat-and-drink            dining hub  ── Restaurant/Cafe/Bar ── [exists, 167]
│   ├── /bondi-eat-and-drink/[collection]   best-restaurants, cafes, bars, brunch … [exists]
│   └── /bondi-eat-and-drink/[slug]         venue page                              [exists]
├── /bondi-surf-schools             surf & board-hire hub  ── SportsActivityLocation ── [P1, new]
│   └── /bondi-surf-schools/[slug]  operator page
├── /things-to-do-bondi             activities hub  ── TouristAttraction/Event ── [P1, new]
│   └── /things-to-do-bondi/[slug]  experience/operator page
├── /bondi-attractions              beaches/pools/landmarks/parks  ── from locations.ts ── [P1, mostly exists]
│   └── /[location-slug]            Bondi Beach, Icebergs, North Bondi, Tamarama … [exists]
├── /bondi-fitness                  gyms/yoga/pilates  ── ExerciseGym ── [P2, new]
├── /bondi-map                      interactive map landing (Workstream C)          [P1, new]
└── /whats-on                       events  ── Event ── [exists]
```

**Cross-linking rules (entity authority):**
- Every business page links **up** to its category hub and the canonical Bondi Beach place entity
  (`containedInPlace`, already used in dining schema).
- Every business page links **sideways** to 3–6 genuinely related entities ("nearby", "similar",
  "pairs well with") — e.g. a surf school → nearest café, nearest hotel, the beach it operates on,
  the coastal-walk page. This is what turns thin stubs into a connected, useful graph.
- Every business page links **into the map** at its pin (`/bondi-map#pin=[id]`) and back.
- Hubs and collections carry `ItemList` schema (already the dining pattern).
- **Facets stay client-side** (the deliberate dining decision) — no `?type=cafe&area=north` URLs
  that spawn thin, near-duplicate indexable pages. Curated *collections* are the only faceted URLs.

### B.4 Sample business-page architecture (surf school — the P1 template)

Data record (new `data/surfSchools.ts`, mirroring the venue/property discipline):

```ts
interface SurfSchool {
  slug: string;                    // "lets-go-surfing-bondi"
  name: string;
  status: 'operating' | 'temporarily-closed' | 'closed';
  category: 'surf-school' | 'board-hire';
  zone: Zone;                      // reuse existing Zone type
  address?: string;                // "128 Ramsgate Ave, North Bondi" — durable, verified only
  lat?: number; lon?: number;      // only if publicly documented; else omit (map uses name query)
  established?: number;            // durable fact (Let's Go Surfing: 1995)
  offerings: string[];             // "2hr group lesson", "kids groms", "private", "board+wetsuit hire"
  suitableFor: Tag[];              // beginners, kids, groups, improvers
  priceBand?: 1|2|3;               // editorial estimate, labelled as such — never a fabricated $ price
  // Editorial (the anti-thin content — first person, genuinely local):
  summary: string;                 // one neutral line for cards
  whyGo: string;                   // the honest local take: who it's for, what's special
  localTip: string;                // a real, non-obvious tip (best tide/time, which lesson to pick)
  tradeOff: string;                // honest downside (books out summer weekends; over-12 only; etc.)
  // Commerce (tie-breaker only):
  officialUrl: string;
  bookingUrl?: string;             // affiliate deep link (Klook/GYG/Viator) OR operator's own booking
  // Integrity:
  sources: string[];
  lastVerified: string;
  confidence: 'high'|'medium'|'low';
}
```

Rendered page sections:
1. **H1 + one-line hero** ("Learn to surf on Bondi with the beach's only licensed school").
2. **Quick facts** (`quickFacts` block): location, established, lesson lengths, ages, what's included —
   durable facts only; volatile price/times link to `officialUrl`.
3. **"Why we'd send you here"** — first-person editorial judgement (the moat).
4. **Honest trade-off** — the credibility signal AI models and readers reward.
5. **Local tip** — non-obvious, genuinely local.
6. **Book CTA** — clearly labelled affiliate ("Check times & book on [Klook/GetYourGuide]"), with
   disclosure; falls back to operator's own site if no affiliate.
7. **Map pin** (`LocationMap` at the operator, or the shared `/bondi-map` deep-linked to its pin).
8. **Nearby & related** — nearest café/hotel/beach access, the coastal walk, other operators (honest
   comparison, not hidden).
9. **"How we verified this"** — sources + `lastVerified` (already the dining pattern).
10. **`SportsActivityLocation`/`LocalBusiness` schema** — durable facts only, bound to Bondi place
    entity via `containedInPlace`. No fabricated `aggregateRating`.

### B.5 The "uniquely useful, non-thin" bar (helpful-content gate)

Every directory page must clear **all** of these before it can index, enforced by an extension of the
`restaurants:verify` script pattern (hard-error gates deploy):
- Carries **original editorial judgement** (`whyGo`) — not a rephrased Google Business blurb.
- Carries at least one **honest trade-off** or limitation.
- Carries a **genuinely local tip** not found on the venue's own site.
- Carries **≥3 meaningful internal links** to related entities (not thin nav).
- Carries a **source + `lastVerified` + `confidence`**; `status !== 'operating'` ⇒ not bookable.
- Has a **map presence** and reciprocal linking.
- **No fabricated volatile facts** (hours/prices/phone) — link to source instead.

If a would-be entry can't clear this bar, it belongs in a curated *collection* mention, not as a
standalone indexable page. This is the single most important rule for surviving helpful-content updates.

### B.6 Directory monetisation + the editorial firewall

- **Affiliate CTAs** on stay/surf/activity pages (Phase 0/1). Restaurants link to their own booking.
- **Premium / featured listings (Phase 2):** a `sponsored: true` + `sponsorLabel` field. Rules baked
  into the renderer and the verify script:
  - Sponsored placement may **add a labelled badge and pin the card to the top of a list**.
  - Sponsored placement may **never** alter `whyGo`, `tradeOff`, the editorial score, or the ranking
    engine's ordering of *non-sponsored* results.
  - Every sponsored surface renders a visible "Paid placement" label — no exceptions.
  - The editorial "why we'd go" is **never for sale**; only visibility is.
- This firewall is what lets the directory earn local ad revenue *without* becoming a pay-to-play list
  that readers and Google stop trusting.

### B.7 Maintenance burden (be honest)

Directories rot. The dining set already has a 180-day freshness window + a verify script that flags
staleness, missing sources, thin editorial, low confidence, duplicates and enum drift. **Every new
category must ship with the same verify coverage** or it will silently decay into thin/wrong content.
Budget recurring editorial time per category; do **not** open a category the team can't keep verified.
This maintenance reality is the strongest argument for *narrow, deep* scope over broad coverage.

---

## C. Bondi interactive map

### C.1 Verdict: **Build it — as a flagship, standalone, layered utility page (`/bondi-map`). High value across all four axes.**

A genuinely useful Bondi map is one of the highest-leverage single features on the roadmap:

- **User value (H):** "where are the toilets / showers / free water / parking / the good coffee /
  where's safe to swim with kids" is *exactly* what a beach visitor needs and what no single competitor
  map answers well. Utility drives return visits and newsletter signups.
- **SEO value (M-H):** ranks for "bondi beach map", "bondi facilities/toilets/parking map", and — more
  importantly — becomes the internal-linking hub that every location/venue/directory page points into
  and out of, concentrating authority.
- **Backlink value (H):** *maps are link magnets.* A clean, genuinely useful facilities/accessibility
  map is the kind of resource blogs, council pages, accessibility groups and forums link to
  organically. This is the single best backlink-earning asset in the plan.
- **AI value (H):** structured, layered place data (with the underlying entities exposed as text +
  schema) is highly citable by ChatGPT/Perplexity/AIO for "what's at Bondi / where's parking /
  accessible facilities" prompts — provided the data is **also rendered as crawlable text/lists**, not
  locked inside a canvas.

### C.2 Layers (all buildable from data the site already owns or can verify)

Beach & safety: **swimming (flagged areas / patrol context)**, surf-school zones, ocean pools (Icebergs,
Bronte), **accessibility** (beach wheelchairs, accessible parking/toilets, ramps).
Facilities: **toilets, showers, free drinking water, parking (free/paid), change rooms, kids/playgrounds**.
Food & stay: cafés, restaurants, bars (from `restaurants.json`), hotels/hostels (from `accommodation.ts`).
Do & see: surf schools, activities/tours, **photo spots**, the **coastal walk route** (Bondi→Bronte→Coogee),
landmarks/attractions (from `locations.ts`).

**Integrity constraint:** facility pins (toilets, water, accessible parking) are **facts** — source
them from Waverley Council / official data and carry `lastVerified`, exactly like every other record.
Do not guess pin coordinates. A wrong "accessible toilet here" pin is a trust *and* safety failure.

### C.3 Implementation in Next.js — and the `remotePatterns:[]` implication

**The constraint:** `next.config.mjs` sets `remotePatterns:[]`, which blocks remote hosts for
`next/image`. It does **not** block `<iframe>` (that's why `LocationMap`'s Google Maps embed works
today) — but a proper interactive tiled map (Leaflet/MapLibre) pulls **raster/vector tiles over the
network at runtime**, which is a different concern: it's `fetch`/`<img>` traffic to a tile host, plus
(potentially) a Content-Security-Policy question, not a `next/image` question. So the real decisions:

**Option 1 — Static/illustrated SVG map (no tiles, no runtime network).** Hand-built or generated SVG
of the Bondi coastline with data-driven pins + toggleable layers in client JS. **Pros:** zero external
dependency, fully self-contained, fast, no tile host, no CSP/remotePatterns issue at all, works with
SSG. **Cons:** no pan/zoom to street level, more design effort, less "real map" feel. **Best for:** a
beautiful, link-worthy *facilities & orientation* map — which is arguably the highest-value version.

**Option 2 — Client map library (Leaflet or MapLibre GL) with a tile source.** Real pan/zoom/street
detail. **Pros:** familiar UX, precise. **Cons:** requires allowing a tile host — either
(a) OpenStreetMap/MapTiler/Carto tiles (needs the domain permitted; document it explicitly rather than
relying on the `next/image` allowlist, and add the tile host to CSP `img-src`/`connect-src`), or
(b) **self-host a small pre-rendered tile set** for just the Bondi bounding box in `/public` (a few MB)
— which keeps the "everything local" posture and sidesteps remote-host policy entirely. Load the lib
**client-side only** (`dynamic(() => ..., { ssr:false })`) so SSG isn't affected; lazy-load below the fold.

**Recommendation:** **MapLibre GL with a self-hosted Bondi tile set in `/public`** (Option 2b) for the
interactive experience, OR **Option 1 SVG** if the team wants a distinctive, fully-owned, maximally
link-worthy asset with zero external dependency. Either way:
- **Render every pin's data as crawlable HTML** (a categorised list beneath the map) so the page has
  real indexable/AI-citable content and isn't a blank canvas to a crawler. The map is the UI; the list
  is the SEO/AI payload.
- Emit `Place`/`LocalBusiness` schema for the mapped entities (reuse existing patterns).
- Keep coordinates verified-only; facility layers cite Waverley Council.

### C.4 Standalone page + linking

Yes — **`/bondi-map` as a standalone landing page** (it's a linkable, rankable, citable asset in its
own right). Then thread it through the site:
- Home + primary nav feature it ("Interactive Bondi map").
- Every location page (`Bondi Beach`, `Icebergs`, `North Bondi`) links to the map deep-linked to that
  place; the map links back.
- Directory/venue pages link to their pin (`/bondi-map#pin=[id]`) and vice-versa.
- Utility articles (parking, toilets, swimming safety, coastal walk) — which are **already the top
  traffic pages** (parking, City to Surf, where-to-swim) — embed or prominently link the relevant map
  layer. This routes existing traffic into the flagship asset and deepens internal linking.
- `/whats-on` event pages show the event location on the map.

---

## D. Measurement framework

Design for **free tools first** (GSC, GA4, manual AI-prompt logs, affiliate dashboards). Flag clearly
what needs paid tooling. Cadence: a **monthly report**, plus a lightweight weekly glance at leading
indicators.

### D.1 KPI tree

**1. Google / organic search (source: GSC — free)**
- Total clicks, impressions, avg CTR, avg position (trend MoM).
- **Non-brand clicks/impressions** (exclude "visit bondi beach"-type queries) — the true growth signal.
- **Top-3 and top-10 keyword counts** (how many queries rank in striking distance).
- **Keyword-universe coverage** — # of distinct queries generating impressions (breadth of the net).
- **Share of voice** — for a tracked seed set of ~30 core Bondi queries (stay/eat/surf/parking/things
  to do), our position vs. the SERP. Manual/free at small scale; scales with a paid rank tracker.
- Page-type breakdown: clicks by section (`/stay`, `/bondi-eat-and-drink`, articles, map) — which
  clusters are winning.
- **Baseline note:** today the site is at migration stage (top page ~1,095 impr / 7 clicks). Month 1
  is about establishing the baseline, not hitting a number.

**2. AI / answer engines (source: manual prompt-testing protocol — free; no paid tool)**
- **Prompt panel:** a fixed set of ~20–30 representative prompts ("best hotels near Bondi Beach",
  "where to learn to surf in Bondi", "is Bondi Beach safe to swim", "where to park at Bondi",
  "best cafés in Bondi") run monthly across **ChatGPT, Perplexity, Google AI Overviews, Copilot**.
- Log per prompt: **are we cited? linked? named? which page? position among sources? accurate?**
  Store as a dated CSV (`audit/ai-citation-log.csv`) so trend is visible over months.
- Metric: **citation rate** (% of prompts where we're cited) and **share of AI voice** vs. competitors.
- This is the only reliable free way to measure AI visibility — treat the log as a first-class dataset.

**3. Authority / brand (sources: GSC + GA4 + free backlink checkers)**
- **Referring domains** (new/lost) — the map and directory are the assets meant to move this. Free tier:
  Google "link:"/Search Console links report, or free tiers of Ahrefs/Moz; deeper analysis needs paid.
- **Branded search volume** (GSC queries containing the brand) — proxy for brand awareness.
- **Direct traffic** (GA4) — returning, intent-loyal audience.
- **Newsletter list size + growth rate** — the owned-audience compounding metric.

**4. Commercial (sources: GA4 events + each affiliate network's dashboard)**
- **Affiliate CTA clicks** (GA4 outbound-click events, split by `sub_id`/placement — the engine already
  builds `sub_id`, so wire GA4 to capture it).
- **Booking referrals / qualified actions** (Travelpayouts, Klook, Bounce/Stasher dashboards).
- **Bookings & commission** by line (stay / tours / surf / luggage) and by source page.
- **Leads** (function/enquiry forms, Phase 3).
- **Newsletter signups** (and signup rate by page).
- **Revenue per visitor / per session** = (affiliate + product revenue) ÷ sessions — computed once
  both sides report; track by page-cluster to find the money pages.
- **Assisted conversions** — credit top-of-funnel pages (Bondi Rescue, parking, City to Surf) that
  don't convert directly but feed the money pages / newsletter.

### D.2 Monthly dashboard structure

```
VISIT BONDI BEACH — MONTHLY PERFORMANCE  ·  <Month YYYY>

0. HEADLINE (5 numbers + arrows)
   Non-brand clicks · Top-10 keywords · Referring domains · AI citation rate · Affiliate revenue

1. SEARCH (GSC)
   Clicks / impressions / CTR / position (MoM + 3-mo trend)
   Non-brand split · Top-3 & Top-10 keyword counts · keyword-universe size
   Share of voice on the 30-query seed set
   Winners & losers by page-cluster (stay / eat / surf / do / map / articles)

2. AI VISIBILITY (manual prompt log)
   Citation rate this month · trend · share-of-AI-voice vs competitors
   Prompt-by-prompt table: cited? page? accurate? — with notes on gaps to fix

3. AUTHORITY & BRAND
   Referring domains (new/lost, notable links) · branded search · direct traffic
   Newsletter list size + growth

4. COMMERCIAL
   CTA clicks by placement · referrals/bookings/commission by line & source page
   RPV / RPS · newsletter signups · leads · assisted conversions
   Top money pages · top leaks (high-traffic, low-RPV → link them to money pages)

5. CONTENT & DATA HEALTH
   Pages published/updated · directory verify status (stale/thin/low-confidence flags)
   events:verify / restaurants:verify output · broken-link + schema check

6. ACTIONS NEXT MONTH (max 5, tied to the numbers above)
```

### D.3 Free vs. paid

| Metric area | Free (use now) | Needs paid |
|---|---|---|
| Search performance | **GSC** (clicks, impr, CTR, position, queries, top-3/10, coverage) | Large-scale daily rank tracking, automated SoV (Ahrefs/Semrush) |
| AI visibility | **Manual prompt log** across ChatGPT/Perplexity/AIO/Copilot | Automated AI-citation monitoring (Peec, Otterly, Profound) |
| Authority | GSC links report; free tiers of Ahrefs/Moz; branded-search via GSC | Full backlink index, historical link tracking |
| Behaviour | **GA4** (sessions, direct, outbound clicks, events, funnels) | Session replay / advanced attribution |
| Commercial | **Affiliate dashboards** (Travelpayouts/Klook/Bounce/Stasher) + GA4 events | Cross-network revenue aggregation tooling |

Everything essential is trackable **free** at this stage. The one discipline that must start
immediately and can't be back-filled: the **monthly AI-prompt log** (no historical data exists unless
you begin capturing it) and **GA4 outbound-click + `sub_id` capture** (so affiliate revenue can be
attributed to pages from day one).

---

## Appendix — concrete first actions (maps strategy → repo)

1. **Turn on affiliate tracking** — set `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` + program-id env vars.
   Zero code; every `/stay` CTA becomes tracked. _(A, P0)_
2. **Fill Klook placeholders** in `data/klookActivities.ts` with real affiliate links. _(A, P0)_
3. **Add a `viator` + `getyourguide` provider adapter** to `lib/affiliate.ts` (same Travelpayouts
   wrapper, new program ids). Surface tours/surf on activities, planner, `/whats-on`, articles. _(A, P1)_
4. **Ship an affiliate-disclosure component** + ensure every CTA passes a `placement`/`sub_id`. _(A, P0)_
5. **Wire GA4 outbound-click events** capturing `sub_id` for per-page revenue attribution. _(D)_
6. **Stand up the newsletter** (ESP + double opt-in + a real cadence). _(A, P1)_
7. **Build `data/surfSchools.ts`** on the venue/property template; ship `/bondi-surf-schools`. _(B, P1)_
8. **Extend the `verify` script pattern** to each new category (the non-thin gate). _(B)_
9. **Build `/bondi-map`** (self-hosted-tile MapLibre or owned SVG) with crawlable pin list + schema;
   thread it through location/directory/utility pages. _(C, P1)_
10. **Start the monthly report + AI-prompt log now** to establish baselines. _(D)_

## Sources
- [Viator vs GetYourGuide affiliate — commission & payouts (2026)](https://automate.travel/blog/viator-vs-getyourguide-for-operators/)
- [GetYourGuide affiliate program 2026 — commission rates](https://affylist.com/products/getyourguide)
- [Tour OTA commission rates 2026 — Viator, GYG, Klook](https://www.sambahq.com/ota-supplier-guide/ota-commission-rates)
- [Let's Go Surfing — Bondi (official)](https://letsgosurfing.com.au/lessons/bondi/)
- [Lets Go Surfing Bondi Surf School — Sydney.com](https://www.sydney.com/things-to-do/tours/lets-go-surfing-bondi-surf-school)
- [Bounce affiliate program](https://bounce.com/ls/affiliates)
- [Stasher affiliate program](https://partners.stasher.com/)
- [Best travel affiliate programs 2026 (Travelpayouts brand list)](https://stasher.com/blog/best-travel-affiliate-programs)
