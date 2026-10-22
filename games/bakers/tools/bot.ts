// A play-testing bot for GameSim. It knows Ebenezer's tricks (it read the rooms' ASCII, so a
// false wall is a way through and a hidden mousetrap is a place not to step), plans the
// shortest way with a search over the grid as it stands right now, and takes it one step at
// a time: before each step it tries the step, a short wait, and the other ways on a copy of
// the game, and takes whichever costs the fewest hit points. A step onto a belt or greased
// boards is tried on a copy too, to see where the slide ends. Mice and Redcoats in its way get
// a squawk.
import { GameSim } from './sim';
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../web/src/formats/blocks';
import { MLEN } from '../../../web/src/formats/map';
import { CTR, SCAN } from '../src/ids';
import type { Compiled } from '../src/compile';

export type Dir = 'up' | 'down' | 'left' | 'right';
type Pt = { x: number; y: number };
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
/** The side of the target block that stops a step each way. */
const SIDE: Record<Dir, number> = { up: SOLBOT, down: SOLTOP, left: SOLRIG, right: SOLLEF };

export class Bot {
  log: string[] = [];
  /** Block names of the current scene's set. */
  private names: string[] = [];
  private slides = new Map<string, Pt | null>();
  private sceneSeen = -1;
  squawks = 0;
  private lastSquawk = -100;
  /** Steps to take with no lookahead (e.g. through a crowd the bot has already decided on). */
  bold = false;

  constructor(
    readonly sim: GameSim,
    readonly all: Compiled,
  ) {}

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(`[${this.sim.scene}] ${s} @${p.x},${p.y} t${this.sim.ticks} ing ${this.sim.ingredients} hp ${this.sim.ci.hitpts} lives ${this.sim.ci.lives}`);
    if (process.env.BOT_DEBUG) console.log(this.log[this.log.length - 1]);
  }

  /** The room being played (the compiled room for the current scene). */
  room() {
    const s = this.sim.scene;
    return this.all.rooms.find((r) => (r.spec.level === 0 ? 15 : r.spec.level + 1) === s)!;
  }

  private refresh(): void {
    if (this.sceneSeen === this.sim.scene) return;
    this.sceneSeen = this.sim.scene;
    this.names = this.all.sets[this.room().spec.style].tiles.names;
    this.slides.clear();
  }

  /** The block's name as placed on the map (its number, not its animation frame). */
  nameAt(x: number, y: number): string {
    this.refresh();
    return this.names[this.sim.blockAt(x, y)] ?? 'void';
  }

  /** Map cells of every legend character `ch` in the current room. */
  marks(ch: string): Pt[] {
    const out: Pt[] = [];
    for (const [k, v] of this.room().chars) if (v === ch) {
      const [x, y] = k.split(',').map(Number);
      out.push({ x, y });
    }
    return out;
  }

  private linkCells(): Set<string> {
    const s = new Set<string>();
    const links = this.sim.game.scenes[this.sim.scene].links;
    for (let l = 0; l < MAXSCENELINKS; l++) if (links[l] && links[l].toScene !== NOSCENE) s.add(`${links[l].from.x},${links[l].from.y}`);
    return s;
  }

  /**
   * Whether a step from (x, y) toward d can be taken (as far as the grid goes), and what it
   * costs. Timed things count as passable at a price (the bot waits for them).
   */
  private edge(x: number, y: number, d: Dir, goal: Pt, links: Set<string>): { cost: number; to: Pt } | undefined {
    const tx = x + STEP[d].x;
    const ty = y + STEP[d].y;
    const name = this.nameAt(tx, ty);
    if (links.has(`${tx},${ty}`) && !(tx === goal.x && ty === goal.y)) return undefined;
    if (name.startsWith('fwall')) return { cost: 1, to: { x: tx, y: ty } };
    if (name === 'trapHidden' || name === 'trapArmed') return { cost: 40, to: { x: tx, y: ty } };
    if (name.startsWith('panel_') || name.startsWith('opener')) return { cost: 6, to: { x: tx, y: ty } };
    if (name.startsWith('riser')) return this.sim.solidAt(tx, ty) ? undefined : { cost: 2, to: { x: tx, y: ty } };
    if (name === 'latch') return this.sim.meter(CTR.keys) > 1 ? { cost: 2, to: { x: tx, y: ty } } : undefined;
    if (name.startsWith('hot')) return { cost: 4, to: { x: tx, y: ty } };
    if (name.startsWith('belt_') || name.startsWith('grease_')) {
      const end = this.slideFrom(x, y, d);
      return end ? { cost: 3, to: end } : undefined;
    }
    const shown = this.sim.shown(tx, ty);
    if (shown.solid & SIDE[d]) return undefined;
    return { cost: 1, to: { x: tx, y: ty } };
  }

  /** Where a step from (x, y) toward d onto a belt or greased boards ends up (once tried). */
  private slideFrom(x: number, y: number, d: Dir): Pt | undefined {
    const key = `${x},${y},${d}`;
    if (!this.slides.has(key)) {
      this.want.add(key);
      return undefined;
    }
    return this.slides.get(key) ?? undefined;
  }
  private want = new Set<string>();

  /** Tries the slide on a copy of the game: Doc Leo put at (x, y), one step toward d. */
  private async trySlide(key: string): Promise<void> {
    const [xs, ys, d] = key.split(',') as [string, string, Dir];
    const snap = this.sim.snapshot();
    const w = this.sim.w;
    w.chr.x[0] = Number(xs);
    w.chr.y[0] = Number(ys);
    w.chr.x[1] = 0;
    w.chr.y[1] = 0;
    w.ci.gravx = w.ci.gravy = 0;
    let end: Pt | null = null;
    const r = await this.stepRaw(d);
    let still = 0;
    let last = '';
    for (let i = 0; i < 120 && !r; i++) {
      const p = this.sim.pos;
      const k = `${p.x},${p.y},${p.sx},${p.sy}`;
      still = k === last && this.sim.ci.gravx === 0 && this.sim.ci.gravy === 0 ? still + 1 : 0;
      last = k;
      if (still >= 3) break;
      if (await this.sim.tick()) break;
    }
    const p = this.sim.pos;
    if (!r && this.sim.scene === snap.scene && p.sx === 0 && p.sy === 0) end = { x: p.x, y: p.y };
    this.sim.restore(snap);
    this.slides.set(key, end);
  }

  /** Shortest path (as a list of steps: direction and where it lands) to the goal. */
  async path(goal: Pt): Promise<{ d: Dir; to: Pt }[] | undefined> {
    for (let pass = 0; pass < 8; pass++) {
      this.want.clear();
      const r = this.search(goal);
      if (!this.want.size) return r;
      for (const k of [...this.want]) await this.trySlide(k);
    }
    return this.search(goal);
  }

  private search(goal: Pt): { d: Dir; to: Pt }[] | undefined {
    const { x: sx, y: sy } = this.sim.pos;
    const links = this.linkCells();
    const key = (p: Pt) => p.y * MLEN + p.x;
    const dist = new Map<number, number>([[key({ x: sx, y: sy }), 0]]);
    const from = new Map<number, { prev: number; d: Dir; to: Pt }>();
    const open: [number, Pt][] = [[0, { x: sx, y: sy }]];
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [dd, p] = open.splice(bi, 1)[0];
      if (dd > (dist.get(key(p)) ?? Infinity)) continue;
      if (p.x === goal.x && p.y === goal.y) {
        const out: { d: Dir; to: Pt }[] = [];
        let k = key(p);
        while (from.has(k)) {
          const f = from.get(k)!;
          out.unshift({ d: f.d, to: f.to });
          k = f.prev;
        }
        return out;
      }
      for (const d of DIRS) {
        const e = this.edge(p.x, p.y, d, goal, links);
        if (!e) continue;
        const nd = dd + e.cost;
        const k = key(e.to);
        if (nd < (dist.get(k) ?? Infinity)) {
          dist.set(k, nd);
          from.set(k, { prev: key(p), d, to: e.to });
          open.push([nd, e.to]);
        }
      }
    }
    return undefined;
  }

  /** One tick, and a squawk when a mouse or a Redcoat is in front. */
  async tick(): Promise<string | undefined> {
    return this.sim.tick();
  }

  async wait(n: number): Promise<string | undefined> {
    for (let i = 0; i < n; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /** Monsters that a squawk would send off, within `reach` blocks the way Doc Leo faces. */
  private squawkable(reach = 3): boolean {
    const w = this.sim.w;
    const { netx, nety } = w.ci;
    const p = this.sim.pos;
    const mons = this.room().mons;
    return w.mm.some((m, i) => {
      if (m.monnum >= 64) return false;
      const name = mons.names[m.monnum] ?? '';
      if (!(name === 'mouse' || (name.startsWith('redcoat') && !name.includes('~run')))) return false;
      const dx = w.mi[i].curx[0] - p.x;
      const dy = w.mi[i].cury[0] - p.y;
      if (netx > 0) return dx > 0 && dx <= reach && Math.abs(dy) === 0;
      if (netx < 0) return dx < 0 && -dx <= reach && Math.abs(dy) === 0;
      if (nety > 0) return dy > 0 && dy <= reach && Math.abs(dx) === 0;
      if (nety < 0) return dy < 0 && -dy <= reach && Math.abs(dx) === 0;
      return false;
    });
  }

  async squawk(): Promise<string | undefined> {
    this.squawks++;
    this.lastSquawk = this.sim.ticks;
    this.sim.press(SCAN.space);
    let r = await this.tick();
    this.sim.release(SCAN.space);
    for (let i = 0; i < 20 && !r && this.sim.w.chr.cseq !== 0; i++) r = await this.tick();
    return r;
  }

  /** One step (press, a tick, release, then until he stands still again). */
  private async stepRaw(d: Dir | undefined, waitTicks = 3): Promise<string | undefined> {
    if (!d) return this.wait(waitTicks);
    this.sim.press(SCAN[d]);
    let r = await this.tick();
    this.sim.release(SCAN[d]);
    for (let i = 0; i < 60 && !r; i++) {
      const p = this.sim.pos;
      if (this.sim.w.chr.cseq === 0 && p.sx === 0 && p.sy === 0 && this.sim.ci.gravx === 0 && this.sim.ci.gravy === 0) break;
      r = await this.tick();
    }
    return r;
  }

  /** Hit points (and lives) a choice costs over the next stretch, tried on a copy. */
  private async trial(d: Dir | undefined, then: Dir | undefined): Promise<number> {
    const snap = this.sim.snapshot();
    const hp = this.sim.ci.hitpts;
    const lives = this.sim.ci.lives;
    const deaths = this.sim.deaths;
    let r = await this.stepRaw(d, 4);
    if (!r && then) r = await this.stepRaw(then);
    if (!r) r = await this.wait(4);
    const lost = (this.sim.deaths > deaths ? 1000 : 0) + (lives - this.sim.ci.lives) * 1000 + Math.max(0, hp - this.sim.ci.hitpts);
    this.sim.restore(snap);
    return lost;
  }

  /**
   * Walks to (x, y). Returns 'link' when a link was taken on the way (the goal itself is
   * usually one), undefined on arrival.
   */
  async goto(x: number, y: number, label: string, limit = 3000): Promise<string | undefined> {
    const goal = { x, y };
    const scene = this.sim.scene;
    let waited = 0;
    for (let n = 0; n < limit; n++) {
      if (this.sim.scene !== scene) return 'link';
      const p = this.sim.pos;
      if (p.x === x && p.y === y) return undefined;
      const path = await this.path(goal);
      if (!path || !path.length) {
        const r = await this.wait(6);
        if (r) return r;
        if (++waited > 200) throw new Error(`${label}: no way from ${p.x},${p.y} to ${x},${y}\n${this.log.slice(-6).join('\n')}`);
        continue;
      }
      const first = path[0];
      // a mouse or a Redcoat in front: squawk first
      if (this.sim.ticks - this.lastSquawk > 10 && this.squawkable()) {
        const r = await this.squawk();
        if (r) return r === 'dead' ? 'dead' : r;
        continue;
      }
      // the next cell shut (a panel, an opener, ice)? wait for it
      const tx = p.x + STEP[first.d].x;
      const ty = p.y + STEP[first.d].y;
      const nm = this.nameAt(tx, ty);
      if ((nm.startsWith('panel_') || nm.startsWith('opener')) && this.sim.solidAt(tx, ty)) {
        const r = await this.wait(2);
        if (r) return r;
        continue;
      }
      let move: Dir | undefined = first.d;
      if (!this.bold) {
        const then = path[1]?.d;
        let least = await this.trial(first.d, then);
        if (least > 0) {
          for (const o of [undefined, ...DIRS.filter((x) => x !== first.d)] as (Dir | undefined)[]) {
            const lost = await this.trial(o, o ? undefined : first.d);
            if (lost < least) (least = lost), (move = o);
            if (lost === 0) break;
          }
        }
        waited = move ? 0 : waited + 1;
        if (!move && waited > 40) (move = first.d), (waited = 0);
      }
      if (process.env.BOT_DEBUG === '2') console.log(`  ${label} at ${p.x},${p.y} -> ${move ?? 'wait'} (path ${path.length})`);
      const r = await this.stepRaw(move, 3);
      if (r === 'dead') this.say(`${label}: died`);
      if (r && r !== 'dead') return r;
    }
    throw new Error(`${label}: gave up going to ${x},${y}\n${this.log.slice(-6).join('\n')}`);
  }

  /** Picks up what he is standing on (Enter). */
  async pickup(): Promise<void> {
    this.sim.press(SCAN.enter);
    await this.tick();
    this.sim.release(SCAN.enter);
    await this.wait(8);
  }

  snapshot() {
    return { sim: this.sim.snapshot(), log: this.log.length, squawks: this.squawks };
  }

  restore(s: ReturnType<Bot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.log.length = s.log;
    this.squawks = s.squawks;
  }
}
