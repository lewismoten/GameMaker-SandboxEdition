// Mounted sample controls must restore the encoded file, not a lossy re-encoding.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../../../test/editorBrowser';

it('restores exact VOC bytes on Undo and Revert, redoes edits, and invalidates Redo', async () => {
  const fixture = await editorBrowser();
  try {
    const result = await fixture.page.evaluate<{
      original: number[];
      edited: number[];
      undo: number[];
      redo: number[];
      reverted: number[];
      undoRevert: number[];
      redoDisabled: boolean;
    }>(`(async () => {
      const { Project } = await import('/src/editor/core/project.ts');
      const { GameFiles } = await import('/src/project/files.ts');
      const { newGame, serializeGame } = await import('/packages/engine/src/formats/game.ts');
      const { encodeVoc } = await import('/packages/engine/src/formats/voc.ts');
      const { loadEditor } = await import('/src/editor/editors/registry.ts');
      const files = new GameFiles();
      files.set('a.gam', serializeGame(newGame('Sample regression')));
      const original = encodeVoc(new Float32Array([-.8, -.2, .3, .9]));
      files.set('a.voc', original);
      const project = new Project('sample-history-test', 'Sample regression', 'a.gam', files);
      const host = document.querySelector('#host');
      const dispose = (await loadEditor('voc'))(host, project, 'a.voc');
      const bytes = () => [...files.get('a.voc')];
      const button = label => [...host.querySelectorAll('button')].find(b => b.textContent.includes(label));
      try {
        button('Reverse').click(); const edited = bytes();
        button('Undo').click(); const undo = bytes();
        button('Redo').click(); const redo = bytes();
        button('Revert').click(); const reverted = bytes();
        button('Undo').click(); const undoRevert = bytes();
        button('Fade in').click();
        return { original: [...original], edited, undo, redo, reverted, undoRevert, redoDisabled: button('Redo').disabled };
      } finally { dispose?.(); }
    })()`);
    expect(result.edited).not.toEqual(result.original);
    expect(result.undo).toEqual(result.original);
    expect(result.redo).toEqual(result.edited);
    expect(result.reverted).toEqual(result.original);
    expect(result.undoRevert).toEqual(result.edited);
    expect(result.redoDisabled).toBe(true);
  } finally {
    await fixture.close();
  }
}, 30_000);

it('undoes a maker replacement together with its original encoded bytes and synthesis settings', async () => {
  const fixture = await editorBrowser();
  try {
    const result = await fixture.page.evaluate<{ before: unknown; made: unknown; undo: unknown; redo: unknown }>(`(async () => {
      const { Project } = await import('/src/editor/core/project.ts');
      const { GameFiles } = await import('/src/project/files.ts');
      const { newGame, serializeGame } = await import('/packages/engine/src/formats/game.ts');
      const { encodeVoc } = await import('/packages/engine/src/formats/voc.ts');
      const { loadEditor } = await import('/src/editor/editors/registry.ts');
      const files = new GameFiles();
      files.set('a.gam', serializeGame(newGame('Maker regression')));
      files.set('a.voc', encodeVoc(new Float32Array([-.8, -.2, .3, .9])));
      const project = new Project('sample-maker-test', 'Maker regression', 'a.gam', files);
      project.setExtras('a.voc', 'sfx', {});
      const host = document.querySelector('#host');
      const dispose = (await loadEditor('voc'))(host, project, 'a.voc');
      const state = () => ({ bytes: [...files.get('a.voc')], sfx: project.extras('a.voc', 'sfx', null) });
      const button = label => [...host.querySelectorAll('button')].find(b => b.textContent.includes(label));
      try {
        const before = state();
        const ready = new Promise(resolve => {
          const observer = new MutationObserver(() => {
            if (document.querySelector('dialog .sfxm')) { observer.disconnect(); resolve(); }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });
        button('Sound effect maker').click();
        await ready;
        [...document.querySelectorAll('dialog button')].find(b => b.textContent === 'Save .VOC').click();
        await new Promise(resolve => setTimeout(resolve, 0));
        const made = state();
        button('Undo').click(); const undo = state();
        button('Redo').click(); const redo = state();
        return { before, made, undo, redo };
      } finally { dispose?.(); }
    })()`);
    expect(result.made).not.toEqual(result.before);
    expect(result.undo).toEqual(result.before);
    expect(result.redo).toEqual(result.made);
  } finally {
    await fixture.close();
  }
}, 30_000);
