import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCollection,
  indexableCollections,
  venuesForCollection,
  collectionSlugs,
  byVisitorUsefulness,
  SUBURB_LABEL,
  type FitnessVenue,
} from '@/lib/fitness';
import { FitnessVenueCard } from '@/components/fitness/FitnessVenueCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { breadcrumbJsonLd, itemListJsonLd, collectionPageJsonLd } from '@/lib/structured-data';

export const revalidate = 86400;

/**
 * Category pages. Only categories with enough verified venues behind them get a route at
 * all (see indexableCollections) - a category below the threshold has no page rather than
 * a thin one, which is the difference between a directory and a doorway.
 */
export function generateStaticParams() {
  return collectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return {};
  return {
    title: { absolute: c.title },
    description: c.metaDescription,
    alternates: { canonical: `/fitness/${c.slug}` },
    openGraph: { title: c.title, description: c.metaDescription, type: 'website', url: `/fitness/${c.slug}` },
    twitter: { title: c.title, description: c.metaDescription },
  };
}

/** Group by real suburb so a category page never blurs the two places together. */
function bySuburb(venues: FitnessVenue[]) {
  const groups = new Map<string, FitnessVenue[]>();
  for (const v of venues) {
    const k = v.suburb;
    groups.set(k, [...(groups.get(k) ?? []), v]);
  }
  return [...groups.entries()].sort(([a], [b]) => (a === 'bondi-beach' ? -1 : b === 'bondi-beach' ? 1 : a.localeCompare(b)));
}

export default async function FitnessCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c || !indexableCollections().some((x) => x.slug === slug)) notFound();

  const venues = venuesForCollection(c).sort(byVisitorUsefulness);
  const groups = bySuburb(venues);
  const casual = venues.filter((v) => v.casualVisit === 'yes');

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Fitness & wellness', path: '/fitness' },
    { name: c.h1, path: `/fitness/${c.slug}` },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionPageJsonLd({
              name: c.title,
              description: c.metaDescription,
              path: `/fitness/${c.slug}`,
              itemCount: venues.length,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              c.h1,
              venues.map((v) => ({ name: v.name, description: v.description, url: `/fitness/venues/${v.id}` })),
              'SportsActivityLocation'
            )
          ),
        }}
      />

      <Breadcrumbs items={crumbs} />

      <header className="mt-2 max-w-prose">
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink-900 md:text-4xl">{c.h1}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{c.intro}</p>
        {casual.length > 0 && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
            {casual.length} of these {venues.length} publish a casual visit, drop-in class or trial, so you can use them
            while visiting without joining anything.
          </p>
        )}
      </header>

      {groups.map(([suburb, list]) => (
        <section key={suburb} aria-labelledby={`g-${suburb}`} className="mt-10">
          <h2 id={`g-${suburb}`} className="font-display text-2xl text-ink-900">
            {SUBURB_LABEL[suburb as keyof typeof SUBURB_LABEL]}
            <span className="ml-2 text-base font-normal text-ink-500">
              {suburb === 'bondi-junction' ? '— 2.5 km inland, not at the beach' : '— walking distance to the sand'}
            </span>
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((v) => (
              <FitnessVenueCard key={v.id} venue={v} />
            ))}
          </div>
        </section>
      ))}

      <nav aria-label="Other fitness categories" className="mt-12 border-t border-sand-200 pt-6">
        <h2 className="font-display text-xl text-ink-900">More around Bondi</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {indexableCollections()
            .filter((x) => x.slug !== c.slug)
            .map((x) => (
              <li key={x.slug}>
                <Link href={`/fitness/${x.slug}`} className="text-ocean-700 hover:underline">
                  {x.h1} →
                </Link>
              </li>
            ))}
          <li>
            <Link href="/fitness/bondi-beach-or-bondi-junction" className="text-ocean-700 hover:underline">
              Bondi Beach or Bondi Junction? →
            </Link>
          </li>
          <li>
            <Link href="/fitness" className="text-ocean-700 hover:underline">
              The full fitness guide →
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
