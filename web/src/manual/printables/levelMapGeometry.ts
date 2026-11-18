// Crop Level Maps to visible, reachable ground and unroll their wrapping edges.
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { type Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { type Rect } from './worldMapLayout';
import { type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { type SeenRect, type StoodColumns } from './levelViews';
import { openCell } from './levelRooms';
import { type Unrolled, type UnrolledBox as UnrolledBoxRect, unrolledAt } from '../../editor/check/unroll';
import { type Level } from './levelMapLayout';

/** The block a map is padded with: the commonest one round its edge. */
export function fillerBlock(cells: ArrayLike<number>): number {
  const counts = new Map<number, number>();
  const count = (x: number, y: number) => counts.set(cells[y * MLEN + x], (counts.get(cells[y * MLEN + x]) ?? 0) + 1);
  for (let x = 0; x < MLEN; x++) (count(x, 0), count(x, MWID - 1));
  for (let y = 1; y < MWID - 1; y++) (count(0, y), count(MLEN - 1, y));
  let best = 0;
  let most = -1;
  for (const [b, n] of counts) if (n > most || (n === most && b < best)) ((best = b), (most = n));
  return best;
}

/**
 * The part of the map in use, in cells: everything that isn't the edge's padding block, and
 * the cells in `keep` (arrivals, ways out), with `pad` cells round it, inside the map.
 */
export function usedArea(cells: ArrayLike<number>, keep: Point[] = [], pad = 1): Rect {
  const filler = fillerBlock(cells);
  let x0 = MLEN;
  let y0 = MWID;
  let x1 = -1;
  let y1 = -1;
  const take = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) if (cells[y * MLEN + x] !== filler) take(x, y);
  for (const p of keep) if (p.x >= 0 && p.y >= 0 && p.x < MLEN && p.y < MWID) take(p.x, p.y);
  if (x1 < 0) return { x: 0, y: 0, w: MLEN, h: MWID };
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(MLEN - 1, x1 + pad);
  y1 = Math.min(MWID - 1, y1 + pad);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * The map's background blocks with every secret one drawn as plain ground: what it turns
 * into when touched (a tin heart or an egg's touch block is the ground under it), else the
 * commonest of its neighbors that isn't secret, else the padding. Also returns the cells it
 * covered, which are never marked.
 */
export function hideSecrets(cells: ArrayLike<number>, blocks: Block[], secret: ReadonlySet<number>): { cells: Uint8Array; hidden: Set<number> } {
  const out = Uint8Array.from(cells);
  const hidden = new Set<number>();
  if (!secret.size) return { cells: out, hidden };
  const filler = fillerBlock(cells);
  for (let i = 0; i < out.length; i++) {
    const b = cells[i];
    if (!secret.has(b)) continue;
    hidden.add(i);
    const t = blocks[b]?.touchBl;
    if (t !== undefined && t !== b && !secret.has(t)) {
      out[i] = t;
      continue;
    }
    const x = i % MLEN;
    const y = (i / MLEN) | 0;
    const around = new Map<number, number>();
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= MLEN || ny >= MWID) continue;
      const n = cells[ny * MLEN + nx];
      if (!secret.has(n)) around.set(n, (around.get(n) ?? 0) + 1);
    }
    out[i] = [...around].sort((a, b2) => b2[1] - a[1] || a[0] - b2[0])[0]?.[0] ?? filler;
  }
  return { cells: out, hidden };
}

/**
 * The used area cut down to what the player sees (`seen`, from levelViews/*.json) with `pad` cells
 * round it, but never so far that a mark (an arrival or a way out) is cut off. Given the map's
 * `cells`, an edge that would cut through a room or a wall goes on to where it ends, so the
 * picture never shows half a room.
 */
export function seenArea(used: Rect, seen: SeenRect, marks: { x: number; y: number; w: number; h: number }[], pad = 1, cells?: ArrayLike<number>): Rect {
  let x0 = seen[0];
  let y0 = seen[1];
  let x1 = seen[0] + seen[2] - 1;
  let y1 = seen[1] + seen[3] - 1;
  for (const m of marks) {
    x0 = Math.min(x0, m.x);
    y0 = Math.min(y0, m.y);
    x1 = Math.max(x1, m.x + m.w - 1);
    y1 = Math.max(y1, m.y + m.h - 1);
  }
  // an edge that cuts through a room or a wall goes on to where it ends (within SNAP blocks),
  // so the picture shows the whole of it with the same margin as its other sides
  if (cells) {
    const filler = fillerBlock(cells);
    const inMap = (x: number, y: number) => x >= 0 && y >= 0 && x < MLEN && y < MWID;
    const emptyCol = (x: number) => {
      for (let y = y0; y <= y1; y++) if (inMap(x, y) && cells[y * MLEN + x] !== filler) return false;
      return true;
    };
    const emptyRow = (y: number) => {
      for (let x = x0; x <= x1; x++) if (inMap(x, y) && cells[y * MLEN + x] !== filler) return false;
      return true;
    };
    const reach = (from: number, step: number, empty: (v: number) => boolean) => {
      for (let k = 0, v = from + step; k < SNAP; k++, v += step) if (empty(v)) return v - step;
      return from;
    };
    if (!emptyCol(x1 + 1)) x1 = reach(x1, 1, emptyCol);
    if (!emptyCol(x0 - 1)) x0 = reach(x0, -1, emptyCol);
    if (!emptyRow(y1 + 1)) y1 = reach(y1, 1, emptyRow);
    if (!emptyRow(y0 - 1)) y0 = reach(y0, -1, emptyRow);
  }
  x0 = Math.max(used.x, x0 - pad);
  y0 = Math.max(used.y, y0 - pad);
  x1 = Math.min(used.x + used.w - 1, x1 + pad);
  y1 = Math.min(used.y + used.h - 1, y1 + pad);
  return x1 < x0 || y1 < y0 ? used : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Everything joined to the level's arrivals through blocks that aren't solid on every side (or
 * that change: doors), with half a screen round it, when that never reaches the map's edge: an
 * enclosed level (a station, a house) whose far rooms the bots didn't get to. Undefined when it
 * reaches the edge (open ground, a sea, space), where the flood would take in far too much.
 */
export function walledReach(cells: ArrayLike<number>, blocks: Block[], starts: Point[]): Rect | undefined {
  const open = (i: number) => {
    const b = blocks[cells[i]];
    return !b || b.solid !== 15 || b.touchBl !== cells[i] || (b.nextBl !== cells[i] && b.ntime > 0);
  };
  const reached = new Uint8Array(MLEN * MWID);
  const todo: number[] = [];
  for (const p of starts)
    if (p.x >= 0 && p.y >= 0 && p.x < MLEN && p.y < MWID && !reached[p.y * MLEN + p.x]) ((reached[p.y * MLEN + p.x] = 1), todo.push(p.y * MLEN + p.x));
  if (!todo.length) return undefined;
  let x0 = MLEN;
  let y0 = MWID;
  let x1 = -1;
  let y1 = -1;
  while (todo.length) {
    const i = todo.pop()!;
    const x = i % MLEN;
    const y = Math.floor(i / MLEN);
    if (x === 0 || y === 0 || x === MLEN - 1 || y === MWID - 1) return undefined;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
    for (const j of [i - 1, i + 1, i - MLEN, i + MLEN]) if (!reached[j] && open(j)) ((reached[j] = 1), todo.push(j));
  }
  return { x: x0 - 8, y: y0 - 5, w: x1 - x0 + 17, h: y1 - y0 + 11 };
}

/**
 * The blocks a map is padded with: its padding block (fillerBlock) and any block scattered
 * through it (stars in space: three in four of its neighbors are the padding).
 */
function paddingBlocks(cells: ArrayLike<number>): Set<number> {
  const filler = fillerBlock(cells);
  const near = new Map<number, [number, number]>();
  for (let i = 0; i < MLEN * MWID; i++) {
    const b = cells[i];
    if (b === filler) continue;
    const x = i % MLEN;
    const y = Math.floor(i / MLEN);
    const c = near.get(b) ?? [0, 0];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      c[1]++;
      if (cells[((y + dy + MWID) % MWID) * MLEN + ((x + dx + MLEN) % MLEN)] === filler) c[0]++;
    }
    near.set(b, c);
  }
  return new Set([filler, ...[...near].filter(([, [f, n]]) => f * 4 >= n * 3).map(([b]) => b)]);
}

/**
 * A crop with its empty sides cut back: lines of nothing but the map's padding go, down to one
 * (every Level Map has one empty block round what is drawn), never past a mark. Given the map's
 * `blocks`, a line of one block the hero can never get into (solid on every side and never
 * changing: the bedrock under a planet's caves) is empty too, so a thick slab of it the camera
 * shows past the floor is cut back to one line. Lines are read round the map's edges (an unrolled
 * box can run past them); a way that `loops` keeps its lap.
 */
export function trimPadding(
  area: Rect,
  cells: ArrayLike<number>,
  marks: { x: number; y: number; w: number; h: number }[],
  loops: [boolean, boolean] = [false, false],
  blocks?: Block[],
): Rect {
  const pad = paddingBlocks(cells);
  const at = (x: number, y: number) => cells[(((y % MWID) + MWID) % MWID) * MLEN + (((x % MLEN) + MLEN) % MLEN)];
  const closed = (b: number) => !!blocks && !openCell([b], blocks, 0);
  let x0 = area.x;
  let y0 = area.y;
  let x1 = area.x + area.w - 1;
  let y1 = area.y + area.h - 1;
  /** A line of padding, or of one closed block, with no mark on it. */
  const empty = (line: number[], marked: boolean) => !marked && (line.every((b) => pad.has(b)) || (closed(line[0]) && line.every((b) => b === line[0])));
  const emptyCol = (x: number) => {
    const line: number[] = [];
    for (let y = y0; y <= y1; y++) line.push(at(x, y));
    return empty(
      line,
      marks.some((m) => x >= m.x && x < m.x + m.w),
    );
  };
  const emptyRow = (y: number) => {
    const line: number[] = [];
    for (let x = x0; x <= x1; x++) line.push(at(x, y));
    return empty(
      line,
      marks.some((m) => y >= m.y && y < m.y + m.h),
    );
  };
  if (!loops[0]) {
    while (x1 - x0 > 1 && emptyCol(x0) && emptyCol(x0 + 1)) x0++;
    while (x1 - x0 > 1 && emptyCol(x1) && emptyCol(x1 - 1)) x1--;
  }
  if (!loops[1]) {
    while (y1 - y0 > 1 && emptyRow(y0) && emptyRow(y0 + 1)) y0++;
    while (y1 - y0 > 1 && emptyRow(y1) && emptyRow(y1 - 1)) y1--;
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** The box round two boxes, kept inside `within`. */
export function joinRects(a: Rect, b: Rect, within: Rect): Rect {
  const x0 = Math.max(within.x, Math.min(a.x, b.x));
  const y0 = Math.max(within.y, Math.min(a.y, b.y));
  const x1 = Math.min(within.x + within.w, Math.max(a.x + a.w, b.x + b.w));
  const y1 = Math.min(within.y + within.h, Math.max(a.y + a.h, b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Where the hero can get to on a map that wraps: every block joined to the arrivals through blocks
 * that aren't solid on every side (or that change), going round the map's edges, as how many
 * columns and rows it touches and the rows from first to last.
 */
export function wrapReach(cells: ArrayLike<number>, blocks: Block[], starts: Point[]): Reach {
  const open = (i: number) => {
    const b = blocks[cells[i]];
    return !b || b.solid !== 15 || b.touchBl !== cells[i] || (b.nextBl !== cells[i] && b.ntime > 0);
  };
  const reached = new Uint8Array(MLEN * MWID);
  const todo: number[] = [];
  for (const p of starts)
    if (p.x >= 0 && p.y >= 0 && p.x < MLEN && p.y < MWID && !reached[p.y * MLEN + p.x]) ((reached[p.y * MLEN + p.x] = 1), todo.push(p.y * MLEN + p.x));
  const cols = new Set<number>();
  const rows = new Set<number>();
  while (todo.length) {
    const i = todo.pop()!;
    const x = i % MLEN;
    const y = Math.floor(i / MLEN);
    cols.add(x);
    rows.add(y);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const j = ((y + dy + MWID) % MWID) * MLEN + ((x + dx + MLEN) % MLEN);
      if (!reached[j] && open(j)) ((reached[j] = 1), todo.push(j));
    }
  }
  return { cols: cols.size, rows: rows.size, y0: rows.size ? Math.min(...rows) : 0, y1: rows.size ? Math.max(...rows) : 0 };
}

/** Where the hero can get to round a wrapping map (wrapReach): how many columns and rows, and the rows from first to last. */
interface Reach {
  cols: number;
  rows: number;
  y0: number;
  y1: number;
}

/**
 * A way only goes round forever when the hero can get all the way round. The scan says which
 * rows the hero stood on in each column (`stood`, x, first and last row); when the widest band of
 * columns he never stood in is closed (solid on every side) at every row he stood on beside it, a
 * hedge he can't get past, the way doesn't go round: it is laid out in one piece, one lap cut
 * through the middle of the band, so the barrier shows at both ends.
 */
function walledRound(u: Unrolled, cells: ArrayLike<number>, blocks: Block[], stood?: StoodColumns): Unrolled {
  if (!stood?.length || u.runs || !u.loops[0]) return u;
  const rows = new Map(stood.map(([x, y0, y1]) => [x, [y0, y1]]));
  if (rows.size >= MLEN) return u;
  let start = 0;
  let len = 0;
  for (let i = 0; i < MLEN; i++) {
    if (rows.has(i) || !rows.has((i + MLEN - 1) % MLEN)) continue; // a band starts after a column stood in
    let k = 0;
    while (k < MLEN && !rows.has((i + k) % MLEN)) k++;
    if (k > len) ((len = k), (start = i));
  }
  if (!len) return u;
  const beside = [rows.get((start + MLEN - 1) % MLEN)!, rows.get((start + len) % MLEN)!];
  const closed = (x: number, y: number) => !openCell(cells, blocks, (((y % MWID) + MWID) % MWID) * MLEN + (x % MLEN));
  for (const [y0, y1] of beside)
    for (let y = y0; y <= y1; y++) {
      let shut = false;
      for (let k = 0; k < len && !shut; k++) shut = closed(start + k, y);
      if (!shut) return u;
    }
  // cut through the middle of the band: half the barrier shows at each end, and no column twice
  const box: UnrolledBoxRect = [(start + Math.floor(len / 2)) % MLEN, u.box[1], MLEN, u.box[3]];
  return { ...u, box, loops: [false, u.loops[1]] };
}

/**
 * A map the hero can walk all the way round (a planet) goes round forever though the bots never
 * walked the whole lap, and it shows every row they could get to: the caves under a planet's
 * surface, not only the strip the walkthrough crossed.
 */
function goesRound(u: Unrolled, reach?: Reach): Unrolled {
  if (!reach || u.loops[0] || reach.cols < MLEN || (u.runs && u.box[3] > MWID)) return u;
  const loopY = u.loops[1] || reach.rows >= MWID;
  const [, by, , bh] = u.box;
  const y0 = loopY ? by : Math.min(by, reach.y0 - 1);
  const y1 = loopY ? by + bh - 1 : Math.max(by + bh - 1, reach.y1 + 1);
  return { box: [u.box[0], y0, MLEN, loopY ? MWID : y1 - y0 + 1], loops: [true, loopY] };
}

/** How far a crop's edge goes on to take in the rest of a room or wall it cuts through. */
const SNAP = 8;

/** A level laid out as the player goes through it: its box, and each mark on the lap where it is met. */
export function unrolledLevel(level: Level, played: Unrolled, reach: Reach, blocks: Block[], stood?: StoodColumns): Level {
  const u = recut(walledRound(goesRound(played, reach), level.cells, blocks, stood), level.cells);
  const marks = level.marks.map((m) => ({ ...m, ...unrolledAt(u, m.x, m.y) }));
  const [x, y, w, h] = u.box;
  const area = u.runs ? { x, y, w, h } : trimPadding({ x, y, w, h }, level.cells, marks, u.loops, blocks);
  return { ...level, area, marks, unrolled: u, mapMarks: level.marks };
}

/**
 * A way that goes round forever is printed one lap long, cut through the widest band of lines
 * with (almost) nothing drawn in it, so everything drawn stays whole near the middle: an asteroid
 * ring round its sun, a town, a word spelled in blocks. "Drawn" leaves out the commonest blocks
 * (empty space, star fields, nebula, plain ground: together 95% of the map). A map drawn all the
 * way round is cut at its emptiest line. One more line goes on past the far edge, the first one
 * again, so a room open at the edge shows the wall it wraps round to. A level that winds on past
 * a lap keeps the scan's layout (its drawn runs are laid out for it).
 */
function recut(u: Unrolled, cells: ArrayLike<number>): Unrolled {
  if (u.runs || (!u.loops[0] && !u.loops[1])) return u;
  const freq = new Map<number, number>();
  for (let i = 0; i < MLEN * MWID; i++) freq.set(cells[i], (freq.get(cells[i]) ?? 0) + 1);
  const background = new Set<number>();
  let covered = 0;
  for (const [b, n] of [...freq].sort((x, y) => y[1] - x[1])) {
    if (covered >= MLEN * MWID * 0.95) break;
    background.add(b);
    covered += n;
  }
  const box: UnrolledBoxRect = [...u.box];
  const cut = (axis: 0 | 1) => {
    const n = axis ? MWID : MLEN;
    const count = new Array<number>(n).fill(0);
    for (let i = 0; i < MLEN * MWID; i++) if (!background.has(cells[i])) count[axis ? Math.floor(i / MLEN) : i % MLEN]++;
    // a line with next to nothing drawn on it (a stray block or two) is empty
    const quiet = Math.max(1, Math.floor(Math.max(...count) / 10));
    let start = -1;
    let len = 0;
    for (let i = 0; i < n; i++) {
      if (count[i] > quiet || count[(i + n - 1) % n] <= quiet) continue; // runs start after a busy line
      let k = 0;
      while (k < n && count[(i + k) % n] <= quiet) k++;
      if (k > len) ((len = k), (start = i));
    }
    if (len === n || start < 0) {
      // nothing drawn at all, or drawn all the way round: the emptiest line
      let best = 0;
      for (let i = 1; i < n; i++) if (count[i] < count[best]) best = i;
      return best;
    }
    return (start + Math.floor(len / 2)) % n;
  };
  if (u.loops[0]) ((box[0] = cut(0)), (box[2] = MLEN + 1));
  if (u.loops[1]) ((box[1] = cut(1)), (box[3] = MWID + 1));
  return { ...u, box };
}
