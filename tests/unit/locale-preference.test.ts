import { describe, expect, it } from 'vitest';
import { readSavedLocale, saveLocale } from '@/lib/i18n/locale-preference';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

class ThrowingStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new Error('SecurityError');
  }
  override setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

describe('locale preference', () => {
  it('round-trips the locale in a versioned envelope', () => {
    const storage = new MemoryStorage();
    expect(saveLocale(storage, 'en')).toBe(true);
    expect(readSavedLocale(storage)).toBe('en');
    expect(JSON.parse(storage.getItem('still:prefs') ?? '')).toEqual({
      schemaVersion: 1,
      data: { locale: 'en' },
    });
  });

  it('preserves other preference fields', () => {
    const storage = new MemoryStorage();
    storage.setItem('still:prefs', JSON.stringify({ schemaVersion: 1, data: { reversals: false } }));
    saveLocale(storage, 'zh');
    expect(JSON.parse(storage.getItem('still:prefs') ?? '').data).toEqual({ reversals: false, locale: 'zh' });
  });

  it('treats corrupt or invalid data as no preference', () => {
    const storage = new MemoryStorage();
    storage.setItem('still:prefs', '{not json');
    expect(readSavedLocale(storage)).toBeNull();
    storage.setItem('still:prefs', JSON.stringify({ schemaVersion: 1, data: { locale: 'fr' } }));
    expect(readSavedLocale(storage)).toBeNull();
    storage.setItem('still:prefs', JSON.stringify(['zh']));
    expect(readSavedLocale(storage)).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    expect(readSavedLocale(undefined)).toBeNull();
    expect(saveLocale(undefined, 'zh')).toBe(false);
    const storage = new ThrowingStorage();
    expect(readSavedLocale(storage)).toBeNull();
    expect(saveLocale(storage, 'zh')).toBe(false);
  });
});
