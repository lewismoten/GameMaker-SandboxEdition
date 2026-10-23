// A play-testing bot for GameSim: finds its way across a scene with a shortest-path search
// over the blocks Teddy can walk on, walks it one straight run at a time, pushes into
// blocks (digging dunes, building towers), picks things up and throws. On the way it picks
// up what lies in sight a few steps off its path, as a player would (never the felt egg; the
// path keeps off links it was not sent to). What it presses is recorded by the simulator, a
// key segment for every scene it enters.
import { SCRNBLEN, SCRNBWID, bgBlock } from '../../../web/src/engine/world';
import { BG } from '../src/blocks/bblocks';
import { MON } from '../src/rules';
import { GameSim } from './sim';

export const SCAN = {
  up: 0x48,
  down: 0x50,
  left: 0x4b,
  right: 0x4d,
  space: 0x39,
  b: 0x30,
  p: 0x19,
  f: 0x21,
  spin: 0x04,
} as const;

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
export const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const DIRS = Object.keys(STEP) as Dir[];

/** Monsters that hurt for as long as Teddy stands in them (strong enough not to die on touch). */
const LINGER = new Set<number>([MON.crabH, MON.crabV, MON.crabBox, MON.rope, MON.tail, MON.slobber]);

export class Bot {
  log: string[] = [];
  /** Cells to keep off where possible (extra cost per step). */
  avoid = new Map<string, number>();
  /** Cells never to step on (a link that leads somewhere the walkthrough does not go). */
  never = new Set<string>();
  verbose = false;
  constructor(readonly sim: GameSim) {}

  say(s: string): void {
    const p = this.sim.pos;
    const line = `[${this.sim.scene}] ${s} @${p.x},${p.y} t${this.sim.ticks} hp${this.sim.ci.hitpts} sand${this.sim.meter(3) - 1}`;
    this.log.push(line);
    if (this.verbose) console.log(line);
  }

  name(x: number, y: number): string {
    return BG.names[this.sim.blockAt(x, y)] ?? '?';
  }

  async wait(n: number): Promise<string | undefined> {
    for (let i = 0; i < n; i++) {
      const r = await this.sim.tick();
      if (r === 'dead') throw new Error(`Teddy died in scene ${this.sim.scene}\n${this.log.slice(-8).join('\n')}`);
      if (r) return r;
    }
    return undefined;
  }

  private linkCells(): Set<string> {
    const s = new Set<string>(this.never);
    for (const l of this.sim.game.scenes[this.sim.scene].links) if (l.toScene !== 0xffff) s.add(`${l.from.x},${l.from.y}`);
    return s;
  }

  /** Cells under solid monsters (Gwinn, her paws), and around the ones that keep hurting. */
  private monsterCells(): { solid: Set<string>; hurt: Set<string> } {
    const w = this.sim.w;
    const solid = new Set<string>();
    const hurt = new Set<string>();
    w.mm.forEach((m, i) => {
      if (m.monnum >= 64) return;
      const mi = w.mi[i];
      const pic = w.mon[m.monnum]?.pic[Math.max(0, mi.curPic)]?.[0] ?? 100;
      const cells: string[] = [];
      for (const dx of [0, mi.curx[1] > 0 ? 1 : 0]) for (const dy of [0, mi.cury[1] > 0 ? 1 : 0]) cells.push(`${mi.curx[0] + dx},${mi.cury[0] + dy}`);
      if (pic < 100 && w.mblk[pic]?.solid) cells.forEach((c) => solid.add(c));
      else if (LINGER.has(m.monnum)) cells.forEach((c) => hurt.add(c));
    });
    return { solid, hurt };
  }

  /** Shortest path (4 directions) to (tx, ty), avoiding solid blocks and links not asked for. */
  path(tx: number, ty: number, start: Pt = this.sim.pos): Pt[] | undefined {
    return this.route(tx, ty, start)?.steps;
  }

  /** path() with what it costs (steps, plus turns into hurting or carrying cells). */
  private route(tx: number, ty: number, start: Pt = this.sim.pos): { steps: Pt[]; cost: number } | undefined {
    const { x: sx, y: sy } = start;
    const links = this.linkCells();
    const mons = this.monsterCells();
    const key = (x: number, y: number) => `${x},${y}`;
    const dist = new Map<string, number>([[key(sx, sy), 0]]);
    const from = new Map<string, string>();
    const open: [number, number, number][] = [[0, sx, sy]];
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, x, y] = open.shift()!;
      if (x === tx && y === ty) break;
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const s of Object.values(STEP)) {
        const nx = x + s.x;
        const ny = y + s.y;
        if (nx < 0 || ny < 0 || nx > 99 || ny > 99) continue;
        const k = key(nx, ny);
        const target = nx === tx && ny === ty;
        if (!target && (this.sim.solidAt(nx, ny) || links.has(k) || mons.solid.has(k))) continue;
        // turning costs a little, so runs stay long and straight
        const nd = d + 1 + (this.avoid.get(k) ?? 0) + (mons.hurt.has(k) ? 6 : 0) + (this.current(nx, ny) ? 20 : 0);
        if (nd < (dist.get(k) ?? Infinity)) {
          dist.set(k, nd);
          from.set(k, key(x, y));
          open.push([nd, nx, ny]);
        }
      }
    }
    if (!dist.has(key(tx, ty))) return undefined;
    const out: Pt[] = [];
    let k = key(tx, ty);
    while (k !== key(sx, sy)) {
      const [x, y] = k.split(',').map(Number);
      out.unshift({ x, y });
      k = from.get(k)!;
    }
    return { steps: out, cost: dist.get(key(tx, ty))! };
  }

  /** Off for a stretch of the route where a detour could spoil the timing. */
  grab = true;
  /** How many steps out of the way a pickup in sight is worth. */
  detour = 8;

  /** A pickup lying on the open sand (shells, sand piles, balloons, juice...), never the felt egg. */
  private isPickup(x: number, y: number): boolean {
    const b = this.sim.blockAt(x, y);
    const k = bgBlock(this.sim.w, b);
    if (b === BG.id('egg') || k.solid || k.touchBl === b || (k.effect && k.eamt < 0)) return false;
    return k.scorePts > 0 || k.chHitPt > 0 || (k.effect > 0 && k.eamt > 0);
  }

  /**
   * On the way to (tx, ty): the pickup on screen that costs the fewest extra steps to take
   * first, if that is no more than `detour` and the way there hurts nowhere.
   */
  private pickupNear(tx: number, ty: number): Pt | undefined {
    const w = this.sim.w;
    const direct = this.route(tx, ty);
    if (!direct) return undefined;
    const p = this.sim.pos;
    let best: { pt: Pt; extra: number } | undefined;
    for (let j = 0; j <= SCRNBWID; j++)
      for (let i = 0; i <= SCRNBLEN; i++) {
        const x = (w.mx + i) % 100;
        const y = (w.my + j) % 100;
        if ((x === tx && y === ty) || (x === p.x && y === p.y) || !this.isPickup(x, y)) continue;
        if (Math.abs(x - p.x) + Math.abs(y - p.y) > direct.steps.length + this.detour) continue;
        const there = this.route(x, y);
        if (!there || there.cost > there.steps.length) continue;
        const back = this.route(tx, ty, { x, y });
        if (!back) continue;
        const extra = there.cost + back.cost - direct.cost;
        if (extra <= this.detour && (!best || extra < best.extra)) best = { pt: { x, y }, extra };
      }
    return best?.pt;
  }

  /** A block that carries Teddy along (a hose current, the tide). */
  current(x: number, y: number): boolean {
    return bgBlock(this.sim.w, this.sim.w.blkmap[this.sim.blockAt(x, y)] ?? 0).grav !== 0;
  }

  private at(x: number, y: number): boolean {
    const p = this.sim.pos;
    return p.x === x && p.y === y && p.sx === 0 && p.sy === 0;
  }

  /** Holds a direction until Teddy stands exactly on (x, y). */
  private async run(dir: Dir, x: number, y: number, maxTicks = 400): Promise<string | undefined> {
    const scan = SCAN[dir];
    this.sim.press(scan);
    let last = '';
    let stuck = 0;
    for (let t = 0; t < maxTicks; t++) {
      const r = await this.wait(1);
      if (r) return r;
      if (this.at(x, y)) break;
      const p = this.sim.pos;
      const now = `${p.x},${p.y},${p.sx},${p.sy}`;
      stuck = now === last ? stuck + 1 : 0;
      last = now;
      if (stuck > 12) {
        this.sim.release(scan);
        return 'stuck';
      }
    }
    this.sim.release(scan);
    if (!this.at(x, y)) {
      // let a step in progress finish
      const r = await this.wait(4);
      if (r) return r;
      if (!this.at(x, y)) return 'stuck';
      return undefined;
    }
    return this.wait(1);
  }

  /** Walks to (x, y). Returns 'link' or 'end' if a scene change happened on the way. */
  async goto(x: number, y: number, label = ''): Promise<string | undefined> {
    // like a player, pick up what lies in sight a few steps off the way first
    for (let n = 0; this.grab && n < 20; n++) {
      const p = this.sim.pos;
      if (p.sx || p.sy) break;
      const q = this.pickupNear(x, y);
      if (!q) break;
      this.grab = false;
      try {
        const r = await this.goto(q.x, q.y, `a ${this.name(q.x, q.y)} on the way`);
        if (r) return r;
      } finally {
        this.grab = true;
      }
    }
    for (let attempt = 0; attempt < 12; attempt++) {
      const p = this.sim.pos;
      if (p.sx || p.sy) {
        // off the grid (a current, a hurt in mid-step): wait for it to settle
        const r = await this.wait(3);
        if (r) return r;
        if (this.sim.pos.sx || this.sim.pos.sy) await this.settle();
        continue;
      }
      const steps = this.path(x, y);
      if (!steps) throw new Error(`No path to ${x},${y} ${label} from ${p.x},${p.y} in scene ${this.sim.scene}`);
      let i = 0;
      let cur = this.sim.pos;
      let blocked = false;
      while (i < steps.length) {
        const dx = Math.sign(steps[i].x - cur.x);
        const dy = Math.sign(steps[i].y - cur.y);
        let j = i;
        while (j + 1 < steps.length && steps[j + 1].x - steps[j].x === dx && steps[j + 1].y - steps[j].y === dy) j++;
        const dir: Dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
        const r = await this.run(dir, steps[j].x, steps[j].y);
        if (r === 'stuck') {
          blocked = true;
          break;
        }
        if (r) {
          this.say(`${label}: ${r}`);
          return r;
        }
        cur = this.sim.pos;
        i = j + 1;
      }
      if (!blocked) {
        if (label) this.say(`at ${label}`);
        return undefined;
      }
      this.say(`blocked on the way to ${label}; trying again`);
      const r = await this.wait(6);
      if (r) return r;
    }
    throw new Error(`Could not reach ${x},${y} ${label}\n${this.log.slice(-10).join('\n')}`);
  }

  /** Steps to the nearest whole block when knocked between two. */
  private async settle(): Promise<void> {
    const p = this.sim.pos;
    const dir: Dir | undefined = p.sx ? 'right' : p.sy ? 'down' : undefined;
    if (!dir) return;
    this.sim.press(SCAN[dir]);
    for (let t = 0; t < 8 && (this.sim.pos.sx || this.sim.pos.sy); t++) await this.wait(1);
    this.sim.release(SCAN[dir]);
    await this.wait(2);
  }

  /** Pushes into the block next to Teddy (digging, building, a door) for `ticks` ticks. */
  async push(dir: Dir, ticks = 3, after = 3): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    let r = await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    if (r) return r;
    r = await this.wait(after);
    return r;
  }

  /** Pushes into the block at (x, y) from next to it until it turns into `until` (or isn't `from` any more). */
  async dig(x: number, y: number, label: string, done: (name: string) => boolean = (n) => !this.sim.solidAt(x, y) || n.startsWith('sand')): Promise<void> {
    const p = this.sim.pos;
    const dir = DIRS.find((d) => p.x + STEP[d].x === x && p.y + STEP[d].y === y);
    if (!dir) throw new Error(`${label}: ${x},${y} is not next to Teddy at ${p.x},${p.y}`);
    for (let k = 0; k < 6 && !done(this.name(x, y)); k++) {
      const r = await this.push(dir, 2, 2);
      if (r) throw new Error(`${label}: ${r} while pushing`);
      // a push that got through walks Teddy onto the block: step back
      if (!this.at(p.x, p.y)) await this.goto(p.x, p.y);
    }
    if (!done(this.name(x, y))) throw new Error(`${label}: ${x},${y} is still ${this.name(x, y)}\n${this.log.slice(-6).join('\n')}`);
    this.say(`${label}: now ${this.name(x, y)}`);
  }

  /** Goes next to (x, y) on the given side and pushes into it. */
  async digFrom(x: number, y: number, side: Dir, label: string, done?: (name: string) => boolean): Promise<void> {
    await this.goto(x + STEP[side].x, y + STEP[side].y, label);
    await this.dig(x, y, label, done);
  }

  /** Faces a way: a tap too short to take a step leaves Teddy looking that way. */
  async face(dir: Dir): Promise<void> {
    const p = this.sim.pos;
    await this.push(dir, 1, 3);
    if (!this.at(p.x, p.y)) await this.goto(p.x, p.y);
  }

  async key(scan: number, hold = 2, after = 10): Promise<string | undefined> {
    this.sim.press(scan);
    let r = await this.wait(hold);
    this.sim.release(scan);
    if (r) return r;
    r = await this.wait(after);
    return r;
  }

  /** Live monsters of a kind, with their block positions. */
  monsters(...kinds: number[]): { x: number; y: number; i: number; sx: number; sy: number }[] {
    const w = this.sim.w;
    return w.mm.flatMap((m, i) => (kinds.includes(m.monnum) ? [{ x: w.mi[i].curx[0], y: w.mi[i].cury[0], sx: w.mi[i].curx[1], sy: w.mi[i].cury[1], i }] : []));
  }
}
