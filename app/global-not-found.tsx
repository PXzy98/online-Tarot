import '@fontsource/cormorant-garamond/latin-500.css';
import './globals.css';
import type { Metadata } from 'next';
import { localeDefinitions } from '@/i18n/config';
import { localizedPath } from '@/lib/i18n/paths';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';

const MESSAGES = { zh, en } as const;

export const metadata: Metadata = {
  title: `404 · ${zh.notFound.title} · ${en.notFound.title}`,
  robots: { index: false },
};

/** Routing-level 404 (unknown locale, unknown path). Bilingual because the locale is unknown. */
export default function GlobalNotFound() {
  return (
    <html lang="zh-Hans">
      <body className="flex min-h-dvh items-center justify-center">
        <main className="flex flex-col gap-10 px-4 text-center">
          <p className="font-display text-7xl text-accent" aria-hidden="true">
            404
          </p>
          {localeDefinitions.map((def) => {
            const m = MESSAGES[def.code];
            return (
              <section key={def.code} lang={def.htmlLang}>
                <h1 className="text-3xl">{m.notFound.title}</h1>
                <p className="mt-2 text-fg-muted">{m.notFound.body}</p>
                <a
                  href={localizedPath(def.code)}
                  className="mt-4 inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline"
                >
                  {m.notFound.backHome}
                </a>
              </section>
            );
          })}
        </main>
      </body>
    </html>
  );
}
