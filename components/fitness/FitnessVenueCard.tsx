import Link from 'next/link';
import { CATEGORY_LABEL, SUBURB_LABEL, fullAddress, type FitnessVenue } from '@/lib/fitness';

/**
 * One venue in a listing. Server-rendered with no client JS, so every venue name, suburb
 * and outbound link is in the HTML a crawler sees.
 *
 * The suburb pill is not decoration. Bondi Junction is a different suburb 2.5km inland
 * from Bondi Beach, and the single most useful - and most often wrong - fact about a
 * venue around here is which of the two it is actually in. It renders on every card.
 */
export function FitnessVenueCard({ venue }: { venue: FitnessVenue }) {
  const beachside = venue.suburb !== 'bondi-junction';
  return (
    <article className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <h3 className="font-display text-lg leading-tight text-ink-900">
          <Link href={`/fitness/venues/${venue.id}`} className="hover:text-ocean-700">
            {venue.name}
          </Link>
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            beachside ? 'bg-ocean-500/10 text-ocean-700' : 'bg-sand-200 text-ink-700'
          }`}
        >
          {SUBURB_LABEL[venue.suburb]}
        </span>
      </div>

      <p className="mt-1 text-xs text-ink-500">{fullAddress(venue)}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{venue.description}</p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {venue.categories.map((c) => (
          <li key={c} className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] text-ink-600">
            {CATEGORY_LABEL[c]}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-700">
        {venue.casualVisit === 'yes' ? (
          <>
            <span className="font-medium text-ink-900">Casual visits:</span>{' '}
            {venue.casualNote ?? 'Published on their site.'}
          </>
        ) : (
          <>
            <span className="font-medium text-ink-900">Casual visits:</span> not published — check with the venue.
          </>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
        <Link
          href={`/fitness/venues/${venue.id}`}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:border-ocean-400 hover:text-ocean-700"
        >
          Details
        </Link>
        <a
          href={venue.bookingUrl ?? venue.websiteUrl}
          target="_blank"
          rel="nofollow noopener"
          className="inline-flex min-h-[40px] items-center rounded-lg bg-ocean-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ocean-700"
        >
          {venue.bookingUrl ? 'Book on their site ↗' : 'Official site ↗'}
        </a>
      </div>
    </article>
  );
}
