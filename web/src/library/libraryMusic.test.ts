// The Library's background song stays quiet while the guided tour plays its own (tour/, 'gm-tour').
// (There is no DOM here: a bare window, document and room stand in.)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({ pauses: [] as boolean[], playing: false }));

vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/engine', () => ({
  AudioEngine: class {
    setLevel() {}
    resume() {
      return Promise.resolve();
    }
    playSong() {
      engine.playing = true;
      return Promise.resolve();
    }
    pauseMusic(p: boolean) {
      engine.pauses.push(p);
    }
    dispose() {}
  },
}));
vi.mock('../project/files', () => ({
  loadCatalog: () => Promise.resolve([{ id: 'brief' }]),
  peekGameFile: () => Promise.resolve(new Uint8Array(1)),
}));
vi.mock('../media/demoAudio', () => ({ demoAudio: () => 'blaster' }));

import { startLibraryMusic } from './libraryMusic';

const win = new EventTarget();
const classes = new Set<string>();
const doc = Object.assign(new EventTarget(), {
  hidden: false,
  documentElement: { classList: { contains: (c: string) => classes.has(c) } },
});

beforeEach(() => {
  vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
  vi.stubGlobal('removeEventListener', win.removeEventListener.bind(win));
  vi.stubGlobal('document', doc);
});

afterEach(() => {
  vi.unstubAllGlobals();
  classes.clear();
  engine.pauses = [];
  engine.playing = false;
});

describe('library music and the tour', () => {
  it('pauses when the tour starts and resumes when it ends', async () => {
    const room = { isConnected: true } as HTMLElement;
    startLibraryMusic(room);
    win.dispatchEvent(new Event('keydown'));
    await vi.waitFor(() => expect(engine.playing).toBe(true));
    expect(engine.pauses).toEqual([]);

    classes.add('tour-on');
    win.dispatchEvent(new CustomEvent('gm-tour', { detail: 'start' }));
    expect(engine.pauses).toEqual([true]);

    classes.delete('tour-on');
    win.dispatchEvent(new CustomEvent('gm-tour', { detail: 'end' }));
    expect(engine.pauses).toEqual([true, false]);

    // the room leaves: its listeners go, so the tour no longer reaches the engine
    (room as { isConnected: boolean }).isConnected = false;
    vi.useFakeTimers();
    win.dispatchEvent(new Event('hashchange'));
    vi.advanceTimersByTime(2500);
    vi.useRealTimers();
    win.dispatchEvent(new CustomEvent('gm-tour', { detail: 'start' }));
    expect(engine.pauses).toEqual([true, false]);
  });
});
