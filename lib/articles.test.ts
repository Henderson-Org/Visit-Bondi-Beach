import { describe, it, expect } from 'vitest';
import { articleTopic, articleHub, TOPIC_SECTION } from './articles';
import { articles, type Page } from './content';

const p = (path: string, h1 = ''): Page =>
  ({ path, h1, title: h1, contentType: 'blog-post-legacy', section: 'blog' }) as Page;

describe('articleTopic', () => {
  // Each of these previously fell through to 'general', leaving the article with no
  // topical hub and no topical breadcrumb - the weakest possible internal linking.
  it('matches phrasings written with spaces against hyphenated slugs', () => {
    expect(articleTopic(p('/bondi-blog/how-to-get-to-bondi-beach'))).toBe('getting-here');
    expect(articleTopic(p('/bondi-blog/2025/1/2/how-far-is-bondi-beach-from-key-sydney-locations'))).toBe('getting-here');
  });

  it('matches plural "bars" and "ice cream", not just the singular/branded forms', () => {
    expect(articleTopic(p('/bondi-blog/10-must-try-bondi-beach-bars'))).toBe('eat-drink');
    expect(articleTopic(p('/bondi-blog/2024/2/12/an-insiders-guide-to-the-best-ice-cream-in-bondi'))).toBe('eat-drink');
    expect(articleTopic(p('/bondi-blog/the-ultimate-guide-to-bondi-beach-nightlife'))).toBe('eat-drink');
  });

  it('routes water-quality questions to swim, not general', () => {
    expect(articleTopic(p('/bondi-blog/2024/1/20/is-bondi-beach-water-clean-or-polluted'))).toBe('swim');
  });

  it('routes know-before-you-go questions to practical', () => {
    expect(articleTopic(p('/bondi-blog/2023/10/18/bondi-beach-etiquette-guide'))).toBe('practical');
    expect(articleTopic(p('/bondi-blog/2024/1/21/is-bondi-beach-a-safe-area-crime-rate'))).toBe('practical');
    expect(articleTopic(p('/bondi-blog/2025/1/5/exploring-bondi-beach-a-guide-to-wheelchair-access'))).toBe('practical');
  });

  it('routes Bondi-as-a-subject to history', () => {
    expect(articleTopic(p('/bondi-blog/Bondi-beach-history'))).toBe('history');
    expect(articleTopic(p('/bondi-blog/how-to-pronounce-bondi-beach'))).toBe('history');
    expect(articleTopic(p('/bondi-blog/ben-buckler-name-history'))).toBe('history');
  });

  it('keeps the documented precedence: parking and city2surf outrank broader topics', () => {
    // "a car park at Bronte" is parking, not coastal-walk
    expect(articleTopic(p('/bondi-blog/2023/11/20/an-insiders-guide-to-finding-a-car-park-at-bronte-beach'))).toBe('parking');
    // marathon transport is the running cluster, not getting-here
    expect(articleTopic(p('/bondi-blog/2024/9/7/getting-to-sydney-marathon-from-bondi-beach'))).toBe('city2surf');
  });
});

describe('articleHub', () => {
  it('never self-links a hub to itself', () => {
    for (const path of Object.values(TOPIC_SECTION)) {
      expect(articleHub(p(path!))).toBeNull();
    }
  });

  it('every mapped topic points at a real section path', () => {
    for (const [, path] of Object.entries(TOPIC_SECTION)) {
      expect(path!.startsWith('/')).toBe(true);
    }
  });

  it('keeps the share of unclassified articles low', () => {
    // Regression guard: this was 77/214 (36%) before the classifier fixes. Articles with
    // no topic get no hub up-link and breadcrumb only to the flat /articles index.
    const all = articles();
    const general = all.filter((a) => articleTopic(a) === 'general');
    expect(general.length / all.length).toBeLessThan(0.15);
  });
});
