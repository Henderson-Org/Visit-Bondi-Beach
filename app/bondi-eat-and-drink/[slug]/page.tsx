import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { VenueCard } from '@/components/eat/VenueCard';
import { isProduction } from '@/lib/site';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/structured-data';
import { getCollection, collectionSlugs, venuesForCollection } from '@/lib/eatDrink';

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

function restaurantListJsonLd(name: string, venues: { name: string; type: string; shortDescription: string }[]) {
  const TYPE: Record<string, string> = { cafe: 'CafeOrCoffeeShop', bar: 'BarOrPub', pub: 'BarOrPub', bakery: 'Bakery', restaurant: 'Restaurant', takeaway: 'FoodEstablishment' };
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: venues.length,
    itemListElement: venues.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': TYPE[v.type] ?? 'Restaurant', name: v.name, description: v.shortDescription },
    })),
  };
}

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

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(collection.faqs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantListJsonLd(collection.h1, venues)) }} />

      <EditorialHero
        image={HERO}
        kicker={collection.kicker}
        title={collection.h1}
        intro={collection.answer}
        crumbs={crumbs}
      />

      <section className="mx-auto max-w-3xl px-4 pt-10">
        {collection.intro.map((p, i) => (
          <p key={i} className="mt-3 text-lg leading-relaxed text-ink-700">{p}</p>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-10">
        {venues.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <li key={v.id}><VenueCard venue={v} /></li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-sand-200 bg-white p-6 text-center text-sm text-ink-600">
            We’re still adding our picks for this list — check back soon, or browse{' '}
            <Link href="/bondi-eat-and-drink" className="text-ocean-700 underline">all our eat &amp; drink guides</Link>.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-14">
        <Faq items={collection.faqs} />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-2xl text-ink-900">Keep exploring Bondi</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {collection.related.map((l) => (
            <li key={l.path}><Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
