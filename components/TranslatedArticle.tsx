import Link from 'next/link';
import Image from 'next/image';
import type { Page } from '@/lib/content';
import { BodyBlocks } from '@/components/BodyBlocks';
import { LanguageLinks } from '@/components/LanguageLinks';
import { breadcrumbJsonLd, articleJsonLd } from '@/lib/structured-data';
import { AUTHOR } from '@/lib/site';
import { UI_STRINGS, LOCALE_HREFLANG, localizedPath, type Locale } from '@/lib/i18n';

/**
 * Renders a translated article. Kept separate from the English ArticlePage so English rendering
 * is untouched. The content region carries `lang`; schema (BlogPosting) is self-consistent with
 * the localized URL + inLanguage (never claims the English URL). In-body links that have no
 * translated equivalent point at the English page — a deliberate, acceptable fallback.
 */
export function TranslatedArticle({ page, locale }: { page: Page; locale: Locale }) {
  const s = UI_STRINGS[locale];
  const title = page.h1 || page.title;
  const url = localizedPath(page.path, locale);
  const crumbs = [
    { name: s.home, path: '/' },
    { name: title, path: url },
  ];
  const updated = page.lastmod || page.publishedAt;
  return (
    <article lang={LOCALE_HREFLANG[locale]} className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page, { url, inLanguage: LOCALE_HREFLANG[locale] })) }} />

      <nav aria-label="Breadcrumb" className="text-xs text-ink-500">
        <Link href="/" className="hover:text-ocean-700">{s.home}</Link>
      </nav>
      <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight tracking-tight text-ink-900">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {s.by} {AUTHOR.name}
        {updated && <> · {s.updated} <time dateTime={updated}>{new Date(updated).toISOString().slice(0, 10)}</time></>}
      </p>

      {page.heroImage && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-sand-200">
          <Image src={page.heroImage} alt={title} fill sizes="(max-width: 768px) 100vw, 768px" priority className="object-cover" />
        </div>
      )}

      {page.blocks && page.blocks.length > 0 && <BodyBlocks blocks={page.blocks} />}

      {page.sources && page.sources.length > 0 && (
        <footer className="mt-8 border-t border-sand-200 pt-4 text-sm text-ink-500">
          <p className="font-medium text-ink-700">{s.sources}</p>
          <ul className="mt-1 list-disc pl-5">
            {page.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} rel="nofollow noopener" target="_blank" className="text-ocean-700 underline">{src.label}</a>
              </li>
            ))}
          </ul>
        </footer>
      )}

      <LanguageLinks path={page.path} current={locale} />
    </article>
  );
}
