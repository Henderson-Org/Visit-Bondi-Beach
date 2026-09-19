/**
 * Guards the defect Search Console reported as "Invalid object type for field
 * spatialCoverage" on our Dataset schema.
 *
 * The cause is subtle and easy to reintroduce: a nested node written as a bare
 * `{ '@id': '…/#bondi-beach' }` reference resolves ONLY if the node it points at is emitted
 * in the same document. bondiPlaceJsonLd() and organizationJsonLd() render on the homepage
 * and on the [...slug] content pages — but the dataset pages, venue pages and other code
 * routes never emit them, so on those pages the reference dangles and a parser sees an
 * object with no type.
 *
 * So: any nested node that carries an @id must also carry an @type. The @id keeps the
 * entity consolidated for consumers that resolve graphs; the @type makes it self-describing
 * for those that don't.
 */
import { describe, it, expect } from 'vitest';
import {
  datasetJsonLd,
  restaurantJsonLd,
  articleJsonLd,
  bondiPlaceJsonLd,
  organizationJsonLd,
  localBusinessJsonLd,
  BONDI_PLACE_ID,
} from './structured-data';
import { allPages } from './content';

/** Every nested object in the tree that carries an '@id', with the path that reached it. */
function nodesWithId(value: unknown, path = '$'): { path: string; node: Record<string, unknown> }[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => nodesWithId(v, `${path}[${i}]`));
  if (!value || typeof value !== 'object') return [];
  const node = value as Record<string, unknown>;
  const children = Object.entries(node).flatMap(([k, v]) => nodesWithId(v, `${path}.${k}`));
  return '@id' in node ? [{ path, node }, ...children] : children;
}

const DATASET = datasetJsonLd({
  name: 'Bondi Coffee Index 2026',
  description: 'Verified café flat-white prices across Bondi Beach, 2026.',
  path: '/bondi-coffee-price-index',
  distributionUrl: '/data/bondi-coffee-index.csv',
  temporalCoverage: '2026',
});

describe('every @id reference is self-describing', () => {
  // The nodes at the top of each document legitimately declare their own @id + @type; the
  // check below covers those too, which is what we want.
  const documents: [string, unknown][] = [
    ['datasetJsonLd', DATASET],
    ['bondiPlaceJsonLd', bondiPlaceJsonLd()],
    ['organizationJsonLd', organizationJsonLd()],
  ];

  for (const [label, doc] of documents) {
    it(`${label} types every node it references by @id`, () => {
      const nodes = nodesWithId(doc);
      expect(nodes.length, `${label} has no @id nodes at all`).toBeGreaterThan(0);
      for (const { path, node } of nodes) {
        expect(node['@type'], `${label}: ${path} carries @id "${node['@id']}" but no @type`).toBeTruthy();
      }
    });
  }
});

describe('Dataset schema', () => {
  it('gives spatialCoverage a real Place, not a dangling reference', () => {
    // The exact field Search Console rejected.
    const spatial = DATASET.spatialCoverage as Record<string, unknown>;
    expect(spatial['@type']).toBe('Place');
    expect(spatial['@id']).toContain(BONDI_PLACE_ID);
    expect(spatial.name).toBe('Bondi Beach');
  });

  it('gives creator a typed Organization', () => {
    const creator = DATASET.creator as Record<string, unknown>;
    expect(creator['@type']).toBe('Organization');
    expect(creator['@id']).toContain('#org');
    expect(creator.name).toBeTruthy();
  });

  it('still points spatialCoverage at the canonical Bondi entity', () => {
    // Typing the node must not fork the entity: the @id has to stay identical to the one
    // bondiPlaceJsonLd() declares, or we end up with two Bondi Beaches in the graph.
    const spatial = DATASET.spatialCoverage as Record<string, unknown>;
    expect(spatial['@id']).toBe(bondiPlaceJsonLd()['@id']);
  });

  it('emits a downloadable distribution', () => {
    const dist = DATASET.distribution as Record<string, unknown>;
    expect(dist['@type']).toBe('DataDownload');
    // Absolute, not path-relative. The origin is localhost outside a production build, so
    // assert the shape rather than the host.
    expect(dist.contentUrl).toMatch(/^https?:\/\/.+\.csv$/);
  });
});

describe('references that resolve in-document are still typed', () => {
  it('types containedInPlace on a venue, which renders on a code route', () => {
    const r = restaurantJsonLd(
      {
        name: 'Test Venue',
        type: 'Cafe',
        cuisines: ['Coffee'],
        priceBand: 2,
        precinctLabel: 'Bondi Beach',
      },
      '/bondi-eat-and-drink/venues/test-venue'
    ) as Record<string, unknown>;
    const contained = r.containedInPlace as Record<string, unknown>;
    expect(contained['@type'], 'venue pages never emit the place node').toBeTruthy();
    expect(contained['@id']).toContain(BONDI_PLACE_ID);
  });

  it('keeps the article → Bondi binding intact', () => {
    // Articles DO render alongside bondiPlaceJsonLd on [...slug], so this reference resolves
    // in-document. Asserted against a real page so the binding is not dropped by a future
    // edit, and so the test cannot pass against a shape that no longer exists.
    const page = allPages().find((p) => p.section === 'blog' && p.indexable);
    expect(page, 'no indexable blog page to test against').toBeTruthy();
    const a = articleJsonLd(page!) as Record<string, unknown>;
    const about = a.about as Record<string, unknown>;
    expect(about['@id']).toContain(BONDI_PLACE_ID);
  });
});

describe('business schema on an article', () => {
  // The `business` block on a body lets an article that profiles one venue emit a typed
  // LocalBusiness alongside the BlogPosting. It is opt-in per body, so the tests bind to a
  // real page rather than a fixture: if the mechanism stops reaching content, they fail.
  const pages = allPages().filter((p) => p.business);

  it('at least one page declares a business', () => {
    expect(pages.length, 'no page carries a business block — the overlay may have broken').toBeGreaterThan(0);
  });

  for (const page of pages) {
    describe(page.path, () => {
      const b = page.business!;
      const doc = localBusinessJsonLd(b, page.path) as Record<string, unknown>;

      it('types every node it references by @id', () => {
        for (const { path, node } of nodesWithId(doc)) {
          expect(node['@type'], `${path} carries @id "${node['@id']}" but no @type`).toBeTruthy();
        }
      });

      it('emits a complete PostalAddress', () => {
        const address = doc.address as Record<string, unknown>;
        expect(address['@type']).toBe('PostalAddress');
        expect(address.streetAddress).toBe(b.streetAddress);
        expect(address.addressLocality).toBe(b.addressLocality);
        expect(address.addressRegion).toBe('NSW');
        expect(address.addressCountry).toBe('AU');
        expect(address.postalCode).toMatch(/^\d{4}$/);
      });

      it('binds the business back to the page that describes it', () => {
        const subjectOf = doc.subjectOf as Record<string, unknown>;
        expect(subjectOf['@type']).toBe('WebPage');
        expect(subjectOf['@id']).toContain(page.path);
      });

      it('emits opening hours in the 24-hour form schema.org expects', () => {
        const spec = doc.openingHoursSpecification as Record<string, unknown>[] | undefined;
        if (!b.openingHours?.length) {
          expect(spec, 'no hours declared, so none should be emitted').toBeUndefined();
          return;
        }
        expect(spec).toHaveLength(b.openingHours.length);
        for (const entry of spec!) {
          expect(entry['@type']).toBe('OpeningHoursSpecification');
          expect(entry.opens).toMatch(/^\d{2}:\d{2}$/);
          expect(entry.closes).toMatch(/^\d{2}:\d{2}$/);
          expect(Array.isArray(entry.dayOfWeek) && (entry.dayOfWeek as string[]).length).toBeTruthy();
        }
      });

      it('does not claim hours the page does not state', () => {
        // Schema has to be backed by visible content. A body that publishes hours in
        // structured data but not on the page is schema spam; worse, the two drift apart
        // and we end up telling Google something the reader is never shown.
        if (!b.openingHours?.length) return;
        const visible = JSON.stringify(page.blocks ?? []);
        for (const h of b.openingHours) {
          // 07:00 → 7am, 13:00 → 1pm. Matches how the bodies are actually written.
          for (const t of [h.opens, h.closes]) {
            const hour = Number(t.slice(0, 2));
            const twelve = hour % 12 === 0 ? 12 : hour % 12;
            const suffix = hour < 12 ? 'am' : 'pm';
            expect(
              visible.includes(`${twelve}${suffix}`),
              `${page.path}: schema says ${t} but the body never shows "${twelve}${suffix}"`
            ).toBe(true);
          }
        }
      });
    });
  }
});
