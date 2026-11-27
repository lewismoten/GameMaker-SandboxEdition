// Exercise the DOS menu's click capture and Escape focus return in Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('focuses the summary before an item runs, and on Escape', async () => {
  const bundle = await build({ entryPoints: ['src/dosPage/moreMenu.ts'], bundle: true, write: false, globalName: 'dos' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.addScriptTag({
      content: `const item = document.createElement('button');
        item.textContent = 'Choose';
        const menu = dos.moreMenu('More', [item]);
        document.body.append(menu);
        item.onclick = () => { item.dataset.focusAtClick = document.activeElement.tagName; };`,
    });
    const summary = page.locator('summary');
    const item = page.getByRole('button', { name: 'Choose' });
    await summary.click();
    await item.click();
    expect(await page.locator('button').getAttribute('data-focus-at-click')).toBe('SUMMARY');
    expect(await page.locator('details[open]').count()).toBe(0);

    await summary.click();
    await item.press('Escape');
    expect(await page.locator('details[open]').count()).toBe(0);
    expect(await summary.evaluate((el) => el === document.activeElement)).toBe(true);
  } finally {
    await browser.close();
  }
});
