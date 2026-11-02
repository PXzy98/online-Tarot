'use client';

import { useEffect } from 'react';
import { getLocalStorage, readSavedLocale } from '@/lib/i18n/locale-preference';
import { localizedPath, pickLocale } from '@/lib/i18n/paths';

/** Root "/" language router: saved preference → browser languages → default. */
export function LocaleRedirect() {
  useEffect(() => {
    const locale = pickLocale(readSavedLocale(getLocalStorage()), navigator.languages ?? [navigator.language]);
    window.location.replace(localizedPath(locale) + window.location.hash);
  }, []);
  return null;
}
