/**
 * `noAds` marks a page where running display ads would cost more trust than the
 * impressions are worth - an obituary, a death, a serious incident.
 *
 * It has to survive a three-step journey: authored in content/bodies/*.json, emitted by
 * scripts/build-bodies.mjs into content/body-overrides.json, then overlaid onto the Page in
 * lib/content.ts. The middle step is the fragile one - that emitter has silently dropped a
 * field before (freshnessClass), and the symptom would be ads quietly reappearing on an
 * obituary with nothing failing to build.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getPage } from './content';

const OBITUARY = '/bondi-blog/matt-dee-bondi-rescue';

describe('sensitive pages carry no ads', () => {
  it('is authored in the body file', () => {
    const body = JSON.parse(readFileSync('content/bodies/matt-dee-bondi-rescue.json', 'utf8'));
    expect(body.noAds).toBe(true);
  });

  it('survives the build into body-overrides.json', () => {
    const overrides = JSON.parse(readFileSync('content/body-overrides.json', 'utf8'));
    expect(overrides[OBITUARY], 'obituary body missing from the compiled overrides').toBeDefined();
    expect(overrides[OBITUARY].noAds, 'build-bodies.mjs dropped noAds').toBe(true);
  });

  it('reaches the Page the renderer reads', () => {
    expect(getPage(OBITUARY)?.noAds).toBe(true);
  });

  it('leaves ads on for ordinary articles', () => {
    // The flag must be opt-in: a default of true would quietly switch off the site's
    // monetisation everywhere.
    expect(getPage('/bondi-blog/bondi-rescue-who-are-the-lifeguards')?.noAds).toBe(false);
  });
});
