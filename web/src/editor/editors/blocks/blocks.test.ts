// BBL and MBL document behavior uses the same mounted Undo/Redo controls as painting.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../../../test/editorBrowser';

it.each(['bbl', 'mbl'])(
  '%s behavior edits undo and redo exactly without changing pixels',
  async (kind) => {
    const fixture = await editorBrowser();
    try {
      await fixture.page.clock.install();
      await fixture.page.exposeFunction('flushBlockSave', () => fixture.page.clock.fastForward(300));
      const result = await fixture.page.evaluate<{ changed: boolean; restored: boolean; reapplied: boolean; invalidated: boolean }>(`(async () => {
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
      const bytes = () => files.get(file).slice();
      const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
      const button = label => [...host.querySelectorAll('button')].find(b => b.textContent.includes(label));
      const change = value => {
        const field = [...host.querySelectorAll('input')].find(i => i.closest('label')?.textContent.includes('Score points'));
        field.value = String(value); field.dispatchEvent(new Event('change'));
      };
      const flush = window.flushBlockSave;
      try {
        const before = bytes(); change(123); await flush(); const edited = bytes();
        button('Undo').click(); await flush(); const undo = bytes();
        button('Redo').click(); await flush(); const redo = bytes();
        button('Undo').click(); change(456); await flush();
        return { changed: !same(before, edited), restored: same(before, undo), reapplied: same(edited, redo), invalidated: button('Redo').disabled };
      } finally { dispose?.(); }
    })()`);
      expect(result.changed).toBe(true);
      expect(result.restored).toBe(true);
      expect(result.reapplied).toBe(true);
      expect(result.invalidated).toBe(true);
    } finally {
      await fixture.close();
    }
  },
  30_000,
);
