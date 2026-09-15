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

  it('is gated by the same condition as the ad slots it serves', () => {
    // If these two drift apart you get either a bootstrap with no slots, or slots that
    // never fill.
    const bootstrapGate = /\{isArticle && !page\.noAds && <AdsenseScript \/>\}/;
    const slotGate = /\{isArticle && !page\.noAds && <AdSlot /;
    expect(ROUTE, 'the bootstrap is not behind isArticle && !page.noAds').toMatch(bootstrapGate);
    expect(ROUTE, 'the ad slots are not behind isArticle && !page.noAds').toMatch(slotGate);
  });

  it('renders no bootstrap outside production', () => {
    // Preview deployments must never serve ads (AdSense policy).
    expect(COMPONENT).toMatch(/if \(!isProduction\(\)\) return null;/);
  });

  it('keeps ads off pages flagged noAds', () => {
    // The obituary's noAds flag has to suppress the bootstrap, not just the slots -
    // otherwise a page we deliberately keep ad-free still loads the ad and consent stack.
    const gate = ROUTE.match(/!page\.noAds && <AdsenseScript/);
    expect(gate, 'noAds does not suppress the AdSense bootstrap').toBeTruthy();
  });
});
