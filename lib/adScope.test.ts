/**
 * The AdSense bootstrap must load on exactly the pages that render an ad slot.
 *
 * It used to sit in the root layout, so all 878 prerendered pages pulled it in while only
 * 160 rendered an ad unit. That is not one script: adsbygoogle drags in the Funding Choices
 * consent frame, doubleclick and adtrafficquality behind it. The 717 pages with no ad units
 * paid that cost for no revenue - including the obituary, which sets noAds precisely so it
 * carries no advertising.
 *
 * The invariant is symmetric and both halves matter: a bootstrap without a slot is waste,
 * and a slot without a bootstrap is an ad that never fills - lost revenue. This asserts the
 * wiring at source, so neither can regress silently.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const ROUTE = readFileSync('app/[...slug]/page.tsx', 'utf8');
const LAYOUT = readFileSync('app/layout.tsx', 'utf8');
const COMPONENT = readFileSync('components/Adsense.tsx', 'utf8');

describe('AdSense is scoped to pages that actually show ads', () => {
  it('is not mounted in the root layout', () => {
    // A bare mention survives in a comment explaining why; what must not come back is the
    // component being rendered here.
    expect(LAYOUT, 'AdsenseScript is rendered in the root layout again').not.toMatch(
      /<AdsenseScript\s*\/>/
    );
  });

  it('is mounted in the article route', () => {
    expect(ROUTE).toMatch(/<AdsenseScript\s*\/>/);
    expect(ROUTE).toMatch(/import \{ AdsenseScript \} from '@\/components\/Adsense'/);
  });

  it('gates the bootstrap and the slots on the same flag', () => {
    // If these drift apart you get either a bootstrap with no slots (wasted ad stack) or
    // slots that never fill (lost revenue). Both must hang off the same `showAds`.
    expect(ROUTE, 'the bootstrap is not behind showAds').toMatch(/\{showAds && <AdsenseScript \/>\}/);
    expect(ROUTE, 'no ad slot is behind showAds').toMatch(/showAds[\s\S]{0,200}<AdSlot /);
    // Nothing should be left on a hand-rolled condition.
    expect(ROUTE, 'an ad gate bypasses showAds').not.toMatch(/!page\.noAds && <Ad(Slot|senseScript)/);
  });

  it('derives every showAds definition from noAds', () => {
    // There are two - the article renderer and the core hub renderer. Both must honour it.
    const defs = [...ROUTE.matchAll(/const showAds =([\s\S]{0,180}?);/g)].map((m) => m[1]);
    expect(defs.length, 'expected a showAds definition in each renderer').toBe(2);
    for (const d of defs) {
      expect(d, `a showAds definition ignores noAds: ${d.trim()}`).toMatch(/!page\.noAds/);
    }
  });

  it('renders no bootstrap outside production', () => {
    // Preview deployments must never serve ads (AdSense policy).
    expect(COMPONENT).toMatch(/if \(!isProduction\(\)\) return null;/);
  });

  it('gates core hub ads on a real authored body, not just on being a core page', () => {
    // Widening the article gate to every core-page was tried and reverted: it missed the
    // pages worth monetising (locations and hub-designed pages return earlier) and caught
    // only /adstxt, /visit-bondi-beach and /tours - all zero-block scaffolds, one noindex.
    // Thin pages are the worst place for ads: no revenue, and AdSense's "low value content"
    // policy points straight at them.
    expect(ROUTE, 'the article gate must not include every core-page again').not.toMatch(
      /isArticle \|\| page\.contentType === 'core-page'/
    );
    const coreGate = ROUTE.match(
      /!page\.noAds && page\.indexable && Boolean\(page\.authoredBody\)[\s\S]{0,120}blocks\.length > 0/
    );
    expect(coreGate, 'core hub ads must require indexable + authoredBody + real blocks').toBeTruthy();
  });

  it('puts ads only on core hubs that have an authored body', () => {
    // Today exactly one qualifies. The rule is self-maintaining rather than a hardcoded
    // path, so this asserts the shape of the data the gate reads, not a page list.
    const overrides = JSON.parse(readFileSync('content/body-overrides.json', 'utf8'));
    const raw = JSON.parse(readFileSync('content/pages.json', 'utf8'));
    const pages: { path: string; contentType: string; indexable: boolean }[] = Array.isArray(raw)
      ? raw
      : raw.pages;
    const hubSrc = readFileSync('lib/hubs.ts', 'utf8');
    const hubPaths = new Set(
      [...hubSrc.matchAll(/^\s{2}'(\/[a-z0-9\-/]+)':\s*\{/gm)].map((m) => m[1])
    );
    const qualifying = pages.filter(
      (p) => hubPaths.has(p.path) && p.indexable && overrides[p.path]?.blocks?.length > 0
    );
    // The swim guide is the page this change existed for - if it stops qualifying, the
    // monetisation silently disappears from the site's third-busiest page.
    expect(qualifying.map((p) => p.path)).toContain('/where-to-swim-at-bondi-beach');
    // And the empty scaffolds must not creep in.
    for (const p of ['/tours', '/visit-bondi-beach', '/adstxt']) {
      expect(overrides[p]?.blocks?.length ?? 0, `${p} is a scaffold and must not carry ads`).toBe(0);
    }
  });

  it('keeps ads off pages flagged noAds', () => {
    // The obituary's noAds flag has to suppress the bootstrap, not just the slots -
    // otherwise a page we deliberately keep ad-free still loads the ad and consent stack.
    // Covered structurally above; this pins the page that flag exists for.
    const overrides = JSON.parse(readFileSync('content/body-overrides.json', 'utf8'));
    expect(
      overrides['/bondi-blog/matt-dee-bondi-rescue']?.noAds,
      'the obituary lost its noAds flag'
    ).toBe(true);
  });
});
