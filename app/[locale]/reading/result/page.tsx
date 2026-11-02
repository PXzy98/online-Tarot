import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlaceholderPage } from '@/components/layout/placeholder-page';
import { resolveLocale, type LocaleParams } from '@/lib/i18n/params';
import { buildPageMetadata } from '@/lib/site/metadata';

type Props = LocaleParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'pages.result' });
  return buildPageMetadata({
    locale,
    path: '/reading/result',
    title: t('title'),
    description: t('description'),
    noindex: true,
  });
}

export default async function Page({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  return <PlaceholderPage locale={locale} page="result" />;
}
