import { isLocale, type Locale } from '@/i18n/config';

export type LocaleParams = { params: Promise<{ locale: string }> };

/** Resolves the [locale] segment; generateStaticParams guarantees it is valid. */
export async function resolveLocale(params: LocaleParams['params']): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) throw new Error(`Unexpected locale: ${locale}`);
  return locale;
}
