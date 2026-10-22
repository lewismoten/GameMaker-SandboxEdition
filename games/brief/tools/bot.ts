// The play-testing librarian: walks Joe through the library in the headless simulator,
// scene after scene, his counters carried along as PLAYGAME carries them. In a book it
// picks up every word slip (nearest first, by a breadth-first walk around the furniture),
// waiting out shushers and other word-confiscating things, then opens THE END.
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

export interface Recorded {
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
  return !!b && b.solid !== 0;
};

/** Live monsters whose names start with `prefix`, at their nearest cells. */
export function monstersNamed(sim: Sim, names: string[], test: (name: string) => boolean): { x: number; y: number }[] {
  const w = sim.w;
  const out: { x: number; y: number }[] = [];
  w.mm.forEach((m, i) => {
    if (m.monnum >= LASTMON || !test(names[m.monnum] ?? '')) return;
    const mi = w.mi[i];
    out.push({ x: mi.curx[0] + (mi.curx[1] >= 10 ? 1 : 0), y: mi.cury[0] + (mi.cury[1] >= 10 ? 1 : 0) });
  });
  return out;
}

/** The first step of a shortest walk from Joe to any goal cell (goals may be solid: bumped). */
export function firstStep(sim: Sim, goals: { x: number; y: number }[], box: { x0: number; y0: number; x1: number; y1: number }): Dir | undefined {
  const { bx, by } = sim.pos;
  const key = (x: number, y: number) => y * MLEN + x;
  const goal = new Set(goals.map((g) => key(g.x, g.y)));
  if (goal.has(key(bx, by))) return undefined;
  const prev = new Map<number, [number, Dir]>();
  const seen = new Set([key(bx, by)]);
  let q: [number, number][] = [[bx, by]];
  while (q.length) {
    const next: [number, number][] = [];
    for (const [x, y] of q)
      for (const [d, dx, dy] of STEPS) {
        const nx = x + dx;
        const ny = y + dy;
        const k = key(nx, ny);
        if (nx < box.x0 || ny < box.y0 || nx > box.x1 || ny > box.y1 || seen.has(k)) continue;
        if (!goal.has(k) && solidAt(sim, nx, ny)) continue;
        seen.add(k);
        prev.set(k, [key(x, y), d]);
        if (goal.has(k)) {
          let cur = k;
          let dir: Dir = d;
          while (prev.has(cur) && prev.get(cur)![0] !== key(bx, by)) cur = prev.get(cur)![0];
          dir = prev.get(cur)![1];
          return dir;
        }
        next.push([nx, ny]);
      }
    q = next;
  }
  throw new Error(`No way from ${bx},${by} to ${goals.map((g) => `${g.x},${g.y}`).join(' ')}`);
}

export class Bot {
  readonly keys: Recorded[] = [];
  /** Game ticks played in earlier scenes (for a recording that spans scenes). */
  private base = 0;
  sim!: Sim;
  readonly ci: CharInfo = newCharInfo();
  log: string[] = [];

  constructor(
    readonly game: Game,
    readonly areas: Record<string, { area: Area; names: string[] }>,
    readonly chr: import('../../../web/src/formats/character').Character,
    readonly cbl: import('../../../web/src/formats/blocks').Block[],
  ) {}

  /** Enters a scene at `at` (a fresh map, Joe's counters kept). */
  enter(scene: number, at: { x: number; y: number }): void {
    if (this.sim) this.base += this.sim.ticks;
    const s = this.game.scenes[scene];
    const stem = s.files[1].replace(/\.map$/, '');
    const { area, names } = this.areas[stem];
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
    this.scene = scene;
  }

  scene = 0;

  get words(): number {
    return this.ci.meter[CTR.words] - 1;
  }

  async ticks(n: number): Promise<void> {
    for (let i = 0; i < n && this.sim.link < 0; i++) await this.sim.tick();
  }

  /** One step, made when it costs no words (tried on copies of the scene a few ticks ahead). */
  async step(d: Dir, careful: boolean): Promise<void> {
    if (careful) {
      for (let wait = 0; wait < 80; wait++) {
        const trial = cloneSim(this.sim);
        const before = trial.w.ci.meter[CTR.words];
        trial.press(SCAN[d]);
        await trial.tick();
        trial.release(SCAN[d]);
        for (let i = 0; i < 12 && trial.link < 0; i++) await trial.tick();
        if (trial.w.ci.meter[CTR.words] >= before) break;
        await this.ticks(1);
      }
    }
    this.sim.press(SCAN[d]);
    await this.ticks(1);
    this.sim.release(SCAN[d]);
    for (let i = 0; i < 20 && this.sim.w.chr.cseq !== 0 && this.sim.link < 0; i++) await this.ticks(1);
    await this.ticks(1);
  }

  /** Walks to (into) one of the goals until a link is taken or `until` holds. */
  async walk(goals: () => { x: number; y: number }[], box: { x0: number; y0: number; x1: number; y1: number }, until: () => boolean, careful = true, limit = 4000): Promise<void> {
    const start = this.sim.ticks;
    while (this.sim.link < 0 && !until()) {
      if (this.sim.ticks - start > limit) throw new Error(`Stuck in scene ${this.scene} at ${this.sim.pos.bx},${this.sim.pos.by} (${this.words} words)`);
      const g = goals();
      if (!g.length) return;
      const d = firstStep(this.sim, g, box);
      if (!d) {
        await this.ticks(2);
        continue;
      }
      await this.step(d, careful);
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

export function windowBox(ox: number, oy: number) {
  return { x0: ox, y0: oy, x1: ox + 15, y1: oy + 9 };
}
