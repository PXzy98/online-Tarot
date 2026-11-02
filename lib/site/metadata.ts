import type { Metadata } from 'next';
import { getLocaleDefinition, type Locale } from '@/i18n/config';
import { languageAlternates, localizedPath } from '@/lib/i18n/paths';
import { siteConfig } from './site.config';

type PageMetadataInput = {
  locale: Locale;
  /** App path without locale, e.g. "/cards/the-fool". */
  path: string;
  title?: string;
  description: string;
  /** Private pages (results, history, daily) must not be indexed — 01-PRODUCT §6. */
  noindex?: boolean;
};

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  noindex = false,
}: PageMetadataInput): Metadata {
  const url = localizedPath(locale, path);
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website',
      url,
      locale: getLocaleDefinition(locale).ogLocale,
      ...(title ? { title } : {}),
      description,
    },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

export const metadataBase = new URL(siteConfig.siteUrl);
