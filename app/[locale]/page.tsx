import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { resolveLocale, type LocaleParams } from '@/lib/i18n/params';
import { localizedPath } from '@/lib/i18n/paths';
import { buildPageMetadata } from '@/lib/site/metadata';

type Props = LocaleParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildPageMetadata({ locale, path: '/', description: t('description') });
}

const STEPS = ['ask', 'draw', 'read'] as const;

export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <p className="text-sm tracking-[0.2em] text-fg-muted uppercase">{t('eyebrow')}</p>
        <h1 className="mt-6 text-6xl text-fg sm:text-7xl">{t('title')}</h1>
        <p className="mt-6 max-w-xl text-lg text-fg-muted">{t('subtitle')}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={localizedPath(locale, '/reading')}>{t('start')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={localizedPath(locale, '/daily')}>{t('daily')}</Link>
          </Button>
        </div>
        <div className="mt-6 flex gap-2">
          <Button asChild variant="ghost">
            <Link href={localizedPath(locale, '/cards')}>{t('browseCards')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={localizedPath(locale, '/spreads')}>{t('spreads')}</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 id="steps-title" className="text-center text-3xl">
          {t('stepsTitle')}
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="rounded-[var(--radius-card)] border border-line bg-bg-elevated p-6">
              <span className="font-display text-3xl text-accent" aria-hidden="true">
                {['I', 'II', 'III'][index]}
              </span>
              <h3 className="mt-3 text-xl">{t(`steps.${step}.title`)}</h3>
              <p className="mt-2 text-fg-muted">{t(`steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
