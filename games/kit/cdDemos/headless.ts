// The real web engine (web/src/engine: runGame, playScene, the recorder) run in Node with
// no browser: a stand-in canvas, a virtual clock and animation frames that advance it as
// fast as the CPU allows. Recording and playback go through PLAYGAME's own Recorder, so
// a demo made here is the same .REC the browser (and DOS PLAYGAME) would make.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Machine } from '../../../web/src/engine/machine';
import { runGame } from '../../../web/src/engine/game';
import type { Session } from '../../../web/src/engine/scene';
import type { World } from '../../../web/src/engine/world';
import { AudioEngine } from '../../../web/src/audio/engine';
import { GameFiles } from '../../../web/src/project/files';
import { rng } from '../pixels';

const FRAME_MS = 1000 / 60;
let now = 0;
let frames: ((t: number) => void)[] = [];
/** Work the next frame waits for (a bot thinking between two game ticks). */
let gate: Promise<unknown> | undefined;

/** Installs the browser stand-ins once (canvas, window, animation frames, a virtual clock). */
function install(): void {
  const g = globalThis as Record<string, unknown>;
  if (g.__headless) return;
  g.__headless = true;
  Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
  g.requestAnimationFrame = (cb: (t: number) => void) => (frames.push(cb), frames.length);
  g.cancelAnimationFrame = () => undefined;
  const target = { addEventListener() {}, removeEventListener() {} };
  g.window = target;
  // a frame every FRAME_MS of virtual time, run as soon as the event loop is free
  const pump = async () => {
    if (gate) {
      const g = gate;
      gate = undefined;
      await g;
    }
    now += FRAME_MS;
    const f = frames;
    frames = [];
    for (const cb of f) cb(now);
    setImmediate(pump);
  };
  setImmediate(pump);
}

function fakeCanvas(): HTMLCanvasElement {
  const ctx = {
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
  };
  return {
    width: 320,
    height: 200,
    getContext: () => ctx,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 200 }),
  } as unknown as HTMLCanvasElement;
}

/** A CD game's files, read straight from cd/ (gameware, or shareware in cd/sharware). */
export function loadCdGame(kind: 'gameware' | 'shareware', id: string): GameFiles {
  const dir = join(import.meta.dirname, '../../../cd', kind === 'shareware' ? 'sharware' : 'gameware', id);
  return new GameFiles(readdirSync(dir).map((f) => [f, new Uint8Array(readFileSync(join(dir, f)))] as [string, Uint8Array]));
}

interface RunHooks {
  /**
   * Called once per game tick processed, after it ran, with the live world; return true to
   * stop, or a promise the game waits for before its next frame (keys fed meanwhile reach
   * the next tick).
   */
  onTick?: (w: World, s: Session, m: Machine) => boolean | void | Promise<unknown>;
  /** Called every rendered frame (after the screen was drawn). */
  onFrame?: (w: World, s: Session, m: Machine) => void;
}

interface RunResult {
  session: Session;
  machine: Machine;
  /** The recording made (record mode). */
  rec?: Uint8Array;
}

/**
 * Plays the game from its start link with the real engine: recording the keys the hooks
 * feed (`record`), or playing back a .REC (`playback`). Monsters' randomness comes from
 * a seeded generator in place of Math.random. Stops when a hook says so, or after
 * `maxTicks` game ticks, or when play ends.
 */
export async function runHeadless(
  files: GameFiles,
  gam: string,
  o: { record?: boolean; playback?: Uint8Array; seed?: number; maxTicks?: number } & RunHooks,
): Promise<RunResult> {
  install();
  const random = rng(o.seed ?? 1);
  const realRandom = Math.random;
  Math.random = random;
  const audio = new AudioEngine();
  audio.musicEnabled = false;
  audio.soundEnabled = false;
  const m = new Machine(fakeCanvas(), files, audio);
  let session: Session | undefined;
  let lastClock = -1;
  let ticks = 0;
  let stop = false;
  const finished = runGame(m, gam, {
    record: o.record,
    playback: o.playback,
    onSession: (s) => (session = s),
    onFrame: (w) => {
      if (stop || !session) return;
      if (w.clock !== lastClock) {
        lastClock = w.clock;
        ticks++;
        const r = o.onTick?.(w, session, m);
        if (r instanceof Promise) gate = r;
        if (r === true || ticks >= (o.maxTicks ?? Infinity)) stop = true;
      }
      o.onFrame?.(w, session, m);
      if (stop) m.destroy();
    },
  }).catch((e: Error) => {
    if (e.name !== 'Error' || e.message !== 'Game aborted') throw e;
  });
  await finished;
  Math.random = realRandom;
  if (!m.aborted) m.destroy();
  return { session: session!, machine: m, rec: o.record ? session?.rec.save() : undefined };
}
