# Getting the real Bondi rescue numbers from Waverley Council

`/bondi-rescue-statistics` currently publishes Surf Life Saving **Sydney Branch** figures,
because no per-beach Bondi count is published anywhere. The missing half — and the bigger
half — is Waverley Council's professional lifeguard service, which patrols Bondi, Tamarama
and Bronte 365 days a year and performs most of Bondi's rescues.

This document is the request that unlocks it.

## Try the informal route first

**Do not open with a formal GIPA application.** Under s.8 of the *Government Information
(Public Access) Act 2009* (NSW), an agency can release information informally, without an
application, a fee, or a statutory clock. Routine operational statistics are exactly the
kind of thing councils hand over informally, and Waverley already compiles these numbers
for its own reporting — lifeguard season summaries go to council committees, so this is a
matter of sending a spreadsheet that already exists, not doing new work.

An informal request can take a week. A formal one takes up to 20 working days and costs
money. Only escalate if the informal ask is declined or ignored.

> **Contact details:** I was unable to reach `waverley.nsw.gov.au` to confirm the current
> address for the Information Access / GIPA officer — the site blocked every request from
> this environment. Verify the current contact before sending. The general enquiries line
> is a reasonable starting point for asking who handles information access.

---

## Email 1 — informal release (send this first)

**Subject:** Informal request — Waverley lifeguard service statistics, 2014/15 to present

Dear Waverley Council,

I publish visitbondibeach.com, an independent guide to Bondi Beach. I am writing a
factual, sourced page on beach safety at Bondi and would like to include Council's
lifeguard service statistics.

I am hoping this can be handled as an informal release under s.8 of the GIPA Act, since I
understand these figures are already compiled for Council's own seasonal reporting.

Could you please provide, for each year or season from 2014/15 to the most recent
completed period, and **broken down by beach** (Bondi, Tamarama and Bronte):

1. Number of rescues performed by Council lifeguards
2. Number of preventative actions
3. Number of first aid treatments
4. Beach attendance or visitation, if Council records it
5. Total lifeguard patrol hours, if recorded

I would also be grateful for a short note on **how Council defines a "rescue" and a
"preventative action"**, so that I can describe the figures accurately and avoid implying
they are directly comparable with Surf Life Saving NSW's volunteer statistics, which use
their own definitions.

A spreadsheet or CSV in whatever format Council already holds is ideal — there is no need
to reformat anything for me.

On publication, the data would be presented as Council's, clearly attributed to Waverley
Council with a link to your website, alongside a note on the definitions above. I am happy
to share the page with you before it goes live.

If a formal access application is required instead, please let me know and I will lodge
one.

Many thanks,
[Name] — visitbondibeach.com — [phone] — [email]

---

## Email 2 — formal GIPA access application (fallback only)

Use this only if the informal request is refused or goes unanswered for two to three weeks.
Lodge it on Council's own GIPA access application form if they have one; the wording below
is what goes in the "information sought" field.

**Information requested:**

> Under the *Government Information (Public Access) Act 2009* (NSW), I request access to
> the following government information held by Waverley Council concerning its professional
> lifeguard service:
>
> For each financial year or patrol season from **1 July 2014 to the date of this
> application**, disaggregated by beach (Bondi Beach, Tamarama Beach and Bronte Beach), and
> disaggregated by year rather than provided as a total:
>
> a) the number of rescues performed by Council lifeguards;
> b) the number of preventative actions recorded;
> c) the number of first aid treatments provided;
> d) recorded beach attendance or visitation figures;
> e) total lifeguard patrol hours; and
> f) any document setting out the definitions or counting rules Council applies to the
>    terms "rescue" and "preventative action" for these statistics.
>
> I am content to receive this information in the form in which it is already held —
> including as an extract from Council's lifeguard reporting system, an internal seasonal
> report, or a spreadsheet — and I do not require it to be compiled into a new format.
>
> I request that the information be provided electronically (CSV or Excel preferred).
>
> If any part of this application would attract substantial processing charges, please
> contact me before proceeding so that the scope can be narrowed — for example by reducing
> the period to the most recent five years, or by limiting it to Bondi Beach only.

**What to expect:**

- A statutory application fee applies (set by the GIPA Act; **confirm the current amount**
  with Council, as I could not reach their site to verify it).
- Processing charges may apply on top of the application fee.
- Council must decide within **20 working days**, extendable in limited circumstances.
- If access is refused, the decision must give reasons, and internal review and Information
  and Privacy Commission review are available.

---

## Why the scope is written this way

Each element is deliberate, and worth keeping if you edit the wording:

**"Disaggregated by beach"** — Council may hold a combined figure across all three
patrolled beaches. A combined number cannot be published as a Bondi number, which is the
whole problem this request exists to solve. Asking explicitly makes a combined-only
response an answer rather than an ambiguity.

**"Disaggregated by year rather than as a total"** — a ten-year total is a single data
point. The series is what makes it worth publishing and worth citing.

**"From 1 July 2014"** — gives you ten complete seasons plus the current one. Council
retention may not reach that far; if they come back with less, take what exists.

**Preventative actions (item b)** — the most under-reported statistic in beach safety and
the most quotable. Surf Life Saving's own ratio is roughly 38 preventative actions per
rescue. A Council equivalent for Bondi specifically would be a genuinely new number.

**Definitions (item f)** — the difference between a good data page and a misleading one.
Council lifeguards and volunteer lifesavers may count "rescue" differently; without the
definitions, adding the two together (as most published Bondi figures appear to do) is
unsound. Asking for the counting rules is also a strong signal to the assessing officer
that this is a serious request.

**"In the form in which it is already held"** — GIPA charges scale with processing time.
Explicitly waiving any reformatting is the single most effective way to keep the cost down.

**The narrowing offer** — pre-empts a refusal on the grounds that the work is unreasonable
and invites a conversation instead. Under GIPA, an agency must consult before refusing on
that basis; offering the narrowing yourself makes that easy.

---

## When the data arrives

1. Add one `RescueSeason` per year to `data/rescue-statistics.ts`, with the source set to
   the Council response (title, URL or reference number, and date).
2. The dataset now has two services with different definitions. **Do not sum them.** Add a
   `service: 'council-lifeguards' | 'volunteer-lifesavers'` field and present them as two
   series, with the definitional difference stated on the page.
3. Run `npm run build:rescue-csv` — the published CSV, the on-page table, the derived
   statistics and the `Dataset` schema all regenerate from that one file.
4. `npx vitest run lib/rescueStats.test.ts` asserts the CSV still matches the source.
5. Retitle the page's short answer: it currently leads with "no one publishes a rescue
   count for Bondi Beach on its own", which stops being true the moment this lands.

Then pitch it. A ten-year, per-beach rescue series for the most famous beach in Australia,
released under GIPA and published under CC BY, is a story the *Sydney Morning Herald*,
*Time Out Sydney* and the *Wentworth Courier* can all run — and each of them links to the
source.
