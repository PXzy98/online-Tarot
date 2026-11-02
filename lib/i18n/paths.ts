import { defaultLocale, isLocale, locales, type Locale } from '@/i18n/config';

/** Normalises an app-relative path ("cards" | "/cards/" | "") to "/cards/" form. */
export function normalizePath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

/** Builds a locale-prefixed path with trailing slash, e.g. ("zh", "/cards") → "/zh/cards/". */
export function localizedPath(locale: Locale, path = '/'): string {
  const normalized = normalizePath(path);
  return normalized === '/' ? `/${locale}/` : `/${locale}${normalized}`;
}

/** Splits "/zh/cards/the-fool/" into { locale: "zh", rest: "/cards/the-fool/" }. */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (isLocale(first)) {
    return { locale: first, rest: normalizePath(segments.slice(1).join('/')) };
  }
  return { locale: null, rest: normalizePath(segments.join('/')) };
}

/** Same page in another locale; query string and hash are preserved verbatim. */
export function switchLocalePath(
  pathname: string,
  target: Locale,
  search = '',
  hash = '',
): string {
  const { rest } = splitLocale(pathname);
  return `${localizedPath(target, rest)}${search}${hash}`;
}

/**
 * Picks the locale for the root "/" redirect:
 * saved preference → browser languages → default (docs/spec/01-PRODUCT.md §6).
 */
export function pickLocale(saved: unknown, browserLanguages: readonly string[]): Locale {
  if (isLocale(saved)) return saved;
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split('-')[0];
    const match = locales.find((l) => l === primary);
    if (match) return match;
  }
  return defaultLocale;
}

/** hreflang alternates for a path, used in page metadata. */
export function languageAlternates(path: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const locale of locales) entries[hrefLang(locale)] = localizedPath(locale, path);
  entries['x-default'] = '/';
  return entries;
}

function hrefLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-Hans' : locale;
}
