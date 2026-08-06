# Visit Bondi Beach

Modern rebuild of [visitbondibeach.com](https://www.visitbondibeach.com), migrated from
Squarespace to Next.js with a **zero-loss SEO** approach: every existing URL is preserved,
metadata carried over, and nothing goes live until the migration is audited and approved.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Vercel** hosting (static generation / SSG)
- Content sourced from a migration crawl of the live Squarespace site (`content/pages.json`)

## How it works

- **URL preservation** — `app/[...slug]/page.tsx` is a catch-all that renders every legacy
  URL from the content index, statically generating all clean paths and resolving
  percent-encoded archive URLs on demand. Squarespace's case-sensitive slugs are matched
  exactly first, with a normalized fallback.
- **Content index** — `content/pages.json` holds the real title, meta description, canonical,
  H1, heading outline, hero image and publish date for all 440 pages, produced from the
  migration crawl. It is committed so builds are reproducible on Vercel.
- **Staging safety** — every non-production deployment is `noindex` (see `lib/site.ts` +
  `app/robots.ts`). Indexing only turns on when `NEXT_PUBLIC_IS_PRODUCTION=true`.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

To regenerate the content index from a fresh crawl of the live site:

```bash
npm run crawl          # migration/scripts/crawl-inventory.mjs -> migration/extracted/
npm run build:content  # migration/extracted -> content/pages.json
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_IS_PRODUCTION` | Vercel **Production** only, `= true` | Turns on indexing + real robots/sitemap. Leave unset on preview/staging so they stay `noindex`. |
| `NEXT_PUBLIC_SITE_ORIGIN` | optional | Overrides the canonical origin (defaults to the production domain in prod, Vercel URL on preview). |

## Validation

```bash
npm run typecheck    # tsc --noEmit
npm run build        # next build
```

## Migration status

This is a **staging build**. Page structure, URLs, metadata, sitemap and robots are in place.
Full article bodies and image re-hosting are the next migration pass — see `docs/migration.md`
and `migration/` (audit, inventory, redirect map, owner-input list). **Do not point the
production domain here until the pre-launch checklist in `docs/migration.md` is complete.**

## Docs

- `docs/deployment.md` — Vercel + domain setup, the go-live sequence
- `docs/migration.md` — what's migrated, what remains, pre-launch checklist
- `docs/seo-management.md` — URLs, canonicals, sitemap, structured data, staging indexing
- `docs/content-management.md` — how content is modelled and edited
- `docs/rollback-plan.md` — how to revert to Squarespace safely
- `migration/` — the Phase-1 audit package
