// Closing the viewer during either the play delay or a fold must leave its stage idle.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('stops playback when the fold viewer is removed', async () => {
  const bundle = await build({
    entryPoints: ['src/manual/printables/balloonCubeFoldView.ts'],
    bundle: true,
    write: false,
    globalName: 'fold',
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.clock.install();
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    for (const elapsed of [0, 1100]) {
      await page.addScriptTag({
        content: `{
        const faces = Object.fromEntries(['top','bottom','ne','nw','se','sw'].map((key, i) => [key, { pips: i }]));
        document.body.append(fold.foldViewer({ faces }));
      }`,
      });
      const viewer = await page.locator('.bcf').elementHandle();
      await viewer.$eval('.bcf-play', (button: HTMLButtonElement) => button.click());
      await page.clock.runFor(elapsed);
      await viewer.evaluate((el) => el.remove());
      const position = () => viewer.$eval('.bcf-slider', (slider: HTMLInputElement) => slider.value);
      const closed = await position();
      if (elapsed) expect(Number(closed)).toBeGreaterThan(0);
      await page.clock.runFor(2500);
      expect(await position()).toBe(closed);
    }
  } finally {
    await browser.close();
  }
});
