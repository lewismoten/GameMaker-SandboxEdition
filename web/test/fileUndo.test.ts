// fileHistory: Undo and Redo for editors that rewrite whole files.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../src/project/files';
import { fileHistory } from '../src/editor/core/fileUndo';

const b = (...v: number[]) => new Uint8Array(v);

describe('fileHistory', () => {
  it('undoes and redoes changes to several files', () => {
    const files = new GameFiles([
      ['a.gif', b(1)],
      ['s.bbl', b(2)],
    ]);
    let restored = 0;
    const steps = fileHistory(files, () => restored++, { merge: -1 });
    steps.before('a.gif', 's.bbl');
    files.set('a.gif', b(10));
    files.set('s.bbl', b(20));
    expect(steps.canUndo).toBe(true);
    expect(steps.undo()).toBe(true);
    expect([...files.get('a.gif')!, ...files.get('s.bbl')!]).toEqual([1, 2]);
    expect(steps.canRedo).toBe(true);
    expect(steps.redo()).toBe(true);
    expect([...files.get('a.gif')!, ...files.get('s.bbl')!]).toEqual([10, 20]);
    expect(restored).toBe(2);
    expect(steps.redo()).toBe(false);
  });

  it('takes back a file that did not exist by deleting it', () => {
    const files = new GameFiles();
    const steps = fileHistory(files, () => undefined, { merge: -1 });
    steps.before('new.bkd');
    files.set('new.bkd', b(5));
    steps.undo();
    expect(files.has('new.bkd')).toBe(false);
    steps.redo();
    expect([...files.get('new.bkd')!]).toEqual([5]);
  });

  it('merges quick changes into one step, and a new change clears redo', () => {
    const files = new GameFiles([['g.gam', b(0)]]);
    const steps = fileHistory(files, () => undefined, { merge: 10_000 });
    for (let i = 1; i <= 3; i++) {
      steps.before('g.gam');
      files.set('g.gam', b(i));
    }
    steps.undo();
    expect([...files.get('g.gam')!]).toEqual([0]);
    expect(steps.canUndo).toBe(false);
    steps.before('g.gam');
    files.set('g.gam', b(9));
    expect(steps.canRedo).toBe(false);
  });
});
