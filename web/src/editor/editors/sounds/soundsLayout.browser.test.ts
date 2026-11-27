// Measure the sticky headings and their playback targets on a touch phone.
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('aligns compact headings with full-size touch buttons', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, hasTouch: true });
    await page.setContent(
      '<div class="snd-layout"><div class="snd-list"><div class="snd-item snd-heads"><span class="snd-col">PC</span></div><div class="snd-item"><button class="snd-col">PC</button></div></div></div>',
    );
    await page.addStyleTag({ path: 'src/editor/editors/sounds/sounds.css' });
    expect(await page.locator('button').boundingBox()).toMatchObject({ width: 44, height: 44 });
    expect(await page.locator('span').boundingBox()).toMatchObject({ width: 44, height: 24 });
  } finally {
    await browser.close();
  }
});
