/**
 * Structured-data helpers. Only emit schema that the visible page genuinely
 * supports — never fabricate ratings, prices, hours or reviews.
 */
import { SITE, AUTHOR, siteOrigin } from './site';
import type { Page } from './content';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: siteOrigin(),
    sameAs: [SITE.instagram],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: siteOrigin(),
    description: SITE.description,
  };
}

export function articleJsonLd(page: Page) {
  const url = `${siteOrigin()}${page.path}`;
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.h1 || page.title,
    url,
    mainEntityOfPage: url,
    isPartOf: { '@type': 'Blog', name: `${SITE.name} — What's On`, url: `${siteOrigin()}/bondi-blog` },
  };
  data.author = { '@type': AUTHOR.type, name: AUTHOR.name, url: AUTHOR.url, description: AUTHOR.bio };
  data.publisher = { '@type': 'Organization', name: SITE.name, url: siteOrigin() };
  if (page.metaDescription) data.description = page.metaDescription;
  if (page.publishedAt) data.datePublished = page.publishedAt;
  if (page.lastmod) data.dateModified = page.lastmod;
  if (page.wordCount) data.wordCount = page.wordCount;
  // Schema image must be an absolute, canonical URL on the production domain.
  // heroImage is a local path (/images/...), so resolve it against the origin.
  if (page.heroImage) {
    data.image = page.heroImage.startsWith('http') ? page.heroImage : `${siteOrigin()}${page.heroImage}`;
  }
  return data;
}

/** FAQPage schema — only emit when the same Q&As are visibly on the page (brief §24). */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/**
 * ItemList schema for a curated list (e.g. accommodation options). Names + optional
 * descriptions only — deliberately NO ratings, prices or review counts, so we never
 * emit an unsupported AggregateRating/Offer (Stay brief: no fake ratings).
 */
export function itemListJsonLd(
  name: string,
  items: { name: string; description?: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LodgingBusiness',
        name: it.name,
        ...(it.description ? { description: it.description } : {}),
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${siteOrigin()}${it.path}`,
    })),
  };
}
