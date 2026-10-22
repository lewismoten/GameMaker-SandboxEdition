// A play-testing bot for GameSim: finds its way across a scene with a shortest-path search
// (solid blocks, pits and the void are out; a gate it holds the lens for is in), rolls it one
// straight run at a time, and fires at whatever wireframe, jaggy or double gets in its way.
import { GameSim } from './sim';
import { MAXSCENELINKS, NOSCENE } from '../../../web/src/formats/game';
import { MON } from '../src/ids';
import { INF_REPEAT } from '../../../web/src/formats/character';

type Pt = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';
const STEP: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export const SCAN = { up: 72, down: 80, left: 75, right: 77, enter: 28, space: 57 } as const;

/** Monsters worth a shot. */
const FOES = new Set<number>([MON.wire, MON.wireH, MON.wireV, MON.jaggy, MON.jaggyV, MON.mirror, MON.bat, MON.count1, MON.count2, MON.count3, MON.count4, MON.count5, MON.steam]);

export class Bot {
  log: string[] = [];
  shots = 0;
  private lastShot = -100;
  private firing = false;
  /** Cells to keep off (a monster's beat). */
  avoid = new Map<string, number>();
  /** Cells a detour for loot must keep out of (the two-way mirror and the felt egg's room). */
  forbid = new Set<string>();
  /** Loot tried and given up on (a monster in the way), by scene and cell. */
  private passed = new Set<string>();
  constructor(readonly sim: GameSim) {}

  snapshot() {
    return { sim: this.sim.snapshot(), lastShot: this.lastShot, firing: this.firing, shots: this.shots, log: this.log.length };
  }

  restore(s: ReturnType<Bot['snapshot']>): void {
    this.sim.restore(s.sim);
    this.lastShot = s.lastShot;
    this.firing = s.firing;
    this.shots = s.shots;
    this.log.length = s.log;
  }

  /** A foe in front of Ray (the way he last rolled), close and in line: fire. */
  private async defend(): Promise<void> {
    const { sim } = this;
    if (this.firing) {
      sim.release(SCAN.space);
      this.firing = false;
      return;
    }
    if (sim.ticks - this.lastShot < 8) return;
    const w = sim.w;
    const px = sim.pos.x * 20 + sim.pos.sx;
    const py = sim.pos.y * 20 + sim.pos.sy;
    const { netx, nety } = sim.ci;
    const aimed = w.mm.some((m, i) => {
      if (!FOES.has(m.monnum)) return false;
      const mx = w.mi[i].curx[0] * 20 + w.mi[i].curx[1];
      const my = w.mi[i].cury[0] * 20 + w.mi[i].cury[1];
      const dx = mx - px;
      const dy = my - py;
      if (Math.abs(netx) >= Math.abs(nety)) return netx !== 0 && Math.sign(dx) === Math.sign(netx) && Math.abs(dx) < 110 && Math.abs(dy) < 14;
      return nety !== 0 && Math.sign(dy) === Math.sign(nety) && Math.abs(dy) < 110 && Math.abs(dx) < 14;
    });
    if (!aimed) return;
    sim.press(SCAN.space);
    this.firing = true;
    this.lastShot = sim.ticks;
    this.shots++;
  }

  async tick(): Promise<string | undefined> {
    const r = await this.sim.tick();
    if (r) {
      this.firing = false;
      this.lastShot = -100;
      return r;
    }
    await this.defend();
    return undefined;
  }

  say(s: string): void {
    const p = this.sim.pos;
    this.log.push(`[${this.sim.scene}] ${s} @${p.x},${p.y} t${this.sim.ticks} hp ${this.sim.ci.hitpts} score ${this.sim.ci.score}`);
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

  /** What rolling onto (x, y) costs, or undefined where Ray can't (or mustn't) go. */
  cost(x: number, y: number): number | undefined {
    const b = this.sim.shown(x, y);
    if (b.chHitPt <= -100) return undefined;
    // slopes carry Ray off; only ride them on purpose
    if (b.grav) return undefined;
    if (b.solid) {
      // a gate opens for a counter that can pay for it
      if (b.effect >= 20 && b.eamt < 0) {
        const m = this.sim.meter(b.effect);
        if (m !== INF_REPEAT && m + b.eamt > 0) return 2;
      }
      return undefined;
    }
    return 1 + (this.avoid.get(`${x},${y}`) ?? 0);
  }

  /** A detour's cost: never through a gate (it would spend a lens), anything that hurts or the egg's room. */
  private safeCost(x: number, y: number): number | undefined {
    if (this.forbid.has(`${x},${y}`)) return undefined;
    const b = this.sim.shown(x, y);
    if (b.solid || b.chHitPt < 0) return undefined;
    return this.cost(x, y);
  }

  path(tx: number, ty: number, start: Pt = this.sim.pos, careful = false): Pt[] | undefined {
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
        const c = careful ? this.safeCost(nx, ny) : this.cost(nx, ny);
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

  /** Holds a direction until Ray sits exactly on (x, y). */
  private async run(dir: Dir, x: number, y: number, maxTicks = 400): Promise<string | undefined> {
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

  /** Rolls to (x, y). Returns 'link'/'dead'/'end' when the scene changes on the way. */
  async goto(x: number, y: number, label = '', opts: { loot?: boolean; careful?: boolean } = {}): Promise<string | undefined> {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (opts.loot) await this.grabLoot(x, y);
      let steps = this.path(x, y, this.sim.pos, opts.careful);
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
        if (opts.loot && i < steps.length) {
          await this.grabLoot(x, y);
          const p = this.sim.pos;
          if (p.x !== cur.x || p.y !== cur.y) {
            const again = this.path(x, y);
            if (!again) throw new Error(`No path to ${x},${y} ${label} after picking up loot in scene ${this.sim.scene}`);
            steps = again;
            i = 0;
            cur = p;
          }
        }
      }
      if (!blocked) {
        if (label) this.say(`at ${label}`);
        return undefined;
      }
      this.say(`blocked on the way to ${label}`);
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

  /** Loot Ray can see (the 16x10 blocks on screen) that rolling over takes: photons, bulbs, lenses. */
  private visibleLoot(): Pt[] {
    const { w } = this.sim;
    const out: Pt[] = [];
    for (let by = 0; by < 10; by++)
      for (let bx = 0; bx < 16; bx++) {
        const x = (w.mx + bx) % 100;
        const y = (w.my + by) % 100;
        const n = this.sim.blockAt(x, y);
        const b = w.bg[n];
        if (!b || b.obj || b.solid || b.touchBl === n || b.chHitPt < 0) continue;
        if (!(b.scorePts > 0 || b.chHitPt > 0 || (b.effect > 0 && b.eamt > 0))) continue;
        if (this.forbid.has(`${x},${y}`) || this.passed.has(`${this.sim.scene}:${x},${y}`)) continue;
        out.push({ x, y });
      }
    return out;
  }

  /**
   * On the way to (tx, ty): picks up what Ray can see when it costs at most `most` extra
   * cells there and back, nearest first, the way a player would; never through a
   * gate, a hurt or the egg's room, and a pickup that costs light or a life is taken back.
   */
  async grabLoot(tx: number, ty: number, most = 10): Promise<void> {
    for (let n = 0; n < 12; n++) {
      const here = this.sim.pos;
      const direct = this.path(tx, ty)?.length;
      if (direct === undefined) return;
      let best: { p: Pt; a: number } | undefined;
      for (const p of this.visibleLoot()) {
        const a = this.path(p.x, p.y, here, true)?.length;
        if (process.env.DEBUG_LOOT && (a === undefined || a > 12)) console.log(`  [${this.sim.scene}] loot ${p.x},${p.y} from ${here.x},${here.y}: ${a ?? 'no path'}`);
        if (a === undefined || a > 12) continue;
        const b = this.path(tx, ty, p)?.length;
        if (b === undefined) continue;
        const extra = a + b - direct;
        if (process.env.DEBUG_LOOT) console.log(`  [${this.sim.scene}] loot ${p.x},${p.y} from ${here.x},${here.y}: ${a} + ${b} - ${direct} = ${extra}`);
        if (extra <= most && (!best || a < best.a)) best = { p, a };
      }
      if (!best) return;
      const { p } = best;
      const start = this.snapshot();
      const hp = this.sim.ci.hitpts;
      const deaths = this.sim.deaths;
      const scene = this.sim.scene;
      const blk = this.sim.blockAt(p.x, p.y);
      let ok = false;
      let why = '';
      try {
        const r = await this.goto(p.x, p.y, '', { careful: true });
        ok = !r && this.sim.scene === scene && this.sim.deaths === deaths && hp - this.sim.ci.hitpts <= 10 && this.sim.blockAt(p.x, p.y) !== blk;
        why = `${r} scene ${this.sim.scene} deaths ${this.sim.deaths - deaths} lost ${hp - this.sim.ci.hitpts} blk ${blk}->${this.sim.blockAt(p.x, p.y)}`;
      } catch (e) {
        why = String(e);
      }
      if (process.env.DEBUG_LOOT && !ok) console.log(`  [${scene}] gave up on ${p.x},${p.y}: ${why}`);
      if (!ok) {
        this.restore(start);
        this.passed.add(`${scene}:${p.x},${p.y}`);
        continue;
      }
      this.say(`picked up loot at ${p.x},${p.y}`);
    }
  }

  /** Taps a direction (turns Ray to face it) without leaving the cell: a step there and back. */
  async face(dir: Dir): Promise<void> {
    const back: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
    const p = this.sim.pos;
    await this.run(dir, p.x + STEP[dir].x, p.y + STEP[dir].y, 10);
    await this.run(back[dir], p.x, p.y, 10);
  }

  /** Rolls onto a slope (dir) and lets it carry Ray until he stops; returns where. */
  async ride(dir: Dir, maxTicks = 300): Promise<{ x: number; y: number }> {
    this.sim.press(SCAN[dir]);
    await this.wait(3);
    this.sim.release(SCAN[dir]);
    let still = 0;
    let last = '';
    for (let t = 0; t < maxTicks && still < 12; t++) {
      const r = await this.tick();
      if (r) throw new Error(`riding: ${r}`);
      const p = this.sim.pos;
      const now = `${p.x},${p.y},${p.sx},${p.sy}`;
      still = now === last ? still + 1 : 0;
      last = now;
    }
    const p = this.sim.pos;
    if (p.sx || p.sy) throw new Error(`stopped between cells at ${p.x},${p.y} +${p.sx},${p.sy}`);
    return p;
  }

  /** The nearest light bulb (a block that gives light when touched), by path. */
  nearestLight(maxSteps = 24): { x: number; y: number } | undefined {
    const { x: sx, y: sy } = this.sim.pos;
    const seen = new Set<number>([sy * 100 + sx]);
    let ring: [number, number][] = [[sx, sy]];
    const links = this.linkCells();
    for (let d = 0; d < maxSteps && ring.length; d++) {
      const next: [number, number][] = [];
      for (const [x, y] of ring)
        for (const s of Object.values(STEP)) {
          const nx = x + s.x;
          const ny = y + s.y;
          const k = ny * 100 + nx;
          if (seen.has(k) || links.has(`${nx},${ny}`)) continue;
          seen.add(k);
          const b = this.sim.shown(nx, ny);
          if (b.chHitPt > 0 && !b.solid && b.touchBl !== this.sim.blockAt(nx, ny)) return { x: nx, y: ny };
          if (this.cost(nx, ny) !== undefined) next.push([nx, ny]);
        }
      ring = next;
    }
    return undefined;
  }

  /** Low on light: fetch the nearest bulb first. */
  async topUp(below = 70): Promise<void> {
    if (this.sim.ci.hitpts >= below) return;
    const b = this.nearestLight();
    if (!b) return;
    const r = await this.goto(b.x, b.y, 'a light bulb');
    if (r) throw new Error(`light bulb: ${r}`);
  }

  /** Pushes against a block (THE CHEZ's charge port) for a while. */
  async push(dir: Dir, ticks: number): Promise<void> {
    this.sim.press(SCAN[dir]);
    await this.wait(ticks);
    this.sim.release(SCAN[dir]);
    await this.wait(2);
  }

  /** Presses Enter to pick up what Ray is on. */
  async pickup(): Promise<void> {
    this.sim.press(SCAN.enter);
    await this.wait(2);
    this.sim.release(SCAN.enter);
    await this.wait(6);
  }
}
