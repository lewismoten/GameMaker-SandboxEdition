// Exercise the Guide spine where the transparent part of the Library TV overlaps it.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('opens the Guide two pixels inside the left edge of its spine', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // Desktop bounds recorded by the focus-order sweep at 1440 × 900.
    await page.setContent(`
      <a class="lib-spine-btn" href="#/programmers-guide"
         style="position:absolute;left:476px;top:358px;width:24px;height:49px">Guide</a>
      <button class="lib-obj lib-o-tv" style="left:317px;top:341px;width:182px;height:279px"
              onclick="location.hash='/library?open=tv'">TV</button>
    `);
    await page.addStyleTag({ content: readFileSync(new URL('./libraryRoom.css', import.meta.url), 'utf8') });
    const spine = await page.locator('.lib-spine-btn').boundingBox();
    expect(spine).toBeTruthy();
    await page.mouse.click(spine!.x + 2, spine!.y + spine!.height / 2);
    expect(await page.evaluate(() => location.hash)).toBe('#/programmers-guide');
  } finally {
    await browser.close();
  }
});
