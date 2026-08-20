/**
 * Stay-section helpers: turn a Property into the right link + CTA, and shared
 * option lists for the filter UI. Keeps this logic in one place so cards, category
 * pages and the hub all behave consistently.
 */
import { getAffiliateLink, type ProviderId } from '@/lib/affiliate';
import { getGuide } from '@/data/accommodation-guides';
import {
  type Property,
  type Tag,
  type StayType,
  TAG_LABEL,
  STAY_TYPE_PLURAL,
} from '@/data/accommodation';

/**
 * Whether a property actually has a guide page at /stay/<slug>.
 *
 * Derived from the guides map rather than the `hasGuide` flag on the property.
 * /stay/[slug] builds its params from that same map, so trusting the flag let the
 * two drift: six properties were flagged `hasGuide: true` without a guide and
 * linked to pages that were never generated (404). Deriving it here means a card
 * can only ever link to a page that exists.
 */
export function hasGuidePage(p: Property): boolean {
  return Boolean(p.hasGuide) && getGuide(p.slug) !== undefined;
}

/** Preferred provider for a property's primary booking CTA (Booking.com first). */
function primaryProvider(p: Property): ProviderId {
  if (p.providers.includes('booking')) return 'booking';
  return (p.providers[0] as ProviderId) ?? 'booking';
}

/**
 * The Booking.com (or primary provider) link for a property, affiliate-wrapped when
 * configured. Uses the exact property deep link when we hold a verified `bookingUrl`
 * (priority 1), otherwise a property-name search - never a generic page.
 */
export function bookingLinkFor(p: Property, placement: string) {
  return getAffiliateLink({
    provider: primaryProvider(p),
    destination: 'Bondi Beach',
    property: p.name,
    targetUrl: p.bookingUrl,
    placement,
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
  if (hasGuidePage(p)) return { href: `/stay/${p.slug}`, external: false };
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

export const FILTER_TYPES: StayType[] = ['hotel', 'apartments', 'hostel', 'pub-hotel'];

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
  hasGuide: boolean;
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
    // Derived, not the raw flag - see hasGuidePage. The "guides only" filter must
    // only surface properties whose guide page actually exists.
    hasGuide: hasGuidePage(p),
  };
}
