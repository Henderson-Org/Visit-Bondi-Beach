/**
 * Translation access layer. Overlays a translated title/description/H1/intro/blocks onto the
 * English page (so a translated page inherits image, section, dates, schema entity, etc. and
 * only the visible copy changes). Compiled from content/translations/<locale>/*.json by
 * scripts/build-translations.mjs into content/translation-overrides.json, keyed `${locale}::${path}`.
 */
import overrides from '@/content/translation-overrides.json';
import { getPage, type Page, type Block } from '@/lib/content';
import { LOCALES, type Locale } from '@/lib/i18n';

interface TxOverride {
  title?: string;
  metaDescription?: string;
  h1?: string;
  intro?: string;
  blocks: Block[];
}
const TX = overrides as unknown as Record<string, TxOverride>;
const key = (locale: Locale, path: string) => `${locale}::${path}`;

/** The translated Page for (locale, English path), or undefined if no translation exists. */
export function getTranslation(locale: Locale, path: string): Page | undefined {
  const base = getPage(path);
  const ov = TX[key(locale, path)];
  if (!base || !ov) return undefined;
  return {
    ...base,
    title: ov.title ?? base.title,
    metaDescription: ov.metaDescription ?? base.metaDescription,
    h1: ov.h1 ?? base.h1,
    intro: ov.intro ?? base.intro,
    blocks: ov.blocks,
  };
}

/** Which locales have a translation for this English path (drives hreflang + the switcher). */
export function availableLocales(path: string): Locale[] {
  return LOCALES.filter((l) => TX[key(l, path)]);
}

/** Every (locale, path) that has a translation — for generateStaticParams + the sitemap. */
export function allTranslations(): { locale: Locale; path: string }[] {
  return Object.keys(TX)
    .map((k) => {
      const [locale, path] = k.split('::');
      return { locale: locale as Locale, path };
    })
    .filter(({ locale, path }) => (LOCALES as string[]).includes(locale) && !!getPage(path));
}
