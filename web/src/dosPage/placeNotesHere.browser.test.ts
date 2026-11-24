// Check notice geometry and touch hit testing where height limits the DOS screen.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('keeps one or two achievement notices above the CRT on a short touchscreen', async () => {
  const bundle = await build({ entryPoints: ['src/dosPage/placeNotesHere.ts'], bundle: true, write: false, globalName: 'notes' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 360 }, hasTouch: true, reducedMotion: 'reduce' });
    await page.setContent(
      '<div class="dos-stage" style="height:240px;box-sizing:border-box"><div class="dos-crt"></div></div><div class="ach-toasts ach-placed"></div>',
    );
    for (const path of ['src/achievements/toast.css', 'src/dosPage/dosPage.css']) await page.addStyleTag({ path });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.addScriptTag({
      content: "notes.placeNotesHere(document.querySelector('.dos-stage'), document.querySelector('.dos-crt'))(document.querySelector('.ach-toasts'))",
    });
    const host = page.locator('.ach-toasts');
    for (const title of ['First', 'Second']) {
      await host.evaluate((el, title) => {
        el.insertAdjacentHTML(
          'beforeend',
          `<div class="ach-toast"><span class="ach-toast-icon">★</span><div class="ach-toast-text"><strong>${title}</strong></div><button class="ach-toast-close">×</button></div>`,
        );
      }, title);
      const results = await page.locator('.ach-toast').evaluateAll((rows) =>
        rows.map((row) => {
          const top = document.querySelector('.dos-crt')!.getBoundingClientRect().top;
          const button = row.querySelector('button')!.getBoundingClientRect();
          return { overlap: row.getBoundingClientRect().bottom - top, hit: document.elementFromPoint(button.x + button.width / 2, top + 2)?.className };
        }),
      );
      for (const result of results) {
        expect(result.overlap).toBeLessThanOrEqual(0);
        expect(result.hit).toBe('dos-crt');
      }
    }
  } finally {
    await browser.close();
  }
});
