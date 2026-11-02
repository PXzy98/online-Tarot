import { isLocale, type Locale } from '@/i18n/config';

/**
 * Minimal reader/writer for the locale inside `still:prefs`.
 * Uses the versioned envelope from docs/spec/02-ARCHITECTURE.md §8 and preserves
 * any other preference fields. The full StorageService arrives in P2 and will
 * own this key; this helper must stay compatible with it.
 */
const KEY = 'still:prefs';
const SCHEMA_VERSION = 1;

type Envelope = { schemaVersion: number; data: Record<string, unknown> };

function readEnvelope(storage: Storage): Envelope | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'schemaVersion' in parsed &&
      'data' in parsed &&
      typeof parsed.data === 'object' &&
      parsed.data !== null
    ) {
      return parsed as Envelope;
    }
    return null;
  } catch {
    return null;
  }
}

export function readSavedLocale(storage: Storage | undefined): Locale | null {
  if (!storage) return null;
  const locale = readEnvelope(storage)?.data.locale;
  return isLocale(locale) ? locale : null;
}

export function saveLocale(storage: Storage | undefined, locale: Locale): boolean {
  if (!storage) return false;
  try {
    const current = readEnvelope(storage);
    const next: Envelope = {
      schemaVersion: current?.schemaVersion ?? SCHEMA_VERSION,
      data: { ...(current?.data ?? {}), locale },
    };
    storage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/** Safe accessor: localStorage can throw in privacy modes. */
export function getLocalStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
