// Where scenes sit in the Game Integrator. Positions are the .GAM's own integrator
// coordinates (GRATOR.C: a scene is a 5x5 box at Pos, inside the 310x165 world at 5,29),
// so whatever the web editor arranges still loads in the DOS integrator.
import { NOSCENE, STARTTYPE, ENDTYPE, type Game, type Point } from '../formats/game';

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
const ROOMY = {
  x0: WORLD.x + CARD_UNITS.w / 2,
  y0: WORLD.y + CARD_UNITS.h / 2,
  x1: WORLD.x + WORLD.w - CARD_UNITS.w / 2,
  y1: WORLD.y + WORLD.h - CARD_UNITS.h / 2,
};
const TIGHT = { x0: POS_MIN.x + 2, y0: POS_MIN.y + 2, x1: POS_MAX.x + 2, y1: POS_MAX.y + 2 };
type Area = typeof ROOMY;
/** How far apart neighbouring cards may sit at most (so small games don't sprawl). */
const MAX_GAP = { x: CARD_UNITS.w * 1.6, y: CARD_UNITS.h * 1.5 };

// ---- the scene graph ------------------------------------------------------------------------

interface Graph {
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
function spanningForest(g: Graph): { roots: number[]; kids: Map<number, number[]> } {
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
type Cells = Map<number, { c: number; r: number }>;
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
function treeCells(g: Graph, leafRows: number, endsBeside: boolean): Cells {
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

const transpose = (cells: Cells): Cells => new Map([...cells].map(([s, p]) => [s, { c: p.r, r: p.c }]));

/** Depth-first reading order through the forest, so each scene comes right after the one that leads there. */
function flowOrder(g: Graph): number[] {
  const { roots, kids } = spanningForest(g);
  const order: number[] = [];
  const walk = (s: number) => (order.push(s), (kids.get(s) ?? []).forEach(walk));
  roots.forEach(walk);
  return [...order, ...g.ends];
}

/** The scenes in flow order along rows that turn back at each end ("as the ox ploughs"), or down columns. */
function snakeCells(order: number[], across: number, byColumns: boolean): Cells {
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
function hubCells(g: Graph, leafRows: number): Cells | undefined {
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

// ---- judging a layout ------------------------------------------------------------------------------

function normalize(cells: Cells): { cells: Cells; w: number; h: number } {
  const ps = [...cells.values()];
  const c0 = Math.min(...ps.map((p) => p.c));
  const r0 = Math.min(...ps.map((p) => p.r));
  const out: Cells = new Map([...cells].map(([s, p]) => [s, { c: p.c - c0, r: p.r - r0 }]));
  return { cells: out, w: Math.max(...ps.map((p) => p.c)) - c0 + 1, h: Math.max(...ps.map((p) => p.r)) - r0 + 1 };
}

const fits = (w: number, h: number, a: Area) => (w - 1) * CARD_UNITS.w <= a.x1 - a.x0 + 1e-9 && (h - 1) * CARD_UNITS.h <= a.y1 - a.y0 + 1e-9;

const orient = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
const segmentsCross = (a: Point, b: Point, c: Point, d: Point) => orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;

/** Does the segment a→b pass through the box of half-size (hw, hh) round p? */
function hitsBox(a: Point, b: Point, p: Point, hw: number, hh: number): boolean {
  let t0 = 0;
  let t1 = 1;
  const d = { x: b.x - a.x, y: b.y - a.y };
  for (const [dd, lo, hi, s] of [
    [d.x, p.x - hw, p.x + hw, a.x],
    [d.y, p.y - hh, p.y + hh, a.y],
  ]) {
    if (Math.abs(dd) < 1e-9) {
      if (s < lo || s > hi) return false;
      continue;
    }
    let u0 = (lo - s) / dd;
    let u1 = (hi - s) / dd;
    if (u0 > u1) [u0, u1] = [u1, u0];
    t0 = Math.max(t0, u0);
    t1 = Math.min(t1, u1);
    if (t0 > t1) return false;
  }
  return true;
}

/** What makes a layout hard to read, in cell units: crossing arrows, arrows under cards, long arrows. */
export function layoutCost(
  pairs: [number, number][],
  at: Map<number, Point>,
  unit = { w: 1, h: 1 },
  full = true,
): { cross: number; under: number; length: number } {
  const ids = [...at.keys()];
  let cross = 0;
  let under = 0;
  let length = 0;
  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i];
    const pa = at.get(a)!;
    const pb = at.get(b)!;
    length += Math.hypot((pa.x - pb.x) / unit.w, (pa.y - pb.y) / unit.h);
    if (!full) continue;
    for (let j = i + 1; j < pairs.length; j++) {
      const [c, d] = pairs[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (segmentsCross(pa, pb, at.get(c)!, at.get(d)!)) cross++;
    }
    for (const k of ids) if (k !== a && k !== b && hitsBox(pa, pb, at.get(k)!, unit.w * 0.42, unit.h * 0.4)) under++;
  }
  return { cross, under, length };
}

function score(g: Graph, cells: Cells, at: Map<number, Point>, w: number, h: number, area: Area): number {
  const { cross, under } = layoutCost(g.pairs, at, { w: 22, h: 18 });
  // long arrows, counted in steps between neighbouring cards
  const { length } = layoutCost(g.pairs, new Map([...cells].map(([s, p]) => [s, { x: p.c, y: p.r }])), { w: 1, h: 1 }, false);
  // arrows that run backwards (right to left, bottom to top) from a scene to the ones it leads to first are harder to follow
  const { kids } = spanningForest(g);
  let back = 0;
  for (const [s, ch] of kids)
    for (const c of ch) {
      const a = cells.get(s)!;
      const b = cells.get(c)!;
      if (b.c < a.c - 0.5) back += 1;
      if (b.r < a.r - 0.5) back += 0.5;
    }
  // cards squeezed close together, with little room to see the arrows between them
  const { dx, dy } = spacing(w, h, area);
  const crowd = g.nodes.length * ((w > 1 ? 1 - dx / MAX_GAP.x : 0) + (h > 1 ? 1 - dy / MAX_GAP.y : 0));
  return cross * 4 + under * 3 + length * 0.35 + back * 1.5 + crowd * 0.6;
}

const spacing = (w: number, h: number, a: Area) => ({
  dx: w > 1 ? Math.min(MAX_GAP.x, (a.x1 - a.x0) / (w - 1)) : 0,
  dy: h > 1 ? Math.min(MAX_GAP.y, (a.y1 - a.y0) / (h - 1)) : 0,
});

/** Turns grid cells into Pos values, spaced evenly and centred in the world. */
function toPositions(cells: Cells, w: number, h: number, a: Area): Map<number, Point> {
  const { dx, dy } = spacing(w, h, a);
  const cx = (a.x0 + a.x1) / 2 - ((w - 1) * dx) / 2;
  const cy = (a.y0 + a.y1) / 2 - ((h - 1) * dy) / 2;
  const out = new Map<number, Point>();
  for (const [s, p] of cells) out.set(s, clampPos({ x: cx + p.c * dx - 2, y: cy + p.r * dy - 2 }));
  return out;
}

/** One way to lay out the game, with what makes it hard to read (lower is better). */
export interface Arrangement {
  kind: 'tree' | 'tree-down' | 'hubs' | 'groups' | 'rows' | 'columns' | 'grid';
  positions: Map<number, Point>;
  cost: number;
}

/**
 * Ways to lay out every used scene as a readable map of the game without overlaps, best first
 * (fewest crossing arrows, arrows under cards and long arrows):
 * - the game as a tree from the start, left to right or top to bottom (each scene next to the
 *   one that first leads there; dead ends packed in small grids; the end scene last),
 * - big games in parts, each branch packed together in a rectangle of its own, and
 * - every scene in play order along rows or columns that turn at each end.
 * Positions stay inside the DOS integrator's world (inside its frame when there is room).
 */
export function arrangements(game: Game, limit = 6): Arrangement[] {
  const g = graphOf(game);
  if (!g.nodes.length) return [{ kind: 'grid', positions: new Map(), cost: 0 }];
  const candidates: { cells: Cells; bias: number; kind: Arrangement['kind'] }[] = [];
  for (let leafRows = 1; leafRows <= 9; leafRows++)
    for (const beside of [false, true]) {
      const lr = treeCells(g, leafRows, beside);
      candidates.push({ cells: lr, bias: 0, kind: 'tree' }, { cells: transpose(lr), bias: 0.5, kind: 'tree-down' });
    }
  const order = flowOrder(g);
  for (let across = 1; across <= Math.max(14, Math.ceil(order.length / 9)); across++)
    candidates.push({ cells: snakeCells(order, across, false), bias: 2, kind: 'rows' }, { cells: snakeCells(order, across, true), bias: 2.5, kind: 'columns' });
  for (let leafRows = 1; leafRows <= 9; leafRows++) {
    const hc = hubCells(g, leafRows);
    if (hc) candidates.push({ cells: hc, bias: 0.5, kind: 'hubs' }, { cells: transpose(hc), bias: 1, kind: 'hubs' });
  }
  const found: (Arrangement & { key: string })[] = [];
  for (const area of [ROOMY, TIGHT]) {
    const gw = Math.floor((area.x1 - area.x0) / CARD_UNITS.w + 1e-9) + 1;
    const gh = Math.floor((area.y1 - area.y0) / CARD_UNITS.h + 1e-9) + 1;
    const cands = [...candidates];
    if (g.nodes.length > 12)
      for (let w = Math.ceil(Math.sqrt(g.nodes.length)); w <= gw; w++)
        for (const prefer of ['wide', 'tall', 'square'] as const) {
          const cells = packedCells(g, w, gh, prefer);
          if (cells) cands.push({ cells, bias: 1, kind: 'groups' });
        }
    for (const cand of cands) {
      const n = normalize(cand.cells);
      if (!fits(n.w, n.h, area)) continue;
      const positions = toPositions(n.cells, n.w, n.h, area);
      const key = [...positions].map(([s, p]) => `${s}:${p.x},${p.y}`).join(' ');
      if (found.some((f) => f.key === key)) continue;
      // cards hanging over the world's frame look untidy: only when there's no other way
      found.push({ kind: cand.kind, positions, cost: score(g, n.cells, positions, n.w, n.h, area) + cand.bias + (area === TIGHT ? 3 : 0), key });
    }
  }
  if (found.length)
    return found
      .sort((a, b) => a.cost - b.cost)
      .slice(0, limit)
      .map(({ kind, positions, cost }) => ({ kind, positions, cost }));
  // More scenes than cells: plain reading order on the roomiest grid (cards may touch).
  const cols = Math.ceil(Math.sqrt((order.length * (TIGHT.x1 - TIGHT.x0)) / (TIGHT.y1 - TIGHT.y0)));
  const rows = Math.ceil(order.length / cols);
  return [
    { kind: 'grid', positions: toPositions(snakeCells(order, cols, false), cols, rows, { ...TIGHT, x1: TIGHT.x1 + 1e6, y1: TIGHT.y1 + 1e6 }), cost: Infinity },
  ];
}

/** The best of {@link arrangements}. */
export function autoArrange(game: Game): Map<number, Point> {
  return arrangements(game, 1)[0].positions;
}

/**
 * Moves overlapping cards (closer than w×h) apart the shorter way, again and again, keeping
 * inside the world; undefined when they're too crowded to all fit.
 */
function nudgeApart(start: Point[], w: number, h: number): Point[] | undefined {
  const ps = start.map((p) => ({ ...p }));
  const lo = { x: POS_MIN.x, y: POS_MIN.y };
  const hi = { x: POS_MAX.x, y: POS_MAX.y };
  for (let round = 0; round < 400; round++) {
    let moved = false;
    for (let a = 0; a < ps.length; a++)
      for (let b = a + 1; b < ps.length; b++) {
        const dx = ps[b].x - ps[a].x;
        const dy = ps[b].y - ps[a].y;
        const ox = w - Math.abs(dx);
        const oy = h - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // the shorter way apart; a card exactly on top of another goes right of it
        const horiz = ox / w <= oy / h;
        const sx = dx > 0 || (dx === 0 && b > a) ? 1 : -1;
        const sy = dy > 0 || (dy === 0 && b > a) ? 1 : -1;
        const push = (p: Point, k: number) => {
          if (horiz) p.x = Math.max(lo.x, Math.min(hi.x, p.x + k * (ox / 2 + 0.01)));
          else p.y = Math.max(lo.y, Math.min(hi.y, p.y + k * (oy / 2 + 0.01)));
        };
        push(ps[a], horiz ? -sx : -sy);
        push(ps[b], horiz ? sx : sy);
      }
    if (!moved) break;
  }
  const out = ps.map((p) => clampPos(p));
  const apart = out.every((p, a) => out.every((q, b) => a === b || Math.abs(p.x - q.x) >= w - 1 || Math.abs(p.y - q.y) >= h - 1));
  return apart ? out : undefined;
}

/**
 * Keeps the author's arrangement but moves cards apart so none hides another. Overlapping
 * cards are nudged apart the shortest way (cards that don't overlap anything stay put); if the
 * cards are too crowded for that, each takes the nearest free cell of a card-sized grid.
 */
export function spreadOut(game: Game): Map<number, Point> {
  const used = game.scenes.map((s, i) => (s.gametype === NOSCENE ? -1 : i)).filter((i) => i >= 0);
  const W = CARD_UNITS.w;
  const H = CARD_UNITS.h;
  // 1. nudge apart, with some room between the cards if there's space for it
  for (const gap of [6, 3, 0]) {
    const moved = nudgeApart(
      used.map((i) => game.scenes[i].pos),
      W + gap,
      H + gap,
    );
    if (moved) return new Map(used.map((s, k) => [s, moved[k]]));
  }
  // 2. too crowded: the nearest free cell of a grid, the arrangement scaled up to fill the world
  const cols = Math.floor((TIGHT.x1 - TIGHT.x0) / W) + 1;
  const rows = Math.floor((TIGHT.y1 - TIGHT.y0) / H) + 1;
  if (used.length > cols * rows) return autoArrange(game);
  const orig = used.map((i) => game.scenes[i].pos);
  const bx0 = Math.min(...orig.map((p) => p.x));
  const by0 = Math.min(...orig.map((p) => p.y));
  const bw = Math.max(...orig.map((p) => p.x)) - bx0;
  const bh = Math.max(...orig.map((p) => p.y)) - by0;
  // one scale for both directions, so a row of scenes stays a row
  const k = Math.min((cols - 1) / Math.max(bw / W, 1e-9), (rows - 1) / Math.max(bh / H, 1e-9));
  const offC = (cols - 1 - (bw / W) * k) / 2;
  const offR = (rows - 1 - (bh / H) * k) / 2;
  const pairs: [number, number, number][] = [];
  used.forEach((s, j) => {
    const tx = offC + ((orig[j].x - bx0) / W) * k;
    const ty = offR + ((orig[j].y - by0) / H) * k;
    for (let c = 0; c < cols * rows; c++) pairs.push([(tx - (c % cols)) ** 2 + (ty - Math.floor(c / cols)) ** 2, s, c]);
  });
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const out = new Map<number, Point>();
  const taken = new Set<number>();
  const dx = (TIGHT.x1 - TIGHT.x0) / (cols - 1);
  const dy = (TIGHT.y1 - TIGHT.y0) / (rows - 1);
  for (const [, s, c] of pairs) {
    if (out.has(s) || taken.has(c)) continue;
    taken.add(c);
    out.set(s, clampPos({ x: TIGHT.x0 + (c % cols) * dx - 2, y: TIGHT.y0 + Math.floor(c / cols) * dy - 2 }));
  }
  return out;
}
