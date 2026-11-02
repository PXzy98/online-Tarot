import { LocaleRedirect } from '@/components/root/locale-redirect';
import { localeDefinitions } from '@/i18n/config';
import { localizedPath } from '@/lib/i18n/paths';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';

/**
 * Static language chooser at "/". With JS it redirects immediately; without
 * JS (and for crawlers) it is a plain page linking to every locale.
 */
export default function RootPage() {
  return (
    <main className="px-4 text-center">
      <LocaleRedirect />
      <h1 className="text-5xl">
        <span lang="zh-Hans">{zh.meta.siteName}</span>
        <span aria-hidden="true" className="mx-3 text-accent">
          ✦
        </span>
        <span lang="en">{en.meta.siteNameFull}</span>
      </h1>
      <p className="mt-6 text-fg-muted">
        <span lang="zh-Hans">{zh.root.redirecting}</span>
        <br />
        <span lang="en">{en.root.redirecting}</span>
      </p>
      <nav aria-label={`${zh.root.choose} / ${en.root.choose}`} className="mt-8">
        <ul className="flex justify-center gap-3">
          {localeDefinitions.map((def) => (
            <li key={def.code}>
              <a
                href={localizedPath(def.code)}
                lang={def.htmlLang}
                hrefLang={def.htmlLang}
                className="inline-flex min-h-11 items-center rounded-full border border-accent/60 px-6 hover:bg-bg-raised"
              >
                {def.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
