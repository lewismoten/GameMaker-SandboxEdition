// A play-testing bot for GameSim: finds its way with a shortest-path search (anything it can
// eat out of the way counts as ground, at a price), walks it one straight run at a time,
// eats, gathers wool from the thorn bushes, and screams at whatever cousin stands in the gap.
// Moving monsters (the crowd, camels, pigeons) are handled by trying a stretch again from a
// snapshot after a wait (see route.ts, carefully()).
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { LASTMON } from '../../../web/src/formats/monster';
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

/** The tin heart and the Easter egg: left for the player to find (the bot never takes or steps on them). */
const KEEPSAKES = new Set([...BLOCK].filter(([name]) => /^(tinHeart|easterEgg)\d*$/.test(name)).map(([, i]) => i));

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
    this.log.push(
      `[${this.sim.scene}] ${s} @${p.x - ORIGIN},${p.y - ORIGIN} t${this.sim.ticks} hp ${this.sim.ci.hitpts} wool ${this.wool} breath ${this.breath}`,
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

  /** What one step onto (x, y) costs, or undefined where the goat can't go. */
  private cost(x: number, y: number): number | undefined {
    const shown = this.sim.shown(x, y);
    const b = this.sim.blockAt(x, y);
    const extra = (this.avoid.get(`${x},${y}`) ?? 0) + (this.crowd?.has(y * 100 + x) ? 30 : 0);
    if (KEEPSAKES.has(b)) return undefined;
    if (shown.solid) {
      const d = EAT.get(this.sim.w.blkmap[b]) ?? EAT.get(b);
      return d === undefined ? undefined : 1 + d + extra;
    }
    if (shown.chHitPt < 0 || shown.scorePts < 0) return 40 + extra;
    return 1 + extra;
  }

  /**
   * Path costs from (sx, sy) to every cell (4 directions), avoiding links but (tx, ty). Reversed,
   * they are the costs of getting from every cell to (sx, sy).
   */
  private search(sx: number, sy: number, tx = -1, ty = -1, reverse = false) {
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
        if (reverse && this.cost(nx, ny) === undefined) continue;
        const c = reverse ? (this.cost(x, y) ?? 1) : (this.cost(nx, ny) ?? (target ? 1 : undefined));
        if (c === undefined) continue;
        const nd = d + c;
        if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
          dist.set(key(nx, ny), nd);
          from.set(key(nx, ny), key(x, y));
          open.push([nd, nx, ny]);
        }
      }
    }
    return { dist, from };
  }

  /** Shortest path (4 directions) to (tx, ty) in world blocks, avoiding links not asked for. */
  path(tx: number, ty: number): Pt[] | undefined {
    const { x: sx, y: sy } = this.sim.pos;
    const { dist, from } = this.search(sx, sy, tx, ty);
    const key = (x: number, y: number) => y * 100 + x;
    if (!dist.has(key(tx, ty))) return undefined;
    const out: Pt[] = [];
    let k = key(tx, ty);
    while (k !== key(sx, sy)) {
      out.unshift({ x: k % 100, y: Math.floor(k / 100) });
      k = from.get(k)!;
    }
    return out;
  }

  /** While looking for loot: the cells the monsters stand on now (no detour squeezes past them). */
  private crowd: Set<number> | undefined;

  private monsterCells(): Set<number> {
    const out = new Set<number>();
    const { mm, mi } = this.sim.w;
    mm.forEach((m, i) => {
      if (m.monnum === LASTMON) return;
      const { curx, cury } = mi[i];
      for (const dx of curx[1] ? [0, 1] : [0]) for (const dy of cury[1] ? [0, 1] : [0]) out.add((cury[0] + dy) * 100 + curx[0] + dx);
    });
    return out;
  }

  /** Picks up loot it can see on the way (off for a stretch that can't afford a detour). */
  forage = true;
  /** The most extra path cost one pickup may add to a walk, and all of a walk's pickups together. */
  detour = 12;
  budget = 24;

  /** Loot in the view now: wool, hay, thistles, stars, crates of cabbages, a sandal (never the pail). */
  private lootInView(): Pt[] {
    const { mx, my } = this.sim.w;
    const out: Pt[] = [];
    for (let by = 0; by < 10; by++)
      for (let bx = 0; bx < 16; bx++) {
        const x = (mx + bx) % 100;
        const y = (my + by) % 100;
        const n = this.sim.blockAt(x, y);
        const b = this.sim.shown(x, y);
        if (KEEPSAKES.has(n)) continue;
        if (b.touchBl === (this.sim.w.blkmap[n] ?? n) || b.chHitPt < 0 || b.scorePts < 0 || (b.effect && b.eamt < 0)) continue;
        if (b.scorePts > 0 || b.chHitPt > 0 || (b.effect && b.eamt > 0)) out.push({ x, y });
      }
    return out;
  }

  /** Health and nothing else (cabbages, figs): a meal, not a gift. */
  private isFood(c: Pt): boolean {
    const b = this.sim.shown(c.x, c.y);
    return b.chHitPt > 0 && !(b.effect && b.eamt > 0);
  }

  /**
   * On the way to (tx, ty): goes for the loot in view most on the way (then the nearest) whose detour costs no more than
   * `detour` (and the walk's pickups no more than `budget`), as a player grabs what's on the
   * way; a pickup behind a hazard or far off the way is left.
   */
  private async gather(tx: number, ty: number, skip?: Pt): Promise<string | undefined> {
    let spent = 0;
    for (let k = 0; k < 8; k++) {
      const p = this.sim.pos;
      if (p.sx || p.sy) return undefined;
      const key = (x: number, y: number) => y * 100 + x;
      this.crowd = this.monsterCells();
      const fromHere = this.search(p.x, p.y).dist;
      const toTarget = this.search(tx, ty, -1, -1, true).dist;
      this.crowd = undefined;
      const direct = fromHere.get(key(tx, ty));
      if (direct === undefined) return undefined;
      let best: { at: Pt; stand: Pt; d: number; extra: number } | undefined;
      for (const c of this.lootInView()) {
        if ((c.x === tx && c.y === ty) || (skip && c.x === skip.x && c.y === skip.y)) continue;
        const stands = this.sim.solidAt(c.x, c.y) ? Object.values(STEP).map((s) => ({ x: c.x + s.x, y: c.y + s.y })) : [c];
        for (const s of stands) {
          if (s !== c && this.cost(s.x, s.y) === undefined) continue;
          const a = fromHere.get(key(s.x, s.y));
          const b = toTarget.get(key(s.x, s.y));
          if (a === undefined || b === undefined) continue;
          // a crate of cabbages is only worth a step or two when she isn't hungry
          const food = this.isFood(c) && this.sim.ci.hitpts >= 100 ? 4 : 0;
          const extra = a + b - direct + (s === c ? 0 : 3) + food;
          if (extra > this.detour || spent + extra > this.budget) continue;
          if (!best || extra < best.extra || (extra === best.extra && a < best.d)) best = { at: c, stand: s, d: a, extra };
        }
      }
      if (process.env.BOT_GATHER)
        console.log(
          `[${this.sim.scene}] gather to ${tx - ORIGIN},${ty - ORIGIN} from ${p.x - ORIGIN},${p.y - ORIGIN} view ${this.sim.w.mx},${this.sim.w.my}: ${this.lootInView()
            .map((c) => `${c.x - ORIGIN},${c.y - ORIGIN}`)
            .join(' ')} -> ${best ? `${best.at.x - ORIGIN},${best.at.y - ORIGIN} +${best.extra}` : 'none'}`,
        );
      if (!best) return undefined;
      spent += best.extra;
      const { at, stand } = best;
      const was = this.forage;
      this.forage = false;
      try {
        let r = await this.goto(stand.x - ORIGIN, stand.y - ORIGIN, `loot at ${at.x - ORIGIN},${at.y - ORIGIN}`);
        if (!r && (stand.x !== at.x || stand.y !== at.y))
          r = await this.push(stand.x < at.x ? 'right' : stand.x > at.x ? 'left' : stand.y < at.y ? 'down' : 'up');
        if (r) return r;
      } finally {
        this.forage = was;
      }
    }
    return undefined;
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
  async goto(lx: number, ly: number, label = '', skip?: Pt): Promise<string | undefined> {
    const x = lx + ORIGIN;
    const y = ly + ORIGIN;
    if (this.forage) {
      const r = await this.gather(x, y, skip);
      if (r) return r;
    }
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
      const at = this.sim.pos;
      if (!blocked && (at.x !== x || at.y !== y)) {
        // bumped off the cell on arrival (a cousin in the way): walk it again
        this.say(`bumped off ${label}`);
        continue;
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
    const r = await this.goto(lx + s.x, ly + s.y, label, { x: lx + ORIGIN, y: ly + ORIGIN });
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
