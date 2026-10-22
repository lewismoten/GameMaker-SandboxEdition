// A play-testing bot for GameSim: finds its way with a shortest-path search (anything it can
// eat out of the way counts as ground, at a price), walks it one straight run at a time,
// eats, gathers wool from the thorn bushes, and screams at whatever cousin stands in the gap.
// Moving monsters (the crowd, camels, pigeons) are handled by trying a stretch again from a
// snapshot after a wait (see route.ts, carefully()).
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { SCREAMSEQ, WOOL } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import { GameSim } from './sim';

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, b: 48, c: 46 } as const;

/** GOAT.BBL's block numbers by name (the build's own BlockBook). */
export const BLOCK = buildBlocks(buildPalette('day')).index;
const n = (name: string) => BLOCK.get(name)!;

/** Solid blocks a push eats out of the way, and what each costs to go through. */
const EAT = new Map([
  [n('hay'), 3],
  [n('hayIn'), 3],
  [n('haySand'), 3],
  [n('thistle'), 3],
  [n('gate'), 2],
  [n('laundry'), 2],
  [n('census'), 2],
  [n('dusty'), 3],
]);

export class Bot {
  log: string[] = [];
  /** Extra cost per cell (a camel's line of spit). */
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

  get wool(): number {
    return this.sim.meter(WOOL) - 1;
  }

  get breath(): number {
    return this.sim.meter(SCREAMSEQ);
  }

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(`[${this.sim.scene}] ${s} @${p.x - ORIGIN},${p.y - ORIGIN} t${this.sim.ticks} hp ${this.sim.ci.hitpts} wool ${this.wool} breath ${this.breath}`);
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

  /** What one step onto (x, y) costs, or undefined where the goat can't go. */
  private cost(x: number, y: number): number | undefined {
    const shown = this.sim.shown(x, y);
    const b = this.sim.blockAt(x, y);
    const extra = this.avoid.get(`${x},${y}`) ?? 0;
    if (shown.solid) {
      const d = EAT.get(this.sim.w.blkmap[b]) ?? EAT.get(b);
      return d === undefined ? undefined : 1 + d + extra;
    }
    if (shown.chHitPt < 0 || shown.scorePts < 0) return 40 + extra;
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

  /** Holds a direction until the goat stands exactly on (x, y), eating on the way. */
  private async run(dir: Dir, x: number, y: number, maxTicks = 600): Promise<string | undefined> {
    const scan = SCAN[dir];
    this.sim.press(scan);
    let last = '';
    let stuck = 0;
    for (let t = 0; t < maxTicks; t++) {
      const r = await this.tick();
      if (r) {
        this.sim.releaseAll();
        return r;
      }
      const p = this.sim.pos;
      if (p.x === x && p.y === y && p.sx === 0 && p.sy === 0) break;
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
    for (let attempt = 0; attempt < 12; attempt++) {
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
      // off a cell's edge: step back onto a whole cell before planning again
      const p = this.sim.pos;
      if (p.sx || p.sy) {
        const r = await this.run(p.sx ? 'left' : 'up', p.x, p.y, 20);
        if (r && r !== 'stuck') return r;
      }
      const r = await this.wait(12);
      if (r) return r;
    }
    throw new Error(`Could not reach ${lx},${ly} ${label}\n${this.log.slice(-6).join('\n')}`);
  }

  /** Pushes on a solid block next to the goat (eats it, takes its wool, opens the place). */
  async push(dir: Dir, ticks = 3, after = 2): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    let r = await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    if (r) return r;
    r = await this.wait(after);
    if (r) return r;
    return this.align();
  }

  /** Back onto a whole cell (a push that ate its way in leaves her part way into it). */
  async align(): Promise<string | undefined> {
    const p = this.sim.pos;
    if (p.sy) {
      const r = p.sy <= 10 ? await this.run('up', p.x, p.y, 20) : await this.run('down', p.x, p.y + 1, 20);
      if (r) return r;
    }
    const q = this.sim.pos;
    if (q.sx) {
      const r = q.sx <= 10 ? await this.run('left', q.x, q.y, 20) : await this.run('right', q.x + 1, q.y, 20);
      if (r) return r;
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

  /** Faces `dir` (one step into a wall or monster, so she doesn't move) and screams. */
  async scream(dir: Dir): Promise<string | undefined> {
    const { netx, nety } = this.sim.ci;
    const facing = Math.sign(netx) === STEP[dir].x && Math.sign(nety) === STEP[dir].y;
    let r = facing ? undefined : await this.push(dir, 1, 1);
    if (r) return r;
    this.sim.press(SCAN.space);
    r = await this.wait(2);
    this.sim.release(SCAN.space);
    if (r) return r;
    this.say('SCREAM');
    return this.wait(12);
  }
}
