import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Static export only — see docs/spec/02-ARCHITECTURE.md §2.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: {
    // Multiple root layouts ((root) + [locale]) need a routing-level 404.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
