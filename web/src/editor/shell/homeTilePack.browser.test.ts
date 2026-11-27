// Maker packing keeps Gameware before Shareware in both grid and tab order.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('does not move a Shareware maker between Gameware makers', async () => {
  const script = await build({
    stdin: { resolveDir: 'src/editor/shell', contents: "import {tilePacker} from './homeTilePack'; tilePacker(document.body).pack(true, false, false);" },
    bundle: true,
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const group = (id: number, kind: string, count: number) =>
      `<h3 class="lib-sub" data-group="${id}" data-kind="${kind}">${id}</h3>` + `<button class="card" data-group="${id}">${id}</button>`.repeat(count);
    await page.setContent(
      `<style>body { display: grid; grid-template-columns: repeat(4, 100px) }</style>${group(0, 'Gameware', 3)}${group(1, 'Gameware', 3)}${group(2, 'Shareware', 1)}`,
    );
    await page.addScriptTag({ content: script.outputFiles[0].text });
    expect(await page.locator('.lib-sub').allTextContents()).toEqual(['0', '1', '2']);
    expect(await page.locator('.card').allTextContents()).toEqual(['0', '0', '0', '1', '1', '1', '2']);
    expect(await page.locator('.lib-sub').evaluateAll((heads) => heads.map((h) => (h as HTMLElement).style.gridArea))).toEqual([
      '1 / 1 / auto / span 3',
      '1 / 4 / auto / span 1',
      '3 / 3 / auto / span 1',
    ]);
  } finally {
    await browser.close();
  }
});
