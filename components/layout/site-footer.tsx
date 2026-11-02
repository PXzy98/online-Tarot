import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { localizedPath } from '@/lib/i18n/paths';
import { isDonationEnabled } from '@/lib/site/site.config';
import { LanguageSwitcher } from './language-switcher';

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const links = [
    { key: 'guide', path: '/guide' },
    { key: 'about', path: '/about' },
    { key: 'privacy', path: '/privacy' },
    ...(isDonationEnabled() ? [{ key: 'support', path: '/support' }] : []),
  ] as const;

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-fg-muted sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label={t('a11y.footerNav')}>
            <ul className="flex flex-wrap gap-x-2">
              {links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={localizedPath(locale, link.path)}
                    className="inline-flex min-h-11 items-center px-2 hover:text-fg"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher current={locale} />
        </div>
        <p data-testid="disclaimer">{t('footer.disclaimer')}</p>
        <p>
          {t('meta.siteNameFull')} · {t('footer.free')}
        </p>
      </div>
    </footer>
  );
}
