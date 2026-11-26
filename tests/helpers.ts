import { expect, type Page } from '@playwright/test';

/** Collects page errors and console errors (ignoring the dev server's own chatter). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (t.includes('[vite]')) return;
    // intentionally broken demo image in the "edge" fixture set
    if (t.includes('does-not-exist.webp') || t.includes('404')) return;
    errors.push(`console: ${t}`);
  });
  return errors;
}

/** Loads the page and waits until the WebGL stage (when present) has drawn. */
export async function open(page: Page, path = '/', { stage = true } = {}) {
  await page.goto(path, { waitUntil: 'networkidle' });
  if (stage) await page.waitForSelector('.stage.is-ready', { timeout: 30_000 });
  await page.waitForFunction(() => document.documentElement.classList.contains('fonts-ready'));
}

/** Scroll position (px) of [act, fraction] as the choreography resolves it. */
export function resolve(page: Page, act: string, fraction: number) {
  return page.evaluate(([a, f]) => (window as any).__track.resolve([a, f]), [act, fraction] as const);
}

/** Jump instantly to [act, fraction] through Lenis and let one frame settle. */
export async function jump(page: Page, act: string, fraction: number) {
  const y = await resolve(page, act, fraction);
  await page.evaluate((yy) => (window as any).__scroll.lenis.scrollTo(yy, { immediate: true, force: true }), y);
  await page.waitForTimeout(250);
  return y;
}

export async function chapter(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.chapter);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
