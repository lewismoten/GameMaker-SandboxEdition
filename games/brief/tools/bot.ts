// The play-testing librarian: walks Joe through the library in the headless simulator,
// scene after scene, his counters carried along as PLAYGAME carries them. In a book it
// picks up every word slip (nearest first, by the cheapest walk around the furniture, along
// the walks when keepTo is set), waiting out shushers and other word-confiscating things,
// then opens THE END.
import { MLEN } from '../../../web/src/formats/map';
import { LASTMON } from '../../../web/src/formats/monster';
import { newCharInfo, type CharInfo } from '../../../web/src/engine/world';
import type { Game } from '../../../web/src/formats/game';
import type { Area } from '../src/levels/area';
import { CTR } from '../src/ids';
import { Sim } from './sim';

const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d } as const;
type Dir = keyof typeof SCAN;
const STEPS: [Dir, number, number][] = [
  ['up', 0, -1],
  ['down', 0, 1],
  ['left', -1, 0],
  ['right', 1, 0],
];

const BACK: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

interface Recorded {
  tick: number;
  key: number;
}

/** A copy of a running sim, to try a move without making it. */
function cloneSim(sim: Sim): Sim {
  const copy = Object.create(Sim.prototype) as Sim;
  Object.assign(copy, sim);
  const { sound, rand, joystick, ...rest } = sim.w;
  Object.assign(copy, { w: { ...structuredClone(rest), sound, rand, joystick } });
  const priv = copy as unknown as { held: Set<number>; pending: number[]; onKey?: unknown };
  priv.held = new Set((sim as unknown as { held: Set<number> }).held);
  priv.pending = [...(sim as unknown as { pending: number[] }).pending];
  priv.onKey = undefined;
  return copy;
}

const solidAt = (sim: Sim, x: number, y: number) => {
  const w = sim.w;
  const b = w.bg[w.map[y * MLEN + x]];
  if (!b || b.solid === 0) return false;
  // a word lock opens for Joe once he carries enough words (it takes them, then gives them back)
  if (b.effect === CTR.words && b.eamt < 0 && b.eamt > -100 && w.ci.meter[CTR.words] + b.eamt > 0) return false;
  return true;
};

/** Live monsters whose names start with `prefix`, at their nearest cells. */
function monstersNamed(sim: Sim, names: string[], test: (name: string) => boolean): { x: number; y: number }[] {
  const w = sim.w;
  const out: { x: number; y: number }[] = [];
  w.mm.forEach((m, i) => {
    if (m.monnum >= LASTMON || !test(names[m.monnum] ?? '')) return;
    const mi = w.mi[i];
    out.push({ x: mi.curx[0] + (mi.curx[1] >= 10 ? 1 : 0), y: mi.cury[0] + (mi.cury[1] >= 10 ? 1 : 0) });
  });
  return out;
}

/** Cells in the box still holding a word slip (a block named w<value>~<floor>). */
export function wordCells(sim: Sim, area: Area, box: { x0: number; y0: number; x1: number; y1: number }): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = box.y0; y <= box.y1; y++)
    for (let x = box.x0; x <= box.x1; x++) if (/^w\d+~/.test(area.tiles.names[sim.w.map[y * MLEN + x]] ?? '')) out.push({ x, y });
  return out;
}

/** The first step of a shortest walk from Joe to any goal cell (goals may be solid: bumped). */
function firstStep(
  sim: Sim,
  goals: { x: number; y: number }[],
  box: { x0: number; y0: number; x1: number; y1: number },
  avoid: { x: number; y: number }[] = [],
  cost?: (x: number, y: number) => number,
): Dir | undefined {
  if (avoid.length) {
    try {
      return firstStep(sim, goals, box, [], cost) === undefined ? undefined : firstStepAvoiding(sim, goals, box, avoid, cost);
    } catch {
      /* no way around them: walk through */
    }
  }
  return firstStepAvoiding(sim, goals, box, [], cost);
}

/**
 * The cheapest walk's first step; `cost` is a step's extra cost (off the walks). Ties go to the
 * cell found first, so with every step costing the same it is the breadth-first walk.
 */
function firstStepAvoiding(
  sim: Sim,
  goals: { x: number; y: number }[],
  box: { x0: number; y0: number; x1: number; y1: number },
  avoid: { x: number; y: number }[],
  cost?: (x: number, y: number) => number,
): Dir | undefined {
  const blocked = new Set(avoid.map((a) => a.y * MLEN + a.x));
  const { bx, by } = sim.pos;
  const key = (x: number, y: number) => y * MLEN + x;
  const goal = new Set(goals.map((g) => key(g.x, g.y)));
  if (goal.has(key(bx, by))) return undefined;
  const prev = new Map<number, [number, Dir]>();
  const dist = new Map([[key(bx, by), 0]]);
  const done = new Set<number>();
  const open: [number, number][] = [[bx, by]];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (dist.get(key(...open[i]))! < dist.get(key(...open[bi]))!) bi = i;
    const [x, y] = open.splice(bi, 1)[0];
    const k0 = key(x, y);
    if (done.has(k0)) continue;
    done.add(k0);
    if (goal.has(k0)) {
      let cur = k0;
      while (prev.get(cur)![0] !== key(bx, by)) cur = prev.get(cur)![0];
      return prev.get(cur)![1];
    }
    for (const [d, dx, dy] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (nx < box.x0 || ny < box.y0 || nx > box.x1 || ny > box.y1 || done.has(k)) continue;
      if (!goal.has(k) && (solidAt(sim, nx, ny) || blocked.has(k))) continue;
      const nd = dist.get(k0)! + 1 + (cost?.(nx, ny) ?? 0);
      if (nd >= (dist.get(k) ?? Infinity)) continue;
      dist.set(k, nd);
      prev.set(k, [k0, d]);
      open.push([nx, ny]);
    }
  }
  throw new Error(`No way from ${bx},${by} to ${goals.map((g) => `${g.x},${g.y}`).join(' ')}`);
}

export class Bot {
  readonly keys: Recorded[] = [];
  /** Each scene entered, with the game ticks played before it (a walkthrough's segments). */
  readonly entries: { scene: number; base: number; key: number }[] = [];
  /** Game ticks played in earlier scenes (for a recording that spans scenes). */
  private base = 0;
  sim!: Sim;
  readonly ci: CharInfo = newCharInfo();
  log: string[] = [];
  /** The extra cost of a step onto a cell off the walks (kit/walkPaths.ts keepToPaths); unset, every way costs the same. */
  keepTo?: (x: number, y: number) => number;

  constructor(
    readonly game: Game,
    readonly areas: Record<string, { area: Area; names: string[]; hazards: Set<string> }>,
    readonly chr: import('../../../web/src/formats/character').Character,
    readonly cbl: import('../../../web/src/formats/blocks').Block[],
  ) {}

  /** Enters a scene at `at` (a fresh map, Joe's counters kept). */
  enter(scene: number, at: { x: number; y: number }): void {
    if (this.sim) this.base += this.sim.ticks;
    const s = this.game.scenes[scene];
    const stem = s.files[1].replace(/\.map$/, '');
    const { area, names } = this.areas[stem];
    this.stem = stem;
    this.sim = new Sim(
      {
        map: structuredClone(area.done()),
        bbl: area.tiles.build(),
        mbl: area.mb.build(),
        mon: area.mons.build(),
        chr: this.chr,
        cbl: this.cbl,
        links: s.links.map((l) => (l.toScene === 0xffff ? { from: { x: -9, y: -9 }, to: l.to } : l)),
        names,
      },
      at,
      this.ci,
    );
    this.sim.onKey = (key) => this.keys.push({ tick: this.base + this.sim.ticks, key });
    this.entries.push({ scene, base: this.base, key: this.keys.length });
    this.scene = scene;
  }

  scene = 0;
  stem = '';
  private lastTried = '';
  private waited = 0;

  get words(): number {
    return this.ci.meter[CTR.words] - 1;
  }

  async ticks(n: number): Promise<void> {
    for (let i = 0; i < n && this.sim.link < 0; i++) await this.sim.tick();
  }

  /** Plays a move (a direction, or standing still) on a copy: the fines it would collect on the way. */
  private async trial(d: Dir | undefined, ahead = 16): Promise<number> {
    const t = cloneSim(this.sim);
    let lost = 0;
    let last = t.w.ci.score;
    const tick = async () => {
      await t.tick();
      // a fine: a shusher (or scissors, or static...) costs a point a tick
      const now = t.w.ci.score;
      if (now < last) lost += last - now;
      last = now;
    };
    if (d) t.press(SCAN[d]);
    await tick();
    if (d) t.release(SCAN[d]);
    for (let i = 0; i < ahead && t.link < 0; i++) await tick();
    return lost;
  }

  /**
   * One move toward the goal; when careful, a move that collects no fines from a shusher (or
   * scissors, or static...): the step wanted, else standing still, else a sidestep, else
   * whichever loses least.
   */
  async step(d: Dir, careful: boolean): Promise<void> {
    let move: Dir | undefined = d;
    if (careful) {
      // a sidestep out of a patroller's lane before backing off: backing away along the lane
      // it walks only meets it again, up and down for as long as it patrols
      const back = BACK[d];
      const options: (Dir | undefined)[] = [d, undefined, ...STEPS.map((s) => s[0]).filter((x) => x !== d && x !== back), back];
      let least = Infinity;
      const tried: string[] = [];
      for (const o of options) {
        const lost = await this.trial(o);
        tried.push(`${o ?? 'wait'}=${lost}`);
        if (lost < least) ((least = lost), (move = o));
        if (lost === 0) break;
      }
      this.lastTried = tried.join(' ');
    }
    const w0 = this.words;
    // a shusher standing still in the way will not move off: after a while, pay the fine
    this.waited = move ? 0 : this.waited + 1;
    if (!move && this.waited > 30) ((move = d), (this.waited = 0));
    if (!move) {
      await this.ticks(2);
      if (process.env.BOT_DEBUG && this.words < w0)
        console.log(`  wait at ${this.sim.pos.bx},${this.sim.pos.by} words ${w0} -> ${this.words} [${this.lastTried}]`);
      return;
    }
    this.sim.press(SCAN[move]);
    await this.ticks(1);
    this.sim.release(SCAN[move]);
    for (let i = 0; i < 20 && this.sim.w.chr.cseq !== 0 && this.sim.link < 0; i++) await this.ticks(1);
    await this.ticks(1);
    if (process.env.BOT_DEBUG && this.words !== w0)
      console.log(`  ${move} -> ${this.sim.pos.bx},${this.sim.pos.by} words ${w0} -> ${this.words} [${this.lastTried}]`);
  }

  /** Walks to (into) one of the goals until a link is taken or `until` holds. */
  async walk(
    goals: () => { x: number; y: number }[],
    box: { x0: number; y0: number; x1: number; y1: number },
    until: () => boolean,
    careful = true,
    limit = 4000,
  ): Promise<void> {
    const start = this.sim.ticks;
    while (this.sim.link < 0 && !until()) {
      if (this.sim.ticks - start > limit) {
        const g = goals()[0];
        const b = g ? this.sim.w.bg[this.sim.w.map[g.y * MLEN + g.x]] : undefined;
        throw new Error(
          `Stuck in scene ${this.scene} at ${this.sim.pos.bx},${this.sim.pos.by} (${this.words} words)${b ? ` before block ${b.nextBl}/${b.touchBl} effect ${b.effect} ${b.eamt} solid ${b.solid}` : ''}`,
        );
      }
      const g = goals().filter((p) => p.x >= box.x0 && p.y >= box.y0 && p.x <= box.x1 && p.y <= box.y1);
      if (!g.length) return;
      const { names, hazards } = this.areas[this.stem];
      const d = firstStep(
        this.sim,
        g,
        box,
        monstersNamed(this.sim, names, (n) => hazards.has(n)),
        this.keepTo,
      );
      if (!d) return; // standing on a goal
      // dodging a patroller can fall in step with it for good: after a while, walk on and pay
      await this.step(d, careful && this.sim.ticks - start < limit / 2);
    }
  }

  /** Follows the link Joe reached: the next scene, entered where the link says. */
  follow(): number {
    const l = this.game.scenes[this.scene].links[this.sim.link];
    if (!l) throw new Error(`No link taken in scene ${this.scene}`);
    if (l.toScene === 1) return 1;
    this.enter(l.toScene, l.to);
    return l.toScene;
  }
}

/** The monsters that fine Joe (a point a tick, Area.monster's hazards) or confiscate words. */
export function hazardsOf(area: Area): Set<string> {
  return new Set(
    area.mons.names.filter((n, i) => n && area.mons.defs[i].pics.some(([pic]) => (area.mb.def(pic).score ?? 0) < 0 || (area.mb.def(pic).eamt ?? 0) < 0)),
  );
}

export function windowBox(ox: number, oy: number) {
  return { x0: ox, y0: oy, x1: ox + 15, y1: oy + 9 };
}
