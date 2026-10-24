// The integrator's world and the candidate layouts Auto-arrange chooses from. Positions are
// the .GAM's own integrator coordinates (GRATOR.C: a scene is a 5x5 box at Pos, inside the
// 310x165 world at 5,29). The game's scenes and links form a graph; each candidate puts the
// scenes on a grid of card cells: as trees from the start scene (across or down), along a
// snaking reading order, packed in groups around hubs. integratorLayout.ts judges them.
import { NOSCENE, STARTTYPE, ENDTYPE, type Game, type Point } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';

/** Where the hero arrives in a scene: the "to" block of the first scene that links to it. */
export function arrival(game: Game, i: number): Point {
  for (const s of game.scenes) {
    if (s.gametype === NOSCENE) continue;
    const l = s.links.find((x) => x.toScene === i);
    if (l) return l.to;
  }
  return { x: MLEN >> 1, y: MWID >> 1 };
}

/** The integrator world (WX, WORLDTOP, WLEN, WWID) and the range movescene() lets Pos take. */
export const WORLD = { x: 5, y: 29, w: 310, h: 165 };
export const POS_MIN = { x: WORLD.x + 1, y: WORLD.y + 1 };
export const POS_MAX = { x: WORLD.x + WORLD.w - 8, y: WORLD.y + WORLD.h - 8 };

/** The room a scene card needs, in integrator units, so cards never touch after Auto-arrange. */
export const CARD_UNITS = { w: 23, h: 19 };

export function clampPos(p: Point): Point {
  return {
    x: Math.round(Math.max(POS_MIN.x, Math.min(POS_MAX.x, p.x))),
    y: Math.round(Math.max(POS_MIN.y, Math.min(POS_MAX.y, p.y))),
  };
}

/** Where card centres (Pos + 2) may go: inside the world's frame, or (for crowded games) anywhere Pos may be. */
export const ROOMY = {
  x0: WORLD.x + CARD_UNITS.w / 2,
  y0: WORLD.y + CARD_UNITS.h / 2,
  x1: WORLD.x + WORLD.w - CARD_UNITS.w / 2,
  y1: WORLD.y + WORLD.h - CARD_UNITS.h / 2,
};
export const TIGHT = { x0: POS_MIN.x + 2, y0: POS_MIN.y + 2, x1: POS_MAX.x + 2, y1: POS_MAX.y + 2 };
export type Area = typeof ROOMY;
/** How far apart neighbouring cards may sit at most (so small games don't sprawl). */
export const MAX_GAP = { x: CARD_UNITS.w * 1.6, y: CARD_UNITS.h * 1.5 };

// ---- the scene graph ------------------------------------------------------------------------

export interface Graph {
  nodes: number[];
  start: number;
  ends: number[];
  /** Each scene's links, once per target, in link order (no links to itself). */
  out: Map<number, number[]>;
  inn: Map<number, number[]>;
  /** Every pair of linked scenes once, whichever way the links go. */
  pairs: [number, number][];
}

export function graphOf(game: Game): Graph {
  const live = (i: number) => i !== NOSCENE && !!game.scenes[i] && game.scenes[i].gametype !== NOSCENE;
  const nodes = game.scenes.map((_, i) => i).filter(live);
  const out = new Map<number, number[]>(nodes.map((i) => [i, []]));
  const inn = new Map<number, number[]>(nodes.map((i) => [i, []]));
  const seen = new Set<string>();
  const pairs: [number, number][] = [];
  for (const i of nodes)
    for (const l of game.scenes[i].links) {
      const t = l.toScene;
      if (!live(t) || t === i || out.get(i)!.includes(t)) continue;
      out.get(i)!.push(t);
      inn.get(t)!.push(i);
      const k = i < t ? `${i},${t}` : `${t},${i}`;
      if (!seen.has(k)) (seen.add(k), pairs.push([i, t]));
    }
  return {
    nodes,
    start: nodes.find((i) => game.scenes[i].gametype === STARTTYPE) ?? -1,
    ends: nodes.filter((i) => game.scenes[i].gametype === ENDTYPE),
    out,
    inn,
    pairs,
  };
}

/** Breadth-first depth of each used scene from the start scene; the end scene comes last. */
export function sceneLayers(game: Game): number[][] {
  const g = graphOf(game);
  const { roots, kids } = spanningForest(g);
  const depth = new Map<number, number>();
  let base = 0;
  for (const r of roots) {
    let deepest = base;
    const walk = (s: number, d: number) => {
      depth.set(s, d);
      deepest = Math.max(deepest, d);
      for (const c of kids.get(s) ?? []) walk(c, d + 1);
    };
    walk(r, base);
    base = deepest + 1;
  }
  const layers: number[][] = [];
  for (const [i, d] of depth) (layers[d] ??= []).push(i);
  const out = layers.filter((l) => l?.length).map((l) => l.sort((a, b) => a - b));
  if (g.ends.length) out.push([...g.ends]);
  return out;
}

/**
 * A tree through the scenes, breadth first from the start (each scene hangs under the first
 * scene that reaches it, children in link order); scenes nothing reaches start trees of their
 * own. End scenes are left out: they always go last.
 */
export function spanningForest(g: Graph): { roots: number[]; kids: Map<number, number[]> } {
  const ends = new Set(g.ends);
  const kids = new Map<number, number[]>();
  const seen = new Set<number>();
  const roots: number[] = [];
  const grow = (root: number) => {
    roots.push(root);
    seen.add(root);
    const queue = [root];
    while (queue.length) {
      const i = queue.shift()!;
      for (const t of g.out.get(i)!) {
        if (seen.has(t) || ends.has(t)) continue;
        seen.add(t);
        (kids.get(i) ?? kids.set(i, []).get(i)!).push(t);
        queue.push(t);
      }
    }
  };
  if (g.start >= 0 && !ends.has(g.start)) grow(g.start);
  // the rest: scenes nothing links into first, then whatever is left, in scene order
  const rest = () => g.nodes.filter((i) => !seen.has(i) && !ends.has(i));
  for (const i of rest()) if (!seen.has(i) && !g.inn.get(i)!.some((p) => !ends.has(p) && p !== i)) grow(i);
  for (const i of rest()) if (!seen.has(i)) grow(i);
  return { roots, kids };
}

// ---- candidate layouts on a grid of card cells ------------------------------------------------

/** Scene → cell (column, row); rows or columns may be halves where a parent sits between its children. */
export type Cells = Map<number, { c: number; r: number }>;
type Placed = [number, number, number][];

interface Block {
  w: number;
  h: number;
  at: Placed;
}

/**
 * A tree laid out left to right: each scene in the column before its children, centred on
 * them; runs of children that lead nowhere further are packed in a grid at most `leafRows`
 * tall, so a hub with many dead ends stays compact.
 */
function treeBlock(id: number, kids: Map<number, number[]>, leafRows: number): Block {
  const ch = kids.get(id) ?? [];
  if (!ch.length) return { w: 1, h: 1, at: [[id, 0, 0]] };
  const parts: Block[] = [];
  let run: number[] = [];
  const flush = () => {
    if (!run.length) return;
    const cols = Math.ceil(run.length / leafRows);
    const rows = Math.ceil(run.length / cols);
    parts.push({ w: cols, h: rows, at: run.map((s, k) => [s, Math.floor(k / rows), k % rows]) });
    run = [];
  };
  for (const c of ch) {
    if (!kids.get(c)?.length) run.push(c);
    else {
      flush();
      parts.push(treeBlock(c, kids, leafRows));
    }
  }
  flush();
  const at: Placed = [];
  let y = 0;
  let w = 0;
  for (const p of parts) {
    for (const [s, c, r] of p.at) at.push([s, c + 1, r + y]);
    y += p.h;
    w = Math.max(w, p.w);
  }
  const rows = at.filter((a) => ch.includes(a[0]) && a[1] === 1).map((a) => a[2]);
  at.push([id, 0, (Math.min(...rows) + Math.max(...rows)) / 2]);
  return { w: w + 1, h: y, at };
}

/** Adds the end scenes: in a column of their own after everything, or just after the scenes that lead to them. */
function placeEnds(g: Graph, cells: Cells, beside: boolean): void {
  const width = Math.max(-1, ...[...cells.values()].map((p) => p.c)) + 1;
  for (const e of g.ends) {
    const from = g.inn.get(e)!.filter((p) => cells.has(p));
    const rows = from.map((p) => cells.get(p)!.r);
    const want = rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : Math.max(0, ...[...cells.values()].map((p) => p.r)) / 2;
    const c = beside && from.length ? Math.max(...from.map((p) => cells.get(p)!.c)) + 1 : width;
    const taken = [...cells.values()].filter((p) => Math.abs(p.c - c) < 1).map((p) => p.r);
    let r = Math.round(want * 2) / 2;
    for (let d = 0; d < 200; d++) {
      const tryR = [r + d, r - d].find((x) => x >= 0 && taken.every((t) => Math.abs(t - x) >= 1));
      if (tryR !== undefined) {
        r = tryR;
        break;
      }
    }
    cells.set(e, { c, r });
  }
}

/** The forest left to right (trees nothing reaches stacked below the main one), then the ends. */
export function treeCells(g: Graph, leafRows: number, endsBeside: boolean): Cells {
  const { roots, kids } = spanningForest(g);
  const cells: Cells = new Map();
  let y = 0;
  for (const root of roots) {
    const b = treeBlock(root, kids, leafRows);
    for (const [s, c, r] of b.at) cells.set(s, { c, r: r + y });
    y += b.h;
  }
  placeEnds(g, cells, endsBeside);
  return cells;
}

export const transpose = (cells: Cells): Cells => new Map([...cells].map(([s, p]) => [s, { c: p.r, r: p.c }]));

/** Depth-first reading order through the forest, so each scene comes right after the one that leads there. */
export function flowOrder(g: Graph): number[] {
  const { roots, kids } = spanningForest(g);
  const order: number[] = [];
  const walk = (s: number) => (order.push(s), (kids.get(s) ?? []).forEach(walk));
  roots.forEach(walk);
  return [...order, ...g.ends];
}

/** The scenes in flow order along rows that turn back at each end ("as the ox ploughs"), or down columns. */
export function snakeCells(order: number[], across: number, byColumns: boolean): Cells {
  const cells: Cells = new Map();
  order.forEach((s, k) => {
    const line = Math.floor(k / across);
    const along = k % across;
    const a = line % 2 ? across - 1 - along : along;
    cells.set(s, byColumns ? { c: line, r: a } : { c: a, r: line });
  });
  return cells;
}

/** A part of the game to keep together: its scenes in flow order, the first one the hub the others hang from. */
interface Group {
  ids: number[];
  hub: boolean;
}

/**
 * Splits the game into parts to keep together: the start and the scenes it leads through one
 * by one, then a part per branch of the first scene that leads to several (dead ends that hang
 * off it side by side share one part), scenes nothing reaches, and the end scenes.
 */
function groupsOf(g: Graph): Group[] {
  const { roots, kids } = spanningForest(g);
  const sub = (s: number): number[] => [s, ...(kids.get(s) ?? []).flatMap(sub)];
  const groups: Group[] = [];
  for (const root of roots) {
    const head = [root];
    let n = root;
    while (kids.get(n)?.length === 1) head.push((n = kids.get(n)![0]));
    groups.push({ ids: head, hub: false });
    let run: number[] = [];
    const flush = () => (run.length && groups.push({ ids: run, hub: false }), (run = []));
    for (const c of kids.get(n) ?? []) {
      if (!kids.get(c)?.length) run.push(c);
      else {
        flush();
        groups.push({ ids: sub(c), hub: true });
      }
    }
    flush();
  }
  for (const e of g.ends) groups.push({ ids: [e], hub: false });
  return groups;
}

/**
 * Packs each part of the game into a rectangle of its own on a w×h grid of cells, first fit
 * in reading order: big games keep each branch together instead of spreading it thin.
 */
export function packedCells(g: Graph, w: number, h: number, prefer: 'wide' | 'tall' | 'square'): Cells | undefined {
  const used: boolean[] = new Array(w * h).fill(false);
  const cells: Cells = new Map();
  for (const grp of groupsOf(g)) {
    const n = grp.ids.length;
    let best: { x: number; y: number; bw: number; bh: number; key: number } | undefined;
    for (let bw = 1; bw <= Math.min(n, w); bw++) {
      const bh = Math.ceil(n / bw);
      if (bh > h || (bw > 1 && Math.ceil(n / (bw - 1)) === bh)) continue;
      const shape = prefer === 'wide' ? -bw : prefer === 'tall' ? bw : Math.abs(bw - bh * 1.2);
      for (let y = 0; y + bh <= h && !best?.key; y++)
        for (let x = 0; x + bw <= w; x++) {
          let free = true;
          for (let yy = y; yy < y + bh && free; yy++) for (let xx = x; xx < x + bw && free; xx++) free = !used[yy * w + xx];
          if (!free) continue;
          const key = (y + bh) * 1000 + x * 10 + shape;
          if (!best || key < best.key) best = { x, y, bw, bh, key };
          break;
        }
    }
    if (!best) return undefined;
    const { x, y, bw, bh } = best;
    for (let yy = y; yy < y + bh; yy++) for (let xx = x; xx < x + bw; xx++) used[yy * w + xx] = true;
    // the hub in the middle of the top row, the rest round it in reading order
    const spots: [number, number][] = [];
    for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) spots.push([xx, yy]);
    let order = spots;
    if (grp.hub) {
      const hx = (bw - 1) >> 1;
      order = [[hx, 0], ...spots.filter(([a, b]) => a !== hx || b !== 0)];
    } else if (bh > 1) order = spots.map(([a, b]) => [b % 2 ? bw - 1 - a : a, b]);
    grp.ids.forEach((s, k) => cells.set(s, { c: x + order[k][0], r: y + order[k][1] }));
  }
  return cells;
}

/** Integer columns as near the wanted ones as can be (least squares), in the same order, one apart at least. */
export function settle(want: number[], lo = -Infinity): number[] {
  // with y = x - i the columns only need y to never go down: pool the blocks that would
  const blocks: { sum: number; n: number }[] = [];
  want.forEach((w, i) => {
    blocks.push({ sum: w - i, n: 1 });
    while (blocks.length > 1 && blocks[blocks.length - 2].sum / blocks[blocks.length - 2].n > blocks[blocks.length - 1].sum / blocks[blocks.length - 1].n) {
      const b = blocks.pop()!;
      blocks[blocks.length - 1].sum += b.sum;
      blocks[blocks.length - 1].n += b.n;
    }
  });
  const out: number[] = [];
  for (const b of blocks) for (let k = 0; k < b.n; k++) out.push(Math.max(lo, Math.round(b.sum / b.n)) + out.length);
  return out;
}

/**
 * For games built round hubs (a scene with many dead-end scenes off it, like a world map's
 * levels): the hubs in a row, each above a band of columns holding its dead ends, and the
 * other scenes (the start, the way to the hubs, the end) in a row above them.
 */
export function hubCells(g: Graph, leafRows: number): Cells | undefined {
  const { kids } = spanningForest(g);
  const order = flowOrder(g);
  const leafOf = (s: number) => (kids.get(s) ?? []).filter((c) => !kids.get(c)?.length);
  const hubs = order.filter((s) => leafOf(s).length >= 3);
  if (!hubs.length) return undefined;
  const inBand = new Set(hubs.flatMap(leafOf));
  const cells: Cells = new Map();
  // the dead ends, column by column, each hub's after the last
  let k = 0;
  const spans: [number, number][] = [];
  for (const hub of hubs) {
    const first = Math.floor(k / leafRows);
    for (const s of leafOf(hub)) (cells.set(s, { c: Math.floor(k / leafRows), r: 2 + (k % leafRows) }), k++);
    spans.push([first, Math.floor((k - 1) / leafRows)]);
  }
  settle(
    spans.map(([a, b]) => (a + b) / 2),
    0,
  ).forEach((c, i) => cells.set(hubs[i], { c, r: 1 }));
  // everything else on top, near the scenes it links with
  const rest = order.filter((s) => !cells.has(s) && !inBand.has(s));
  let want = rest.map((_, i) => i);
  for (let round = 0; round < 6; round++) {
    const col = new Map(rest.map((s, i) => [s, want[i]]));
    const at = (s: number) => cells.get(s)?.c ?? col.get(s);
    want = rest.map((s, i) => {
      const near = [...g.out.get(s)!, ...g.inn.get(s)!].map(at).filter((c): c is number => c !== undefined);
      return near.length ? (want[i] + near.reduce((a, b) => a + b, 0)) / (near.length + 1) : want[i];
    });
    want = settle(want, 0); // kept in play order, so the top row reads from the start to the end
  }
  rest.forEach((s, i) => cells.set(s, { c: want[i], r: 0 }));
  return cells;
}
