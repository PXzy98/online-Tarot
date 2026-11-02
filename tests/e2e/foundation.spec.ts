import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('root language routing', () => {
  test.describe('Chinese browser', () => {
    test.use({ locale: 'zh-CN' });
    test('redirects / to /zh/', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/zh\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
    });
  });

  test.describe('English browser', () => {
    test.use({ locale: 'en-US' });
    test('redirects / to /en/', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/en\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('a saved preference wins over the browser language', async ({ page }) => {
      await page.goto('/en/');
      await page.evaluate(() =>
        localStorage.setItem('still:prefs', JSON.stringify({ schemaVersion: 1, data: { locale: 'zh' } })),
      );
      await page.goto('/');
      await expect(page).toHaveURL(/\/zh\/$/);
    });
  });

  test.describe('unsupported browser language', () => {
    test.use({ locale: 'ja-JP' });
    test('falls back to the default locale', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/zh\/$/);
    });
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('/ offers links to every language', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/zh/"]')).toBeVisible();
      await expect(page.locator('a[href="/en/"]')).toBeVisible();
    });
  });
});

test.describe('language switcher', () => {
  test('keeps the current page and query string', async ({ page }) => {
    await page.goto('/zh/reading/result/?id=demo#top');
    await page.locator('header').getByRole('link', { name: '切换到English' }).click();
    await expect(page).toHaveURL(/\/en\/reading\/result\/\?id=demo#top$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your reading');
  });

  test('remembers the choice for the root redirect', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('header').getByRole('link', { name: 'Switch to 中文' }).click();
    await expect(page).toHaveURL(/\/zh\/$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/zh\/$/);
  });
});

test.describe('home and navigation', () => {
  test('home links to the main sections', async ({ page }) => {
    await page.goto('/zh/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('静观');
    await page.getByRole('link', { name: '开始占卜' }).click();
    await expect(page).toHaveURL(/\/zh\/reading\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('占卜');
  });

  test('every primary nav link resolves to a page', async ({ page }) => {
    await page.goto('/en/');
    const hrefs = await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const response = await page.goto(href ?? '');
      expect(response?.status(), href ?? '').toBe(200);
    }
  });

  test('footer shows the disclaimer', async ({ page }) => {
    await page.goto('/zh/');
    await expect(page.getByTestId('disclaimer')).toHaveText(
      '塔罗解读仅供娱乐参考，不构成医疗、法律、财务或其他专业建议。',
    );
  });

  test('skip link moves focus to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard flow is checked on desktop');
    await page.goto('/en/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('private pages are noindex, public pages are not', async ({ page }) => {
    await page.goto('/zh/history/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.goto('/zh/cards/');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('unknown paths render the bilingual 404 with status 404', async ({ page }) => {
    const response = await page.goto('/zh/does-not-exist/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: '找不到这个页面' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('layout', () => {
  for (const path of ['/zh/', '/en/', '/zh/reading/']) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('no CSP violations or console errors on load', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push(msg.text());
    });
    page.on('pageerror', (err) => problems.push(err.message));
    await page.goto('/zh/');
    await page.goto('/en/cards/');
    expect(problems).toEqual([]);
  });
});

test.describe('accessibility (axe)', () => {
  for (const path of ['/', '/zh/', '/en/', '/zh/reading/', '/en/cards/', '/zh/does-not-exist/']) {
    test(`no serious or critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      if (path === '/') await page.waitForURL(/\/(zh|en)\/$/);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
