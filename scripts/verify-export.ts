/**
 * Verifies the static export in ./out (docs/spec/08-TESTING.md §1).
 * VERIFY_STRICT=1 (release builds) also fails on remaining placeholder pages.
 *
 * Usage: node scripts/verify-export.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { localeDefinitions } from '../i18n/config.ts';

const OUT = resolve(process.cwd(), 'out');
const STRICT = process.env.VERIFY_STRICT === '1';

/** App pages that must exist for every locale. Extend as phases add routes. */
const PAGES = [
  '',
  'reading',
  'reading/result',
  'daily',
  'cards',
  'spreads',
  'history',
  'guide',
  'about',
  'privacy',
  'support',
];
/** Private pages that must carry noindex (docs/spec/01-PRODUCT.md §6). */
const NOINDEX = ['reading/result', 'daily', 'history'];
/** Marker emitted by E2E-only test hooks; must never ship (docs/spec/08-TESTING.md §2). */
const TEST_HOOK_MARKER = '__STILL_TEST_HOOKS__';

const errors: string[] = [];
const warnings: string[] = [];

function read(path: string): string | null {
  const full = join(OUT, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : null;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

if (!existsSync(OUT)) {
  console.error('✗ out/ does not exist — run `pnpm build` first.');
  process.exit(1);
}

for (const required of ['index.html', '404.html', '_headers']) {
  if (!read(required)) errors.push(`missing ${required}`);
}

const placeholderPages: string[] = [];
for (const { code, htmlLang } of localeDefinitions) {
  for (const page of PAGES) {
    const path = join(code, page, 'index.html');
    const html = read(path);
    if (!html) {
      errors.push(`missing ${path}`);
      continue;
    }
    if (!html.includes(`<html lang="${htmlLang}"`)) errors.push(`${path}: expected <html lang="${htmlLang}">`);
    if (!html.includes('hrefLang="x-default"')) errors.push(`${path}: missing hreflang alternates`);
    const hasNoindex = /<meta name="robots" content="noindex/.test(html);
    if (NOINDEX.includes(page) && !hasNoindex) errors.push(`${path}: private page must be noindex`);
    if (!NOINDEX.includes(page) && hasNoindex) errors.push(`${path}: public page must not be noindex`);
    if (html.includes('data-placeholder="true"')) placeholderPages.push(path);
  }
}

for (const file of walk(OUT)) {
  if (/\.(html|js|txt)$/.test(file) && readFileSync(file, 'utf8').includes(TEST_HOOK_MARKER)) {
    errors.push(`${file.slice(OUT.length + 1)}: contains E2E test hooks`);
  }
}

if (placeholderPages.length > 0) {
  const message = `${placeholderPages.length} placeholder page(s): ${placeholderPages.join(', ')}`;
  if (STRICT) errors.push(message);
  else warnings.push(message);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\nverify:export failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✓ verify:export passed (${localeDefinitions.length} locales × ${PAGES.length} pages${STRICT ? ', strict' : ''}).`);
