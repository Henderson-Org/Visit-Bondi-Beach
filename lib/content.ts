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
  | 'tag';

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

/** Human title with sensible fallbacks when crawl metadata is absent. */
export function displayTitle(p: Page): string {
  if (p.h1) return p.h1;
  if (p.title) return p.title.replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').trim();
  const slug = p.path.split('/').filter(Boolean).pop() || p.path;
  return decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
