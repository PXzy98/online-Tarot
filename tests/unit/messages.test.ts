import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultLocale, locales } from '@/i18n/config';

type Tree = { [key: string]: string | Tree };

function load(locale: string): Tree {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as Tree;
}

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

describe('UI messages', () => {
  const reference = flatten(load(defaultLocale));

  it.each(locales)('%s has a messages file', (locale) => {
    expect(existsSync(join(process.cwd(), 'messages', `${locale}.json`))).toBe(true);
  });

  it.each(locales)('%s has exactly the same keys as the default locale', (locale) => {
    const keys = [...flatten(load(locale)).keys()].sort();
    expect(keys).toEqual([...reference.keys()].sort());
  });

  it.each(locales)('%s has no empty or placeholder strings', (locale) => {
    for (const [key, value] of flatten(load(locale))) {
      expect(value.trim(), key).not.toBe('');
      expect(value, key).not.toMatch(/\b(TODO|TBD|lorem)\b/i);
    }
  });

  it.each(locales)('%s uses the same interpolation variables', (locale) => {
    for (const [key, value] of flatten(load(locale))) {
      expect(placeholders(value), key).toEqual(placeholders(reference.get(key) ?? ''));
    }
  });
});
