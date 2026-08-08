# What's On (events) & Articles

The **What's On** section (`/whats-on`) is events-only. Editorial articles now live under
the **Articles** hub (`/articles`). This documents how it works and how to maintain it.

## Architecture

| URL | What it is | Indexable |
| --- | --- | --- |
| `/whats-on` | Events hub — featured + all upcoming, client filters | yes |
| `/whats-on/today` | Date-aware "on today" (Sydney date) | yes |
| `/whats-on/this-weekend` | Date-aware weekend listing | yes |
| `/whats-on/free` | Free events | yes |
| `/whats-on/markets` | Bondi markets | yes |
| `/whats-on/[slug]` | Individual event page (`dynamicParams=false`) | yes |
| `/articles` | Editorial hub — featured, by-section, filterable index | yes |
| `/bondi-blog` | **301 → `/articles`** (index only) | — |
| `/bondi-blog/[post]` | Existing articles — **URLs unchanged** (rankings preserved) | yes |

Client filters on the hub are **visibility-only** (no query params, no crawlable filter
combinations). The five landing pages above are the *only* crawlable filtered views, each
canonical to itself, chosen for distinct search intent.

## Event data

All events live in `data/events.ts` (`EVENTS`). Date logic is in `lib/events.ts`
(pure, tested in `lib/events.test.ts`). Everything is Sydney-timezone-aware.

### Adding an event
Add an entry to `EVENTS` with real values, today's date as `lastVerified`, and the
official `source`/`officialUrl`. Then:
- **One-off:** set `startDate` (+ optional `endDate`, `startTime`, `endTime`).
- **Recurring weekly:** set `recurrence: { freq: 'weekly', weekday }` (0=Sun … 6=Sat).
- **Annual:** set `recurrence: { freq: 'annual', month }` and, if you can verify the exact
  day, `day`. If the exact date isn't confirmed, set `datesToConfirm: true` — the UI shows
  `whenText` ("typically late October") and **no Event schema date is emitted** (we never
  fabricate a date). Set `featured: true` to surface it in the hub highlights.

Cards, filters, the today/this-weekend pages, sitemap and schema pick it up automatically.

### Recurring events
Modelled as a rule, not duplicate entries. The next occurrence is computed at render
(`resolveEvent`): weekly → next matching weekday; annual → next month/day. No duplicate
listings.

### Expired events
Recurring events never expire. A one-off event whose last day is before today is dropped
from active listings and filters (`isExpired`), but **its detail page stays live (200)** as
a record — we don't delete URLs that may hold SEO value or links. (To retire one entirely,
remove it from `EVENTS`; add a 301 in `next.config.mjs` only if it had inbound value.)

### Event schema
`eventJsonLd` emits schema.org `Event` **only when a concrete date exists** — with
`startDate` (correct Sydney offset via `sydneyOffset`, AEST/AEDT), `location` (Place +
PostalAddress), `eventStatus`, `eventAttendanceMode`, `organizer`, and an `Offer` only for
genuinely free events (price 0) or a real `ticketUrl`. No fabricated prices/offers/dates.

### Trust
Every event stores `source`, `officialUrl` and `lastVerified`, shown on the page. Annual
events with unconfirmed dates are visibly flagged. Nothing uncertain is presented as
definitive.

## Articles
`lib/articles.ts` classifies each post into a topic for the `/articles` browse hub. Posts
keep their `/bondi-blog/*` URLs; only the section framing moved (nav + breadcrumbs now say
"Articles"). No article URLs were changed, so no article redirects exist.

## Automation opportunities (future)
The centralised model is API-ready: an importer can append to `EVENTS` (or a JSON feed the
build reads), `lastVerified`/`datesToConfirm` support a staleness sweep, `recurrence`
supports generated occurrences, and `ticketUrl`/`officialUrl` can be refreshed in bulk.
