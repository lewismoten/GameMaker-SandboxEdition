// Check pointer routing where the TV cart meets the lower shelf in the Library.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.argv[2] ?? 'http://127.0.0.1:6154';
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const phone = width === 390;
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width, height: phone ? 844 : 900 },
        isMobile: phone,
        hasTouch: phone,
      });
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
        if (phone) await tv.locator('.lib-tag').tap();
        else await tv.locator('rect[fill="url(#av-glow)"]').click();
        await page.waitForURL('**/#/library?open=tv');
        const tvDialog = page.getByRole('dialog', { name: 'TV: videos and walkthroughs', exact: true });
        await tvDialog.waitFor({ state: 'visible' });
        if (phone)
          await tvDialog
            .getByRole('button', { name: 'Close', exact: true })
            .filter({ hasText: /^Close$/ })
            .tap();
        else await page.keyboard.press('Escape');
        await tvDialog.waitFor({ state: 'hidden', timeout: 5000 });
        await page.waitForURL('**/#/library');
        if (phone) {
          assert.equal(await spine.isVisible(), false);
          await page.locator('.lib-o-stacks').tap();
          await page.locator('dialog a[href="#/programmers-guide"]').first().tap();
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
