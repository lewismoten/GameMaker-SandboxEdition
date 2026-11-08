// A play-testing bot for the Starters' hero (arrows and Space only, like a person): it walks to
// a column, jumping when something blocks the way, jumps and steers in the air, climbs ladders,
// and waits for gravity. Each Starter's tools/route.ts gives it orders level by level.
import type { GameSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { ORIGIN } from './map';
import { SCAN } from './ids';
import { makeStuck } from './stuck';

export type Dir = 'left' | 'right';
/** What an order ended with: nothing (carry on), 'link' (a door took the hero on), 'end' or 'dead'. */
export type Result = string | undefined;

export class StarterBot {
  readonly log: string[] = [];

  constructor(readonly sim: GameSim) {}

  /** The hero's position in level pixels (left and top of his bottom block). */
  get px(): { x: number; y: number } {
    const p = this.sim.pos;
    return { x: (p.x - ORIGIN) * 20 + p.sx, y: (p.y - ORIGIN) * 20 + p.sy };
  }

  say(s: string): void {
    this.log.push(s);
  }

  snapshot() {
    return { sim: this.sim.snapshot(), log: this.log.length };
  }

  restore(s: ReturnType<StarterBot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.log.length = s.log;
  }

  async tick(): Promise<Result> {
    return (await this.sim.tick()) ?? undefined;
  }

  async wait(ticks: number): Promise<Result> {
    for (let i = 0; i < ticks; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /** Waits until the hero stops moving up or down (standing, or holding on to a ladder). */
  async land(max = 120): Promise<Result> {
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

  /** Walks to level column `bx` (its left edge at bx * 20 pixels), jumping when a wall stops him.
   *  `jumpWhenJittering` also jumps when a solid monster shoves him back and forth with no net progress (6 ticks). */
  async walk(bx: number, label = '', max = 900, opts: { jumpWhenJittering?: boolean } = {}): Promise<Result> {
    const goal = bx * 20;
    const dir: Dir = goal > this.px.x ? 'right' : 'left';
    const done = () => (dir === 'right' ? this.px.x >= goal : this.px.x <= goal);
    this.sim.press(SCAN[dir]);
    const stuck = makeStuck(this.px.x, dir, opts.jumpWhenJittering);
    for (let t = 0; t < max && !done(); t++) {
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
      if (stuck.update(this.px.x)) {
        // blocked: tap Space while still holding the way, so the jump carries him over
        this.sim.press(SCAN.space);
        const r2 = await this.wait(2);
        this.sim.release(SCAN.space);
        if (r2) return (this.sim.releaseAll(), r2);
        stuck.reset(this.px.x);
      }
    }
    this.sim.release(SCAN[dir]);
    const r = await this.land();
    if (r) return r;
    if (Math.abs(this.px.x - goal) > 6) return `walk to ${bx} ${label} stopped at ${(this.px.x / 20).toFixed(2)}`;
    if (label) this.say(`at ${label}`);
    return undefined;
  }

  /** A jump straight up; then `steer` held in the air until he has gone `steerTo` columns (or lands). */
  async jump(steer?: Dir, steerTo?: number): Promise<Result> {
    this.sim.press(SCAN.space);
    let r = await this.wait(2);
    this.sim.release(SCAN.space);
    if (r) return r;
    if (steer) {
      this.sim.press(SCAN[steer]);
      const goal = steerTo === undefined ? undefined : steerTo * 20;
      for (let t = 0; t < 70; t++) {
        if (goal !== undefined && (steer === 'right' ? this.px.x >= goal : this.px.x <= goal)) break;
        r = await this.tick();
        if (r) return (this.sim.releaseAll(), r);
      }
      this.sim.release(SCAN[steer]);
    }
    r = await this.land();
    this.say(`jumped${steer ? ` ${steer}` : ''}`);
    return r;
  }

  /** Holds Up or Down until his top edge is at level row `row` (rows count down from the sky). */
  async climb(dir: 'up' | 'down', row: number, label = '', max = 400): Promise<Result> {
    const goal = row * 20;
    const done = () => (dir === 'up' ? this.px.y <= goal : this.px.y >= goal);
    this.sim.press(SCAN[dir]);
    for (let t = 0; t < max && !done(); t++) {
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
    }
    this.sim.release(SCAN[dir]);
    if (!done()) return `never climbed ${dir} to row ${row} ${label}`;
    if (label) this.say(label);
    return this.land();
  }
}
