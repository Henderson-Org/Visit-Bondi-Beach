# Translations (multilingual articles)

Selected high-value articles are translated into a small set of locales and served under clean
subdirectory URLs. **English stays the default, primary experience** — it is never redirected,
altered, or canonicalised to a translation. Translations are first-class, human-reviewable
stored content (not client-side machine translation).

## Locales

| Locale  | URL prefix | hreflang  | og:locale | Label      |
|---------|-----------|-----------|-----------|------------|
| `ja`    | `/ja/`    | `ja`      | `ja_JP`   | 日本語      |
| `zh-cn` | `/zh-cn/` | `zh-Hans` | `zh_CN`   | 简体中文    |
| `es`    | `/es/`    | `es`      | `es_ES`   | Español    |
| `pt`    | `/pt/`    | `pt`      | `pt_BR`   | Português  |
| `de`    | `/de/`    | `de`      | `de_DE`   | Deutsch    |
| `nl`    | `/nl/`    | `nl`      | `nl_NL`   | Nederlands |
| `it`    | `/it/`    | `it`      | `it_IT`   | Italiano   |

Single source of truth: `lib/i18n.ts`. To add a locale, add it there (type, prefix, hreflang,
og, label, UI strings) and drop translation files under `content/translations/<locale>/`.
Routing, hreflang, the sitemap and the discreet switcher all pick it up automatically.

## How it works

```
content/translations/<locale>/<slug>.json     ← authored/reviewed translation (you edit this)
        │  node scripts/build-translations.mjs (runs first in `npm run build`)
        ▼
content/translation-overrides.json            ← compiled map, keyed `<locale>::<english-path>`
        │  lib/translations.ts overlays it onto the English page at load
        ▼
/<locale>/<english-path>                       ← statically-generated, fully-rendered HTML
```

A translation **overlays** the English page: it inherits the hero image, section, dates, and the
Bondi Beach schema entity, and replaces only the visible copy (`title`, `metaDescription`, `h1`,
optional `intro`, and `blocks`). Everything else stays identical to English, so facts and
structured data never drift.

## Adding a translated article

1. Pick an English article that already has an authored body. Get its **exact `path`** from
   `content/pages.json` (e.g. `/bondi-blog/what-to-do-bondi-beach-travel-guide`) and its English
   `blocks` (in `content/body-overrides.json`).
2. Create `content/translations/<locale>/<any-name>.json`:
   ```json
   {
     "locale": "ja",
     "path": "/bondi-blog/what-to-do-bondi-beach-travel-guide",
     "title": "…translated <title> (unique, keyword-bearing for that market)…",
     "metaDescription": "…translated meta description…",
     "h1": "…translated on-page H1…",
     "blocks": [ …translated blocks… ]
   }
   ```
3. **Mirror the English blocks exactly**: same number of blocks, same order, same `type` values,
   same sub-counts (a `list` with 4 items stays 4 items; a `table` keeps its columns/rows). Only
   the human-readable text is translated. Partial or dropped blocks are rejected by the build via
   `scripts/verify-translation-parity.mjs` — a translation must be complete, not a summary.
4. **Do not translate** proper nouns and entities: `Bondi`, `Bondi Beach`, `Coogee`, `Bronte`,
   `Tamarama`, `Clovelly`, `Bondi Icebergs`, `Campbell Parade`, `Bondi Junction`, `Waverley`,
   `Sydney`, `NSW`, `Opal`, `Transport for NSW`, `Surf Life Saving`, etc. Keep addresses,
   postcodes, numbers, distances, times and the `000` emergency number verbatim.
5. Write natural, market-native editorial prose — never literal or machine-like. Keep every fact,
   safety instruction, link and call-to-action.
6. Build & verify:
   ```
   node scripts/build-translations.mjs        # compiles + strict block validation
   node scripts/verify-translation-parity.mjs # confirms block-for-block parity with English
   npx tsc --noEmit && npm run build
   ```

## Block types

Same shapes as English bodies (see `content/bodies/README.md`): `p`, `h2`, `h3`, `li`, `quote`,
`answer`, `list`, `localTip`, `callout` (+ `tone`, `title`), `quickFacts`, `faq`, `table`,
`itinerary`.

## SEO guarantees (built in, don't undo)

- **Self-referencing canonical** on every translated URL (never canonicalised back to English).
- **Reciprocal hreflang** cluster (English + every available translation + `x-default` → English)
  emitted identically on the English page and every translation, in `<head>` and in the sitemap.
- **Unique** `title` / `metaDescription` / `h1` / body / `og:locale` per translation.
- Translated URLs are in the **XML sitemap** with `alternates.languages`.
- Structured data is preserved and marked `inLanguage`; the Bondi entity/geo stays consistent.
- **Discovery is discreet**: no global selector, no auto-redirect, no banner — just Google
  (hreflang), direct links, and a small end-of-article "also available in …" line that renders
  only when a translation exists. English pages are otherwise unchanged.

Nothing here uses cloaking, user-agent branching, or hidden text. Translated pages are fully
rendered, crawlable HTML, indexable like any other page.
