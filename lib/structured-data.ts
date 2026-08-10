/**
 * Structured-data helpers. Only emit schema that the visible page genuinely
 * supports — never fabricate ratings, prices, hours or reviews.
 */
import { SITE, AUTHOR, siteOrigin } from './site';
import type { Page } from './content';
import { getArea, type Property, type StayType } from '@/data/accommodation';

const LODGING_TYPE: Record<StayType, string> = {
  hotel: 'Hotel',
  'pub-hotel': 'Hotel',
  hostel: 'Hostel',
  apartments: 'LodgingBusiness',
};

/**
 * LodgingBusiness schema for a property page. Names durable facts only — name, type,
 * locality, price range, official/booking URL. Deliberately NO aggregateRating or
 * review: we don't hold compliant guest-review data, and our editorial score is not a
 * schema.org Rating, so emitting one would be a fake rich-result signal.
 */
export function lodgingBusinessJsonLd(p: Property, path: string) {
  const area = getArea(p.area);
  return {
    '@context': 'https://schema.org',
    '@type': LODGING_TYPE[p.type],
    name: p.name,
    url: `${siteOrigin()}${path}`,
    ...(p.officialUrl ? { sameAs: p.officialUrl } : {}),
    priceRange: p.priceBand,
    address: {
      '@type': 'PostalAddress',
      addressLocality: area?.name ?? 'Bondi Beach',
      addressRegion: 'NSW',
      addressCountry: 'AU',
    },
    areaServed: 'Bondi Beach, Sydney',
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteOrigin()}/#org`,
    name: SITE.name,
    url: siteOrigin(),
    description: SITE.description,
    sameAs: [SITE.instagram],
    // Editorial focus, not a physical business — express the destination it covers.
    knowsAbout: ['Bondi Beach', 'Sydney', 'Eastern Suburbs Sydney', 'travel', 'ocean swimming'],
    areaServed: { '@type': 'Place', name: 'Bondi Beach, Sydney, Australia' },
  };
}

/**
 * The canonical Bondi Beach place entity. A destination site's single most important
 * structured-data asset: it declares to search + answer engines exactly which real-world
 * place this site is authoritative about, with coordinates, the containment hierarchy
 * (Bondi Beach → Sydney → NSW → Australia) and sameAs links to Wikipedia/Wikidata so the
 * entity resolves to the Knowledge Graph. Referenced by @id from article `about`.
 * Coordinates, postcode and sameAs IDs are real and verified — never fabricated.
 */
export const BONDI_PLACE_ID = '#bondi-beach';
export function bondiPlaceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'Beach'],
    '@id': `${siteOrigin()}/${BONDI_PLACE_ID}`,
    name: 'Bondi Beach',
    description:
      'Bondi Beach is a one-kilometre stretch of sand in the Eastern Suburbs of Sydney, New South Wales — one of Australia’s most famous beaches, known for swimming, surfing, the Icebergs ocean pool and the Bondi to Coogee coastal walk.',
    url: siteOrigin(),
    geo: { '@type': 'GeoCoordinates', latitude: -33.8908, longitude: 151.2743 },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bondi Beach',
      addressRegion: 'NSW',
      postalCode: '2026',
      addressCountry: 'AU',
    },
    containedInPlace: {
      '@type': 'City',
      name: 'Sydney',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'New South Wales',
        containedInPlace: { '@type': 'Country', name: 'Australia' },
      },
    },
    sameAs: [
      'https://en.wikipedia.org/wiki/Bondi_Beach',
      'https://www.wikidata.org/wiki/Q21919992',
    ],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: siteOrigin(),
    description: SITE.description,
  };
}

export function articleJsonLd(page: Page) {
  const url = `${siteOrigin()}${page.path}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.h1 || page.title,
    url,
    mainEntityOfPage: url,
    isPartOf: { '@type': 'Blog', name: `${SITE.name} — Articles`, url: `${siteOrigin()}/articles` },
  };
  data.author = { '@type': AUTHOR.type, name: AUTHOR.name, url: AUTHOR.url, description: AUTHOR.bio };
  data.publisher = { '@type': 'Organization', '@id': `${siteOrigin()}/#org`, name: SITE.name, url: siteOrigin() };
  // Bind every article to the canonical Bondi Beach place entity so search/answer engines
  // read the whole corpus as being *about* one resolved real-world place.
  data.about = { '@id': `${siteOrigin()}/${BONDI_PLACE_ID}` };
  if (page.metaDescription) data.description = page.metaDescription;
  if (page.publishedAt) data.datePublished = page.publishedAt;
  if (page.lastmod) data.dateModified = page.lastmod;
  if (page.wordCount) data.wordCount = page.wordCount;
  // Schema image must be an absolute, canonical URL on the production domain.
  // heroImage is a local path (/images/...), so resolve it against the origin.
  if (page.heroImage) {
    data.image = page.heroImage.startsWith('http') ? page.heroImage : `${siteOrigin()}${page.heroImage}`;
  }
  return data;
}

/** FAQPage schema — only emit when the same Q&As are visibly on the page (brief §24). */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * ItemList schema for a curated list (e.g. accommodation options). Names + optional
 * descriptions only — deliberately NO ratings, prices or review counts, so we never
 * emit an unsupported AggregateRating/Offer (Stay brief: no fake ratings).
 */
export function itemListJsonLd(
  name: string,
  items: { name: string; description?: string; url?: string }[],
  itemType = 'LodgingBusiness'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': itemType,
        name: it.name,
        ...(it.url ? { url: it.url.startsWith('http') ? it.url : `${siteOrigin()}${it.url}` } : {}),
        ...(it.description ? { description: it.description } : {}),
      },
    })),
  };
}

/**
 * Event schema for an event page. Only emitted with a concrete startDate — never for
 * annual events whose exact date is unconfirmed (no fabricated dates/offers/organisers).
 * Times are combined with the Sydney offset by the caller-supplied startDate/times.
 */
export function eventJsonLd(opts: {
  name: string;
  description?: string;
  startDate: string; // ISO 8601 (with time+offset when known)
  endDate?: string;
  url: string;
  venue: string;
  suburb: string;
  address?: string;
  status: 'scheduled' | 'cancelled' | 'postponed';
  priceType: 'free' | 'paid' | 'varies';
  ticketUrl?: string;
  organiser?: string;
  officialUrl?: string;
  /** Representative image (event-specific if we hold one, else a Bondi location image). */
  image?: string;
  /** Date the (free or ticketed) offer is valid from — a real verification date, not invented. */
  offerValidFrom?: string; // YYYY-MM-DD
}) {
  const statusMap = {
    scheduled: 'https://schema.org/EventScheduled',
    cancelled: 'https://schema.org/EventCancelled',
    postponed: 'https://schema.org/EventPostponed',
  } as const;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: opts.name,
    startDate: opts.startDate,
    eventStatus: statusMap[opts.status],
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: opts.url,
    location: {
      '@type': 'Place',
      name: opts.venue,
      address: {
        '@type': 'PostalAddress',
        streetAddress: opts.address,
        addressLocality: opts.suburb,
        addressRegion: 'NSW',
        addressCountry: 'AU',
      },
    },
  };
  if (opts.endDate) data.endDate = opts.endDate;
  if (opts.description) data.description = opts.description;
  if (opts.image) data.image = opts.image.startsWith('http') ? opts.image : `${siteOrigin()}${opts.image}`;
  if (opts.organiser) data.organizer = { '@type': 'Organization', name: opts.organiser, ...(opts.officialUrl ? { url: opts.officialUrl } : {}) };
  // Only advertise an Offer for genuinely free events (price 0). Paid/varies link out
  // instead — we never publish a fabricated price. validFrom is a real verification date.
  const validFrom = opts.offerValidFrom ? { validFrom: opts.offerValidFrom } : {};
  if (opts.priceType === 'free') {
    data.offers = { '@type': 'Offer', price: '0', priceCurrency: 'AUD', availability: 'https://schema.org/InStock', url: opts.ticketUrl || opts.officialUrl || opts.url, ...validFrom };
  } else if (opts.ticketUrl) {
    data.offers = { '@type': 'Offer', url: opts.ticketUrl, availability: 'https://schema.org/InStock', ...validFrom };
  }
  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${siteOrigin()}${it.path}`,
    })),
  };
}
