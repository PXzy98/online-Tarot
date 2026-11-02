import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { localizedPath } from '@/lib/i18n/paths';
import { LanguageSwitcher } from './language-switcher';

const NAV_ITEMS = [
  { key: 'reading', path: '/reading' },
  { key: 'daily', path: '/daily' },
  { key: 'cards', path: '/cards' },
  { key: 'spreads', path: '/spreads' },
  { key: 'history', path: '/history' },
] as const;

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 pt-3 sm:px-6 md:flex-nowrap md:py-3">
        <Link
          href={localizedPath(locale)}
          className="font-display inline-flex min-h-11 items-center text-2xl text-fg"
        >
          <span aria-hidden="true" className="mr-2 text-accent">
            ✦
          </span>
          {t('meta.siteName')}
        </Link>
        <LanguageSwitcher current={locale} className="md:order-last" />
        <nav
          aria-label={t('a11y.primaryNav')}
          className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 md:mx-0 md:w-auto md:overflow-visible md:px-0"
        >
          <ul className="flex gap-1 whitespace-nowrap">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={localizedPath(locale, item.path)}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-fg-muted hover:text-fg"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
