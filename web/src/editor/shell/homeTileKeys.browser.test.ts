// Roving focus should only write the two tab stops that change.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('moves focus without rewriting the rest of the collection', async () => {
  const script = await build({
    stdin: { resolveDir: 'src/editor/shell', contents: "import {tileArrowKeys} from './homeTileKeys'; tileArrowKeys(document.body);" },
    bundle: true,
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<article class="game-tile"><button class="tile-select"></button></article>'.repeat(4));
    await page.addScriptTag({ content: script.outputFiles[0].text });
    expect(await page.locator('.tile-pos').allTextContents()).toEqual([', 1 of 4', ', 2 of 4', ', 3 of 4', ', 4 of 4']);
    const result = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const writes = new MutationObserver(() => {});
      writes.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['tabindex'] });
      buttons[2].focus();
      return { writes: writes.takeRecords().length, stops: buttons.map((button) => button.tabIndex) };
    });
    expect(result).toEqual({ writes: 2, stops: [-1, -1, 0, -1] });
  } finally {
    await browser.close();
  }
});
