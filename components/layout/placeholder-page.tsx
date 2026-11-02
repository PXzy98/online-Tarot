import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { localizedPath } from '@/lib/i18n/paths';

export type PageKey =
  | 'reading'
  | 'result'
  | 'daily'
  | 'cards'
  | 'spreads'
  | 'history'
  | 'guide'
  | 'about'
  | 'privacy'
  | 'support';

/**
 * Temporary shell for pages built in later phases. Marked with
 * data-placeholder so `pnpm verify:export` reports it and VERIFY_STRICT=1
 * (production release) fails while any placeholder remains.
 */
export async function PlaceholderPage({ locale, page }: { locale: Locale; page: PageKey }) {
  const t = await getTranslations({ locale });
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6" data-placeholder="true">
      <h1 className="text-4xl sm:text-5xl">{t(`pages.${page}.title`)}</h1>
      <p className="mt-4 text-lg text-fg-muted">{t(`pages.${page}.description`)}</p>
      <p className="mt-10 rounded-[var(--radius-card)] border border-line bg-bg-elevated p-6">
        {t('placeholder.note')}
      </p>
      <Link
        href={localizedPath(locale)}
        className="mt-6 inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline"
      >
        {t('placeholder.backHome')}
      </Link>
    </div>
  );
}
