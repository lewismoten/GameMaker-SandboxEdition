// The author's own heat map: where the hero went while the author played this map's scene,
// recorded tick by tick like the bot's (time spent per cell, the first tick reached, deaths),
// kept in the companion file and added to across sessions. Also how it compares with the bot's:
// the Compare view's steps and the coverage line ("You've been to 84% of the places…").
import { MLEN, MWID } from '../../../../formats/map';
import { DIESEQ } from '../../../../formats/character';
import type { World } from '../../../../engine/world';
import { touchedCells } from '../../../check/sim';

const CELLS = MLEN * MWID;

/** The map's companion section the author's heat map is kept in. */
export const MY_HEAT = 'myHeat';

/** What the companion keeps (section "myHeat" of the map): sparse, so a short run stays small. */
export interface MyHeatSaved {
  when: string;
  /** Times the author played and recorded. */
  sessions: number;
  /** Ticks played in all. */
  ticks: number;
  /** [cell, ticks spent, first tick reached in any session] × n. */
  cells: number[];
  /** [cell, deaths] × n. */
  deaths: number[];
}

export interface MyHeat {
  heat: Uint32Array;
  first: Int32Array;
  deaths: Map<number, number>;
  ticks: number;
}

const emptyHeat = (): MyHeat => ({ heat: new Uint32Array(CELLS), first: new Int32Array(CELLS).fill(-1), deaths: new Map(), ticks: 0 });

/** Records a play session from the world it is shown each frame; only ticks that passed count. */
export class HeatRecorder {
  readonly rec = emptyHeat();
  private clock = -1;
  private start = 0;
  private dying = false;
  private readonly touch = new Int32Array(6);

  /** A new visit to the scene: the clock starts over (first ticks count from each entry). */
  enter(): void {
    this.clock = -1;
    this.dying = false;
  }

  frame(w: Pick<World, 'chr' | 'ci' | 'clock'>): void {
    if (this.clock < 0) {
      this.clock = w.clock;
      this.start = w.clock;
    }
    const passed = w.clock - this.clock;
    if (passed <= 0 || passed > 1000) {
      // a new scene restarted the clock: start counting from here
      if (passed < 0 || passed > 1000) this.clock = this.start = w.clock;
      return;
    }
    this.clock = w.clock;
    this.rec.ticks += passed;
    const n = touchedCells(w, this.touch);
    const tick = w.clock - this.start;
    for (let i = 0; i < n; i++) {
      const c = this.touch[i];
      this.rec.heat[c] += passed;
      if (this.rec.first[c] < 0 || tick < this.rec.first[c]) this.rec.first[c] = tick;
    }
    const dying = w.chr.cseq === DIESEQ;
    if (dying && !this.dying) {
      const c = w.chr.y[0] * MLEN + w.chr.x[0];
      this.rec.deaths.set(c, (this.rec.deaths.get(c) ?? 0) + 1);
    }
    this.dying = dying;
  }
}

export function unpackMine(s: MyHeatSaved | undefined): MyHeat {
  const out = emptyHeat();
  if (!s) return out;
  for (let i = 0; i + 2 < s.cells.length; i += 3) {
    out.heat[s.cells[i]] = s.cells[i + 1];
    out.first[s.cells[i]] = s.cells[i + 2];
  }
  for (let i = 0; i + 1 < s.deaths.length; i += 2) out.deaths.set(s.deaths[i], s.deaths[i + 1]);
  out.ticks = s.ticks;
  return out;
}

/** Adds a session's recording to what was kept: time adds up, the earliest first tick stays. */
export function mergeMine(kept: MyHeatSaved | undefined, rec: MyHeat, when = new Date().toISOString()): MyHeatSaved {
  const m = unpackMine(kept);
  for (let c = 0; c < CELLS; c++) {
    if (!rec.heat[c]) continue;
    m.heat[c] += rec.heat[c];
    if (m.first[c] < 0 || rec.first[c] < m.first[c]) m.first[c] = rec.first[c];
  }
  for (const [c, n] of rec.deaths) m.deaths.set(c, (m.deaths.get(c) ?? 0) + n);
  const cells: number[] = [];
  for (let c = 0; c < CELLS; c++) if (m.heat[c]) cells.push(c, m.heat[c], m.first[c]);
  return {
    when,
    sessions: (kept?.sessions ?? 0) + (rec.ticks ? 1 : 0),
    ticks: m.ticks + rec.ticks,
    cells,
    deaths: [...m.deaths].flat(),
  };
}

/** The Compare view's colors: orange and blue tell apart with any color vision, and both is a light gray. */
export const COMPARE_COLORS = ['#ff7a00', '#2f8cff', '#e8e8e8'];

/** The Compare view's steps: 0 neither, 1 only the bot, 2 only the author, 3 both. */
export function compareSteps(bot: Uint8Array, mine: Uint8Array): Uint8Array {
  const out = new Uint8Array(bot.length);
  for (let i = 0; i < bot.length; i++) out[i] = (bot[i] ? 1 : 0) + (mine[i] ? 2 : 0);
  return out;
}

/** Both heat maps as one: the hotter of the two at each cell. */
export function combineSteps(bot: Uint8Array, mine: Uint8Array): Uint8Array {
  const out = new Uint8Array(bot.length);
  for (let i = 0; i < bot.length; i++) out[i] = Math.max(bot[i], mine[i]);
  return out;
}

interface Coverage {
  /** Cells the bot reached. */
  bot: number;
  /** Of those, how many the author came within a block of. */
  covered: number;
  /** Areas the bot reached that the author never came near: each a cell to show, biggest first. */
  missed: { cell: number; size: number }[];
}

/**
 * How much of the bot's ground the author has covered. A bot cell counts as covered when the
 * author's hero touched it or a cell next to it (the hero is a block or two across, so passing
 * by a block lower or to the side is the same place). Uncovered cells are grouped into areas.
 */
export function coverage(bot: Uint8Array, mine: Uint8Array): Coverage {
  const near = new Uint8Array(CELLS);
  for (let c = 0; c < CELLS; c++) {
    if (!mine[c]) continue;
    const x = c % MLEN;
    const y = Math.floor(c / MLEN);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < MLEN && ny < MWID) near[ny * MLEN + nx] = 1;
      }
  }
  let total = 0;
  let covered = 0;
  const open = new Uint8Array(CELLS);
  for (let c = 0; c < CELLS; c++) {
    if (!bot[c]) continue;
    total++;
    if (near[c]) covered++;
    else open[c] = 1;
  }
  const missed: { cell: number; size: number }[] = [];
  const stack: number[] = [];
  for (let c = 0; c < CELLS; c++) {
    if (!open[c]) continue;
    open[c] = 0;
    stack.push(c);
    const area: number[] = [];
    while (stack.length) {
      const k = stack.pop()!;
      area.push(k);
      const x = k % MLEN;
      const y = Math.floor(k / MLEN);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ])
        if (nx >= 0 && ny >= 0 && nx < MLEN && ny < MWID && open[ny * MLEN + nx]) {
          open[ny * MLEN + nx] = 0;
          stack.push(ny * MLEN + nx);
        }
    }
    // the area's middle cell (by reading order) is the one to show
    area.sort((a, b) => a - b);
    missed.push({ cell: area[Math.floor(area.length / 2)], size: area.length });
  }
  missed.sort((a, b) => b.size - a.size);
  return { bot: total, covered, missed };
}

/** The coverage line under the view choice. */
export function coverageText(c: Coverage): string {
  if (!c.bot) return 'Run the check to compare your heat map with the bot’s.';
  const p = Math.floor((c.covered / c.bot) * 100);
  const pct = c.covered && !p ? 'less than 1' : String(p);
  const n = c.missed.length;
  return n
    ? `You’ve been to ${pct}% of the places the bot reached; ${n} area${n === 1 ? '' : 's'} it found that you haven’t.`
    : 'You’ve been everywhere the bot reached.';
}
