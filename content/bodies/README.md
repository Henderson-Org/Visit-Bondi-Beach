# Authored article bodies (first-person rewrites)

Each `*.json` file in this folder is a hand-authored, **first-person** replacement
body for one article. It **replaces** the crawled Squarespace body for that page and
**survives re-crawls** — the crawl only ever touches `content/pages.json`; authored
bodies live here and are overlaid on top at load time.

## How it works

1. Author one file per article here (see the shape below).
2. Run `node scripts/build-bodies.mjs` — it validates every file and compiles them
   into `content/body-overrides.json` (the committed map the app reads).
3. `lib/content.ts` overlays those bodies onto the matching page by `path`, replacing
   `blocks`, recomputing `wordCount`, and attaching `sources` + `lastReviewed`.
4. `npm run build` renders the authored body via `components/BodyBlocks.tsx`.

`content/body-overrides.json` is generated — **do not edit it by hand**; edit the
per-article file and re-run the compiler.

## File shape

```json
{
  "path": "/bondi-blog/2025/10/13/some-article",   // required — must match a page path
  "voice": "first-person",                          // optional, informational
  "lastReviewed": "2026-08-08",                     // optional YYYY-MM-DD
  "sources": [{ "label": "Waverley Council", "url": "https://..." }],
  "blocks": [ /* one or more blocks, see below */ ]
}
```

## Block types

| Type | Fields | Renders as |
|------|--------|-----------|
| `p` / `h2` / `h3` / `quote` | `text` | paragraph / headings / pull-quote |
| `li` | `text` | list item (consecutive `li` group into one `<ul>`) |
| `list` | `items: string[]` | a `<ul>` |
| `localTip` | `text` | **Local tip** callout |
| `callout` | `tone?` (`note`\|`warning`), `title?`, `text` | note/warning callout |
| `quickFacts` | `items: {label, value}[]` | the quick-facts strip |
| `faq` | `items: {q, a}[]` | FAQ accordion **and** `FAQPage` schema |
| `itinerary` | `stops: {time, title, detail?}[]` | itinerary timeline |

## Editorial rules (non-negotiable)

- **First-person voice**, consistent with "Visit Bondi Beach Editorial Team".
- **Never fabricate** volatile facts (hours, prices, transport times, event dates).
  Verify against authoritative sources (Waverley Council, Transport for NSW, Surf Life
  Saving, official venue/event sites), list them in `sources`, and set `lastReviewed`.
- For facts that change often, prefer pointing readers at the official source over
  baking a specific number into the copy.
