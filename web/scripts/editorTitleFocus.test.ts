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
    await page.evaluate("routeFocus.focusNewView(document.querySelector('main'), true)");
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

it.each(['Escape', 'automatic completion', 'Close tour'])(
  'focuses the restored editor view after %s',
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
      const overview = ending === 'Close tour';
      const personal = overview ? '#/p/mine' : '#/p/mine/mygame.map';
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
      else if (overview) await page.getByRole('button', { name: 'Close tour' }).click();
      else await page.locator('.tour-btn').evaluate((el) => (el.id = 'ready'));
      await page.waitForURL('**/' + personal);
      expect(await page.locator(':focus').textContent()).toBe('Tour');
      if (overview) {
        await page.locator('main').evaluate((el) => {
          el.outerHTML = '<div id="content"><main aria-label="Editor"><button>Controls</button></main></div>';
        });
        await page.evaluate(`fixture.focusNewView(document.querySelector('#content'), false, fixture.takeFilenameFocus(location.hash))`);
        const landmark = page.getByRole('main', { name: 'Editor' });
        expect(await landmark.isVisible()).toBe(true);
        expect(await landmark.evaluate((el) => el === document.activeElement)).toBe(true);
        return;
      }
      await page.locator('main').evaluate((el) => (el.innerHTML = '<div class="file-head"><h1 class="file-title">mygame.map</h1></div>'));
      await page.evaluate(`fixture.focusNewView(document.querySelector('main'), false, fixture.takeFilenameFocus(location.hash))`);
      expect(await page.locator(':focus').textContent()).toBe('mygame.map');
      expect(await page.evaluate('fixture.takeFilenameFocus(location.hash)')).toBe(false);
    } finally {
      await browser.close();
    }
  },
  30000,
);

it.each([
  { control: 'link', delay: 0 },
  { control: 'link', delay: 5000 },
  { control: 'button', delay: 5000 },
] as const)(
  'claims one $control activation across a $delay ms render',
  async ({ control, delay }) => {
    const bundle = await build({ entryPoints: ['src/routeFocus.ts'], bundle: true, write: false, format: 'iife', globalName: 'routeFocus' });
    const browser = await launch();
    try {
      const page = await browser.newPage();
      await page.route('http://fixture.test/**', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<a href="#/help">Help</a><button onclick="location.hash=this.dataset.to" data-to="#/help">Open help</button><main><h1>Page</h1></main>',
        }),
      );
      await page.goto('http://fixture.test/#/');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.clock.setFixedTime(10000);
      await page.evaluate(`routeFocus.trackPersonInput();
      window.addEventListener('hashchange', e => {
        const focus = routeFocus.takeNavigationFocus(e);
        window.finishRender = () => routeFocus.focusNewView(document.querySelector('main'), focus);
      })`);
      if (control === 'button') await page.getByRole(control).press('Enter');
      else await page.getByRole(control).click();
      await page.waitForFunction('window.finishRender !== undefined');
      await page.clock.setFixedTime(10000 + delay);
      await page.evaluate('window.finishRender(); delete window.finishRender');
      expect(await page.locator('h1:focus').count()).toBe(1);
      await page.locator('a').focus();
      await page.goBack();
      await page.waitForFunction('window.finishRender !== undefined');
      await page.evaluate('window.finishRender()');
      expect(await page.locator('a:focus').count()).toBe(1);
    } finally {
      await browser.close();
    }
  },
  30000,
);
