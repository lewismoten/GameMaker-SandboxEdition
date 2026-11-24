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

it.each(['Escape', 'automatic completion'])(
  'returns focus to the filename after %s with expired input',
  async (ending) => {
    const bundle = await build({
      stdin: { contents: "export { Tour } from './src/tour/tourEngine'; export * from './src/routeFocus'", resolveDir: process.cwd() },
      bundle: true,
      write: false,
      format: 'iife',
      globalName: 'fixture',
      define: { 'import.meta.url': 'location.href', 'import.meta.env.DEV': 'false' },
      loader: { '.css': 'empty' },
    });
    const browser = await launch();
    try {
      const page = await browser.newPage();
      const personal = '#/p/mine/mygame.map';
      const sample = '#/p/look:logic/kitchen.map';
      await page.route('http://fixture.test/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<button class="tour-btn">Tour</button><main></main>' }),
      );
      await page.goto('http://fixture.test/' + personal);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.clock.setFixedTime(10000);
      await page.evaluate('fixture.trackPersonInput()');
      await page.locator('.tour-btn').focus();
      await page.keyboard.press('Enter');
      await page.clock.setFixedTime(15000);
      await page.evaluate(`new fixture.Tour([{ page: 'editor', hash: '${sample}', always: true, ready: '#ready', steps: [
      { id: 'skipped', optional: true, target: { css: '#absent' } }
    ] }]).start()`);
      await page.waitForURL('**/' + sample);
      if (ending === 'Escape') await page.keyboard.press('Escape');
      else await page.locator('.tour-btn').evaluate((el) => (el.id = 'ready'));
      await page.waitForURL('**/' + personal);
      expect(await page.locator(':focus').textContent()).toBe('Tour');
      await page.locator('main').evaluate((el) => (el.innerHTML = '<div class="file-head"><h1 class="file-title">mygame.map</h1></div>'));
      await page.evaluate(`fixture.focusNewView(document.querySelector('main'), '${sample}', location.hash, fixture.takeFilenameFocus(location.hash))`);
      expect(await page.locator(':focus').textContent()).toBe('mygame.map');
      expect(await page.evaluate('fixture.takeFilenameFocus(location.hash)')).toBe(false);
    } finally {
      await browser.close();
    }
  },
  30000,
);
