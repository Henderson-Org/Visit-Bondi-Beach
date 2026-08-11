/**
 * Multilingual configuration. Selected articles are translated into these locales and served
 * under clean subdirectory prefixes (/ja/…, /zh-cn/…, …). English stays the default experience
 * and is never redirected or altered. To add a language later: add it here + drop translation
 * JSON files under content/translations/<locale>/. Everything else (routing, hreflang, sitemap,
 * the discreet language switcher) picks it up automatically.
 */
export type Locale = 'ja' | 'zh-cn' | 'es' | 'pt' | 'de' | 'nl' | 'it';

export const LOCALES: Locale[] = ['ja', 'zh-cn', 'es', 'pt', 'de', 'nl', 'it'];

/** URL prefix segment for each locale (the first path segment). */
export const LOCALE_PREFIX: Record<Locale, string> = { ja: 'ja', 'zh-cn': 'zh-cn', es: 'es', pt: 'pt', de: 'de', nl: 'nl', it: 'it' };

/** `lang`/`hreflang` value. Simplified Chinese targets script (zh-Hans), per Google guidance. */
export const LOCALE_HREFLANG: Record<Locale, string> = { ja: 'ja', 'zh-cn': 'zh-Hans', es: 'es', pt: 'pt', de: 'de', nl: 'nl', it: 'it' };

/** Open Graph `og:locale`. */
export const LOCALE_OG: Record<Locale, string> = { ja: 'ja_JP', 'zh-cn': 'zh_CN', es: 'es_ES', pt: 'pt_BR', de: 'de_DE', nl: 'nl_NL', it: 'it_IT' };

/** Native, human-facing label for the discreet language switcher. */
export const LOCALE_LABEL: Record<Locale, string> = { ja: '日本語', 'zh-cn': '简体中文', es: 'Español', pt: 'Português', de: 'Deutsch', nl: 'Nederlands', it: 'Italiano' };

/** hreflang for the English original + the x-default fallback (both point at the English URL). */
export const EN_HREFLANG = 'en-AU';

export function isLocale(s: string | undefined): s is Locale {
  return !!s && (LOCALES as string[]).includes(s);
}

/** Split a catch-all path into { locale, path }. `/ja/bondi-blog/x` → { locale:'ja', path:'/bondi-blog/x' }. */
export function splitLocalePath(segments: string[]): { locale: Locale | null; path: string } {
  if (segments.length && isLocale(segments[0])) {
    return { locale: segments[0] as Locale, path: '/' + segments.slice(1).join('/') };
  }
  return { locale: null, path: '/' + segments.join('/') };
}

/** The public URL path for a page in a given locale (English = the bare path). */
export function localizedPath(path: string, locale: Locale | null): string {
  return locale ? `/${LOCALE_PREFIX[locale]}${path}` : path;
}

/**
 * Reciprocal hreflang cluster for a page (relative paths; Next resolves them against
 * metadataBase). Emitted identically on the English original AND every translation, plus
 * x-default → English. Only include locales that actually have a translation.
 */
export function hreflangAlternates(path: string, locales: Locale[]): Record<string, string> {
  const langs: Record<string, string> = { [EN_HREFLANG]: path };
  for (const l of locales) langs[LOCALE_HREFLANG[l]] = localizedPath(path, l);
  langs['x-default'] = path;
  return langs;
}

/** Minimal UI-chrome strings (labels around the translated article, not the article copy). */
export const UI_STRINGS: Record<Locale, { by: string; updated: string; lastReviewed: string; sources: string; home: string; readIn: string; english: string; alsoIn: string }> = {
  ja: { by: '文：', updated: '更新', lastReviewed: '最終確認', sources: '出典', home: 'ホーム', readIn: '他の言語で読む：', english: 'English', alsoIn: '他の言語：' },
  'zh-cn': { by: '作者：', updated: '更新', lastReviewed: '最后核查', sources: '来源', home: '首页', readIn: '其他语言阅读：', english: 'English', alsoIn: '其他语言：' },
  es: { by: 'Por', updated: 'Actualizado', lastReviewed: 'Última revisión', sources: 'Fuentes', home: 'Inicio', readIn: 'Léelo en', english: 'English', alsoIn: 'También en:' },
  pt: { by: 'Por', updated: 'Atualizado', lastReviewed: 'Última revisão', sources: 'Fontes', home: 'Início', readIn: 'Leia em', english: 'English', alsoIn: 'Também em:' },
  de: { by: 'Von', updated: 'Aktualisiert', lastReviewed: 'Zuletzt geprüft', sources: 'Quellen', home: 'Startseite', readIn: 'Lesen auf', english: 'English', alsoIn: 'Auch auf:' },
  nl: { by: 'Door', updated: 'Bijgewerkt', lastReviewed: 'Laatst gecontroleerd', sources: 'Bronnen', home: 'Home', readIn: 'Lees in het', english: 'English', alsoIn: 'Ook in:' },
  it: { by: 'Di', updated: 'Aggiornato', lastReviewed: 'Ultima verifica', sources: 'Fonti', home: 'Home', readIn: 'Leggi in', english: 'English', alsoIn: 'Anche in:' },
};
