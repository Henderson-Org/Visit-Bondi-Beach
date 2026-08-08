# Bondi Day Planner

A personalised Bondi itinerary builder at **`/plan`**. It answers "given what I like, how
much time I have and when I'm visiting, what's the best possible Bondi day?" — and it treats
**food as a first-class anchor**: if the visitor cares about food, it picks the best specific
venue first and builds the day around reaching it.

## Architecture

| File | Role |
| --- | --- |
| `types/preferences.ts` | Questionnaire model + `foodIsPriority()` |
| `data/bondiVenues.ts` | Venues (cafés/restaurants/bars) + opening hours + editorial scores |
| `data/bondiExperiences.ts` | Core Bondi experiences (beach, pool, walk, markets…) |
| `lib/bondiZones.ts` | Micro-zones + walking distances + backtracking penalty |
| `config/scoringWeights.ts` | **All tunable weights** |
| `lib/scoreVenue.ts` | Deterministic venue scoring |
| `lib/scoreExperience.ts` | Deterministic experience scoring |
| `lib/selectMealAnchor.ts` | **Picks the meal anchor(s)** — the pivotal step |
| `lib/bundles.ts` | Natural Bondi combinations (soft bonuses) |
| `lib/generateBondiItinerary.ts` | Anchor-first generation + swap functions |
| `components/PreferenceCards.tsx` | The questionnaire |
| `components/ItineraryTimeline.tsx` / `VenueCard.tsx` / `ExperienceCard.tsx` | Results UI |
| `components/PlannerApp.tsx` | Client orchestrator |
| `app/plan/page.tsx` | Route + compact hero |

## 1. How experience scoring works
`scoreExperience` = base + preference matches (capped) + **must-do boost** (essentials like
the Icebergs pool score high when they match) + time-of-day match + proximity to planned
zones − penalties (market closed that day, walking beyond tolerance, repetition). Weights
live in `EXPERIENCE_WEIGHTS` / `EXPERIENCE_PENALTIES`.

## 2. How restaurant scoring works
`scoreVenue` uses `FOOD_WEIGHTS` when the visitor cares about food (quality/cuisine/
local-favourite dominate) and `NONFOOD_VENUE_WEIGHTS` otherwise (geography matters more).
Components: quality, cuisine match (vs chosen food styles), iconic, local favourite,
geographic fit, budget match, meal-time fit, view bonus − penalties (closed → excluded,
over budget, excessive travel). A closed venue is effectively excluded (`venueOpenAt`).

## 3. Restaurant-as-anchor generation
`generateItinerary`:
1. `selectMealAnchor` picks the best venue(s) for the meal slots that fit the visit window
   and **reserves their time blocks** (proximity ignored so a better restaurant isn't
   dropped to save a walk).
2. Experiences are scored and used to **fill the gaps** around the anchors, chosen for score
   minus a **detour cost** (keeps the day flowing one way along the coast) plus bundle
   bonuses.
3. Items are ordered by time and walking legs computed from zones.
For a 2-hour food-focused visit it deliberately builds around a single great meal.

## 4. Tuning Sean's / Icebergs / Raw Bar weighting
Two levers:
- **Per-venue** (`data/bondiVenues.ts`): `qualityScore`, `localFavouriteScore`,
  `iconicScore`, `viewScore`, `categories` (food styles it satisfies), `priceLevel`. Raise
  these to make a venue anchor harder.
- **Global** (`config/scoringWeights.ts`): `FOOD_WEIGHTS.restaurantQuality`,
  `iconicVenue`, `localFavourite`, etc. Raising `restaurantQuality` makes standout
  restaurants dominate across the board.
E.g. Icebergs wins fine-dining + views + iconic days because it has `iconicScore 10`,
`viewScore 10` and the `fine-dining`/`seafood` categories; Sean's wins modern-Australian
long-lunch days via `qualityScore 9.5` + `localFavouriteScore 9.5`.

## 5. Adding a new café or restaurant
Append an object to `BONDI_VENUES` in `data/bondiVenues.ts` with a unique `id`, a `zone`,
`idealMeal`, `priceLevel`, the four scores, `categories`/`suitableFor`, and
`openingDays`/`openingHours` (set `hoursVerified: true` once confirmed). It's picked up by
scoring, anchoring and swapping automatically.

## 6. Adding a new Bondi experience
Append to `BONDI_EXPERIENCES` in `data/bondiExperiences.ts` with a `zone`, `categories`,
`durationMins`, `mustDoScore`, `idealTimeOfDay`, `walkingLevel`. Add `operatingWeekdays`
for anything day-specific (like markets) so it's never suggested on the wrong day.

## 7. How geographic sequencing works
`lib/bondiZones.ts` places each zone on a coastal position line (Bronte → North Bondi).
Walking time between zones ≈ position difference. Generation applies a **detour cost** when
inserting an experience between two neighbours, and `backtrackingPenalty` measures direction
reversals — so the day reads as a coherent north/south flow rather than zig-zagging.

## 8. Running locally
It's part of the main site. `npm run dev`, then open `/plan`.
- **Debug mode:** `/plan?debug=true` shows each stop's score, breakdown and alternatives.
- **Tests:** `npm run test` (see `lib/generateBondiItinerary.test.ts`).

## Redundancy & preference fulfilment (v2)
The planner tracks which interests are already satisfied and favours stops that cover **new**
interests (`marginalPreferenceValue`). It won't stack three same-"family" experiences (beach
+ swim + pool) back to back:
- **Families** live in `data/bondiExperiences.ts` (`ACTIVITY_FAMILY`): swim-water, beach,
  coastal-walk, views, markets-shopping, culture, downtime.
- Tuning in `config/scoringWeights.ts → REDUNDANCY`: `marginalPreferenceValue` (reward new
  interests), `sameFamilyAdjacent` (penalty for repeating a family within `adjacentWindow`
  slots), `alreadyFulfilled` (penalty when every interest a stop covers is already done),
  `distinctMustDo` (iconic stops like Icebergs are allowed to repeat a family).

## Gap-free scheduling
No unexplained multi-hour gaps. Any gap ≥ `MAX_UNEXPLAINED_GAP` (config, default 50 min) that
sits **before an anchor** is filled with a labelled "Free time on the beach" downtime block.
A `validate()` pass flags unexplained gaps, overlaps, too many swims/walks/meals and excess
affiliates (surfaced in `?debug=true`).

## Klook / affiliate activities
- Data: `data/klookActivities.ts`. **Paste your real Klook affiliate URLs into `affiliateUrl`.**
  Empty = the activity still appears but shows a non-linked "Bookable experience" label (no
  fabricated URLs).
- Scoring: `lib/scoreKlook.ts` — quality-first. Commercial term is `KLOOK.commercialBonus`
  (small). A meaningful boost (`KLOOK.intentBoost`) only applies to active/iconic/family
  intent. Affiliate status never changes an activity's tier (`TIER_ONE/THREE`).
- Caps: `MAX_AFFILIATE_ACTIVITIES` = { 2h:1, half:1, full:2 }.
- CTA: `components/KlookCard.tsx` — "Book on Klook ↗" (`rel="sponsored nofollow noopener"`),
  plus a persistent affiliate disclosure in the results.

## Promotion
- Homepage: `<DayPlannerPromo variant="homepage" />` directly under the hero.
- Every article/hub: `<ContentPlannerPromo context={path+title} />` (end of article), which
  deep-links to `/plan?interests=…` with topic-appropriate interests pre-selected
  (`lib/plannerContext.ts`). `/plan` reads `?interests=` and pre-ticks them.

## Analytics (reuses GA4 via `lib/analytics.track`)
`planner_cta_click`, `planner_started`, `itinerary_generated`, `klook_activity_shown`,
`affiliate_click` — no new dependency; no-ops when GA isn't loaded.

## Key config values to tune (`config/scoringWeights.ts`)
- `REDUNDANCY.marginalPreferenceValue` (9), `sameFamilyAdjacent` (26), `alreadyFulfilled` (16),
  `distinctMustDo` (9), `fulfilmentThreshold` (1)
- `MAX_UNEXPLAINED_GAP` (50)
- `KLOOK.commercialBonus` (4), `intentBoost` (22), `preferenceFit` (12)
- `MAX_AFFILIATE_ACTIVITIES` (2h:1 / half:1 / full:2)
- `PACE_TARGET`, `TIER_ONE` / `TIER_THREE` / `TIER_BOOST`

## Data caveats
Editorial scores are our opinionated weightings (by design). Opening hours are structured but
only a few are marked `hoursVerified: true` (Sean's, North Bondi Fish, bills) — the rest are
sensible placeholders to confirm. Coordinates are approximate; sequencing runs off `zone`.
No prices or menus are invented.
