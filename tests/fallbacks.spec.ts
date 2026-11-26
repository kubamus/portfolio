import { expect, test } from '@playwright/test';
import { chapter, jump, open, watchErrors } from './helpers';

test.describe('fallbacks', () => {
  test('reduced motion: content is static and readable, scenes cut instead of travel', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await open(page);
    await expect(page.locator('html')).toHaveClass(/is-reduced/);
    await jump(page, 'magnify', 0.5);
    // no scrubbed type: words are fully shown
    const opacity = await page.locator('.magnify__title .split-word').first().evaluate((e) => getComputedStyle(e).opacity);
    expect(Number(opacity)).toBe(1);
    // the scene holds the act's resting composition (no continuous camera travel)
    await page.waitForTimeout(900);
    const a = await page.evaluate(() => (window as any).__scene.camY);
    await page.evaluate(() => (window as any).__scroll.lenis.scrollTo((window as any).__scroll.y + 120, { immediate: true }));
    await page.waitForTimeout(300);
    const b = await page.evaluate(() => (window as any).__scene.camY);
    expect(a).toBe(b);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('without WebGL: painted fallback, everything still reachable', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, '/?nogl', { stage: false });
    await expect(page.locator('html')).toHaveClass(/no-webgl/);
    await expect(page.locator('.stage__poster')).toBeVisible();
    await expect(page.locator('canvas.stage__canvas')).toBeHidden();
    await expect(page.locator('h1')).toHaveAccessibleName(/Kuba\s+Musielski/);
    await jump(page, 'work', 0.2);
    expect(await chapter(page)).toBe('work');
    await expect(page.locator('.empty__link').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('narrow window: light readable page, no WebGL stage', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 820, height: 1000 } });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await open(page, '/', { stage: false });
    await expect(page.locator('canvas.stage__canvas')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.structure__block a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:musielskikuba@gmail.com');
    await expect(page.locator('.structure__block a[href*="linkedin.com"]')).toHaveAttribute('href', 'https://www.linkedin.com/in/kuba-musielski/');
    await expect(page.locator('.structure__block a[href*="github.com"]')).toHaveAttribute('href', 'https://github.com/kubamus');
    // the stage module is never initialised on a narrow first load
    expect(await page.evaluate(() => (window as any).__stage())).toBeNull();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await context.close();
  });
});
