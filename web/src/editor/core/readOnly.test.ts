// A game opened to look inside: every way to change the project is refused before anything
// changes, the guard hears of each attempt, and nothing reaches this browser's storage.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../project/storage', () => ({
  saveProject: vi.fn(() => Promise.resolve()),
  newId: () => 'new-id',
  // the achievements' record (an edited file unlocks one)
  loadSaveData: () => Promise.resolve({}),
  writeSaveFile: () => Promise.resolve(),
}));

import { saveProject } from '../../project/storage';
import { GameFiles } from '../../project/files';
import { newGame, serializeGame } from '../../formats/game';
import { Project } from './project';
import { MEMORY_SECTIONS, ReadOnlyError, makeReadOnly, restoreFiles } from './readOnly';

function looked(): { p: Project; attempts: string[]; original: GameFiles } {
  const original = new GameFiles([
    ['game.gam', serializeGame(newGame('Look'))],
    ['level.map', Uint8Array.of(1, 2, 3)],
  ]);
  const p = Project.fromFiles(new GameFiles(original.entries().map(([n, b]) => [n, b.slice()])), 'Look', 'look:test');
  const attempts: string[] = [];
  makeReadOnly(p, { title: 'Look', attempted: (what) => attempts.push(what) });
  return { p, attempts, original };
}

describe('A read-only project', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(saveProject).mockClear();
  });
  afterEach(async () => {
    await vi.runAllTimersAsync(); // any autosave would have run by now
    expect(saveProject).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('refuses setting a file, before it changes', () => {
    const { p, attempts } = looked();
    expect(() => p.files.set('level.map', Uint8Array.of(9))).toThrow(ReadOnlyError);
    expect([...p.files.get('level.map')!]).toEqual([1, 2, 3]);
    expect(() => p.files.set('new.map', Uint8Array.of(9))).toThrow(ReadOnlyError);
    expect(p.files.has('new.map')).toBe(false);
    expect(attempts).toEqual(['level.map', 'new.map']);
  });

  it('refuses deleting a file', () => {
    const { p, attempts } = looked();
    expect(() => p.files.delete('level.map')).toThrow(ReadOnlyError);
    expect(p.files.has('level.map')).toBe(true);
    expect(attempts).toEqual(['level.map']);
  });

  it('refuses saving the game, and still reads it as released', () => {
    const { p, attempts } = looked();
    const game = p.game();
    game.scenes[0].desc = 'Changed';
    expect(() => p.saveGame(game)).toThrow(ReadOnlyError);
    p.forgetParsed();
    expect(p.game().scenes[0].desc).toBe('Look');
    expect(attempts).toEqual(['game.gam']);
  });

  it('refuses companion changes, but keeps what the Level check finds in memory', () => {
    const { p, attempts } = looked();
    expect(() => p.setExtras('level.map', 'painter', { mirror: 'x' })).toThrow(ReadOnlyError);
    expect(p.extras('level.map', 'painter', undefined)).toBeUndefined();
    expect(() => p.renameExtras('level.map', 'other.map')).toThrow(ReadOnlyError);
    expect(attempts).toEqual(['level.map: painter', 'level.map']);
    for (const s of MEMORY_SECTIONS) p.setExtras('level.map', s, { kept: s });
    expect(p.extras('level.map', 'levelCheck', undefined)).toEqual({ kept: 'levelCheck' });
    expect(attempts).toHaveLength(2);
  });

  it('never saves', async () => {
    const { p } = looked();
    await p.saveNow();
    expect(saveProject).not.toHaveBeenCalled();
  });

  it('puts back a file an editor changed in place', () => {
    const { p, original } = looked();
    p.files.get('level.map')![0] = 7; // edited in place, then its set refused
    restoreFiles(p, original);
    expect([...p.files.get('level.map')!]).toEqual([1, 2, 3]);
    // still read-only afterwards
    expect(() => p.files.set('level.map', Uint8Array.of(9))).toThrow(ReadOnlyError);
  });
});

describe('A project of yours', () => {
  it('still changes and autosaves', async () => {
    vi.useFakeTimers();
    vi.mocked(saveProject).mockClear();
    const p = Project.fromFiles(new GameFiles([['game.gam', serializeGame(newGame('Mine'))]]), 'Mine', 'mine');
    p.files.set('level.map', Uint8Array.of(1));
    p.setExtras('level.map', 'painter', { mirror: 'x' });
    await vi.runAllTimersAsync();
    expect(saveProject).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
