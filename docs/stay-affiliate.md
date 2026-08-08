# Stay section & affiliate monetisation

The `/stay` section is the site's accommodation guide **and** its affiliate revenue
surface. It is built guide-first: the pages are useful with zero affiliate config, and
start earning the moment the Travelpayouts env vars are set — nothing else changes.

## Pages

| URL | What it is |
| --- | --- |
| `/stay` | The hub. Areas, a curated shortlist of places (grouped by area), by-traveller guidance, FAQ. |
| `/stay/bondi-beach-vs-bondi-junction` | Comparison page for the most common "which area?" decision. |
| `/stay/hostels-bondi-beach` | Budget / hostel guide (Hostelworld-led). |

The old `/accommodation` page **301-redirects** to `/stay` (`next.config.mjs`).

## How affiliate links work

Everything routes through **`lib/affiliate.ts` → `getAffiliateLink()`**. No page or
component ever builds a provider URL itself, so adding a property produces correct,
tracked CTAs automatically.

- Each provider adapter (Booking.com, Hostelworld, Tripadvisor) builds a **search URL**
  on that provider for the destination/property.
- If a Travelpayouts marker + that provider's program id are configured, the search URL
  is wrapped in a Travelpayouts redirect (`tp.media/r`) carrying the marker and a
  `sub_id` for tracking. **If not configured, the plain provider search URL is used** —
  the CTA still works, it just isn't monetised yet.
- CTAs render via `components/stay/AffiliateButton.tsx`: `target="_blank"`,
  `rel="sponsored nofollow noopener"`, and a GA4 `affiliate_click` event on click.

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables → Production**
(placeholders are in `.env.example`). They are `NEXT_PUBLIC_` because a Travelpayouts
marker/program id is **public by design** — it appears in every affiliate URL.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` | Your Travelpayouts marker. Enables tracking for all providers. |
| `NEXT_PUBLIC_TP_P_BOOKING` | Booking.com program ("p") id. |
| `NEXT_PUBLIC_TP_P_HOSTELWORLD` | Hostelworld program id. |
| `NEXT_PUBLIC_TP_P_TRIPADVISOR` | Tripadvisor program id. |

> **Security:** the private Travelpayouts **API token** is NOT used by the site and must
> never be added as a `NEXT_PUBLIC_` variable. There is nothing secret in the browser
> bundle — only the public marker/program ids. `.env*` is gitignored (except
> `.env.example`), so real values are never committed.

## Adding a property

Edit **`data/accommodation.ts`** and add an entry to `PROPERTIES`:

```ts
{
  slug: 'my-hotel',
  name: 'My Hotel',
  area: 'bondi-beach',            // must match an AREAS slug
  type: 'hotel',                  // hotel | boutique-hotel | apartments | hostel | pub-hotel
  summary: 'Neutral one-liner — type + rough location only.',
  bestFor: ['couples', 'first-time'],
  providers: ['booking', 'tripadvisor'],
  lastReviewed: '2026-08-08',
}
```

Cards, affiliate CTAs, `ItemList` schema and internal links update automatically.

## Editorial rules (do not break)

- **No invented facts.** Store only durable, public facts (type + rough location). No
  prices, hours or amenity lists — those go stale and belong on the booking site.
- **No fake ratings/reviews.** There are deliberately no rating fields, so no page can
  emit an `AggregateRating`. `ItemList` schema carries names/descriptions only.
- **No scraped imagery.** Cards are typographic — we never show a hotel photo we don't
  have rights to.
- **Bookability = a search, never a live claim.** CTAs run a provider search; we never
  present a specific room/date as bookable, and never a closed venue as available.
- The affiliate **disclosure** (`components/stay/AffiliateDisclosure.tsx`) must remain
  wherever affiliate CTAs appear.
