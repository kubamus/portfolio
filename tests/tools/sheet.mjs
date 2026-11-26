// Dev tool: screenshot the project sheet opening from the gallery (demo fixtures).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [, , out] = process.argv;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5180/?fixtures=several', { waitUntil: 'networkidle' });
await page.waitForSelector('.stage.is-ready');
const y = await page.evaluate(() => window.__track.resolve(['work', 0.12]));
await page.evaluate((yy) => window.__scroll.lenis.scrollTo(yy, { immediate: true, force: true }), y);
await page.waitForTimeout(2500);
await page.locator('.specimen__title a').first().click({ force: true });
await page.waitForTimeout(350);
await page.screenshot({ path: `${out}/sheet-opening.png` });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/sheet-open.png` });
await browser.close();
console.log('ok');
