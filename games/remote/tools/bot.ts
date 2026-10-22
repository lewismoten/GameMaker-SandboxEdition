// A play-testing bot for GameSim: finds its way with a shortest-path search over the floor (what
// hurts costs more; links it wasn't sent to are walls), walks it one straight run at a time,
// pushes into things to search them, and shouts at what's in the way. Moving monsters (the cat,
// dust bunnies, socks, the whirling furniture) are handled by trying a stretch again from a
// snapshot after a wait (route.ts, carefully()). On the living room ride the spinning rug
// carries it off its line now and then: it steps back onto a whole block and plans again.
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { DIGITS, MONEY, PLAY, SCAN, SPOTS } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import type { GameSim } from './sim';

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export class Bot {
  log: string[] = [];
  /** Extra cost per cell (in world blocks). */
  avoid = new Map<string, number>();
  constructor(readonly sim: GameSim) {}

  snapshot() {
    return { sim: this.sim.snapshot(), log: this.log.length };
  }

  restore(s: ReturnType<Bot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.log.length = s.log;
  }

  async tick(): Promise<string | undefined> {
    return (await this.sim.tick()) ?? undefined;
  }

  /** A counter as shown (Game-Maker's counters start at 1 and show one less). */
  count(k: number): number {
    return this.sim.meter(k) - 1;
  }

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(`[${this.sim.scene}] ${s} @${p.x - ORIGIN},${p.y - ORIGIN} t${this.sim.ticks} hp ${this.sim.ci.hitpts} spots ${this.count(SPOTS)} digits ${this.count(DIGITS)} pennies ${this.count(MONEY)} play ${this.count(PLAY)}`);
  }

  async wait(k: number): Promise<string | undefined> {
    for (let i = 0; i < k; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  private linkCells(): Set<string> {
    const s = new Set<string>();
    const links = this.sim.game.scenes[this.sim.scene].links;
    for (let l = 0; l < MAXSCENELINKS; l++) if (links[l] && links[l].toScene !== NOSCENE) s.add(`${links[l].from.x},${links[l].from.y}`);
    return s;
  }

  /** What one step onto (x, y) costs, or undefined where you can't go. */
  private cost(x: number, y: number): number | undefined {
    const shown = this.sim.shown(x, y);
    if (shown.solid) return undefined;
    const extra = this.avoid.get(`${x},${y}`) ?? 0;
    if (shown.chHitPt < 0 || shown.scorePts < 0) return 40 + extra;
    // the spinning rug: fine to ride, but don't dawdle across it
    if (shown.grav) return 3 + extra;
    return 1 + extra;
  }

  /** Shortest path (4 directions) to (tx, ty) in world blocks, avoiding links not asked for. */
  path(tx: number, ty: number): Pt[] | undefined {
    const { x: sx, y: sy } = this.sim.pos;
    const links = this.linkCells();
    const key = (x: number, y: number) => y * 100 + x;
    const dist = new Map<number, number>([[key(sx, sy), 0]]);
    const from = new Map<number, number>();
    const open: [number, number, number][] = [[0, sx, sy]];
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [d, x, y] = open.splice(bi, 1)[0];
      if (x === tx && y === ty) break;
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const s of Object.values(STEP)) {
        const nx = x + s.x;
        const ny = y + s.y;
        if (nx < 0 || ny < 0 || nx > 99 || ny > 99) continue;
        const target = nx === tx && ny === ty;
        if (!target && links.has(`${nx},${ny}`)) continue;
        const c = this.cost(nx, ny) ?? (target ? 1 : undefined);
        if (c === undefined) continue;
        const nd = d + c;
        if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
          dist.set(key(nx, ny), nd);
          from.set(key(nx, ny), key(x, y));
          open.push([nd, nx, ny]);
        }
      }
    }
    if (!dist.has(key(tx, ty))) return undefined;
    const out: Pt[] = [];
    let k = key(tx, ty);
    while (k !== key(sx, sy)) {
      out.unshift({ x: k % 100, y: Math.floor(k / 100) });
      k = from.get(k)!;
    }
    return out;
  }

  /** Holds a direction until you stand exactly on (x, y). */
  private async run(dir: Dir, x: number, y: number, maxTicks = 600): Promise<string | undefined> {
    const scan = SCAN[dir];
    this.sim.press(scan);
    let last = '';
    let stuck = 0;
    const s = STEP[dir];
    for (let t = 0; t < maxTicks; t++) {
      const r = await this.tick();
      if (r) {
        this.sim.releaseAll();
        return r;
      }
      const p = this.sim.pos;
      if (p.x === x && p.y === y && p.sx === 0 && p.sy === 0) break;
      // carried past it (the spinning rug): let go and plan again
      const px = (p.x - x) * 20 + p.sx;
      const py = (p.y - y) * 20 + p.sy;
      if ((s.x && Math.sign(px) === s.x && px !== 0) || (s.y && Math.sign(py) === s.y && py !== 0)) {
        this.sim.release(scan);
        return 'stuck';
      }
      const now = `${p.x},${p.y},${p.sx},${p.sy}`;
      stuck = now === last ? stuck + 1 : 0;
      last = now;
      if (stuck > 30) {
        this.sim.release(scan);
        return 'stuck';
      }
    }
    this.sim.release(scan);
    const p = this.sim.pos;
    if (!(p.x === x && p.y === y && p.sx === 0 && p.sy === 0)) return 'stuck';
    return this.wait(1);
  }

  /** Walks to (x, y) in level coordinates. Returns 'link'/'dead'/'end' on a scene change. */
  async goto(lx: number, ly: number, label = ''): Promise<string | undefined> {
    const x = lx + ORIGIN;
    const y = ly + ORIGIN;
    for (let attempt = 0; attempt < 16; attempt++) {
      const steps = this.path(x, y);
      if (!steps) throw new Error(`No path to ${lx},${ly} ${label} from ${this.sim.pos.x - ORIGIN},${this.sim.pos.y - ORIGIN} in scene ${this.sim.scene}`);
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
      this.say(`blocked on the way to ${label}`);
      const r = await this.align();
      if (r) return r;
      const r2 = await this.wait(6);
      if (r2) return r2;
    }
    throw new Error(`Could not reach ${lx},${ly} ${label}\n${this.log.slice(-6).join('\n')}`);
  }

  /** Pushes on a solid block next to you (searches it, opens it). */
  async push(dir: Dir, ticks = 3, after = 2): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    let r = await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    if (r) return r;
    r = await this.wait(after);
    if (r) return r;
    return this.align();
  }

  /** Back onto a whole block (a push or the rug can leave you part way into one). */
  async align(): Promise<string | undefined> {
    for (let k = 0; k < 4; k++) {
      const p = this.sim.pos;
      if (!p.sx && !p.sy) return undefined;
      const dir: Dir = p.sy ? (p.sy <= 10 && !this.sim.solidAt(p.x, p.y) ? 'up' : 'down') : p.sx <= 10 && !this.sim.solidAt(p.x, p.y) ? 'left' : 'right';
      const tx = dir === 'right' ? p.x + 1 : p.x;
      const ty = dir === 'down' ? p.y + 1 : p.y;
      const r = await this.run(dir, tx, ty, 20);
      if (r && r !== 'stuck') return r;
    }
    return undefined;
  }

  /** Walks up to the solid block at (x, y) from `side` of it and pushes into it. */
  async take(lx: number, ly: number, side: Dir, label = ''): Promise<string | undefined> {
    const s = STEP[side];
    const r = await this.goto(lx + s.x, ly + s.y, label);
    if (r) return r;
    const into: Dir = side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'up' ? 'down' : 'up';
    return this.push(into);
  }

  /** Faces `dir` (one step into a wall, so you don't move) and shouts. */
  async shout(dir: Dir): Promise<string | undefined> {
    const { netx, nety } = this.sim.ci;
    const facing = Math.sign(netx) === STEP[dir].x && Math.sign(nety) === STEP[dir].y;
    let r = facing ? undefined : await this.push(dir, 1, 1);
    if (r) return r;
    this.sim.press(SCAN.space);
    r = await this.wait(2);
    this.sim.release(SCAN.space);
    if (r) return r;
    this.say('SHOUT');
    return this.wait(12);
  }
}
