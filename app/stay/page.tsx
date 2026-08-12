import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { AccommodationCard } from '@/components/stay/AccommodationCard';
import { StayBrowser } from '@/components/stay/StayBrowser';
import { ComparisonTable } from '@/components/stay/ComparisonTable';
import { AffiliateDisclosure } from '@/components/stay/AffiliateDisclosure';
import { isProduction } from '@/lib/site';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { facetFor, FILTER_TAGS, FILTER_TYPES } from '@/lib/stay';
import {
  AREAS,
  activeProperties,
  areasWithProperties,
  byBeachProximity,
  propertiesByArea,
} from '@/data/accommodation';

const TITLE = 'Where to Stay in Bondi Beach';
const DESCRIPTION =
  'Where to stay in Bondi Beach, from a local: how the areas compare, who each place suits, and a curated shortlist of hotels, apartments and hostels - with honest picks, not a booking engine.';
const HERO = '/images/articles/0886b63eac692e12.webp';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/stay' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', images: HERO },
  };
}

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Stay', path: '/stay' },
];

const CATEGORIES = [
  { title: 'Best hotels in Bondi Beach', path: '/stay/best-hotels-bondi-beach' },
  { title: 'Family accommodation in Bondi', path: '/stay/family-accommodation-bondi' },
  { title: 'Luxury stays in Bondi', path: '/stay/luxury-hotels-bondi' },
  { title: 'Budget accommodation near Bondi', path: '/stay/budget-accommodation-bondi' },
  { title: 'Apartments in Bondi Beach', path: '/stay/apartments-bondi-beach' },
  { title: 'Hotels near Bondi Beach', path: '/stay/hotels-near-bondi-beach' },
  { title: 'Hostels in Bondi Beach', path: '/stay/hostels-bondi-beach' },
  { title: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
];

const FAQS = [
  {
    q: 'Where is the best area to stay in Bondi?',
    a: 'For a first visit, stay on or just behind Campbell Parade at Bondi Beach - you wake up by the sand, the cafés and the start of the coastal walk. For better value and the easiest transport (the train ends there), stay in Bondi Junction, about a 10-minute bus down to the beach. North Bondi is calmer and good for families; Tamarama and Bronte suit couples wanting the Eastern Beaches without the crowds.',
  },
  {
    q: 'What is the best hotel in Bondi Beach?',
    a: 'For location and style, QT Bondi is the standout beachfront boutique hotel, right on Campbell Parade. For families and longer stays, an apartment-hotel such as Adina Bondi Beach - with kitchens and a pool - is often the better choice. The right pick depends on whether you want to be directly on the sand or want space and self-catering.',
  },
  {
    q: 'Where should families stay in Bondi?',
    a: 'Families are usually happiest in a serviced apartment with a kitchen and a pool, either just behind Bondi Beach or in Bondi Junction for value and transport. North Bondi is the calmest end of the beach for young children. See our family accommodation guide for the shortlist.',
  },
  {
    q: 'What is the cheapest way to stay near Bondi Beach?',
    a: 'The beachfront hostels on Campbell Parade offer the cheapest beds right by the sand, while Bondi Junction is usually the best value for a private room. Prices peak over the Sydney summer, so book ahead for December to February.',
  },
];

export default function StayHub() {
  const props = activeProperties();
  const facets = props.map(facetFor);
  const areaOptions = areasWithProperties().map((a) => ({ slug: a.slug, name: a.name }));
  const tagOptions = FILTER_TAGS.filter((t) => props.some((p) => p.bestFor.includes(t)));
  const typeOptions = FILTER_TYPES.filter((t) => props.some((p) => p.type === t));
  const nearest = [...props].sort(byBeachProximity).slice(0, 6);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd('Places to stay in Bondi Beach', props.map((p) => ({ name: p.name, description: p.summary })))),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker="Stay"
        title={TITLE}
        intro="Bondi is small, so where you stay shapes your whole trip more than the exact address does. Here's how the areas differ, a shortlist worth booking, and guides to the places we know best - written by locals, not a booking engine."
        crumbs={CRUMBS}
        chips={[
          { label: 'Find a place', href: '#browse' },
          { label: 'Compare', href: '#compare' },
          { label: 'By area', href: '#areas' },
          { label: 'FAQ', href: '#faq' },
        ]}
      />

      {/* Answer-first (AEO) */}
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <h2 className="font-display text-2xl text-ink-900">Where should you stay in Bondi Beach?</h2>
        <p className="mt-3 text-lg leading-relaxed text-ink-700">
          Stay <strong className="font-semibold text-ink-900">on Campbell Parade at Bondi Beach</strong> if
          you want to walk out onto the sand and be in the middle of everything - best for first-timers and
          couples. Choose <strong className="font-semibold text-ink-900">Bondi Junction</strong> for better
          value and the easiest transport, or a <strong className="font-semibold text-ink-900">serviced
          apartment</strong> if you&rsquo;re travelling as a family or staying a while and want a kitchen and
          a pool.
        </p>
        <div className="mt-5">
          <AffiliateDisclosure compact />
        </div>
      </section>

      {/* Browse with filters */}
      <section id="browse" className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Find your place to stay</h2>
        <p className="mt-2 max-w-prose text-ink-700">
          Filter by area, who you&rsquo;re travelling with, or the type of stay. Tap a place with a
          <span className="text-ocean-700"> guide</span> to read our full review first.
        </p>
        <div className="mt-6">
          <StayBrowser facets={facets} areas={areaOptions} tags={tagOptions} types={typeOptions}>
            {props.map((p) => (
              <AccommodationCard key={p.slug} property={p} campaign="stay-hub" />
            ))}
          </StayBrowser>
        </div>
      </section>

      {/* Browse by need - category pages */}
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Browse by what you need</h2>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.path}
              href={c.path}
              className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-ink-900 transition hover:border-ocean-500 hover:text-ocean-700"
            >
              <span className="font-medium">{c.title}</span>
              <span aria-hidden="true" className="text-ocean-600">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="mx-auto max-w-5xl px-4 pt-14">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Closest to the beach, compared</h2>
        <p className="mt-2 max-w-prose text-ink-700">The most central places to stay, side by side.</p>
        <div className="mt-6">
          <ComparisonTable properties={nearest} />
        </div>
      </section>

      {/* By area */}
      <section id="areas" className="mx-auto max-w-5xl px-4 pt-14">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Choose your area</h2>
        <p className="mt-2 max-w-prose text-ink-700">
          The single biggest decision is which part of Bondi you base yourself in.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {AREAS.map((a) => {
            const count = propertiesByArea(a.slug).length;
            return (
              <div key={a.slug} className="rounded-xl border border-sand-200 bg-white p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg text-ink-900">{a.name}</h3>
                  <span className="shrink-0 text-xs text-ink-500">{a.toBeach}</span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{a.blurb}</p>
                {count > 0 && <p className="mt-2 text-xs text-ink-500">{count} {count === 1 ? 'place' : 'places'} listed</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-ink-700">
          Torn between the two most common choices?{' '}
          <Link href="/stay/bondi-beach-vs-bondi-junction" className="text-ocean-700 underline">Bondi Beach vs Bondi Junction →</Link>
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pt-6">
        <Faq items={FAQS} />
      </section>

      {/* Make the most of your stay */}
      <section className="mx-auto max-w-5xl px-4 pb-6">
        <h2 className="font-display text-2xl text-ink-900">Make the most of your stay</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
            { title: 'Where to eat & drink', path: '/bondi-eat-and-drink' },
            { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
            { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
            { title: 'Getting to Bondi', path: '/getting-to-bondi' },
            { title: 'Bondi with kids', path: '/bondi-with-kids' },
          ].map((l) => (
            <li key={l.path}>
              <Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-12">
        <AffiliateDisclosure />
      </div>
    </div>
  );
}
