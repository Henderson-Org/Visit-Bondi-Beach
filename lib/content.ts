/**
 * Content access layer. Reads the committed content/pages.json produced by
 * scripts/build-content.mjs from the migration crawl.
 */
import pagesData from '@/content/pages.json';

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
  wordCount: number;
  jsonLdTypes: string[];
  publishedAt: string | null;
  lastmod: string | null;
  indexable: boolean;
  status: number | null;
  liveUrl: string;
  sections?: HubSection[] | null;
  authored?: boolean;
}

const PAGES = pagesData as unknown as Page[];
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

/** Human title with sensible fallbacks when crawl metadata is absent. */
export function displayTitle(p: Page): string {
  if (p.h1) return p.h1;
  if (p.title) return p.title.replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').trim();
  const slug = p.path.split('/').filter(Boolean).pop() || p.path;
  return decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
