/**
 * Single source of truth for supported locales (docs/spec/02-ARCHITECTURE.md §3.2).
 * Adding a locale: add an entry here + messages/{code}.json (+ content in later phases).
 */
export const localeDefinitions = [
  { code: 'zh', htmlLang: 'zh-Hans', label: '中文', ogLocale: 'zh_CN' },
  { code: 'en', htmlLang: 'en', label: 'English', ogLocale: 'en_US' },
] as const;

export type Locale = (typeof localeDefinitions)[number]['code'];

export const locales: readonly Locale[] = localeDefinitions.map((l) => l.code);

export const defaultLocale: Locale = 'zh';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function getLocaleDefinition(locale: Locale) {
  const def = localeDefinitions.find((l) => l.code === locale);
  if (!def) throw new Error(`Unknown locale: ${locale}`);
  return def;
}
