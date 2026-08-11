# 06 — Answer Engine Optimisation (AEO) Strategy

_Visit Bondi Beach · workstream doc · prepared 2026-08-11_

**Goal:** make `visitbondibeach.com` a *cited* source inside AI answer engines — Google
AI Overviews (AIO), ChatGPT / ChatGPT Search, Perplexity, and Bing/Microsoft Copilot —
not just a blue link in classic search. Because the site is Next.js 16 on Vercel
(server-rendered HTML, full control of markup, headings, schema and bot access), every
lever below is actually available to us. This is unlike the old Squarespace build.

> **Data honesty.** We cannot measure our current AI-citation share from inside this repo.
> No claim below states how often we are cited today. Current-state statements are labelled
> **(inferred from page structure)**. Section 5 gives a manual measurement protocol to
> establish a real baseline, since we have no paid rank-tracker.

---

## 1. Bot access audit — the foundation

Answer engines can only cite pages their crawlers are allowed to fetch and (for the
retrieval-augmented ones) their training/RAG crawlers are allowed to store. If AI user
agents are blocked in `robots.txt`, everything else in this doc is wasted effort.

**Finding: AI crawlers are NOT blocked. No critical issue.** `app/robots.ts` (production
branch) emits a single permissive group:

```ts
rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/search'] }]
```

A wildcard `User-agent: *` group with `Allow: /` applies to every crawler that does not
have its own named group — which includes **GPTBot, OAI-SearchBot, ChatGPT-User,
ClaudeBot, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Bingbot,
Amazonbot, Applebot-Extended, and CCBot**. None of these is named, so all inherit the
allow. The only disallowed paths are `/api/` and `/search`, neither of which holds
citable answer content. **Bot access is correctly open. (inferred from `app/robots.ts`)**

Two things to be deliberate about:

- **Do NOT "helpfully" add named AI-crawler groups unless each one repeats `Allow: /`.**
  robots.txt uses most-specific-group-wins, not additive rules. The moment you add a
  `User-agent: GPTBot` group, GPTBot *stops* reading the `*` group. An empty or
  `Disallow: /` named group would silently ban the exact crawler you meant to welcome.
  The safest posture for "cite us everywhere" is the current one: a single open `*` group.
- **Non-production stays fully blocked** (`disallow: '/'` when `!isProduction()`), which is
  correct — we never want preview deployments cited or indexed.

**Recommended (optional, low priority):** if the owner ever wants to *exclude* a specific
AI use (e.g. block model *training* but allow *answer-time retrieval*), that is the only
reason to add named groups — e.g. allow `OAI-SearchBot`/`ClaudeBot`/`PerplexityBot`
(retrieval) while disallowing `GPTBot`/`CCBot`/`Google-Extended` (training corpora). Today
we want maximum citation, so leave it open. Also confirm no edge/WAF/Vercel firewall rule
is 403-ing these user agents — robots.txt permission is moot if the CDN blocks them. Verify
by curling each UA against production and logging the status (see §5).

---

## 2. On-page AEO patterns, mapped to the existing block system

The content pipeline already has an unusually strong AEO substrate. Bodies live in
`content/bodies/<slug>.json` as typed blocks (`lib/content.ts` `Block` union), compiled by
`scripts/build-bodies.mjs` and rendered by `components/blocks.tsx`. Existing block types:
`p / h2 / h3 / li / quote`, `list`, `localTip`, `callout`, `quickFacts`, `faq`, `itinerary`.
FAQPage schema is already wired (`lib/structured-data.ts` `faqJsonLd`, emitted in
`app/[...slug]/page.tsx` whenever a body has `faq` blocks). Bodies also carry `sources` +
`lastReviewed`. This is most of what AEO needs — the work is *systematising* it, plus a few
new block types.

For each pattern: what it is, whether the block exists, and the gap.

| # | AEO pattern | What it does for citations | Block support today | Action |
|---|-------------|----------------------------|---------------------|--------|
| 1 | **Answer-first paragraph** | The direct answer in the **first 1–2 sentences** under an H2 phrased as the question. Answer engines lift the first extractable sentence that resolves the query. | Partially — done by hand in the best bodies (e.g. `is-it-safe-to-swim…` opens "Yes — Bondi is safe to swim, as long as you swim between the flags."). No enforced pattern, no distinct markup. | **New `answer` block type** (see §2a) + editorial rule. Phrase the H2 as the real question; lead with a self-contained 40–55-word answer; detail follows. |
| 2 | **Extractable definitions** | "What is X" / "How long is X" queries reward one clean declarative sentence. | `p` handles it; not marked. | Editorial rule: for definitional questions, sentence 1 = `Subject is/are …`. Optionally the `answer` block. |
| 3 | **TL;DR / key-facts block** | A scannable fact strip is the single most-lifted element into AIO and Copilot. | **`quickFacts` exists** — renders as a semantic `<dl>` (label/value tiles). Strong. | Systematise: every practical/safety/how-to page gets a `quickFacts` strip near the top. Add a live water-temp fact where relevant (`live: 'waterTemp'` already supported). |
| 4 | **FAQ block + FAQPage schema** | Q&A pairs map 1:1 onto how people prompt assistants; FAQPage schema makes the pairs machine-legible. | **`faq` block + `faqJsonLd` fully wired.** Renders visible `<details>` Q&A; schema emitted only when visible (correct — no schema spam). | Systematise: 4–6 real FAQs per practical page, each answer self-contained (repeat the subject noun, don't rely on prior context). Mine `pages.json` Search Console queries for the exact phrasing. |
| 5 | **Comparison tables** | "X vs Y" and "which is better" queries are answered from tables far more than prose. | **No table block exists.** Comparisons currently prose-only. | **New `table` block type** (see §2b). Priority targets: Bondi vs Manly, Bondi vs Bondi Junction, airport-transport options, parking options, sea-temp by month, sunrise/sunset by month. |
| 6 | **Concise lists** | "Best/top/where" queries extract bulleted lists; over-long paragraphs get skipped. | **`list` block exists** (renders `<ul>`). | Systematise: parallel phrasing, lead each item with the entity name, keep items one line. Add `ItemList` schema for ranked/curated lists (helper already exists: `itemListJsonLd`). |
| 7 | **Entity clarity** | Engines cite sources they can resolve to a known real-world entity. | **Excellent already.** Canonical `bondiPlaceJsonLd()` (TouristAttraction+Beach, geo, Sydney→NSW→Australia containment, `sameAs` Wikipedia/Wikidata); every article binds via `about @id`; sub-locations bind via `containedInPlace`. | Maintain. Extend the same pattern to any new location/venue pages. Consider adding `sameAs` to notable sub-entities (Icebergs → its Wikipedia/official). |
| 8 | **"Last locally checked" date** | Recency is a ranking/trust signal for AIO and Perplexity; volatile facts (hours, prices, temps) need a visible freshness stamp. | Data exists (`lastReviewed` per body, `dateModified` from `page.lastmod` in `articleJsonLd`). **Not confirmed rendered as visible text.** | Render `lastReviewed` visibly ("Last checked by a local: 8 Aug 2026") near the top of practical pages, and ensure it also feeds `dateModified` in schema. Visible + structured must agree. |
| 9 | **Explicit source citations** | Citing primary sources (Council, TfNSW, SLSA, BoM) makes us the *citable secondary* engines trust and quote. | `sources[]` exists per body (label + url). **Rendered?** — confirm a visible "Sources" list renders. | Render a visible sources list on fact-bearing pages, linking the primary source. This both satisfies our integrity rule and signals E-E-A-T to engines. |
| 10 | **First-hand experience signals** | Post-2024, engines up-weight genuine first-hand experience ("I've swum here in every season…"). Our editorial voice is already first-person local. | Voice is a strength (`voice: "first-person"`; "Visit Bondi Beach Editorial Team"). | Keep. Make sure the answer-first sentence stays factual/extractable, *then* layer the first-person colour — don't bury the answer under an anecdote. |
| 11 | **Steps / how-to** | "How do I …" queries extract ordered steps. | `itinerary` (timeline) exists; ordered `list` works. **No HowTo schema.** | For genuine procedures (rip-current escape, Totti's booking, City2Surf training, airport→Bondi) use an ordered list and optionally emit **HowTo schema** (new helper). Note Google demoted HowTo rich results, but the structured steps still aid LLM extraction. |
| 12 | **Speakable / short-answer summary** | Optional; helps voice assistants and some retrieval. | None. | Low priority. If added, `speakable` CSS-selector schema pointing at the `answer` block. |

### 2a. New block type: `answer`

A short, visually-distinct "the short answer" lead block, rendered as a styled callout-like
element and semantically marked so it is the obvious extraction target. Shape:

```ts
| { type: 'answer'; text: string }   // 40–55 words, self-contained, leads the page
```

- Render (in `components/blocks.tsx`): a `<p>` inside a light-emphasis wrapper with an
  eyebrow "The short answer", high in the DOM, above the fold.
- It is *visible content*, so it can legitimately back schema. Where the page also has a
  `faq` whose first question ≈ the page's core question, keep them consistent.
- Editorial rule: the `answer` text must stand alone if quoted verbatim (repeat the subject
  noun, include the qualifier — "…as long as you swim between the flags"). No "it depends"
  openers.

### 2b. New block type: `table`

A responsive comparison/data table — the biggest single AEO gap.

```ts
| { type: 'table'; caption?: string; columns: string[]; rows: string[][] }
```

- Render as a real semantic `<table>` with `<caption>`, `<thead>`, `<th scope>` — engines
  parse HTML tables directly. Wrap in `overflow-x:auto` for mobile.
- Never fabricate the cell values (integrity rule). Volatile figures (prices, exact
  transport minutes) carry a source and a `lastReviewed`; if a cell can't be confirmed,
  point to the official source rather than inventing a number.
- Highest-value tables to build first: **airport→Bondi options** (mode / time / cost /
  best for), **parking options** (car park / cost / free? / walk to sand), **Bondi vs
  Manly**, **Bondi vs Bondi Junction**, **sea temperature by month**, **sunrise/sunset by
  month**.

### 2c. Optional new schema helper: `howToJsonLd`

Add alongside `faqJsonLd` in `lib/structured-data.ts`, emitted only when a body has an
ordered procedure that is *visibly* rendered. Same discipline as FAQPage: no invisible
schema.

**Net new engineering:** two block types (`answer`, `table`) + renderers, one optional
schema helper (`howToJsonLd`), and rendering of `lastReviewed` + `sources` as visible page
furniture. Everything else is editorial application of blocks that already exist.

---

## 3. Which Bondi questions AI assistants answer directly vs defer to sources

Understanding this decides *where we can win a citation* vs where we should aim to *be the
linked source*. **(inferred from observed answer-engine behaviour + our page structure; not
a live measurement)**

**Answered directly / with a cited snippet (high AEO opportunity — win the extract):**

- **Practical "is it / can you / do you have to"**: "Is it safe to swim at Bondi?", "Can
  anyone swim at Icebergs?", "Do you have to swim between the flags?", "Can you fly a drone
  at Bondi?", "Can you BBQ at Bondi?". These get a one-paragraph answer + a source link.
  A crisp `answer` block + FAQ is exactly what gets lifted.
- **Definitional / single-fact**: "How long is the Icebergs pool?", "How do you pronounce
  Bondi?", "Nearest train station to Bondi?", "How far is Bondi from the CBD?". One clean
  sentence wins.
- **Comparison**: "Bondi or Manly?", "Is Bondi Junction the same as Bondi Beach?" — tables
  win; we have none yet.
- **Safety** (engines answer but *lean heavily on an authoritative-looking source* — that
  can be us if we cite SLSA/Council): rips, sharks, patrol advice.
- **Orientation / "why"**: "Why is Bondi famous?" — synthesised from a few sources; strong
  entity + first-hand history helps us get named.

**Deferred to official/real-time sources (aim to be *a* cited source, don't assert the
volatile number ourselves):**

- **Live/volatile facts**: exact patrol hours *today*, Icebergs prices/closures, today's
  water temp, tide/surf, event dates not yet confirmed. Engines route to Council / Icebergs
  / BoM / event sites. Our play: give the durable context + the "last checked" figure +
  **link the official source** (our integrity rule already mandates this). We become the
  human-readable explainer that engines cite *alongside* the primary source.
- **Transactional**: booking a specific restaurant, buying event tickets, real-time
  accommodation prices — engines defer to the venue/OTA. Our play: the *how* (e.g. "How to
  get a Totti's booking") as steps, not the live availability.
- **Breaking news**: storm closures, tar-ball incidents — engines prefer news outlets;
  our dated posts can still be cited for background.

**Implication:** concentrate `answer`/`quickFacts`/`faq`/`table` build-out on the first
group (practical, definitional, comparison, safety-with-citation). For the deferred group,
compete on *freshness + explicit primary-source citation*, not on asserting volatile numbers.

---

## 4. AI-Answer-Target Matrix

Full matrix (74 real Bondi questions) is in **`audit/ai-answer-matrix.csv`** with columns:
`question, answerFormat, targetURL, existingPageFit, schema, cluster`.

- **answerFormat** ∈ {definition, short-answer+detail, table, steps, list} — the ideal
  extraction shape.
- **existingPageFit** ∈ {yes, needs-edit, no} — `yes` = a page already targets it well;
  `needs-edit` = page exists but needs an `answer`/`quickFacts`/`faq`/`table` retrofit or a
  visible date/source; `no` = new page needed (none required — the corpus already covers
  every high-value question, the work is retrofit not net-new).
- **schema** = the JSON-LD to attach (FAQPage, BlogPosting, Place/TouristAttraction,
  ItemList, Event, HowTo — all backed by helpers that exist or are proposed in §2c).
- **cluster** groups the questions for batch execution.

Clusters, by count and priority:

| Cluster | Qs | Priority | Why |
|---------|----|----------|-----|
| safety | 12 | **P0** | Highest direct-answer rate; SLSA/Council citation makes us the trusted secondary. High impressions on swim/safety pages. |
| icebergs | 6 | **P0** | Strong existing demand (Icebergs FAQ 841 impressions; "can anyone swim" 534). Definitional + volatile-price mix. |
| parking | 3 | **P0** | Very high demand (parking pages 400–886 impressions); perfect for `table`. |
| transport | 4 | **P0** | "How far / nearest station / airport" all extract cleanly; airport = table. |
| weather | 5 | P1 | Sea-temp (59 imp) + sunrise/sunset (32 imp) are table-shaped; live water-temp fact available. |
| eat-drink | 6 | P1 | List/ItemList extraction; Totti's booking = steps (21 imp). |
| things-to-do | 5 | P1 | List extraction; ties to hubs. |
| orientation | 4 | P1 | "Pronounce" (28 imp), "Junction vs Beach" (9), "why famous" (25) — definitional wins. |
| practical | 7 | P1 | is/can-you queries; high direct-answer rate. |
| coastal-walk | 2 | P2 | Duration questions; short-answer. |
| events | 4 | P2 | Defer to dates but own the explainer; Event schema where dates confirmed. |
| bondi-rescue | 2 | P2 | Our biggest page by clicks (1095) — the lifeguards question; protect and enrich. |
| city2surf | 2 | P2 | Steps/HowTo; seasonal demand. |
| accommodation | 3 | P2 | Defer to OTA prices; own "where to stay" list + Airbnb-legality answer. |
| family / accessibility / wildlife | 5 | P2 | Long-tail is/can-you; good FAQ fodder. |

**Execution recipe per `needs-edit` page (repeatable):**
1. Rephrase the top H2 as the literal question.
2. Add an `answer` block (40–55 words, self-contained) as the lead.
3. Add/þrefresh a `quickFacts` strip (include a live fact where one exists).
4. Ensure a `faq` block with 4–6 real, self-contained Q&As (mine `pages.json` SC queries).
5. Add a `table` where the answer is comparative or per-month.
6. Render `lastReviewed` visibly + confirm it flows to `dateModified`.
7. Render `sources[]` visibly, linking the primary authority.
8. Rebuild bodies (`node scripts/build-bodies.mjs`), run gates, deploy per CLAUDE.md.

---

## 5. Measuring AI visibility without a paid rank-tracker

We cannot buy an AI-rank tracker, so run a **manual prompt-testing protocol** to establish
a baseline and track movement. This is the only credible way to make citation claims later.

**A. Prompt set.** Use the 74 matrix questions as the fixed panel (plus ~10 rotating
seasonal ones). Keep the exact wording stable so results are comparable over time.

**B. Engines to test (free tiers):**
- Google **AI Overviews** (logged-out, AU locale — set region to Australia; AIO is
  location-sensitive and Bondi is AU-intent).
- **ChatGPT** (with web search / "Search" toggle on).
- **Perplexity** (free).
- **Microsoft Copilot** (Bing).
- Optional: Google **Gemini**, **Claude** with search.

**C. What to log per (question × engine), one row each cycle** — suggested sheet columns:
`date, engine, question, cited_us (Y/N), citation_position (1..n or blank),
our_url_cited, answer_matches_our_framing (Y/partial/N), competitors_cited,
answer_had_AIO (Y/N), notes`.

- **cited_us** is the headline metric: does our domain appear as a source/link?
- **citation_position**: where in the source list (1st source ≫ 5th).
- **answer_matches_our_framing**: did the engine lift *our* phrasing/facts even if it
  didn't link us? (a leading indicator — improve extractability to convert to a citation).
- **competitors_cited**: who we're losing to (TripAdvisor, official Council, Sydney.com,
  Time Out, Wikipedia) — tells us which pages need stronger entity/citation signals.

**D. Cadence.**
- **Baseline now** (before the §2 retrofits) — full panel × all engines, ~1 session.
- **Re-test a cluster ~2 weeks after** its pages ship (retrieval-augmented engines like
  Perplexity/Copilot pick up changes in days; AIO and GPTBot-trained recall lag weeks).
- **Full panel quarterly** for trend.
- Log a **derived rate** each cycle: `citation rate = cited_us / questions_tested`, sliced
  by cluster and engine. That number — never guessed, always measured — is the KPI.

**E. Corroborating signals (free, server-side):**
- **Server/CDN access logs**: count hits from `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`,
  `ClaudeBot`, `PerplexityBot`, `Perplexity-User`, `Bingbot`, `Google-Extended`,
  `Amazonbot`, `CCBot` by path. Rising crawl of a page ≈ it's in the retrieval pool.
  `ChatGPT-User` / `Perplexity-User` hits specifically mean a *live answer* fetched the page.
- **Referrer traffic** from `chat.openai.com` / `perplexity.ai` / `copilot.microsoft.com`
  in analytics = confirmed click-throughs from AI answers.
- **GSC** stays useful for the classic-search half and for spotting AIO-driven
  impression/CTR shifts on answered queries.

**F. Guardrail.** Results are noisy and personalised — test logged-out, note the date
(models change), and treat a single run as anecdote; only the tracked rate over cycles is
signal. Never report a citation count we didn't log ourselves.

---

## 6. Priority summary

1. **P0 engineering (small):** add `answer` + `table` block types + renderers; render
   `lastReviewed` and `sources[]` visibly; (optional) `howToJsonLd`. No robots change —
   access is already open.
2. **P0 content retrofit:** safety, icebergs, parking, transport clusters — apply the
   §4 recipe. These have the highest existing demand and the highest direct-answer rate.
3. **Baseline measurement now** (§5) so post-retrofit gains are provable.
4. **P1/P2 clusters** in demand order; re-measure per cluster ~2 weeks after ship.
5. **Standing rule:** every new practical/safety/comparison page ships answer-first, with
   `quickFacts` + `faq` + visible date + cited primary source — AEO-ready by default, not
   as a retrofit.

**Bottom line:** the hard parts of AEO — open bot access, a resolvable place entity,
FAQPage schema, a typed block system, first-person experience, and a source/last-checked
discipline — are already in place. The remaining work is two block types and the editorial
systematisation of answer-first + tables across the ~40 `needs-edit` pages in the matrix.
