/**
 * The single place that turns an event into Event schema.
 *
 * This exists because the rule it enforces was previously applied in only one of the two
 * places that emit Event markup. The event pages gated correctly on a concrete date and
 * emitted a full node with `location`; /whats-on separately built its list by passing
 * 'Event' as an ItemList item type, which produced bare { '@type': 'Event', name, url }
 * nodes with no location and no startDate. Search Console reported all nine as invalid
 * ("Missing field location"), so none were eligible for rich results.
 *
 * Two rules, in one function so they cannot drift apart again:
 *
 *  1. NO CONCRETE DATE, NO EVENT NODE. resolveEvent() returns nextDate: null for an annual
 *     whose edition has passed or is unannounced (the marathon, Sculpture by the Sea,
 *     Flickerfest). Those get no schema at all. Inventing a start date to satisfy a
 *     validator is precisely what the integrity rules forbid - an invalid item costs a rich
 *     result, a fabricated date misleads someone into turning up on the wrong day.
 *  2. A NODE WE DO EMIT IS COMPLETE. Every event that clears rule 1 goes through
 *     eventJsonLd(), which carries location, startDate, status and offers.
 */
import { eventJsonLd } from './structured-data';
import { siteOrigin } from './site';
import { resolveEvent, sydneyOffset, sydneyToday } from './events';
import type { BondiEvent } from '@/data/events';

/** A representative Bondi image for events we hold no image for. */
const FALLBACK_IMAGE = '/images/hero-bondi-sunrise.webp';

/**
 * Event schema for one event, or null when we have no concrete date for it.
 * `null` is a correct outcome, not a failure - see rule 1 above.
 */
export function eventSchemaFor(e: BondiEvent, today: string = sydneyToday()): Record<string, unknown> | null {
  const r = resolveEvent(e, today);
  if (!r.nextDate) return null;

  const startIso = `${r.nextDate}${e.startTime ? `T${e.startTime}:00${sydneyOffset(r.nextDate)}` : ''}`;

  // endDate (Google-recommended): the published end for a multi-day edition; the same-day
  // end time for a timed single-day event; otherwise the same calendar day.
  let endIso: string | undefined;
  if (e.startDate && e.endDate && e.endDate !== e.startDate && r.nextDate === e.startDate) {
    endIso = `${e.endDate}${e.endTime ? `T${e.endTime}:00${sydneyOffset(e.endDate)}` : ''}`;
  } else if (e.endTime) {
    endIso = `${r.nextDate}T${e.endTime}:00${sydneyOffset(r.nextDate)}`;
  } else {
    endIso = r.nextDate;
  }

  return eventJsonLd({
    name: e.title,
    description: e.summary,
    startDate: startIso,
    endDate: endIso,
    url: `${siteOrigin()}/whats-on/${e.slug}`,
    venue: e.venue,
    suburb: e.suburb,
    address: e.address,
    status: e.status,
    priceType: e.priceType,
    ticketUrl: e.ticketUrl,
    organiser: e.organiser,
    officialUrl: e.officialUrl,
    image: e.image ?? FALLBACK_IMAGE,
    // A real verification date, never invented.
    offerValidFrom: e.dateVerifiedAt ?? e.lastVerified,
  }) as Record<string, unknown>;
}

/**
 * ItemList of complete Event nodes for a listing page. Events without a concrete date are
 * dropped rather than listed as typeless stubs, so `numberOfItems` always matches the
 * number of valid events actually described.
 */
export function eventListSchema(name: string, events: BondiEvent[], today: string = sydneyToday()) {
  const nodes = events
    .map((e) => eventSchemaFor(e, today))
    .filter((n): n is Record<string, unknown> => n !== null);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: nodes.length,
    itemListElement: nodes.map((node, i) => {
      // @context belongs to the enclosing document, not to a nested node.
      const { '@context': _context, ...item } = node;
      return { '@type': 'ListItem', position: i + 1, item };
    }),
  };
}
