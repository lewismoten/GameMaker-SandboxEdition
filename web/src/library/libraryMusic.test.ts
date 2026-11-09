// The Library's background song stays quiet while the guided tour plays its own (tour/, 'gm-tour').
// (There is no DOM here: a bare window, document and room stand in.)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({
  pauses: [] as boolean[],
  playing: false,
  sound: 'blaster',
  started: (): void => undefined,
  dispose: vi.fn(),
}));

vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/engine', () => ({
  AudioEngine: class {
    setLevel() {}
    resume() {
      return Promise.resolve();
    }
    playSong() {
      engine.playing = true;
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
vi.mock('../media/demoAudio', () => ({ demoAudio: () => engine.sound }));

import { startLibraryMusic } from './libraryMusic';
import { beginPage } from '../pageLife';
import { whileWatching } from './libraryMedia';

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
  vi.stubGlobal('dispatchEvent', win.dispatchEvent.bind(win));
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
  engine.playing = false;
  engine.sound = 'blaster';
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

  it('pauses while a video or walkthrough dialog is open and resumes when it closes', async () => {
    const room = { isConnected: true } as HTMLElement;
    startLibraryMusic(room);
    win.dispatchEvent(new Event('keydown'));
    await started;

    let close = () => {};
    const closed = whileWatching(new Promise<void>((r) => (close = r)));
    expect(engine.pauses).toEqual([true]);
    // a second player (the TV opens the same ones) keeps it paused until both are closed
    let close2 = () => {};
    const closed2 = whileWatching(new Promise<void>((r) => (close2 = r)));
    close();
    await closed;
    expect(engine.pauses.at(-1)).toBe(true);
    close2();
    await closed2;
    expect(engine.pauses.at(-1)).toBe(false);
  });

  it('does not start music for someone who turned it off', async () => {
    engine.sound = 'none';
    const room = { isConnected: true } as HTMLElement;
    startLibraryMusic(room);
    win.dispatchEvent(new Event('keydown'));
    let close = () => {};
    const closed = whileWatching(new Promise<void>((r) => (close = r)));
    close();
    await closed;
    await new Promise((r) => setTimeout(r, 20));
    expect(engine.playing).toBe(false);
  });
});
