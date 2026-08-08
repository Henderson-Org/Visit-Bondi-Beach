import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { EventCard } from '@/components/events/EventCard';
import { EventBrowser } from '@/components/events/EventBrowser';
import { isProduction } from '@/lib/site';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { upcomingEvents, sydneyToday, buildEventFacet } from '@/lib/events';
import { EVENTS, type EventCategory, type Audience } from '@/data/events';

const TITLE = "What's On in Bondi";
const DESCRIPTION =
  "What's on in Bondi Beach — markets, festivals, sport, arts and family events. Find what's happening today, this weekend and coming up, with free and family-friendly picks.";
const HERO = '/images/articles/41ae0d79fa63d41a.webp';

export const revalidate = 1800; // keep "today / this weekend" fresh

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/whats-on' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', images: HERO },
  };
}

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: "What's On", path: '/whats-on' },
];

const SHORTCUTS = [
  { label: 'Today', href: '/whats-on/today' },
  { label: 'This weekend', href: '/whats-on/this-weekend' },
  { label: 'Free', href: '/whats-on/free' },
  { label: 'Markets', href: '/whats-on/markets' },
];

const FAQS = [
  { q: "What's on in Bondi today?", a: "See today's events on our What's On Today page. Bondi's regular fixtures are the Saturday Bondi Farmers Market and the Sunday Bondi Markets; bigger events like Sculpture by the Sea, City2Surf and Festival of the Winds run at set times each year." },
  { q: "What's on in Bondi this weekend?", a: 'Most weekends you can count on the Bondi Farmers Market on Saturday and the Bondi Markets on Sunday, both at Bondi Beach Public School on Campbell Parade. Check our This Weekend page for the current line-up.' },
  { q: 'Are there free events in Bondi?', a: 'Yes — the weekly markets are free to enter, and major events like Sculpture by the Sea and Festival of the Winds are free to visit. See our Free events page.' },
  { q: 'What events in Bondi are good for families?', a: 'The weekend markets, Festival of the Winds (a free kite festival) and Sculpture by the Sea are all family-friendly. Use the “With kids” filter to find them.' },
];

export default function WhatsOnHub() {
  const today = sydneyToday();
  const upcoming = upcomingEvents(today);
  const facets = upcoming.map((r) => buildEventFacet(r.event, today));
  const featured = upcoming.filter((r) => r.event.featured).slice(0, 3);

  const categories: EventCategory[] = Array.from(new Set(EVENTS.flatMap((e) => e.categories)));
  const audiences: Audience[] = Array.from(new Set(EVENTS.flatMap((e) => e.audience)));

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("What's on in Bondi", upcoming.map((r) => ({ name: r.event.title, description: r.event.summary })))) }} />

      <EditorialHero
        image={HERO}
        kicker="What's On"
        title={TITLE}
        intro="Markets, festivals, sport and art by the beach — here's what's happening in Bondi. Jump to today or this weekend, or filter by what you're after."
        crumbs={CRUMBS}
      />

      {/* Quick shortcuts to the indexable date/intent landing pages */}
      <section className="mx-auto max-w-5xl px-4 pt-8">
        <nav aria-label="Quick links" className="flex flex-wrap gap-2">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-ink-800 transition hover:border-ocean-500 hover:text-ocean-700">
              {s.label}
            </Link>
          ))}
        </nav>
      </section>

      {/* Featured spotlight (editorial; does not affect the chronological browser below) */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-8">
          <h2 className="font-display text-xl text-ink-900">Bondi highlights</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <EventCard key={r.event.slug} resolved={r} />
            ))}
          </div>
        </section>
      )}

      {/* Browse + filter (chronological) */}
      <section className="mx-auto max-w-5xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">All upcoming events</h2>
        <p className="mt-2 max-w-prose text-ink-700">Filter by when you&rsquo;re around, what you&rsquo;re into, or tap “Free”. Events are ordered soonest first.</p>
        <div className="mt-6">
          <EventBrowser facets={facets} categories={categories} audiences={audiences}>
            {upcoming.map((r) => (
              <EventCard key={r.event.slug} resolved={r} />
            ))}
          </EventBrowser>
        </div>
      </section>

      {/* FAQ (AEO) */}
      <section className="mx-auto max-w-3xl px-4 pt-12">
        <Faq items={FAQS} />
      </section>

      {/* Crawlable editorial context + internal links (kept below discovery) */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <h2 className="font-display text-2xl text-ink-900">About what&rsquo;s on in Bondi</h2>
        <p className="mt-3 text-ink-700">
          Bondi Beach has something on all year round. Weekends revolve around the markets — the Bondi
          Farmers Market on Saturday and the original Bondi Markets on Sunday — while the calendar’s big
          moments include Sculpture by the Sea each spring, the City2Surf finish on the sand, and
          Festival of the Winds. We list the events we can verify, with a source and a last-checked date;
          always confirm exact dates on the official site before planning around them.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { title: 'Things to do in Bondi', path: '/things-to-do-in-bondi' },
            { title: 'Where to eat & drink', path: '/bondi-eat-and-drink' },
            { title: 'Bondi with kids', path: '/bondi-with-kids' },
            { title: 'Getting to Bondi', path: '/getting-to-bondi' },
            { title: 'Bondi articles & guides', path: '/articles' },
            { title: 'Where to stay in Bondi', path: '/stay' },
          ].map((l) => (
            <li key={l.path}><Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
