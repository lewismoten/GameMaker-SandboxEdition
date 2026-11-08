// BBL and MBL document behavior uses the same mounted Undo/Redo controls as painting.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../../../test/editorBrowser';

it.each(['bbl', 'mbl'])(
  '%s behavior edits undo and redo exactly without changing pixels',
  async (kind) => {
    const fixture = await editorBrowser();
    try {
      const result = await fixture.page.evaluate<{ before: number[]; edited: number[]; undo: number[]; redo: number[]; invalidated: boolean }>(`(async () => {
      const { Project } = await import('/src/editor/core/project.ts');
      const { GameFiles } = await import('/src/project/files.ts');
      const { newGame, serializeGame } = await import('/packages/engine/src/formats/game.ts');
      const { newBlockSet, serializeBlocks } = await import('/packages/engine/src/formats/blocks.ts');
      const { loadEditor } = await import('/src/editor/editors/registry.ts');
      const kind = ${JSON.stringify(kind)}, file = 'a.' + kind;
      const files = new GameFiles();
      files.set('a.gam', serializeGame(newGame('Blocks regression')));
      files.set(file, serializeBlocks(newBlockSet(kind)));
      const project = new Project('blocks-history-' + kind, 'Blocks regression', 'a.gam', files);
      const host = document.querySelector('#host');
      const dispose = (await loadEditor(kind))(host, project, file);
      const bytes = () => [...files.get(file)];
      const button = label => [...host.querySelectorAll('button')].find(b => b.textContent.includes(label));
      const change = value => {
        const field = [...host.querySelectorAll('input')].find(i => i.closest('label')?.textContent.includes('Score points'));
        field.value = String(value); field.dispatchEvent(new Event('change'));
      };
      const flush = () => new Promise(resolve => setTimeout(resolve, 300));
      try {
        const before = bytes(); change(123); await flush(); const edited = bytes();
        button('Undo').click(); await flush(); const undo = bytes();
        button('Redo').click(); await flush(); const redo = bytes();
        button('Undo').click(); change(456); await flush();
        return { before, edited, undo, redo, invalidated: button('Redo').disabled };
      } finally { dispose?.(); }
    })()`);
      expect(result.edited).not.toEqual(result.before);
      expect(result.undo).toEqual(result.before);
      expect(result.redo).toEqual(result.edited);
      expect(result.invalidated).toBe(true);
    } finally {
      await fixture.close();
    }
  },
  30_000,
);
