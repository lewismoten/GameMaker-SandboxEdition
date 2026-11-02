import { describe, expect, it } from 'vitest';
import { emptyCompanion, getSection, setSection, type Companion } from '../../project/companion';
import { GameFiles } from '../../project/files';
import { fileHistory } from '../core/fileUndo';
import { notesUndo } from './notesUndo';

describe('notesUndo', () => {
  it('hops files and notes together between head and a restored checkpoint', () => {
    const files = new GameFiles();
    files.set('a.bbl', new Uint8Array([1]));
    const p = { companion: undefined as Companion | undefined, saveNow: () => Promise.resolve() };
    const notes = notesUndo(p);
    const hist = fileHistory(files, (d) => notes.step(d), { merge: -1 });
    const before = (...n: string[]) => (hist.before(...n), notes.mark());
    // a pack saves a reservation, then a restore puts an older name back
    before('a.bbl');
    p.companion = emptyCompanion();
    setSection(p.companion, 'a.bbl', 'names', { 1: 'head' });
    files.set('a.bbl', new Uint8Array([2]));
    before('a.bbl');
    p.companion = emptyCompanion();
    setSection(p.companion, 'a.bbl', 'names', { 1: 'old' });
    files.set('a.bbl', new Uint8Array([9]));
    const name = () => getSection<Record<number, string>>(p.companion!, 'a.bbl', 'names', {})[1];
    expect(name()).toBe('old');
    hist.undo();
    expect([...files.get('a.bbl')!], name()).toEqual([2]);
    expect(name()).toBe('head');
    hist.redo();
    expect([...files.get('a.bbl')!]).toEqual([9]);
    expect(name()).toBe('old');
    hist.undo();
    hist.undo();
    expect([...files.get('a.bbl')!]).toEqual([1]);
    expect(getSection(p.companion, 'a.bbl', 'names', undefined)).toBeUndefined();
  });
});
