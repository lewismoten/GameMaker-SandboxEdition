// The play-testing bot. From above (the library, the road, the square) Joe walks a block a tap,
// so the bot finds a way across the grid (breadth first, around anything solid) and taps it out
// a block at a time; a gate is a cell it may walk into, and a talk or a door is a link it walks
// onto. From the side (the clock tower) it is kit/hopBot.ts: walk to a column, hop, steer, land,
// and wait for a bridge.
import { HopBot, type Result } from '../../kit/hopBot';
import { NOSCENE } from '../../../web/src/formats/game';
import { MLEN } from '../../../web/src/formats/map';
import { ORIGIN, SCAN } from '../src/ids';
import type { GameSim } from './sim';

type Dir = 'up' | 'down' | 'left' | 'right';
const STEPS: [Dir, number, number][] = [
  ['up', 0, -1],
  ['down', 0, 1],
  ['left', -1, 0],
  ['right', 1, 0],
];

export class Bot extends HopBot<GameSim, typeof SCAN> {
  constructor(sim: GameSim) {
    super(sim, { scan: SCAN, origin: ORIGIN, meter: { name: 'wind', n: 0 } });
  }

  /** Joe's cell (map coordinates), when he stands squarely on one. */
  get cell(): { x: number; y: number } {
    const p = this.sim.pos;
    return { x: p.x + (p.sx >= 10 ? 1 : 0), y: p.y + (p.sy >= 10 ? 1 : 0) };
  }

  /** Waits until the walk (or whatever he is doing) is over and he stands still. */
  private async settle(max = 24): Promise<Result> {
    for (let i = 0; i < max; i++) {
      const c = this.sim.w.chr;
      if (c.cseq === 0 && this.sim.pos.sx === 0 && this.sim.pos.sy === 0) return undefined;
      const r = await this.tick();
      if (r) return r;
    }
    return undefined;
  }

  /** One tap of an arrow: one block from above. */
  async tap(d: Dir | 'space'): Promise<Result> {
    this.sim.press(SCAN[d]);
    const r = await this.tick();
    this.sim.release(SCAN[d]);
    if (r) return r;
    return this.settle();
  }

  /** The way from Joe's cell to (x, y), around solid cells (the goal itself may be solid: a gate). */
  route(x: number, y: number, through: (x: number, y: number) => boolean = () => false): Dir[] | undefined {
    const start = this.cell;
    const key = (a: number, b: number) => b * MLEN + a;
    // every link cell but the goal is somewhere not to step: it would leave the scene
    const links = new Set(this.sim.game.scenes[this.sim.scene].links.filter((l) => l.toScene !== NOSCENE).map((l) => key(l.from.x, l.from.y)));
    const prev = new Map<number, [number, Dir]>();
    const seen = new Set([key(start.x, start.y)]);
    const queue = [start];
    while (queue.length) {
      const c = queue.shift()!;
      if (c.x === x && c.y === y) {
        const out: Dir[] = [];
        let k = key(c.x, c.y);
        while (prev.has(k)) {
          const [from, d] = prev.get(k)!;
          out.unshift(d);
          k = from;
        }
        return out;
      }
      for (const [d, dx, dy] of STEPS) {
        const nx = c.x + dx;
        const ny = c.y + dy;
        const k = key(nx, ny);
        if (seen.has(k)) continue;
        const goal = nx === x && ny === y;
        if (!goal && ((this.sim.solidAt(nx, ny) && !through(nx, ny)) || links.has(k))) continue;
        seen.add(k);
        prev.set(k, [key(c.x, c.y), d]);
        queue.push({ x: nx, y: ny });
      }
    }
    return undefined;
  }

  /** A tap that has to dodge something (the parade): tried on a snapshot, and taken only if Joe isn't bumped for a while after. */
  private async carefulTap(d: Dir): Promise<Result> {
    for (let tries = 0; tries < 60; tries++) {
      const snap = this.snapshot();
      const hp = this.sim.ci.hitpts;
      let r = await this.tap(d);
      if (!r) r = await this.wait(10);
      if (r !== 'dead' && this.sim.ci.hitpts >= hp && this.sim.deaths === 0) return r;
      this.restore(snap);
      const rw = await this.wait(3);
      if (rw) return rw;
    }
    return `${d}: never a gap`;
  }

  /**
   * Walks to map cell (x, y) a tap at a time. Returns what play did if it left the scene on the
   * way (a link: a talk, a door), or an error if Joe could not get there.
   */
  async goto(x: number, y: number, label: string, through?: (x: number, y: number) => boolean, careful = false): Promise<Result> {
    const scene = this.sim.scene;
    for (let guard = 0; guard < 400; guard++) {
      const c = this.cell;
      if (c.x === x && c.y === y) {
        this.say(`at ${label}`);
        return undefined;
      }
      const way = this.route(x, y, through);
      if (!way?.length) return `no way to ${label} (${x},${y}) from ${c.x},${c.y} in scene ${scene}`;
      const before = this.cell;
      const r = careful ? await this.carefulTap(way[0]) : await this.tap(way[0]);
      if (r) {
        this.say(`${label}: ${r}`);
        return r;
      }
      const after = this.cell;
      if (before.x === after.x && before.y === after.y && way.length === 1) return `${label}: Joe could not step into ${x},${y}`;
    }
    return `${label}: too many steps`;
  }

  /** Where the scene's monsters of type `monnum` (in its .MON) are, by map cell. */
  monsters(monnum: number): { x: number; y: number }[] {
    const w = this.sim.w;
    const out: { x: number; y: number }[] = [];
    w.mm.forEach((m, i) => {
      if (m.monnum !== monnum) return;
      const mi = w.mi[i];
      out.push({ x: mi.curx[0] + (mi.curx[1] >= 10 ? 1 : 0), y: mi.cury[0] + (mi.cury[1] >= 10 ? 1 : 0) });
    });
    return out;
  }

  /** Walks after every monster of type `monnum` until a touch has caught them all (they leave that type). */
  async chase(monnum: number, label: string): Promise<void> {
    for (let guard = 0; guard < 1500; guard++) {
      const here = this.cell;
      const all = this.monsters(monnum);
      if (!all.length) {
        this.say(`caught every ${label}`);
        return;
      }
      // one standing on a link cell (a talk, the way out) is left until it moves off
      const links = this.sim.game.scenes[this.sim.scene].links.filter((l) => l.toScene !== NOSCENE);
      const left = all.filter((m) => !links.some((l) => l.from.x === m.x && l.from.y === m.y));
      if (!left.length) {
        await this.wait(4);
        continue;
      }
      left.sort((a, b) => Math.abs(a.x - here.x) + Math.abs(a.y - here.y) - (Math.abs(b.x - here.x) + Math.abs(b.y - here.y)));
      const t = left[0];
      if (process.env.BOT_DEBUG && guard % 40 === 0) this.say(`chasing ${label}: ${left.map((m) => `${m.x},${m.y}`).join(' ')}`);
      const way = this.route(t.x, t.y);
      if (!way) throw new Error(`${label}: no way to one at ${t.x},${t.y}`);
      const r = way.length ? await this.tap(way[0]) : await this.wait(2);
      if (r) throw new Error(`${label}: ${r}`);
    }
    throw new Error(`${label}: still not caught`);
  }

  /** Walks onto a link cell and expects to leave the scene for `to` (and not to lose a life). */
  async take(x: number, y: number, to: number, label: string): Promise<void> {
    const r = await this.goto(x, y, label);
    if (r !== 'link') throw new Error(`${label}: ${r ?? 'reached it, but no link was taken'}`);
    if (this.sim.scene !== to) throw new Error(`${label}: went to scene ${this.sim.scene}, not ${to}`);
  }

  /** Comes through a pass scene (a talk, a card, the bell): its link is taken on its first tick. */
  async pass(to: number, label: string): Promise<void> {
    for (let i = 0; i < 4 && this.sim.scene !== to; i++) {
      const r = await this.tick();
      if (r === 'end' || r === 'dead') throw new Error(`${label}: ${r}`);
    }
    if (this.sim.scene !== to) throw new Error(`${label}: stuck in scene ${this.sim.scene}`);
    this.say(label);
  }

  /** The block shown at a drawing cell now (timed blocks change by themselves). */
  showing(x: number, y: number): number {
    const w = this.sim.w;
    return w.blkmap[this.sim.blockAt(x + ORIGIN, y + ORIGIN)];
  }
}
