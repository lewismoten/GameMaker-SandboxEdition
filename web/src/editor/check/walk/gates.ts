// Locked doors and their keys, as the engine has them (engine/touch.ts doBlockTouchChar): a
// block that takes from money (3) or a special counter (20-29) refuses its touch while that
// would leave the counter at 0 or less, so a solid one that turns into another block when
// touched is a door that opens only for a counter high enough. Whatever adds to that counter (a
// block on the map, a monster whose picture's block does, a monster that turns into one when it
// dies, a block that turns into one, maybe for a price in another counter) is its key. Counters
// carry across scenes, so otherScenes.ts names the scenes that add when this one has none. The
// walkthrough bot reads a scene's live map for them (fetchKeys.ts: fetch what the doors still shut
// need, then go on), and says plainly which door it couldn't open and why.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { INF_REPEAT, LASTMM, LASTMON, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';

/** A locked door: its cells (touching blocks of one kind side by side are one door), the counter it reads and what it takes. */
interface Gate {
  cells: number[];
  block: number;
  counter: number;
  takes: number;
}

/** What one touch on the way to a key costs: a block that takes from a counter before it turns into the key. */
interface Price {
  counter: number;
  takes: number;
}

/** What adds to a counter: a block on the map or a monster, where it is now, and what getting it costs. */
interface Source {
  cell: number;
  counter: number;
  monster?: boolean;
  price?: Price[];
}

/** A block that refuses its touch while its counter is short, and opens (turns into another block) when it takes. */
const isGate = (b: Block | undefined, n: number): boolean => !!b && b.solid !== 0 && (b.effect >= 20 || b.effect === 3) && b.eamt < 0 && b.touchBl !== n;

/** The scene's locked doors still shut, from the map as it is (block numbers as drawn: blkmap). */
function gatesOf(map: ArrayLike<number>, bg: Block[], shown: (n: number) => number = (n) => n): Gate[] {
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

/** A counter a block adds to when touched (money or 20-29), or undefined. */
const addsTo = (b: Block | undefined): number | undefined => (b && (b.effect >= 20 || b.effect === 3) && b.eamt > 0 ? b.effect : undefined);

/**
 * The counters a monster adds to when touched (its picture's block does), and every monster it
 * turns into when it dies after it (newmon, engine/monsters.ts killMon): kill an enemy, touch the
 * pickup it becomes. The chain stops at a monster already seen.
 */
export function monsterAdds(w: Pick<World, 'mon' | 'mblk'>, n: number): Set<number> {
  const out = new Set<number>();
  const seen = new Set<number>();
  while (n >= 0 && n < LASTMON && !seen.has(n)) {
    seen.add(n);
    const m = w.mon[n];
    if (!m) break;
    for (const [p] of m.pic) {
      const c = p < 100 ? addsTo(w.mblk[p]) : undefined;
      if (c !== undefined) out.add(c);
    }
    n = m.newmon;
  }
  return out;
}

/**
 * What a background block turns into adds to, following its touch (touchBl) and timed (nextBl)
 * changes: the counter, and what touches on the way take (a shop block that takes money and turns
 * into the key). Each counter once, at its cheapest; a block already seen is not followed again.
 * The block itself adding is not a chain (sourcesOf counts it as it is).
 */
export function blockChainAdds(bg: Block[], start: number): Map<number, Price[]> {
  const out = new Map<number, Price[]>();
  const seen = new Set<number>([start]);
  const todo: [number, Price[]][] = [[start, []]];
  const cost = (p: Price[]) => p.reduce((t, x) => t + x.takes, 0);
  while (todo.length) {
    const [n, price] = todo.shift()!;
    const b = bg[n];
    if (!b) continue;
    const c = n === start ? undefined : addsTo(b);
    if (c !== undefined && !price.some((p) => p.counter === c) && (!out.has(c) || cost(out.get(c)!) > cost(price))) out.set(c, price);
    // a touch that takes from a counter is paid on the way (including a gate: its own refund is not a freely reachable key)
    const takes = (b.effect >= 20 || b.effect === 3) && b.eamt < 0 ? [{ counter: b.effect, takes: -b.eamt }] : [];
    const next: [number, Price[]][] = [
      [b.touchBl, [...price, ...takes]],
      [b.ntime > 0 ? b.nextBl : n, price],
    ];
    for (const [k, p] of next)
      if (k !== n && !seen.has(k)) {
        seen.add(k);
        todo.push([k, p]);
      }
  }
  return out;
}

/**
 * Map cells and monsters that add to one of `counters`: a block that does, a block that turns
 * into one (with what that costs), a block that births a monster that does.
 */
export function sourcesOf(
  map: ArrayLike<number>,
  bg: Block[],
  counters: ReadonlySet<number>,
  monsters: Source[] = [],
  shown: (n: number) => number = (n) => n,
  births?: Pick<World, 'mon' | 'mblk'>,
): Source[] {
  const out: Source[] = [];
  const chains = new Map<number, Map<number, Price[]>>();
  const born = new Map<number, Set<number>>();
  for (let c = 0; c < MLEN * MWID; c++) {
    const n = shown(map[c]);
    const b = bg[n];
    if (!b) continue;
    if (counters.has(b.effect) && b.eamt > 0) {
      out.push({ cell: c, counter: b.effect });
      continue;
    }
    if (!chains.has(n)) chains.set(n, blockChainAdds(bg, n));
    for (const [counter, price] of chains.get(n)!) if (counters.has(counter)) out.push({ cell: c, counter, ...(price.length ? { price } : {}) });
    if (births && b.birthTime > 0 && b.birthMon < LASTMON) {
      if (!born.has(n)) born.set(n, monsterAdds(births, b.birthMon));
      for (const counter of born.get(n)!) if (counters.has(counter)) out.push({ cell: c, counter, monster: true });
    }
  }
  return [...out, ...monsters.filter((m) => counters.has(m.counter))];
}

/** Monsters on the go now that add to a counter when touched, or turn into one that does when they die. */
function liveMonsterSources(w: World): Source[] {
  const out: Source[] = [];
  for (let l = 0; l < LASTMM; l++) {
    const mm = w.mm[l];
    if (mm.monnum >= LASTMON) continue;
    const mi = w.mi[l];
    for (const counter of monsterAdds(w, mm.monnum)) out.push({ cell: (mi.cury[0] % MWID) * MLEN + (mi.curx[0] % MLEN), counter, monster: true });
  }
  return out;
}

/** What the scene still holds shut, and what the hero would have to fetch to open it all. */
export interface Locks {
  gates: Gate[];
  /** What the doors still shut take from each counter, plus what the cheapest key costs when every key for a counter does. */
  owed: Map<number, number>;
  /** Counters too short for the doors still shut that something in the scene adds to: worth fetching. */
  wanted: Set<number>;
  /** Where those counters are added to. */
  sources: Source[];
  /** Counters too short for a door that nothing in the scene adds to (the hero can only bring them in). */
  missing: Set<number>;
  /** A counter a key costs, and the counter that key adds to (adam98's shop: money buys counter 20). */
  buys: Map<number, number>;
}

/** Rounds of keys that cost another counter (a key bought with a key) locksOf follows. */
const PRICE_ROUNDS = 4;

/**
 * The doors still shut on the live map and what they need. A counter is short while what the
 * hero has can't pay every door that reads it one after another (the engine keeps one over:
 * a door taking 1 needs 2); an unlimited counter is never short. When every key for a short
 * counter costs another counter (a touch that takes before the block turns into the key), the
 * cheapest key's price is owed too, and that counter may be short in turn.
 */
export function locksOf(w: World): Locks {
  const shown = (n: number) => w.blkmap[n] ?? n;
  const gates = gatesOf(w.map, w.bg, shown);
  const owed = new Map<number, number>();
  const owe = (c: number, n: number) => owed.set(c, (owed.get(c) ?? 0) + n);
  for (const g of gates) owe(g.counter, g.takes);
  const live = liveMonsterSources(w);
  const buys = new Map<number, number>();
  const priced = new Set<number>();
  const cost = (s: Source) => (s.price ?? []).reduce((t, p) => t + p.takes, 0);
  let short = new Set<number>();
  let sources: Source[] = [];
  for (let round = 0; round < PRICE_ROUNDS; round++) {
    short = new Set<number>();
    for (const [c, total] of owed) {
      const has = w.ci.meter[c] ?? 0;
      if (has !== INF_REPEAT && has <= total) short.add(c);
    }
    sources = sourcesOf(w.map, w.bg, short, live, shown, w);
    let more = false;
    for (const c of short) {
      const mine = sources.filter((s) => s.counter === c);
      if (priced.has(c) || !mine.length || mine.some((s) => !s.price)) continue;
      priced.add(c);
      const cheapest = mine.reduce((x, y) => (cost(y) < cost(x) ? y : x));
      for (const p of cheapest.price!) {
        if (!gates.some((g) => g.counter === p.counter && g.cells.includes(cheapest.cell))) owe(p.counter, p.takes);
        if (!buys.has(p.counter)) buys.set(p.counter, c);
        more = true;
      }
    }
    if (!more) break;
  }
  const wanted = new Set(sources.map((s) => s.counter));
  const missing = new Set(
    [...short].filter((c) => !wanted.has(c) && (buys.has(c) || gates.some((g) => g.counter === c && (w.ci.meter[c] ?? 0) + -g.takes <= 0))),
  );
  return { gates, owed, wanted, sources, missing, buys };
}

/** A counter's name as the editor shows it. */
const counterName = (c: number): string => (c === 3 ? 'money' : `counter ${c}`);

/** The door a counter is for: its own, or the one the key it buys opens. */
function doorFor(l: Locks, c: number): Gate | undefined {
  for (let k = c, i = 0; i <= PRICE_ROUNDS; i++) {
    const g = l.gates.find((x) => x.counter === k);
    if (g) return g;
    const next = l.buys.get(k);
    if (next === undefined) return undefined;
    k = next;
  }
  return undefined;
}

/** Most scene names a sentence lists. */
const NAMES = 3;

/**
 * Says which door the bot couldn't open and why, in a sentence (undefined: no door it couldn't
 * open). `elsewhere` names, per counter, the other scenes that add to it (otherScenes.ts);
 * `tripCap` is set when fetchKeys stopped at its trip cap (MAX_KEY_TRIPS) rather than its time.
 * A counter added only in another scene is no promise the door opens: that scene may come only
 * after this door, or its key may be out of reach (the 2026-11-05 counter-door audit found both).
 */
export function lockedWhy(
  l: Locks,
  unreached: ReadonlySet<number> = new Set(),
  elsewhere: ReadonlyMap<number, string[]> = new Map(),
  tripCap?: number,
): string | undefined {
  const at = (cell: number) => `(${cell % MLEN}, ${Math.floor(cell / MLEN)})`;
  for (const c of l.missing) {
    const g = doorFor(l, c);
    if (!g) continue;
    const needs = g.counter === c ? counterName(c) : `${counterName(g.counter)}, and its key costs ${counterName(c)}`;
    const names = elsewhere.get(c) ?? [];
    if (!names.length) return `The door at ${at(g.cells[0])} needs ${needs}: nothing in this scene adds to it.`;
    const list = names.slice(0, NAMES).join(', ') + (names.length > NAMES ? ` (and ${names.length - NAMES} more)` : '');
    return `The door at ${at(g.cells[0])} needs ${needs}: another scene adds to it: ${list}. Counters carry from scene to scene, but a player can bring it only if that scene can be played before this door and its key reached there; the bot plays one scene at a time and can't tell either, so the door may also never open. If a player can bring it, dismiss this.`;
  }
  for (const c of unreached) {
    const g = l.gates.find((x) => x.counter === c);
    const s = l.sources.find((x) => x.counter === c);
    if (!g || !s) continue;
    const short = tripCap
      ? `the bot stopped at its limit of ${tripCap} trip${tripCap === 1 ? '' : 's'} for keys before it had enough`
      : 'the bot never got to enough of it in its time';
    return `The door at ${at(g.cells[0])} needs ${counterName(c)}: a key for it is on the map (first at ${at(s.cell)}), but ${short}. That is only what the bot saw: it cannot judge a jump or a trick a player could make, so if you can reach it, dismiss this.`;
  }
  return undefined;
}
