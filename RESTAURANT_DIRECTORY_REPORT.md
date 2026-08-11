# Bondi Restaurant Directory — Build & Completeness Report

_Last updated: 2026-08-10 · Directory: `/bondi-eat-and-drink`_

## What shipped

A complete, searchable, filterable Bondi eating-and-drinking directory built on a
structured, source-verified dataset — replacing the previous thin 16-venue engine.

- **167 active, currently-trading venues** (from 16), every one source-verified with a
  current status and a `lastVerifiedAt` date.
- **167 venue pages** with first-person editorial judgement (why we'd go, what to order,
  atmosphere, a local tip, an honest trade-off) — never fake eyewitness claims.
- **Searchable/filterable hub** at `/bondi-eat-and-drink`: free-text search + filters for
  type, area, meal, price, dietary and features. Client-side only, so **no low-value facet
  URLs are created** (a deliberate SEO decision).
- **11 curated best-of collections** (restaurants, cafés, bars, brunch, cheap eats,
  beachfront, family, date-night, pubs, bakeries/sweets, vegan), ranked by a composite score.
- **Structured data**: `Restaurant`/`Cafe`/`BarOrPub`/`Bakery`/`FoodEstablishment` per venue
  (durable facts only — no fabricated ratings or hours), `ItemList` on hub + collections,
  bound to the canonical Bondi Beach place entity via `containedInPlace`.
- **Freshness process**: `npm run restaurants:verify` audits staleness, missing sources, thin
  editorial, low confidence, duplicates and enum drift; hard-errors gate a deploy.

## Coverage

**By type** — restaurant 67 · café 41 · takeaway 25 · bar 10 · bakery 9 · dessert 6 ·
club/hotel 5 · pub 4

**By precinct** — Bondi Beach 66 · Campbell Parade 38 · North Bondi 31 · Bondi Road 30 ·
Bondi Junction 2

**By price** — $ 13 · $$ 108 · $$$ 44 · $$$$ 2

**Top cuisines** — Café/coffee, Modern Australian (28), Italian (25), Seafood (24),
Mediterranean (21), Japanese (13), Burgers (13), Brunch (13), Pizza (12), Thai (8),
Middle Eastern (7), Spanish (6).

## Verification & confidence

- Editorial confidence: **high 133 · medium 30 · low 4**. The four low-confidence records
  (Arabica, Medani Bakery, Bondi@2026, Gould St Gourmet) are real venues where sourcing was
  thinner; they're listed but flagged in the audit for re-checking.
- Every venue carries its source URLs and a verification date, surfaced on the page under
  "How we verified this".

## What we deliberately excluded (43)

Verification proved essential — roughly a fifth of raw discovery was closed or out of scope:

- **34 permanently closed** — e.g. Pasticceria Papa (Apr 2024), Beach Burrito Co (liquidated
  2023), Curly Lewis Brewing, The Anchor, Mikey's Pizza, Bondi Road Seafoods (retired after
  43 years), Eden, Trio.
- **7 not-found** — no verifiable current trading venue (e.g. Beachouse, now a gym).
- **2 moved out of the Bondi area** — Hannibal (→ Glebe) and Bondi Liquor Co (→ Darlinghurst);
  kept out so the directory stays genuinely local.

### False-closure correction
The verification pass initially mis-flagged **Easy Tiger** as closed. A hardened
"bias-toward-open, closure needs explicit evidence" re-check corrected it to open and caught
two mislabeled discovery rows that actually resolve to **El Indio**. Bronte Road Fish's new
North Bondi branch is included.

## De-duplication

Three passes: by slug id, by normalised display name (collapses renamed/moved venues and
their new-name twins, e.g. Red Coco Thai → Grab Thai Bondi), and by website domain (collapses
same-venue double-listings like Society Pizza and Anita Gelato). Genuine multi-venue groups
(Merivale, Shuk's three distinct addresses, the Promenade outlets, Harry's/Lulu) are
allowlisted and kept separate.

## Known gaps / omission confidence

- **Coverage is high but not provably exhaustive.** Discovery reconciled 415 raw → ~249 unique
  candidates across 13 search lanes (by precinct, cuisine and publication); 167 survived
  verification as current in-area venues. Very small operators (juice windows inside gyms,
  transient pop-ups, market stalls) are the most likely omissions.
- **Bondi Junction is intentionally light** (2) — only venues genuinely relevant to a Bondi
  Beach visitor, not the shopping-centre food court.
- **Volatile facts (hours, prices, phone) are deliberately not stored** — they live on each
  venue's own site, which the page links to. `priceBand` is an editorial estimate.

## Maintenance

- Run `npm run restaurants:verify` before any deploy touching the data.
- Re-verification cadence: 180-day freshness window; the audit flags anything older.
- New venues: add to the discovery/enrichment pipeline, `node scripts/merge-venues.mjs`,
  then verify.
