/**
 * Third-party embed containment is two halves that only work together: the `data-no-embed`
 * marker in components/blocks.tsx, and the rule in app/globals.css that acts on it. Either
 * can be deleted on its own without anything failing to compile, and the symptom would not
 * show up until an ad script injected into a quick-facts tile on production.
 *
 * These tests only assert the two halves are both present and refer to each other. They do
 * NOT prove the containment works — CSS is not exercised here. That was verified in a real
 * browser at 393px: injecting a hotel widget into a tile grew it from 96px to 427px without
 * the guard, and left it at 96px with it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('app/globals.css', 'utf8');
const BLOCKS = readFileSync('components/blocks.tsx', 'utf8');

describe('third-party embed containment', () => {
  it('marks the quick-facts tile as no-embed', () => {
    // The tile is ~160px wide on a phone and renders only text, so an injected widget
    // cannot fit and cannot be anything of ours.
    const quickFacts = BLOCKS.slice(BLOCKS.indexOf('export function QuickFacts'));
    const tile = quickFacts.slice(0, quickFacts.indexOf('</dl>'));
    expect(tile, 'QuickFacts tile lost its data-no-embed marker').toContain('data-no-embed');
  });

  it('carries the rule that acts on the marker', () => {
    expect(CSS, 'globals.css has no [data-no-embed] rule').toContain('[data-no-embed]');
    // Hiding foreign children is the whole mechanism; a rule that stopped doing that would
    // leave the marker in place and silently stop containing anything.
    const rule = CSS.slice(CSS.indexOf('[data-no-embed]'));
    expect(rule).toMatch(/display:\s*none\s*!important/);
  });

  it('keeps the rule structural rather than keyed on a third party class name', () => {
    // The point of matching on our own <dt>/<dd> is that Travelpayouts can change their
    // markup at any time and we would never know. A rule naming their classes would rot.
    const rule = CSS.slice(CSS.indexOf('[data-no-embed]'), CSS.indexOf('[data-no-embed]') + 220);
    expect(rule).toContain('dt');
    expect(rule).toContain('dd');
    expect(rule.toLowerCase()).not.toContain('tp-');
  });
});
