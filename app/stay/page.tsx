import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { AccommodationCard } from '@/components/stay/AccommodationCard';
import { AffiliateDisclosure } from '@/components/stay/AffiliateDisclosure';
import { isProduction } from '@/lib/site';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
} from '@/lib/structured-data';
import {
  AREAS,
  PROPERTIES,
  TRAVELLER_LABEL,
  propertiesByArea,
  type TravellerType,
} from '@/data/accommodation';

const TITLE = 'Where to Stay in Bondi Beach';
const DESCRIPTION =
  'Where to stay in Bondi Beach, from a local: how the areas compare (beachfront, North Bondi, Bondi Junction), who each suits, and a hand-picked shortlist of places to book — hotels, apartments and hostels.';
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

const FAQS = [
  {
    q: 'Where is the best area to stay in Bondi?',
    a: 'For your first visit, stay on or just behind Campbell Parade at Bondi Beach itself — you wake up by the sand, the cafés and the start of the coastal walk. For better value and the easiest transport (the train ends there), stay in Bondi Junction, about a 10-minute bus down to the beach. North Bondi is calmer and good for families; Tamarama and Bronte suit couples who want the Eastern Beaches without the crowds.',
  },
  {
    q: 'Is it better to stay in Bondi Beach or Bondi Junction?',
    a: 'Bondi Beach puts you on the sand but is busier and usually pricier. Bondi Junction is uphill by the train and shopping centre — generally better value and easier to reach from the airport, but a short bus or 25–30 minute walk from the water. We compare the two in detail on our Bondi Beach vs Bondi Junction guide.',
  },
  {
    q: 'Do I need a car if I stay in Bondi?',
    a: 'No. Bondi is well served by buses and the train to Bondi Junction, and most of what visitors come for — the beach, the pools, the coastal walk and the cafés — is walkable. Parking near the beach is limited and paid, so many visitors skip the car entirely.',
  },
  {
    q: 'How far in advance should I book?',
    a: 'Bondi is busiest over the Sydney summer (December to February) and around events like the City2Surf, so book well ahead for those dates. Outside peak, a few weeks is usually plenty. Use the booking links here to check current prices and availability.',
  },
];

const TRAVELLERS: { key: TravellerType; blurb: string }[] = [
  { key: 'first-time', blurb: 'Stay on Campbell Parade so the beach, the walk and the cafés are on your doorstep.' },
  { key: 'families', blurb: 'North Bondi and serviced apartments give you space, a kitchen and a calmer end of the beach.' },
  { key: 'budget', blurb: 'Bondi Junction and the beachfront hostels keep costs down without stranding you from the sand.' },
  { key: 'couples', blurb: 'A boutique hotel near the beach, or quieter Tamarama and Bronte one beach south.' },
  { key: 'long-stay', blurb: 'Serviced apartments with a kitchen and laundry work best for a week or more.' },
  { key: 'groups', blurb: 'Apartments and hostels near Campbell Parade keep everyone together and near the nightlife.' },
];

export default function StayHub() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              'Places to stay in Bondi Beach',
              PROPERTIES.map((p) => ({ name: p.name, description: p.summary }))
            )
          ),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker="Stay"
        title={TITLE}
        intro="Bondi is small, so where you stay changes your whole trip more than the exact address does. Here's how the areas differ, who each one suits, and a shortlist of places worth booking — written by locals, not a booking engine."
        crumbs={CRUMBS}
        chips={[
          { label: 'Choose an area', href: '#areas' },
          { label: 'Places to stay', href: '#places' },
          { label: 'By traveller', href: '#travellers' },
          { label: 'FAQ', href: '#faq' },
        ]}
      />

      {/* Choose your area */}
      <section id="areas" className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Choose your area first</h2>
        <p className="mt-2 max-w-prose text-ink-700">
          The single biggest decision is which part of Bondi you base yourself in. Pick the area,
          then the right place to stay is easy.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {AREAS.map((a) => (
            <div key={a.slug} className="rounded-xl border border-sand-200 bg-white p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg text-ink-900">{a.name}</h3>
                <span className="shrink-0 text-xs text-ink-500">{a.toBeach}</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">{a.blurb}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Best for">
                {a.bestFor.map((t) => (
                  <li key={t} className="rounded-full border border-sand-200 px-2 py-0.5 text-[11px] text-ink-500">
                    {TRAVELLER_LABEL[t]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-700">
          Torn between the two most common choices?{' '}
          <Link href="/stay/bondi-beach-vs-bondi-junction" className="text-ocean-700 underline">
            Read our Bondi Beach vs Bondi Junction comparison →
          </Link>
        </p>
      </section>

      {/* Places to stay, grouped by area */}
      <section id="places" className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Places to stay in Bondi</h2>
        <p className="mt-2 max-w-prose text-ink-700">
          A short, honest shortlist of well-established places, grouped by area. We don&rsquo;t
          publish our own star ratings — tap through to check current prices, availability and
          guest reviews on the booking sites.
        </p>
        <div className="mt-5">
          <AffiliateDisclosure compact />
        </div>
        {AREAS.map((a) => {
          const props = propertiesByArea(a.slug);
          if (props.length === 0) return null;
          return (
            <div key={a.slug} className="mt-8">
              <h3 className="font-display text-xl text-ink-900">{a.name}</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {props.map((p) => (
                  <AccommodationCard key={p.slug} property={p} campaign="stay-hub" />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* By traveller type */}
      <section id="travellers" className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Where to stay by traveller</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TRAVELLERS.map((t) => (
            <div key={t.key} className="rounded-xl border border-sand-200 bg-white p-4">
              <p className="font-medium text-ink-900">{TRAVELLER_LABEL[t.key]}</p>
              <p className="mt-1 text-sm text-ink-700">{t.blurb}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-700">
          Travelling on a budget or in a group?{' '}
          <Link href="/stay/hostels-bondi-beach" className="text-ocean-700 underline">
            See the best hostels in Bondi Beach →
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pt-4">
        <Faq items={FAQS} />
      </section>

      {/* Keep exploring */}
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
              <Link href={l.path} className="text-ocean-700 hover:underline">
                {l.title} →
              </Link>
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
