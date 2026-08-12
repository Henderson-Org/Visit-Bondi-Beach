import Link from 'next/link';
import { upcomingEvents, sydneyToday, passesDateFilter, type DateFilter } from '@/lib/events';
import { EventCard } from './EventCard';

/**
 * Reusable "what's on" module - drop it into any page to surface current events
 * (e.g. "What's on this weekend" on the homepage or a guide). Server-rendered and
 * date-aware; renders nothing when there's nothing to show.
 */
export function UpcomingEvents({
  heading = "What's on in Bondi",
  filter,
  limit = 3,
  moreHref = '/whats-on',
  moreLabel = "See what's on →",
}: {
  heading?: string;
  filter?: DateFilter;
  limit?: number;
  moreHref?: string;
  moreLabel?: string;
}) {
  const today = sydneyToday();
  let list = upcomingEvents(today);
  if (filter) list = list.filter((r) => passesDateFilter(r.event, filter, today));
  list = list.slice(0, limit);
  if (list.length === 0) return null;

  return (
    <section aria-label={heading}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">{heading}</h2>
        <Link href={moreHref} className="shrink-0 text-sm text-ocean-700 hover:underline">{moreLabel}</Link>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <EventCard key={r.event.slug} resolved={r} />
        ))}
      </div>
    </section>
  );
}
