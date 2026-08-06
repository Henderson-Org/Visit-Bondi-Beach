# OWNER INPUT REQUIRED

Only genuinely blocking questions are listed. Work continues on everything else.

## 1. Which repository should the Bondi site live in? (blocks the *build* phase)

This session is running inside the **`njhenderson-dev/japan-travel`** repository — the live
"Small Steps Japan" platform (its `CLAUDE.md` auto-deploys `main` to `www.smallstepsjapan.com`).
VisitBondiBeach.com is an unrelated product. Building a second website into this repo would:
- risk an accidental production deploy to the Japan site, and
- entangle two independent codebases, CMS datasets, and domains.

**Recommendation:** create a **new, dedicated repository** (e.g. `visitbondibeach`) and a fresh
Vercel project for the Bondi migration. This audit/planning package can be moved there as-is.

**Until this is resolved,** I have kept everything **non-destructive and isolated** under a single
`/migration` folder on the migration branch. No app code, config, or dependency has been added to
the Japan project, and nothing has been merged toward `main` — so there is **zero** risk to the
live Japan site.

## 2. Content management: Sanity (headless CMS) or in-repo typed content?

- **Sanity** — best for a non-technical owner: visual editing, scheduling, preview, media library. Adds a service + cost.
- **In-repo (MDX/TS + zod)** — simpler, cheaper, version-controlled; edits go through Git. (This is what the Japan project uses successfully.)

Needed before the build phase. Recommendation: **Sanity**, given the brief's CMS requirements (authors, scheduling, redirect management, non-technical editing).

## 3. Access to be provided before launch (not before build)

None of these block the audit or the staging build, but all are needed for cutover. Provide via a
secrets manager or perform owner-side — **do not paste passwords in chat.**

- Squarespace admin (export + verify connected services)
- Domain registrar + DNS provider (record snapshot + cutover)
- Google Analytics 4 measurement ID
- Google Search Console access (also needed for backlink/tag decisions)
- Google Tag Manager container ID (if used)
- Newsletter/forms provider (preserve signup + notifications)
- Vercel + new GitHub repo (per #1)

## 4. Decisions I can make with data, but need Search Console/backlinks to finalise

- Which of the **223 tag pages** (if any) to keep indexable vs `noindex,follow`.
- Whether the **5 auto-generated junk slugs** carry backlinks worth 301-ing.

Default plan if no data is provided: tag pages → `noindex,follow`; junk slugs → `noindex` or 301 to the real article. This is safe and reversible.
