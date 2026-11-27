// Render a wheel with a fill overlay that extends beyond its glyph.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('clips extra fill rows and columns to the glyph', async () => {
  const script = await build({
    entryPoints: ['src/manual/printables/codeWheel.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'wheel',
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({
      content: `document.body.append(wheel.codeWheelPicture({
        heading: 'Dial', outer: ['Face'], inner: ['Face'], glyphs: { Face: ['#'] },
        fills: { Face: ['Rb', 'B'] }, fillColors: { r: 'red', b: 'blue' }
      }));`,
    });
    expect(await page.locator('.cw-fill[fill="red"]').count()).toBe(2);
    expect(await page.locator('.cw-fill[fill="blue"]').count()).toBe(0);
  } finally {
    await browser.close();
  }
});
