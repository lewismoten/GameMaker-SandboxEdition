// Check the Exact numbers disclosure with the monster editor's touch styles.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('toggles Exact numbers from the right side of the touch row', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, hasTouch: true });
    await page.setContent('<div class="mon-detail"><details class="mpath-numbers"><summary>Exact numbers</summary></details></div>');
    for (const file of ['./monsterPath.css', './monsters.css']) {
      await page.addStyleTag({ content: readFileSync(new URL(file, import.meta.url), 'utf8') });
    }
    const summary = page.locator('summary');
    for (const marker of ['disclosure-closed', 'disclosure-open']) {
      const row = await summary.boundingBox();
      expect(row!.height).toBeGreaterThanOrEqual(44);
      expect(row!.width).toBe(await page.locator('details').evaluate((details) => details.clientWidth));
      expect(await summary.evaluate((el) => getComputedStyle(el).display)).toBe('list-item');
      expect(await summary.evaluate((el) => getComputedStyle(el).listStyleType)).toBe(marker);
      await page.touchscreen.tap(row!.x + 200, row!.y + row!.height / 2);
      expect(await page.locator('details').evaluate((details) => details.hasAttribute('open'))).toBe(marker === 'disclosure-closed');
    }
  } finally {
    await browser.close();
  }
});
