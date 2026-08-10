import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { EventCard } from '@/components/events/EventCard';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structured-data';
import type { ResolvedEvent } from '@/lib/events';

/**
 * Shared view for the indexable What's On landing pages (today / this weekend / free /
 * markets). Server-rendered and date-aware. Empty is a valid, useful state here — the
 * page still answers the question ("nothing today, here's the weekend") rather than 404.
 */
export function WhatsOnLandingView({
  slug,
  h1,
  kicker,
  intro,
  events,
  emptyLead,
}: {
  slug: string;
  h1: string;
  kicker: string;
  intro: string;
  events: ResolvedEvent[];
  emptyLead: string;
}) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: "What's On", path: '/whats-on' },
    { name: h1, path: `/whats-on/${slug}` },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      {events.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(h1, events.map((r) => ({ name: r.event.title, description: r.event.summary, url: `/whats-on/${r.event.slug}` })), 'Event')) }} />
      )}

      <EditorialHero image="/images/articles/41ae0d79fa63d41a.webp" kicker={kicker} title={h1} intro={intro} crumbs={crumbs} />

      <section className="mx-auto max-w-5xl px-4 pt-10">
        {events.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((r) => (
              <EventCard key={r.event.slug} resolved={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white p-6 text-center">
            <p className="font-display text-lg text-ink-900">{emptyLead}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/whats-on/this-weekend" className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm text-ink-700 hover:border-ocean-500">What&rsquo;s on this weekend</Link>
              <Link href="/whats-on" className="rounded-full bg-ocean-600 px-4 py-2 text-sm font-medium text-white hover:bg-ocean-700">See all upcoming events</Link>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <nav aria-label="More" className="flex flex-wrap gap-2 text-sm">
          {[
            { label: "All what's on", href: '/whats-on' },
            { label: 'Today', href: '/whats-on/today' },
            { label: 'This weekend', href: '/whats-on/this-weekend' },
            { label: 'Free events', href: '/whats-on/free' },
            { label: 'Markets', href: '/whats-on/markets' },
          ].filter((l) => l.href !== `/whats-on/${slug}`).map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-ink-700 hover:border-ocean-500">{l.label}</Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
