// A play-testing bot for GameSim: finds its way with a shortest-path search over the blocks
// Pip can stand on, walks it one straight run at a time, and fights whatever comes at him
// (turns to face it with a one-tick step, then swings). It talks by walking into people, buys
// by walking into a counter twice, opens gates by walking into them, and drinks a tonic when
// it's hurt.
import { GameSim } from './sim';
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { POWER, SEQ } from '../src/ids';
import { LOOT_MONS, cellOnScreen, isKeepsake, isLootBlock, lootScene, monPos } from './lootwatch';

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export const SCAN = { up: 72, down: 80, left: 75, right: 77, enter: 28, space: 57, t: 20, z: 44 } as const;

export class Died extends Error {
  constructor() {
    super('Pip died');
  }
}

export class Bot {
  log: string[] = [];
  swings = 0;
  /** Don't fight (the Flats: THE CHEZ just drives). */
  pacifist = false;
  /** Fights only within this many blocks. */
  reach = 2.2;
  /** Grab loot seen on the way (tools/lootwatch.ts) when it's a short detour. */
  loot = false;
  /** In a boss fight: the boss's parts are left to the fight (fight() and walking ignore them). */
  boss = false;
  constructor(readonly sim: GameSim) {}

  say(s: string): void {
    const p = this.sim.pos;
    const sc = this.sim.game.scenes[this.sim.scene].desc;
    this.log.push(`[${sc}] ${s} @${p.x},${p.y} t${this.sim.ticks} gold ${this.sim.money} hp ${this.sim.ci.hitpts} lives ${this.sim.ci.lives}`);
    if (process.env.BOT_LOG) console.log(this.log[this.log.length - 1]);
  }

  /** Foes near Pip: [dx, dy] in blocks (fractional), nearest first. */
  foes(): [number, number][] {
    return this.foeList().map((f) => [f[0], f[1]]);
  }

  /** Foes near Pip: [dx, dy, slot], nearest first. */
  foeList(): [number, number, number][] {
    const w = this.sim.w;
    const c = w.chr;
    const px = c.x[0] + c.x[1] / 20;
    const py = c.y[0] + c.y[1] / 20;
    const out: [number, number, number][] = [];
    w.mm.forEach((m, i) => {
      if (m.monnum >= 64) return;
      const mon = w.mon[m.monnum];
      if (!mon || mon.power <= POWER.drop || mon.power >= POWER.note) return;
      const mi = w.mi[i];
      if (mi.fromchar) return;
      if (this.boss && mon.power >= 100) return;
      // a wight inside the rock can't be reached (a slash dies on the wall)
      if (this.sim.solidAt(mi.curx[0] + (mi.curx[1] > 10 ? 1 : 0), mi.cury[0] + (mi.cury[1] > 10 ? 1 : 0)) && w.mblk[w.mon[m.monnum].pic[0][0]]?.solid === 0)
        return;
      let dx = mi.curx[0] + mi.curx[1] / 20 - px;
      let dy = mi.cury[0] + mi.cury[1] / 20 - py;
      if (dx > 50) dx -= 100;
      if (dx < -50) dx += 100;
      if (dy > 50) dy -= 100;
      if (dy < -50) dy += 100;
      out.push([dx, dy, i]);
    });
    return out.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  }

  /** One game tick. A death throws Died: the scene starts over, and so does what the bot was doing there. */
  async tick(): Promise<string | undefined> {
    const r = await this.sim.tick();
    if (r === 'dead') {
      this.sim.releaseAll();
      this.say('died');
      throw new Died();
    }
    return r;
  }

  /** Runs `fn`, and runs it again from the scene's start if Pip dies (up to `times`). */
  async retry(fn: () => Promise<void>, times = 4): Promise<void> {
    for (let k = 0; ; k++) {
      try {
        await fn();
        return;
      } catch (e) {
        if (!(e instanceof Died) || k >= times) throw e;
      }
    }
  }

  async wait(n: number): Promise<string | undefined> {
    for (let i = 0; i < n; i++) {
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /** Drinks a tonic when low. */
  async heal(): Promise<string | undefined> {
    if (this.sim.ci.hitpts < 50 && this.sim.meter(SEQ.tonic) > 0) {
      this.sim.releaseAll();
      this.sim.press(SCAN.t);
      const r = await this.wait(2);
      this.sim.release(SCAN.t);
      this.say('a tonic');
      return r ?? this.wait(12);
    }
    return undefined;
  }

  /** Whether Pip stands on (any part of) a block that hurts. */
  sore(dx = 0, dy = 0): boolean {
    const c = this.sim.w.chr;
    const px = c.x[0] * 20 + c.x[1] + dx;
    const py = c.y[0] * 20 + c.y[1] + dy;
    for (const x of new Set([Math.floor(px / 20), Math.floor((px + 19) / 20)]))
      for (const y of new Set([Math.floor(py / 20), Math.floor((py + 19) / 20)])) if (this.sim.shown((x + 100) % 100, (y + 100) % 100).chHitPt < 0) return true;
    return false;
  }

  /** Swings at the nearest foe within reach until none is left (or `max` swings). */
  async fight(max = 40): Promise<string | undefined> {
    if (this.pacifist) return undefined;
    for (let k = 0; k < max; k++) {
      const h = await this.heal();
      if (h) return h;
      const f = this.foes()[0];
      if (!f || Math.hypot(f[0], f[1]) > this.reach) return undefined;
      // on spikes: walk on first (the caller plans the way off them)
      if (this.sore()) return undefined;
      // face it: a one-tick step its way (the slash flies the way Pip last stepped)
      const dir: Dir = Math.abs(f[0]) >= Math.abs(f[1]) ? (f[0] > 0 ? 'right' : 'left') : f[1] > 0 ? 'down' : 'up';
      this.sim.releaseAll();
      let r: string | undefined;
      // (never a step that would touch a link: a fight is no reason to leave the room)
      if (!this.stepTouchesLink(dir) && !this.sore(STEP[dir].x * 4, STEP[dir].y * 4)) {
        this.sim.press(SCAN[dir]);
        r = await this.wait(1);
        this.sim.release(SCAN[dir]);
        if (r) return r;
      }
      this.sim.press(SCAN.space);
      r = await this.wait(2);
      this.sim.release(SCAN.space);
      this.swings++;
      if (process.env.BOT_LOG) {
        const t = this.foeList()[0];
        const w = this.sim.w;
        this.say(
          `swing ${dir} at ${f.map((v) => v.toFixed(1))} (${this.foes().length} foes)${t ? ` mon ${w.mm[t[2]].monnum} pow ${w.mon[w.mm[t[2]].monnum].power}` : ''} pip ${w.chr.x}/${w.chr.y}`,
        );
      }
      if (r) return r;
      r = await this.wait(4);
      if (r) return r;
    }
    return undefined;
  }

  /** Whether a 4-pixel step `dir` would put any part of Pip on a link's block. */
  stepTouchesLink(dir: Dir): boolean {
    const c = this.sim.w.chr;
    const px = c.x[0] * 20 + c.x[1] + STEP[dir].x * 4;
    const py = c.y[0] * 20 + c.y[1] + STEP[dir].y * 4;
    const links = this.linkCells();
    for (const x of new Set([Math.floor(px / 20), Math.floor((px + 19) / 20)]))
      for (const y of new Set([Math.floor(py / 20), Math.floor((py + 19) / 20)])) if (links.has(`${(x + 100) % 100},${(y + 100) % 100}`)) return true;
    return false;
  }

  private linkCells(): Set<string> {
    const s = new Set<string>();
    const links = this.sim.game.scenes[this.sim.scene].links;
    for (let l = 0; l < MAXSCENELINKS; l++) if (links[l] && links[l].toScene !== NOSCENE) s.add(`${links[l].from.x},${links[l].from.y}`);
    return s;
  }

  /** Cheapest path (4 directions) to (tx, ty) over standable blocks, round hurtful ones, not through links (but the target). */
  path(tx: number, ty: number, through: Set<string> = new Set()): Pt[] | undefined {
    const { x: sx, y: sy } = this.sim.pos;
    const links = this.linkCells();
    const key = (x: number, y: number) => y * 100 + x;
    const dist = new Map<number, number>([[key(sx, sy), 0]]);
    const prev = new Map<number, number>();
    const open: [number, number, number][] = [[0, sx, sy]];
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [d, x, y] = open.splice(bi, 1)[0];
      if (x === tx && y === ty) break;
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const s of Object.values(STEP)) {
        const nx = (x + s.x + 100) % 100;
        const ny = (y + s.y + 100) % 100;
        const target = nx === tx && ny === ty;
        if (!target && links.has(`${nx},${ny}`)) continue;
        const pass = through.has(`${nx},${ny}`);
        if (!pass && this.sim.solidAt(nx, ny)) continue;
        const shown = this.sim.shown(nx, ny);
        // round what hurts, and round drafts and currents (they push you off your line)
        const hurt = (shown.chHitPt < 0 ? 40 : 0) + (shown.grav ? 12 : 0);
        const nd = d + 1 + hurt;
        if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
          dist.set(key(nx, ny), nd);
          prev.set(key(nx, ny), key(x, y));
          open.push([nd, nx, ny]);
        }
      }
    }
    if (!dist.has(key(tx, ty))) return undefined;
    const out: Pt[] = [];
    let k = key(tx, ty);
    while (k !== key(sx, sy)) {
      out.unshift({ x: k % 100, y: Math.floor(k / 100) });
      k = prev.get(k)!;
    }
    return out;
  }

  /** Holds a direction until Pip stands exactly on (x, y), fighting anything that comes close. */
  private async run(dir: Dir, x: number, y: number, maxTicks = 900, axisOnly = false): Promise<string | undefined> {
    const vert = dir === 'up' || dir === 'down';
    const there = () => {
      const p = this.sim.pos;
      return axisOnly ? (vert ? p.y === y && p.sy === 0 : p.x === x && p.sx === 0) : p.x === x && p.y === y && p.sx === 0 && p.sy === 0;
    };
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
      if (there()) break;
      const near = this.foes()[0];
      // (never stop to fight on something that hurts: spikes cost more than a bite)
      if (!this.pacifist && !this.sore() && near && Math.hypot(near[0], near[1]) < this.reach) {
        const f = await this.fight();
        if (f) return f;
        return 'stuck';
      }
      if (!axisOnly && t % 4 === 3 && !p.sx && !p.sy && this.lootNews()) {
        this.sim.release(scan);
        return 'look';
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
    if (!there()) return 'stuck';
    return this.wait(1);
  }

  /** Off a block's edge: steps onto the nearest whole block (each axis). */
  private async settle(): Promise<string | undefined> {
    for (let k = 0; k < 2; k++) {
      const p = this.sim.pos;
      if (!p.sx && !p.sy) return undefined;
      const back: Dir = p.sx ? (p.sx < 10 ? 'left' : 'right') : p.sy < 10 ? 'up' : 'down';
      const bx = back === 'right' ? p.x + 1 : p.x;
      const by = back === 'down' ? p.y + 1 : p.y;
      // (the other axis's offset stays as it is: run stops on the block, not the exact spot)
      const r = await this.run(back, bx, by, 20, true);
      if (r && r !== 'stuck') return r;
      if (r === 'stuck') return undefined;
    }
    return undefined;
  }

  /** Walks to (x, y). Returns 'link' / 'dead' / 'end' if a scene change happened on the way. */
  async goto(x: number, y: number, label = '', through: Set<string> = new Set()): Promise<string | undefined> {
    const scene = this.sim.scene;
    let detours = 0;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (this.sim.scene !== scene) return 'link';
      // off a block's edge (a fight's one-tick turn leaves him there): settle onto the nearest
      // whole block first, or a straight run the other way never lines up and walks on past
      const s = await this.settle();
      if (s) return s;
      const steps = this.path(x, y, through);
      if (!steps) throw new Error(`No path to ${x},${y} ${label} from ${this.sim.pos.x},${this.sim.pos.y} in ${this.sim.game.scenes[this.sim.scene].desc}`);
      if (!steps.length) return undefined;
      let i = 0;
      let cur = this.sim.pos;
      let blocked = false;
      let looked = false;
      while (i < steps.length) {
        const dx = Math.sign(((steps[i].x - cur.x + 150) % 100) - 50);
        const dy = Math.sign(((steps[i].y - cur.y + 150) % 100) - 50);
        let j = i;
        while (
          j + 1 < steps.length &&
          (steps[j + 1].x - steps[j].x + 100) % 100 === (dx + 100) % 100 &&
          (steps[j + 1].y - steps[j].y + 100) % 100 === (dy + 100) % 100
        )
          j++;
        const dir: Dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
        // loot in sight a few steps off the way: fetch it, then plan the way on from there
        if (this.loot && !this.grabbing && !this.boss) {
          const g = await this.grabLoot(x, y, through);
          if (g === 'took') {
            blocked = looked = true;
            if (++detours < 60) attempt--;
            break;
          }
          if (g) return g;
        }
        const r = await this.run(dir, steps[j].x, steps[j].y);
        if (r === 'look') {
          blocked = looked = true;
          if (++detours < 60) attempt--;
          break;
        }
        if (r === 'stuck') {
          blocked = true;
          break;
        }
        if (r) {
          if (label) this.say(`${label}: ${r}`);
          return r;
        }
        cur = this.sim.pos;
        i = j + 1;
      }
      if (!blocked) {
        if (label) this.say(`at ${label}`);
        return undefined;
      }
      if (looked) continue;
      const r = await this.wait(2);
      if (r) return r;
    }
    throw new Error(`Could not reach ${x},${y} ${label} in ${this.sim.game.scenes[this.sim.scene].desc}`);
  }

  /** Loot on screen not yet fetched or given up on, and the blocks to fetch it from. */
  private lootCands(links: Set<string>): { id: string; ax: number; ay: number; push?: Dir }[] {
    const sim = this.sim;
    if (!lootScene(sim)) return [];
    const visit = `${sim.segments.length}.${sim.deaths}`;
    const cands: { id: string; ax: number; ay: number; push?: Dir }[] = [];
    const free = (x: number, y: number) => !sim.solidAt(x, y) && !links.has(`${x},${y}`) && sim.shown(x, y).chHitPt >= 0;
    for (let dy = -1; dy <= 10; dy++)
      for (let dx = -1; dx <= 16; dx++) {
        const x = (sim.w.mx + dx + 100) % 100;
        const y = (sim.w.my + dy + 100) % 100;
        if (!cellOnScreen(sim, x, y) || !isLootBlock(sim, sim.blockAt(x, y)) || isKeepsake(sim, x, y)) continue;
        const id = `${visit}:b${x},${y}`;
        if (this.tried.has(id)) continue;
        const solid = sim.solidAt(x, y);
        if (!solid) {
          if (free(x, y)) cands.push({ id, ax: x, ay: y });
          continue;
        }
        for (const [d, s] of Object.entries(STEP) as [Dir, Pt][]) {
          const ax = (x - s.x + 100) % 100;
          const ay = (y - s.y + 100) % 100;
          if (free(ax, ay)) cands.push({ id, ax, ay, push: d });
        }
      }
    if (!this.pacifist)
      sim.w.mm.forEach((m, i) => {
        if (!LOOT_MONS.has(m.monnum) || sim.w.mi[i].fromchar) return;
        const p = monPos(sim, i);
        const ax = Math.round(p.x) % 100;
        const ay = Math.round(p.y) % 100;
        const id = `${visit}:m${i}@${ax},${ay}`;
        if (this.tried.has(id) || !cellOnScreen(sim, ax, ay) || !free(ax, ay)) return;
        cands.push({ id, ax, ay });
      });
    return cands;
  }

  /** Where Pip stood when he last weighed each piece of loot up. */
  private weighed = new Map<string, Pt>();

  /** Loot in sight he hasn't weighed up yet (or not since he came a few blocks closer). */
  private lootNews(): boolean {
    if (!this.loot || this.grabbing || this.boss) return false;
    const p = this.sim.pos;
    return this.lootCands(this.linkCells()).some((c) => {
      const w = this.weighed.get(c.id);
      return !w || Math.abs(w.x - p.x) + Math.abs(w.y - p.y) >= 4;
    });
  }

  /** Loot already gone after (or given up on) in this scene visit. */
  private tried = new Set<string>();
  private grabbing = false;

  /**
   * Fetches the loot on screen that's a short detour on the way to (tx, ty): a chest or a pot
   * (walk into it from the next block) or a gem, ruby or heart a foe left (walk onto it). Only
   * what's in view, only a few steps off the way, never round anything that hurts, never through
   * a secret way or into a link, never the felt egg. Returns 'took' after a detour, a scene
   * change if one happened, or undefined when there's nothing worth the walk.
   */
  async grabLoot(tx: number, ty: number, through: Set<string>): Promise<string | undefined> {
    const sim = this.sim;
    const links = this.linkCells();
    const cands = this.lootCands(links);
    if (!cands.length) return undefined;
    const here = sim.pos;
    const fromPip = this.field(here.x, here.y, new Set(), links);
    const fromGoal = this.field(tx, ty, through, links, true);
    const key = (x: number, y: number) => y * 100 + x;
    const base = fromGoal[key(here.x, here.y)];
    let best: (typeof cands)[number] | undefined;
    let bestCost = Infinity;
    for (const c of cands) {
      this.weighed.set(c.id, { x: here.x, y: here.y });
      const a = fromPip[key(c.ax, c.ay)];
      const detour = a + fromGoal[key(c.ax, c.ay)] - base;
      // close by (it's on screen) and only a little out of the way
      if (process.env.LOOT_LOG) this.say(`loot ${c.id} from ${c.ax},${c.ay}: ${a} away, ${detour} out of the way`);
      // a chest is worth a little more of a walk than a gem
      if (a > 14 || detour > (c.id.includes(':b') ? 24 : 16)) continue;
      if (detour < bestCost) {
        bestCost = detour;
        best = c;
      }
    }
    if (!best) return undefined;
    for (const c of cands) if (c.id === best.id) this.tried.add(c.id);
    this.grabbing = true;
    try {
      const r = await this.goto(best.ax, best.ay, process.env.BOT_LOG ? `loot ${best.id}` : '');
      if (r) return r;
      if (best.push) {
        const r2 = await this.push(best.push, 4);
        if (r2) return r2;
      }
    } catch (e) {
      if (e instanceof Died) throw e;
      // no way there after all: leave it
    } finally {
      this.grabbing = false;
    }
    return 'took';
  }

  /** Path costs from (sx, sy) to every block, by path()'s rules (links closed but `open` is the goal's own). */
  private field(sx: number, sy: number, through: Set<string>, links: Set<string>, goal = false): Float64Array {
    const sim = this.sim;
    const dist = new Float64Array(10000).fill(Infinity);
    const start = sy * 100 + sx;
    dist[start] = 0;
    // a bucket queue: costs are small whole numbers
    const buckets: number[][] = [[start]];
    for (let d = 0; d < buckets.length; d++) {
      const b = buckets[d];
      if (!b) continue;
      for (const k of b) {
        if (dist[k] !== d) continue;
        const x = k % 100;
        const y = (k - x) / 100;
        // the goal may be a link; nothing goes on through one
        if (links.has(`${x},${y}`) && !(goal && k === start)) continue;
        for (const s of Object.values(STEP)) {
          const nx = (x + s.x + 100) % 100;
          const ny = (y + s.y + 100) % 100;
          if (!through.has(`${nx},${ny}`) && sim.solidAt(nx, ny)) continue;
          const shown = sim.shown(nx, ny);
          const nd = d + 1 + (shown.chHitPt < 0 ? 40 : 0) + (shown.grav ? 12 : 0);
          const nk = ny * 100 + nx;
          if (nd < dist[nk]) {
            dist[nk] = nd;
            (buckets[nd] ??= []).push(nk);
          }
        }
      }
    }
    return dist;
  }

  /** Walks into a solid block beside Pip (a counter, a gate, a pedestal) for `ticks`. */
  async push(dir: Dir, ticks = 6): Promise<string | undefined> {
    this.sim.press(SCAN[dir]);
    const r = await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    return r ?? this.wait(2);
  }

  /** Talks to whoever stands at (x, y): walks in, plays the talk, comes back. */
  async talk(x: number, y: number, label: string, through?: Set<string>): Promise<void> {
    const scene = this.sim.scene;
    const r = await this.goto(x, y, `talk to ${label}`, through);
    if (r !== 'link') throw new Error(`${label}: no talk (${r})`);
    // the talk scene links straight back on its first tick
    const back = await this.wait(3);
    if (this.sim.scene !== scene) throw new Error(`${label}: did not come back (${back})`);
  }

  /** True in a conversation's pass-through scene. */
  inPass(): boolean {
    return this.sim.game.scenes[this.sim.scene].files[1] === 'pass.map';
  }

  /** Takes a link at (x, y) into another scene (stray talks on the way are played and walked away from). */
  async enter(x: number, y: number, label: string, through?: Set<string>): Promise<void> {
    const start = this.sim.scene;
    for (let k = 0; k < 6; k++) {
      const before = this.sim.trail.length;
      await this.goto(x, y, label, through);
      if (this.sim.trail.length === before) throw new Error(`${label}: no scene change`);
      if (
        this.inPass() &&
        this.sim.game.scenes[start].links.some(
          (l) => l.from.x === x && l.from.y === y && this.sim.game.scenes[l.toScene] === this.sim.game.scenes[this.sim.scene],
        )
      )
        break;
      if (this.inPass()) {
        await this.wait(3);
        if (this.sim.scene === start) continue;
      }
      break;
    }
    this.say(`entered ${this.sim.game.scenes[this.sim.scene].desc}`);
  }
}
