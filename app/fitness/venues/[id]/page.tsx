import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SUBURB_POSTCODE } from '@/data/fitnessVenues';
import {
  getFitnessVenue,
  venuesWithPages,
  fullAddress,
  categoryLabels,
  venuesInSuburb,
  SUBURB_LABEL,
  CATEGORY_LABEL,
} from '@/lib/fitness';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { breadcrumbJsonLd, fitnessVenueJsonLd } from '@/lib/structured-data';

export const revalidate = 86400;

export function generateStaticParams() {
  return venuesWithPages().map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const v = getFitnessVenue(id);
  if (!v) return {};
  // The suburb is in the title on purpose: it is the fact people most often have wrong.
  const title = `${v.name}, ${SUBURB_LABEL[v.suburb]} — What to Know`;
  const description = `${v.name} at ${fullAddress(v)}. ${v.description}`.slice(0, 300);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/fitness/venues/${v.id}` },
    openGraph: { title, description, type: 'website', url: `/fitness/venues/${v.id}` },
    twitter: { title, description },
  };
}

export default async function FitnessVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = getFitnessVenue(id);
  if (!v) notFound();

  const nearby = venuesInSuburb(v.suburb).filter((x) => x.id !== v.id).slice(0, 4);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Fitness & wellness', path: '/fitness' },
    { name: v.name, path: `/fitness/venues/${v.id}` },
  ];
  // Facts, only where the venue publishes them.
  const rows: [string, string][] = [
    ['Suburb', `${SUBURB_LABEL[v.suburb]} NSW ${SUBURB_POSTCODE[v.suburb]}`],
    ['Address', v.address],
    ...(v.openingHours ? ([['Hours', v.openingHours]] as [string, string][]) : []),
    ...(v.phone ? ([['Phone', v.phone]] as [string, string][]) : []),
    ['Type', categoryLabels(v).join(', ')],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            fitnessVenueJsonLd({
              name: v.name,
              description: v.description,
              address: v.address,
              suburbLabel: SUBURB_LABEL[v.suburb],
              postcode: SUBURB_POSTCODE[v.suburb],
              websiteUrl: v.websiteUrl,
              path: `/fitness/venues/${v.id}`,
              phone: v.phone,
              openingHours: v.openingHours,
              schemaType: v.categories.includes('gym') ? 'ExerciseGym' : 'SportsActivityLocation',
            })
          ),
        }}
      />

      <Breadcrumbs items={crumbs} />

      <header className="mt-2">
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink-900 md:text-4xl">{v.name}</h1>
        <p className="mt-2 text-sm text-ink-500">{fullAddress(v)}</p>
        {v.suburb === 'bondi-junction' && (
          <p className="mt-3 rounded-lg bg-sand-100 px-3 py-2 text-sm text-ink-700">
            This is in <strong>Bondi Junction</strong> — the commercial and transport centre about 2.5 km inland, not at
            Bondi Beach. Allow a bus ride or a solid uphill walk from the sand.
          </p>
        )}
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-ink-700">{v.description}</p>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} data-no-embed className="rounded-xl border border-sand-200 bg-white p-4">
            <dt className="text-[11px] uppercase tracking-wide text-ink-500">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="font-display text-xl text-ink-900">Can you just turn up?</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
          {v.casualVisit === 'yes'
            ? (v.casualNote ?? 'This venue publishes a casual option on its own site.')
            : (v.casualNote ??
              'This venue does not publish casual visit or day pass terms, so we cannot tell you either way — ask them before you make the trip.')}
        </p>
        {v.membershipModel && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
            <span className="font-medium text-ink-900">Model:</span> {v.membershipModel}
          </p>
        )}
        <p className="mt-3 text-sm text-ink-500">
          We deliberately publish no prices here — they change too often to be trustworthy second-hand. The venue&rsquo;s
          own site is the only reliable source.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={v.bookingUrl ?? v.websiteUrl}
            target="_blank"
            rel="nofollow noopener"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700"
          >
            {v.bookingUrl ? 'Book on their site ↗' : 'Visit the official site ↗'}
          </a>
          {v.phone && (
            <a
              href={`tel:${v.phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ocean-400"
            >
              Call {v.phone}
            </a>
          )}
        </div>
      </section>

      {v.facilities && v.facilities.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-ink-900">What they list</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-ink-700">
            {v.facilities.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-500">Facilities as published by the venue. We list nothing they do not.</p>
        </section>
      )}

      {v.accessibility && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-ink-900">Accessibility</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{v.accessibility}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl text-ink-900">Getting there</h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-700">
          {v.suburb === 'bondi-junction' ? (
            <>
              Bondi Junction is the easiest place to reach in the area — the train station and bus interchange are a few
              minutes&rsquo; walk from Oxford Street. From Bondi Beach take the 333 or 380 up Bondi Road.
            </>
          ) : (
            <>
              This is in the beach precinct, so the 333 and 380 from Bondi Junction drop you within a short walk. Driving
              is the hard part — see our{' '}
              <Link href="/bondi-parking" className="text-ocean-700 hover:underline">
                Bondi parking guide
              </Link>
              , or{' '}
              <Link href="/bondi-blog/2023/10/4/finding-free-parking-at-bondi-beach-made-easy" className="text-ocean-700 hover:underline">
                where the free parking is
              </Link>
              .
            </>
          )}{' '}
          Full options on{' '}
          <Link href="/getting-to-bondi" className="text-ocean-700 hover:underline">
            getting to Bondi
          </Link>
          .
        </p>
      </section>

      {nearby.length > 0 && (
        <section className="mt-10 border-t border-sand-200 pt-6">
          <h2 className="font-display text-xl text-ink-900">Also in {SUBURB_LABEL[v.suburb]}</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {nearby.map((n) => (
              <li key={n.id}>
                <Link href={`/fitness/venues/${n.id}`} className="text-ocean-700 hover:underline">
                  {n.name}
                </Link>
                <span className="text-ink-500"> — {categoryLabels(n).join(', ')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-sand-200 pt-6">
        <h2 className="font-display text-lg text-ink-900">How we verified this</h2>
        <p className="mt-2 text-sm text-ink-700">
          Checked against the venue&rsquo;s own website on{' '}
          <time dateTime={v.lastVerified}>
            {new Date(v.lastVerified).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
          .
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {v.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="nofollow noopener" className="text-ocean-700 hover:underline">
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/fitness" className="text-ocean-700 hover:underline">
            ← All fitness in Bondi
          </Link>
          {v.categories[0] && (
            <>
              {' · '}
              <Link href={`/fitness/${v.categories[0] === 'gym' ? 'gyms' : v.categories[0]}`} className="text-ocean-700 hover:underline">
                More {CATEGORY_LABEL[v.categories[0]].toLowerCase()} →
              </Link>
            </>
          )}
        </p>
      </footer>
    </main>
  );
}
