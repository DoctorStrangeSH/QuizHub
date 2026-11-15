import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.QUIZHUB_PREVIEW_URL || 'http://127.0.0.1:8765/';
const output = 'artifacts/quizhub-preview';
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      serviceWorkers: 'block'
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    try {
      const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response?.ok()) throw new Error('HTTP response not OK: ' + response?.status());
      await page.locator('#initial-splash.hidden').waitFor({ timeout: 30000 });
      await page.locator('#app-root').getByText('QuizHub', { exact: true }).first().waitFor({ timeout: 15000 });
      const metrics = await page.evaluate(() => {
        const bg = getComputedStyle(document.body).backgroundColor;
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth + 2;
        return { title: document.title, hasOverflow, bg, viewport: window.innerWidth };
      });
      if (metrics.hasOverflow) throw new Error('Horizontal overflow detected at ' + viewport.width + 'px');
      if (errors.length) throw new Error('JavaScript errors: ' + errors.join('; '));
      results.push({ viewport: viewport.name, ...metrics, status: 'passed' });
    } catch (error) {
      failed = true;
      results.push({ viewport: viewport.name, status: 'failed', reason: error.message, errors });
    } finally {
      await page.screenshot({ path: `${output}/${viewport.name}.png`, fullPage: true });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
if (failed) process.exitCode = 1;
