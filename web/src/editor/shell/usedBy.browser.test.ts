// An unused file still links to the game editor inside the folded references row.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('shows Used by 0 and keeps the game-editor link for an unused file', async () => {
  const script = await build({
    stdin: {
      resolveDir: 'src/editor/shell',
      contents: `
        import { GameFiles } from '../../project/files';
        import { h } from '../core/ui';
        import { foldRefs } from './refsFold';
        import { usedByLine } from './usedBy';

        const files = new GameFiles([['unused.gif', new Uint8Array()]]);
        const project = { gam: 'test.gam', files, usesOf: () => [] };
        const refs = h('div', { class: 'file-refs' }, usedByLine(project, 'unused.gif'));
        document.body.append(foldRefs(refs));
      `,
    },
    bundle: true,
    format: 'esm',
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ type: 'module', content: script.outputFiles[0].text });
    const refs = page.locator('.file-refs');
    expect(await refs.locator('.refs-toggle').textContent()).toBe('Used by 0 ▸');
    expect(await refs.getByRole('button', { name: 'test.gam', exact: true }).count()).toBe(1);
  } finally {
    await browser.close();
  }
});
