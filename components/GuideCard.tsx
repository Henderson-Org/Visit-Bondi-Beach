import Link from 'next/link';
import Image from 'next/image';
import { displayTitle, type Page } from '@/lib/content';

/**
 * The shared image-led guide card used across category hubs and the homepage
 * "Popular Bondi guides" section, so both read as one system. `GuideCard` is the
 * enclosed card; `FeatureCard` is the large hero-style lead card.
 */
export interface GuideCardData {
  title: string;
  href: string;
  image: string | null;
  excerpt: string;
}

// Decode the few HTML entities that survive in crawled text, and strip the
// brand/nav boilerplate ("… - Visit Bondi Beach Visit Bondi Beach … What's On …")
// that pollutes some crawled intros. Authored meta/body text is already clean.
export function cleanText(s = ''): string {
  return s
    .replace(/&mdash;/g, '-').replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&apos;/g, '’')
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
    .replace(/\s*[—-]?\s*Visit Bondi Beach\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Excerpt from authored meta description, else the first paragraph of an authored
// body - never the raw crawled intro (which is nav boilerplate). Empty is fine.
export function excerptFor(target: Page | undefined): string {
  const md = cleanText(target?.metaDescription || '');
  if (md.length >= 20) return md;
  const firstP = (target?.blocks || []).find((b) => b.type === 'p' && 'text' in b && b.text);
  return firstP && 'text' in firstP ? cleanText(firstP.text) : '';
}

/** Build card data straight from a page (homepage / related use this). */
export function guideCardFromPage(page: Page): GuideCardData {
  return {
    title: displayTitle(page),
    href: page.path,
    image: page.heroImage || null,
    excerpt: excerptFor(page),
  };
}

export function GuideCard({ card }: { card: GuideCardData }) {
  return (
    <Link
      href={card.href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-ocean-500 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-200">
        {card.image && (
          <Image
            src={card.image}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg leading-snug text-ink-900 group-hover:text-ocean-700">{card.title}</h3>
        {card.excerpt && <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{card.excerpt}</p>}
      </div>
    </Link>
  );
}

export function FeatureCard({ card }: { card: GuideCardData }) {
  return (
    <Link
      href={card.href}
      className="group relative flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-2xl bg-ink-900 sm:min-h-[20rem]"
    >
      {card.image && (
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/30 to-transparent" aria-hidden="true" />
      <div className="relative p-5 sm:p-6">
        <h3 className="font-display text-2xl leading-tight text-white sm:text-3xl">{card.title}</h3>
        {card.excerpt && <p className="mt-2 max-w-prose text-sm text-sand-50/90 line-clamp-2">{card.excerpt}</p>}
        <span className="mt-3 inline-block text-sm font-medium text-sand-50 group-hover:underline">Read the guide →</span>
      </div>
    </Link>
  );
}
