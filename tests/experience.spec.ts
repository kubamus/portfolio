import { expect, test } from '@playwright/test';
import { chapter, expectNoHorizontalOverflow, jump, open, watchErrors } from './helpers';

test.describe('experience', () => {
  test('loads with identity, real links and no errors', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page);
    await expect(page).toHaveTitle(/Kuba Musielski/);
    await expect(page.locator('h1')).toHaveAccessibleName(/Kuba\s+Musielski/);
    const github = page.locator('a[href^="https://github.com"]');
    expect(await github.count()).toBeGreaterThanOrEqual(4);
    for (const href of await github.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))) {
      expect(href).toBe('https://github.com/kubamus');
    }
    const linkedin = page.locator('a[href^="https://www.linkedin.com"]');
    expect(await linkedin.count()).toBeGreaterThanOrEqual(4);
    for (const href of await linkedin.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))) {
      expect(href).toBe('https://www.linkedin.com/in/kuba-musielski/');
    }
    const mailto = page.locator('a[href^="mailto:"]');
    expect(await mailto.count()).toBeGreaterThanOrEqual(4);
    for (const href of await mailto.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))) {
      expect(href).toBe('mailto:musielskikuba@gmail.com');
    }
    await expect(page.locator('.chrome__nav')).toContainText('About');
    await expect(page.locator('.chrome__nav')).toContainText('Work');
    await expect(page.locator('.chrome__nav')).toContainText('Contact');
    await expect(page.locator('canvas.stage__canvas')).toBeVisible();
    // Lenis is driving the scroll
    await expect(page.locator('html')).toHaveClass(/lenis/);
    expect(errors).toEqual([]);
  });

  test('scroll journey moves through every act and reverses cleanly', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page);
    const expected: [string, number, string][] = [
      ['top', 0, 'surface'],
      ['magnify', 0.5, 'magnify'],
      ['structure', 0.5, 'structure'],
      ['turn', 0.5, 'turn'],
      ['work', 0.3, 'work'],
      ['coda', 0.8, 'coda'],
    ];
    for (const [act, f, name] of expected) {
      await jump(page, act, f);
      expect(await chapter(page)).toBe(name);
    }
    // the structure act uses the ridge world, the turn has the wave mid-way
    await jump(page, 'structure', 0.5);
    expect(await page.evaluate(() => (window as any).__scene.world)).toBe(1);
    await jump(page, 'turn', 0.55);
    const flip = await page.evaluate(() => (window as any).__scene.flip);
    expect(flip).toBeGreaterThan(0.2);
    expect(flip).toBeLessThan(0.9);
    // rapid reversal straight back to the top restores the opening state
    await jump(page, 'top', 0);
    expect(await chapter(page)).toBe('surface');
    const s = await page.evaluate(() => (window as any).__scene);
    expect(s.world).toBe(0);
    expect(s.flip).toBe(0);
    expect(s.veil).toBe(0);
    expect(errors).toEqual([]);
  });

  test('wheel input scrolls through Lenis', async ({ page }) => {
    await open(page);
    await page.mouse.move(900, 600);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(900);
    const y = await page.evaluate(() => (window as any).__scroll.y);
    expect(y).toBeGreaterThan(1000);
  });

  test('navigation reaches the work quickly and updates the URL', async ({ page }) => {
    await open(page);
    await page.locator('.chrome__nav a', { hasText: 'Work' }).click();
    await expect.poll(() => chapter(page), { timeout: 5000 }).toBe('work');
    expect(page.url()).toMatch(/#work$/);
    await expect(page.locator('.chrome__nav a', { hasText: 'Work' })).toHaveAttribute('aria-current', 'true');
    await page.locator('.chrome__nav a', { hasText: 'About' }).click();
    await expect.poll(() => chapter(page), { timeout: 5000 }).toBe('structure');
    await page.locator('.chrome__nav a', { hasText: 'Contact' }).click();
    await expect.poll(() => chapter(page), { timeout: 5000 }).toBe('coda');
    await page.locator('.chrome__mark').click();
    await expect.poll(() => chapter(page), { timeout: 5000 }).toBe('surface');
  });

  test('skip link is keyboard reachable and jumps to the work', async ({ page }) => {
    await open(page);
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect.poll(() => chapter(page), { timeout: 5000 }).toBe('work');
  });

  test('anchor in the URL on arrival lands on that act', async ({ page }) => {
    await open(page, '/#structure');
    expect(await chapter(page)).toBe('structure');
  });

  test('resizing keeps the choreography aligned', async ({ page }) => {
    const errors = watchErrors(page);
    await open(page);
    await jump(page, 'structure', 0.5);
    for (const size of [{ width: 1280, height: 720 }, { width: 2560, height: 1440 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(400);
      await jump(page, 'structure', 0.5);
      expect(await chapter(page)).toBe('structure');
      await expectNoHorizontalOverflow(page);
    }
    const canvas = await page.locator('canvas.stage__canvas').boundingBox();
    expect(canvas?.width).toBe(1440);
    expect(errors).toEqual([]);
  });

  test('empty production gallery shows the designed sockets', async ({ page }) => {
    await open(page);
    await jump(page, 'work', 0.7);
    await expect(page.locator('.empty')).toBeVisible();
    await expect(page.locator('.empty__title')).toHaveText('Projects are coming soon.');
    await expect(page.locator('.empty__link').first()).toHaveAttribute('href', 'https://github.com/kubamus');
    await expect(page.locator('.empty__link').nth(1)).toHaveAttribute('href', 'mailto:musielskikuba@gmail.com');
    // the wing itself opens bare sockets where projects will be mounted
    await expect.poll(() => page.evaluate(() => (window as any).__stage().wing.material.uniforms.uClearAmt.value)).toBeGreaterThan(0.5);
    await expect(page.locator('[data-count]')).toHaveText('No projects listed yet');
    await expect(page.locator('.fixture-badge')).toHaveCount(0);
  });

  test('pointer brushes the wing (brush field receives energy)', async ({ page }) => {
    await open(page);
    await page.waitForTimeout(3500); // let the opening stroke finish and decay
    for (let i = 0; i <= 30; i++) {
      await page.mouse.move(300 + i * 40, 820 - Math.sin((i / 30) * Math.PI) * 140);
      await page.waitForTimeout(16);
    }
    const energy = await page.evaluate(() => (window as any).__stage().brush.energy);
    expect(energy).toBeGreaterThan(0.1);
  });
});
