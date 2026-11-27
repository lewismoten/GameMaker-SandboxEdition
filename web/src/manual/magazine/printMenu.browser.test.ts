// Exercise the magazine's Print menu with the viewer's page shortcuts active.
import { build } from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright-core';
import { afterAll, beforeAll, expect, it } from 'vitest';

let browser: Browser;
let page: Page;
beforeAll(async () => {
  const bundle = await build({
    entryPoints: ['src/manual/magazine/viewer.ts'],
    globalName: 'magazine',
    bundle: true,
    write: false,
    loader: { '.css': 'empty', '.md': 'text', '.png': 'empty' },
    define: { 'import.meta': '{}' },
  });
  browser = await chromium.launch();
  page = await browser.newPage();
  await page.route('http://localhost/**', (route) =>
    route.request().isNavigationRequest() ? route.fulfill({ contentType: 'text/html', body: '<main></main>' }) : route.fulfill({ json: [] }),
  );
  await page.goto('http://localhost/');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.addScriptTag({ content: "magazine.mountMagazine(document.querySelector('main'), { where: 'web' })" });
  await page
    .locator('.mag-counter')
    .filter({ hasText: /^Cover/ })
    .waitFor();
});
afterAll(async () => {
  await browser?.close();
});

it('navigates print choices without turning the page and returns focus on Escape', async () => {
  const counter = page.locator('.mag-counter');
  const initial = await counter.textContent();
  const print = page.getByRole('button', { name: 'Print…' });
  await print.press('Enter');
  const focused = page.locator('[role=menuitem]:focus');
  expect(await focused.allTextContents()).toEqual(['This page']);
  for (const [key, label] of [
    ['ArrowDown', 'The pages in view'],
    ['End', 'The whole issue'],
    ['Home', 'This page'],
    ['ArrowUp', 'The whole issue'],
  ]) {
    await page.keyboard.press(key);
    expect(await focused.allTextContents()).toEqual([label]);
    expect(await counter.textContent()).toBe(initial);
  }
  await page.keyboard.press('Escape');
  expect(await print.getAttribute('aria-expanded')).toBe('false');
  expect(await print.evaluate((el) => el === document.activeElement)).toBe(true);
});
