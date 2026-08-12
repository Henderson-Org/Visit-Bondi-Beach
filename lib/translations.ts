/**
 * Translation access layer. Overlays a translated title/description/H1/intro/blocks onto the
 * English page (so a translated page inherits image, section, dates, schema entity, etc. and
 * only the visible copy changes). Compiled from content/translations/<locale>/*.json by
 * scripts/build-translations.mjs into content/translation-overrides.json, keyed `${locale}::${path}`.
 */
import overrides from '@/content/translation-overrides.json';
import { getPage, type Page, type Block } from '@/lib/content';
import { LOCALES, type Locale } from '@/lib/i18n';
import { isRedirectedOrOwned } from '@/lib/redirects';

interface TxOverride {
  title?: string;
  metaDescription?: string;
  h1?: string;
  intro?: string;
  blocks: Block[];
}
const TX = overrides as unknown as Record<string, TxOverride>;
const key = (locale: Locale, path: string) => `${locale}::${path}`;

/**
 * A translation is "live" only while its English base is a real, non-redirected page. This makes
 * translations automatically follow their English page: redirect or remove the English article and
 * its translations stop being generated, served, sitemapped and hreflang-advertised in lock-step —
 * so no hreflang ever points at a 301/404 (the classic way a translation cluster rots).
 */
function isLiveBase(path: string): boolean {
  return !isRedirectedOrOwned(path) && !!getPage(path);
}

/** The translated Page for (locale, English path), or undefined if no live translation exists. */
export function getTranslation(locale: Locale, path: string): Page | undefined {
  const ov = TX[key(locale, path)];
  if (!ov || !isLiveBase(path)) return undefined;
  const base = getPage(path)!;
  return {
    ...base,
    title: ov.title ?? base.title,
    metaDescription: ov.metaDescription ?? base.metaDescription,
    h1: ov.h1 ?? base.h1,
    intro: ov.intro ?? base.intro,
    blocks: ov.blocks,
  };
}

/** Which locales have a live translation for this English path (drives hreflang + the switcher). */
export function availableLocales(path: string): Locale[] {
  if (!isLiveBase(path)) return [];
  return LOCALES.filter((l) => TX[key(l, path)]);
}

/**
 * The translated H1/title for (locale, path), or undefined if there's no live translation.
 * Lightweight (no block overlay) — for linking to same-language pages (e.g. Read-next cards).
 */
export function translatedTitle(locale: Locale, path: string): string | undefined {
  if (!isLiveBase(path)) return undefined;
  const ov = TX[key(locale, path)];
  return ov ? ov.h1 || ov.title : undefined;
}

/** Every live (locale, path) that has a translation — for generateStaticParams + the sitemap. */
export function allTranslations(): { locale: Locale; path: string }[] {
  return Object.keys(TX)
    .map((k) => {
      const [locale, path] = k.split('::');
      return { locale: locale as Locale, path };
    })
    .filter(({ locale, path }) => (LOCALES as string[]).includes(locale) && isLiveBase(path));
}
