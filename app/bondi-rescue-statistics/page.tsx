import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { isProduction, seoTitle } from '@/lib/site';
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd } from '@/lib/structured-data';
import { BONDI_CLUBS, NEIGHBOURING_CLUBS, DATASET_LAST_UPDATED } from '@/data/rescue-statistics';
import {
  seasons, latestSeason, earliestSeason, averageRescues, busiestSeason, quietestSeason,
  shareOfNsw, rescuesPerHundredThousandVisits, changeFirstToLatest,
} from '@/lib/rescueStats';

export const revalidate = 86400;

const PATH = '/bondi-rescue-statistics';
const CSV = '/data/bondi-area-rescue-statistics.csv';
const HERO = '/images/articles/e65a74989175e57e.webp';

const TITLE = 'Bondi Rescue Statistics: How Many Rescues Each Year';
const DESCRIPTION =
  'How many rescues happen at Bondi each year — who does the rescuing, what is actually published, and the verified season-by-season figures for the surf lifesaving branch Bondi belongs to.';

export function generateMetadata(): Metadata {
  return {
    title: seoTitle(TITLE),
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', images: HERO },
  };
}

/**
 * The Q&As below are rendered VISIBLY further down the page. FAQPage schema whose
 * questions are not on the page breaks Google's guidelines — scripts/schema-audit.mjs
 * fails the build on exactly that, having caught it once already on /start-here.
 */
const FAQS = [
  {
    q: 'How many rescues happen at Bondi Beach each year?',
    a: 'There is no published figure for Bondi Beach alone. Rescues at Bondi are performed by two separate services: Waverley Council’s professional lifeguards, who patrol year-round and are not required to publish per-beach statistics, and volunteer surf lifesavers, whose numbers Surf Life Saving NSW publishes only aggregated to branch level. The closest verified figure is for Surf Life Saving Sydney Branch, which includes Bondi’s two surf clubs: 1,166 rescues in the 2023/24 season.',
  },
  {
    q: 'Who actually rescues people at Bondi — the lifeguards or the lifesavers?',
    a: 'Both, and they are different organisations. The lifeguards in blue seen on Bondi Rescue are paid Waverley Council employees who patrol Bondi, Tamarama and Bronte 365 days a year. The volunteers in red and yellow belong to Bondi Surf Bathers’ Life Saving Club and North Bondi SLSC, and patrol weekends and public holidays during the season. Because the council lifeguards work every day of the year, they perform the majority of Bondi’s rescues.',
  },
  {
    q: 'Why does the number of rescues change so much between years?',
    a: 'Rescue counts track how many people got into trouble, which depends on weather, surf conditions and how many people visited. The 2019/20 season is the clearest example: rescues across the branch fell to 747, the lowest in this series, in a season disrupted by bushfire smoke and the start of the COVID-19 pandemic. A low number can mean a quiet season rather than a safer one.',
  },
  {
    q: 'Are rescue numbers the same as drownings?',
    a: 'No, and the distinction matters. A rescue is someone taken from the water alive. Preventative actions — moving swimmers away from a rip before anything happens — are counted separately and vastly outnumber rescues, which is the point: the flags exist so that a rescue is never needed.',
  },
  {
    q: 'Where does this data come from?',
    a: 'Every figure is read from the branch statistics table published in the Surf Life Saving NSW annual report for that season, and checked against the NSW total printed in the same row. Figures that did not reconcile were left out rather than estimated. The source report and page number for each season are listed on this page.',
  },
];

function Num({ v }: { v: number | null }) {
  return <>{v == null ? '—' : v.toLocaleString('en-AU')}</>;
}

export default function RescueStatisticsPage() {
  const all = seasons();
  const latest = latestSeason();
  const first = earliestSeason();
  const busiest = busiestSeason();
  const quietest = quietestSeason();
  const change = changeFirstToLatest();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Bondi Rescue', path: '/bondi-rescue' },
    { name: 'Rescue statistics', path: PATH },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: 'Surf lifesaving rescues, Sydney Branch (including Bondi)',
              description:
                'Season-by-season rescues, preventative actions, first aid treatments and beach attendance for Surf Life Saving Sydney Branch, which includes Bondi Surf Bathers’ Life Saving Club and North Bondi SLSC. Extracted from Surf Life Saving NSW annual reports and reconciled against each report’s published NSW totals.',
              path: PATH,
              distributionUrl: CSV,
              encodingFormat: 'text/csv',
              temporalCoverage: `${first.season.replace('/', '-')}/${latest.season.replace('/', '-')}`,
              license: 'https://creativecommons.org/licenses/by/4.0/',
              keywords: ['Bondi Beach', 'surf lifesaving', 'rescues', 'beach safety', 'Surf Life Saving NSW', 'Sydney'],
            }),
          ),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker="Bondi Rescue"
        title="Bondi rescue statistics"
        intro="How many rescues happen at Bondi each year — what is actually recorded, who records it, and why the number you have seen quoted is probably not from a source."
        crumbs={crumbs}
      />

      {/* Answer-first: the honest answer to the query, in the first screen. */}
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <div className="rounded-2xl border-l-4 border-ocean-500 bg-sand-50 p-5 sm:p-6">
          <h2 className="font-display text-xl text-ink-900">The short answer</h2>
          <p className="mt-2 leading-relaxed text-ink-700">
            <strong className="font-semibold text-ink-900">
              No one publishes a rescue count for Bondi Beach on its own.
            </strong>{' '}
            Two different services rescue people at Bondi, and neither reports per-beach figures
            publicly. The closest verified number covers Surf Life Saving Sydney Branch — the
            volunteer clubs including Bondi&rsquo;s two — which recorded{' '}
            <strong className="font-semibold text-ink-900">
              {latest.rescues.toLocaleString('en-AU')} rescues in {latest.season}
            </strong>
            .
          </p>
          <p className="mt-3 leading-relaxed text-ink-700">
            That figure does <em>not</em> include Waverley Council&rsquo;s professional lifeguards,
            who patrol Bondi every day of the year and perform most of its rescues. Any single
            &ldquo;rescues at Bondi&rdquo; number you see quoted online is either combining these two
            services without saying so, or is not sourced at all.
          </p>
        </div>
      </section>

      {/* Who does the rescuing - the distinction almost nobody explains. */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <h2 className="font-display text-2xl text-ink-900">Two services, two sets of numbers</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sand-200 bg-white p-5">
            <h3 className="font-display text-lg text-ink-900">Council lifeguards</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ocean-700">In blue · paid · 365 days</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              Waverley Council employs the lifeguards you see on <em>Bondi Rescue</em>. They patrol
              Bondi, Tamarama and Bronte year-round, which is why they handle the majority of
              Bondi&rsquo;s rescues. Their per-beach figures are not published in any source we could
              obtain.
            </p>
          </div>
          <div className="rounded-xl border border-sand-200 bg-white p-5">
            <h3 className="font-display text-lg text-ink-900">Volunteer surf lifesavers</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ocean-700">In red and yellow · volunteer · in season</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {BONDI_CLUBS.join(' and ')} patrol weekends and public holidays through the season.
              Their statistics <em>are</em> published by Surf Life Saving NSW — but only totalled to
              branch level, never per beach. That is the data below.
            </p>
          </div>
        </div>
      </section>

      {/* Key figures */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <h2 className="font-display text-2xl text-ink-900">The verified figures</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Surf Life Saving Sydney Branch covers {BONDI_CLUBS.length + NEIGHBOURING_CLUBS.length}+ clubs
          including {BONDI_CLUBS.join(', ')}, {NEIGHBOURING_CLUBS.join(', ')} and others along the
          coast. These are branch totals, not Bondi totals.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: 'Latest season', v: latest.rescues.toLocaleString('en-AU'), n: `rescues, ${latest.season}` },
            { k: 'Average', v: averageRescues().toLocaleString('en-AU'), n: `across ${all.length} verified seasons` },
            { k: 'Busiest', v: busiest.rescues.toLocaleString('en-AU'), n: busiest.season },
            { k: 'Quietest', v: quietest.rescues.toLocaleString('en-AU'), n: quietest.season },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-sand-200 bg-white px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-ink-500">{s.k}</dt>
              <dd className="mt-0.5 font-display text-2xl leading-tight text-ink-900">{s.v}</dd>
              <dd className="text-xs text-ink-500">{s.n}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">
              Surf Life Saving Sydney Branch rescue statistics by season
            </caption>
            <thead>
              <tr className="border-b border-sand-300 text-left text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="py-2 pr-3 font-medium">Season</th>
                <th scope="col" className="py-2 pr-3 font-medium">Rescues</th>
                <th scope="col" className="py-2 pr-3 font-medium">Preventative actions</th>
                <th scope="col" className="py-2 pr-3 font-medium">First aids</th>
                <th scope="col" className="py-2 pr-3 font-medium">Beach attendance</th>
                <th scope="col" className="py-2 pr-3 font-medium">Rescues per 100k visits</th>
                <th scope="col" className="py-2 font-medium">Share of NSW</th>
              </tr>
            </thead>
            <tbody>
              {all.map((s) => (
                <tr key={s.season} className="border-b border-sand-100">
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-ink-900">{s.season}</th>
                  <td className="py-2 pr-3 text-ink-900">{s.rescues.toLocaleString('en-AU')}</td>
                  <td className="py-2 pr-3 text-ink-600"><Num v={s.preventativeActions} /></td>
                  <td className="py-2 pr-3 text-ink-600"><Num v={s.firstAids} /></td>
                  <td className="py-2 pr-3 text-ink-600"><Num v={s.attendance} /></td>
                  <td className="py-2 pr-3 text-ink-600">{rescuesPerHundredThousandVisits(s) ?? '—'}</td>
                  <td className="py-2 text-ink-600">{shareOfNsw(s)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          A dash means the figure did not reconcile against the NSW total printed in the same report,
          so it was left out rather than estimated. Seasons missing from this table are seasons whose
          reports we could not obtain or verify — the gaps are real, not smoothed over.
        </p>

        <p className="mt-4">
          <a
            href={CSV}
            download
            className="inline-flex items-center rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-ink-800 transition hover:border-ocean-500 hover:text-ocean-700"
          >
            Download the data (CSV, CC BY 4.0)
          </a>
        </p>
      </section>

      {/* What the numbers show */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <h2 className="font-display text-2xl text-ink-900">What the numbers actually show</h2>
        <p className="mt-3 leading-relaxed text-ink-700">
          Rescues across the branch went from {first.rescues.toLocaleString('en-AU')} in {first.season} to{' '}
          {latest.rescues.toLocaleString('en-AU')} in {latest.season} — a change of{' '}
          {change.pct > 0 ? '+' : ''}{change.pct}%. With five verified seasons and gaps between them,
          that is a comparison of two points, not a trend, and we would not describe it as one.
        </p>
        <p className="mt-3 leading-relaxed text-ink-700">
          The most striking figure is {quietest.season}, when rescues fell to{' '}
          {quietest.rescues.toLocaleString('en-AU')}. That was the season of the bushfire smoke and the
          first COVID-19 closures, and beach attendance fell with it. Fewer rescues meant fewer people
          in the water, not a safer ocean — which is the trap in reading any rescue count on its own,
          and why the table above also shows rescues per 100,000 visits.
        </p>
        <p className="mt-3 leading-relaxed text-ink-700">
          Preventative actions are the number worth dwelling on. In {latest.season} the branch recorded{' '}
          {latest.preventativeActions?.toLocaleString('en-AU')} of them against{' '}
          {latest.rescues.toLocaleString('en-AU')} rescues — roughly{' '}
          {latest.preventativeActions ? Math.round(latest.preventativeActions / latest.rescues) : '—'}{' '}
          people moved away from danger for every one pulled out of it. That ratio is the case for
          swimming between the flags, in one number.
        </p>
      </section>

      {/* Visible FAQ - backs the FAQPage schema above. */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <h2 className="font-display text-2xl text-ink-900">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
          {FAQS.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="flex cursor-pointer list-none justify-between gap-3 font-medium text-ink-900">
                {f.q}
                <span className="text-ocean-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Method + sources */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <h2 className="font-display text-2xl text-ink-900">Method and sources</h2>
        <p className="mt-3 leading-relaxed text-ink-700">
          Each figure was read from the branch statistics table in the Surf Life Saving NSW annual
          report for that season, then checked against the NSW total printed in the same row. Where
          the branch columns did not sum to that printed total, the figure was discarded rather than
          published. Nothing here is interpolated, averaged across missing years, or carried forward.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {all.map((s) => (
            <li key={s.season}>
              <span className="font-medium text-ink-900">{s.season}</span>{' '}
              <a href={s.source.url} rel="nofollow noopener" target="_blank" className="text-ocean-700 underline">
                {s.source.title}
              </a>{' '}
              <span className="text-ink-500">(statistics table, p.{s.source.page + 1})</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-500">
          Last updated{' '}
          <time dateTime={DATASET_LAST_UPDATED}>
            {new Date(DATASET_LAST_UPDATED).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
          . Published under CC BY 4.0 — reuse it with a link back.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="font-display text-2xl text-ink-900">Keep reading</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { t: 'The Bondi Rescue lifeguards', p: '/bondi-rescue' },
            { t: 'Where to swim at Bondi Beach', p: '/where-to-swim-at-bondi-beach' },
            { t: 'Bondi Beach', p: '/bondi-beach' },
            { t: 'The Bondi Coffee Price Index', p: '/bondi-coffee-price-index' },
          ].map((l) => (
            <li key={l.p}>
              <Link href={l.p} className="text-ocean-700 hover:underline">{l.t} →</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
