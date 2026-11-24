// Check pointer routing where the TV cart meets the lower shelf in the Library.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.argv[2] ?? 'http://127.0.0.1:6154';
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
      try {
        await page.addInitScript((mode) => {
          localStorage.setItem('gm-ui', 'modern');
          localStorage.setItem('gm-theme', mode);
        }, theme);
        await page.goto(base + '/#/library', { waitUntil: 'domcontentloaded', timeout: 120000 });
        const spine = page.locator('.lib-spine-btn[href="#/programmers-guide"]');
        const tv = page.locator('.lib-o-tv');
        await page.locator('.lib-spine-btn').first().waitFor({ state: 'attached', timeout: 120000 });
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        await tv.locator(width === 390 ? '.lib-tag' : 'rect[fill="url(#av-glow)"]').click();
        await page.waitForURL('**/#/library?open=tv');
        await page.keyboard.press('Escape');
        await page.waitForURL('**/#/library');
        if (width === 390) {
          assert.equal(await spine.isVisible(), false);
          await page.locator('.lib-o-stacks').click();
          await page.locator('dialog a[href="#/programmers-guide"]').first().click();
        } else {
          const rect = await spine.boundingBox();
          assert.ok(rect);
          assert.equal(
            await spine.evaluate((link) => {
              const bounds = link.getBoundingClientRect();
              return document.elementFromPoint(bounds.x + 2, bounds.y + bounds.height / 2)?.closest('a') === link;
            }),
            true,
          );
          await page.mouse.click(rect.x + 2, rect.y + rect.height / 2);
        }
        await page.waitForURL('**/#/programmers-guide');
        console.log(width, theme, 'passed');
      } catch (error) {
        console.error(width, theme, error);
        process.exitCode = 1;
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
