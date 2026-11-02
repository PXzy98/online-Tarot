import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './config';

// No middleware/proxy: static export. Every route lives under /{locale}/.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
