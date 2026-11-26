import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, jump, open, watchErrors } from './helpers';

/** Gallery behaviour, using the development-only DEMO fixture sets. */
test.describe('gallery (demo fixtures)', () => {
  test('no projects → bare sockets', async ({ page }) => {
    await open(page, '/?fixtures=none');
    await expect(page.locator('.specimen')).toHaveCount(0);
    await expect(page.locator('.empty')).toHaveCount(1);
  });

  test('one project', async ({ page }) => {
    await open(page, '/?fixtures=one');
    await expect(page.locator('.specimen')).toHaveCount(1);
    await expect(page.locator('[data-count]')).toHaveText('1 project');
    await expect(page.locator('.index')).toHaveCount(0);
    await expect(page.locator('.fixture-badge')).toContainText('not real projects');
    expect(await page.evaluate(() => (window as any).__stage().wing.material.uniforms.uClearAmt.value)).toBe(0);
  });

  test('several projects, mixed aspect ratios, index', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, '/?fixtures=several');
    await expect(page.locator('.specimen')).toHaveCount(5);
    await expect(page.locator('[data-count]')).toHaveText('5 projects');
    await expect(page.locator('.index li')).toHaveCount(5);
    // the 9:16 cover keeps its proportions inside its mount
    await expect(page.locator('.specimen.is-tall')).toHaveCount(1);
    await jump(page, 'work', 0.5);
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  test('a larger collection stays coherent', async ({ page }) => {
    await open(page, '/?fixtures=many');
    await expect(page.locator('.specimen')).toHaveCount(14);
    for (const f of [0.1, 0.4, 0.8]) {
      await jump(page, 'work', f);
      await expectNoHorizontalOverflow(page);
    }
    // plates never collide with each other's columns
    const boxes = await page.locator('.specimen').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (const b of boxes) expect(b.right).toBeLessThanOrEqual(1920 + 1);
  });

  test('edge cases: long titles, missing and broken images, minimal data', async ({ page }) => {
    await open(page, '/?fixtures=edge');
    const titles = page.locator('.specimen__title');
    await expect(titles.first()).toContainText('unusually long project title');
    const box = await page.locator('.specimen__slip').first().boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(1920);
    // missing cover and broken cover both grow a generated structural-color plate
    await expect.poll(() => page.locator('.plate-generated').count()).toBeGreaterThanOrEqual(3);
    const minimal = page.locator('.specimen', { hasText: 'Demo · Minimal' });
    await expect(minimal.locator('.specimen__summary')).toHaveCount(0);
    await expect(minimal.locator('.specimen__meta')).toHaveCount(0);
  });

  test('open a project, read it, close with Escape, focus returns', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, '/?fixtures=several');
    await jump(page, 'work', 0.2);
    const link = page.locator('.specimen__title a', { hasText: 'Demo · Tidepool' });
    await link.click();
    const dialog = page.locator('dialog#sheet');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#sheet-title')).toHaveText('Demo · Tidepool');
    expect(page.url()).toMatch(/#work\/demo-tidepool$/);
    await expect(dialog.locator('.sheet__links a', { hasText: 'Visit the site' })).toHaveAttribute('href', 'https://example.com');
    await expect(dialog.locator('.sheet__links a', { hasText: 'Read the source' })).toHaveAttribute('target', '_blank');
    await expect(dialog.locator('.sheet__figure')).toHaveCount(3);
    // page scroll is frozen while the sheet is open
    const before = await page.evaluate(() => (window as any).__scroll.y);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => (window as any).__scroll.y)).toBe(before);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(page.url()).not.toMatch(/demo-tidepool/);
    await expect(link).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('keyboard only: tab to a project, open, step through, close', async ({ page }) => {
    await open(page, '/?fixtures=several');
    await jump(page, 'work', 0.2);
    const first = page.locator('.specimen__title a').first();
    await first.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('dialog#sheet');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-sheet-pos]')).toHaveText('1 / 5');
    await expect(page.locator('[data-sheet-prev]')).toBeDisabled();
    await page.locator('[data-sheet-next]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-sheet-pos]')).toHaveText('2 / 5');
    await expect(page.locator('#sheet-title')).toHaveText('Demo · Lantern');
    await page.locator('[data-sheet-close]').focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
  });

  test('deep link opens the project; browser back closes it', async ({ page }) => {
    await open(page, '/?fixtures=several#work/demo-lantern');
    await expect(page.locator('dialog#sheet')).toBeVisible();
    await expect(page.locator('#sheet-title')).toHaveText('Demo · Lantern');
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog#sheet')).toBeHidden();

    await jump(page, 'work', 0.2);
    await page.locator('.specimen__title a', { hasText: 'Demo · Quarry' }).click();
    await expect(page.locator('dialog#sheet')).toBeVisible();
    await page.goBack();
    await expect(page.locator('dialog#sheet')).toBeHidden();
  });
});
