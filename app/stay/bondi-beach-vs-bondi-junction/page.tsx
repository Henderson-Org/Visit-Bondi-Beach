import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { AffiliateButton } from '@/components/stay/AffiliateButton';
import { AffiliateDisclosure } from '@/components/stay/AffiliateDisclosure';
import { isProduction, seoTitle } from '@/lib/site';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/structured-data';
import { getAffiliateLink } from '@/lib/affiliate';

const TITLE = 'Bondi Beach vs Bondi Junction: Where Should You Stay?';
const DESCRIPTION =
  'Bondi Beach or Bondi Junction? A local compares the two on price, transport, walk to the sand, food and who each suits - so you can pick the right base for your Sydney trip.';
const HERO = '/images/articles/1f09a7008740b014.webp';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: seoTitle(TITLE),
    description: DESCRIPTION,
    alternates: { canonical: '/stay/bondi-beach-vs-bondi-junction' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', images: HERO },
  };
}

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Stay', path: '/stay' },
  { name: 'Bondi Beach vs Bondi Junction', path: '/stay/bondi-beach-vs-bondi-junction' },
];

const ROWS: { label: string; beach: string; junction: string }[] = [
  { label: 'Walk to the sand', beach: 'On the beach or a few minutes away', junction: '≈10 min bus, or 25–30 min walk downhill' },
  { label: 'Transport', beach: 'Buses only (no train to the beach)', junction: 'Train line ends here - easiest from airport/city' },
  { label: 'Typical value', beach: 'Higher - you pay for the location', junction: 'Better value for the same standard of room' },
  { label: 'Atmosphere', beach: 'Beachy, busy, buzzy', junction: 'Urban, shops and towers, quieter at night' },
  { label: 'Food & drink', beach: 'Cafés, beach bars, the coastal-walk cafés', junction: 'Big shopping-centre and high-street dining' },
  { label: 'Best for', beach: 'First-timers, short trips, beach lovers', junction: 'Value, longer stays, easy arrivals' },
];

const FAQS = [
  {
    q: 'Is Bondi Junction close to Bondi Beach?',
    a: 'Yes - it is about a 10-minute bus ride down to the beach, or a 25–30 minute walk downhill (the walk back up is the catch). Buses run frequently along the route.',
  },
  {
    q: 'Is it cheaper to stay in Bondi Junction than at the beach?',
    a: 'Usually. For a similar standard of room you generally pay less in Bondi Junction than on the Campbell Parade beachfront, which is why it is a popular value pick - you trade a short bus ride for a lower rate.',
  },
  {
    q: 'Which is better if I fly into Sydney Airport?',
    a: 'Bondi Junction is easier: take the train from the airport and Bondi Junction is where the line ends, so you arrive with your bags without changing to a bus. From the beachfront you would still finish the trip on a bus.',
  },
  {
    q: 'Do I need a car in either area?',
    a: 'No. Both are well connected by public transport and the beach, pools, coastal walk and cafés are walkable from the beachfront. Parking near the sand is limited and paid.',
  },
];

export default function BeachVsJunction() {
  const beachSearch = getAffiliateLink({ provider: 'booking', destination: 'Bondi Beach', campaign: 'vs-beach' });
  const junctionSearch = getAffiliateLink({ provider: 'booking', destination: 'Bondi Junction, Sydney', campaign: 'vs-junction' });

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />

      <EditorialHero
        image={HERO}
        kicker="Stay · Compare"
        title={TITLE}
        intro="The two areas most visitors weigh up. One puts you on the sand; the other is easier to reach and kinder on the wallet. Here's how they really compare."
        crumbs={CRUMBS}
      />

      <div className="mx-auto max-w-3xl px-4 pt-10">
        <p className="text-lg text-ink-700">
          If you&rsquo;re booking Bondi for the first time, this is the choice that trips people up.
          Bondi Beach is the postcard - you step out onto Campbell Parade and the sand is right
          there. Bondi Junction is the transport and shopping hub up the hill, where the train line
          ends. Neither is wrong; it depends on what you want from the trip.
        </p>
      </div>

      {/* Comparison table */}
      <section className="mx-auto max-w-4xl px-4 pt-8">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Side by side</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-300 text-left">
                <th className="py-3 pr-4 font-medium text-ink-500"> </th>
                <th className="py-3 pr-4 font-display text-base text-ink-900">Bondi Beach</th>
                <th className="py-3 font-display text-base text-ink-900">Bondi Junction</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-sand-200 align-top">
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-ink-700">{r.label}</th>
                  <td className="py-3 pr-4 text-ink-700">{r.beach}</td>
                  <td className="py-3 text-ink-700">{r.junction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verdict + search CTAs */}
      <section className="mx-auto max-w-4xl px-4 pt-10">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-sand-200 bg-white p-5">
            <h3 className="font-display text-lg text-ink-900">Stay at Bondi Beach if…</h3>
            <p className="mt-2 text-sm text-ink-700">
              It&rsquo;s a short trip, it&rsquo;s your first time, or waking up by the water is the
              whole point. You&rsquo;ll pay more, but you&rsquo;ll walk everywhere.
            </p>
            <div className="mt-4">
              <AffiliateButton
                href={beachSearch.href}
                label={beachSearch.label}
                cta="Search Bondi Beach stays"
                provider="booking"
                page="vs-beach-junction"
                placement="vs-beach"
                ctaId="search_area"
              />
            </div>
          </div>
          <div className="rounded-xl border border-sand-200 bg-white p-5">
            <h3 className="font-display text-lg text-ink-900">Stay at Bondi Junction if…</h3>
            <p className="mt-2 text-sm text-ink-700">
              You want better value, you&rsquo;re here a while, or you&rsquo;re arriving by train
              from the airport and don&rsquo;t want to juggle bags onto a bus.
            </p>
            <div className="mt-4">
              <AffiliateButton
                href={junctionSearch.href}
                label={junctionSearch.label}
                cta="Search Bondi Junction stays"
                provider="booking"
                page="vs-beach-junction"
                placement="vs-junction"
                ctaId="search_area"
              />
            </div>
          </div>
        </div>
        <div className="mt-5">
          <AffiliateDisclosure compact />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-4">
        <Faq items={FAQS} />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        <p className="text-sm text-ink-700">
          Still deciding?{' '}
          <Link href="/stay" className="text-ocean-700 underline">See all Bondi areas and places to stay</Link>
          {' · '}
          <Link href="/getting-to-bondi" className="text-ocean-700 underline">How to get to Bondi</Link>
        </p>
        <div className="mt-6">
          <AffiliateDisclosure />
        </div>
      </section>
    </div>
  );
}
