import type { Metadata } from 'next';
import Link from 'next/link';
import {
  activeVenues,
  casualFriendlyVenues,
  indexableCollections,
  venuesForCollection,
  byVisitorUsefulness,
  venuesInSuburb,
} from '@/lib/fitness';
import { FitnessVenueCard } from '@/components/fitness/FitnessVenueCard';
import { FitnessMap } from '@/components/fitness/FitnessMap';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, collectionPageJsonLd } from '@/lib/structured-data';

export const revalidate = 86400;

const TITLE = 'Fitness in Bondi: Gyms, Pilates, Yoga & Ocean Swimming';
const DESC =
  'Where to train around Bondi — gyms, pilates and yoga studios, ocean pools and outdoor workouts, each with its real suburb, and which ones take a casual visit while you are here.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: '/fitness' },
  openGraph: { title: TITLE, description: DESC, type: 'website', url: '/fitness' },
  twitter: { title: TITLE, description: DESC },
};

const FAQ = [
  {
    q: 'Can I train in Bondi without joining a gym?',
    a: 'Yes, at several places. Beachouse Bondi lists single entry passes, The Well Bondi publishes single sessions and packs, and the yoga and pilates studios around Hall Street and Curlewis Street run drop-in classes and intro packs. Prices change, so check the venue’s own site — but a one-off session while you are visiting is normal here, not unusual.',
  },
  {
    q: 'What is the difference between Bondi Beach and Bondi Junction for fitness?',
    a: 'They are two separate suburbs about 2.5 km apart. Bondi Beach has smaller studios and gyms within a short walk of the sand, built around people who train and then swim. Bondi Junction is the inland transport and shopping centre, where the large indoor clubs are. A Bondi Junction gym is not walkable from the beach with a gym bag — it is a bus ride.',
  },
  {
    q: 'Where can I swim laps at Bondi?',
    a: 'The Bondi Icebergs Club pool at the southern end of the beach is the well-known option — a 50m saltwater pool cut into the rocks, open daily except Thursdays when it closes for cleaning. It is a real ocean pool, so conditions depend on the swell.',
  },
  {
    q: 'Where can I do reformer pilates in Bondi?',
    a: 'Pilates is the densest category here. At Bondi Beach the studios sit on Hall Street and Curlewis Street a block back from the sand; in Bondi Junction they cluster along Oxford Street near the interchange. Most publish an intro offer for new clients.',
  },
  {
    q: 'What can I do outdoors, for free?',
    a: 'The Bondi to Bronte coastal walk is the run everyone does, and the beach itself is the training ground for most of the outdoor groups you will see at dawn. Neither costs anything, and both are better early — before about 9am the promenade belongs to people exercising.',
  },
];

export default function FitnessHubPage() {
  const all = activeVenues().sort(byVisitorUsefulness);
  const casual = casualFriendlyVenues();
  const collections = indexableCollections();
  const beach = venuesInSuburb('bondi-beach');
  const junction = venuesInSuburb('bondi-junction');

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Fitness & wellness', path: '/fitness' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            collectionPageJsonLd({ name: TITLE, description: DESC, path: '/fitness', itemCount: all.length })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              'Fitness venues around Bondi',
              all.map((v) => ({ name: v.name, description: v.description, url: `/fitness/venues/${v.id}` })),
              'SportsActivityLocation'
            )
          ),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }} />

      <Breadcrumbs items={crumbs} />

      <header className="mt-2 max-w-prose">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ocean-700">Fitness &amp; wellness</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink-900 md:text-4xl">
          Training in Bondi, from someone who does it here
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-700">
          Bondi takes exercise more seriously than almost anywhere in Sydney, and the options are better than the
          beachfront suggests — most of the good studios are a block or two back, where the rent is survivable. This is
          every gym, studio and pool around here that we have verified against its own official site, with the one fact
          those listings usually get wrong: which suburb it is actually in.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
          <strong>Bondi Beach and Bondi Junction are not the same place.</strong> They are separate suburbs about 2.5 km
          apart, and plenty of &ldquo;Bondi&rdquo; gyms are in the shopping centre inland, not by the sand. Every listing
          below says which.
        </p>
      </header>

      {/* Casual-visit answer first: it is the single most common visitor question. */}
      <section aria-labelledby="casual" className="mt-8 rounded-2xl border border-ocean-500/25 bg-ocean-500/5 p-5 sm:p-6">
        <h2 id="casual" className="font-display text-xl text-ink-900">
          Just visiting? Start here
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-700">
          {casual.length} of the {all.length} venues we have verified publish a way to train without joining — a single
          session, a day pass, a drop-in class or a trial. Prices move constantly, so we do not print them; each venue
          links straight to its own site.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {casual.map((v) => (
            <li key={v.id}>
              <Link
                href={`/fitness/venues/${v.id}`}
                className="inline-flex min-h-[40px] items-center rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-ocean-400 hover:text-ocean-700"
              >
                {v.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories" className="mt-10">
        <h2 id="categories" className="font-display text-2xl text-ink-900 md:text-3xl">
          Browse by what you want to do
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c) => (
            <Link
              key={c.slug}
              href={`/fitness/${c.slug}`}
              className="rounded-2xl border border-sand-200 bg-white p-5 transition hover:border-ocean-400"
            >
              <h3 className="font-display text-lg text-ink-900">{c.h1}</h3>
              <p className="mt-1 text-xs text-ink-500">{venuesForCollection(c).length} verified venues</p>
            </Link>
          ))}
          <Link
            href="/fitness/bondi-beach-or-bondi-junction"
            className="rounded-2xl border border-sand-200 bg-sand-50 p-5 transition hover:border-ocean-400"
          >
            <h3 className="font-display text-lg text-ink-900">Bondi Beach or Bondi Junction?</h3>
            <p className="mt-1 text-xs text-ink-500">Which one you actually want</p>
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <FitnessMap />
      </div>

      {/* The full directory, grouped by real suburb. Server-rendered, no JS required. */}
      <section aria-labelledby="directory" className="mt-12">
        <h2 id="directory" className="font-display text-2xl text-ink-900 md:text-3xl">
          Every venue we have verified
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-700">
          Grouped by suburb, because that is the decision that matters first. Each was checked against its own official
          site — where a venue does not publish something, we say so rather than guessing.
        </p>

        <h3 className="mt-8 font-display text-xl text-ink-900">
          Bondi Beach <span className="text-base font-normal text-ink-500">— {beach.length} venues, walk to the sand</span>
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beach.sort(byVisitorUsefulness).map((v) => (
            <FitnessVenueCard key={v.id} venue={v} />
          ))}
        </div>

        <h3 className="mt-10 font-display text-xl text-ink-900">
          Bondi Junction{' '}
          <span className="text-base font-normal text-ink-500">— {junction.length} venues, 2.5 km inland</span>
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {junction.sort(byVisitorUsefulness).map((v) => (
            <FitnessVenueCard key={v.id} venue={v} />
          ))}
        </div>
      </section>

      {/* Outdoors: real, free, and already covered elsewhere on the site. */}
      <section aria-labelledby="outdoors" className="mt-12 rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
        <h2 id="outdoors" className="font-display text-xl text-ink-900 md:text-2xl">
          Outdoors, and free
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink-700">
          The best training in Bondi costs nothing. The coastal walk south to Bronte is the run every local does — steps,
          headlands and a swim at the end. The beach itself is where the dawn groups train, and the promenade before 9am
          belongs almost entirely to people exercising.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li>
            <Link href="/bondi-coastal-walk" className="text-ocean-700 hover:underline">
              The Bondi to Bronte coastal walk →
            </Link>
          </li>
          <li>
            <Link href="/city2surf-and-running" className="text-ocean-700 hover:underline">
              Running routes and City2Surf →
            </Link>
          </li>
          <li>
            <Link href="/where-to-swim-at-bondi-beach" className="text-ocean-700 hover:underline">
              Where to swim safely →
            </Link>
          </li>
          <li>
            <Link href="/bondi-weather" className="text-ocean-700 hover:underline">
              Today&rsquo;s conditions →
            </Link>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="mt-12">
        <h2 id="faq" className="font-display text-2xl text-ink-900 md:text-3xl">
          Common questions
        </h2>
        <dl className="mt-5 space-y-5">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-sand-200 bg-white p-5">
              <dt className="font-display text-lg text-ink-900">{f.q}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-ink-700">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-xs text-ink-500">
        Every venue on this page was checked against its own official website. We publish no prices, ratings or reviews —
        prices change weekly and we do not collect ratings. Planning the rest of the day?{' '}
        <Link href="/bondi-eat-and-drink" className="text-ocean-700 hover:underline">
          Where to eat afterwards
        </Link>{' '}
        or{' '}
        <Link href="/plan" className="text-ocean-700 hover:underline">
          build a day around it
        </Link>
        .
      </p>
    </main>
  );
}
