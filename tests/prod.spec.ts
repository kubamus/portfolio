import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

/** Runs against `vite preview` of the production build. */
test.describe('production build', () => {
  test('renders, ignores fixture requests, ships no dev hooks', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/?fixtures=several', { waitUntil: 'networkidle' });
    await page.waitForSelector('.stage.is-ready', { timeout: 30_000 });
    await expect(page.locator('h1')).toHaveAccessibleName(/Kuba\s+Musielski/);
    // fixtures are development-only: production shows my real (empty) collection
    await expect(page.locator('.specimen')).toHaveCount(0);
    await expect(page.locator('.empty')).toHaveCount(1);
    await expect(page.locator('.fixture-badge')).toHaveCount(0);
    expect(await page.evaluate(() => 'fixtureSets' in window || '__scene' in window)).toBe(false);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('static assets resolve', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(failed).toEqual([]);
  });
});
