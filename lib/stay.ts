/**
 * Stay-section helpers: turn a Property into the right link + CTA, and shared
 * option lists for the filter UI. Keeps this logic in one place so cards, category
 * pages and the hub all behave consistently.
 */
import { getAffiliateLink, type ProviderId } from '@/lib/affiliate';
import {
  type Property,
  type Tag,
  type StayType,
  TAG_LABEL,
  STAY_TYPE_PLURAL,
} from '@/data/accommodation';

/** Preferred provider for a property's primary booking CTA (Booking.com first). */
function primaryProvider(p: Property): ProviderId {
  if (p.providers.includes('booking')) return 'booking';
  return (p.providers[0] as ProviderId) ?? 'booking';
}

/** The booking search link (affiliate-wrapped when configured) for a property. */
export function bookingLinkFor(p: Property, campaign: string) {
  return getAffiliateLink({
    provider: primaryProvider(p),
    destination: 'Bondi Beach',
    property: p.name,
    campaign,
  });
}

export interface CardTarget {
  href: string;
  /** True when the link leaves Visit Bondi Beach (external booking/official site). */
  external: boolean;
  /** Provider id when the external link is a booking search (for tracking). */
  provider?: ProviderId;
  /** Label of the external destination, e.g. "Booking.com". */
  destinationLabel?: string;
}

/**
 * Where a property card should go when clicked:
 *  - has an internal editorial guide → the guide (internal, no tracking needed)
 *  - otherwise → the best external booking destination (official site if we hold a
 *    verified URL, else a booking search), opened in a new tab and clearly external.
 */
export function cardTarget(p: Property, campaign: string): CardTarget {
  if (p.hasGuide) return { href: `/stay/${p.slug}`, external: false };
  if (p.officialUrl) {
    return { href: p.officialUrl, external: true, destinationLabel: 'official site' };
  }
  const link = bookingLinkFor(p, campaign);
  return { href: link.href, external: true, provider: primaryProvider(p), destinationLabel: link.label };
}

/* ------------------------------ filter options ----------------------------- */

/** Best-for tags to offer as filters, in a sensible visitor order. */
export const FILTER_TAGS: Tag[] = [
  'families',
  'couples',
  'first-time',
  'luxury',
  'budget',
  'beach-access',
  'ocean-views',
  'pool',
  'longer-stays',
  'groups',
];

export const FILTER_TYPES: StayType[] = ['hotel', 'boutique-hotel', 'apartments', 'hostel'];

export const tagLabel = (t: Tag) => TAG_LABEL[t];
export const typePluralLabel = (t: StayType) => STAY_TYPE_PLURAL[t];

/** Serializable facet passed to the client filter component (no functions/env). */
export interface Facet {
  slug: string;
  name: string;
  area: string;
  type: StayType;
  tags: Tag[];
  price: number; // 1–4
  walk: number; // walking minutes, big number when it's a ride
}

export function facetFor(p: Property): Facet {
  return {
    slug: p.slug,
    name: p.name,
    area: p.area,
    type: p.type,
    tags: p.bestFor,
    price: p.priceBand.length,
    walk: p.walkMinutes ?? 999,
  };
}
