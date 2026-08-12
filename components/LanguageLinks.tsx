import Link from 'next/link';
import { availableLocales } from '@/lib/translations';
import { LOCALE_LABEL, UI_STRINGS, localizedPath, type Locale } from '@/lib/i18n';

/**
 * A DISCREET, contextual language control - the only visible surfacing of translations.
 * Rendered small and muted at the very end of an article, and only when a translation exists.
 * No global selector, no banner, no auto-redirect: discovery is meant to happen via Google
 * (hreflang) and direct links, with this as a quiet convenience. Keeps the English experience
 * essentially unchanged while never hiding translated pages from users or crawlers.
 */
export function LanguageLinks({ path, current }: { path: string; current: Locale | null }) {
  const locales = availableLocales(path);
  if (locales.length === 0) return null;

  // On an English page: a quiet "also available in" line to the translations.
  if (current === null) {
    return (
      <div className="mt-10 border-t border-sand-200 pt-4 text-xs text-ink-400">
        <span className="mr-1">Also available in:</span>
        {locales.map((l, i) => (
          <span key={l}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <Link href={localizedPath(path, l)} hrefLang={l} className="hover:text-ocean-700 hover:underline">
              {LOCALE_LABEL[l]}
            </Link>
          </span>
        ))}
      </div>
    );
  }

  // On a translated page: the other languages + a link back to the English original.
  const s = UI_STRINGS[current];
  const others = locales.filter((l) => l !== current);
  return (
    <div className="mt-10 border-t border-sand-200 pt-4 text-xs text-ink-400" lang="en">
      <span className="mr-1">{s.readIn}:</span>
      <Link href={path} hrefLang="en" className="hover:text-ocean-700 hover:underline">{s.english}</Link>
      {others.map((l) => (
        <span key={l}>
          <span aria-hidden="true"> · </span>
          <Link href={localizedPath(path, l)} hrefLang={l} className="hover:text-ocean-700 hover:underline">
            {LOCALE_LABEL[l]}
          </Link>
        </span>
      ))}
    </div>
  );
}
