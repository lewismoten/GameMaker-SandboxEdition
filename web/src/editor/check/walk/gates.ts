// Locked doors and their keys, as the engine has them (engine/touch.ts doBlockTouchChar): a
// block that takes from money (3) or a special counter (20-29) refuses its touch while that
// would leave the counter at 0 or less, so a solid one that turns into another block when
// touched is a door that opens only for a counter high enough. Whatever adds to that counter (a
// block on the map, a monster whose picture's block does) is its key. The walkthrough bot reads
// a scene's live map for them (fetchKeys.ts: fetch what the doors still shut need, then go on),
// and says plainly which door it couldn't open and why.
import type { Block } from '../../../formats/blocks';
import { MLEN, MWID } from '../../../formats/map';
import { INF_REPEAT, LASTMM, LASTMON, type World } from '../../../engine/world';

/** A locked door: its cells (touching blocks of one kind side by side are one door), the counter it reads and what it takes. */
export interface Gate {
  cells: number[];
  block: number;
  counter: number;
  takes: number;
}

/** What adds to a counter: a block on the map or a monster, where it is now. */
interface Source {
  cell: number;
  counter: number;
  monster?: boolean;
}

/** A block that refuses its touch while its counter is short, and opens (turns into another block) when it takes. */
export const isGate = (b: Block | undefined, n: number): boolean =>
  !!b && b.solid !== 0 && (b.effect >= 20 || b.effect === 3) && b.eamt < 0 && b.touchBl !== n;

/** The scene's locked doors still shut, from the map as it is (block numbers as drawn: blkmap). */
export function gatesOf(map: ArrayLike<number>, bg: Block[], shown: (n: number) => number = (n) => n): Gate[] {
  const seen = new Uint8Array(MLEN * MWID);
  const out: Gate[] = [];
  for (let c = 0; c < MLEN * MWID; c++) {
    const n = shown(map[c]);
    if (seen[c] || !isGate(bg[n], n)) continue;
    // a door two blocks tall (or a wall of them) is touched together: one door
    const cells: number[] = [];
    const todo = [c];
    seen[c] = 1;
    while (todo.length) {
      const k = todo.pop()!;
      cells.push(k);
      const x = k % MLEN;
      for (const j of [k - MLEN, k + MLEN, x > 0 ? k - 1 : -1, x < MLEN - 1 ? k + 1 : -1])
        if (j >= 0 && j < MLEN * MWID && !seen[j] && shown(map[j]) === n) {
          seen[j] = 1;
          todo.push(j);
        }
    }
    out.push({ cells, block: n, counter: bg[n].effect, takes: -bg[n].eamt });
  }
  return out;
}

/** Map cells and monsters that add to one of `counters`. */
export function sourcesOf(map: ArrayLike<number>, bg: Block[], counters: ReadonlySet<number>, monsters: Source[] = [], shown: (n: number) => number = (n) => n): Source[] {
  const out: Source[] = [];
  for (let c = 0; c < MLEN * MWID; c++) {
    const b = bg[shown(map[c])];
    if (b && counters.has(b.effect) && b.eamt > 0) out.push({ cell: c, counter: b.effect });
  }
  return [...out, ...monsters.filter((m) => counters.has(m.counter))];
}

/** Monsters on the go now that add to a counter when touched (their picture's block does). */
function liveMonsterSources(w: World): Source[] {
  const out: Source[] = [];
  for (let l = 0; l < LASTMM; l++) {
    const mm = w.mm[l];
    if (mm.monnum >= LASTMON) continue;
    const m = w.mon[mm.monnum];
    const adds = new Set<number>();
    for (const [p] of m?.pic ?? []) {
      const b = p < 100 ? w.mblk[p] : undefined;
      if (b && (b.effect >= 20 || b.effect === 3) && b.eamt > 0) adds.add(b.effect);
    }
    const mi = w.mi[l];
    for (const counter of adds) out.push({ cell: (mi.cury[0] % MWID) * MLEN + (mi.curx[0] % MLEN), counter, monster: true });
  }
  return out;
}

/** What the scene still holds shut, and what the hero would have to fetch to open it all. */
export interface Locks {
  gates: Gate[];
  /** Counters too short for the doors still shut that something in the scene adds to: worth fetching. */
  wanted: Set<number>;
  /** Where those counters are added to. */
  sources: Source[];
  /** Counters too short for a door that nothing in the scene adds to (the hero can only bring them in). */
  missing: Set<number>;
}

/**
 * The doors still shut on the live map and what they need. A counter is short while what the
 * hero has can't pay every door that reads it one after another (the engine keeps one over:
 * a door taking 1 needs 2); an unlimited counter is never short.
 */
export function locksOf(w: World): Locks {
  const shown = (n: number) => w.blkmap[n] ?? n;
  const gates = gatesOf(w.map, w.bg, shown);
  const owed = new Map<number, number>();
  for (const g of gates) owed.set(g.counter, (owed.get(g.counter) ?? 0) + g.takes);
  const short = new Set<number>();
  for (const [c, total] of owed) {
    const has = w.ci.meter[c] ?? 0;
    if (has !== INF_REPEAT && has <= total) short.add(c);
  }
  const sources = sourcesOf(w.map, w.bg, short, liveMonsterSources(w), shown);
  const wanted = new Set(sources.map((s) => s.counter));
  const missing = new Set([...short].filter((c) => !wanted.has(c) && gates.some((g) => g.counter === c && (w.ci.meter[c] ?? 0) + -g.takes <= 0)));
  return { gates, wanted, sources, missing };
}

/** A counter's name as the editor shows it. */
export const counterName = (c: number): string => (c === 3 ? 'money' : `counter ${c}`);

/** Says which door the bot couldn't open and why, in a sentence (undefined: no door it couldn't open). */
export function lockedWhy(l: Locks, unreached: ReadonlySet<number> = new Set()): string | undefined {
  const at = (cell: number) => `(${cell % MLEN}, ${Math.floor(cell / MLEN)})`;
  for (const c of l.missing) {
    const g = l.gates.find((x) => x.counter === c)!;
    return `The door at ${at(g.cells[0])} needs ${counterName(c)}: nothing in this scene adds to it.`;
  }
  for (const c of unreached) {
    const g = l.gates.find((x) => x.counter === c);
    const s = l.sources.find((x) => x.counter === c);
    if (g && s) return `The door at ${at(g.cells[0])} needs ${counterName(c)}: the bot couldn’t reach what adds to it (first at ${at(s.cell)}).`;
  }
  return undefined;
}
