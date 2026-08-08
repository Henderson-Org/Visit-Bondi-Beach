/**
 * Content access layer. Reads the committed content/pages.json produced by
 * scripts/build-content.mjs from the migration crawl, then overlays authored
 * first-person bodies from content/body-overrides.json (see below).
 */
import pagesData from '@/content/pages.json';
import bodyOverridesData from '@/content/body-overrides.json';

export type ContentType =
  | 'core-page'
  | 'blog-index'
  | 'blog-post-dated'
  | 'blog-post-legacy'
  | 'category'
  | 'tag'
  | 'hub';

export interface HubSection {
  heading: string;
  intro?: string;
  links: { title: string; path: string }[];
}

export interface QuickFact {
  label: string;
  value: string;
}
export interface FaqItem {
  q: string;
  a: string;
}
export interface ItineraryStop {
  time: string;
  title: string;
  detail?: string;
}

/**
 * A content block. The first form (text-bearing) covers migrated crawl content
 * (p/h2/h3/li/quote). The richer forms are used by authored first-person bodies
 * (content/bodies/*.json) to drive the editorial components in components/blocks.tsx.
 */
export type Block =
  | { type: 'p' | 'h2' | 'h3' | 'li' | 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'localTip'; text: string }
  | { type: 'callout'; tone?: 'note' | 'warning'; title?: string; text: string }
  | { type: 'quickFacts'; items: QuickFact[] }
  | { type: 'faq'; items: FaqItem[] }
  | { type: 'itinerary'; stops: ItineraryStop[] };

export interface Source {
  label: string;
  url: string;
}

export interface Page {
  path: string;
  contentType: ContentType;
  section: string;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  headings: string[];
  ogImage: string;
  heroImage: string;
  intro: string;
  blocks?: Block[] | null;
  wordCount: number;
  jsonLdTypes: string[];
  publishedAt: string | null;
  lastmod: string | null;
  impressions?: number;
  clicks?: number;
  indexable: boolean;
  status: number | null;
  liveUrl: string;
  sections?: HubSection[] | null;
  authored?: boolean;
  // Set when an authored first-person body (content/bodies/*.json) replaces the
  // crawled body for this page. `sources`/`lastReviewed` back the editorial
  // provenance rules (carry a "last checked" date; cite authoritative sources).
  authoredBody?: boolean;
  sources?: Source[] | null;
  lastReviewed?: string | null;
}

interface BodyOverride {
  blocks: Block[];
  wordCount?: number;
  sources?: Source[];
  lastReviewed?: string;
  voice?: string;
}

// Authored first-person bodies, keyed by page path. Compiled from the per-article
// files in content/bodies/*.json by scripts/build-bodies.mjs. Merged here at load
// time (not in the crawl pipeline) so authored bodies replace crawled content and
// survive a re-crawl regardless of how content/pages.json was rebuilt.
const BODY_OVERRIDES = bodyOverridesData as unknown as Record<string, BodyOverride>;

const PAGES = (pagesData as unknown as Page[]).map((p) => {
  const ov = BODY_OVERRIDES[p.path];
  if (!ov) return p;
  return {
    ...p,
    blocks: ov.blocks,
    wordCount: ov.wordCount ?? p.wordCount,
    sources: ov.sources ?? null,
    lastReviewed: ov.lastReviewed ?? null,
    authoredBody: true,
  } as Page;
});
const BY_PATH = new Map(PAGES.map((p) => [p.path, p]));

function normalize(p: string): string {
  try {
    return decodeURIComponent(p).toLowerCase();
  } catch {
    return p.toLowerCase();
  }
}
const BY_NORMALIZED = new Map(PAGES.map((p) => [normalize(p.path), p]));

export function allPages(): Page[] {
  return PAGES;
}

export function getPage(path: string): Page | undefined {
  return BY_PATH.get(path);
}

/**
 * Resolve a page from catch-all route segments. Exact (case-sensitive) match wins
 * — preserving Squarespace's case-sensitive URLs — with a decoded/normalized
 * fallback for percent-encoded slugs (e.g. category "Out+%26+About").
 */
export function getPageBySegments(segments: string[]): Page | undefined {
  const path = '/' + segments.join('/');
  return BY_PATH.get(path) || BY_NORMALIZED.get(normalize(path));
}

/** All content paths except the homepage (handled by app/page.tsx). */
export function allContentPaths(): string[] {
  return PAGES.filter((p) => p.path !== '/').map((p) => p.path);
}

export function articles(): Page[] {
  return PAGES.filter(
    (p) => p.contentType === 'blog-post-dated' || p.contentType === 'blog-post-legacy'
  );
}

/** Most recent dated articles first; legacy (undated) fall to the end. */
export function recentArticles(limit = 12): Page[] {
  return [...articles()]
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, limit);
}

/**
 * Homepage featured articles, ranked by real search demand (Search Console
 * impressions) rather than recency. Order: impressions → clicks → recency
 * (recency is only a tie-breaker). Articles with no demand data fall back to
 * the existing recency ordering to keep the homepage full and functional.
 */
export function featuredArticles(limit = 12): Page[] {
  const arts = articles();
  const byDemand = arts
    .filter((p) => (p.impressions || 0) > 0)
    .sort(
      (a, b) =>
        (b.impressions || 0) - (a.impressions || 0) ||
        (b.clicks || 0) - (a.clicks || 0) ||
        (b.publishedAt || '').localeCompare(a.publishedAt || '')
    );
  if (byDemand.length >= limit) return byDemand.slice(0, limit);
  // Graceful fallback: top up with the existing recency logic.
  const chosen = new Set(byDemand.map((p) => p.path));
  const byRecency = arts
    .filter((p) => !chosen.has(p.path))
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return [...byDemand, ...byRecency].slice(0, limit);
}

export function categories(): Page[] {
  return PAGES.filter((p) => p.contentType === 'category');
}

const STOP = new Set([
  'the', 'a', 'an', 'to', 'at', 'in', 'on', 'of', 'for', 'and', 'or', 'your', 'you',
  'is', 'are', 'how', 'what', 'where', 'best', 'guide', 'bondi', 'beach', 'ultimate',
  'with', 'from', 'near', 'can', 'do', 'things', '2024', '2025', '2026',
]);

function tokens(p: Page): Set<string> {
  const src = `${p.path} ${p.h1} ${p.title}`.toLowerCase();
  return new Set(
    src
      .replace(/[^a-z0-9\s/-]/g, ' ')
      .split(/[\s/-]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/**
 * Semantically-related pages by shared meaningful slug/title terms (brief §43).
 * Not random-recent: scored by token overlap, same-section preferred, self excluded.
 */
export function relatedPages(page: Page, limit = 4): Page[] {
  const base = tokens(page);
  if (base.size === 0) return recentArticles(limit);
  return PAGES.filter((p) => p.path !== page.path && p.indexable && p.contentType !== 'tag' && p.contentType !== 'category')
    .map((p) => {
      const t = tokens(p);
      let overlap = 0;
      for (const w of base) if (t.has(w)) overlap++;
      const sectionBonus = p.section === page.section ? 0.5 : 0;
      return { p, score: overlap + sectionBonus };
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/** Breadcrumb trail for a page. Richer topical IA is a roadmap item (see SITE_AUDIT.md). */
export function breadcrumbs(page: Page): { name: string; path: string }[] {
  const home = { name: 'Home', path: '/' };
  if (page.section === 'blog' && page.contentType !== 'blog-index') {
    return [home, { name: "What's On", path: '/bondi-blog' }, { name: displayTitle(page), path: page.path }];
  }
  if (page.contentType === 'blog-index') return [home, { name: "What's On", path: '/bondi-blog' }];
  return [home, { name: displayTitle(page), path: page.path }];
}

/**
 * FAQ items declared in an authored body's `faq` blocks. Used to emit FAQPage
 * schema only when the same Q&As are visibly rendered on the page (brief §24).
 */
export function faqItems(page: Page): FaqItem[] {
  if (!page.blocks) return [];
  const out: FaqItem[] = [];
  for (const b of page.blocks) if (b.type === 'faq') out.push(...b.items);
  return out;
}

/** Human title with sensible fallbacks when crawl metadata is absent. */
export function displayTitle(p: Page): string {
  if (p.h1) return p.h1;
  if (p.title) return p.title.replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').trim();
  const slug = p.path.split('/').filter(Boolean).pop() || p.path;
  return decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
