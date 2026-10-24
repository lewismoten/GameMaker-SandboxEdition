// A play-testing bot for GameSim: finds its way across a street with a shortest-path search
// (deep snow and plow banks count as ground it can dig through, ice and the road cost
// extra), walks it one straight run at a time and shovels whatever is in the way, and picks
// up the cocoa and tips in sight a few steps off the way (never in the park). On the
// sled run it steers by trying each move a few ticks ahead on a snapshot of the game.
import { GameSim } from './sim';
import { buildBlocks } from '../src/blocks/blocks';
import { buildPalette } from '../src/art/pal';
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { SCRNBLEN, SCRNBWID } from '../../../web/src/engine/world';
import { MON, THROWSEQ } from '../src/ids';

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export const SCAN = { up: 72, down: 80, left: 75, right: 77, enter: 28, space: 57 } as const;

/** SNOW.BBL's block numbers by name (the build's own BlockBook). */
export const BLOCK = buildBlocks(buildPalette('noon')).index;
const n = (name: string) => BLOCK.get(name)!;

/** Solid blocks a push clears (and what each costs to dig through). */
const DIG = new Map([
  [n('deep'), 4],
  [n('deepWalk'), 4],
  [n('deepLot'), 4],
  [n('lotRefill'), 4],
  [n('pile'), 4],
  [n('bank1'), 12],
  [n('bank2'), 18],
]);
const ICE = new Set(['iceN', 'iceE', 'iceS', 'iceW'].map(n));
/** Never picked up on the way: the felt egg and the mitten that leads to it. */
const KEEP_OUT = new Set(['feltEgg', 'mitten', 'toboggan'].map(n));
const NAME = new Map([...BLOCK].map(([k, v]) => [v, k]));

export class Bot {
  log: string[] = [];
  /** Extra cost per cell (the road, a fort's line of fire). */
  avoid = new Map<string, number>();
  /** Snowballs thrown at Big Pete. */
  throws = 0;
  private lastThrow = -100;
  private throwing = false;
  constructor(readonly sim: GameSim) {}

  /** Big Pete closing in: a snowball (power 120) beats him (90) and sends him off before he shoves. */
  private async defend(): Promise<void> {
    const { sim } = this;
    if (this.throwing) {
      sim.release(SCAN.space);
      this.throwing = false;
      return;
    }
    if (sim.scene === 3 || sim.ticks - this.lastThrow < 24 || sim.meter(THROWSEQ) <= 0) return;
    const w = sim.w;
    const p = sim.pos;
    // the snowball flies the way the kid last moved
    const { netx, nety } = sim.ci;
    const aimed = w.mm.some((m, i) => {
      if (m.monnum !== MON.bully) return false;
      const dx = w.mi[i].curx[0] - p.x;
      const dy = w.mi[i].cury[0] - p.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) return false;
      return Math.abs(dx) >= Math.abs(dy)
        ? netx !== 0 && Math.sign(dx) === Math.sign(netx) && Math.abs(dy) <= 1
        : nety !== 0 && Math.sign(dy) === Math.sign(nety) && Math.abs(dx) <= 1;
    });
    if (!aimed) return;
    sim.press(SCAN.space);
    this.throwing = true;
    this.lastThrow = sim.ticks;
    this.throws++;
    this.say('a snowball at Big Pete');
  }

  /** The game and the bot's own state, to try a stretch again. */
  snapshot() {
    return { sim: this.sim.snapshot(), lastThrow: this.lastThrow, throwing: this.throwing, throws: this.throws, log: this.log.length };
  }

  restore(s: ReturnType<Bot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.lastThrow = s.lastThrow;
    this.throwing = s.throwing;
    this.throws = s.throws;
    this.log.length = s.log;
  }

  /** One game tick, keeping an eye out for Big Pete. */
  async tick(): Promise<string | undefined> {
    const r = await this.sim.tick();
    if (r) {
      this.throwing = false;
      this.lastThrow = -100;
      return r;
    }
    await this.defend();
    return undefined;
  }

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(`[${this.sim.scene}] ${s} @${p.x},${p.y} t${this.sim.ticks} $${this.sim.money} hp ${this.sim.ci.hitpts}`);
  }

  async wait(n: number): Promise<string | undefined> {
    for (let i = 0; i < n; i++) {
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

  /** What one step onto (x, y) costs, or undefined where the kid can't go. */
  private cost(x: number, y: number): number | undefined {
    const shown = this.sim.shown(x, y);
    const b = this.sim.blockAt(x, y);
    const k = `${x},${y}`;
    const extra = this.avoid.get(k) ?? 0;
    if (shown.solid) {
      const d = DIG.get(this.sim.w.blkmap[b]) ?? DIG.get(b);
      return d === undefined ? undefined : 1 + d + extra;
    }
    if (ICE.has(b)) return 60 + extra;
    return 1 + extra;
  }

  /** Shortest path (4 directions) to (tx, ty), digging where it has to, avoiding links not asked for. */
  path(tx: number, ty: number, start: Pt = this.sim.pos): Pt[] | undefined {
    const { x: sx, y: sy } = start;
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

  /** The snow that pays (deep snow, the lot filling back in) closest to the kid, leaning toward `toward`. */
  nearestDig(toward: [number, number]): [number, number] | undefined {
    const { x: sx, y: sy } = this.sim.pos;
    const links = this.linkCells();
    const dist = new Map<number, number>([[sy * 100 + sx, 0]]);
    const open: [number, number, number][] = [[0, sx, sy]];
    let best: [number, number] | undefined;
    let bestScore = Infinity;
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [d, x, y] = open.splice(bi, 1)[0];
      if (d > (dist.get(y * 100 + x) ?? Infinity) || d > bestScore) continue;
      for (const s of Object.values(STEP)) {
        const nx = x + s.x;
        const ny = y + s.y;
        if (nx < 0 || ny < 0 || nx > 99 || ny > 99 || links.has(`${nx},${ny}`)) continue;
        const shown = this.sim.shown(nx, ny);
        if (shown.solid && shown.effect === 3 && shown.eamt > 0) {
          const score = d + 1 + 0.5 * (Math.abs(nx - toward[0]) + Math.abs(ny - toward[1]));
          if (score < bestScore) {
            bestScore = score;
            best = [nx, ny];
          }
          continue;
        }
        if (shown.solid) continue;
        const c = this.cost(nx, ny);
        if (c === undefined) continue;
        const nd = d + c;
        if (nd < (dist.get(ny * 100 + nx) ?? Infinity)) {
          dist.set(ny * 100 + nx, nd);
          open.push([nd, nx, ny]);
        }
      }
    }
    return best;
  }

  /** Holds a direction until the kid stands exactly on (x, y), shoveling on the way. */
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

  /** Off where a detour could spoil a stretch. */
  grab = true;
  /** How many steps out of the way a cocoa mug or a tip in sight is worth. */
  detour = 8;

  /** A pickup lying out in the open (cocoa, a tip, a root beer), never the felt egg or what lies in the pines. */
  private isPickup(x: number, y: number): boolean {
    // the park and the pines behind Gale Street are left alone
    if (this.sim.scene === 2 && y >= 23) return false;
    const b = this.sim.blockAt(x, y);
    const k = this.sim.shown(x, y);
    if (KEEP_OUT.has(b) || k.solid || k.touchBl === b || (k.effect && k.eamt < 0)) return false;
    return k.scorePts > 0 || k.chHitPt > 0 || (k.effect > 0 && k.eamt > 0);
  }

  /** What walking (and shoveling) `steps` costs. */
  private walkCost(steps: Pt[]): number {
    return steps.reduce((c, s) => c + (this.cost(s.x, s.y) ?? 1), 0);
  }

  /** Steps on the road, the ice or in a fort's line of fire. */
  private risky(steps: Pt[]): boolean {
    return steps.some((s) => this.avoid.has(`${s.x},${s.y}`) || ICE.has(this.sim.blockAt(s.x, s.y)));
  }

  /** The pickup on screen fewest steps out of the way to (tx, ty) (shoveling counted), if no more than `detour` and nothing risky on the way there. */
  private pickupNear(tx: number, ty: number): Pt | undefined {
    const w = this.sim.w;
    const direct = this.path(tx, ty);
    if (!direct) return undefined;
    const dc = this.walkCost(direct);
    const p = this.sim.pos;
    let best: { pt: Pt; extra: number } | undefined;
    for (let j = 0; j <= SCRNBWID; j++)
      for (let i = 0; i <= SCRNBLEN; i++) {
        const x = (w.mx + i) % 100;
        const y = (w.my + j) % 100;
        if ((x === tx && y === ty) || (x === p.x && y === p.y) || !this.isPickup(x, y)) continue;
        if (Math.abs(x - p.x) + Math.abs(y - p.y) > direct.length + this.detour) continue;
        const there = this.path(x, y);
        if (!there || this.risky(there)) continue;
        const back = this.path(tx, ty, { x, y });
        if (!back) continue;
        const extra = this.walkCost(there) + this.walkCost(back) - dc;
        if (extra <= this.detour && (!best || extra < best.extra)) best = { pt: { x, y }, extra };
      }
    return best?.pt;
  }

  /** Walks to (x, y). Returns 'link'/'dead'/'end' if a scene change happened on the way. */
  async goto(x: number, y: number, label = ''): Promise<string | undefined> {
    // like a player, pick up what lies in sight a few steps off the way first
    for (let k = 0; this.grab && k < 10; k++) {
      const p = this.sim.pos;
      if (p.sx || p.sy) break;
      const q = this.pickupNear(x, y);
      if (!q) break;
      this.grab = false;
      try {
        const r = await this.goto(q.x, q.y, `a ${NAME.get(this.sim.blockAt(q.x, q.y))} on the way`);
        if (r) return r;
      } finally {
        this.grab = true;
      }
    }
    for (let attempt = 0; attempt < 8; attempt++) {
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
      this.say(`blocked on the way to ${label}`);
      // off a cell's edge: step back onto the nearest whole cell before planning again
      const p = this.sim.pos;
      if (p.sx || p.sy) {
        const r = await this.run(p.sx ? 'left' : 'up', p.x, p.y, 20);
        if (r && r !== 'stuck') return r;
      }
      const r = await this.wait(10);
      if (r) return r;
    }
    throw new Error(`Could not reach ${x},${y} ${label}`);
  }

  /** Pushes on a solid block next to the kid (shovels it, opens a door). */
  async push(dir: Dir, ticks = 3, after = 2): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    let r = await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    if (r) return r;
    r = await this.wait(after);
    return r;
  }
}
