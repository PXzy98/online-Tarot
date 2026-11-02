'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { localeDefinitions, type Locale } from '@/i18n/config';
import { getLocalStorage, saveLocale } from '@/lib/i18n/locale-preference';
import { switchLocalePath } from '@/lib/i18n/paths';
import { cn } from '@/lib/utils/cn';

/**
 * Links to the same page in every other locale. The href is computed from the
 * pathname (static-render safe); on click the current query string and hash
 * are appended so e.g. /reading/result/?id=… keeps its id.
 */
export function LanguageSwitcher({ current, className }: { current: Locale; className?: string }) {
  const pathname = usePathname() ?? '/';
  const t = useTranslations('language');

  return (
    <nav aria-label={t('label')} className={cn('flex items-center gap-1', className)}>
      {localeDefinitions.map((def) => {
        const isCurrent = def.code === current;
        const href = switchLocalePath(pathname, def.code);
        return (
          <a
            key={def.code}
            href={href}
            lang={def.htmlLang}
            hrefLang={def.htmlLang}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={isCurrent ? def.label : t('switchTo', { language: def.label })}
            data-locale={def.code}
            onClick={(event) => {
              saveLocale(getLocalStorage(), def.code);
              if (isCurrent) {
                event.preventDefault();
                return;
              }
              event.preventDefault();
              const { search, hash } = window.location;
              window.location.assign(switchLocalePath(window.location.pathname, def.code, search, hash));
            }}
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm',
              isCurrent ? 'text-accent' : 'text-fg-muted hover:text-fg',
            )}
          >
            {def.label}
          </a>
        );
      })}
    </nav>
  );
}
