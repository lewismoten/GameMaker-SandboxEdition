// What counts as loot in Quest for the Round Tuit, and a watcher that counts the loot play saw
// on screen and left behind. Loot is a background block that gives gold, hit points, score or a
// tonic when touched (the dungeons' chests and heart pots, the Flats' fuel cans), never the felt
// egg, a shop counter (it takes gold first) or a conversation's reward scene; and a gem, ruby or
// heart a foe leaves behind. tools/loot.ts reports a run; the bot (tools/bot.ts) grabs what it
// sees on the way.
import { onscrn } from '../../../web/src/engine/touch';
import type { GameSim } from '../../kit/gameSim';
import { BLK, MON } from '../src/ids';
import about from '../about.json';

/** Monsters Pip collects by walking over them. */
export const LOOT_MONS: ReadonlySet<number> = new Set([MON.gem, MON.bigGem, MON.heart]);

/** Whether a scene's own block b (as the map has it) is loot. */
export function isLootBlock(sim: GameSim, b: number): boolean {
  if (b === BLK.egg) return false;
  const B = sim.w.bg[b];
  if (!B || B.touchBl === b) return false;
  // a quest thing (the foghorn, a piece, the Tome) is the quest's business
  if (B.effect >= 20) return false;
  // money, lives and the sequence counters (tonics, kazoo notes), but no quest counters (20..29)
  const gives = (B.effect === 3 || B.effect === 1 || (B.effect >= 5 && B.effect <= 19)) && B.eamt > 0;
  // a block that takes something first is a shop or a gate
  if (B.eamt < 0) return false;
  return gives || B.chHitPt > 0 || B.scorePts > 0;
}

/** Whether map cell (x, y) holds the tin heart or the painted Easter egg (about.json): finds for players, not loot. */
export function isKeepsake(sim: GameSim, x: number, y: number): boolean {
  const map = sim.game.scenes[sim.scene].files[1];
  return [about.tinHeart, about.easterEgg].some((k) => map === k.map && x === k.at[0] && y === k.at[1]);
}

/** Whether a scene has loot worth looking for (not a conversation's pass-through scene). */
export function lootScene(sim: GameSim): boolean {
  return sim.game.scenes[sim.scene].files[1] !== 'pass.map';
}

/** Whether map cell (x, y) is (at least partly) in the 320x200 view. */
export function cellOnScreen(sim: GameSim, x: number, y: number): boolean {
  const p = { x: 0, y: 0 };
  onscrn(sim.w, x, y, p);
  return p.x > -20 && p.x < 320 && p.y > -20 && p.y < 200;
}

/** A monster slot's position in blocks (fractional). */
export function monPos(sim: GameSim, i: number): { x: number; y: number } {
  const mi = sim.w.mi[i];
  return { x: mi.curx[0] + mi.curx[1] / 20, y: mi.cury[0] + mi.cury[1] / 20 };
}

/** Whether Pip (one block) overlaps a monster at (mx, my). */
export function pipTouches(sim: GameSim, mx: number, my: number): boolean {
  const c = sim.w.chr;
  const px = c.x[0] + c.x[1] / 20;
  const py = c.y[0] + c.y[1] / 20;
  let dx = mx - px;
  let dy = my - py;
  if (dx > 50) dx -= 100;
  if (dx < -50) dx += 100;
  if (dy > 50) dy -= 100;
  if (dy < -50) dy += 100;
  return Math.abs(dx) < 1.05 && Math.abs(dy) < 1.05;
}

interface Seen {
  what: string;
  seen: boolean;
  taken: boolean;
}

/** Counts, scene visit by scene visit, the loot that was on screen and whether play took it. */
export class LootWatch {
  /** Finished visits: scene name, loot seen, loot left. */
  visits: { scene: string; seen: number; left: string[] }[] = [];
  private cells = new Map<string, Seen & { b: number }>();
  private mons = new Map<number, Seen & { num: number; x: number; y: number }>();
  private gone: Seen[] = [];
  private visit = -1;
  private deaths = 0;

  constructor(readonly sim: GameSim) {
    const tick = sim.tick.bind(sim);
    sim.tick = async () => {
      const r = await tick();
      this.observe();
      return r;
    };
    this.observe();
  }

  private finish(): void {
    if (this.visit < 0) return;
    const all = [...this.cells.values(), ...this.mons.values(), ...this.gone].filter((s) => s.seen);
    const scene = this.sceneName;
    if (all.length) this.visits.push({ scene, seen: all.length, left: all.filter((s) => !s.taken).map((s) => s.what) });
    this.cells.clear();
    this.mons.clear();
    this.gone = [];
  }

  private sceneName = '';

  /** Call after every tick (the constructor wraps sim.tick to do it). */
  observe(): void {
    const sim = this.sim;
    const visit = sim.segments.length;
    if (visit !== this.visit || sim.deaths !== this.deaths) {
      // a new scene (or the same one again after a death: the map starts over)
      if (visit !== this.visit) this.finish();
      else {
        this.cells.clear();
        this.mons.clear();
        this.gone = [];
      }
      this.visit = visit;
      this.deaths = sim.deaths;
      this.sceneName = sim.game.scenes[sim.scene].desc;
      if (!lootScene(sim)) return;
      for (let y = 0; y < 100; y++)
        for (let x = 0; x < 100; x++) {
          const b = sim.blockAt(x, y);
          if (isLootBlock(sim, b) && !isKeepsake(sim, x, y)) this.cells.set(`${x},${y}`, { b, what: `block ${b} at ${x},${y}`, seen: false, taken: false });
        }
    }
    if (!lootScene(sim) || sim.ended) return;
    for (const [k, c] of this.cells) {
      const [x, y] = k.split(',').map(Number);
      if (sim.blockAt(x, y) !== c.b) c.taken = true;
      else if (cellOnScreen(sim, x, y)) c.seen = true;
    }
    const w = sim.w;
    for (const [i, m] of this.mons) {
      if (w.mm[i].monnum === m.num && w.mi[i].fromchar === 0) continue;
      // gone: taken if Pip stood on it
      m.taken = pipTouches(sim, m.x, m.y);
      this.gone.push(m);
      this.mons.delete(i);
    }
    w.mm.forEach((s, i) => {
      if (!LOOT_MONS.has(s.monnum) || w.mi[i].fromchar) return;
      const p = monPos(sim, i);
      let m = this.mons.get(i);
      if (!m) this.mons.set(i, (m = { num: s.monnum, what: `${s.monnum === MON.heart ? 'heart' : s.monnum === MON.gem ? 'gem' : 'ruby'} near ${Math.round(p.x)},${Math.round(p.y)}`, x: p.x, y: p.y, seen: false, taken: false }));
      m.x = p.x;
      m.y = p.y;
      if (cellOnScreen(sim, Math.floor(p.x), Math.floor(p.y))) m.seen = true;
    });
  }

  /** Ends the last visit and returns the counts. */
  done(): { seen: number; left: number } {
    this.finish();
    this.visit = -1;
    return { seen: this.visits.reduce((a, v) => a + v.seen, 0), left: this.visits.reduce((a, v) => a + v.left.length, 0) };
  }
}
