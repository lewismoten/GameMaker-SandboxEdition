// A path-finding bot for play-testing the levels in the simulator: it walks to targets
// along breadth-first paths, opens doors when it has the counters for them, zaps robots
// in its way, and reports what it could not reach.
import { MLEN } from '../../../web/src/formats/map';
import { INF_REPEAT } from '../../../web/src/formats/character';
import type { Sim } from './sim';
import { MON, SEQ } from '../src/ids';

/** Traffic and other unzappable movers that hurt on a bump: the bot looks both ways for these. */
const TRAFFIC = new Set<number>([
  MON.carR,
  MON.carL,
  MON.fastR,
  MON.fastL,
  MON.truckR,
  MON.truckL,
  MON.citicar,
  MON.skater,
  MON.skaterV,
  MON.dino,
  MON.dinoV,
  MON.buggy,
  MON.buggyV,
]);

export const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, space: 0x39, esc: 0x01 };
const DIRS: [number, number, number][] = [
  [1, 0, SCAN.right],
  [-1, 0, SCAN.left],
  [0, 1, SCAN.down],
  [0, -1, SCAN.up],
];

export interface BotOptions {
  /** Keep hit points topped up (checks reachability, not difficulty). */
  god?: boolean;
  /** The moon suit: steer with a tolerance instead of stepping block by block. */
  moon?: boolean;
  /** Fire at robots lined up with Dex. */
  zapAt?: (monnum: number) => boolean;
  maxTicks?: number;
  /** Block numbers never to walk through on the way somewhere else (booth doors). */
  avoid?: Set<number>;
}

export class Bot {
  log: string[] = [];
  constructor(
    readonly sim: Sim,
    readonly o: BotOptions = {},
  ) {}

  get w() {
    return this.sim.w;
  }

  blockAt(x: number, y: number) {
    const w = this.w;
    const n = w.map[y * MLEN + x];
    return w.bg[w.blkmap[n] ?? n] ?? w.bg[150];
  }

  /** Can Dex go into this cell (now, with what he carries)? */
  passable(x: number, y: number, goal = false, dx = 0, dy = 0): boolean {
    const b = this.blockAt(x, y);
    if (b.grav && !goal && !((dx > 0 && b.grav & 2) || (dx < 0 && b.grav & 8) || (dy > 0 && b.grav & 4) || (dy < 0 && b.grav & 1))) return false;
    if (!goal && this.o.avoid?.has(this.w.map[y * MLEN + x])) return false;
    // Always-hurting ground (tar pits): go around.
    if (!goal && b.chHitPt < 0 && (this.w.bg[b.nextBl]?.chHitPt ?? 0) < 0) return false;
    if (!b.solid) return true;
    if (b.effect && b.eamt < 0 && !this.w.bg[b.touchBl]?.solid) {
      const m = this.w.ci.meter[b.effect];
      return m !== INF_REPEAT && m + b.eamt > 0;
    }
    return false;
  }

  /** Breadth-first path from Dex's cell to any goal cell; returns cells (excluding the start). */
  path(goals: Set<number>): [number, number][] | null {
    const { bx, by } = this.cell();
    const start = by * MLEN + bx;
    const prev = new Map<number, number>([[start, -1]]);
    const q = [start];
    while (q.length) {
      const c = q.shift()!;
      if (goals.has(c) && c !== start) {
        const out: [number, number][] = [];
        for (let k = c; k !== start; k = prev.get(k)!) out.unshift([k % MLEN, Math.floor(k / MLEN)]);
        return out;
      }
      const cx = c % MLEN;
      const cy = Math.floor(c / MLEN);
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx;
        const ny = cy + dy;
        const n = ny * MLEN + nx;
        if (nx < 0 || ny < 0 || nx >= MLEN || ny >= 100 || prev.has(n)) continue;
        if (!this.passable(nx, ny, goals.has(n), dx, dy)) continue;
        prev.set(n, c);
        q.push(n);
      }
    }
    return null;
  }

  async tick(): Promise<boolean> {
    if (this.o.god) this.w.ci.hitpts = 100;
    const hp = this.w.ci.hitpts;
    await this.sim.tick();
    if (process.env.HITS && this.w.ci.hitpts < hp) {
      const p = this.sim.pos;
      const near = this.w.mm
        .map((m, i) => ({ n: m.monnum, x: this.w.mi[i].curx[0], y: this.w.mi[i].cury[0] }))
        .filter((m) => m.n < 64 && Math.abs(m.x - p.bx) <= 1 && Math.abs(m.y - p.by) <= 2)
        .map((m) => `${m.n}@${m.x},${m.y}`);
      this.log.push(`t${this.sim.ticks} hp ${hp}->${this.w.ci.hitpts} at ${p.bx},${p.by} near ${near.join(' ')}`);
    }
    this.zap();
    return !this.sim.dead && this.sim.link < 0 && this.sim.ticks < (this.o.maxTicks ?? 1e9);
  }

  /** Zaps a robot lined up within five blocks in the direction Dex last moved. */
  private zap(): void {
    const z = this.o.zapAt;
    if (!z || this.w.ci.meter[SEQ.zap] <= 0) return;
    const w = this.w;
    const { bx, by } = this.sim.pos;
    const dx = Math.sign(w.ci.netx);
    const dy = Math.sign(w.ci.nety);
    for (let mm = 0; mm < w.mm.length; mm++) {
      const n = w.mm[mm].monnum;
      if (n >= 64 || !z(n)) continue;
      const mx = w.mi[mm].curx[0];
      const my = w.mi[mm].cury[0];
      const ahead = dx ? my === by && Math.sign(mx - bx) === dx && Math.abs(mx - bx) <= 5 : mx === bx && Math.sign(my - by) === dy && Math.abs(my - by) <= 5;
      if (ahead) {
        if (this.sim.isHeld(SCAN.space)) this.sim.release(SCAN.space);
        else this.sim.press(SCAN.space);
        return;
      }
    }
    if (this.sim.isHeld(SCAN.space)) this.sim.release(SCAN.space);
  }

  /** The cell Dex is mostly in (a tube or a belt can leave him between cells). */
  cell(): { bx: number; by: number } {
    const p = this.sim.pos;
    return { bx: Math.round(p.x / 20), by: Math.round(p.y / 20) };
  }

  /** Taps toward the grid, a frame (5 pixels) at a time, until Dex is within 2 pixels of it. */
  private async align(): Promise<boolean> {
    const sim = this.sim;
    for (let t = 0; t < 12; t++) {
      const p = sim.pos;
      const { bx, by } = this.cell();
      const ex = bx * 20 - p.x;
      const ey = by * 20 - p.y;
      const k = Math.abs(ex) > 2 ? (ex > 0 ? SCAN.right : SCAN.left) : Math.abs(ey) > 2 ? (ey > 0 ? SCAN.down : SCAN.up) : 0;
      if (!k) return true;
      sim.press(k);
      if (!(await this.tick())) return false;
      sim.release(k);
      for (let i = 0; i < 4; i++) if (!(await this.tick())) return false;
    }
    return true;
  }

  /** Walks one block in a direction. */
  private async step(nx: number, ny: number): Promise<boolean> {
    const sim = this.sim;
    if ((sim.pos.fx || sim.pos.fy) && !(await this.align())) return false;
    const { bx, by } = this.cell();
    const dir = DIRS.find(([dx, dy]) => bx + dx === nx && by + dy === ny);
    if (!dir) return false;
    for (const [, , k] of DIRS) if (k !== dir[2]) sim.release(k);
    // Look both ways: wait while unstoppable traffic is about to cross the next block.
    for (let wait = 0; wait < 90 && ((this.danger(nx, ny) && !this.danger(bx, by)) || this.hazard(nx, ny)); wait++) {
      sim.releaseAll();
      if (!(await this.tick())) return false;
    }
    sim.press(dir[2]);
    for (let t = 0; t < 40; t++) {
      if (!(await this.tick())) return false;
      const p = sim.pos;
      if (Math.abs(p.x - nx * 20) <= 2 && Math.abs(p.y - ny * 20) <= 2) {
        return true;
      }
    }
    sim.release(dir[2]);
    return false;
  }

  /** Does this block hurt now, or will it start to very soon (a laser fence)? */
  hazard(x: number, y: number): boolean {
    const w = this.w;
    const n = w.map[y * MLEN + x];
    const shown = w.bg[w.blkmap[n] ?? n];
    if (shown.chHitPt < 0) return true;
    const next = w.bg[shown.nextBl];
    return next !== shown && next.chHitPt < 0 && w.nxtchg[n] - w.clock < 8;
  }

  /** Is an unzappable hazard (a car, a buggy, a dinosaur) within reach of this block? */
  danger(x: number, y: number): boolean {
    const w = this.w;
    for (let mm = 0; mm < w.mm.length; mm++) {
      const n = w.mm[mm].monnum;
      if (!TRAFFIC.has(n)) continue;
      const mi = w.mi[mm];
      const mx = mi.curx[0] * 20 + mi.curx[1];
      const my = mi.cury[0] * 20 + mi.cury[1];
      if (Math.abs(mx - x * 20) < 70 && Math.abs(my - y * 20) < 30) return true;
    }
    return false;
  }

  /** Steers toward a cell center (moon suit), within a few pixels. */
  private async steer(nx: number, ny: number): Promise<boolean> {
    const sim = this.sim;
    for (let t = 0; t < 80; t++) {
      const p = sim.pos;
      const ex = nx * 20 - p.x;
      const ey = ny * 20 - p.y;
      if (Math.abs(ex) <= 6 && Math.abs(ey) <= 6) return true;
      const want = Math.abs(ex) >= Math.abs(ey) ? (ex > 0 ? SCAN.right : SCAN.left) : ey > 0 ? SCAN.down : SCAN.up;
      for (const [, , k] of DIRS) if (k !== want) sim.release(k);
      sim.press(want);
      if (!(await this.tick())) return false;
    }
    if (process.env.STEER)
      this.log.push(`steer to ${nx},${ny} failed at ${sim.pos.x},${sim.pos.y} seq ${this.w.chr.cseq} grav ${this.w.ci.gravx},${this.w.ci.gravy}`);
    return false;
  }

  /** Goes to the nearest of these cells. Returns false if there is no way. */
  async goTo(cells: [number, number][], what = 'target'): Promise<boolean> {
    const goals = new Set(cells.map(([x, y]) => y * MLEN + x));
    for (let attempt = 0; attempt < 30; attempt++) {
      const p = this.path(goals);
      if (!p) {
        this.log.push(`no path to ${what} from ${this.sim.pos.bx},${this.sim.pos.by}`);
        return false;
      }
      let ok = true;
      for (const [x, y] of p) {
        if (!(this.o.moon ? await this.steer(x, y) : await this.step(x, y))) {
          ok = false;
          break;
        }
      }
      if (this.sim.dead || this.sim.link >= 0) return this.sim.link >= 0 || false;
      if (ok) {
        this.sim.releaseAll();
        return true;
      }
      // Pushed off course (a robot, a belt): settle and plan again.
      this.sim.releaseAll();
      for (let i = 0; i < 4; i++) if (!(await this.tick())) return this.sim.link >= 0;
    }
    this.log.push(
      `gave up on ${what} at ${this.sim.pos.bx},${this.sim.pos.by} (${this.sim.pos.fx},${this.sim.pos.fy}) heading for ${cells
        .slice(0, 3)
        .map((c) => c.join(','))
        .join(' ')}`,
    );
    return false;
  }

  /** Every cell holding a block whose name passes `test`. */
  find(names: string[], test: (name: string) => boolean): [number, number][] {
    const out: [number, number][] = [];
    const w = this.w;
    for (let i = 0; i < w.map.length; i++) if (test(names[w.map[i]] ?? '')) out.push([i % MLEN, Math.floor(i / MLEN)]);
    return out;
  }

  /** Collects everything matching, nearest first, until nothing more can be reached. */
  async collect(names: string[], test: (name: string) => boolean, what: string): Promise<number> {
    let n = 0;
    for (;;) {
      const cells = this.find(names, test);
      if (!cells.length) return n;
      const goals = new Set(cells.map(([x, y]) => y * MLEN + x));
      if (!this.path(goals)) {
        this.log.push(`${cells.length} ${what} out of reach: ${cells.map((c) => c.join(',')).join(' ')}`);
        return n;
      }
      if (!(await this.goTo(cells, what))) return n;
      n++;
      if (this.sim.dead || this.sim.link >= 0) return n;
    }
  }
}
