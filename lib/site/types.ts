import type { Locale } from '@/i18n/config';

/**
 * Replaceable modules (docs/spec/07-COMPLIANCE.md). Swapping an implementation
 * means changing site.config.ts, never business code.
 */

export type LocalizedText = Record<Locale, string>;

/** §2 Deck pack: a set of card faces plus its licensing record. */
export type DeckPackManifest = {
  id: string;
  name: LocalizedText;
  /** width / height of a card face. */
  aspectRatio: number;
  /** Path to the (original) card back SVG. */
  back: string;
  /** Available raster widths for card faces. */
  widths: readonly number[];
  license: { summary: LocalizedText; detailsUrl: string };
};

/** §4 Local safety check for the user's question. */
export type SafetyLevel = 'none' | 'sensitive' | 'crisis';
export type SafetyDomain = 'selfharm' | 'medical' | 'legal' | 'financial';
export type SafetyResult = { level: SafetyLevel; domains: SafetyDomain[] };
export type SafetyProviderId = 'local-keywords';

/** §5 Donation providers: static links / QR images only, never SDKs. */
export type DonationProvider =
  | { id: string; kind: 'link'; url: string; label: LocalizedText }
  | { id: string; kind: 'qr'; image: string; alt: LocalizedText; label: LocalizedText };

export type DonationConfig = {
  providers: DonationProvider[];
  /** Display order per locale; ids not listed fall back to config order. */
  order?: Partial<Record<Locale, string[]>>;
};

/** §6 Analytics: aggregate page views only, never question text or readings. */
export type AnalyticsConfig =
  | { provider: 'none' }
  | { provider: 'cloudflare'; token: string };

export type SiteConfig = {
  /** Absolute origin used for canonical / hreflang / OG URLs. */
  siteUrl: string;
  deckPack: string;
  safety: { provider: SafetyProviderId };
  donation: DonationConfig;
  analytics: AnalyticsConfig;
};
