// Where the World Map (worldMap.ts) puts its places and the paths between them. Candidate
// arrangements on a grid of place-sized cells come from the Game Integrator's own ideas
// (layoutCells.ts: the game as a tree across or down, dead ends packed in small grids, hubs
// over their dead ends, play order snaking along rows), unbounded by the DOS world. Each is
// judged with straight lines first (crossings, lines under places, length, shape), and the best
// few are routed for real (worldMapRoute.ts): the plan with the fewest crossings and the
// shortest, straightest paths wins. Pure arithmetic, so tests can measure every game.
import type { Game, Point } from '../../formats/game';
import { flowOrder, graphOf, hubCells, snakeCells, transpose, treeCells, type Cells, type Graph } from '../../editor/editors/integrator/layoutCells';
import type { Rect } from './worldMapLayout';
import { PIC_R, NAME_LINE, crossings, overlaps, placeBox, throughPlaces, type DrawnPath } from './worldMapMeasure';
import { routePaths } from './worldMapRoute';
import { bandCells } from './worldMapBands';
import { regionsOf } from './worldMapRegions';

/** A place's cell: room for its picture, ribbon and a path or two either side. */
export const STEP = { w: 27, h: 21 };

export interface Plan {
  /** The middle of each place's round picture. */
  at: Map<number, Point>;
  /** What each place covers. */
  boxes: Map<number, Rect>;
  paths: DrawnPath[];
  /** The box round every place. */
  bounds: Rect;
}

function normalize(cells: Cells): Cells {
  const ps = [...cells.values()];
  const c0 = Math.min(...ps.map((p) => p.c));
  const r0 = Math.min(...ps.map((p) => p.r));
  return new Map([...cells].map(([s, p]) => [s, { c: p.c - c0, r: p.r - r0 }]));
}

/** The candidate arrangements, each a cell per place. */
function candidates(g: Graph): Cells[] {
  const out: Cells[] = [];
  for (let leafRows = 1; leafRows <= 9; leafRows++)
    for (const beside of [false, true]) {
      const lr = treeCells(g, leafRows, beside);
      out.push(lr, transpose(lr));
    }
  const order = flowOrder(g);
  for (let across = 2; across <= Math.max(8, Math.ceil(order.length / 4)); across++)
    out.push(snakeCells(order, across, false), snakeCells(order, across, true));
  for (let leafRows = 1; leafRows <= 10; leafRows++) {
    const hc = hubCells(g, leafRows);
    if (hc) out.push(hc, transpose(hc));
  }
  for (let across = 2; across <= 6; across++)
    for (let perBand = 1; perBand <= 6; perBand++) {
      const bc = bandCells(g, across, perBand);
      if (bc) out.push(bc);
    }
  const seen = new Set<string>();
  return out.map(normalize).filter((c) => {
    const key = [...c].map(([s, p]) => `${s}:${p.c},${p.r}`).join(' ');
    return !seen.has(key) && !!seen.add(key);
  });
}

/** How far a plan's shape is from a sheet turned sideways, and how much of it is empty, for `n` places. */
function shapeCost(b: Rect, n: number): number {
  const cells = (b.w / STEP.w + 1) * (b.h / STEP.h + 1);
  const ratio = (b.w + STEP.w) / (b.h + STEP.h);
  return n * (Math.abs(Math.log(ratio / 1.35)) * 0.8 + (cells / n) * 0.6);
}

const boundsOf = (rs: Iterable<Rect>): Rect => {
  const all = [...rs];
  const x = Math.min(...all.map((r) => r.x));
  const y = Math.min(...all.map((r) => r.y));
  return { x, y, w: Math.max(...all.map((r) => r.x + r.w)) - x, h: Math.max(...all.map((r) => r.y + r.h)) - y };
};

/** Places that sit among another region's places (inside the box round that region's middles): a region should stay in one piece. */
function mixing(regions: number[][], at: Map<number, Point>): number {
  let n = 0;
  for (const ids of regions) {
    const ps = ids.map((i) => at.get(i)!);
    const x0 = Math.min(...ps.map((p) => p.x)) - 1;
    const x1 = Math.max(...ps.map((p) => p.x)) + 1;
    const y0 = Math.min(...ps.map((p) => p.y)) - 1;
    const y1 = Math.max(...ps.map((p) => p.y)) + 1;
    for (const [i, p] of at) if (!ids.includes(i) && p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1) n++;
  }
  return n;
}

const pathLength = (p: DrawnPath) => p.line.reduce((n, q, k) => (k ? n + Math.hypot(q.x - p.line[k - 1].x, q.y - p.line[k - 1].y) : 0), 0);

/**
 * The plan for a game's places: `name(i)` is the name on place i's ribbon and `lines(i)` how
 * many lines of names it lists; places start at `origin`.
 */
export function planWorld(game: Game, name: (i: number) => string, lines: (i: number) => number, origin: Point = { x: 0, y: 0 }): Plan {
  const g = graphOf(game);
  if (!g.nodes.length) return { at: new Map(), boxes: new Map(), paths: [], bounds: { x: origin.x, y: origin.y, w: 0, h: 0 } };
  const room = Math.max(0, ...g.nodes.map(lines)) * NAME_LINE;
  const step = { w: STEP.w + (room ? 2 : 0), h: STEP.h + room };
  const place = (cells: Cells) => {
    const at = new Map<number, Point>();
    for (const [i, p] of cells) at.set(i, { x: origin.x + p.c * step.w + step.w / 2, y: origin.y + p.r * step.h + PIC_R + 1 });
    const boxes = new Map([...at].map(([i, c]) => [i, placeBox(c, name(i), lines(i))]));
    return { at, boxes };
  };
  // the start goes before the ways it leads (paths are ordered: neighbors first)
  const pairs = [...g.pairs];
  const regions = regionsOf(game, g)
    .map((r) => r.ids)
    .filter((ids) => ids.length >= 2);
  // a game with very many ways is judged on its shape and length alone (straight lines cross everywhere)
  const busy = pairs.length > 120;
  const judged = candidates(g)
    .map((cells) => {
      const { at, boxes } = place(cells);
      if (overlaps(boxes).length) return undefined;
      const straight = pairs.map(([a, b]) => ({ a, b, line: [at.get(a)!, at.get(b)!] }));
      const len = straight.reduce((n, p) => n + pathLength(p), 0) / step.w;
      const cost = (busy ? 0 : crossings(straight) * 4) + mixing(regions, at) * 10 + len * 0.3 + shapeCost(boundsOf(boxes.values()), g.nodes.length);
      return { at, boxes, cost };
    })
    .filter((x) => !!x)
    .sort((a, b) => a.cost - b.cost)
    .slice(0, busy ? 1 : 8);
  let best: (Plan & { cost: number }) | undefined;
  for (const { at, boxes } of judged) {
    const bounds = boundsOf(boxes.values());
    const area = { x: bounds.x - 8, y: bounds.y - 8, w: bounds.w + 16, h: bounds.h + 16 };
    const ordered = [...pairs].sort((p, q) => dist(at, p) - dist(at, q) || p[0] - q[0] || p[1] - q[1]);
    const routed = routePaths(new Map([...at].map(([i, c]) => [i, { c, r: PIC_R + 0.7, box: boxes.get(i)! }])), ordered, area);
    const bends = routed.reduce((n, p) => n + Math.max(0, p.line.length - 2), 0);
    const len = routed.reduce((n, p) => n + pathLength(p), 0) / step.w;
    const all = boundsOf([bounds, ...routed.flatMap((p) => p.line.map((q) => ({ x: q.x, y: q.y, w: 0, h: 0 })))]);
    const cost =
      crossings(routed) * 30 + mixing(regions, at) * 10 + throughPlaces(routed, boxes).length * 20 + len * 0.6 + bends * 1.2 + shapeCost(all, g.nodes.length);
    if (!best || cost < best.cost) best = { at, boxes, paths: routed, bounds: all, cost };
  }
  const { at, boxes, paths, bounds } = best!;
  // the paths in the game's own order, so the drawing is the same every time
  const key = (p: { a: number; b: number }) => pairs.findIndex(([a, b]) => a === p.a && b === p.b);
  return { at, boxes, paths: paths.sort((p, q) => key(p) - key(q)), bounds };
}

const dist = (at: Map<number, Point>, [a, b]: [number, number]) => {
  const p = at.get(a)!;
  const q = at.get(b)!;
  return Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
};
