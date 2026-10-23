// A play-testing bot for GameSim, for Doc Leo: walks to a column (hopping over what's in the
// way), hops straight or sideways and steers while he falls, climbs ladders, pins and tickles
// a rat and waits for it to come to his hand, and waits. Moving monsters are handled by trying a
// stretch again from a snapshot after a wait (route.ts, carefully()).
import { CARPET, MON, SCAN } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

export type Dir = 'left' | 'right';
type Result = string | undefined;

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

  /** Doc Leo's position in level pixels (left/top of his bottom block). */
  get px(): { x: number; y: number } {
    const p = this.sim.pos;
    return { x: (p.x - ORIGIN) * 20 + p.sx, y: (p.y - ORIGIN) * 20 + p.sy };
  }

  /** Its block (level coordinates), rounded to the nearest. */
  get at(): { x: number; y: number } {
    const p = this.px;
    return { x: Math.round(p.x / 20), y: Math.round(p.y / 20) };
  }

  say(s: string): void {
    const p = this.px;
    this.log.push(`[${this.sim.scene}] ${s} @${(p.x / 20).toFixed(2)},${(p.y / 20).toFixed(2)} t${this.sim.ticks} hp ${this.sim.ci.hitpts}`);
  }

  async tick(): Promise<Result> {
    const hp = this.sim.ci.hitpts;
    const r = (await this.sim.tick()) ?? undefined;
    if (process.env.BOT_HURT && this.sim.ci.hitpts < hp) {
      const w = this.sim.w;
      const mons = w.mi
        .map((mi, i) => ({ mi, n: w.mm[i].monnum }))
        .filter(({ mi, n }) => n < 64 && Math.abs(mi.curx[0] - this.sim.pos.x) <= 1 && Math.abs(mi.cury[0] - this.sim.pos.y) <= 1);
      this.say(
        `  hurt ${hp - this.sim.ci.hitpts}: monsters ${mons.map((m) => m.n).join(',')} block ${this.sim.blockAt(this.sim.pos.x + 1, this.sim.pos.y)} carpet ${this.sim.meter(CARPET) - 1}`,
      );
    }
    // BOT_TRACE=1: every tick's position, the keys held and the fall speed
    if (process.env.BOT_TRACE)
      this.say(`  keys ${[72, 75, 77, 80, 16, 18, 44, 45].filter((k) => this.sim.isHeld(k)).join(',')} gy ${this.sim.ci.gravy}${r ? ' ' + r : ''}`);
    return r;
  }

  async wait(k: number): Promise<Result> {
    for (let i = 0; i < k; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /** Waits until Doc Leo stops moving up or down (standing, or on a ladder). */
  async land(max = 80): Promise<Result> {
    let last = this.px.y;
    let still = 0;
    for (let i = 0; i < max; i++) {
      const r = await this.tick();
      if (r) return r;
      const y = this.px.y;
      still = y === last ? still + 1 : 0;
      last = y;
      if (still >= 3) return undefined;
    }
    return 'never landed';
  }

  /** Walks to level column `bx` (its left edge at bx * 20 px), hopping over whatever stops it. */
  async walk(bx: number, label = '', max = 900): Promise<Result> {
    const goal = bx * 20;
    const dir: Dir = goal > this.px.x ? 'right' : 'left';
    const done = () => (dir === 'right' ? this.px.x >= goal : this.px.x <= goal);
    this.sim.press(SCAN[dir]);
    let stuck = 0;
    let lastX = this.px.x;
    for (let t = 0; t < max && !done(); t++) {
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
      stuck = this.px.x === lastX ? stuck + 1 : 0;
      lastX = this.px.x;
      if (stuck >= 3) {
        // blocked: hop while still pushing (Up wins the key stack), then let go of Up
        this.sim.press(SCAN.up);
        const r2 = await this.wait(10);
        this.sim.release(SCAN.up);
        if (r2) return (this.sim.releaseAll(), r2);
        stuck = -12;
      }
    }
    this.sim.release(SCAN[dir]);
    const r = await this.land();
    if (r) return r;
    // overshot a little: step back onto the column
    if (Math.abs(this.px.x - goal) > 3) {
      const back: Dir = this.px.x > goal ? 'left' : 'right';
      this.sim.press(SCAN[back]);
      for (let t = 0; t < 10 && Math.abs(this.px.x - goal) > 2; t++) {
        const r2 = await this.tick();
        if (r2) return (this.sim.releaseAll(), r2);
      }
      this.sim.release(SCAN[back]);
    }
    if (Math.abs(this.px.x - goal) > 6) return `walk to ${bx} ${label} stopped at ${(this.px.x / 20).toFixed(2)}`;
    if (label) this.say(`at ${label}`);
    return this.land();
  }

  /**
   * A hop: Up (or Q/E sideways) held `hold` ticks; then `steer` held while it falls, until it
   * lands or has gone `steerTo` columns (level block x).
   */
  async hop(dir: Dir | 'up', hold = 12, steer?: Dir, steerTo?: number): Promise<Result> {
    const key = dir === 'up' ? SCAN.up : dir === 'left' ? SCAN.q : SCAN.e;
    this.sim.press(key);
    let r = await this.wait(hold);
    this.sim.release(key);
    if (r) return (this.sim.releaseAll(), r);
    if (steer) {
      this.sim.press(SCAN[steer]);
      const goal = steerTo !== undefined ? steerTo * 20 : undefined;
      for (let t = 0; t < 60; t++) {
        if (goal !== undefined && (steer === 'right' ? this.px.x >= goal : this.px.x <= goal)) break;
        r = await this.tick();
        if (r) return (this.sim.releaseAll(), r);
      }
      this.sim.release(SCAN[steer]);
    }
    r = await this.land();
    this.say(`hopped ${dir}${steer ? ' then ' + steer : ''}`);
    return r;
  }

  /** Holds a key for `ticks` (Down to climb down, Up to climb up). */
  async hold(key: keyof typeof SCAN, ticks: number): Promise<Result> {
    this.sim.press(SCAN[key]);
    const r = await this.wait(ticks);
    this.sim.release(SCAN[key]);
    return r;
  }

  /** Climbs (or walks) along one axis until Doc Leo reaches level column/row `to`. */
  async dig(dir: 'left' | 'right' | 'up' | 'down', to: number, label = '', max = 400): Promise<Result> {
    const goal = to * 20;
    const check = () => (dir === 'left' ? this.px.x <= goal : dir === 'right' ? this.px.x >= goal : dir === 'up' ? this.px.y <= goal : this.px.y >= goal);
    return this.until(dir, check, label || `dug ${dir} to ${to}`, max);
  }

  /** Holds `key` until `check` says so (or `max` ticks: then it fails). */
  async until(key: keyof typeof SCAN | undefined, check: () => boolean, label: string, max = 300): Promise<Result> {
    if (key) this.sim.press(SCAN[key]);
    for (let t = 0; t < max; t++) {
      if (check()) break;
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
    }
    if (key) this.sim.release(SCAN[key]);
    if (!check()) return `never ${label}`;
    this.say(label);
    return undefined;
  }

  /** The laughing carpet so far. */
  get carpet(): number {
    return this.sim.meter(CARPET) - 1;
  }

  /** Presses a key for one tick and lets go (a sequence that can't be cut short plays out). */
  async tap(key: keyof typeof SCAN, after = 0): Promise<Result> {
    this.sim.press(SCAN[key]);
    let r = await this.tick();
    this.sim.release(SCAN[key]);
    if (r) return r;
    r = await this.wait(after);
    return r;
  }

  /**
   * Pins and tickles the rat beside Doc Leo, then waits for it to come to his hand; fails unless
   * the laughing carpet grows by one.
   */
  async tickleRat(label = 'a rat'): Promise<Result> {
    const before = this.carpet;
    let r = await this.tap('z', 12);
    if (r) return r;
    r = await this.tap('x', 4);
    if (r) return r;
    for (let t = 0; t < 40 && this.carpet === before; t++) {
      r = await this.tick();
      if (r) return r;
    }
    if (this.carpet === before) return `${label} didn't laugh`;
    this.say(`tickled ${label}: carpet ${this.carpet}`);
    return this.wait(3);
  }

  /** The wary rats (level blocks, fractional), with their monster slots. */
  rats(): { x: number; y: number; slot: number }[] {
    const wary: number[] = [MON.labRat, MON.labTense, MON.wildRat, MON.wildTense];
    const w = this.sim.w;
    return w.mi
      .map((mi, slot) => ({ x: mi.curx[0] - ORIGIN + mi.curx[1] / 20, y: mi.cury[0] - ORIGIN + mi.cury[1] / 20, slot, n: w.mm[slot].monnum }))
      .filter((m) => wary.includes(m.n))
      .map(({ x, y, slot }) => ({ x, y, slot }));
  }

  /**
   * Walks up to the nearest wary rat on Doc Leo's row in `dir` (no further than `to`), as close
   * as a pin reaches without bumping it, then pins and tickles it.
   */
  async tickleNext(dir: Dir, label: string, max = 600): Promise<Result> {
    const row = Math.round(this.px.y / 20);
    const find = () => {
      const x = this.px.x / 20;
      const mine = this.rats().filter((r) => Math.abs(r.y - row) < 0.3 && (dir === 'right' ? r.x > x - 0.5 : r.x < x + 0.5));
      mine.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
      return mine[0];
    };
    const first = find();
    if (!first) return `no rat to the ${dir} for ${label}`;
    const slot = first.slot;
    for (let t = 0; t < max; t++) {
      const rat = this.rats().find((r) => r.slot === slot);
      if (!rat) return `${label} got away`;
      const gap = Math.abs(rat.x - this.px.x / 20);
      if (gap <= 1.45) {
        this.sim.releaseAll();
        return this.tickleRat(label);
      }
      // walk toward it (it may be walking away), but never into it
      if (!this.sim.isHeld(SCAN[dir])) this.sim.press(SCAN[dir]);
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
    }
    this.sim.releaseAll();
    return `never reached ${label}`;
  }
}
