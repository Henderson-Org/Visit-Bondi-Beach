/**
 * Structured-data helpers. Only emit schema that the visible page genuinely
 * supports — never fabricate ratings, prices, hours or reviews.
 */
import { SITE, siteOrigin } from './site';
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
  if (page.metaDescription) data.description = page.metaDescription;
  if (page.publishedAt) data.datePublished = page.publishedAt;
  if (page.lastmod) data.dateModified = page.lastmod;
  if (page.heroImage) data.image = page.heroImage;
  return data;
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
