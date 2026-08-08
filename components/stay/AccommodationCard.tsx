import Link from 'next/link';
import Image from 'next/image';
import { STAY_TYPE_LABEL, type Property } from '@/data/accommodation';
import { cardTarget } from '@/lib/stay';
import { PriceBadge, TagChips } from './primitives';
import { ExternalCardLink } from './ExternalCardLink';

/**
 * Rich, whole-card-clickable accommodation card.
 *  - Properties with an internal editorial guide link to that guide first.
 *  - Others link straight to the best booking destination (external, sponsored/nofollow,
 *    new tab, clearly marked as leaving the site).
 * No scraped photography: when a rights-cleared `image` isn't held, the card is a clean
 * text-led design rather than a stand-in photo pretending to be the property.
 */
export function AccommodationCard({ property, campaign = 'stay' }: { property: Property; campaign?: string }) {
  const target = cardTarget(property, campaign);

  const shell =
    'group flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-ocean-500 hover:shadow-sm';

  const body = (
    <>
      {property.image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-200">
          <Image
            src={property.image}
            alt={property.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
            {STAY_TYPE_LABEL[property.type]}
          </span>
          <PriceBadge band={property.priceBand} className="text-sm" />
        </div>

        <h3 className="mt-1.5 font-display text-lg leading-snug text-ink-900 group-hover:text-ocean-700">
          {property.name}
        </h3>

        <p className="mt-1 text-sm text-ink-500">
          {property.neighbourhood} · <span className="text-ink-700">{property.walkText}</span>
        </p>

        <p className="mt-2 text-sm text-ink-700 line-clamp-2">{property.summary}</p>

        <div className="mt-3">
          <TagChips tags={property.bestFor} />
        </div>

        <p className="mt-4 pt-1 text-sm font-medium text-ocean-700">
          {target.external ? (
            <>Check availability <span aria-hidden="true">↗</span></>
          ) : (
            <>Read our guide <span aria-hidden="true">→</span></>
          )}
        </p>
      </div>
    </>
  );

  if (!target.external) {
    return (
      <Link href={target.href} className={shell} aria-label={`${property.name} — read our guide`}>
        {body}
      </Link>
    );
  }

  return (
    <ExternalCardLink
      href={target.href}
      provider={target.provider}
      item={property.slug}
      campaign={campaign}
      className={shell}
    >
      {body}
    </ExternalCardLink>
  );
}
