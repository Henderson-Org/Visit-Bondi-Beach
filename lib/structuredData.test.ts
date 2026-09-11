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
