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
    loader: { '.css': 'empty' },
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

it('links every scene-paired character and monster graphics file without guessing for unused assets', async () => {
  const script = await build({
    stdin: {
      resolveDir: 'src/editor/shell',
      contents: `
        import { GameFiles } from '../../project/files';
        import { Project } from '../core/project';
        import { newGame, emptyScene, serializeGame, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
        import { fileDependenciesLine } from './usedBy';
        const game = newGame('Test');
        for (const [chr, cbl, mon, mbl] of [
          ['HERO.CHR', 'HERO.CBL', 'FOES.MON', 'FOES.MBL'],
          ['hero.chr', 'other.cbl', 'foes.mon', 'other.mbl'],
          ['hero.chr', 'hero.cbl', 'foes.mon', 'missing.mbl'],
        ]) {
          const scene = emptyScene(ADVTYPE);
          scene.files[5] = chr; scene.files[6] = cbl;
          scene.files[3] = mon; scene.files[4] = mbl;
          game.scenes.push(scene);
        }
        const files = new GameFiles([
          ['test.gam', serializeGame(game)],
          ...['hero.chr', 'hero.cbl', 'other.cbl', 'foes.mon', 'foes.mbl', 'other.mbl', 'unused.chr', 'unused.mon']
            .map(name => [name, new Uint8Array(1)]),
        ]);
        const project = new Project('dependency-test', 'Test', 'test.gam', files);
        for (const file of ['HERO.CHR', 'FOES.MON', 'unused.chr', 'unused.mon']) {
          const row = fileDependenciesLine(project, file);
          if (row) { row.id = file.toLowerCase(); document.body.append(row); }
        }
      `,
    },
    loader: { '.css': 'empty' },
    bundle: true,
    format: 'esm',
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ type: 'module', content: script.outputFiles[0].text });
    expect(await page.locator('.uses').allTextContents()).toEqual(['Uses hero.cbl, other.cbl.', 'Uses foes.mbl, other.mbl.']);
    await page.getByRole('button', { name: 'other.cbl', exact: true }).click();
    expect(await page.evaluate(() => location.hash)).toContain('other.cbl');
    expect(await page.locator('.uses button').count()).toBe(4);
  } finally {
    await browser.close();
  }
});
