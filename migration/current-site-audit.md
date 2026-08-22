# VisitBondiBeach.com — Squarespace Migration Audit (Phase 1)

**Audit date:** 2026-08-05
**Source of truth:** `https://www.visitbondibeach.com/sitemap.xml` (snapshot saved as `squarespace-sitemap-snapshot.xml`)
**Status:** Non-destructive audit — the live Squarespace site is untouched. Nothing has been made live.

> **Status update:** The structural decisions this audit flagged are resolved. The site now lives in its own dedicated repository, **`Henderson-Org/Visit-Bondi-Beach`** (fully decoupled from the unrelated `japan-travel` project), content is code-based (no CMS), and the Squarespace images have been re-hosted locally. See `OWNER-INPUT-REQUIRED.md` for the current open items. The audit below remains valid as the record of the original crawl.

---

## 1. What platform and structure currently exist

- **Platform:** Squarespace (confirmed via `squarespace-cdn.com` asset hosts and Squarespace-style `robots.txt`).
- **Canonical host:** `https://www.visitbondibeach.com` — the sitemap emits **www** URLs. The apex (`visitbondibeach.com`) currently resolves and should 301 to www (see redirect map).
- **Content system:** A single Squarespace "blog" collection at `/bondi-blog`, plus a handful of hand-built static pages. Squarespace auto-generates category and tag archive pages.

### Inventory totals (from sitemap, 440 URLs)

| Type | Count | Default migration action |
|---|---:|---|
| Editorial articles — dated (`/bondi-blog/YYYY/M/D/slug`) | 141 | **Keep unchanged** |
| Editorial articles — legacy short-slug (`/bondi-blog/slug`) | 62 | **Keep unchanged** |
| Blog index (`/bondi-blog`) | 1 | Keep unchanged |
| Category archives (`/bondi-blog/category/*`) | 6 | Keep — review index value |
| Tag archives (`/bondi-blog/tag/*`) | 223 | **Manual review — likely `noindex,follow` or consolidate** |
| Core static pages | 7 | Keep unchanged |
| **Total indexable URLs in sitemap** | **440** | |
| **Substantive articles** | **203** | |

### The 7 core static pages
`/` (home) · `/where-to-swim-at-bondi-beach` · `/accommodation` · `/tours` · `/bondi-icebergs` · `/visit-bondi-beach` (About) · `/visit-bondi-beach-guide` · `/adstxt`
(Nav also references an external Instagram "Gallery" link, not an internal page.)

---

## 2. What can be migrated automatically

- **All 440 URLs and their slugs** — captured, classified, and preserved 1:1 in `current-site-inventory.{csv,json}`.
- **Article body content, headings, images, internal/external links** — extractable per-page via the crawler in `scripts/crawl-inventory.mjs` (fetches title, meta description, canonical, H1/H2s, OG/Twitter tags, JSON-LD, images+alt, links). This runs against the live site and writes a full-fidelity per-URL record. *Run it before the build so no content is authored from memory.*
- **URL structure** — no restructure needed; the preservation rule (Phase 2) is satisfied by keeping every slug as-is.

## 3. What needs manual attention

1. **223 tag pages (thin taxonomy).** This is exactly the "hundreds of thin taxonomy pages" the brief warns against. Recommendation: do **not** recreate them 1:1 as indexable pages. Default to `noindex,follow` (keep them crawlable for link equity, out of the index), and only promote a tag to a real indexable hub if it has backlinks or search demand. Requires Search Console / backlink data to finalise — see Owner Input.
2. **Case-sensitive URLs (5 articles + 6 categories + 5 tags = 16 URLs contain uppercase letters).** e.g. `/bondi-blog/Bondi-beach-history`, `/bondi-blog/Locals-guide-Bondi-Beach`, `/bondi-blog/category/Travel`. Squarespace treats these as case-sensitive. The new platform **must** preserve capitalization exactly (or 301 the exact-case URL) or these pages 404. Flagged in the `preservation_notes` column.
3. **1 non-ASCII URL:** `/bondi-blog/Sydney's-best-bookstore-gertude-alice` uses a typographic apostrophe (U+2019). This is fragile — preserve the exact byte/encoding, and consider a 301 to an ASCII slug as a hardening step. Also note the misspelling "gertude" (Gertrude) in the slug — keep the slug, fix display text only.
4. **5 auto-generated junk slugs** (e.g. `/bondi-blog/2023/4/1/l0k8f8ky8s4yf6dxrl7mo9r4s25vx7`) — Squarespace placeholder/duplicate URLs. Verify whether they carry content or backlinks; likely `noindex` or 301 to the real article.
5. **Volatile facts already visible in content** — e.g. the swim page states Icebergs entry "$9 adults / $6 children, 6am–6:30pm, closed Thursdays." These must be re-verified against the venue's official source at migration time and carry a `lastVerified` date; never copy stale prices/hours forward unchecked.
6. **Metadata capture** — the sitemap does not contain title tags, meta descriptions, OG images, or JSON-LD. Those are only obtainable by crawling each page (the provided script does this). Until that crawl runs, per-page metadata columns in the inventory are structural only.

## 4. Major SEO risks

| Risk | Why it matters here |
|---|---|
| Slug/case drift on migration | 16 case-sensitive + 1 non-ASCII URL will 404 silently if the new platform lowercases or re-slugs. |
| Losing the www canonical | Sitemap is www; apex must keep 301→www or split link equity. |
| Tag-page handling | Recreating 223 thin pages as indexable = index bloat + quality dilution; deleting them without `follow` = lost internal link equity. Needs the middle path. |
| Metadata loss | Titles/descriptions/OG not in sitemap — must be crawled and carried over verbatim (then improved), not regenerated. |
| Staging indexation | New build must be `noindex` + protected until cutover, or it competes with the live site. |

## 5. Major technical risks

- **Repository (resolved).** The site now lives in its own dedicated repo, `Henderson-Org/Visit-Bondi-Beach`, decoupled from `japan-travel`. This risk is closed.
- **Access** to DNS, Squarespace admin, and Search Console is still needed for launch-time steps and backlink-informed decisions (which tags to keep, which junk URLs matter). None of these block the staging build.
- **Image licensing (resolved).** The owner holds the rights and is retiring Squarespace; all ~273 hero/OG images have been re-hosted locally under `public/images/articles/` (see `content/image-map.json`). The site no longer depends on the Squarespace CDN.

---

## 6. Recommended-action legend (used in the inventory)

- **Keep unchanged** — same URL, migrate content faithfully.
- **Keep — review index value** — retain URL, decide indexability with data.
- **Requires manual review** — needs backlink/traffic data or content inspection before a final call.
- **Consolidate / Noindex / Redirect / Remove** — none applied wholesale yet; the brief forbids removing pages just for looking weak. Only the 223 tag pages and 5 junk slugs are currently flagged for review.

## 7. Files in this folder

- `current-site-inventory.csv` / `.json` — all 440 URLs, classified, with preservation notes.
- `redirect-map.csv` / `.json` — host-normalization 301s (apex→www, http→https). Content URLs are preserved 1:1, so no per-article redirects are needed unless a slug must change.
- `squarespace-sitemap-snapshot.xml` — frozen source-of-truth crawl input.
- `migration-plan.md` — the full initial-output package (architecture, plan, access, risks, workload).
- `OWNER-INPUT-REQUIRED.md` — genuinely blocking questions.
- `scripts/crawl-inventory.mjs` — per-URL full-metadata crawler for the extraction pass.
