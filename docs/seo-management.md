# SEO management

## URLs (the core rule)
Every legacy URL is preserved 1:1. New content follows the existing pattern:
articles at `/bondi-blog/<slug>` (or dated `/bondi-blog/YYYY/M/D/slug`), core pages at the
root (e.g. `/where-to-swim-at-bondi-beach`). Do **not** add `/blog/`, `/guides/`, etc.
Squarespace slugs are case-sensitive — preserve capitalization exactly or add an exact 301.

## Canonicals
Set per-page via `alternates.canonical` (the page's own path). `metadataBase` resolves to the
production domain in prod so canonicals/OG are always absolute and correct — even on a
`*.vercel.app` alias.

## Indexing / staging safety
`lib/site.ts` → `isProduction()` gates indexing on `NEXT_PUBLIC_IS_PRODUCTION=true`
(Production env only). Off ⇒ global `noindex` + `robots.txt` disallow-all. This makes it
impossible to accidentally index a staging or preview deploy.

## Sitemap & robots
`app/sitemap.ts` emits only indexable pages using the production domain. Tag archives are
`noindex,follow` and excluded. `app/robots.ts` is environment-aware.

## Structured data
`lib/structured-data.ts` emits Organization + WebSite site-wide, and BlogPosting +
BreadcrumbList on articles. Only emit schema the visible content supports — never fabricate
ratings, prices, hours, or reviews.

## Redirects
`migration/redirect-map.*` documents host normalization (apex→www, http→https), handled at
the Vercel/DNS layer. Per-URL 301s (only if a slug must change) go in `next.config.mjs`
`redirects()` — single-hop, permanent, no chains, no blanket redirect-to-home.
