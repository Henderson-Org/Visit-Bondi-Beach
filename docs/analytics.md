# First-party analytics + the /admin dashboard

A private, first-party analytics system for visitbondibeach.com. The site's own database
is the permanent source of truth, so the history survives dropping any third-party
provider.

---

## Why this exists alongside GA4

Google Analytics 4 (`G-KQ2SFKV2EZ`) is still installed and **has not been touched**. It
keeps working exactly as before. This system runs beside it because GA4's data lives in
Google's account, not ours: if that property is ever closed, downgraded or loses access,
the history goes with it. These first-party events are ours.

**No historical backfill is possible.** GA4's reporting API only returns aggregated
reports, not the raw per-event rows this schema stores, and inventing plausible history
would be fabrication. So:

- **Everything in `/admin` starts from the day tracking is switched on in production.**
- **Anything before that date exists only in GA4**, and should be read there.

The dashboard states its own start date in the footer, from the earliest recorded event.

---

## Storage

Postgres, via the standard `pg` driver, so any provider works (Vercel Postgres, Neon,
Supabase, RDS, local). One table:

```
analytics_page_view
  id             bigint identity primary key
  event_id       uuid  not null  UNIQUE   -- idempotency key
  occurred_at    timestamptz not null     -- stored UTC, reported Sydney
  visitor_id     uuid  not null           -- anonymous, random
  session_id     uuid  not null
  pathname       text  not null           -- real path, e.g. /ja/bondi-coastal-walk
  page_title     text
  content_id     text                     -- canonical English path (translation group)
  language       text  not null           -- 'en' | ja | zh-cn | es | pt | de | nl | it
  country        text                     -- ISO 3166-1 alpha-2, or NULL when unknown
  referrer       text
  referrer_host  text
  created_at     timestamptz not null default now()
```

Indexes lead with `occurred_at` (every dashboard panel filters by date first), paired with
`visitor_id`, `session_id`, `pathname`, `language`, `content_id` and `country`.

### Retention

**Raw events are kept indefinitely.** There is no TTL, no pruning job, no cron and no
retention policy anywhere in this project. Both the runtime and the migration script call
`schemaIsNonDestructive()` (`lib/analytics/schema.ts`) and refuse to execute anything
containing `DROP`, `DELETE` or `TRUNCATE`. Rollup tables may be added later for speed, but
they must be derived from this table, never replace it.

### Country

Resolved at the edge from the request (`x-vercel-ip-country`, with `cf-ipcountry` as a
fallback) and stored as a two-letter ISO code. **Country only** - the region and city
headers are deliberately ignored, and the IP it was derived from is never stored in any
form. Unresolvable values (including Vercel's `XX` placeholder and the `T1` Tor marker)
are stored as NULL and reported as "Unknown" rather than guessed.

Off-platform (local development, self-hosting) no geolocation header exists, so country
is NULL. Rows recorded before country tracking existed also stay NULL - they are shown as
"Unknown", never back-filled with an assumption.

### What is deliberately NOT collected

No IP address, in any form — not stored, not hashed. No region or city. No fingerprinting,
no device or browser profiling, no cross-site identifiers, no advertising trackers, no
personal data.

---

## How a page view is recorded

1. `components/AnalyticsBeacon.tsx` (client) fires once per pathname change, after paint,
   via `navigator.sendBeacon` (falling back to `fetch(keepalive)`).
2. `POST /api/collect` validates it, derives language and content id **server-side**, sets
   the anonymous cookies and inserts the row.

The collector **always returns 204**, even on database failure. A broken analytics write
can never block or affect a public page. (Verified: with a misconfigured database the
endpoint still answered 204 and the site served normally.)

### Guards against inflated numbers

| Risk | Guard |
|---|---|
| Server rendering | Effects don't run during SSR |
| Route prefetch | Prefetch fetches payloads; it never mounts components or runs effects |
| React StrictMode double-invoke (dev) | A ref stores the last path sent |
| Duplicate / retried beacons | `event_id` UNIQUE + `ON CONFLICT DO NOTHING` |
| Bots | `isbot` (maintained library, not a hand-rolled UA list) |
| Admin + API traffic | Rejected in the browser **and** again on the server |
| Dev / CI / test traffic | Requires `ANALYTICS_ENABLED=true` *and* `NEXT_PUBLIC_ANALYTICS_ENABLED=true` |

A **missing** user agent is not treated as a bot, so people using privacy tooling are not
silently discarded.

---

## Unique visitors

A random UUID in a first-party cookie (`vbb_vid`), set **server-side**, `httpOnly`,
`Secure`, `SameSite=Lax`, 400-day lifetime (the browser maximum). Because it is `httpOnly`,
page JavaScript cannot read it.

**This counts anonymous browsers, not people.** One person on a phone and a laptop is two
visitors; two people sharing a browser profile are one. Clearing cookies resets it. The
dashboard says so on the page.

## Sessions (the "Visits" KPI)

A session id (`vbb_sid`) in a cookie whose `Max-Age` is **30 minutes**, re-set on every
page view. The cookie therefore expires exactly 30 minutes after the last view, and the
next view mints a new session id.

**A visit ends after 30 minutes of inactivity.** "Visits" counts
`COUNT(DISTINCT session_id)` — sessions, never page views.

## Language

Taken from the **rendered content**, never `Accept-Language`. Translated pages are served
under a locale prefix (`/ja/…`, `/zh-cn/…`) by `app/[...slug]/page.tsx`, so the first path
segment *is* the language of the page that was served. `classifyPath()` reads it and
normalises to `en` or the locale code.

Because the same function strips the prefix, every translation of one article shares a
`content_id` (the English path) while keeping its own real `pathname`:

```
/bondi-coastal-walk        -> language en     content_id /bondi-coastal-walk
/ja/bondi-coastal-walk     -> language ja     content_id /bondi-coastal-walk
/zh-cn/bondi-coastal-walk  -> language zh-cn  content_id /bondi-coastal-walk
```

Top pages deliberately keeps translations as separate rows; `content_id` exists so language
performance can be compared later without merging unrelated pages.

---

## Dates and timezone

Reporting timezone is **Australia/Sydney**. Timestamps are stored in UTC and converted in
SQL — `(occurred_at AT TIME ZONE 'Australia/Sydney')::date` — so Postgres applies the right
DST offset per row and a "day" is a real Sydney day.

This matters. An event at **14:30 UTC on 14 August** is **00:30 on 15 August** in Sydney.
UTC-only aggregation would file it on the wrong day; this system files it on the 15th.
(Both boundary cases are covered by tests and were verified end-to-end.)

The range lives in the URL (`/admin?preset=30d`, `/admin?preset=custom&from=…&to=…`) so a
filtered view can be refreshed and shared inside the admin area, and it drives **every**
panel: KPIs, graph, Top pages, Visits by country and Page views by language.

The one deliberate exception is the **All time** line beneath the KPI cards, which reports
lifetime page views, visits and unique visitors across every event ever recorded. It is
labelled "(ignores the date filter)" precisely so it can never be mistaken for a range
figure or read as a broken filter.

Graph grouping is chosen from the range: 1 day → hourly, ≤ 92 days → daily, longer →
monthly. Empty buckets are plotted as explicit zeros, and the graph plots per-bucket
visits — **never cumulative**.

Invalid input degrades instead of breaking: a start after the end, a malformed date, or a
range over 1100 days falls back to the last 30 days with an on-screen explanation.

---

## Admin authentication

There was no auth system in this project. The smallest secure design for this stack:

1. Owner posts the password to `/api/admin/login`.
2. Compared to `ADMIN_PASSWORD` in **constant time**.
3. On success, an **HMAC-SHA256 signed** cookie (`vbb_admin`) is set — `httpOnly`,
   `Secure`, `SameSite=Strict`, 12-hour expiry. It holds only an expiry timestamp: no
   user data and no secret.
4. `middleware.ts` verifies that signature at the edge on **every** `/admin` and
   `/api/admin` request, before any page renders or any query runs.

`ADMIN_SESSION_SECRET` must be **at least 32 characters**; a shorter one is refused and
admin access stays closed rather than issuing weak sessions.

**Authentication is the security boundary.** Not the missing nav link, not robots.txt.

Brute force: five failures per IP in fifteen minutes returns 429. On serverless this is
per-instance, so it slows an attacker rather than perfectly stopping a distributed one —
the real protection is a long, high-entropy password plus constant-time comparison. The IP
is used transiently for this counter and never stored.

### Keeping /admin out of search

Four independent layers:

1. `robots: { index: false, follow: false, nocache: true }` on the admin routes.
2. `X-Robots-Tag: noindex, nofollow, noarchive` on every admin response (middleware).
3. `Disallow: /admin` in robots.txt — a *signal*, never the protection.
4. Not in the sitemap, and not linked from any public navigation, footer, search index or
   internal link.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANALYTICS_DATABASE_URL` | preferred | Postgres connection string. Takes precedence; use it when the project has more than one database |
| `POSTGRES_URL` / `DATABASE_URL` | fallback | Used when the above is unset. Set automatically by Vercel/Neon |
| `ANALYTICS_ENABLED` | yes, to record | Server switch. Must be exactly `true` |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | yes, to record | Client switch. Must be exactly `true` |
| `ADMIN_PASSWORD` | yes, for /admin | Long, high-entropy. Primary protection |
| `ADMIN_SESSION_SECRET` | yes, for /admin | ≥ 32 chars, signs the session cookie |

Both analytics switches are required, so enabling collection is always deliberate. Set them
only in the Production environment; previews and local development stay silent.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # session secret
```

## Deployment

1. Attach a Postgres store (Vercel → Storage → Create Database → Neon sets the connection
   string automatically; `POSTGRES_URL` and `DATABASE_URL` are both accepted).

   **If the project has more than one database attached**, set `ANALYTICS_DATABASE_URL`
   to the one you want analytics in. The generic names can be populated by any
   integration, and because the app creates its own table on first use, resolving to the
   wrong database would add an `analytics_page_view` table to another application's
   schema. That is non-destructive - the code only ever runs `CREATE ... IF NOT EXISTS`,
   never DROP or DELETE - but it is not where your analytics belong. The dashboard footer
   always shows the host and database name actually in use so this is verifiable at a
   glance.
2. Set the four other variables above in the Production environment.
3. Deploy.
4. Visit `/admin`, sign in, and confirm events appear.

**No manual SQL is required.** The app creates its own table and indexes on first use
(`ensureSchema()` in `lib/analytics/db.ts`), because the site owner should not have to run
migrations by hand to switch analytics on. Every statement is `IF NOT EXISTS` and the
result is cached per process, so the DDL runs at most once per server instance. It only
ever CREATEs - `schemaIsNonDestructive()` blocks anything that could drop or delete data.

`npm run analytics:migrate` still exists for anyone who prefers to apply the schema
explicitly. It shares the same statements (`lib/analytics/schema.ts`), so the two can
never drift.

---

## Tests

`lib/analytics/core.test.ts` — 40 tests covering language derivation and the shared
translation `content_id`, `/admin` and API exclusion, date validation, Sydney timezone
boundaries (including DST), preset and custom ranges, invalid-range fallbacks, bucket
selection, gap-free series, and admin token signing/expiry/tampering.

Verified end-to-end against a real Postgres: idempotent duplicate suppression, bot
filtering, server-side admin-path rejection, cookie-based visitor/session reuse, the
timezone boundary through the dashboard, and every filter driving every panel.

## Weekly performance panel

"How the last 7 days went" compares the last 7 Sydney days with the 7 before, recomputed
on every page load. It is a rolling window rather than a scheduled job, so it is always
current and there is no cron that can fail silently.

It shows visits/visitors/page views/search visits with week-on-week deltas, a breakdown of
where visits came from (search / other websites / social / direct), and plain-English
statements derived from those numbers.

**There is deliberately no "SEO score".** A single 0-100 figure would need weightings
nobody can justify, would look more authoritative than it deserves, and would invite
decisions based on a number that was invented rather than measured. Every statement in the
panel instead quotes the figures it came from, and a test asserts that no insight ever
emits a score or grade.

Channel comes from `referrer_host` (`lib/analytics/insights.ts`). Two honest caveats the
panel states on screen:

- **"From search" understates reality.** It counts visits whose referrer was a recognised
  search engine; browsers and privacy tools frequently strip the referrer, and those land
  in "Direct / unknown".
- **It cannot see rankings, impressions or click-through rate.** Those exist only in
  Search Console. This panel measures what happened *on the site*, not how Google ranks it.

With fewer than 14 days of history the panel says so, so an incomplete baseline is never
presented as a trend.

## Limitations

- **No history before deployment.** Nothing existed to import; GA4 holds the earlier data.
- Unique visitors are anonymous browsers, not people (see above).
- Cookie-based sessions mean a visitor who blocks cookies is counted as a new visitor and
  new session on each page view.
- Bot filtering catches declared bots. Headless traffic that spoofs a real browser UA and
  executes JavaScript is not distinguishable without fingerprinting, which is deliberately
  not done.
- Login rate limiting is per serverless instance, not global.

---

# GA4 event vocabulary

The first-party analytics above answers *where visitors went*. GA4 events answer *what
they did there*. The canonical list lives in `lib/analytics/events.ts` — add an event
there first, so a name is never invented twice with two spellings.

## Rules

- **Fire on intent, never on render.** An event that fires when a component mounts
  measures our layout, not the visitor, and inflates every rate derived from it.
- **Debounce typed input.** Search boxes emit one event once typing settles
  (`SEARCH_DEBOUNCE_MS`, 800 ms), not one per keystroke.
- **One event per action.** Reuse an existing event rather than adding a near-synonym.
  Duplicate events are worse than no event because they silently double-count.
- **Nothing identifying.** Query text is truncated to 64 characters and sent only for the
  site's own search boxes.
- Events are no-ops off production (`window.gtag` is absent), so they are safe to call
  anywhere.

## Events

| Event | Fires when | Parameters |
| --- | --- | --- |
| `directory_search` | Eat & drink directory search box settles (≥2 chars) | `query`, `result_count`, `placement` |
| `directory_filter` | A directory filter is applied or cleared | `facet`, `value` (`(cleared)` when unset), `applied`, `result_count` |
| `directory_sort` | Directory sort order changes | `sort`, `result_count` |
| `site_search` | Header search settles (≥2 chars) | `query`, `result_count`, `placement` |
| `site_search_result_click` | A header search result is opened | `query`, `path`, `result_count` |
| `weather_summary_expanded` | Conditions "more detail" is opened | — |
| `surf_details_opened` | As above, on a page that has surf data | — |
| `beach_safety_clicked` | The official beach-safety link is followed | — |
| `planner_started` | The day planner is opened with preset interests | `placement`, `interests` |
| `itinerary_generated` | An itinerary is produced | see `PlannerApp` |
| `itinerary_swap` | A visitor swaps an itinerary item | `kind`, `from` |
| `itinerary_use_alternative` | A visitor accepts a suggested alternative | `from`, `to` |
| `planner_cta_click` | A planner promo is clicked | `placement`, `variant`, `interests` |
| `klook_activity_shown` | A Klook activity is rendered in an itinerary | `activity`, `activity_type` |
| `affiliate_click` | Any affiliate outbound link is followed | `provider`, `item`/`activity`, `campaign`/`cta`, `placement` |

`result_count` is the count the visitor was looking at when they acted — a run of
`directory_search` or `site_search` events with `result_count: 0` is the clearest signal
of content the site is missing.

## Deliberately not tracked

**Venue card clicks.** `RestaurantCard` is a server component rendered 200+ times on the
directory. An `onClick` would make every card a client component and ship the JavaScript
to match, on the page most likely to be opened on a phone standing in Bondi. Venue page
views are already recorded by the first-party collector, and the referrer identifies the
surface that sent them — so the metric exists without the cost.

**The Bondi Today dashboard.** It is a pure server component with no client JavaScript at
all. Instrumenting its outbound links would mean hydrating it. Its engagement is visible
as page views on the pages it links to.

Both are judgement calls in favour of mobile performance. If either metric later justifies
the bytes, the events go in `lib/analytics/events.ts` first.
