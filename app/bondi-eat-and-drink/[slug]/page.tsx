import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialHero } from '@/components/EditorialHero';
import { RestaurantCard } from '@/components/eat/RestaurantCard';
import { isProduction } from '@/lib/site';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { getCollection, collectionSlugs, venuesForCollection, venuePageHref } from '@/lib/restaurantGuide';
import { PRICE_LABEL } from '@/data/restaurants';

export const dynamicParams = false;
export const revalidate = 86400;

const HERO = '/images/articles/e7f1fa0c61315488.webp';

export function generateStaticParams() {
  return collectionSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return { title: 'Page not found' };
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/bondi-eat-and-drink/${slug}` },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: c.metaTitle, description: c.metaDescription, type: 'website', images: HERO },
  };
}

const RELATED = [
  { title: 'All Bondi restaurants, cafés & bars', path: '/bondi-eat-and-drink' },
  { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
  { title: 'Where to stay in Bondi', path: '/stay' },
  { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
];

export default async function DiningCollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const venues = venuesForCollection(collection);
  const path = `/bondi-eat-and-drink/${slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Eat & Drink', path: '/bondi-eat-and-drink' },
    { name: collection.h1, path },
  ];

  const top = venues[0];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              collection.h1,
              venues.map((v) => ({ name: v.name, description: v.summary, url: venuePageHref(v) ?? undefined })),
              'Restaurant',
            ),
          ),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker={collection.kicker}
        title={collection.h1}
        intro={collection.intro}
        crumbs={crumbs}
      />

      {top && (
        <section className="mx-auto max-w-3xl px-4 pt-10">
          <p className="text-lg leading-relaxed text-ink-700">
            Our top pick right now is <strong className="font-semibold text-ink-900">{top.name}</strong>
            {top.bestFor ? ` — ${top.bestFor.toLowerCase()}` : ''}. Below are {venues.length}{' '}
            {venues.length === 1 ? 'place' : 'places'} we rate for this, ranked on the food and how well they
            suit a visit. Prices shown are a rough guide ({PRICE_LABEL[1]}–{PRICE_LABEL[4]}); always check the
            venue&rsquo;s own site for current hours and menus.
          </p>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 pt-10">
        {venues.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <li key={v.id}><RestaurantCard venue={v} /></li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-sand-200 bg-white p-6 text-center text-sm text-ink-600">
            We&rsquo;re still adding our picks for this list — check back soon, or browse{' '}
            <Link href="/bondi-eat-and-drink" className="text-ocean-700 underline">the full eat &amp; drink directory</Link>.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-2xl text-ink-900">Keep exploring Bondi</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {RELATED.map((l) => (
            <li key={l.path}><Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
