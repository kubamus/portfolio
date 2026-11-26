// Dev tool: demonstrates the "brush the wing" interaction as a frame sequence.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [, , out, size = '1920x1080', query = ''] = process.argv;
const [w, h] = size.split('x').map(Number);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(`http://localhost:5180/${query}`, { waitUntil: 'networkidle' });
await page.waitForSelector('.stage.is-ready');
await page.waitForTimeout(6500);
await page.screenshot({ path: `${out}/brush-0-before.png` });
// a slow S-stroke across the lower half of the wing
const pts = [];
for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([w * (0.08 + t * 0.8), h * (0.78 - Math.sin(t * Math.PI) * 0.18)]); }
for (const [x, y] of pts) { await page.mouse.move(x, y); await page.waitForTimeout(16); }
await page.screenshot({ path: `${out}/brush-1-during.png` });
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/brush-2-relaxing.png` });
await browser.close();
console.log('ok');
