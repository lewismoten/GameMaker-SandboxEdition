import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameFiles } from '../../../project/files';
import { fileHistory } from '../../core/fileUndo';
import { editKind, textGrouping, TEXT_MERGE_MS } from './textUndo';

const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));
const text = (f: GameFiles) => String.fromCharCode(...f.get('A.TXT')!);

describe('text screen undo', () => {
  let files: GameFiles;
  let restores: number;
  let u: ReturnType<typeof textGrouping> & ReturnType<typeof fileHistory>;
  const type = (s: string, kind: Parameters<typeof u.edit>[0] = 'type') => {
    u.edit(kind);
    files.set('A.TXT', bytes(s));
  };
  beforeEach(() => {
    vi.useFakeTimers();
    files = new GameFiles();
    files.set('A.TXT', bytes(''));
    restores = 0;
    const hist = fileHistory(files, () => restores++, { merge: TEXT_MERGE_MS });
    const g = textGrouping(hist, 'A.TXT');
    u = {
      ...g,
      undo: () => hist.undo(),
      redo: () => hist.redo(),
      get canUndo() {
        return hist.canUndo;
      },
      get canRedo() {
        return hist.canRedo;
      },
    } as typeof u;
  });
  afterEach(() => vi.useRealTimers());

  it('a burst of typing is one step', () => {
    for (const s of ['h', 'he', 'hel', 'hell', 'hello']) {
      type(s);
      vi.advanceTimersByTime(100);
    }
    u.undo();
    expect(text(files)).toBe('');
    expect(u.canUndo).toBe(false);
    u.redo();
    expect(text(files)).toBe('hello');
    expect(restores).toBe(2);
  });

  it('a pause starts a new step', () => {
    type('a');
    vi.advanceTimersByTime(1500);
    type('ab');
    u.undo();
    expect(text(files)).toBe('a');
    u.undo();
    expect(text(files)).toBe('');
  });

  it('deleting, pasting and typing are separate steps', () => {
    type('abc');
    type('ab', 'delete');
    type('abXYZ', 'other');
    type('abXYZ!');
    u.undo();
    expect(text(files)).toBe('abXYZ');
    u.undo();
    expect(text(files)).toBe('ab');
    u.undo();
    expect(text(files)).toBe('abc');
    u.undo();
    expect(text(files)).toBe('');
  });

  it('two pastes in a row are two steps', () => {
    type('a', 'other');
    type('ab', 'other');
    u.undo();
    expect(text(files)).toBe('a');
  });

  it('a new edit after Undo drops Redo', () => {
    type('a');
    u.undo();
    type('b');
    expect(u.canRedo).toBe(false);
    expect(text(files)).toBe('b');
  });

  it('keys: Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y', () => {
    type('a');
    const key = (k: string, extra: { shiftKey?: boolean } = {}) => {
      let prevented = false;
      u.keyHandler({ key: k, ctrlKey: true, metaKey: false, altKey: false, shiftKey: false, ...extra, preventDefault: () => (prevented = true) });
      return prevented;
    };
    expect(key('z')).toBe(true);
    expect(text(files)).toBe('');
    expect(key('Z', { shiftKey: true })).toBe(true);
    expect(text(files)).toBe('a');
    key('z');
    expect(key('y')).toBe(true);
    expect(text(files)).toBe('a');
    expect(key('x')).toBe(false);
  });

  it('input types map to kinds', () => {
    expect(editKind('insertText')).toBe('type');
    expect(editKind('deleteContentBackward')).toBe('delete');
    expect(editKind('deleteByCut')).toBe('other');
    expect(editKind('insertFromPaste')).toBe('other');
    expect(editKind('insertLineBreak')).toBe('other');
  });
});
