import Link from 'next/link';
import { type Venue } from '@/data/bondiVenues';
import { venueNeighbourhood } from '@/lib/eatDrink';

const TYPE_LABEL: Record<string, string> = {
  cafe: 'Café', restaurant: 'Restaurant', bar: 'Bar', pub: 'Pub', takeaway: 'Takeaway', bakery: 'Bakery',
};

/** Price as $–$$$$. Render ONLY the active glyphs - padding out to four with muted signs
 *  makes a $$ venue read as "$$$$" at a glance (mirrors the Stay price treatment). */
function Price({ level }: { level: number }) {
  return (
    <span className="font-medium tabular-nums text-ink-900" aria-label={`Price level ${level} of 4`}>
      {'$'.repeat(level)}
    </span>
  );
}

/**
 * Venue card for the Eat & Drink engine - reused across collection pages, the hub and
 * in-article lists. Links to the internal venue guide where one exists; otherwise the
 * heading is plain and the CTA points to the venue's own site (never a fabricated link).
 */
export function VenueCard({ venue }: { venue: Venue }) {
  const guideHref = venue.hasGuide ? `/bondi-eat-and-drink/${venue.id}` : null;
  return (
    <article className="flex h-full flex-col rounded-xl border border-sand-200 bg-white p-5 transition hover:border-ocean-500 hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ocean-600">{TYPE_LABEL[venue.type] ?? venue.type}</span>
        <Price level={venue.priceLevel} />
      </div>

      <h3 className="mt-1.5 font-display text-lg leading-snug text-ink-900">
        {guideHref ? <Link href={guideHref} className="hover:text-ocean-700">{venue.name}</Link> : venue.name}
      </h3>

      <p className="mt-1 text-sm text-ink-500">{venueNeighbourhood(venue)}</p>
      <p className="mt-2 text-sm text-ink-700 line-clamp-3">{venue.shortDescription}</p>
      {venue.signatureNote && (
        <p className="mt-2 text-sm text-ink-600"><span className="font-medium text-ink-900">Known for:</span> {venue.signatureNote}</p>
      )}

      <div className="mt-4 flex flex-1 items-end gap-3 pt-1">
        {guideHref && (
          <Link href={guideHref} className="inline-flex items-center gap-1 rounded-lg bg-ocean-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-ocean-700">
            Read our guide <span aria-hidden="true">→</span>
          </Link>
        )}
        {venue.websiteUrl && (
          <a
            href={venue.websiteUrl}
            target="_blank"
            rel="nofollow noopener"
            className={`inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition ${guideHref ? 'border border-sand-300 text-ink-700 hover:border-ocean-500 hover:text-ocean-700' : 'bg-ocean-600 text-white hover:bg-ocean-700'}`}
          >
            Visit website <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
