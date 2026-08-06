# Migration status & pre-launch checklist

Full audit lives in `migration/` (inventory, redirect map, risk table, workload). This file
tracks what is done and what remains before the production domain can be pointed here.

## Done

- ✅ Full crawl + inventory of all **440** live URLs (`migration/current-site-inventory.*`).
- ✅ URL preservation: catch-all route renders every legacy path; case-sensitive and
  percent-encoded slugs handled.
- ✅ Real per-page metadata carried over (title, meta description, canonical, H1, headings,
  hero image, publish date) into `content/pages.json`.
- ✅ Environment-aware `noindex` for staging; production-domain sitemap + robots.
- ✅ Structured data: `Organization`, `WebSite`, `BlogPosting`, `BreadcrumbList`.
- ✅ Redirect strategy: apex→www + http→https (content URLs preserved 1:1).

## Remaining before launch

- ⬜ **Full article bodies.** The crawl captured the intro + heading outline; import the
  complete body content (extend `crawl-inventory.mjs` to store body HTML, then render it).
  Until then article pages link to the live original.
- ⬜ **Re-host images.** Currently referencing Squarespace CDN originals. Download, optimise,
  and serve via `next/image` from our own storage. Confirm licensing first.
- ⬜ **Tag pages (223).** Currently `noindex,follow`. Review Search Console data to decide
  which (if any) to promote to indexable hubs; wire real article↔tag/category associations.
- ⬜ **Volatile facts.** Re-verify prices/hours/transport (e.g. Icebergs entry & hours) against
  official sources; add `lastVerified`.
- ⬜ **5 auto-generated junk slugs** — inspect for content/backlinks; `noindex` or 301.
- ⬜ **Favicon + web manifest + OG default image.**
- ⬜ **Analytics** (GA4) + Search Console verification once IDs are supplied.
- ⬜ **Parity report** — automated live-vs-staging diff (`migration/parity-report.*`).
- ⬜ **Forms / newsletter** — identify and re-wire Squarespace-connected services.

## Pre-launch checklist (gate)

- [ ] Every legacy URL resolves on staging (no 404/500).
- [ ] Titles, descriptions, canonicals, H1s match or intentionally improve on the originals.
- [ ] No redirect chains; apex→www and http→https verified.
- [ ] Staging still `noindex`; production `NEXT_PUBLIC_IS_PRODUCTION=true` set.
- [ ] Sitemap uses the production domain and lists only indexable pages.
- [ ] Structured data validates.
- [ ] Forms submit; analytics fires; Search Console verification intact.
- [ ] DNS backed up; MX/SPF/DKIM/DMARC untouched; SSL issued.
- [ ] Custom 404 works; legal pages present.
- [ ] Squarespace kept active as backup until the new site is stable and fully crawled.
- [ ] **Owner approval to go live.**
