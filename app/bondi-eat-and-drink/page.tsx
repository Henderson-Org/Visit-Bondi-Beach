import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { RestaurantCard } from '@/components/eat/RestaurantCard';
import { RestaurantBrowser } from '@/components/eat/RestaurantBrowser';
import { isProduction, seoTitle } from '@/lib/site';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { restaurants, byScore, cuisineFacets, PRECINCT_LABEL } from '@/data/restaurants';
import {
  facetFor,
  bestOfCollections,
  areaPageFor,
  availableTypes,
  availablePrecincts,
  availableMeals,
  availableSuitability,
  availableAttributes,
  availableDietary,
  venuePageHref,
} from '@/lib/restaurantGuide';

const TITLE = 'Where to Eat & Drink in Bondi Beach';
const DESCRIPTION =
  'The complete local guide to eating and drinking in Bondi Beach - every café, restaurant, bar and bakery worth knowing, searchable and filterable, with honest picks and what to order.';
const HERO = '/images/articles/e7f1fa0c61315488.webp';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: seoTitle(TITLE),
    description: DESCRIPTION,
    alternates: { canonical: '/bondi-eat-and-drink' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', images: HERO },
  };
}

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Eat & Drink', path: '/bondi-eat-and-drink' },
];

const FAQS = [
  {
    q: 'Where should I eat in Bondi Beach?',
    a: 'For a beachfront meal with a view, Icebergs and the venues along the promenade are the icons; for the best food, look a block back on Hall Street and Gould Street in North Bondi, where the neighbourhood restaurants are. For brunch, Bondi does it as well as anywhere in Sydney. Use the filters above to narrow by area, meal, price or who you’re with.',
  },
  {
    q: 'What is Bondi Beach known for food-wise?',
    a: 'Bondi is best known for all-day cafés and modern-Australian brunch, excellent coffee, fresh seafood and a strong Mediterranean and Middle Eastern streak, plus a growing line-up of beachfront bars. It’s also one of the best areas in Sydney for vegan and vegetarian eating.',
  },
  {
    q: 'Where is the best beachfront dining in Bondi?',
    a: 'The venues directly on Campbell Parade and above the beach - Icebergs above the pool, and the bars and restaurants along the promenade - have the genuine ocean views. Many places one street back are excellent but don’t see the water, so filter by “Ocean views” if the view matters to you.',
  },
  {
    q: 'Do I need to book restaurants in Bondi?',
    a: 'For the popular sit-down restaurants and anywhere beachfront on a weekend or over summer, yes - book ahead. Cafés, bakeries and takeaways are walk-in. Where a venue takes bookings, we link straight to its reservation page.',
  },
];

export default function EatDrinkHub() {
  const all = [...restaurants()].sort(byScore);
  const facets = all.map(facetFor);
  const cuisineOptions = cuisineFacets()
    .filter((c) => c.value && c.value !== '-' && c.count >= 2)
    .slice(0, 14)
    .map((c) => c.value);

  const options = {
    types: availableTypes(all),
    precincts: availablePrecincts(all),
    meals: availableMeals(all),
    suitability: availableSuitability(all),
    attributes: availableAttributes(all),
    dietary: availableDietary(all),
    cuisines: cuisineOptions,
  };

  const precinctCounts = options.precincts.map((p) => ({
    precinct: p,
    label: PRECINCT_LABEL[p],
    count: all.filter((r) => r.precinct === p).length,
  }));

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              'Places to eat and drink in Bondi Beach',
              all.slice(0, 30).map((r) => ({ name: r.name, description: r.summary, url: venuePageHref(r) ?? undefined })),
              'Restaurant',
            ),
          ),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker="Eat & Drink"
        title={TITLE}
        intro="Every place worth knowing in one spot - cafés, restaurants, bars, bakeries and the beachfront icons - verified, searchable and written by locals. Filter by area, meal, price or the mood you’re in."
        crumbs={CRUMBS}
        chips={[
          { label: 'Find a place', href: '#browse' },
          { label: 'Best of', href: '#collections' },
          { label: 'By area', href: '#areas' },
          { label: 'FAQ', href: '#faq' },
        ]}
      />

      {/* Answer-first (AEO) */}
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <h2 className="font-display text-2xl text-ink-900">Where should you eat in Bondi?</h2>
        <p className="mt-3 text-lg leading-relaxed text-ink-700">
          For the <strong className="font-semibold text-ink-900">view</strong>, eat beachfront along Campbell
          Parade and above the pool at Icebergs. For the <strong className="font-semibold text-ink-900">best
          food</strong>, walk a block back to Hall Street and North Bondi&rsquo;s Gould Street. Bondi is a{' '}
          <strong className="font-semibold text-ink-900">brunch</strong> town first, with excellent coffee,
          seafood and some of Sydney&rsquo;s best plant-based eating. Everything below is a real, currently-open
          venue we&rsquo;ve verified - {all.length} of them and counting.
        </p>
      </section>

      {/* Browse with filters */}
      <section id="browse" className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Find somewhere to eat or drink</h2>
        <p className="mt-2 max-w-prose text-ink-700">
          Search or filter the full directory. Tap a venue with a{' '}
          <span className="text-ocean-700">write-up</span> to read our take, what to order and how to book.
        </p>
        <div className="mt-6">
          <RestaurantBrowser facets={facets} options={options}>
            {all.map((r) => (
              <RestaurantCard key={r.id} venue={r} />
            ))}
          </RestaurantBrowser>
        </div>
      </section>

      {/* Collections - browse by need */}
      <section id="collections" className="mx-auto max-w-5xl px-4 pt-14">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Our best-of guides</h2>
        <p className="mt-2 max-w-prose text-ink-700">Hand-picked shortlists for exactly what you&rsquo;re after.</p>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {bestOfCollections().map((c) => (
            <Link
              key={c.slug}
              href={`/bondi-eat-and-drink/${c.slug}`}
              className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-ink-900 transition hover:border-ocean-500 hover:text-ocean-700"
            >
              <span className="font-medium">{c.h1}</span>
              <span aria-hidden="true" className="text-ocean-600">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* By area */}
      <section id="areas" className="mx-auto max-w-5xl px-4 pt-14">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Eat by area</h2>
        <p className="mt-2 max-w-prose text-ink-700">
          Bondi&rsquo;s eating splits by pocket - the beachfront, buzzy Campbell Parade, the Hall Street village
          and quieter North Bondi up around Gould Street. Open an area for everywhere worth knowing there.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {precinctCounts.map((p) => {
            const href = areaPageFor(p.precinct);
            const inner = (
              <>
                {p.label} <span className="text-ink-400">· {p.count}</span>
              </>
            );
            return href ? (
              <Link
                key={p.precinct}
                href={href}
                className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm text-ink-800 transition hover:border-ocean-500 hover:text-ocean-700"
              >
                {inner} <span aria-hidden="true" className="text-ocean-600">→</span>
              </Link>
            ) : (
              <span key={p.precinct} className="rounded-full border border-sand-200 bg-white px-4 py-2 text-sm text-ink-800">
                {inner}
              </span>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pt-14">
        <Faq items={FAQS} />
      </section>

      {/* Plan the rest */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-2xl text-ink-900">Plan the rest of your day</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
            { title: 'Where to stay in Bondi', path: '/stay' },
            { title: 'The Bondi to Coogee coastal walk', path: '/bondi-coastal-walk' },
            { title: 'Where to swim at Bondi', path: '/where-to-swim-at-bondi-beach' },
            { title: 'What’s on in Bondi', path: '/whats-on' },
            { title: 'Getting to Bondi', path: '/getting-to-bondi' },
          ].map((l) => (
            <li key={l.path}>
              <Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
