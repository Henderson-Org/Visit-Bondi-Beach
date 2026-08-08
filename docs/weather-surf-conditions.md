# Daily Weather & Surf Summary

A compact, prominent module at the top of the homepage that tells a visitor what
today looks like — in plain English — within about five seconds, backed by a
compact row of raw data. Built to be provider-agnostic and extendable.

## What it shows

A short written summary (the primary output), e.g.:

> Mild and partly cloudy today, with a top of 17°C. Winds are light and variable,
> with only a slight chance of rain. Surf is around 0.5–1m with a small SSE
> short-period windswell.

Then a compact secondary row (Max · Rain · Wind · Surf · Water · Best surf), an
expandable "more detail" row (feels-like, UV, gusts, sunrise/sunset, swell
direction/period, outlook), the sources + update times, and a beach-safety link.

## Sources selected

| Data | Source | Why |
|------|--------|-----|
| Weather (current + today) | **Open-Meteo** (`api.open-meteo.com`) | Free, no API key, open-licensed (CC-BY 4.0), machine-readable, and blends national models **including the Bureau of Meteorology's ACCESS model** for Australia. |
| Surf / marine | **Open-Meteo Marine** (`marine-api.open-meteo.com`) | Free, no key. Structured, per-location wave height, swell height/direction/period, wind-wave height and sea-surface (water) temperature. |

### Why not BOM directly?

BOM is the authoritative Australian source, but its **undocumented JSON API
explicitly forbids reuse** — its own response carries: *"This application
programming interface (API) is owned by the Bureau of Meteorology. You must not
use, copy or share it."* Its licensed data feeds require registration/agreements
and are not a drop-in JSON API. So we do **not** call BOM programmatically. We use
Open-Meteo (which incorporates BOM's ACCESS model) and **link to BOM** for the
authoritative human-readable forecast, plus **Beachsafe** (Surf Life Saving
Australia) for official beach safety. Those links live in `lib/conditions/locations.ts`.

## API limitations / cost

- **No API key required** at current volumes. Open-Meteo's free tier is for
  non-commercial use (fair-use ~10k requests/day). Because we cache server-side,
  real usage is a handful of requests per day per destination.
- **Commercial note:** VisitBondiBeach runs ads, so a strict reading of
  Open-Meteo's terms may require a commercial subscription (which adds an API key)
  at launch, or a switch to another provider. This is a licensing decision, not a
  code change — the adapter abstraction makes swapping trivial (see below). No
  paid API has been added.
- **Tide is not yet available.** No permitted free tide API is configured, so
  `SurfConditions.tide` is `null` and tide is omitted from the UI (never
  fabricated). Adding a tide provider (e.g. WillyWeather/Stormglass with a key, or
  Fort Denison harmonic predictions) lights it up — the schema field already exists.

## Caching

All upstream calls go through a caching fetch in `lib/conditions/service.ts`
(`REVALIDATE_SECONDS = 1800`, i.e. 30 min) using Next's fetch cache. Effects:

- The APIs are called server-side **at most once per 30-minute window**, never on
  every page load. Identical URLs dedupe to one request.
- Next serves the last good response while it revalidates (stale-while-revalidate),
  covering brief provider outages. On a hard failure with no cache, the service
  returns nulls and the module degrades gracefully (renders only what it has, or
  nothing).
- The homepage is therefore statically generated with **ISR (revalidate 30m)**.
- Provenance is recorded per source: `fetchedAt`, `providerUpdatedAt`,
  `forecastValidTime`. The UI shows "Updated <provider time>" and labels the
  source — it never implies the data is live.

## Normalized data structure

Defined in `lib/conditions/types.ts`. The UI and summary engine depend only on
these internal types, never on a provider's raw shape:

- `WeatherConditions` — current temp, feels-like, weather code→label/emoji, wind
  (speed/gust/direction/compass), UV.
- `DailyWeatherForecast` — max/min, rain chance, UV max, sunrise/sunset, dominant
  wind.
- `SurfConditions` — wave height (now + today max), swell height/direction/period,
  wind-wave height, water temp, tide (nullable).
- `Conditions` — the assembled model: location + current + today + surf + per-source
  `ProviderMeta` + the computed `ConditionsSummary`.
- Provider contracts: `WeatherProvider` (`getCurrentConditions`, `getDailyForecast`)
  and `SurfProvider` (`getSurfConditions`).

## Destination → weather/surf mapping

`lib/conditions/locations.ts` maps each destination to its weather lat/lon, surf
lat/lon + `beachFacingDeg` (used to compute onshore/offshore wind), inland flag,
and official safety/forecast links. This is the site's editable data layer — add a
destination by adding an entry; nothing else changes. The module resolves the
destination from page context (`destinationForPath`) — it does **not** request
browser geolocation. This is a Bondi-only site today, so everything maps to Bondi;
the resolver is future-proofed for a multi-destination site (e.g. `/gold-coast/...`).

## Written-summary engine

`lib/conditions/summary.ts` is a **pure, deterministic** rules/templates engine —
**no LLM at request time**. It turns structured conditions into the sentence(s),
plus a `bestSurfTime`, a suitability label (beginner/moderate/experienced/poor) and
a hazard note when surf is elevated. It never claims surf is "safe" and gives
general guidance only. Rules are unit-tested in `lib/conditions/conditions.test.ts`
(`npm test`).

## How to add or replace a source

1. Implement `WeatherProvider` or `SurfProvider` (see `lib/conditions/providers/`).
   Normalize the response into the internal types.
2. In `lib/conditions/service.ts`, change the one line that constructs
   `weatherProvider` / `surfProvider`. Nothing in the UI changes.
3. If the provider needs a key, read it from an env var in the adapter and document
   it in `.env.example`.

## SEO / AEO

The written summary is real server-rendered text (not client-only, not an image),
so search engines and AI assistants can read statements like "Surf at Bondi today
is around 1–1.5m." Weather text is **not** put in any page's `<title>`/meta, and the
module appears on just two curated pages (the homepage and the `/bondi-weather`
hub) — so no rapidly-changing weather text becomes a page's primary SEO content,
and no weather-specific URLs are created or indexed.

## Analytics

`components/ConditionsFooter.tsx` fires GA4 events only on genuine interaction —
`weather_summary_expanded`, `surf_details_opened`, `beach_safety_clicked` — never
on load. `gtag` exists only in production, so these are no-ops in staging.

## Future extension

The normalized `Conditions` model is designed to feed the recommendation engine
later — e.g. "it's raining today → best indoor things to do", or "small surf today
→ beginner-friendly beaches". Weather/surf becomes an input to recommendations
rather than an isolated widget.

## Files

- `lib/conditions/types.ts` — normalized schemas + provider interfaces
- `lib/conditions/locations.ts` — destination → data-location mapping (editable)
- `lib/conditions/wmo.ts` — WMO code → label/emoji
- `lib/conditions/geo.ts` — compass, wind-effect, surf-banding helpers
- `lib/conditions/providers/open-meteo-weather.ts` — weather adapter
- `lib/conditions/providers/open-meteo-surf.ts` — marine adapter
- `lib/conditions/summary.ts` — deterministic summary engine
- `lib/conditions/service.ts` — orchestration + caching + fallback
- `lib/conditions/conditions.test.ts` — summary + helper tests
- `components/WeatherSurfSummary.tsx` — server component (renders summary text)
- `components/ConditionsFooter.tsx` — client component (expand + analytics + links)
- `app/page.tsx` — placement near the top of the homepage
- `app/[...slug]/page.tsx` — renders the module on hub pages listed in
  `CONDITIONS_PAGES` (currently the `/bondi-weather` hub)

## Where the module appears

The homepage renders it directly. For other pages, add the path (→ destination
key) to `CONDITIONS_PAGES` in `lib/conditions/locations.ts`; hub pages in that map
render it automatically. Today it shows on the homepage and the `/bondi-weather` hub.

## Config / keys still required

None for the current providers. For launch, decide on Open-Meteo's commercial
terms (may add an API key) and optionally add a tide provider. Both are localized
to `lib/conditions/` per the notes above.
