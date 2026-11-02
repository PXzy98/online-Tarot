import type { DonationProvider, SiteConfig } from './types';

/**
 * Site-wide replaceable configuration (docs/spec/07-COMPLIANCE.md).
 *
 * Donation providers stay empty until the owner supplies a Patreon URL and an
 * Alipay QR image (put it in public/donate/). While empty, every donation entry
 * point (footer link, /support/ nav) is hidden.
 */
export const siteConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4173',
  // Original SVG deck until the 1909 RWS scans are verified (D-015).
  deckPack: 'still-minimal',
  safety: { provider: 'local-keywords' },
  donation: {
    providers: [
      // Example — uncomment and fill in once the assets exist:
      // { id: 'alipay', kind: 'qr', image: '/donate/alipay.png',
      //   alt: { zh: '支付宝收款码', en: 'Alipay QR code' }, label: { zh: '支付宝', en: 'Alipay' } },
      // { id: 'patreon', kind: 'link', url: 'https://www.patreon.com/<account>',
      //   label: { zh: 'Patreon', en: 'Patreon' } },
    ] as DonationProvider[],
    order: { zh: ['alipay', 'patreon'], en: ['patreon', 'alipay'] },
  },
  analytics: { provider: 'none' },
} satisfies SiteConfig;

export function isDonationEnabled(config: SiteConfig = siteConfig): boolean {
  return config.donation.providers.length > 0;
}
