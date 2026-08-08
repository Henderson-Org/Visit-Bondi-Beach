import { getAffiliateLink } from '@/lib/affiliate';
import {
  STAY_TYPE_LABEL,
  TRAVELLER_LABEL,
  getArea,
  type Property,
} from '@/data/accommodation';
import { AffiliateButton } from './AffiliateButton';

/**
 * Typographic accommodation card — NO hotel imagery (we don't scrape or license
 * property photos). It shows durable facts only (name, type, area, neutral summary)
 * and generates a search-based affiliate CTA per provider via getAffiliateLink().
 *
 * This is a server component: affiliate hrefs are built here (server-side) and only
 * the resolved href/label are passed to the client AffiliateButton.
 */
export function AccommodationCard({
  property,
  campaign,
}: {
  property: Property;
  campaign?: string;
}) {
  const area = getArea(property.area);
  const destination = 'Bondi Beach';
  const place = campaign || 'stay';

  return (
    <article className="flex h-full flex-col rounded-xl border border-sand-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug text-ink-900">{property.name}</h3>
        <span className="shrink-0 rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-medium text-ink-700">
          {STAY_TYPE_LABEL[property.type]}
        </span>
      </div>
      {area && <p className="mt-1 text-xs uppercase tracking-wide text-ocean-600">{area.name}</p>}
      <p className="mt-2 text-sm text-ink-700">{property.summary}</p>

      {property.bestFor.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Best for">
          {property.bestFor.map((t) => (
            <li key={t} className="rounded-full border border-sand-200 px-2 py-0.5 text-[11px] text-ink-500">
              {TRAVELLER_LABEL[t]}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2 pt-1">
        {property.providers.map((provider, i) => {
          const link = getAffiliateLink({
            provider,
            destination,
            property: property.name,
            campaign: `${place}-${property.slug}`,
          });
          return (
            <AffiliateButton
              key={provider}
              href={link.href}
              label={link.label}
              cta={i === 0 ? link.cta : `Search on ${link.label}`}
              provider={provider}
              item={property.slug}
              campaign={place}
              variant={i === 0 ? 'solid' : 'outline'}
            />
          );
        })}
      </div>
    </article>
  );
}
