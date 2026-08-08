import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { AccommodationCard } from '@/components/stay/AccommodationCard';
import { AffiliateButton } from '@/components/stay/AffiliateButton';
import { AffiliateDisclosure } from '@/components/stay/AffiliateDisclosure';
import { isProduction } from '@/lib/site';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { getAffiliateLink } from '@/lib/affiliate';
import { hostels } from '@/data/accommodation';

const TITLE = 'Best Hostels in Bondi Beach';
const DESCRIPTION =
  'A local guide to hostels and backpackers in Bondi Beach — where they are, what to expect, and how to book a cheap bed near the sand without the guesswork.';
const HERO = '/images/articles/0886b63eac692e12.webp';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/stay/hostels-bondi-beach' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', images: HERO },
  };
}

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Stay', path: '/stay' },
  { name: 'Hostels in Bondi Beach', path: '/stay/hostels-bondi-beach' },
];

const FAQS = [
  {
    q: 'Are there hostels right on Bondi Beach?',
    a: 'Yes. Several backpacker hostels sit on or just off Campbell Parade, opposite the sand at the south end of the beach, so you can walk to the water in a couple of minutes.',
  },
  {
    q: 'How much is a hostel bed in Bondi?',
    a: 'Prices move with the season and the type of bed (shared dorm vs private room), and peak over the Sydney summer. Rather than quote a figure that dates quickly, tap through to Hostelworld or Booking.com for current, live prices.',
  },
  {
    q: 'Bondi hostel or Bondi Junction for budget travel?',
    a: 'Hostels on Campbell Parade put you on the beach with a social, backpacker vibe. Bondi Junction can be cheaper for a private room and is easier to reach from the airport, but it is a short bus from the sand. If the beach and the social scene are the point, stay at Bondi.',
  },
  {
    q: 'Do Bondi hostels have private rooms?',
    a: 'Many do, alongside shared dorms — check each hostel&rsquo;s room types when you search. Private rooms cost more than a dorm bed but still less than most hotels.',
  },
];

export default function HostelsBondi() {
  const list = hostels();
  const hostelworldSearch = getAffiliateLink({
    provider: 'hostelworld',
    destination: 'Bondi Beach',
    campaign: 'hostels-all',
  });

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd('Hostels in Bondi Beach', list.map((p) => ({ name: p.name, description: p.summary })))
          ),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker="Stay · Budget"
        title={TITLE}
        intro="Bondi is one of the easier Sydney beaches to do on a budget — there are backpacker hostels a two-minute walk from the sand. Here's where they are and how to book a bed."
        crumbs={CRUMBS}
      />

      <div className="mx-auto max-w-3xl px-4 pt-10">
        <p className="text-lg text-ink-700">
          You don&rsquo;t need a beachfront-hotel budget to wake up near Bondi. A cluster of
          long-running hostels sits along Campbell Parade at the south end of the beach — sociable,
          walkable and right by the buses. Below are the ones worth a look, plus a search for
          everything currently available.
        </p>
      </div>

      <section className="mx-auto max-w-5xl px-4 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Hostels near the sand</h2>
          <AffiliateButton
            href={hostelworldSearch.href}
            label={hostelworldSearch.label}
            cta="See all Bondi hostels"
            provider="hostelworld"
            page="hostels"
            placement="hostels-hero"
            ctaId="see_all_hostels"
          />
        </div>
        <div className="mt-4">
          <AffiliateDisclosure compact />
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <AccommodationCard key={p.slug} property={p} campaign="hostels" />
          ))}
        </div>
      </section>

      {/* What to expect */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">What to expect</h2>
        <ul className="mt-4 space-y-3 text-ink-700">
          <li><span className="font-medium text-ink-900">Location.</span> Most sit on Campbell Parade at the south end, opposite the beach and near the bus stops.</li>
          <li><span className="font-medium text-ink-900">Rooms.</span> A mix of shared dorms and some private rooms — check room types when you search.</li>
          <li><span className="font-medium text-ink-900">Vibe.</span> Social and backpacker-focused; great for solo travellers and groups, busier over summer.</li>
          <li><span className="font-medium text-ink-900">Book ahead.</span> Beds go fast in the Sydney summer and around big events — reserve early for those dates.</li>
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-4">
        <Faq items={FAQS} />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        <p className="text-sm text-ink-700">
          Prefer a room of your own?{' '}
          <Link href="/stay" className="text-ocean-700 underline">See all places to stay in Bondi</Link>
          {' · '}
          <Link href="/stay/bondi-beach-vs-bondi-junction" className="text-ocean-700 underline">Bondi Beach vs Bondi Junction</Link>
        </p>
        <div className="mt-6">
          <AffiliateDisclosure />
        </div>
      </section>
    </div>
  );
}
