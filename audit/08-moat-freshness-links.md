# 08 — Local-Authority Moat, Freshness System, Flagship Research & Link Acquisition

_Working synthesis file. Specific to visitbondibeach.com and this codebase. Everything here maps to
existing repo mechanics: the authored-body pipeline (`content/bodies/*.json` → `body-overrides.json`),
the `lastReviewed` + `sources` fields on `Page` (`lib/content.ts`), the event `dateStatus` /
`dateVerifiedAt` provenance system (`data/events.ts`), and the structured-data helpers in
`lib/structured-data.ts`. **Integrity rule stands over everything below: never fabricate a venue fact,
date, price or statistic. Where this doc proposes original data, it specifies the collection
methodology — it does not invent findings.**_

Author's date context: today is 2026-08-11. Impression/click figures cited are the Search Console
values embedded in `content/pages.json` / `audit/page-inventory.csv`.

---

## A. The Local-Authority Moat (E-E-A-T)

### A.0 The problem with "Written in Bondi. Checked in Bondi."

It's a claim, not a signal. Google's Quality Rater Guidelines and every LLM retrieval stack reward
**verifiable, attributable, first-hand experience** — not slogans. Right now the site attributes
everything to an `Organization` ("Visit Bondi Beach Editorial Team"), emits no `Person` schema
(`AUTHOR.type` defaults to `'Organization'` in `lib/site.ts`), and the strongest provenance we ship is
a "Last reviewed" line plus a `sources` list on authored bodies. That is a solid floor. The moat is
built by making **experience** (the first "E" in E-E-A-T, the one competitors like Sydney.com,
TripAdvisor and national publishers structurally cannot fake) legible on every page and in every
schema block.

Our one defensible advantage is that we are physically here, repeatedly, over time. The moat strategy
is: **turn that into machine-readable and human-visible proof, consistently, on a schedule.**

### A.1 Named writers + Person schema (the biggest single missing signal)

Replace the anonymous collective with **2–4 named local authors**, each a real person with a real bio,
a real Bondi tenure, and a stable author page. This is the highest-leverage E-E-A-T change available.

**Author identity model.** Add a small typed registry — `data/authors.ts` — one record per writer:

```
interface Author {
  id: string;                 // 'author-slug'
  name: string;               // real name
  role: string;               // 'Editor', 'Food & drink', 'Surf & swim', 'Family'
  bio: string;                // 2–3 sentences, concrete: years at Bondi, what they cover
  bioLong: string;            // author-page bio: how they know Bondi, verification habits
  yearsAtBondi: number;       // real
  beats: string[];            // ['dining','coffee'] — maps to hub topics
  photo: string;              // real headshot, local path (media key convention)
  sameAs?: string[];          // real, verified: personal site, LinkedIn, IG — never fabricated
  credentials?: string[];     // e.g. 'Bondi resident since 2014', 'former SLS volunteer' — only if true
}
```

**Author pages.** One indexable page per author at `/team/<id>` (or extend the existing
`/visit-bondi-beach` that `AUTHOR.url` already points at into a proper team hub). Each carries: bio,
beats, a reverse-chronological list of that author's articles, and their `Person` JSON-LD.

**Person schema.** `lib/structured-data.ts` currently has no `personJsonLd`. Add one and stop hard-coding
author into `articleJsonLd`:

```
export function personJsonLd(a: Author) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteOrigin()}/team/${a.id}#person`,
    name: a.name,
    jobTitle: a.role,
    description: a.bio,
    url: `${siteOrigin()}/team/${a.id}`,
    image: a.photo.startsWith('http') ? a.photo : `${siteOrigin()}${a.photo}`,
    knowsAbout: a.beats,                 // ties the person to the topics they cover
    worksFor: { '@id': `${siteOrigin()}/#org` },
    homeLocation: { '@id': `${siteOrigin()}/${BONDI_PLACE_ID}` }, // person literally located at the place
    ...(a.sameAs?.length ? { sameAs: a.sameAs } : {}),
  };
}
```

Then in `articleJsonLd`, set `author` to the `@id` reference `{ '@id': '.../team/<id>#person' }` and emit
the full `Person` node once per page (or on the author page). Bind `author` → `Person` →
`homeLocation` → the canonical Bondi Beach `@id` already defined (`BONDI_PLACE_ID`). This creates the
chain answer-engines want: *this named person, who lives at this resolved real-world place, wrote this
article about that place.* No competitor covering all of Sydney can emit `homeLocation: Bondi Beach`
truthfully.

**Byline upgrade** (`app/[...slug]/page.tsx`, currently `By {AUTHOR.name}`): render `By <a href="/team/x">Name</a> · Role` with the headshot, linking to the author page. Keep the existing
published/updated `<time>` logic.

> Integrity gate: a named author with a fabricated bio is worse than an anonymous team. Only ship real
> people, real tenure, real credentials. If only one real person is available, ship one — a single
> credible named local beats a fictional roster of four.

### A.2 First-hand observation conventions (the "Experience" signal on the page)

Experience has to be **shown**, in specifics only someone physically present would know. Codify it as a
reusable block convention so it's consistent and auditable, not ad-hoc prose.

Add one authored-body block type — `fieldNote` — rendered distinctly (a dated, signed observation):

```
{ type: 'fieldNote', author: 'author-id', observedOn: '2026-07-30',
  text: 'On a still winter morning the north-end flags were set unusually
         wide-left of the ramp; the rip off the south corner was running hard.' }
```

Rules for what earns a field note (the moat is in the specificity):
- **Sensory + temporal + spatial precision.** "The 7:15 swell was glassy off the north point"
  beats "Bondi is beautiful in the morning."
- **Change over time.** "The kiosk that was here last summer is now …" — only a repeat local can say this.
- **Signed and dated.** Attributed to a named author with an `observedOn` date; feeds a
  `PotentialAction`/review-free provenance line, never a fabricated `Review`/rating.
- **Never invent a visit.** Per the existing refresh-log rule ("no invented personal visits"): a field
  note is only added when a real observation exists. If none exists, use `localTip` (evergreen local
  knowledge) instead — that block already exists.

Complementary micro-conventions already partially present, to standardise:
- **"What's changed since last time"** section on every recommendation article (cafés, restaurants,
  bars, things-to-do) — the refresh-log shows this is already being written; make it a required section.
- **Named specificity over hedging.** "Swim at the north end when there's a southerly" not "swim where
  it's calm."

### A.3 Original photography

Stock and un-owned imagery is an experience-signal killer and a legal/attribution risk. The repo already
forbids remote images (`remotePatterns: []`) and references images by local key via `content/image-map.json`.

- **Own the camera roll.** First-party photos of the exact venues/spots we cover, shot on identifiable
  Bondi days (weather, crowd, light that a competitor's stock library can't match). Reference by media
  key, never hotlink.
- **EXIF / capture provenance, kept internally.** Record capture date + author in an internal
  `content/photo-manifest.json` (date, `authorId`, subject, geo if on-location). This backs the
  "photographed on the ground" claim without any public attribution machinery (which CLAUDE.md forbids).
- **Photo-as-evidence.** A dated original photo of a menu board, a flag placement, a closed shopfront is
  the strongest possible verification artifact — pair it with the field note that cites it.
- **`ImageObject` schema on flagship/original-data pages only** (creator = the `Person`/Org `@id`,
  `contentLocation` = Bondi `@id`), where a genuine original image supports the content. Don't schema-spam
  stock.

> Integrity gate (from CLAUDE.md): never place a photo where its subject doesn't genuinely match. Identify
> photos by viewing them, not guessing. A "local" photo of the wrong venue destroys the exact trust we're
> building.

### A.4 Locally-checked dates, and venue/event verification workflow

This is where the moat becomes a **repeatable operation**, not a vibe. We already have the data spine for
it: `lastReviewed` + `sources` on bodies, `dateStatus` + `dateVerifiedAt` + `dateSourceUrl` on events,
and `scripts/verify-events.mjs`.

**The "local verification" workflow (per fact-bearing record):**

1. **Classify the fact's volatility.** Durable (coordinates, "the beach faces east", walk distance) vs.
   volatile (hours, prices, whether a venue trades, event dates, flag/patrol seasons, timetables).
2. **Durable facts** → assert with a source. **Volatile facts** → assert only if verified this cycle,
   else point at the official source (Waverley Council, Transport for NSW, SLS Beachsafe, BoM, ABS, venue
   site) — exactly the existing rule.
3. **Verify against two independent signals** where possible for volatile facts (e.g. venue's own site +
   a second: Google Business hours, a recent first-hand field note, a phone check). Record which.
4. **Stamp provenance.** Set `lastReviewed` (body) / `dateVerifiedAt` (event) to today; add/refresh the
   `sources` entry; where a first-hand check happened, add a `fieldNote`.
5. **Flag human checks.** The refresh-log already has a "Human checks" column — keep using it for
   anything that needs a phone call / on-the-ground look before the next deploy.
6. **Downgrade, never fabricate.** If a date/hour can't be confirmed, the event's `dateStatus` drops to
   `estimated`/`tbc` and schema stops emitting a concrete date. This mechanism already exists — the moat
   is *using it visibly and on a cadence.*

**Surf / transport / accessibility / seasonal on-the-ground detail** — the categories where first-hand
local knowledge is most defensible and most searched:

- **Surf & swim.** Flag-placement patterns, which end is calm in which wind, rip-prone corners, when the
  ocean pools close for cleaning/big swell, water-temp reality vs. the BoM number (the site already has a
  live `waterTemp` quick-fact). Cite SLS Beachsafe; add dated field notes for conditions.
- **Transport.** Real bus behaviour (333 prepay-only crush on hot days), Bondi Junction interchange
  walking reality, rideshare pickup zones, where driving actually fails on a summer Saturday. Cite
  Transport for NSW for anything volatile (fares/times) — never assert a timetable.
- **Accessibility (a genuine, under-served content gap and a strong E-E-A-T + link magnet).**
  Beach wheelchair availability and booking, accessible parking bays, step-free routes on the coastal
  walk, accessible toilets/change rooms, the beach matting. This *requires* on-the-ground checking, which
  is precisely why it's defensible. Verify with Waverley Council + a physical look.
- **Seasonal.** Patrol season dates, market seasonal changes, event calendar, jellyfish/bluebottle
  seasons, when the crowds actually arrive. Tie to the freshness calendar (§B).

### A.5 How the signals map to E-E-A-T — and to AI answer engines

| Signal shipped on-page | Experience | Expertise | Authoritativeness | Trust | Also helps AI engines because… |
|---|---|---|---|---|---|
| Named author + `Person` schema + author page | ✓ | ✓ | ✓ | ✓ | entity resolution; a real Person `@id` bound to the Bondi Place `@id` is citable and quotable |
| Dated, signed field notes (first-hand) | ✓✓ | ✓ | | ✓ | specific, quotable primary observation LLMs prefer to generic prose |
| Original photography + internal capture manifest | ✓✓ | | | ✓ | multimodal grounding; can't be reverse-image-matched to stock |
| Visible "Last locally checked: [date]" (§B) | ✓ | | | ✓✓ | recency signal used by retrieval + shown in AI citations |
| `sources` list + two-signal verification | | ✓ | ✓ | ✓✓ | verifiable claims; matches how LLMs weight citable facts |
| Flagship original dataset (§C) | ✓ | ✓✓ | ✓✓ | ✓ | becomes *the* cited primary source — the strongest AI-citation play |
| Downgrade-don't-fabricate (`dateStatus`, omit) | | ✓ | | ✓✓ | precision/calibration; avoids the confident-wrong failure engines penalise |
| Accessibility / surf / transport ground detail | ✓✓ | ✓ | ✓ | ✓ | fills answer-gaps competitors leave; wins long-tail + voice queries |

**The AI-engine angle specifically:** answer engines (Google AI Overviews, Perplexity, ChatGPT
browsing) cite **specific, attributable, recent, primary** content. Every item above optimises for
exactly that. The flagship dataset (§C) is the keystone — an *originating* source others cite is the
one thing that reliably earns AI citations and the backlinks in §D simultaneously.

---

## B. The Freshness System

### B.1 Principle: freshness is trust, but a stale "updated" stamp is anti-trust

A visible date only builds trust if it's **true and recent for that page's volatility class.** A
"Last checked" badge on an evergreen history article that hasn't changed in a year reads as neglect; the
same badge on a café ranking reads as diligence. So: **show the date where volatility is high; suppress it
(or show published-only) where the content is genuinely evergreen.** We already have the field
(`lastReviewed`) and it already renders ("Last reviewed …") — this section decides *cadence* and
*visibility per archetype.*

### B.2 Page archetypes by update frequency

| Archetype | Examples (real paths/topics) | Volatility | Review cadence | Visible date? |
|---|---|---|---|---|
| **Live/near-live** | Water temp quick-fact, What's On "today"/"this weekend" | Real-time | Automated + weekly sanity check | Yes — relative ("today") |
| **Weekly** | `/whats-on` upcoming events, this-week markets | High | Weekly | Yes — "Checked this week" |
| **Monthly** | Café/coffee, restaurant, bar & nightlife rankings (`best-restaurants-*`, `bondis-best-cafs-*`, `best-wine-bars-in-bondi`); "best breakfast right now" | High (venues open/close, hours) | Monthly (peak season), 6-wk (winter) | **Yes — "Last locally checked"** |
| **Quarterly** | Things-to-do, kids/family, rainy-day, itineraries (`24-hours-in-bondi`, `bondi-with-kids`), tours, hidden-gems | Medium | Quarterly | Yes |
| **Twice-yearly (seasonal)** | Best-time-to-visit, weather/temperature guides, seasonal event calendars, swim/surf-season, Christmas-lights, Australia Day, NYE | Seasonal | Pre-summer (Oct) + pre-winter (Apr) | Yes — seasonal framing |
| **Yearly (event-anchored)** | City2Surf, Sydney Marathon, Bondi-to-Bronte swim, Sculpture by the Sea, Festival of the Winds — anything with an annual edition | Annual | Once, ~8 wks before the edition (+ post-event) | Yes — edition year in title + checked date |
| **Evergreen** | Beach history, Ben Buckler name, "are there sharks/snakes/pickpockets", coastal-walk distance, how-to-get-here fundamentals | Very low | Annual audit only | **No visible "checked" badge** — published date + light "reviewed" only if a real change |

Assign each authored body an explicit `freshnessClass` (add the field to the body JSON + `Page`) so the
maintenance calendar can be generated, not remembered. It also lets `scripts/` flag overdue pages.

### B.3 The visible "Last locally checked: [date]" convention

- **Copy:** use **"Last locally checked: 30 July 2026"** on the volatile classes (weekly→quarterly). The
  word *locally* is the moat — it claims on-the-ground, not desk, verification, and we only earn it when a
  field note or first-hand check backs the cycle. Where the review was desk-only (source re-checked, no
  on-ground look), use the existing **"Last reviewed"** wording instead. Two honest states, not one
  inflated one.
- **Placement:** keep the current footer position; additionally surface it **near the top** (under the
  byline) on monthly/weekly recommendation pages, where recency is the buying signal. Reuse the existing
  `<time dateTime>` markup.
- **Where NOT to show it:** evergreen archetype. A history page doesn't need a checked date; showing a
  months-old one *reduces* trust. Suppress the badge when `freshnessClass === 'evergreen'` and no change
  occurred.
- **Schema tie-in:** `lastReviewed` should drive `dateModified` in `articleJsonLd` **only when a real
  change shipped** — don't bump `dateModified` for a no-op review, that's date-spam and engines discount
  it. Keep `datePublished` stable.
- **Honesty guard:** a script asserts that any page showing "Last locally checked" within N days has a
  `fieldNote`/`sources` change in that window. No silent stamp-bumping.

### B.4 Maintenance calendar

Cadence anchored to Bondi's real season (summer Dec–Feb = peak; the pre-season ramp is Oct–Nov). "Owner
task" = the human on-the-ground/phone checks the workflow (§A.4) flags.

| When | Cadence | Pages reviewed | Primary actions | Fields touched |
|---|---|---|---|---|
| **Every Monday** | Weekly | What's On (upcoming), this-week markets/events | Roll past editions off; confirm this week's dates against organiser sources | `dateStatus`, `dateVerifiedAt`, `dateSourceUrl` |
| **1st of month** | Monthly | Café, coffee, restaurant, bar/nightlife, "right now" rankings | Confirm each venue still trades + hours source; add/drop; "what's changed"; field note if visited | `lastReviewed`, `sources`, `fieldNote`, dining data (`data/bondiVenues.ts`) |
| **1st of quarter** (Jan/Apr/Jul/Oct) | Quarterly | Things-to-do, kids/family, itineraries, tours, hidden-gems, accessibility | Re-walk key routes; verify facilities/prices via source; refresh photos | `lastReviewed`, `sources`, photo-manifest |
| **October** (pre-summer) | Twice-yearly | Best-time-to-visit, weather, swim/surf-season, summer-event calendar, NYE/Christmas-lights | Update patrol season, water-temp narrative, summer events; ready seasonal pages | `lastReviewed`, event data, seasonal copy |
| **April** (pre-winter) | Twice-yearly | Winter-swim, whale-watching, off-season, quiet-Bondi angles | Shift seasonal framing; verify winter hours/closures | `lastReviewed`, seasonal copy |
| **~8 wks pre-edition** | Yearly per event | City2Surf (Aug), Sydney Marathon (Aug/Sep), Bondi-to-Bronte (~Dec), Sculpture by the Sea (Oct–Nov), Festival of the Winds (Sep) | Update edition year, date, route, entry info against official source; refresh title year | `dateStatus`, `dateVerifiedAt`, title/override, `lastReviewed` |
| **Post-event** | Yearly per event | Same event pages | Change tense/status so a past edition never reads as upcoming; point to next edition | `dateStatus` → `tbc`/next, `lastReviewed` |
| **Annually** (Jan) | Yearly | Evergreen corpus audit | Spot-check facts still true (distances, transport fundamentals, entity/sameAs links); bump nothing that didn't change | `sources` only if changed |
| **Continuous** | Automated | Water-temp fact, `scripts/verify-events.mjs`, freshness-overdue script | CI flags passed editions, stale `dateVerifiedAt`, pages past their `freshnessClass` cadence | — (flags only) |

Operational hooks that already exist / to add:
- Extend `scripts/verify-events.mjs` thinking to a **`scripts/freshness-audit.mjs`** that lists every page
  whose `lastReviewed` is older than its `freshnessClass` allows, and every event needing attention —
  run in CI so overdue pages surface without memory.
- Keep the `content/refresh-log.md` table as the human ledger (it already tracks Reviewed date + Human
  checks); the audit script generates the "due this week" worklist that feeds it.

---

## C. Flagship Original-Research Initiative

### C.1 Candidates considered

| Candidate | Link/citation potential | Feasibility (local, honest data) | Strategic fit | Verdict |
|---|---|---|---|---|
| **Bondi Café/Coffee Price Index** | High (price stories travel; annual hook) | **High** — we visit cafés anyway; prices are first-hand observable, no permission needed | Perfect — coffee is a top topic (multiple ranked coffee/café pieces; cannibalisation cluster already consolidated) | **PICK** |
| Bondi Visitor Report (visitation/demographics) | Very high | Low — needs proprietary counts we can't honestly get; would risk fabrication | Good | Reject (data-honesty risk) |
| Coastal-walk data (times/gradient/steps/accessibility) | High (evergreen, map-linkable) | High — measurable on the ground with GPS | Strong | **Strong #2 — build next** |
| Beach-safety / flag-days / patrol-hours dataset | High (public-interest, press-friendly) | Medium — must sit on SLS/Council data + own logging; risk of overclaiming | Strong | Reject as *flagship* (partner-dependent); harvest as a §D asset |
| Parking-availability study | Medium–high (very shareable pain point) | Medium — needs disciplined repeated sampling to be honest | Strong (parking is a top-impression topic — Tamarama/Coogee/Clovelly parking = 448 impressions) | Strong #3 |
| Water-temperature year dataset | Medium | High (we already ingest live temp) | Good | Fold into weather hub, not flagship |

**Chosen flagship: the Bondi Beach Coffee Price Index (BCPI)** — an annual, methodologically transparent
survey of the price of a standard flat white (and a defined basket) across every Bondi café. It wins on
the rare combination the moat needs: **we can collect it honestly and first-hand** (no partner data, no
fabrication temptation — a price on a board is directly observable and photographable), it's inherently
**annual** (built-in freshness + "prices up X% YoY" press hook), it sits on our **strongest, highest-demand
topic**, and a price index is the archetypal *cited-reference* asset (journalists love an index; it's the
"Big Mac Index" pattern at neighbourhood scale).

### C.2 BCPI specification

**Research question.** What does a coffee actually cost in Bondi, how much does it vary by location
(beachfront vs. back streets vs. Bondi Junction fringe), and how is it changing year-on-year?

**Sample.** Every operating café in the Bondi Beach catchment we already track in `data/bondiVenues.ts`
(census, not sample — feasible because the set is bounded, ~dozens of venues). Record only venues
personally checked in the collection window; mark non-participating/closed explicitly. Target: the full
tracked café set, minimum ~40 venues for a credible index.

**The basket (defined, fixed, so YoY is comparable).**
- Regular flat white (the index headline number).
- Large flat white.
- Regular oat/alt-milk flat white (alt-milk surcharge is its own story).
- Batch/filter where offered.
- Optional: babyccino (family angle), and "cheapest vs. dearest coffee in Bondi" extremes.

**Data captured per venue (fields; all first-hand + photo-backed):**
`venueId, name, precinct (beachfront/Hall St/Campbell Pde/back-streets/Junction-fringe), pricesByItem,
altMilkSurcharge, observedOn (date), authorId, photoKey (board/menu), sourceNote`. Prices are observed
and photographed — never phoned-in or estimated. If a price can't be confirmed on the day, the venue is
omitted from that year's index, not guessed.

**Methodology, published on the page (this transparency IS the citability):** collection window (e.g. a
defined fortnight each March), that every price was observed in person and photographed, how the mean/median
were computed, precinct definitions, how alt-milk surcharge is treated, sample size, and explicit
limitations. State the collection date range. Cite nothing external for the prices — *we are the primary
source*, which is exactly the point.

**Outputs.**
- **Headline stats** (computed from real observations only): median & range of a regular flat white;
  beachfront vs. back-street premium; alt-milk surcharge prevalence and median; cheapest/dearest; YoY
  change once ≥2 editions exist.
- **SEO landing page** at a stable, undated evergreen URL, e.g. `/bondi-coffee-price-index` (a hub-class
  page, not a dated blog post, so it accrues links across editions — each year updates in place, prior
  editions archived at `/bondi-coffee-price-index/2027`). Title targets "how much does coffee cost in
  Bondi / Sydney coffee prices". First-person methodology + a "what we found" narrative in the site voice.
- **Data visualisation** (built with the `dataviz` conventions; theme-aware): distribution of prices,
  precinct comparison, YoY line once multi-year. Charts render from the real dataset.
- **Downloadable assets:** the raw dataset as CSV/JSON (openly licensed for reuse-with-attribution — this
  is what earns citations/links), plus a one-page methodology PDF. A CSV that journalists can re-chart is
  the single biggest link driver.
- **Structured data:** a `Dataset` JSON-LD node (name, description, `creator` = our Org/Person `@id`,
  `temporalCoverage`, `spatialCoverage` = Bondi `@id`, `distribution` → the CSV URL, `license`). This is
  the schema type answer-engines and Google Dataset Search index — a new schema helper to add to
  `lib/structured-data.ts`. Emit only because a real downloadable dataset genuinely backs it.

**Press angles.** "The most expensive flat white in Bondi is $X"; "Bondi coffee up X% in a year";
"the alt-milk tax: what oat milk really costs you at the beach"; "beachfront vs. back-street — the coffee
premium for a view." All defensible because every number is observed and photographed.

**Annual-update strategy.** Fixed collection fortnight each year (add to the §B calendar as a yearly
task). Same basket, same method → clean YoY. Each edition: refresh the evergreen landing page in place
(preserve the URL and its accrued links), archive last year's snapshot, publish the YoY delta as the news
hook, re-pitch the §D targets. Year 2 is where it compounds — a one-off is a stat; an index is an
institution.

**Editorial/integrity guardrails.** Census not sample where possible; omit-don't-guess on unconfirmed
prices; photo-backed every price; publish limitations; no venue-name/price ever fabricated (CLAUDE.md).
The dataset's credibility *is* the moat — one invented price would forfeit it.

> Build order: BCPI first (highest feasibility × fit). Then the **Coastal-Walk Dataset** (§D #2) as the
> second annual flagship — GPS-measured segment times/gradients/steps/accessibility for Bondi→Coogee,
> which is evergreen, map-embeddable, and the site's other signature topic.

---

## D. Link Acquisition / Digital PR — 20 Bondi-specific linkable assets

Ranked by **Score = Link potential × Feasibility × Strategic fit** (each 1–5; Score = product / 5 for a
0–25-ish scale). "Feasibility" is weighted for our honesty constraint — assets needing data we can't
collect truthfully score low. All are *linkable assets* (data, tools, maps, indexes, public-interest
guides), not guest posts.

| # | Asset | Type | Link | Feas | Fit | Score | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Bondi Coffee Price Index** (the §C flagship) | Data/index | 5 | 5 | 5 | **25** | Annual; CSV + Dataset schema; press-native |
| 2 | **Bondi→Coogee Coastal-Walk Dataset & Map** (segment times, gradient, steps, accessible sections, ocean pools, toilets) | Data + map | 5 | 4 | 5 | **20** | GPS-measured; evergreen; embeddable map = links |
| 3 | **Bondi Accessibility Guide** (beach wheelchairs, step-free routes, accessible parking/toilets/change) | Public-interest guide | 5 | 4 | 4 | **16** | Under-served; disability & council orgs link; genuine on-ground moat |
| 4 | **Interactive "Where to swim right now" / flags & rip explainer map** | Tool/map | 4 | 4 | 5 | **16** | Ties to live water-temp; SLS-aligned; safety = linkable |
| 5 | **Bondi Ocean-Pool Guide + status/closure tracker** (Icebergs, Bronte baths, etc.) | Data/tracker | 4 | 4 | 5 | **16** | Icebergs FAQ already 841 impressions — proven demand |
| 6 | **Bondi Parking Reality Map** (where/when parking actually fails, meter zones, free pockets, timed bays) | Data/map | 4 | 3 | 5 | 12 | Parking is a top-impression pain topic (448); needs honest sampling |
| 7 | **Bondi Water-Temperature Year** (12-month sea-temp dataset + chart) | Data | 3 | 5 | 4 | 12 | We already ingest live temp; low effort |
| 8 | **Bondi Event Calendar (structured, embeddable)** — the canonical "what's on at Bondi" feed | Data/embed | 4 | 4 | 4 | ~13 | Local orgs embed = links; we already model events with provenance |
| 9 | **Bondi Sunrise/Sunset & "golden-hour at the beach" calculator** | Tool | 3 | 4 | 4 | ~10 | Photographer-shareable; astronomical data is honest/derivable |
| 10 | **Bondi with Kids: facilities map** (playgrounds, shade, pram routes, change tables, calm swim) | Map/guide | 3 | 4 | 4 | ~10 | Parenting sites link; on-ground verifiable |
| 11 | **Bondi Markets vendor/what's-on guide (seasonal)** | Guide | 3 | 4 | 4 | ~10 | Vendor + market orgs link |
| 12 | **City2Surf @ Bondi finish guide + Heartbreak Hill data** | Guide/data | 4 | 3 | 4 | ~10 | City2Surf pages already pull 58–62 impressions; event-media links |
| 13 | **Sydney Marathon: Bondi runner's guide (carb-load/recovery/spectator map)** | Guide | 3 | 4 | 4 | ~10 | Existing cluster; running media/clubs |
| 14 | **Bondi coastal-walk accessibility & step count** (subset of #2, standalone) | Data | 4 | 4 | 3 | ~10 | Cite-able single stat ("X steps Bondi→Bronte") |
| 15 | **Bondi bluebottle / marine-stinger season tracker** | Public-interest data | 4 | 3 | 4 | ~10 | Seasonal press hook; must sit on real sightings/SLS data |
| 16 | **Bondi film & TV locations map** (Bondi Rescue, films shot here) | Map/guide | 3 | 4 | 3 | ~8 | Bondi Rescue is #1 topic (1,095 impressions); entertainment links |
| 17 | **"Cheapest eats in Bondi under $X" index** (companion to BCPI) | Data/index | 3 | 4 | 4 | ~10 | Cost-of-living angle; observable prices |
| 18 | **Bondi dog-friendly guide + off-leash/times map** | Guide/map | 3 | 4 | 3 | ~8 | Pet media + council rules link |
| 19 | **Bondi surf-break & beginner-lesson guide (conditions by wind/swell)** | Guide/data | 3 | 3 | 4 | ~8 | Surf media; first-hand conditions moat |
| 20 | **Bondi history & heritage interactive timeline** (Ben Buckler, pavilion, baths) | Interactive | 3 | 3 | 3 | ~7 | Evergreen; heritage/education links; cite primary archives |

### D.1 Top-5 target sites / journalist beats

_Digital-PR targeting below is directional (based on the Sydney media landscape); **live-verify current
outlets, editors and pitch guidelines before pitching — a WebSearch for current bylines/beats was not run
in this session, so treat named beats as categories to confirm, not contacts to fabricate.**_

1. **Bondi Coffee Price Index (#1).**
   Beats: food & lifestyle / cost-of-living desks. Targets to verify: *Broadsheet Sydney*, *Time Out
   Sydney*, *Concrete Playground*, *Good Food (SMH)* food desk, *news.com.au* lifestyle, *The Latch*,
   local *Wentworth Courier* (Eastern Suburbs). Hook: "what a Bondi coffee really costs / up X% YoY."
   Give them the CSV + a chart so re-publishing is one step.
2. **Coastal-Walk Dataset & Map (#2).**
   Beats: travel + outdoors/health. Targets: *Sydney.com*/Destination NSW (as a data source to cite),
   *Time Out*, *Concrete Playground*, *ABC Sydney* (lifestyle/health), running/walking blogs, *AllTrails*
   community. Hook: the definitive measured Bondi→Coogee ("exact distance, time, step count").
3. **Bondi Accessibility Guide (#3).**
   Beats: disability, community, council/civic. Targets: accessibility orgs & advocacy blogs, *ABC
   Sydney*, Waverley Council communications (natural inbound link/partner), inclusive-travel publishers.
   Hook: first comprehensive on-ground accessible-Bondi guide — high link intent, low competition.
4. **Ocean-Pool Guide + closure tracker (#5).**
   Beats: travel, swimming/wellness. Targets: *Guardian Australia* (loves an ocean-pool story), *Time
   Out*, *Broadsheet*, ocean-swimming communities, *Sydney.com*. Hook: Sydney's obsession with ocean
   baths + a live status utility people bookmark and cite.
5. **"Where to swim right now" flags/rip safety map (#4).**
   Beats: news, safety, summer service journalism. Targets: *ABC Sydney*, *9News*/*7News* Sydney summer
   coverage, *SMH*, Surf Life Saving comms (partner/citation). Hook: public-interest safety tool — the
   kind of asset news outlets link every heatwave/summer season.

**Cross-cutting PR mechanics:** (a) every flagship ships a reusable CSV/embeddable map/chart so a
journalist can republish in one step — this is the actual link mechanism; (b) pitch on the annual delta,
not the static asset ("prices up X%" > "here's an index"); (c) lead with the honesty/method (census,
photographed, published limitations) — credibility is what makes an outlet willing to cite; (d) local
first (*Wentworth Courier*, Waverley Council, Eastern Suburbs community) to seed, then metro, then
national; (e) the `Dataset` schema + open license does passive link-earning as people find and cite the
data directly.

---

### Implementation backlog (what this doc turns into, in repo terms)

1. `data/authors.ts` + `/team/<id>` author pages + `personJsonLd` in `lib/structured-data.ts`; switch
   `articleJsonLd` author to a `Person` `@id` reference (§A.1).
2. New body blocks `fieldNote` (signed/dated) — extend the `Block` union in `lib/content.ts`, render in
   `components/BodyBlocks.tsx` (§A.2).
3. `freshnessClass` field on bodies + `Page`; `scripts/freshness-audit.mjs`; "Last locally checked" vs.
   "Last reviewed" copy logic; suppress badge for evergreen (§B).
4. BCPI: `data/coffeeIndex.ts` (dataset), `/bondi-coffee-price-index` landing page, `datasetJsonLd`
   helper, CSV/JSON export, dataviz charts (§C).
5. Internal `content/photo-manifest.json` capture ledger; original-photo program (§A.3).
6. Ship order by ROI: **1 → 3 → 4 → 2 → 5** (named authors + Person schema first — biggest E-E-A-T gap,
   lowest effort; then freshness system; then the flagship).
