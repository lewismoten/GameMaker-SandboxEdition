// A play-testing bot for GameSim, for a fly: flies straight at a point (the diagonals first, then
// straight), barrel rolls, buzzes, and waits. Moving and swinging things are handled by trying a
// stretch again from a snapshot after a wait (route.ts, carefully()).
import { SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

type Result = string | undefined;
type Key = keyof typeof SCAN;

export class Bot {
  log: string[] = [];
  constructor(readonly sim: GameSim) {}

  snapshot() {
    return { sim: this.sim.snapshot(), log: this.log.length };
  }

  restore(s: ReturnType<Bot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.log.length = s.log;
  }

  /** Carl's position in level pixels (the left/top of his block). */
  get px(): { x: number; y: number } {
    const p = this.sim.pos;
    return { x: (p.x - ORIGIN) * 20 + p.sx, y: (p.y - ORIGIN) * 20 + p.sy };
  }

  say(s: string): void {
    const p = this.px;
    this.log.push(`[${this.sim.scene}] ${s} @${(p.x / 20).toFixed(2)},${(p.y / 20).toFixed(2)} t${this.sim.ticks} hp ${this.sim.ci.hitpts}`);
  }

  async tick(): Promise<Result> {
    const hp = this.sim.ci.hitpts;
    const r = (await this.sim.tick()) ?? undefined;
    if (process.env.BOT_HURT && this.sim.ci.hitpts < hp) this.say(`  hurt ${hp - this.sim.ci.hitpts}`);
    if (process.env.BOT_TRACE) this.say(`  keys ${Object.entries(SCAN).filter(([, k]) => this.sim.isHeld(k)).map(([n]) => n).join(',')}${r ? ' ' + r : ''}`);
    return r;
  }

  async wait(k: number): Promise<Result> {
    for (let i = 0; i < k; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /**
   * Flies to level block (bx, by) (its top-left), diagonally while both axes are far off, then
   * straight. Fails if Carl is stuck. `exit` lets a scene change count as arriving.
   */
  async fly(bx: number, by: number, label = '', max = 600): Promise<Result> {
    const gx = bx * 20;
    const gy = by * 20;
    let held: Key | undefined;
    let still = 0;
    let last = this.px;
    const done = () => Math.abs(this.px.x - gx) <= 3 && Math.abs(this.px.y - gy) <= 3;
    for (let t = 0; t < max && !done(); t++) {
      const dx = gx - this.px.x;
      const dy = gy - this.px.y;
      const h = Math.abs(dx) > 3 ? Math.sign(dx) : 0;
      const v = Math.abs(dy) > 3 ? Math.sign(dy) : 0;
      const diag = Math.abs(dx) >= 4 && Math.abs(dy) >= 4;
      const key: Key = diag ? (v < 0 ? (h < 0 ? 'q' : 'e') : h < 0 ? 'z' : 'c') : h > 0 ? 'right' : h < 0 ? 'left' : v < 0 ? 'up' : 'down';
      if (key !== held) {
        if (held) this.sim.release(SCAN[held]);
        this.sim.press(SCAN[key]);
        held = key;
      }
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
      const p = this.px;
      still = p.x === last.x && p.y === last.y ? still + 1 : 0;
      last = p;
      if (still >= 8) {
        this.sim.releaseAll();
        return `fly to ${bx},${by} ${label} stuck at ${(p.x / 20).toFixed(2)},${(p.y / 20).toFixed(2)}`;
      }
    }
    this.sim.releaseAll();
    if (!done()) return `fly to ${bx},${by} ${label} never got there (${(this.px.x / 20).toFixed(2)},${(this.px.y / 20).toFixed(2)})`;
    // let go and settle (the last frame of a sequence may still move him)
    const r = await this.wait(2);
    if (label) this.say(`at ${label}`);
    return r;
  }

  /** Flies through a list of points. */
  async path(points: [number, number][], label = ''): Promise<Result> {
    for (const [x, y] of points) {
      const r = await this.fly(x, y, label);
      if (r) return r;
    }
    return undefined;
  }

  /** Taps a key (a barrel roll, a buzz) and waits `after` ticks. */
  async tap(key: Key, after = 8): Promise<Result> {
    this.sim.press(SCAN[key]);
    const r = await this.wait(2);
    this.sim.release(SCAN[key]);
    if (r) return r;
    return this.wait(after);
  }

  /** Holds a key for `ticks`. */
  async hold(key: Key, ticks: number): Promise<Result> {
    this.sim.press(SCAN[key]);
    const r = await this.wait(ticks);
    this.sim.release(SCAN[key]);
    return r;
  }
}
