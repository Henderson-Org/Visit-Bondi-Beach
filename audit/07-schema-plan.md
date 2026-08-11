# 07 — Structured-data audit & implementation plan

**Scope:** visitbondibeach.com (Next.js 16 / App Router). Schema is emitted as real
server-rendered JSON-LD via `<script type="application/ld+json">` blocks injected by each
route/component. **Authoritative source: `lib/structured-data.ts`** (read in full for this
audit) plus the render paths that call it. The `jsonLdTypes` column in
`audit/page-inventory.csv` / `content/pages.json` is a stale crawl snapshot and is **not**
used here.

Origin used in all `@id`/`url` values: `https://www.visitbondibeach.com` (`siteOrigin()` in
`lib/site.ts`, forced to the canonical host in production). Two global anchor entities:
- **Organization** `@id` = `https://www.visitbondibeach.com/#org`
- **Bondi Beach place** `@id` = `https://www.visitbondibeach.com/#bondi-beach`
  (`BONDI_PLACE_ID`, `bondiPlaceJsonLd()`), `@type: ["TouristAttraction","Beach"]`.

---

## 1. Current-state coverage (from the real code)

### 1a. Emitted globally (every page)
`app/layout.tsx` `<head>` emits on **all** routes:
- **Organization** (`organizationJsonLd`) — `@id #org`, name, url, description, `sameAs:[instagram]`,
  `knowsAbout`, `areaServed`. Well-formed. No `logo` (a recommended Organization prop).
- **WebSite** (`websiteJsonLd`) — name, url, description. **No `potentialAction`
  (SearchAction)** and **no `@id`**, so nothing else can reference it.

### 1b. Page-type × schema matrix

| Page type | Route / component | Schema emitted (real) | Notes / well-formedness |
|---|---|---|---|
| **Home** | `app/page.tsx` | Org + WebSite (global) · **bondiPlace** | No ItemList for the 9 featured guides; no WebSite SearchAction. |
| **Topic hub** (things-to-do, swim via HubView, coastal-walk, getting-to-bondi, weather) | `components/HubView.tsx` | **BreadcrumbList** · **bondiPlace** · **ItemList** (inline) | ItemList is minimal: `ListItem{position,url,name}` only — **no `item` object, no descriptions, no per-item `@type`**. Coastal-walk & getting-to-bondi carry a rich `route`/`practical` payload that is **not** expressed as schema (see §4). |
| **Core-page hub** (e.g. Swim landing) | `CorePageHubView` in `app/[...slug]/page.tsx` | **BreadcrumbList** · **bondiPlace** · **FAQPage** (if `faq` block) | No ItemList for its "explore" cards. |
| **Location / destination** (bondi-beach, north-bondi, icebergs, tamarama, bronte…) | `components/location/LocationPage.tsx` + `data/locations.ts` | **BreadcrumbList** · **locationPlace** (`Place`/`Beach`/`TouristAttraction`/`Park`, `geo` when verified, `containedInPlace @id #bondi-beach`, `sameAs`, image) · **FAQPage** (if faqs) | Strongest page type. Correct entity nesting; geo only when publicly documented. |
| **Blog article (spoke)** | `ArticlePage` in `app/[...slug]/page.tsx` | **BlogPosting** (`articleJsonLd`) · **FAQPage** (if `faq` block) · **BreadcrumbList** | BlogPosting is rich: author, publisher `@id #org`, `about @id #bondi-beach`, image (abs), wordCount, datePublished/Modified, `isPartOf` Blog. **author is Organization-typed & has no `@id`** (§3.1). **No ItemList on ranked/"best X" articles** (§3.2). |
| **Migrated non-article default page** | `ArticlePage` (isArticle=false) | **BreadcrumbList** only | No page-level entity; acceptable for thin migration stubs. |
| **/articles index** | `app/articles/page.tsx` | **BreadcrumbList** only | **Missing CollectionPage/ItemList** for the article grid (§3.5). |
| **/stay hub** | `app/stay/page.tsx` | **BreadcrumbList** · **FAQPage** · **ItemList** (LodgingBusiness) | ItemList items have name+description but **no `url`**. |
| **/stay category** (best-hotels, family, luxury, budget, apartments, hostels, near-beach, vs-junction) | `components/stay/StayCategoryView.tsx` | **BreadcrumbList** · **FAQPage** · **ItemList** (LodgingBusiness) | Same — no per-item `url`. |
| **/stay/[slug] property** | `app/stay/[slug]/page.tsx` | **BreadcrumbList** · **LodgingBusiness** · **Article** (review-flavoured, inline `articleReviewJsonLd`) · **FAQPage** | LodgingBusiness deliberately omits rating/review (no compliant data). The inline Article has `author`/`publisher` but **no `about @id`, no image, no datePublished, no `@id`**. Visible editorial VBB score is **not** mirrored as `Rating` (intentional). |
| **/bondi-eat-and-drink hub** | `app/bondi-eat-and-drink/page.tsx` | **BreadcrumbList** · **FAQPage** · **ItemList** (Restaurant, top 30, with url+description) | Best ItemList on the site. |
| **/bondi-eat-and-drink/[slug] "best-of" collection** | `app/bondi-eat-and-drink/[slug]/page.tsx` | **BreadcrumbList** · **ItemList** (Restaurant) | **No FAQPage**; ranked list is not typed as an ordered `ItemList` (`itemListOrder`). |
| **/bondi-eat-and-drink/venues/[id]** | `app/bondi-eat-and-drink/venues/[id]/page.tsx` | **BreadcrumbList** · **Restaurant/FoodEstablishment** (`restaurantJsonLd`) | Rich: correct sub-type (`CafeOrCoffeeShop`/`BarOrPub`/`Bakery`…), priceRange, address, `areaServed`, `containedInPlace @id #bondi-beach`, servesCuisine, description, hasMenu, acceptsReservations, sameAs. **No geo/telephone/openingHours** (absent in data — correctly omitted). **No FAQPage.** ⚠ **`image` is a single shared HERO for every venue** (§3.3 integrity flag). |
| **/whats-on hub** | `app/whats-on/page.tsx` | **BreadcrumbList** · **FAQPage** · **ItemList** (Event) | Good. |
| **/whats-on/[slug] event** | `app/whats-on/[slug]/page.tsx` | **BreadcrumbList** · **Event** (only when a concrete `startDate` resolves) | Rich, integrity-safe: eventStatus, offline attendance, location Place+address, endDate logic, organizer, Offer only for free events, image fallback. **No FAQPage; no `about @id` binding.** |
| **/whats-on/{today,this-weekend,free,markets}** | `components/events/WhatsOnLandingView.tsx` | **BreadcrumbList** · **ItemList** (Event) | No FAQPage. |
| **/plan** | `app/plan/page.tsx` | **none** | Interactive tool; no BreadcrumbList even. Marginal. |

### 1c. Helpers that exist and are wired
`organizationJsonLd`, `websiteJsonLd`, `bondiPlaceJsonLd`, `articleJsonLd`, `faqJsonLd`,
`itemListJsonLd`, `eventJsonLd`, `restaurantJsonLd`, `lodgingBusinessJsonLd`,
`locationPlaceJsonLd`, `breadcrumbJsonLd`. **Not present:** any `Person`, `HowTo`,
`VideoObject`, `ImageObject`, `CollectionPage`, `Review`/`AggregateRating`,
`OpeningHoursSpecification`, `SearchAction` helper.

---

## 2. What is genuinely good (leave alone)
- Single canonical **Bondi place entity** with real geo, containment hierarchy and
  Wikipedia/Wikidata `sameAs`, referenced by `@id` from articles (`about`), venues and
  sub-locations (`containedInPlace`). This is the site's strongest AEO asset.
- Disciplined integrity: no fabricated ratings/prices/hours/reviews anywhere; Event only
  with a real date; free-only Offers; geo only when publicly documented.
- Correct schema.org sub-typing for venues (cafe → `CafeOrCoffeeShop`, etc.).
- FAQPage only emitted when the same Q&A is visibly rendered.

---

## 3. Gap & priority analysis

| # | Gap | Page types | Impact (rich result / AEO) | Priority | Backed by visible content? |
|---|---|---|---|---|---|
| 3.1 | **Author entity is weak** — `author` is Organization-typed, inline, **no `@id`**, no `sameAs`/`knowsAbout`; author page `/visit-bondi-beach` emits no entity | all articles + stay reviews | E-E-A-T + AI citation of a nameable author | **HIGH** | Yes — visible byline + author bio box + `/visit-bondi-beach` page |
| 3.2 | **No ItemList on ranked "best X" articles** | BlogPosting spokes that are lists (best cafés, top restaurants, ice-cream, things-to-do lists) | Rich list results + AI "top N" extraction | **HIGH** | Only where a visible ranked/numbered list exists (`list`/`itinerary` blocks) |
| 3.3 | **Shared generic `image` on every venue's Restaurant schema** (`image: HERO`) | venue pages | Integrity risk (asserts a photo of that venue) + weak signal | **HIGH (fix = remove)** | No — violates the "no unrelated image implying a venue" rule |
| 3.4 | **Coastal walk has no TouristAttraction / HowTo** despite a defined 6-stop route, distance, time, cost | `/bondi-coastal-walk` hub | HowTo rich result + strong AEO for a flagship query | **HIGH** | Yes — visible route module, practical facts, section content |
| 3.5 | **/articles index has no ItemList/CollectionPage** | `/articles` | Collection rich result + AI crawl of the corpus | **MEDIUM** | Yes — visible article grid |
| 3.6 | **FAQPage missing** on venue pages, dining collections, event detail, what's-on landings | those pages | FAQ rich result + AEO | **MEDIUM** | Only after a visible Q&A block is added (venues/collections currently have none) |
| 3.7 | **Hub ItemList is degenerate** (`ListItem` with no `item`, no descriptions, no `@type`) | HubView hubs | Weak/loose list markup | **MEDIUM** | Yes — refactor to use `itemListJsonLd` |
| 3.8 | **Stay ItemList items lack `url`**; property Article lacks `about @id`, image, dates, `@id` | /stay, /stay/*, /stay/[slug] | Entity linking + review completeness | **MEDIUM** | Yes |
| 3.9 | **WebSite has no SearchAction / `@id`**; Organization has no `logo` | global | Sitelinks searchbox (only if real search exists), knowledge panel | **LOW** | SearchAction only if a real `/search?q=` exists (none found) — otherwise skip |
| 3.10 | **Restaurant/LodgingBusiness geo/telephone/openingHours** | venue + property pages | Local-pack signals | **LOW (data-blocked)** | Only after the data model carries verified phone/coords/hours (absent today) |
| 3.11 | **VideoObject for surf cam** | home | — | **DO NOT (spam)** | No — it's a third-party live iframe with no hosted `contentUrl`/`uploadDate`/thumbnail |
| 3.12 | Event not bound to Bondi place; `/plan` no breadcrumb | events, /plan | minor | **LOW** | Yes |

### Priority ordering (what moves the needle)
1. **3.1 Author entity** — cheapest, highest E-E-A-T/AEO lift; one helper + reference by `@id`.
2. **3.3 Remove the shared venue image** — integrity fix, do immediately.
3. **3.4 Coastal-walk TouristAttraction + HowTo** — flagship page, unique rich result.
4. **3.2 ItemList on ranked articles** — big AI "top N" surface; gate on visible ranked lists.
5. **3.7 / 3.5 ItemList completeness** on hubs and /articles.
6. **3.6 FAQPage expansion** — only after visible Q&A is added to venue/collection pages.
7. Long tail: 3.8, 3.9, 3.10, 3.12.

---

## 4. Copy-paste JSON-LD templates

All values follow this repo's conventions: absolute URLs on `https://www.visitbondibeach.com`,
`@id` anchors reused (`/#org`, `/#bondi-beach`), no fabricated ratings/hours/prices, and only
props the visible page supports. These are the objects `lib/structured-data.ts` should
produce (illustrative concrete values shown).

### 4.1 Venue / Restaurant page (corrected — no generic image)
Matches `restaurantJsonLd`; **drop `image`** unless a rights-cleared, venue-specific photo
exists. Add `telephone`/`geo`/`openingHoursSpecification` **only if/when** the venue record
carries verified values.

```json
{
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "name": "Gertrude & Alice",
  "url": "https://www.visitbondibeach.com/bondi-eat-and-drink/venues/gertrude-and-alice",
  "priceRange": "$$",
  "servesCuisine": ["Café", "Breakfast"],
  "description": "A much-loved secondhand bookshop-café a block back from the beach — all-day coffee among the stacks.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "46 Hall St",
    "addressLocality": "Bondi Beach",
    "addressRegion": "NSW",
    "addressCountry": "AU"
  },
  "areaServed": "Bondi Beach, Sydney",
  "containedInPlace": { "@id": "https://www.visitbondibeach.com/#bondi-beach" },
  "hasMenu": "https://example-venue.com/menu",
  "acceptsReservations": "https://example-venue.com/book",
  "sameAs": [
    "https://example-venue.com",
    "https://instagram.com/example_venue"
  ]
}
```
Optional, data-permitting additions (all currently absent from `data/restaurants.ts`):
```json
{
  "telephone": "+61 2 9130 0000",
  "geo": { "@type": "GeoCoordinates", "latitude": -33.8905, "longitude": 151.2760 },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "07:00", "closes": "17:00" }
  ]
}
```

### 4.2 Author — Person (E-E-A-T)
**Integrity gate:** emit `Person` **only** if a real, named individual actually authors the
content. Today `AUTHOR` is a five-person editorial team, so a single fabricated `Person`
would breach the integrity rules — the honest options are (a) name a real author and use the
Person below, or (b) use the richer **Organization author entity** in 4.2b. Either way give
it an `@id` at the existing author URL and reference it from every article's `author`.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.visitbondibeach.com/visit-bondi-beach#author",
  "name": "Jane Doe",
  "url": "https://www.visitbondibeach.com/visit-bondi-beach",
  "jobTitle": "Editor, Visit Bondi Beach",
  "description": "A Bondi local of 15 years writing the guides she wishes visitors had.",
  "knowsAbout": ["Bondi Beach", "Eastern Suburbs Sydney", "ocean swimming", "Sydney travel"],
  "worksFor": { "@id": "https://www.visitbondibeach.com/#org" },
  "sameAs": ["https://instagram.com/visitbondibeach"]
}
```

**4.2b Organization author entity (honest default for the "team of five" voice):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.visitbondibeach.com/visit-bondi-beach#editorial-team",
  "name": "Visit Bondi Beach Editorial Team",
  "url": "https://www.visitbondibeach.com/visit-bondi-beach",
  "description": "A team of five Bondi locals with more than 60 years of living at Bondi Beach between us — writing the guides we wish visitors had.",
  "knowsAbout": ["Bondi Beach", "Sydney", "Eastern Suburbs Sydney", "ocean swimming", "coastal walks"],
  "parentOrganization": { "@id": "https://www.visitbondibeach.com/#org" },
  "sameAs": ["https://instagram.com/visitbondibeach"]
}
```
Then in `articleJsonLd`, replace the inline author with a reference:
`"author": { "@id": ".../visit-bondi-beach#editorial-team" }` (or `#author`), and emit the
full entity once on `/visit-bondi-beach`.

### 4.3 "Best X" list article — BlogPosting + ItemList
Emit the ItemList **only** when the article visibly renders the ranked list (a `list`/
`itinerary` block or numbered `h2`/`h3` items). Use `itemListOrder` for a genuine ranking.

```json
[
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "The 10 Best Cafés in Bondi Beach, Ranked by a Local",
    "url": "https://www.visitbondibeach.com/bondi-blog/best-bondi-cafes",
    "mainEntityOfPage": "https://www.visitbondibeach.com/bondi-blog/best-bondi-cafes",
    "isPartOf": { "@type": "Blog", "name": "Visit Bondi Beach — Articles", "url": "https://www.visitbondibeach.com/articles" },
    "author": { "@id": "https://www.visitbondibeach.com/visit-bondi-beach#editorial-team" },
    "publisher": { "@id": "https://www.visitbondibeach.com/#org", "@type": "Organization", "name": "Visit Bondi Beach" },
    "about": { "@id": "https://www.visitbondibeach.com/#bondi-beach" },
    "datePublished": "2026-02-01",
    "dateModified": "2026-08-01",
    "image": "https://www.visitbondibeach.com/images/articles/best-bondi-cafes.webp"
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "The 10 Best Cafés in Bondi Beach",
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": 3,
    "itemListElement": [
      { "@type": "ListItem", "position": 1,
        "item": { "@type": "CafeOrCoffeeShop", "name": "Gertrude & Alice",
          "url": "https://www.visitbondibeach.com/bondi-eat-and-drink/venues/gertrude-and-alice" } },
      { "@type": "ListItem", "position": 2,
        "item": { "@type": "CafeOrCoffeeShop", "name": "Will's Kitchen",
          "url": "https://www.visitbondibeach.com/bondi-eat-and-drink/venues/wills-kitchen" } },
      { "@type": "ListItem", "position": 3,
        "item": { "@type": "CafeOrCoffeeShop", "name": "Bills Bondi",
          "url": "https://www.visitbondibeach.com/bondi-eat-and-drink/venues/bills-bondi" } }
    ]
  }
]
```
Note: reuse the existing `itemListJsonLd(name, items, itemType)` helper (it already builds
`ListItem → item{@type,name,url,description}`); add an optional `ordered` flag to set
`itemListOrder`.

### 4.4 FAQPage (as `faqJsonLd`)
Only emit when the identical Q&A is visibly on the page (the pattern already used on
location/hub/stay/eat pages). Template for extending to venue/collection pages once a
visible FAQ block is added:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you need to book Gertrude & Alice?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No — it's walk-in only, so arrive early on weekends when the queue for a table among the books builds fast."
      }
    },
    {
      "@type": "Question",
      "name": "Is Gertrude & Alice good for groups?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes for small groups mid-week; the communal tables suit four to six, but it doesn't take large-group bookings."
      }
    }
  ]
}
```

### 4.5 Coastal walk — TouristAttraction + HowTo
Data already exists in `lib/hubs.ts` (`route.stops`, `route.note`, `practical`). Emit both a
`TouristAttraction` (the walk as a place-based attraction, nested in the Bondi entity) and a
`HowTo` (the step sequence). Both are backed by the visible route module.

```json
[
  {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": "https://www.visitbondibeach.com/bondi-coastal-walk#attraction",
    "name": "Bondi to Coogee Coastal Walk",
    "description": "A roughly 6 km clifftop walk south from Bondi Beach past Tamarama, Bronte, Clovelly and Gordons Bay to Coogee — about 1.5–2 hours at an easy pace.",
    "url": "https://www.visitbondibeach.com/bondi-coastal-walk",
    "image": "https://www.visitbondibeach.com/images/articles/4f6ca1a5ae308e04.webp",
    "isAccessibleForFree": true,
    "touristType": ["Walkers", "Families", "Photographers"],
    "containedInPlace": { "@id": "https://www.visitbondibeach.com/#bondi-beach" },
    "sameAs": ["https://en.wikipedia.org/wiki/Bondi_to_Coogee_walk"]
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to walk the Bondi to Coogee coastal walk",
    "description": "Follow the clifftop path south from Bondi Beach to Coogee — about 6 km and 1.5–2 hours one way.",
    "totalTime": "PT2H",
    "estimatedCost": { "@type": "MonetaryAmount", "currency": "AUD", "value": "0" },
    "supply": [
      { "@type": "HowToSupply", "name": "Water" },
      { "@type": "HowToSupply", "name": "Sun protection" },
      { "@type": "HowToSupply", "name": "Swimmers for the ocean pools" }
    ],
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Start at Bondi (Icebergs)",
        "text": "Begin at the Icebergs end of Bondi Beach and pick up the path above the ocean pool.",
        "url": "https://www.visitbondibeach.com/bondi-beach" },
      { "@type": "HowToStep", "position": 2, "name": "Tamarama",
        "text": "Follow the clifftop to Tamarama (“Glamarama”), a small deep cove about 15 minutes on.",
        "url": "https://www.visitbondibeach.com/tamarama-beach" },
      { "@type": "HowToStep", "position": 3, "name": "Bronte",
        "text": "Continue to Bronte for the ocean baths and a grassy park — a good coffee stop.",
        "url": "https://www.visitbondibeach.com/bronte-beach" },
      { "@type": "HowToStep", "position": 4, "name": "Clovelly",
        "text": "Round the headland to Clovelly, a narrow, calm inlet that's ideal for snorkelling." },
      { "@type": "HowToStep", "position": 5, "name": "Gordons Bay",
        "text": "Pass Gordons Bay and its underwater dive trail on the way south." },
      { "@type": "HowToStep", "position": 6, "name": "Finish at Coogee",
        "text": "Arrive at Coogee Beach, roughly 6 km from the start." }
    ]
  }
]
```
Implementation: add `coastalWalkAttractionJsonLd()` + `howToJsonLd()` helpers keyed off the
`/bondi-coastal-walk` hub design so the schema stays in lock-step with the visible route.
Only emit HowTo for this page (genuinely step-based); do **not** template it across other hubs.

---

## 5. Implementation checklist (in priority order)
1. **`articleJsonLd` / new author helper** — add `authorJsonLd()` emitting 4.2b (or 4.2 if a
   named author is configured), give it an `@id`, reference it by `@id` from `articleJsonLd`
   and `articleReviewJsonLd`, and render the full entity on `/visit-bondi-beach`. (3.1)
2. **`restaurantJsonLd`** — remove the `image: HERO` pass-through at the venue-page call site;
   only send `image` when a venue-specific photo exists. (3.3)
3. **Coastal walk** — add TouristAttraction + HowTo helpers, wire into the `/bondi-coastal-walk`
   HubView branch. (3.4)
4. **Ranked articles** — when a body has a visible ranked `list`/`itinerary`, emit an ordered
   `itemListJsonLd` alongside the BlogPosting. (3.2)
5. **HubView + /articles** — replace the degenerate inline ItemList with `itemListJsonLd`
   (full `item` objects); add an ItemList to `/articles`. (3.5, 3.7)
6. **Stay** — add `url` to ItemList items with guide pages; add `about @id`, `image`,
   `datePublished`, `@id` to the property review Article. (3.8)
7. **FAQPage expansion** — only after adding a visible FAQ block to venue/collection pages. (3.6)
8. Long tail: Organization `logo`; WebSite `@id` (+ SearchAction only if real search ships);
   Event `about`/location `containedInPlace @id`; `/plan` breadcrumb. (3.9, 3.12)

**Do not add:** VideoObject for the third-party surf-cam iframe; any AggregateRating/Review
or opening-hours/price schema not backed by stored, verified data.
