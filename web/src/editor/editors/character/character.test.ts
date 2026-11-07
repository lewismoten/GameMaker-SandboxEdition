// A view-only CBL chooser must never redirect document history to a different file.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../../../test/editorBrowser';

it('keeps distinct character block files and their mirror links intact across preview changes and undo/redo', async () => {
  const fixture = await editorBrowser();
  try {
    const result = await fixture.page.evaluate<{ original: unknown; edited: unknown; undo: unknown; redo: unknown }>(`(async () => {
      const { Project } = await import('/src/editor/core/project.ts');
      const { GameFiles } = await import('/src/project/files.ts');
      const { newGame, serializeGame } = await import('/packages/engine/src/formats/game.ts');
      const { newCharacter, serializeCharacter } = await import('/packages/engine/src/formats/character.ts');
      const { newBlockSet, serializeBlocks } = await import('/packages/engine/src/formats/blocks.ts');
      const { loadEditor } = await import('/src/editor/editors/registry.ts');
      const files = new GameFiles();
      files.set('a.gam', serializeGame(newGame('Character regression')));
      files.set('a.chr', serializeCharacter(newCharacter()));
      for (const [name, color] of [['a.cbl', 10], ['b.cbl', 20]]) {
        const blocks = newBlockSet('cbl'); blocks[0].pixels.fill(color);
        files.set(name, serializeBlocks(blocks));
      }
      const project = new Project('character-history-test', 'Character regression', 'a.gam', files);
      project.setExtras('a.cbl', 'mirrors', [{ from: 0, to: 1 }]);
      project.setExtras('b.cbl', 'mirrors', []);
      const host = document.querySelector('#host');
      const dispose = (await loadEditor('chr'))(host, project, 'a.chr');
      const state = () => ({ files: Object.fromEntries(['a.chr', 'a.cbl', 'b.cbl'].map(n => [n, [...files.get(n)]])), mirrors: ['a.chr', 'a.cbl', 'b.cbl'].map(n => project.extras(n, 'mirrors', null)) });
      const button = label => [...host.querySelectorAll('button')].find(b => b.textContent.includes(label));
      try {
        const original = state();
        const field = host.querySelector('input[type=number]');
        field.value = String(Number(field.value) + 1); field.dispatchEvent(new Event('change'));
        await new Promise(resolve => setTimeout(resolve, 300));
        const edited = state();
        host.querySelector('[title="Choose character blocks"]').click();
        document.querySelector('dialog [title="B.CBL"]').click();
        await new Promise(resolve => setTimeout(resolve, 0));
        button('Undo').click(); await new Promise(resolve => setTimeout(resolve, 300)); const undo = state();
        button('Redo').click(); await new Promise(resolve => setTimeout(resolve, 300)); const redo = state();
        return { original, edited, undo, redo };
      } finally { dispose?.(); }
    })()`);
    expect(result.edited).not.toEqual(result.original);
    expect(result.undo).toEqual(result.original);
    expect(result.redo).toEqual(result.edited);
  } finally {
    await fixture.close();
  }
}, 30_000);
