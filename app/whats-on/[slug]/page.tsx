import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialHero } from '@/components/EditorialHero';
import { EventCard } from '@/components/events/EventCard';
import { GlanceItem } from '@/components/stay/primitives';
import { isProduction, siteOrigin } from '@/lib/site';
import { breadcrumbJsonLd, eventJsonLd } from '@/lib/structured-data';
import {
  getEvent,
  eventSlugs,
  CATEGORY_LABEL,
  AUDIENCE_LABEL,
  type BondiEvent,
} from '@/data/events';
import {
  sydneyToday,
  sydneyOffset,
  resolveEvent,
  upcomingEvents,
  whenLabel,
  formatEventDateLong,
  formatTime,
} from '@/lib/events';

export const dynamicParams = false;
export const revalidate = 1800;

export function generateStaticParams() {
  return eventSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) return { title: 'Event not found' };
  return {
    title: `${e.title} — Bondi Beach`,
    description: e.summary,
    alternates: { canonical: `/whats-on/${slug}` },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: e.title, description: e.summary, type: 'website', images: e.image || undefined },
  };
}

function priceLine(e: BondiEvent): string {
  if (e.priceType === 'free') return 'Free';
  if (e.priceType === 'paid') return e.price || 'Ticketed — see official site';
  return 'Varies — see official site';
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) notFound();

  const today = sydneyToday();
  const r = resolveEvent(e, today);
  const path = `/whats-on/${slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: "What's On", path: '/whats-on' },
    { name: e.title, path },
  ];

  // Event schema only when we have a concrete date — never fabricate one.
  const startIso = r.nextDate ? `${r.nextDate}${e.startTime ? `T${e.startTime}:00${sydneyOffset(r.nextDate)}` : ''}` : null;
  const eventLd = startIso
    ? eventJsonLd({
        name: e.title,
        description: e.summary,
        startDate: startIso,
        url: `${siteOrigin()}${path}`,
        venue: e.venue,
        suburb: e.suburb,
        address: e.address,
        status: e.status,
        priceType: e.priceType,
        ticketUrl: e.ticketUrl,
        organiser: e.organiser,
        officialUrl: e.officialUrl,
      })
    : null;

  const related = upcomingEvents(today).filter((x) => x.event.slug !== e.slug).slice(0, 3);
  const cta = e.ticketUrl || e.officialUrl;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      {eventLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />}

      <EditorialHero
        image={e.image ?? null}
        kicker={e.categories.map((c) => CATEGORY_LABEL[c]).slice(0, 2).join(' · ')}
        title={e.title}
        intro={e.summary}
        crumbs={crumbs}
      />

      <div className="mx-auto max-w-3xl px-4 pt-8">
        {/* When / where / price at a glance */}
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <GlanceItem label="When" value={r.nextDate ? whenLabel(r) : e.whenText || 'To be confirmed'} />
          <GlanceItem label="Where" value={e.venue} />
          <GlanceItem label="Price" value={priceLine(e)} />
          <GlanceItem label="Good for" value={e.audience.map((a) => AUDIENCE_LABEL[a]).join(' · ')} />
        </dl>

        {e.datesToConfirm && (
          <p className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-500/5 px-4 py-3 text-sm text-ink-700">
            This is an annual event — {e.whenText?.toLowerCase()}. Exact dates change each year, so
            confirm on the official site before planning around it.
          </p>
        )}

        {cta && (
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={cta} target="_blank" rel="nofollow noopener" className="inline-flex items-center gap-1.5 rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700">
              {e.ticketUrl ? 'Tickets & info' : 'Official event site'} <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}

        {/* Detail */}
        <div className="prose-editorial mt-8">
          {e.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          {r.nextDate && (
            <>
              <h2>When is it?</h2>
              <p>
                Next on <strong>{formatEventDateLong(r.nextDate)}</strong>
                {e.startTime && <> from {formatTime(e.startTime)}{e.endTime && <> to {formatTime(e.endTime)}</>}</>}.
                {e.recurrence?.freq === 'weekly' && <> It runs {e.whenText?.toLowerCase()}.</>}
              </p>
            </>
          )}

          <h2>Where is it?</h2>
          <p>{e.venue}{e.address ? `, ${e.address}` : `, ${e.suburb}`}.</p>
        </div>

        {/* Related Bondi content */}
        {e.relatedArticles && e.relatedArticles.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl text-ink-900">Related Bondi guides</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {e.relatedArticles.map((l) => (
                <li key={l.path}><Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link></li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 border-t border-sand-200 pt-4 text-sm text-ink-500">
          Last verified{' '}
          <time dateTime={e.lastVerified}>
            {new Date(e.lastVerified).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
          {e.source && (
            <> · <a href={e.source} target="_blank" rel="nofollow noopener" className="text-ocean-700 underline">Source</a></>
          )}
          . Event details can change — always confirm with the organiser.
        </p>
      </div>

      {/* Related events */}
      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-10">
          <h2 className="font-display text-2xl text-ink-900">More events in Bondi</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <EventCard key={x.event.slug} resolved={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
