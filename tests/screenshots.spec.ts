import { test } from '@playwright/test';
import { jump, open } from './helpers';

/**
 * Regenerates the documentation screenshots in /screenshots.
 * Run with: bun run shots
 */
const MOMENTS: [string, number, string][] = [
  ['top', 0, '01-surface'],
  ['top', 0.55, '02-rising'],
  ['magnify', 0.45, '03-color-without-pigment'],
  ['structure', 0.2, '04-into-the-structure'],
  ['structure', 0.62, '05-structure'],
  ['turn', 0.15, '06-before-the-turn'],
  ['turn', 0.5, '07-the-turn'],
  ['turn', 0.9, '08-underside'],
  ['work', 0.08, '09-work-empty'],
  ['coda', 0.75, '10-coda'],
];

const SIZES = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 3440, height: 1440 },
];

for (const size of SIZES) {
  test(`journey ${size.width}x${size.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: size });
    const page = await context.newPage();
    await open(page);
    await page.mouse.move(size.width / 2, size.height * 0.4);
    await page.waitForTimeout(4000);
    const moments = size.width === 1920 ? MOMENTS : MOMENTS.filter(([, , n]) => /01|05|07|09/.test(n));
    for (const [act, f, name] of moments) {
      await jump(page, act, f);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `screenshots/${size.width}x${size.height}/${name}.jpg`, type: 'jpeg', quality: 88 });
    }
    await context.close();
  });
}

test('gallery with demo fixtures', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await open(page, '/?fixtures=several');
  await jump(page, 'work', 0.12);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'screenshots/fixtures/several-1.jpg', type: 'jpeg', quality: 88 });
  await jump(page, 'work', 0.45);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'screenshots/fixtures/several-2.jpg', type: 'jpeg', quality: 88 });
  await page.locator('.specimen__title a').first().click({ force: true });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'screenshots/fixtures/project-sheet.jpg', type: 'jpeg', quality: 88 });
  await context.close();

  const c2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p2 = await c2.newPage();
  await open(p2, '/?fixtures=many');
  await jump(p2, 'work', 0.35);
  await p2.waitForTimeout(2200);
  await p2.screenshot({ path: 'screenshots/fixtures/many.jpg', type: 'jpeg', quality: 88 });
  await jump(p2, 'work', 0.97);
  await p2.waitForTimeout(1500);
  await p2.screenshot({ path: 'screenshots/fixtures/index.jpg', type: 'jpeg', quality: 88 });
  await c2.close();
});

test('brush interaction', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await open(page);
  await page.waitForTimeout(6500);
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    await page.mouse.move(1920 * (0.08 + t * 0.8), 1080 * (0.78 - Math.sin(t * Math.PI) * 0.18));
    await page.waitForTimeout(16);
  }
  await page.screenshot({ path: 'screenshots/1920x1080/11-brushing-the-wing.jpg', type: 'jpeg', quality: 88 });
  await context.close();
});
