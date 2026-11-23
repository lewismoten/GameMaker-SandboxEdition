// File reference links and their folded phone disclosure.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('shows Used by 0 and keeps the game-editor link for an unused file', async () => {
  const script = await build({
    stdin: {
      resolveDir: 'src/editor/shell',
      contents: `
        import { GameFiles } from '../../project/files';
        import { fileRefs } from './refsFold';

        const files = new GameFiles([['unused.gif', new Uint8Array()]]);
        const project = { gam: 'test.gam', files, usesOf: () => [], onExtrasChange: () => () => {} };
        document.body.append(fileRefs(project, 'unused.gif').el);
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

it('updates the open animation disclosure when Scene Maker saves its first picture source', async () => {
  const script = await build({
    stdin: {
      resolveDir: 'src/editor/shell',
      contents: `
        import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
        import { GameFiles } from '../../project/files';
        import { Project } from '../core/project';
        import { emptyScene, SCENE_SECTION } from '../editors/animation/scene/sceneModel';
        import { sceneEditor } from '../editors/animation/scene/sceneEditor';
        import { fileRefs } from './refsFold';

        const files = new GameFiles([
          ['test.gam', serializeGame(newGame('Test'))],
          ['clip.fli', new Uint8Array()],
          ['back.gif', Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='), c => c.charCodeAt(0))],
        ]);
        const project = new Project('scene-test', 'Test', 'test.gam', files);
        project.setExtras('clip.fli', SCENE_SECTION, emptyScene());
        const host = document.createElement('div');
        document.body.append(fileRefs(project, 'clip.fli').el, host);
        sceneEditor(host, project, 'clip.fli');
      `,
    },
    loader: { '.css': 'empty' },
    bundle: true,
    format: 'esm',
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('http://localhost/', (route) => route.fulfill({ contentType: 'text/html', body: '<body></body>' }));
    await page.goto('http://localhost/');
    await page.addScriptTag({ type: 'module', content: script.outputFiles[0].text });
    const toggle = page.locator('.refs-toggle');
    expect(await toggle.textContent()).toBe('Used by 0 ▸');
    await page.getByTitle(/^Background 1:/).click();
    await page.getByLabel(/^Shows/).selectOption('picture');
    expect(await toggle.textContent()).toBe('Used by 0 · Uses 1 ▸');
    await toggle.click();
    expect(await page.locator('.uses button').textContent()).toBe('back.gif');
    await page.getByLabel(/^Shows/).selectOption('color');
    expect(await toggle.textContent()).toBe('Used by 0 ▾');
    expect(await page.locator('.uses').count()).toBe(0);
  } finally {
    await browser.close();
  }
});
