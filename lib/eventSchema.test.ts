/**
 * Search Console reported all nine Event items on /whats-on as invalid - "Missing field
 * location" - because the listing built its own bare { '@type': 'Event', name, url } nodes
 * instead of going through eventJsonLd. These tests hold both halves of the fix: an Event
 * node we emit is complete, and an event we cannot date honestly gets no node at all.
 */
import { describe, it, expect } from 'vitest';
import { eventSchemaFor, eventListSchema } from './eventSchema';
import { EVENTS, getEvent } from '@/data/events';
import { upcomingEvents, resolveEvent } from './events';

const TODAY = '2026-09-11';

/** Google's required properties for an Event rich result. */
const REQUIRED = ['name', 'startDate', 'location'] as const;

describe('every emitted Event node is valid', () => {
  it('gives each event with a concrete date a complete node', () => {
    const dated = EVENTS.filter((e) => resolveEvent(e, TODAY).nextDate);
    expect(dated.length, 'no datable events to test').toBeGreaterThan(0);

    for (const e of dated) {
      const node = eventSchemaFor(e, TODAY)!;
      expect(node, `${e.slug} produced no schema despite having a date`).toBeTruthy();
      for (const field of REQUIRED) {
        expect(node[field], `${e.slug} is missing required field "${field}"`).toBeTruthy();
      }
      expect(node['@type']).toBe('Event');
    }
  });

  it('gives location a real Place with an address', () => {
    // The exact shape whose absence Google rejected.
    const e = EVENTS.find((x) => resolveEvent(x, TODAY).nextDate)!;
    const loc = eventSchemaFor(e, TODAY)!.location as Record<string, unknown>;
    expect(loc['@type']).toBe('Place');
    expect(loc.name).toBeTruthy();
    const addr = loc.address as Record<string, unknown>;
    expect(addr['@type']).toBe('PostalAddress');
    expect(addr.addressLocality).toBeTruthy();
    expect(addr.addressRegion).toBe('NSW');
  });

  it('emits an ISO 8601 startDate', () => {
    for (const e of EVENTS) {
      const node = eventSchemaFor(e, TODAY);
      if (!node) continue;
      expect(String(node.startDate), `${e.slug} startDate is not ISO 8601`).toMatch(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})?$/
      );
    }
  });
});

describe('no event is given a date we do not have', () => {
  it('returns null for an annual whose edition is unannounced', () => {
    // The marathon's 2026 edition has run and 2027 dates are not published. An Event node
    // here would need an invented startDate - the failure mode that matters more than the
    // rich result we lose by staying quiet.
    const marathon = getEvent('sydney-marathon');
    if (marathon) {
      expect(resolveEvent(marathon, TODAY).nextDate).toBeNull();
      expect(eventSchemaFor(marathon, TODAY)).toBeNull();
    }

    // Whatever the dataset holds, the rule is general.
    for (const e of EVENTS) {
      if (resolveEvent(e, TODAY).nextDate === null) {
        expect(eventSchemaFor(e, TODAY), `${e.slug} has no date but got schema`).toBeNull();
      }
    }
  });
});

describe('the /whats-on list', () => {
  const list = eventListSchema("What's on in Bondi", upcomingEvents(TODAY).map((r) => r.event), TODAY);

  it('is an ItemList of complete Events, not stubs', () => {
    expect(list['@type']).toBe('ItemList');
    expect(list.itemListElement.length, 'the list is empty').toBeGreaterThan(0);

    for (const entry of list.itemListElement) {
      expect(entry['@type']).toBe('ListItem');
      const item = entry.item as Record<string, unknown>;
      expect(item['@type']).toBe('Event');
      for (const field of REQUIRED) {
        expect(item[field], `a listed event is missing "${field}"`).toBeTruthy();
      }
      // @context belongs to the enclosing document, never to a nested node.
      expect(item['@context'], 'nested node repeats @context').toBeUndefined();
    }
  });

  it('counts only the events it actually describes', () => {
    expect(list.numberOfItems).toBe(list.itemListElement.length);
  });

  it('numbers positions from 1 without gaps', () => {
    expect(list.itemListElement.map((e) => e.position)).toEqual(
      list.itemListElement.map((_, i) => i + 1)
    );
  });

  it('omits undated events rather than listing them invalidly', () => {
    const listed = new Set(list.itemListElement.map((e) => (e.item as { name: string }).name));
    const undated = upcomingEvents(TODAY).filter((r) => r.nextDate === null);
    for (const r of undated) {
      expect(listed.has(r.event.title), `${r.event.slug} has no date but is in the markup`).toBe(false);
    }
  });
});
