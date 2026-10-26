// A play-testing bot for GameSim: finds its way with a shortest-path search over the floor (what
// hurts costs more: a hissing fog machine, a fake spiderweb, a fog light; links it wasn't sent
// to are walls; off the foyer's runner a little more when keepTo is set), walks it one straight
// run at a time, pushes into doors to open them, picks up what it sees on the way, and tackles
// (or swings the foam sword at) what's in the way. Moving monsters (zombies, bats, the ghost,
// the werewolf guy, the cardboard knight) are handled by trying a stretch again from a
// snapshot after a wait (route.ts, carefully()).
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { BATTERIES, MONEY, SCAN, SMIRKS, SORRY, HELMET } from '../src/ids';
import { ORIGIN } from '../src/levels/maps';
import { MLEN, bgBlock, type World } from '../../../web/src/engine/world';
import type { GameSim } from './sim';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';

/** The tin heart's and the Easter egg's blocks: little secrets the bot leaves for the player (it never goes out of its way for them). */
const SECRETS = new Set([...buildBlocks(buildPalette('plain')).index].filter(([name]) => /^(tinHeart|egg)\d*$/.test(name)).map(([, i]) => i));

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export class Bot {
  log: string[] = [];
  /** Extra cost per cell (in world blocks). */
  avoid = new Map<string, number>();
  /** Pickups seen on screen (world "x,y"), for the loot report. */
  seen = new Set<string>();
  /** Grab visible pickups on the way (off while a stretch needs exact moves). */
  greedy = !process.env.NO_LOOT;
  constructor(readonly sim: GameSim) {}

  /** A pickup lying on the floor at (x, y): walk onto it and it's yours (points, nerve, dollars, batteries). */
  isLoot(x: number, y: number, w: World = this.sim.w): boolean {
    const b = w.map[y * MLEN + x];
    const blk = bgBlock(w, w.blkmap[b] ?? 0);
    if (blk.solid || blk.touchBl === b || blk.chHitPt < 0 || SECRETS.has(b)) return false;
    return blk.scorePts > 0 || blk.chHitPt > 0 || (blk.effect > 0 && blk.eamt > 0);
  }

  /** The cells on screen round you (PLAYGAME shows 16 x 10 blocks). */
  private *onScreen(): Generator<[number, number]> {
    const { x, y } = this.sim.pos;
    for (let yy = y - 5; yy <= y + 5; yy++) for (let xx = x - 8; xx <= x + 8; xx++) if (xx >= 0 && yy >= 0 && xx < 100 && yy < 100) yield [xx, yy];
  }

  /** Pickups seen but left lying in each level, counted as you leave it (the loot report). */
  readonly left: Record<number, number> = {};

  private leftIn(scene: number, w: World): number {
    const here = `${scene}:`;
    const lying = [...this.seen].filter((k) => {
      if (!k.startsWith(here)) return false;
      const [x, y] = k.slice(here.length).split(',').map(Number);
      return this.isLoot(x, y, w);
    });
    if (process.env.BOT_LOG) console.log(`left lying in scene ${scene}: ${lying.join(' ')} (world blocks)`);
    return lying.length;
  }

  /**
   * Like a person would: picks up what's on screen and close by (a few steps out of the way,
   * nothing that hurts on the path), nearest first, then goes on.
   */
  async grab(maxSteps = 7): Promise<string | undefined> {
    if (!this.greedy) return undefined;
    for (let n = 0; n < 6; n++) {
      let best: { x: number; y: number; len: number } | undefined;
      for (const [x, y] of this.onScreen()) {
        if (!this.isLoot(x, y)) continue;
        const p = this.path(x, y);
        if (!p || p.length > maxSteps) continue;
        if (p.some((c) => this.sim.shown(c.x, c.y).chHitPt < 0)) continue;
        if (!best || p.length < best.len) best = { x, y, len: p.length };
      }
      if (!best) return undefined;
      this.greedy = false;
      try {
        const r = await this.goto(best.x - ORIGIN, best.y - ORIGIN, 'something on the floor');
        if (r) return r;
      } finally {
        this.greedy = !process.env.NO_LOOT;
      }
    }
    return undefined;
  }

  snapshot() {
    return { sim: this.sim.snapshot(), log: this.log.length, seen: new Set(this.seen) };
  }

  restore(s: ReturnType<Bot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.log.length = s.log;
    this.seen = new Set(s.seen);
  }

  async tick(): Promise<string | undefined> {
    const w = this.sim.w;
    const scene = this.sim.scene;
    const r = (await this.sim.tick()) ?? undefined;
    if (r === 'link' || r === 'end') this.left[scene] = this.leftIn(scene, w);
    if (!r && this.sim.ticks % 8 === 0) for (const [x, y] of this.onScreen()) if (this.isLoot(x, y)) this.seen.add(`${this.sim.scene}:${x},${y}`);
    return r;
  }

  /** A counter as shown (Game-Maker's counters start at 1 and show one less). */
  count(k: number): number {
    return this.sim.meter(k) - 1;
  }

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(
      `[${this.sim.scene}] ${s} @${p.x - ORIGIN},${p.y - ORIGIN} t${this.sim.ticks} nerve ${this.sim.ci.hitpts} batteries ${this.count(BATTERIES)} sorry ${this.count(SORRY)} dollars ${this.count(MONEY)} helmet ${this.count(HELMET)} smirks ${this.count(SMIRKS)}`,
    );
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

  /** The extra cost of a step onto a cell off the carpet runner (kit/walkPaths.ts keepToPaths); unset, every way costs the same. */
  keepTo?: (x: number, y: number) => number;

  /** What one step onto (x, y) costs, or undefined where you can't go. */
  private cost(x: number, y: number): number | undefined {
    const shown = this.sim.shown(x, y);
    if (shown.solid) return undefined;
    const extra = this.avoid.get(`${x},${y}`) ?? 0;
    if (shown.chHitPt < 0 || shown.scorePts < 0) return 40 + extra;
    return 1 + extra + (this.keepTo?.(x, y) ?? 0);
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
      // pushed past it: let go and plan again
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
    const g = await this.grab();
    if (g) return g;
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

  /** Faces `dir` (a tick's step that way) and tackles: GET DOWN! (or swings the sword). */
  async tackle(dir: Dir): Promise<string | undefined> {
    const { netx, nety } = this.sim.ci;
    const facing = Math.sign(netx) === STEP[dir].x && Math.sign(nety) === STEP[dir].y;
    let r = facing ? undefined : await this.push(dir, 1, 1);
    if (r) return r;
    this.sim.press(SCAN.space);
    r = await this.wait(2);
    this.sim.release(SCAN.space);
    if (r) return r;
    this.say('GET DOWN!');
    return this.wait(12);
  }
}
