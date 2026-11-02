import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const UI_MODULES = [
  'react',
  'react-dom',
  'react/*',
  'next',
  'next/*',
  'next-intl',
  'next-intl/*',
  'motion',
  'motion/*',
  'lucide-react',
  '@/components/*',
  '@/hooks/*',
  '@/app/*',
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      // User input must never be rendered as HTML (docs/spec/02-ARCHITECTURE.md §12).
      'react/no-danger': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Core tarot / interpretation logic must not depend on any UI layer.
    files: ['lib/tarot/**', 'lib/interpret/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: UI_MODULES,
              message: 'Core logic must stay UI-free (docs/spec/02-ARCHITECTURE.md §4).',
            },
          ],
        },
      ],
    },
  },
  {
    // lib/* never imports from the UI layers.
    files: ['lib/**'],
    ignores: ['lib/tarot/**', 'lib/interpret/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/*', '@/hooks/*', '@/app/*'],
              message: 'lib/* must not import from UI layers (docs/spec/02-ARCHITECTURE.md §4).',
            },
          ],
        },
      ],
    },
  },
]);
