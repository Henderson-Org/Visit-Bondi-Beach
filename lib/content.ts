/**
 * Content access layer. Reads the committed content/pages.json produced by
 * scripts/build-content.mjs from the migration crawl, then overlays authored
 * first-person bodies from content/body-overrides.json (see below).
 */
import pagesData from '@/content/pages.json';
import bodyOverridesData from '@/content/body-overrides.json';
// Note: articles.ts imports from this module too; the cycle is safe because both sides
// only use the other's bindings at call time (never at module init).
import { articleHub } from '@/lib/articles';

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
  /** Optional small category label shown above the heading (editorial eyebrow). */
  eyebrow?: string;
  links: { title: string; path: string }[];
}

export interface QuickFact {
  label: string;
  value: string;
  /**
   * When set, the `value` is replaced at render time with a live reading (server
   * fetched + cached). Currently only 'waterTemp' (today's Bondi sea-surface temp).
   * `value` is kept as the fallback shown when the live reading is unavailable.
   */
  live?: 'waterTemp';
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
  | { type: 'answer'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'localTip'; text: string }
  | { type: 'callout'; tone?: 'note' | 'warning'; title?: string; text: string }
  | { type: 'quickFacts'; items: QuickFact[] }
  | { type: 'faq'; items: FaqItem[] }
  | { type: 'table'; caption?: string; columns: string[]; rows: string[][] }
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
 * Coarse topic key for an article, used to keep the homepage topically diverse.
 * Known clusters are matched by keyword first (so, e.g., all five City2Surf
 * pieces collapse to one topic); everything else falls back to its most
 * distinctive slug/title term. Editorial, deliberately simple.
 */
function topicKey(p: Page): string {
  const s = `${p.path} ${p.h1} ${p.title}`.toLowerCase();
  const rules: [RegExp, string][] = [
    [/city-?2-?surf|city[- ]to[- ]surf|heartbreak/, 'city2surf'],
    [/marathon/, 'marathon'],
    [/car-?park|parking/, 'parking'],
    [/coffee|caf[eé]|espresso|barista/, 'coffee'],
    [/lifeguard|bondi-rescue|\brescue\b/, 'bondi-rescue'],
    [/icebergs/, 'icebergs'],
    [/bronte|tamarama|coogee|coastal[- ]walk/, 'coastal-walk'],
    [/snorkel|where-to-swim|\bswim(ming)?\b/, 'swimming'],
    [/accommodation|hotel|stay|airbnb/, 'accommodation'],
    [/restaurant|eat|dining|brunch|food/, 'eat-drink'],
    [/pub|bar|nightlife|drink/, 'nightlife'],
    [/weather|temperature|rain|sunrise|sunset/, 'weather'],
    [/kid|family|children/, 'family'],
    [/history|famous|history/, 'history'],
    [/park(ing)?-ranger/, 'parking'],
  ];
  for (const [re, key] of rules) if (re.test(s)) return key;
  const t = [...tokens(p)];
  return t[0] || p.path;
}

/**
 * Homepage featured articles, ranked by real search demand (Search Console
 * impressions), then de-duplicated so each TOPIC appears only once — we keep the
 * highest-ranked article per topic and pull in the next distinct topic for the
 * remaining slots (so the homepage isn't five City2Surf posts). Order within the
 * candidate pool: impressions → clicks → recency; articles with no demand data
 * sort last, keeping the grid full and functional.
 */
export function featuredArticles(limit = 12): Page[] {
  const ranked = [...articles()].filter((p) => p.indexable).sort(
    (a, b) =>
      (b.impressions || 0) - (a.impressions || 0) ||
      (b.clicks || 0) - (a.clicks || 0) ||
      (b.publishedAt || '').localeCompare(a.publishedAt || '')
  );
  const seenTopics = new Set<string>();
  const out: Page[] = [];
  const overflow: Page[] = [];
  for (const p of ranked) {
    const key = topicKey(p);
    if (seenTopics.has(key)) {
      overflow.push(p); // keep as backfill in case we run short of distinct topics
      continue;
    }
    seenTopics.add(key);
    out.push(p);
    if (out.length >= limit) return out;
  }
  // Fewer distinct topics than slots (unlikely): backfill to keep the grid full.
  return [...out, ...overflow].slice(0, limit);
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
  // Editorial posts now live under the Articles hub in the site IA (their URLs are
  // unchanged; only the section framing moved). "What's On" is events-only.
  if (page.section === 'blog' && page.contentType !== 'blog-index') {
    // Route each article to its TOPICAL hub as the immediate parent (Home › {Hub} › post)
    // so the breadcrumb — the most reliable spoke→hub signal — reinforces the subject hub
    // rather than the generic /articles index. Falls back to Articles for unmapped topics.
    const hub = articleHub(page);
    const parent = hub ? { name: hub.label, path: hub.path } : { name: 'Articles', path: '/articles' };
    return [home, parent, { name: displayTitle(page), path: page.path }];
  }
  if (page.contentType === 'blog-index') return [home, { name: 'Articles', path: '/articles' }];
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
