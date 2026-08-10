import Link from 'next/link';
import type { Restaurant } from '@/data/restaurants';
import { PRICE_LABEL, VENUE_TYPE_LABEL, PRECINCT_LABEL } from '@/data/restaurants';
import { venuePageHref, outboundLink } from '@/lib/restaurantGuide';

/** Price as $–$$$$ (active glyphs inked, rest muted) — matches the Stay/Eat treatment. */
function Price({ level }: { level: number }) {
  return (
    <span className="font-medium tabular-nums" aria-label={`Price level ${level} of 4, ${PRICE_LABEL[level]}`}>
      <span className="text-ink-900">{'$'.repeat(level)}</span>
      <span className="text-ink-300">{'$'.repeat(4 - level)}</span>
    </span>
  );
}

/**
 * Directory card for a Bondi venue. Server-rendered and present in the initial HTML
 * (crawlable, works without JS). Links to the internal venue page when the venue has
 * real editorial depth; otherwise the heading is plain and the CTA points to the
 * venue's own site — never a fabricated link.
 */
export function RestaurantCard({ venue }: { venue: Restaurant }) {
  const href = venuePageHref(venue);
  const out = outboundLink(venue);
  return (
    <article className="flex h-full flex-col rounded-xl border border-sand-200 bg-white p-5 transition hover:border-ocean-500 hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
          {VENUE_TYPE_LABEL[venue.type]}
        </span>
        <Price level={venue.priceBand} />
      </div>

      <h3 className="mt-1.5 font-display text-lg leading-snug text-ink-900">
        {href ? (
          <Link href={href} className="hover:text-ocean-700">{venue.name}</Link>
        ) : (
          venue.name
        )}
      </h3>

      <p className="mt-1 text-sm text-ink-500">
        {venue.cuisines[0] && venue.cuisines[0] !== '—' ? `${venue.cuisines[0]} · ` : ''}
        {PRECINCT_LABEL[venue.precinct]}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-ink-700 line-clamp-3">{venue.summary}</p>

      {venue.bestFor && (
        <p className="mt-2 text-sm text-ink-600">
          <span className="font-medium text-ink-900">Best for:</span> {venue.bestFor}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
        {href ? (
          <Link href={href} className="font-medium text-ocean-700 hover:underline">
            Read more →
          </Link>
        ) : out ? (
          <a
            href={out.href}
            target="_blank"
            rel="noopener nofollow"
            className="font-medium text-ocean-700 hover:underline"
          >
            {out.label} ↗
          </a>
        ) : (
          <span />
        )}
        {venue.formerName && (
          <span className="text-xs text-ink-400">was {venue.formerName}</span>
        )}
      </div>
    </article>
  );
}
