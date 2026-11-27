// Tab reaches the selected project's actions once in the home collection.
import { expect, it } from 'vitest';
import { chromium } from 'playwright-core';
import { build } from 'esbuild';

it('tabs past unselected project menus', async () => {
  const script = await build({
    stdin: {
      resolveDir: 'src/editor/shell',
      contents: `
      import { gameTile } from './homeCards';
      import { tileArrowKeys } from './homeTileKeys';
      const host = document.body;
      for (const title of ['First', 'Second']) {
        const game = { title, kind: 'mine', key: title, byline: '', search: title, project: { id: title }, drawTitle: async () => true };
        const tile = gameTile(game, { onSelect() {}, onMore() {} });
        tile.querySelector('.tile-select').setAttribute('aria-current', String(title === 'First'));
        host.append(tile);
      }
      tileArrowKeys(host);
      document.body.append(Object.assign(document.createElement('button'), { id: 'after' }));
    `,
    },
    bundle: true,
    format: 'esm',
    plugins: [
      {
        name: 'defer-lazy-imports',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => (args.kind === 'dynamic-import' ? { external: true } : undefined));
        },
      },
    ],
    loader: { '.css': 'empty' },
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ type: 'module', content: script.outputFiles[0].text });
    await page.keyboard.press('Tab');
    expect(await page.locator(':focus .tile-title').textContent()).toBe('First');
    await page.keyboard.press('Tab');
    expect(await page.locator(':focus').getAttribute('aria-label')).toContain('First');
    await page.keyboard.press('Tab');
    expect(await page.locator(':focus').getAttribute('id')).toBe('after');
  } finally {
    await browser.close();
  }
});
