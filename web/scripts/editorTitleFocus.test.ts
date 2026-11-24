// A restored editor route must show its focused filename even in the compact phone header.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { expect, it } from 'vitest';
import { launch } from './perfLib';

it('reveals the phone file heading during route focus and clips it again on Tab', async () => {
  const bundle = await build({ entryPoints: ['src/routeFocus.ts'], bundle: true, write: false, format: 'iife', globalName: 'routeFocus' });
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent('<main class="editor"><div class="file-head"><h1 class="file-title">mygame.map</h1><button>File actions</button></div></main>');
    await page.addStyleTag({ content: ':root { --focus: orange; }' + readFileSync('src/editor/shell/editorHead.css', 'utf8') });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate('routeFocus.trackPersonInput()');
    await page.keyboard.press('Enter');
    await page.evaluate("routeFocus.focusNewView(document.querySelector('main'), '#/p/look:logic/kitchen.map', '#/p/mine/mygame.map')");
    const title = page.locator('h1:focus');
    expect(await title.evaluate((el) => [getComputedStyle(el).clipPath, getComputedStyle(el).outlineStyle])).toEqual(['none', 'solid']);
    expect((await title.boundingBox())?.height).toBeGreaterThan(1);
    await page.keyboard.press('Tab');
    expect(await page.locator(':focus').textContent()).toBe('File actions');
    expect((await page.locator('h1').boundingBox())?.height).toBe(1);
  } finally {
    await browser.close();
  }
}, 30_000);
