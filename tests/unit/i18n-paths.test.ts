import { describe, expect, it } from 'vitest';
import {
  languageAlternates,
  localizedPath,
  normalizePath,
  pickLocale,
  splitLocale,
  switchLocalePath,
} from '@/lib/i18n/paths';

describe('normalizePath', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['cards', '/cards/'],
    ['/cards', '/cards/'],
    ['/cards/the-fool/', '/cards/the-fool/'],
    ['//reading//result//', '/reading//result/'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('localizedPath', () => {
  it('prefixes the locale and keeps a trailing slash', () => {
    expect(localizedPath('zh')).toBe('/zh/');
    expect(localizedPath('en', '/cards')).toBe('/en/cards/');
    expect(localizedPath('zh', 'reading/result/')).toBe('/zh/reading/result/');
  });
});

describe('splitLocale', () => {
  it('extracts a known locale', () => {
    expect(splitLocale('/zh/cards/the-fool/')).toEqual({ locale: 'zh', rest: '/cards/the-fool/' });
    expect(splitLocale('/en/')).toEqual({ locale: 'en', rest: '/' });
  });
  it('returns null for an unknown or missing locale', () => {
    expect(splitLocale('/fr/cards/')).toEqual({ locale: null, rest: '/fr/cards/' });
    expect(splitLocale('/')).toEqual({ locale: null, rest: '/' });
  });
});

describe('switchLocalePath', () => {
  it('maps the same page to another locale and preserves query and hash', () => {
    expect(switchLocalePath('/zh/reading/result/', 'en', '?id=abc', '#cards')).toBe(
      '/en/reading/result/?id=abc#cards',
    );
    expect(switchLocalePath('/en/', 'zh')).toBe('/zh/');
  });
});

describe('pickLocale', () => {
  it('prefers a valid saved preference', () => {
    expect(pickLocale('en', ['zh-CN'])).toBe('en');
  });
  it('ignores an invalid saved preference', () => {
    expect(pickLocale('fr', ['en-US'])).toBe('en');
    expect(pickLocale(42, ['en-US'])).toBe('en');
  });
  it('matches browser languages by primary subtag, in order', () => {
    expect(pickLocale(null, ['zh-TW', 'en'])).toBe('zh');
    expect(pickLocale(null, ['ja-JP', 'en-GB', 'zh'])).toBe('en');
    expect(pickLocale(null, ['ZH-hans-CN'])).toBe('zh');
  });
  it('falls back to the default locale', () => {
    expect(pickLocale(null, ['ja', 'ko'])).toBe('zh');
    expect(pickLocale(undefined, [])).toBe('zh');
  });
});

describe('languageAlternates', () => {
  it('lists every locale plus x-default', () => {
    expect(languageAlternates('/cards')).toEqual({
      'zh-Hans': '/zh/cards/',
      en: '/en/cards/',
      'x-default': '/',
    });
  });
});
