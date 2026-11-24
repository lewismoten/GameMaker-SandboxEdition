// Measure the printed captions on the tilted phone keyboard in Chromium.
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { launch } from './perfLib';

it('keeps the F9 caption clear of the brand on phone keyboards', async () => {
  const bundle = await build({
    stdin: { contents: "export { keyboard } from './src/desk/pc/keyboard'", resolveDir: process.cwd() },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'fixture',
    loader: { '.css': 'empty' },
  });
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div class="pc"><div class="kb-tray"></div></div>');
    for (const path of ['desk.css', 'pc/tray.css', 'pc/keyboard.css']) {
      await page.addStyleTag({ content: await readFile('src/desk/' + path, 'utf8') });
    }
    await page.addScriptTag({ content: bundle.outputFiles[0].text + '\ndocument.querySelector(".kb-tray").append(fixture.keyboard(() => {}).board)' });
    for (const [width, height] of [
      [320, 740],
      [375, 812],
    ]) {
      await page.setViewportSize({ width, height });
      const bounds = await page.evaluate(() => {
        const rect = (selector: string) => {
          const range = document.createRange();
          range.selectNodeContents(document.querySelector(selector)!);
          return range.getBoundingClientRect();
        };
        const setup = rect('.kt-f9');
        const brand = rect('.kt-brand');
        return {
          setupWidth: setup.width,
          overlapX: Math.min(setup.right, brand.right) - Math.max(setup.left, brand.left),
          overlapY: Math.min(setup.bottom, brand.bottom) - Math.max(setup.top, brand.top),
        };
      });
      expect(bounds.setupWidth).toBeGreaterThan(0);
      expect.soft(Math.min(bounds.overlapX, bounds.overlapY), JSON.stringify({ width, ...bounds })).toBeLessThanOrEqual(0);
    }
  } finally {
    await browser.close();
  }
});
