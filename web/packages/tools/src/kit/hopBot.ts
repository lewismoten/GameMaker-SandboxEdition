// A play-testing bot for GameSim, for a hero who hops: walks to a column (hopping over what's
// in the way), hops straight or sideways and steers while it falls, climbs, and waits. Moving
// monsters are handled by trying a stretch again from a snapshot after a wait (each game's
// tools/route.ts, carefully()). The hopping games' tools/bot.ts extend it with their keys,
// their map origin and the meter BOT_HURT reports.
import type { GameSim } from './gameSim';

export type Dir = 'left' | 'right';
export type Result = string | undefined;

/** The keys every hopping game has: arrows, and Q/E to hop sideways. */
interface HopKeys {
  up: number;
  down: number;
  left: number;
  right: number;
  q: number;
  e: number;
}

interface HopSetup<K extends HopKeys> {
  /** The game's key scan codes (src/ids.ts SCAN). */
  scan: K;
  /** The level map's origin in scene blocks (src/levels/maps.ts ORIGIN). */
  origin: number;
  /** The meter BOT_HURT prints beside a hurt: its name and its number. */
  meter: { name: string; n: number };
  /** The scan codes BOT_TRACE lists when held (the arrows and Q/E unless said). */
  traced?: number[];
}

export class HopBot<S extends GameSim = GameSim, K extends HopKeys = HopKeys> {
  log: string[] = [];
  readonly scan: K;
  private readonly origin: number;
  private readonly meterShown: { name: string; n: number };
  private readonly traced: number[];

  constructor(
    readonly sim: S,
    setup: HopSetup<K>,
  ) {
    this.scan = setup.scan;
    this.origin = setup.origin;
    this.meterShown = setup.meter;
    this.traced = setup.traced ?? [72, 75, 77, 80, 16, 18];
  }

  snapshot() {
    return { sim: this.sim.snapshot(), log: this.log.length };
  }

  restore(s: ReturnType<HopBot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.log.length = s.log;
  }

  /** The hero's position in level pixels (left/top of its bottom block). */
  get px(): { x: number; y: number } {
    const p = this.sim.pos;
    return { x: (p.x - this.origin) * 20 + p.sx, y: (p.y - this.origin) * 20 + p.sy };
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
      const m = this.meterShown;
      this.say(
        `  hurt ${hp - this.sim.ci.hitpts}: monsters ${mons.map((m) => m.n).join(',')} block ${this.sim.blockAt(this.sim.pos.x + 1, this.sim.pos.y)} ${m.name} ${this.sim.meter(m.n) - 1}`,
      );
    }
    // BOT_TRACE=1: every tick's position, the keys held and the fall speed
    if (process.env.BOT_TRACE) this.say(`  keys ${this.traced.filter((k) => this.sim.isHeld(k)).join(',')} gy ${this.sim.ci.gravy}${r ? ' ' + r : ''}`);
    return r;
  }

  async wait(k: number): Promise<Result> {
    for (let i = 0; i < k; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /** Waits until the hero stops moving up or down (standing, or holding on to something). */
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

  /** Before each step of a walk: a game's chance to stop for something (keys still held). */
  protected async beforeStep(_dir: Dir): Promise<Result> {
    return undefined;
  }

  /** Before a hop (and before a walk hops what blocks it, `dir` still held): a game's chance to wait. */
  protected async beforeHop(_dir?: Dir): Promise<Result> {
    return undefined;
  }

  /** Walks to level column `bx` (its left edge at bx * 20 px), hopping over whatever stops it. */
  async walk(bx: number, label = '', max = 900): Promise<Result> {
    const SCAN = this.scan;
    const goal = bx * 20;
    const dir: Dir = goal > this.px.x ? 'right' : 'left';
    const done = () => (dir === 'right' ? this.px.x >= goal : this.px.x <= goal);
    this.sim.press(SCAN[dir]);
    let stuck = 0;
    let lastX = this.px.x;
    for (let t = 0; t < max && !done(); t++) {
      const rs = await this.beforeStep(dir);
      if (rs) return (this.sim.releaseAll(), rs);
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
      stuck = this.px.x === lastX ? stuck + 1 : 0;
      lastX = this.px.x;
      if (stuck >= 3) {
        // blocked: hop while still pushing (Up wins the key stack), then let go of Up
        const rh = await this.beforeHop(dir);
        if (rh) return (this.sim.releaseAll(), rh);
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
    const SCAN = this.scan;
    const key = dir === 'up' ? SCAN.up : dir === 'left' ? SCAN.q : SCAN.e;
    const rh = await this.beforeHop();
    if (rh) return rh;
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

  /** Holds a key for `ticks` (Down to climb down, Up to climb up, Space for the game's action). */
  async hold(key: keyof K, ticks: number): Promise<Result> {
    const code = this.scan[key] as number;
    this.sim.press(code);
    const r = await this.wait(ticks);
    this.sim.release(code);
    return r;
  }

  /** Climbs (or walks) along one axis until the hero reaches level column/row `to`. */
  async dig(dir: 'left' | 'right' | 'up' | 'down', to: number, label = '', max = 400): Promise<Result> {
    const goal = to * 20;
    const check = () => (dir === 'left' ? this.px.x <= goal : dir === 'right' ? this.px.x >= goal : dir === 'up' ? this.px.y <= goal : this.px.y >= goal);
    return this.until(dir, check, label || `dug ${dir} to ${to}`, max);
  }

  /** Holds `key` until `check` says so (or `max` ticks: then it fails). */
  async until(key: keyof K | undefined, check: () => boolean, label: string, max = 300): Promise<Result> {
    const code = key === undefined ? undefined : (this.scan[key] as number);
    if (code !== undefined) this.sim.press(code);
    for (let t = 0; t < max; t++) {
      if (check()) break;
      const r = await this.tick();
      if (r) return (this.sim.releaseAll(), r);
    }
    if (code !== undefined) this.sim.release(code);
    if (!check()) return `never ${label}`;
    this.say(label);
    return undefined;
  }
}
