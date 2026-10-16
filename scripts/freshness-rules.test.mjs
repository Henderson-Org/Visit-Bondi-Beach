/**
 * Pins the calibration of the freshness classifier.
 *
 * The bug these tests exist to prevent: the first version of the classifier decided a
 * cadence from TOPIC WORDS, and put 66 authored bodies on a 45-day review clock because
 * "bus", "parking" or "cost" appeared three times - which, in a Bondi travel guide, is
 * almost every page. 28 of those quoted no price and no trading hour at all. A worklist
 * that cries wolf on half the corpus stops being read, which is worse than no worklist.
 *
 * So the rules under test encode two distinctions, and both are easy to regress:
 *   1. A quoted FIGURE earns `monthly`, not a mention of a volatile topic.
 *   2. A figure carrying an as-at date cannot mislead as it ages, so it earns `quarterly`.
 */
import { describe, it, expect } from 'vitest';
import { volatileFigures, classify } from './freshness-rules.mjs';

/** A body record shaped the way classify() reads it. */
const body = (path, ...paragraphs) => ({ path, blocks: paragraphs.map((text) => ({ type: 'p', text })) });

describe('volatileFigures', () => {
  it('treats an undated dollar amount as volatile', () => {
    const f = volatileFigures('Adult entry is $10.');
    expect(f.money).toBe(true);
    expect(f.undatedMoney).toBe(true);
    expect(f.any).toBe(true);
  });

  it('does not treat an as-at dated amount as volatile', () => {
    // The whole point: the reader can see the vintage, so it ages without lying.
    for (const dated of [
      'Adult entry is $10, as at August 2026.',
      'The fee is $19.00, as at mid-2026.',
      'Entry was $10 as of 2026.',
      'It costs $10 at the time of writing.',
    ]) {
      const f = volatileFigures(dated);
      expect(f.money, dated).toBe(true);
      expect(f.dated, dated).toBe(true);
      expect(f.undatedMoney, dated).toBe(false);
      expect(f.any, dated).toBe(false);
    }
  });

  it('counts a clock time only when its own sentence is about hours', () => {
    expect(volatileFigures('The bakery is open 7am to 1pm.').tradingHours).toBe(true);
    expect(volatileFigures('The last train leaves at 11pm.').tradingHours).toBe(true);
    // Advice, not an opening hour - this does not decay.
    expect(volatileFigures('Arrive before 9am to find a park.').tradingHours).toBe(false);
    expect(volatileFigures('I swim at 7am most mornings.').tradingHours).toBe(false);
  });

  it('does not let an hours word in a distant sentence license a time', () => {
    // Sentence-scoped, so "opening hours" three sentences away cannot promote "9am".
    const text = 'Opening hours vary by venue. Check before you go. Arrive by 9am.';
    expect(volatileFigures(text).tradingHours).toBe(false);
  });
});

describe('classify', () => {
  it('does NOT make a page monthly for mentioning a volatile topic', () => {
    // The exact shape of the original false positive: a coastal-walk guide that happens
    // to mention the bus repeatedly and quotes no figure at all.
    const [cls] = classify(
      body(
        '/bondi-blog/the-coastal-walk',
        'Take the bus to the start. The bus runs often. The bus is busy on weekends.',
        'Buses, buses, buses - the bus is the easiest way, and the bus beats parking.',
      ),
    );
    expect(cls).not.toBe('monthly');
  });

  it('makes an operational page monthly when it quotes an undated figure', () => {
    const [cls] = classify(
      body('/bondi-blog/airport-to-bondi', 'The Station Access Fee is $19.00 per adult on top of your fare.'),
    );
    expect(cls).toBe('monthly');
  });

  it('degrades the same page to quarterly once the figure is as-at dated', () => {
    const [cls, why] = classify(
      body('/bondi-blog/airport-to-bondi', 'The Station Access Fee is $19.00 per adult, as at mid-2026.'),
    );
    expect(cls).toBe('quarterly');
    expect(why).toMatch(/as-at date/);
  });

  it('keeps a priced page monthly even when another topic dominates the text', () => {
    // Regression guard: the locker guide quotes $6/$9/$15 but says "café" repeatedly, and
    // the body-count loop was about to hand it to the quarterly venues rule.
    const [cls] = classify(
      body(
        '/bondi-blog/lockers',
        'Lockers cost $6, $9 or $15 depending on size.',
        'cafe cafe cafe cafe cafe cafe cafe cafe cafe restaurant restaurant coffee coffee',
      ),
    );
    expect(cls).toBe('monthly');
  });

  it('sends a page with no volatile figure to a longer cadence than monthly', () => {
    const [cls] = classify(body('/bondi-blog/is-bondi-junction-the-same', 'Two different places, 3km apart.'));
    expect(['quarterly', 'seasonal', 'annual', 'evergreen']).toContain(cls);
  });

  it('classifies the daylight-saving rule as annual, not monthly', () => {
    // Its only figures are 2:00am/3:00am changeover times: a fixed rule whose dates move
    // once a year. A 45-day clock on it is pure noise.
    const [cls] = classify(
      body('/bondi-blog/daylight-saving-time-in-sydney', 'Clocks go forward from 2:00am to 3:00am in October.'),
    );
    expect(cls).toBe('annual');
  });
});
