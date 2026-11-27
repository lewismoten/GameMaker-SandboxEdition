// Check native touch hit testing where adjacent map exits overlap.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';
import { markerBox } from './markerMath';

it('targets each adjacent exit at its center and keeps the outer touch area', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ hasTouch: true, isMobile: true });
    const buttons = [10, 11, 16].map((x) => {
      const b = markerBox({ x, y: 10 }, 20);
      return `<button class="lk-mark lk-out" style="box-sizing:border-box;left:${b.left}px;top:${b.top}px;width:${b.size}px;height:${b.size}px;--lk-block:20px;--lk-size:${b.size}px" onpointerdown="document.title=this.textContent">${x}</button>`;
    });
    await page.setContent('<meta name="viewport" content="width=device-width"><div class="lk-layer">' + buttons.join('') + '</div>');
    await page.addStyleTag({ content: readFileSync(new URL('./linkMarkers.css', import.meta.url), 'utf8') });
    for (const [x, expected] of [
      [210, 10],
      [230, 11],
      [351, 16],
    ]) {
      await page.touchscreen.tap(x, 210);
      expect(await page.title()).toBe(String(expected));
    }
  } finally {
    await browser.close();
  }
});
