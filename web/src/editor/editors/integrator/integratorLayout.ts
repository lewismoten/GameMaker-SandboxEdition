// Where scenes sit in the Game Integrator: Auto-arrange and Spread out. Positions are the
// .GAM's own integrator coordinates, so whatever the web editor arranges still loads in the
// DOS integrator. The candidate layouts come from layoutCells.ts; this file scores them
// (crossing arrows, arrows under cards, long arrows), turns grid cells into Pos values, and
// nudges overlapping cards apart.
import { NOSCENE, type Game, type Point } from '../../../formats/game';
import {
  POS_MIN,
  POS_MAX,
  CARD_UNITS,
  clampPos,
  ROOMY,
  TIGHT,
  type Area,
  MAX_GAP,
  type Graph,
  graphOf,
  spanningForest,
  type Cells,
  treeCells,
  transpose,
  flowOrder,
  snakeCells,
  packedCells,
  hubCells,
} from './layoutCells';

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

/** The empty room Close gaps leaves between neighbouring cards, in integrator units. */
export const SNUG_GAP = { x: Math.round(CARD_UNITS.w * 0.5), y: Math.round(CARD_UNITS.h * 0.6) };

/** Where values (card starts, each `size` long) go when every empty band wider than `gap` shrinks to `gap`. */
function closeAxis(starts: number[], size: number, gap: number): number[] {
  const order = [...new Set(starts)].sort((a, b) => a - b);
  const shift = new Map<number, number>();
  let cut = 0;
  let end = order[0] + size;
  for (const v of order) {
    if (v > end + gap) cut += v - end - gap;
    shift.set(v, cut);
    end = Math.max(end, v + size);
  }
  return starts.map((v) => v - shift.get(v)!);
}

const span = (vs: number[], size: number) => Math.max(...vs) - Math.min(...vs) + size;

/**
 * Keeps the arrangement (every card's order across and down, rows stay rows) but closes up
 * wide empty space between cards, then centres the whole set in the world. Small games laid
 * out the DOS way (title at the top, the end at the bottom) then fit the board at a size
 * where the cards can be read.
 */
export function closeGaps(game: Game): Map<number, Point> {
  const used = game.scenes.map((s, i) => (s.gametype === NOSCENE ? -1 : i)).filter((i) => i >= 0);
  if (!used.length) return new Map();
  const ps = used.map((i) => game.scenes[i].pos);
  const xs = closeAxis(
    ps.map((p) => p.x),
    CARD_UNITS.w,
    SNUG_GAP.x,
  );
  const ys = closeAxis(
    ps.map((p) => p.y),
    CARD_UNITS.h,
    SNUG_GAP.y,
  );
  const dx = Math.round((POS_MIN.x + POS_MAX.x) / 2 - (Math.min(...xs) + Math.max(...xs)) / 2);
  const dy = Math.round((POS_MIN.y + POS_MAX.y) / 2 - (Math.min(...ys) + Math.max(...ys)) / 2);
  return new Map(used.map((s, k) => [s, clampPos({ x: xs[k] + dx, y: ys[k] + dy })]));
}

/** How much (0–1) Close gaps would shrink the cards' spread across and down; 0 when it changes nothing. */
export function gapSavings(game: Game): { x: number; y: number } {
  const before = game.scenes.filter((s) => s.gametype !== NOSCENE).map((s) => s.pos);
  if (before.length < 2) return { x: 0, y: 0 };
  const after = [...closeGaps(game).values()];
  const less = (a: number[], b: number[], size: number) => Math.max(0, 1 - span(b, size) / span(a, size));
  return {
    x: less(
      before.map((p) => p.x),
      after.map((p) => p.x),
      CARD_UNITS.w,
    ),
    y: less(
      before.map((p) => p.y),
      after.map((p) => p.y),
      CARD_UNITS.h,
    ),
  };
}
