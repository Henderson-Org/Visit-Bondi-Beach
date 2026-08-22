# OWNER INPUT REQUIRED

Only genuinely blocking questions are listed. Work continues on everything else.

## ✅ Resolved
- **Repo:** the site lives in its own dedicated repository, **`Henderson-Org/Visit-Bondi-Beach`**, with its own Vercel project. `main` is the single source of truth; Vercel auto-redeploys on push.
- **CMS:** code-based, no Sanity. Content in `content/*.json`, edited via Git.
- **Google Ads:** AdSense direct (pub-3425864271290233). Preserved; natural fit — no Auto Ads. In-article unit slot `2638734601` wired (production-only).
- **Analytics:** GA4 `G-KQ2SFKV2EZ` wired (production-only).
- **Editorial voice:** first-person, byline "Visit Bondi Beach Editorial Team" — byline + Person/Organization schema wired.
- **Image licensing / re-hosting:** owner holds the rights and is shutting Squarespace down; all ~273 hero/OG images have been downloaded and re-hosted locally under `public/images/articles/` (mapped in `content/image-map.json`). The site no longer depends on the Squarespace CDN.

## Still needed
- **Search Console export** (Performance 12 mo + Top linked pages) — prioritise the ~115 remaining missing descriptions, resolve cannibalisation, decide tag-page keepers.
- **Domain/DNS + any newsletter/forms provider** — launch only.

---

## 1. Which repository should the Bondi site live in? (RESOLVED — kept for history)

**Resolved:** the Bondi site lives in its own dedicated repository,
**`Henderson-Org/Visit-Bondi-Beach`**, with its own Vercel project — separate repo,
separate deploy, separate domain, standing entirely on its own. This audit/planning
package lives alongside the app in the Bondi repo.

## 2. Content management: Sanity (headless CMS) or in-repo typed content? (RESOLVED)

**Resolved: in-repo, code-based content — no Sanity.** Content lives in `content/*.json`
and is edited via Git. This is simpler, cheaper, fully version-controlled, and keeps the
site self-contained. (An earlier draft recommended Sanity for non-technical editing; the
owner chose the code-based model.)

## 3. Access to be provided before launch (not before build)

None of these block the audit or the staging build, but all are needed for cutover. Provide via a
secrets manager or perform owner-side — **do not paste passwords in chat.**

- Squarespace admin (export + verify connected services)
- Domain registrar + DNS provider (record snapshot + cutover)
- Google Analytics 4 measurement ID
- Google Search Console access (also needed for backlink/tag decisions)
- Google Tag Manager container ID (if used)
- Newsletter/forms provider (preserve signup + notifications)
- Vercel production domain attach (repo + project already exist — see #1)

## 4. Decisions I can make with data, but need Search Console/backlinks to finalise

- Which of the **223 tag pages** (if any) to keep indexable vs `noindex,follow`.
- Whether the **5 auto-generated junk slugs** carry backlinks worth 301-ing.

Default plan if no data is provided: tag pages → `noindex,follow`; junk slugs → `noindex` or 301 to the real article. This is safe and reversible.
