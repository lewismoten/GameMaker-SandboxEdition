// A play-testing bot for GameSim: finds its way across a scene with a shortest-path search
// over the blocks Ada can walk on, walks it one straight run at a time, pushes on doors and
// dials, picks things up, and steps on links. What it presses is recorded, so a finished
// route is also a demo (or a whole-game walkthrough for testing the real engine).
import { GameSim } from './sim';
import { SCAN } from './ids';

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export class Bot {
  log: string[] = [];
  /** Cells to keep off where possible (cost per step). */
  avoid = new Map<string, number>();
  constructor(readonly sim: GameSim) {}

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(`[${this.sim.scene}] ${s} @${p.x},${p.y} t${this.sim.ticks} score ${this.sim.ci.score}`);
  }

  async wait(n: number): Promise<string | undefined> {
    for (let i = 0; i < n; i++) {
      const r = await this.sim.tick();
      if (r) return r;
    }
    return undefined;
  }

  private linkCells(): Set<string> {
    const s = new Set<string>();
    for (const l of this.sim.game.scenes[this.sim.scene].links) if (l.toScene !== 0xffff) s.add(`${l.from.x},${l.from.y}`);
    return s;
  }

  /** Cells under solid monsters (the sergeant, the watchman). */
  private monsterCells(): Set<string> {
    const w = this.sim.w;
    const s = new Set<string>();
    w.mm.forEach((m, i) => {
      if (m.monnum >= 64) return;
      const mi = w.mi[i];
      const pic = w.mon[m.monnum]?.pic[Math.max(0, mi.curPic)]?.[0] ?? 100;
      if (pic >= 100 || !w.mblk[pic]?.solid) return;
      for (const dx of [0, mi.curx[1] > 0 ? 1 : 0]) for (const dy of [0, mi.cury[1] > 0 ? 1 : 0]) s.add(`${mi.curx[0] + dx},${mi.cury[0] + dy}`);
    });
    return s;
  }

  /** Shortest path (4 directions) to (tx, ty), avoiding solid blocks and links not asked for. */
  path(tx: number, ty: number): Pt[] | undefined {
    const { x: sx, y: sy } = this.sim.pos;
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
        if (!target && (this.sim.solidAt(nx, ny) || links.has(k) || mons.has(k))) continue;
        const nd = d + 1 + (this.avoid.get(k) ?? 0);
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
    return out;
  }

  /** Holds a direction until Ada stands exactly on (x, y). Returns a scene event if one happened. */
  private async run(dir: Dir, x: number, y: number, maxTicks = 400): Promise<string | undefined> {
    const scan = SCAN[dir];
    this.sim.press(scan);
    let last = '';
    let stuck = 0;
    for (let t = 0; t < maxTicks; t++) {
      const r = await this.sim.tick();
      if (r) return r;
      const p = this.sim.pos;
      if (p.x === x && p.y === y && p.sx === 0 && p.sy === 0) break;
      const now = `${p.x},${p.y},${p.sx},${p.sy}`;
      stuck = now === last ? stuck + 1 : 0;
      last = now;
      if (stuck > 40) {
        this.sim.release(scan);
        return 'stuck';
      }
    }
    this.sim.release(scan);
    const p = this.sim.pos;
    if (!(p.x === x && p.y === y && p.sx === 0 && p.sy === 0)) return 'stuck';
    return this.wait(1);
  }

  /** Walks to (x, y). Returns 'link'/'dead'/'end' if a scene change happened on the way. */
  async goto(x: number, y: number, label = ''): Promise<string | undefined> {
    for (let attempt = 0; attempt < 6; attempt++) {
      const steps = this.path(x, y);
      if (!steps) throw new Error(`No path to ${x},${y} ${label} from ${this.sim.pos.x},${this.sim.pos.y} in scene ${this.sim.scene}`);
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
      this.say(`blocked on the way to ${label}; waiting`);
      const r = await this.wait(25);
      if (r) return r;
      // nudge to a cell centre before trying again
    }
    throw new Error(`Could not reach ${x},${y} ${label}`);
  }

  /** Taps a direction for `ticks` ticks (pushing a door, turning a dial). */
  async push(dir: Dir, ticks = 1, after = 4): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    let r = await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    if (r) return r;
    r = await this.wait(after);
    return r;
  }

  /** Holds a direction until a scene change (or gives up). */
  async through(dir: Dir, max = 120): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    const r = await this.wait(max);
    this.sim.release(SCAN[dir]);
    if (!r) throw new Error(`Pushed ${dir} for ${max} ticks and nothing happened at ${this.sim.pos.x},${this.sim.pos.y}`);
    this.say(`through ${dir}: ${r}`);
    return r;
  }

  async pickup(what: string): Promise<void> {
    const before = this.sim.inv.filter((b) => b !== 150).length;
    this.sim.press(SCAN.space);
    await this.wait(2);
    this.sim.release(SCAN.space);
    await this.wait(8);
    const after = this.sim.inv.filter((b) => b !== 150).length;
    if (after !== before + 1) throw new Error(`Could not pick up ${what} at ${this.sim.pos.x},${this.sim.pos.y}`);
    this.say(`picked up ${what} (evidence ${this.sim.meter(3) - 1})`);
  }

  async key(scan: number, hold = 2, after = 10): Promise<void> {
    this.sim.press(scan);
    await this.wait(hold);
    this.sim.release(scan);
    await this.wait(after);
  }
}
