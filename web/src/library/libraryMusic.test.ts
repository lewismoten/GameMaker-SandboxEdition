// The Library's background song stays quiet while the guided tour plays its own (tour/, 'gm-tour').
// (There is no DOM here: a bare window, document and room stand in.)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({ pauses: [] as boolean[], started: (): void => undefined, dispose: vi.fn() }));

vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/engine', () => ({
  AudioEngine: class {
    setLevel() {}
    resume() {
      return Promise.resolve();
    }
    playSong() {
      engine.started();
      return Promise.resolve();
    }
    pauseMusic(p: boolean) {
      engine.pauses.push(p);
    }
    dispose() {
      engine.dispose();
    }
  },
}));
vi.mock('../project/files', () => ({
  loadCatalog: () => Promise.resolve([{ id: 'brief' }]),
  peekGameFile: () => Promise.resolve(new Uint8Array(1)),
}));
vi.mock('../media/demoAudio', () => ({ demoAudio: () => 'blaster' }));

import { startLibraryMusic } from './libraryMusic';
import { beginPage } from '../pageLife';

let started: Promise<void>;

const win = new EventTarget();
const classes = new Set<string>();
const doc = Object.assign(new EventTarget(), {
  hidden: false,
  documentElement: { classList: { contains: (c: string) => classes.has(c) } },
});

beforeEach(() => {
  started = new Promise<void>((resolve) => (engine.started = resolve));
  vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
  vi.stubGlobal('removeEventListener', win.removeEventListener.bind(win));
  vi.stubGlobal('document', doc);
});

afterEach(() => {
  beginPage(); // release listeners even when an assertion fails
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  classes.clear();
  engine.pauses = [];
  engine.dispose.mockClear();
});

describe('library music and the tour', () => {
  it('pauses when the tour starts and resumes when it ends', async () => {
    const room = { isConnected: true } as HTMLElement;
    startLibraryMusic(room);
    win.dispatchEvent(new Event('keydown'));
    // Await playback itself, not a short deadline for the lazy engine import.
    await started;
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
    expect(engine.dispose).toHaveBeenCalled();
    win.dispatchEvent(new CustomEvent('gm-tour', { detail: 'start' }));
    expect(engine.pauses).toEqual([true, false]);
  });
});
