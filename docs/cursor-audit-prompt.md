# Read-only audit prompt for Cursor

Paste the block below into Cursor Agent (Composer, agent mode) with the repo open. It is
deliberately **read-only**: Cursor investigates and reports, and you decide what to act on.

Two notes before you run it:

- **Agent mode is required** — it needs to run terminal commands. Ask-mode can only read.
- Run it on a **clean working tree** (`git status` empty), so anything it finds is the
  repo's state and not your in-progress edits.

---

```
You are auditing this repository. Produce a findings report ONLY.

## HARD CONSTRAINT: read-only

Do NOT edit, create, delete, move, or reformat any file. Do NOT run any command that
writes to the repo, including: git commit/add/checkout/stash/restore, npm install,
any `scripts/*` that writes output (build-bodies, build-rescue-csv, fix-internal-links,
classify-freshness, snapshot-water-quality), or any formatter/linter with --fix.

Running the build is allowed (it only writes .next/). Everything else must be read-only
inspection or a read-only script.

If you believe a fix is obvious, DESCRIBE it in the report. Do not apply it.

## What this repo is

visitbondibeach.com — a Bondi Beach travel guide. Next.js 16 (App Router), React 19,
TypeScript, Tailwind. Fully static/SSG + ISR, deployed on Vercel from `main`.

Read `CLAUDE.md` first. It documents the architecture and, critically, a set of
non-negotiable integrity rules: the site must never fabricate venue details, prices,
hours, dates, statistics or transport times; every fact-bearing record carries a source
and a verification date; live data must be labelled measured vs forecast vs derived.
Treat violations of those rules as first-class bugs, not style issues.

## Environment traps — read before running anything

1. **Never run bare `npx <pkg>`.** It installs into the project and wipes node_modules
   mid-session. Always use `npx --no-install <pkg>`.
2. Two checks need a running server. Build first, start it, then run them against it:
   `NEXT_PUBLIC_IS_PRODUCTION=true npm run build`
   `NEXT_PUBLIC_IS_PRODUCTION=true npx --no-install next start -p 3111 &`
   then `BASE=http://localhost:3111 node scripts/seo-regression.mjs`
   and `node scripts/schema-audit.mjs http://localhost:3111`
3. Some external domains block automated requests (waverley.nsw.gov.au, sharksmart.nsw.gov.au
   return 403). If a fetch fails, say so — do not infer what the page would have said.

## Step 1 — run the gates and report exactly what happened

Run each, capture real output, and report pass/fail with the actual numbers:

  npx --no-install tsc --noEmit
  npx --no-install vitest run
  node scripts/seo-qa.mjs
  node scripts/freshness-audit.mjs
  node scripts/verify-events.mjs
  node scripts/restaurants-audit.mjs
  node scripts/check-indexability.mjs
  NEXT_PUBLIC_IS_PRODUCTION=true npm run build
  (then, with the server up) seo-regression and schema-audit as above

Do not summarise a failure as "some tests fail". Quote the failing assertion.

## Step 2 — investigate these areas

Work through all of them. Do not stop at the first interesting thing.

**A. Correctness and build health**
- TypeScript errors, failing tests, build warnings, hydration mismatches.
- Server components that import client-only code, or client components that pull large
  server data into the browser bundle.
- `any` / non-null assertions (`!`) in code paths that handle external data.

**B. SEO integrity** (the repo has tooling for most of this — use it, then go further)
- Redirect chains in `next.config.mjs` (any source that is also a destination).
- Internal links pointing at a redirected URL, in `content/pages.json` sections, in
  authored bodies, and hardcoded in `.tsx`.
- `seo-protected-pages.json`: any page with `allowRedirect: false` that is redirected or
  has `indexable: false`. This is the highest-severity SEO defect in this repo.
- Sitemap vs reality: any URL in the sitemap that 404s, redirects, or serves noindex; any
  indexable page missing from the sitemap.
- Canonical correctness: self-referencing, absolute, matching the served URL.
- Duplicate titles/meta descriptions among indexable pages.
- Orphan pages: indexable pages with no inbound internal link from anywhere.

**C. Structured data**
- Run the schema audit, then check what it does NOT cover: pages emitting schema types
  the audit's page list never visits.
- Any schema asserting something not visible on the page (the repo has had exactly this
  bug before, with FAQPage on /start-here).
- Dataset schema: does the referenced distribution URL actually resolve?

**D. Data integrity — the repo's own core rule**
- Any hardcoded statistic, price, opening hour, phone number, distance or date in a
  component or page that does NOT carry a source and a verification date.
- `data/*.ts` records missing `lastVerifiedAt` / `sources`.
- Any place a derived or estimated value could be read as a measurement.
- Generated files that have drifted from their source: `content/body-overrides.json` vs
  `content/bodies/*.json`, `public/data/*.csv` vs the `data/*.ts` they come from,
  `content/redirected-paths.json` vs `next.config.mjs`.

**E. Live data providers** (`lib/conditions/`)
- What actually renders when a provider times out, 404s, or returns partial nulls? Trace
  each failure path and say whether it degrades to nothing or to a misleading zero.
- Caching: revalidate windows, duplicate upstream requests per render.
- Any provider requiring an env var that is not set — and what the UI does without it.

**F. Performance**
- Compressed transfer size per route (measure brotli, not raw bytes — raw is misleading).
- The eat & drink directory is known to be the heaviest page; quantify it.
- Images without dimensions, missing `sizes`, or not using next/image.
- Anything pushing a large JSON payload to the client.

**G. Accessibility**
- Interactive targets under 24×24 CSS px that are not inline text links.
- Heading order, landmark structure, one h1 per page.
- Colour contrast on the smaller muted text.
- Keyboard reachability of the search box, filters, and any details/summary UI.

**H. Security and configuration**
- Secrets or API keys committed or exposed via NEXT_PUBLIC_.
- `/admin` auth: how it is enforced, and whether any admin data leaks to an unauthenticated
  response.
- API routes: input validation, unbounded queries.
- `.github/workflows/*`: permissions scope, and whether any scheduled job silently no-ops.

## Step 3 — the report

Write it to the chat. Do not create a file.

For EVERY finding:
- **Severity**: Critical / High / Medium / Low
- **Evidence**: `path/to/file.ts:123`, or the exact command and its output
- **Why it matters**: the concrete consequence, not a restatement of the rule
- **Suggested fix**: one or two sentences, not a diff
- **Confidence**: Confirmed (I reproduced it) or Suspected (looks wrong, not verified)

Order the report by severity, then by effort-to-fix ascending within each band.

Structure it as:

  1. GATE RESULTS — a table: check, pass/fail, key numbers
  2. CRITICAL / HIGH findings
  3. MEDIUM / LOW findings
  4. THINGS I COULD NOT VERIFY — blocked fetches, missing env vars, anything needing
     credentials or a human. Be explicit; do not quietly omit.
  5. WHAT IS IN GOOD SHAPE — briefly, so I know what you actually checked and cleared.
     A short list of areas verified-clean is as useful as the findings.
  6. TOP 5 — what you would fix first, and why that order.

## Rules for the report

- No speculation presented as fact. If you did not run it, say so.
- If a check passes, say it passes. Do not invent findings to fill sections.
- Quote real output. Never paraphrase a number.
- If you disagree with something the codebase does deliberately (there are a lot of
  explanatory comments — read them), argue the case rather than flagging it as a bug.
- Prefer 10 verified findings over 40 speculative ones.
```

---

## After it reports

Findings worth acting on can be handed straight back to Cursor one at a time, or brought
here. Two things to sanity-check in its output before acting:

- **Did it actually run the gates**, or infer their results? The report should contain real
  numbers (test counts, error counts). If it doesn't, ask it to re-run and quote output.
- **Did it read the comments?** This codebase documents a lot of deliberate decisions
  (why a figure is null, why an event isn't tracked, why a page is noindex). A finding that
  contradicts an explanatory comment without engaging with it is usually wrong.
