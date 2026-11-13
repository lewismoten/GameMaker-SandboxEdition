// Where PLAYGAME's screen really is while a bot plays: the view's top-left corner on the map at every game tick,
// read from the engine's own scroll state (never worked out again here). The screen has no fixed place around the
// hero: ChangeScroll leaves it alone until his center is 60 pixels off the screen's, then runs on until he is 33
// pixels past center the other way, so where it rests depends on how he got there. A picture of "what the player
// sees" with the hero at some spot asks this log, recorded on the bot's own way through the game.
import { BLEN, MLEN, MWID, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { GameSim } from './gameSim';

/** The map pixel at the screen's top-left corner now: block (mx, my), the pixels into it (nx, ny) and the 0..3 pixel pan. */
export function screenOrigin(w: World): { x: number; y: number } {
  const sc = w.scroll;
  return { x: w.mx * BLEN + sc.nx + sc.littleShiftx, y: w.my * BLEN + sc.ny + sc.littleShifty };
}

/** One game tick: the hero's own block (his feet, for a two-block hero) and the screen's corner, in map pixels. */
export interface CameraSample {
  scene: number;
  tick: number;
  heroX: number;
  heroY: number;
  /** The screen's corner. The map wraps, so this is the copy of it nearest the hero (it can be negative). */
  x: number;
  y: number;
  /** Neither the hero nor the screen moved since the tick before. */
  still: boolean;
}

/** The screen found for a hero position: its top row and left column on the map (with a fraction while it rests mid-block). */
export interface CameraView {
  top: number;
  left: number;
  sample: CameraSample;
}

/** `v` moved by whole map sizes to within half a map of `near`. */
const unwrap = (v: number, near: number, size: number) => v - Math.round((v - near) / size) * size;

export class CameraLog {
  readonly samples: CameraSample[] = [];
  /** The scenes the log saw, in the order play first entered them: `scenes[0]` is the first level. */
  readonly scenes: number[] = [];

  /** Notes where the screen is now (call it once per game tick). */
  add(scene: number, tick: number, w: World, hero: { x: number; y: number; sx: number; sy: number }): void {
    const o = screenOrigin(w);
    const heroX = hero.x * BLEN + hero.sx;
    const heroY = hero.y * BLEN + hero.sy;
    const x = unwrap(o.x, heroX, MLEN * BLEN);
    const y = unwrap(o.y, heroY, MWID * BLEN);
    const last = this.samples[this.samples.length - 1];
    const still = last?.scene === scene && last.heroX === heroX && last.heroY === heroY && last.x === x && last.y === y;
    if (!this.scenes.includes(scene)) this.scenes.push(scene);
    this.samples.push({ scene, tick, heroX, heroY, x, y, still });
  }

  /**
   * The screen when the hero's block was at map block (`col`, `row`) of the `level`-th scene played (0 is the first): the tick he
   * was nearest, height first, a tick he stood still before one he passed through, the latest of equals. It throws when he never
   * came within a block of that height (or eight blocks of that column), because then nobody knows what the screen showed.
   */
  at(level: number, col: number, row: number): CameraView {
    const scene = this.scenes[level];
    let best: CameraSample | undefined;
    let cost = Infinity;
    for (const s of this.samples) {
      if (s.scene !== scene) continue;
      const c = Math.abs(s.heroY - row * BLEN) * 1000 + Math.abs(s.heroX - col * BLEN) * 2 + (s.still ? 0 : 1);
      if (c <= cost) [best, cost] = [s, c];
    }
    if (!best || Math.abs(best.heroY - row * BLEN) >= BLEN || Math.abs(best.heroX - col * BLEN) > 8 * BLEN)
      throw new Error(
        `The bot's hero was never near block (${col}, ${row}) of level ${level + 1}` +
          (best ? `; the nearest was (${best.heroX / BLEN}, ${best.heroY / BLEN})` : '') +
          ': frame that picture by hand',
      );
    return { top: best.y / BLEN, left: best.x / BLEN, sample: best };
  }

  /**
   * The top map row of the screen with the hero drawn as `hero` (renderRegion's sprites; the lowest one in the first one's column
   * is his own block). A row with a fraction is real: renderRegion takes it.
   */
  top(level: number, hero: { x: number; y: number }[]): number {
    const col = hero[0].x;
    return this.at(level, col, Math.max(...hero.filter((s) => s.x === col).map((s) => s.y))).top;
  }
}

/**
 * Runs `play` (a game's bot, tools/play.ts) and logs the screen after every tick of every sim of class `Sim` it makes
 * (the game's tools/sim.ts class; only that class is watched, and only while `play` runs).
 */
export async function recordCamera(Sim: { prototype: GameSim }, play: () => Promise<unknown>): Promise<CameraLog> {
  const log = new CameraLog();
  const proto = Sim.prototype;
  const own = Object.prototype.hasOwnProperty.call(proto, 'tick');
  const tick = proto.tick;
  proto.tick = async function (this: GameSim) {
    const scene = this.scene;
    const out = await tick.call(this);
    // a tick that left the scene has no screen of its own
    if (!out) log.add(scene, this.ticks, this.w, this.pos);
    return out;
  };
  try {
    await play();
  } finally {
    if (own) proto.tick = tick;
    else delete (proto as { tick?: unknown }).tick;
  }
  return log;
}
