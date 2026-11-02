import '@fontsource/cormorant-garamond/latin-500.css';
import '../globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { languageAlternates } from '@/lib/i18n/paths';
import { metadataBase } from '@/lib/site/metadata';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';

export const metadata: Metadata = {
  metadataBase,
  title: `${zh.meta.siteNameFull} · ${en.meta.siteNameFull}`,
  description: `${zh.meta.description} ${en.meta.description}`,
  alternates: { canonical: '/', languages: languageAlternates('/') },
};

export const viewport: Viewport = { themeColor: '#101321', colorScheme: 'dark' };

export default function RootRedirectLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans">
      <body className="flex min-h-dvh items-center justify-center">{children}</body>
    </html>
  );
}
