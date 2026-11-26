// Dev tool: renders the experience at scroll positions and saves screenshots.
// usage: node tests/tools/shoot.mjs <outDir> <width>x<height> [query] [points...]
// points are "act:fraction" pairs, e.g. top:0 magnify:0.5
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [, , out, size = '1920x1080', query = '', ...pts] = process.argv;
const [w, h] = size.split('x').map(Number);
mkdirSync(out, { recursive: true });
const points = pts.length ? pts : ['top:0', 'top:0.5', 'magnify:0.2', 'magnify:0.5', 'magnify:0.8', 'structure:0.2', 'structure:0.5', 'structure:0.75', 'turn:0.15', 'turn:0.5', 'turn:0.9', 'work:0.05', 'work:0.5', 'coda:0.7'];
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
await page.goto(`http://localhost:5180/${query}`, { waitUntil: 'networkidle' });
await page.waitForSelector('.stage.is-ready', { timeout: 20000 }).catch(() => errors.push('stage never ready'));
await page.mouse.move(w * 0.5, h * 0.5);
await page.waitForTimeout(3800);
for (const p of points) {
  const [act, f] = p.split(':');
  const y = await page.evaluate(([a, fr]) => window.__track.resolve([a, Number(fr)]), [act, f]);
  await page.evaluate((yy) => { window.__scroll.lenis.scrollTo(yy, { immediate: true, force: true }); }, y);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}/${w}x${h}-${act}-${f}.png` });
}
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
