import { describe, expect, it } from 'vitest';
import { isDonationEnabled, siteConfig } from '@/lib/site/site.config';
import type { SiteConfig } from '@/lib/site/types';

describe('site config', () => {
  it('hides donation entry points until a provider is configured', () => {
    const empty: SiteConfig = { ...siteConfig, donation: { providers: [] } };
    expect(isDonationEnabled(empty)).toBe(false);
    const withPatreon: SiteConfig = {
      ...siteConfig,
      donation: {
        providers: [
          { id: 'patreon', kind: 'link', url: 'https://www.patreon.com/x', label: { zh: 'Patreon', en: 'Patreon' } },
        ],
      },
    };
    expect(isDonationEnabled(withPatreon)).toBe(true);
  });

  it('defaults to privacy-preserving providers', () => {
    expect(siteConfig.analytics.provider).toBe('none');
    expect(siteConfig.safety.provider).toBe('local-keywords');
  });
});
