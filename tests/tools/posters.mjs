// Dev tool: renders text-free frames of each act for the no-WebGL fallback, plus og.jpg.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? 'public/posters';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' });
await page.waitForSelector('.stage.is-ready');
await page.mouse.move(800, 380);
await page.waitForTimeout(4500);
await page.screenshot({ path: 'public/og-source.png', clip: { x: 0, y: 0, width: 1600, height: 840 } });
await page.addStyleTag({ content: 'main, .chrome, .scalebar, .scrim, .skip-link { visibility: hidden !important; }' });
const frames = [['surface', 'top', 0], ['magnify', 'magnify', 0.6], ['structure', 'structure', 0.66], ['turn', 'turn', 0.9], ['work', 'work', 0.6], ['coda', 'coda', 0.75]];
for (const [name, act, f] of frames) {
  const y = await page.evaluate(([a, fr]) => window.__track.resolve([a, fr]), [act, f]);
  await page.evaluate((yy) => window.__scroll.lenis.scrollTo(yy, { immediate: true, force: true }), y);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}.png` });
}
await browser.close();
console.log('ok');
