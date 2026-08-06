# Content management

## Where content lives (today)
`content/pages.json` — one record per page, generated from the migration crawl by
`scripts/build-content.mjs`. Each record carries the SEO-critical fields (title, meta
description, canonical, H1, headings, hero image, publish/modified dates, indexable flag).

## Editing / adding content
Current (code-based) flow:
1. Add or edit the page record (and, once bodies are imported, the body content).
2. `npm run build:content` to regenerate the index, then commit.
3. Push — Vercel redeploys.

## Recommended next step: a headless CMS (Sanity)
For non-technical editing (articles, photos, SEO titles, scheduling, redirects, authors),
introduce Sanity and source `content/pages.json`'s data from it at build time via ISR. The
content model should validate: required meta title/description, required image alt text, and a
loud warning when `indexable` is turned off (to protect site-wide SEO). See `migration/migration-plan.md`.

## Non-negotiables
- Never fabricate venue names, hours, prices, coordinates, or links. Volatile facts need a
  source + `lastVerified`.
- Never imply a specific venue with an unrelated photo. Match images to their real subject.
- Preserve URLs and canonicals; the CMS must not let an editor silently break them.
