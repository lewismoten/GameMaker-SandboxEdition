// Autosave state follows document revisions, including editor-local buffers.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../project/storage', () => ({ saveProject: vi.fn(() => Promise.resolve()), newId: () => 'test' }));
vi.mock('../../achievements', () => ({ editedFile: vi.fn(), unlockAchievement: vi.fn() }));
import { saveProject } from '../../project/storage';
import { GameFiles } from '../../project/files';
import { Project } from './project';

function project() {
  return new Project('test', 'Save test', 'a.gam', new GameFiles());
}

describe('Project save state', () => {
  it('replays the actual persistence completion time rather than the subscription time', async () => {
    const p = project();
    await p.saveNow();
    const completed = Date.now();
    await vi.advanceTimersByTimeAsync(5000);
    let when: Date | undefined;
    p.onSaveState((_state, _error, savedAt) => {
      when = savedAt;
    });
    expect(when?.getTime()).toBe(completed);
  });
  it('serializes persistence requests and keeps saving until the newest request completes', async () => {
    const p = project();
    let first!: () => void;
    let second!: () => void;
    vi.mocked(saveProject)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            first = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            second = resolve;
          }),
      );
    const one = p.saveNow();
    await Promise.resolve();
    const two = p.saveNow();
    await Promise.resolve();
    expect(saveProject).toHaveBeenCalledTimes(1);
    const states: string[] = [];
    p.onSaveState((state) => states.push(state));
    first();
    await one;
    await Promise.resolve();
    expect(states).toEqual(['saving']);
    second();
    await two;
    expect(states.at(-1)).toBe('saved');
  });
  it('does not let an older completion label a newer document revision saved', async () => {
    const p = project();
    let finish!: () => void;
    vi.mocked(saveProject).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const old = p.saveNow();
    await Promise.resolve();
    p.files.set('a.txt', Uint8Array.of(66));
    const states: string[] = [];
    p.onSaveState((state) => states.push(state));
    finish();
    await old;
    expect(states).toEqual(['dirty']);
  });
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(saveProject).mockReset().mockResolvedValue();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('reports dirty immediately during debounce and replays it to late subscribers', async () => {
    const p = project();
    await p.saveNow();
    const states: string[] = [];
    p.onSaveState((state) => states.push(state));
    expect(states).toEqual(['saved']);
    p.files.set('a.txt', Uint8Array.of(65));
    expect(states.at(-1)).toBe('dirty');
    const late: string[] = [];
    p.onSaveState((state) => late.push(state));
    expect(late).toEqual(['dirty']);
    expect(saveProject).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(400);
    await p.saving;
    expect(states.at(-1)).toBe('saved');
  });
});
