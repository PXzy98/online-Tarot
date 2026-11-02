import '@fontsource/cormorant-garamond/latin-500.css';
import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { getLocaleDefinition, isLocale, locales } from '@/i18n/config';
import { metadataBase } from '@/lib/site/metadata';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Omit<LayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase,
    title: { default: `${t('siteNameFull')} · ${t('tagline')}`, template: `%s · ${t('siteNameFull')}` },
    description: t('description'),
    applicationName: t('siteNameFull'),
    openGraph: { siteName: t('siteNameFull') },
  };
}

export const viewport: Viewport = {
  themeColor: '#101321',
  colorScheme: 'dark',
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'a11y' });

  return (
    <html lang={getLocaleDefinition(locale).htmlLang}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-bg"
        >
          {t('skipToContent')}
        </a>
        {/* Only the namespaces client components need are serialised to the browser. */}
        <NextIntlClientProvider locale={locale} messages={{ language: messages.language }}>
          <SiteHeader locale={locale} />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
