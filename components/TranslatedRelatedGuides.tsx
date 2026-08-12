import Link from 'next/link';
import { relatedPages, displayTitle, type Page } from '@/lib/content';
import { translatedTitle } from '@/lib/translations';
import { UI_STRINGS, LOCALE_HREFLANG, localizedPath, type Locale } from '@/lib/i18n';

/**
 * "Read next" for a translated article — the internal-linking surface the English page has but the
 * translations previously lacked, leaving them near dead-ends for crawlers. Each related guide links
 * to its SAME-LANGUAGE translation where one exists (so readers and crawl paths stay in-language and
 * the translations gain internal links to help them get indexed and rank); it falls back to the
 * English page only when that guide isn't translated — a deliberate, marked (`hrefLang="en"`) link,
 * not an accident. Same-language links are surfaced first so the in-language paths lead.
 */
export function TranslatedRelatedGuides({ page, locale }: { page: Page; locale: Locale }) {
  // Pull a deeper related set than we'll show (still all above the relevance threshold), so we can
  // prefer the ones that exist in this language — surfacing more in-language internal links without
  // going off-topic — before filling any remaining slots with English fallbacks.
  const items = relatedPages(page, 12)
    .map((p) => {
      const tt = translatedTitle(locale, p.path);
      return tt
        ? { key: p.path, href: localizedPath(p.path, locale), title: tt, sameLang: true }
        : { key: p.path, href: p.path, title: displayTitle(p), sameLang: false };
    })
    // Stable sort: same-language first, English fallbacks after; relevance order kept within each.
    .sort((a, b) => Number(b.sameLang) - Number(a.sameLang))
    .slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section aria-label="Read next" className="mt-12 border-t border-sand-200 pt-6">
      <h2 className="font-display text-xl text-ink-900">{UI_STRINGS[locale].readNext}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              hrefLang={it.sameLang ? LOCALE_HREFLANG[locale] : 'en'}
              className="block rounded-lg border border-sand-200 bg-white p-4 hover:border-ocean-500"
            >
              <span className="font-medium text-ink-900">{it.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
