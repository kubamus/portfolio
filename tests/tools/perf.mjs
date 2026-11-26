// Dev tool: measures frame intervals at several acts (headless Chromium, this machine's GPU).
import { chromium } from 'playwright';
const [, , size = '1920x1080', headed = ''] = process.argv;
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ headless: headed !== 'headed', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.DSF || 1) });
await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' });
await page.waitForSelector('.stage.is-ready');
await page.waitForTimeout(3000);
const gpu = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
});
console.log('renderer:', gpu);
for (const [a, f] of [['top', 0], ['magnify', 0.6], ['structure', 0.66], ['turn', 0.5], ['work', 0.5], ['coda', 0.75]]) {
  const y = await page.evaluate(([aa, ff]) => window.__track.resolve([aa, ff]), [a, f]);
  await page.evaluate((yy) => window.__scroll.lenis.scrollTo(yy, { immediate: true, force: true }), y);
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => new Promise((res) => {
    const t = []; let last = performance.now(); let n = 0;
    const step = (now) => { t.push(now - last); last = now; if (++n < 240) requestAnimationFrame(step); else res(t); };
    requestAnimationFrame(step);
  }));
  r.sort((x, y) => x - y);
  const med = r[Math.floor(r.length / 2)], p95 = r[Math.floor(r.length * 0.95)];
  const dpr = await page.evaluate(() => window.__stage().pixelRatio);
  console.log(`${a}:${f}  median ${med.toFixed(1)} ms  p95 ${p95.toFixed(1)} ms  stage DPR ${dpr}`);
}
await browser.close();
