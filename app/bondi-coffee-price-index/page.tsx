import type { Metadata } from 'next';
import Link from 'next/link';
import derived from '@/data/bondi-coffee-index.derived.json';
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd } from '@/lib/structured-data';

export const revalidate = 86400;

const N = derived.currentN;
const MEDIAN = derived.index.latest ?? 0;
const YEAR = derived.latest;
const BY = derived.byYear as Record<string, { mean: number; median: number }>;
const MEAN = BY[String(YEAR)]?.mean ?? null;
const cheapest = derived.cheapest;
const dearest = derived.dearest;
const ranked = derived.ranked;
const bands = derived.currentBands ?? { under5: 0, b5_549: 0, b550_599: 0, b6plus: 0 };
const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${n.toFixed(2)}`);
const pct = (n: number) => `${Math.round((n / N) * 100)}%`;

const TITLE = `The Bondi Coffee Index: What a Coffee Costs in Bondi (${YEAR})`;
const DESC = `The median price of a flat white in Bondi is ${fmt(MEDIAN)}, based on ${N} café menus we verified. See the cheapest and dearest coffee in Bondi, the full price spread, and our sources.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: '/bondi-coffee-price-index' },
  openGraph: { title: TITLE, description: DESC, type: 'article' },
  twitter: { title: TITLE, description: DESC },
};

const FAQ = [
  {
    q: 'How much does a coffee cost in Bondi?',
    a: `The median price of a regular flat white in Bondi is ${fmt(MEDIAN)} (${YEAR}), based on ${N} café menus we verified. Most cafés charge between $5.00 and $5.50; the cheapest we found was ${fmt(cheapest?.price)} and the dearest ${fmt(dearest?.price)}.`,
  },
  {
    q: 'What is the average price of coffee in Bondi?',
    a: `We use the median as the headline figure - ${fmt(MEDIAN)} for a regular flat white in ${YEAR} - because it isn't skewed by the occasional very cheap or very expensive outlier. The mean across our sample is ${fmt(MEAN)}.`,
  },
  {
    q: 'Where is the cheapest coffee in Bondi?',
    a: `The cheapest flat white in our ${YEAR} sample was ${fmt(cheapest?.price)}, at ${cheapest?.venue_name}. The most expensive was ${fmt(dearest?.price)} at ${dearest?.venue_name}.`,
  },
  {
    q: 'Have Bondi coffee prices gone up?',
    a: `Almost certainly - but we only publish what we can prove. This is the first (${YEAR}) edition of the Bondi Coffee Index: a baseline. We could not verify archived historical menu prices, so rather than estimate, we'll measure the change year on year from here.`,
  },
];

// Distribution scale: $4.00 → $6.00.
const LO = 4, HI = 6, W = 100;
const x = (p: number) => ((p - LO) / (HI - LO)) * W;

export default function CoffeeIndexPage() {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Eat & Drink', path: '/bondi-eat-and-drink' },
    { name: 'Bondi Coffee Index', path: '/bondi-coffee-price-index' },
  ];
  const dataset = datasetJsonLd({
    name: `Bondi Coffee Index ${YEAR}`,
    description: `Verified café flat-white prices across Bondi Beach, ${YEAR}. ${N} venues, sourced from official menus.`,
    path: '/bondi-coffee-price-index',
    distributionUrl: '/data/bondi-coffee-index.csv',
    temporalCoverage: String(YEAR),
    keywords: ['Bondi', 'coffee prices', 'flat white', 'café', 'Sydney', 'cost of living'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
  });

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }} />

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-50">
        <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="text-xs text-ink-500">
            <Link href="/bondi-eat-and-drink" className="hover:text-ocean-700">Eat &amp; Drink</Link> · Data
          </nav>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-ocean-700">The Bondi Coffee Index · {YEAR}</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 md:text-6xl">
            What does a coffee cost in Bondi?
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-600">
            We read the menus of {N} Bondi cafés and recorded the price of a regular flat white. Here is what the local coffee actually costs - and who is cheapest.
          </p>
          <div className="mt-9 flex flex-wrap items-end gap-x-12 gap-y-6">
            <div>
              <div className="font-display text-6xl text-ink-900 md:text-7xl">{fmt(MEDIAN)}</div>
              <div className="mt-1 text-sm text-ink-500">Median flat white · {N} cafés</div>
            </div>
            <div>
              <div className="font-display text-3xl text-ink-900">{fmt(cheapest?.price)} – {fmt(dearest?.price)}</div>
              <div className="mt-1 text-sm text-ink-500">Cheapest to dearest in our sample</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4">
        {/* Answer-first */}
        <div className="my-8 rounded-xl border border-ocean-500/25 bg-ocean-500/5 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ocean-700">The short answer</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-900">
            The median price of a regular flat white in Bondi is <strong>{fmt(MEDIAN)}</strong> ({YEAR}), based on {N} café menus we verified. Most cafés charge between $5.00 and $5.50; the cheapest we found was {fmt(cheapest?.price)} ({cheapest?.venue_name}) and the dearest {fmt(dearest?.price)} ({dearest?.venue_name}).
          </p>
        </div>

        {/* Distribution */}
        <section className="my-10">
          <h2 className="font-display text-2xl text-ink-900">The spread</h2>
          <p className="mt-2 text-ink-600">Every café in our sample, plotted by the price of a flat white. The line marks the median.</p>
          {/* viewBox margins (x: -6, y: -3) keep the edge axis labels and the median caption fully
              inside the drawing area; no min-width so the whole plot fits a phone without
              horizontal scrolling (it previously clipped/cut off on mobile). */}
          <div className="mt-6">
            <svg viewBox="-6 -3 112 31" className="w-full" role="img" aria-label={`Distribution of Bondi flat white prices, median ${fmt(MEDIAN)}`}>
              {/* axis */}
              <line x1="0" y1="20" x2="100" y2="20" className="stroke-sand-300" strokeWidth="0.3" />
              {[4, 4.5, 5, 5.5, 6].map((t) => (
                <g key={t}>
                  <line x1={x(t)} y1="19.4" x2={x(t)} y2="20.6" className="stroke-sand-400" strokeWidth="0.3" />
                  <text x={x(t)} y="24" textAnchor="middle" className="fill-ink-500" style={{ fontSize: 3 }}>${t.toFixed(2)}</text>
                </g>
              ))}
              {/* median line */}
              <line x1={x(MEDIAN)} y1="2" x2={x(MEDIAN)} y2="20" className="stroke-ocean-600" strokeWidth="0.4" strokeDasharray="0.8 0.8" />
              <text x={x(MEDIAN)} y="0.8" textAnchor="middle" className="fill-ocean-700" style={{ fontSize: 3, fontWeight: 600 }}>median {fmt(MEDIAN)}</text>
              {/* dots (vertical jitter for overlaps by index parity) */}
              {ranked.map((r, i) => (
                <circle key={r.venue_id} cx={x(r.price)} cy={17 - (i % 5) * 2.6} r="1.05" className="fill-ocean-500/80" >
                  <title>{r.venue_name}: {fmt(r.price)}</title>
                </circle>
              ))}
            </svg>
          </div>
        </section>

        {/* Price bands */}
        <section className="my-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: bands.under5, label: 'under $5' },
            { n: bands.b5_549, label: '$5.00–5.49' },
            { n: bands.b550_599, label: '$5.50–5.99' },
            { n: bands.b6plus, label: '$6.00+' },
          ].map((b) => (
            <div key={b.label} className="rounded-xl border border-sand-200 bg-white p-4 text-center">
              <div className="font-display text-3xl text-ink-900">{b.n}</div>
              <div className="mt-0.5 text-xs text-ink-500">cafés · {b.label}</div>
              <div className="mt-1 text-[11px] font-medium text-ocean-700">{pct(b.n)}</div>
            </div>
          ))}
        </section>

        {/* Ranked list / data table */}
        <section className="my-10">
          <h2 className="font-display text-2xl text-ink-900">Cheapest to dearest</h2>
          <p className="mt-2 text-ink-600">Every price is from the café's own menu - tap a source to see it. Café names link to our guide.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-sand-300 text-left">
                  <th className="px-2 py-2 font-semibold text-ink-900">Café</th>
                  <th className="px-2 py-2 font-semibold text-ink-900">Item</th>
                  <th className="px-2 py-2 text-right font-semibold text-ink-900">Price</th>
                  <th className="px-2 py-2 font-semibold text-ink-900">Source</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => (
                  <tr key={r.venue_id} className="border-b border-sand-200 align-top">
                    <th scope="row" className="px-2 py-2 text-left font-medium text-ink-900">
                      <Link href={`/bondi-eat-and-drink/venues/${r.venue_id}`} className="text-ocean-700 hover:underline">{r.venue_name}</Link>
                    </th>
                    <td className="px-2 py-2 text-ink-600">{r.item}</td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums text-ink-900">{fmt(r.price)}</td>
                    <td className="px-2 py-2">
                      {r.source_url ? (
                        <a href={r.source_url} target="_blank" rel="nofollow noopener" className="text-ocean-700 hover:underline">menu ↗</a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            <a href="/data/bondi-coffee-index.csv" className="text-ocean-700 hover:underline">Download the full dataset (CSV) →</a>
          </p>
        </section>

        {/* Methodology + honest coverage */}
        <section className="my-10 rounded-2xl border border-sand-200 bg-sand-50 p-6">
          <h2 className="font-display text-xl text-ink-900">How we built this</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We started from our own database of Bondi cafés and recorded the price of a regular flat white (or the closest standard milk coffee) from each venue's <strong>own menu</strong>, keeping the exact item and a link to the source. We use the <strong>median</strong> as the headline index because it isn't thrown off by outliers. We never estimate a price: if we couldn't see it on a menu, the café isn't in the sample - which is why this first edition covers <strong>{N} cafés</strong> rather than every café in Bondi (many post menus only as images or through apps we can't read).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            <strong>This is the {YEAR} baseline.</strong> A five-year trend needs historical menus, and we could not verify archived prices from public archives - so rather than invent a trend, we're setting the marker this year and will measure the real change annually from here. Prices change; we recheck each year.
          </p>
        </section>

        {/* FAQ */}
        <section aria-label="Frequently asked questions" className="my-10">
          <h2 className="font-display text-2xl text-ink-900">Bondi coffee prices: FAQ</h2>
          <div className="mt-4 divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="flex cursor-pointer list-none justify-between gap-3 font-medium text-ink-900">
                  {f.q}
                  <span className="text-ocean-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-2 text-sm text-ink-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="pb-14 text-sm text-ink-500">
          Part of our <Link href="/bondi-eat-and-drink" className="text-ocean-700 hover:underline">Bondi eat &amp; drink</Link> guide.
        </div>
      </div>
    </div>
  );
}
