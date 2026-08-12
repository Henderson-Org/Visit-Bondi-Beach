import Link from 'next/link';
import Image from 'next/image';
import { STAY_TYPE_LABEL, type Property } from '@/data/accommodation';
import { bookingLinkFor } from '@/lib/stay';
import { PriceBadge, TagChips } from './primitives';
import { AffiliateButton } from './AffiliateButton';

/**
 * Accommodation card. Editorial-first: properties with a guide show a primary
 * "Read our guide" (internal) with "Check availability" (external, affiliate-tracked)
 * stacked directly beneath it. Properties without a guide show only "Check availability"
 * - never a dead/fake guide button.
 *
 * The card is not a single wrapping link (two distinct destinations), so the heading
 * links to the guide where one exists and the CTAs are explicit, accessible buttons.
 * No scraped photography - a clean text-led design when we hold no rights-cleared image.
 */
export function AccommodationCard({ property, campaign = 'stay' }: { property: Property; campaign?: string }) {
  const guideHref = property.hasGuide ? `/stay/${property.slug}` : null;
  const booking = bookingLinkFor(property, `${campaign}-check-availability`);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-ocean-500 hover:shadow-sm">
      {property.image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-200">
          <Image src={property.image} alt={property.imageAlt || property.name} fill sizes="(max-width:640px) 100vw, 360px" className="object-cover transition duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ocean-600">{STAY_TYPE_LABEL[property.type]}</span>
          <PriceBadge band={property.priceBand} className="text-sm" />
        </div>

        <h3 className="mt-1.5 font-display text-lg leading-snug text-ink-900">
          {guideHref ? (
            <Link href={guideHref} className="hover:text-ocean-700">{property.name}</Link>
          ) : (
            property.name
          )}
        </h3>

        <p className="mt-1 text-sm text-ink-500">
          {property.neighbourhood} · <span className="text-ink-700">{property.walkText}</span>
        </p>

        <p className="mt-2 text-sm text-ink-700 line-clamp-2">{property.summary}</p>

        <div className="mt-3">
          <TagChips tags={property.bestFor} />
        </div>

        {/* CTAs - Read our guide (internal) then Check availability (affiliate), stacked */}
        <div className="mt-4 flex flex-col gap-2 pt-1">
          {guideHref && (
            <Link
              href={guideHref}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700"
            >
              Read our guide <span aria-hidden="true">→</span>
            </Link>
          )}
          <AffiliateButton
            href={booking.href}
            label={booking.label}
            cta="Check availability"
            provider={booking.provider}
            propertyName={property.name}
            propertySlug={property.slug}
            page={campaign}
            placement="stay-card"
            ctaId="check_availability"
            variant={guideHref ? 'outline' : 'solid'}
            block
          />
        </div>
      </div>
    </article>
  );
}
