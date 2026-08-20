import { describe, expect, it } from 'vitest';
import { PROPERTIES, type Property } from '@/data/accommodation';
import { getGuide, guideSlugs } from '@/data/accommodation-guides';
import { cardTarget, facetFor, hasGuidePage } from '@/lib/stay';

/**
 * Guards the defect found in the 2026 audit: /stay/[slug] builds its static params
 * from the guides map, but cards linked on the property's own `hasGuide` flag. Six
 * properties carried the flag without a guide, so the hub linked to pages that were
 * never generated and returned 404. Everything user-facing now derives from the
 * guides map, and these tests fail if that drifts back apart.
 */
describe('stay guide links', () => {
  it('only links internally to a slug that /stay/[slug] actually builds', () => {
    const built = new Set(guideSlugs());
    for (const p of PROPERTIES) {
      const t = cardTarget(p, 'test');
      if (!t.external && t.href.startsWith('/stay/')) {
        expect(built, `${p.slug} links to a guide page that is not generated`).toContain(
          t.href.replace('/stay/', ''),
        );
      }
    }
  });

  it('never reports a guide page for a property with no guide', () => {
    for (const p of PROPERTIES) {
      if (hasGuidePage(p)) expect(getGuide(p.slug)).toBeDefined();
    }
  });

  it('keeps the guides-only filter in step with the real guides', () => {
    for (const p of PROPERTIES) {
      expect(facetFor(p).hasGuide).toBe(hasGuidePage(p));
    }
  });

  it('sends a property without a guide somewhere external instead of a dead link', () => {
    const noGuide = PROPERTIES.filter((p: Property) => !hasGuidePage(p));
    expect(noGuide.length).toBeGreaterThan(0);
    for (const p of noGuide) {
      const t = cardTarget(p, 'test');
      expect(t.external, `${p.slug} should not link internally`).toBe(true);
      expect(t.href).toMatch(/^https?:\/\//);
    }
  });

  it('has no guide defined for a property that no longer exists', () => {
    const slugs = new Set(PROPERTIES.map((p: Property) => p.slug));
    for (const slug of guideSlugs()) {
      expect(slugs, `guide ${slug} has no matching property`).toContain(slug);
    }
  });
});
