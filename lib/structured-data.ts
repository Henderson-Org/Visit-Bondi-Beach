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

/** Stable @id for the author entity, resolved against the current origin. */
export function authorId() {
  return `${siteOrigin()}/visit-bondi-beach#editorial-team`;
}

/**
 * The author entity. Emitted once globally (like Organization) so every article's
 * `author: { @id }` reference resolves to one identity — the biggest missing E-E-A-T
 * signal on the site. Honest by construction: typed per AUTHOR.type (Organization for
 * the "team of five" voice — a fabricated single Person would breach the integrity rules;
 * set NEXT_PUBLIC_AUTHOR_TYPE=Person + a real name only once a real named author exists).
 * `knowsAbout` ties the author to its beats; for a real Person, `homeLocation` would bind
 * to the canonical Bondi place @id — a claim no all-of-Sydney competitor can make truthfully.
 */
export function authorJsonLd() {
  const isPerson = AUTHOR.type === 'Person';
  return {
    '@context': 'https://schema.org',
    '@type': AUTHOR.type,
    '@id': authorId(),
    name: AUTHOR.name,
    url: AUTHOR.url,
    description: AUTHOR.bio,
    knowsAbout: AUTHOR.knowsAbout,
    sameAs: [SITE.instagram],
    ...(isPerson
      ? { worksFor: { '@id': `${siteOrigin()}/#org` }, homeLocation: { '@id': `${siteOrigin()}/${BONDI_PLACE_ID}` } }
      : { parentOrganization: { '@id': `${siteOrigin()}/#org` } }),
  };
}

export function articleJsonLd(page: Page, opts?: { url?: string; inLanguage?: string }) {
  // For a translation, url/mainEntityOfPage point at the localized URL and inLanguage is set,
  // so the translated page's schema is self-consistent (never claims the English URL).
  const url = opts?.url ? `${siteOrigin()}${opts.url}` : `${siteOrigin()}${page.path}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.h1 || page.title,
    url,
    mainEntityOfPage: url,
    ...(opts?.inLanguage ? { inLanguage: opts.inLanguage } : {}),
    isPartOf: { '@type': 'Blog', name: `${SITE.name} — Articles`, url: `${siteOrigin()}/articles` },
  };
  // Reference the single author entity by @id (emitted globally in app/layout.tsx) rather
  // than inlining an anonymous author on every article — one resolvable identity for E-E-A-T.
  data.author = { '@id': authorId() };
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

/**
 * Bondi→Coogee coastal walk: TouristAttraction + HowTo, built from the SAME visible route
 * module rendered on the /bondi-coastal-walk hub (RouteMap) so the schema never asserts a
 * step the page doesn't show. The walk is a real, free, publicly-documented attraction —
 * nested in the canonical Bondi place entity. Only emit on the coastal-walk hub.
 */
export function coastalWalkSchema(
  stops: { label: string; sub?: string; href?: string }[],
  opts?: { note?: string; distance?: string; time?: string; image?: string }
) {
  const origin = siteOrigin();
  const url = `${origin}/bondi-coastal-walk`;
  const attraction = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${url}#attraction`,
    name: 'Bondi to Coogee Coastal Walk',
    description:
      opts?.note ||
      'A roughly 6 km clifftop walk south from Bondi Beach past Tamarama, Bronte, Clovelly and Gordons Bay to Coogee — about 1.5–2 hours at an easy pace.',
    url,
    isAccessibleForFree: true,
    touristType: ['Walkers', 'Families', 'Photographers'],
    containedInPlace: { '@id': `${origin}/${BONDI_PLACE_ID}` },
    ...(opts?.image ? { image: opts.image.startsWith('http') ? opts.image : `${origin}${opts.image}` } : {}),
    sameAs: ['https://en.wikipedia.org/wiki/Bondi_to_Coogee_walk'],
  };
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to walk the Bondi to Coogee coastal walk',
    description: 'Follow the clifftop path south from Bondi Beach to Coogee.',
    ...(opts?.time ? { totalTime: opts.time } : {}),
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'AUD', value: '0' },
    step: stops.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.label,
      text: s.sub ? `${s.label} — ${s.sub}` : s.label,
      ...(s.href ? { url: s.href.startsWith('http') ? s.href : `${origin}${s.href}` } : {}),
    })),
  };
  return [attraction, howTo];
}

/**
 * Dataset schema for an original-research asset (the flagship link/AEO play — e.g. the Bondi
 * Coffee Price Index, the coastal-walk dataset). This is the type Google Dataset Search and
 * answer engines index and cite. Emit ONLY when a real, downloadable dataset genuinely backs
 * the page (a published CSV/JSON with a stated methodology) — never for a page of prose.
 */
export function datasetJsonLd(d: {
  name: string;
  description: string;
  path: string;
  distributionUrl: string;
  encodingFormat?: string;
  temporalCoverage?: string;
  license?: string;
  keywords?: string[];
}) {
  const origin = siteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: d.name,
    description: d.description,
    url: `${origin}${d.path}`,
    creator: { '@id': `${origin}/#org` },
    spatialCoverage: { '@id': `${origin}/${BONDI_PLACE_ID}` },
    ...(d.temporalCoverage ? { temporalCoverage: d.temporalCoverage } : {}),
    ...(d.keywords?.length ? { keywords: d.keywords } : {}),
    ...(d.license ? { license: d.license } : {}),
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: d.encodingFormat || 'text/csv',
      contentUrl: d.distributionUrl.startsWith('http') ? d.distributionUrl : `${origin}${d.distributionUrl}`,
    },
  };
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

/**
 * schema.org type for a dining venue. Chosen so the visible content genuinely supports
 * it (a cafe is a CafeOrCoffeeShop, a bar/pub a BarOrPub, etc.).
 */
const FOOD_TYPE: Record<string, string> = {
  cafe: 'CafeOrCoffeeShop',
  restaurant: 'Restaurant',
  bar: 'BarOrPub',
  pub: 'BarOrPub',
  bakery: 'Bakery',
  takeaway: 'FoodEstablishment',
  dessert: 'FoodEstablishment',
  'club-hotel': 'Restaurant',
};

const PRICE_RANGE: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

/**
 * FoodEstablishment schema for a venue page. Durable facts only — name, venue type,
 * cuisine, price range, locality, and the venue's own URL. Deliberately NO
 * aggregateRating/review/openingHours: we hold no compliant review data, and hours are
 * volatile (they live on the venue's own site), so emitting them would be a fake signal.
 * Binds to the canonical Bondi Beach place entity via containedInPlace.
 */
export function restaurantJsonLd(
  r: {
    name: string;
    type: string;
    cuisines: string[];
    priceBand: number;
    precinctLabel: string;
    address?: string;
    website?: string;
    bookingUrl?: string;
    instagram?: string;
    menuUrl?: string;
    summary?: string;
    image?: string;
  },
  path: string
) {
  const sameAs = [r.website, r.instagram].filter(Boolean) as string[];
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': FOOD_TYPE[r.type] ?? 'Restaurant',
    name: r.name,
    url: `${siteOrigin()}${path}`,
    priceRange: PRICE_RANGE[r.priceBand] ?? '$$',
    address: {
      '@type': 'PostalAddress',
      ...(r.address ? { streetAddress: r.address } : {}),
      addressLocality: r.precinctLabel || 'Bondi Beach',
      addressRegion: 'NSW',
      addressCountry: 'AU',
    },
    areaServed: 'Bondi Beach, Sydney',
    containedInPlace: { '@id': `${siteOrigin()}/${BONDI_PLACE_ID}` },
  };
  const cuisines = r.cuisines.filter((c) => c && c !== '—');
  if (cuisines.length) data.servesCuisine = cuisines;
  if (r.summary) data.description = r.summary;
  if (r.menuUrl) data.hasMenu = r.menuUrl;
  if (r.bookingUrl) data.acceptsReservations = r.bookingUrl;
  if (sameAs.length) data.sameAs = sameAs;
  if (r.image) data.image = r.image.startsWith('http') ? r.image : `${siteOrigin()}${r.image}`;
  return data;
}

/**
 * Place / TouristAttraction / Beach / Park schema for a location page. Emits only what the
 * page genuinely supports and the record verifies — name, description, the page URL, the
 * Bondi Beach locality, and `geo` ONLY when verified coordinates exist (never fabricated).
 * Binds to the canonical Bondi Beach place entity via `containedInPlace`/`isPartOf` so the
 * location resolves as part of the known Bondi entity.
 */
export function locationPlaceJsonLd(loc: {
  name: string;
  schemaType: string;
  shortDescription: string;
  coordinates?: { lat: number; lng: number };
  sameAs?: string[];
  image?: string;
}, path: string) {
  const isBondiBeach = path === '/bondi-beach';
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': loc.schemaType,
    name: loc.name,
    description: loc.shortDescription,
    url: `${siteOrigin()}${path}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bondi Beach',
      addressRegion: 'NSW',
      postalCode: '2026',
      addressCountry: 'AU',
    },
  };
  if (loc.image) data.image = loc.image.startsWith('http') ? loc.image : `${siteOrigin()}${loc.image}`;
  if (loc.coordinates) data.geo = { '@type': 'GeoCoordinates', latitude: loc.coordinates.lat, longitude: loc.coordinates.lng };
  if (loc.sameAs?.length) data.sameAs = loc.sameAs;
  // Sub-locations sit within the canonical Bondi Beach entity; Bondi Beach itself sits in Sydney.
  data.containedInPlace = isBondiBeach
    ? { '@type': 'City', name: 'Sydney', containedInPlace: { '@type': 'AdministrativeArea', name: 'New South Wales', containedInPlace: { '@type': 'Country', name: 'Australia' } } }
    : { '@id': `${siteOrigin()}/${BONDI_PLACE_ID}`, name: 'Bondi Beach' };
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
