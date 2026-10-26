// A course through the wrap (editor/check/course.ts finds one; levelViews.json keeps its path),
// laid out for the printed Level Maps as one long strip the way the ship flies it: the map
// unrolled through every wrap seam, turned in steps of 45 degrees so the way on points up the
// page, start at the bottom. A way straight down the map (a downhill run, such as Snowbound's
// sled run) keeps the map upright instead and runs down the page, start at the top. Only the way the hero can get to near the path is drawn (every open
// block a short way from it, reached without going through a wall) and a few blocks of the
// walls and scenery round that. Also found here: where the way crosses the wrap (the seams, and
// the laps they count), the bends where it runs off straight up (the kinks), the places where
// it touches a part of itself further on (a shortcut, such as a splice across to the next lane),
// and the page-high panels it is cut into. No DOM; levelCourseSvg.ts draws it.
import type { Block } from '../../formats/blocks';
import { MLEN, MWID } from '../../formats/map';
import type { CoursePath } from '../../editor/check/course';
import { openCell } from './levelRooms';

/** How far from the path (in blocks, through open blocks) the way the hero can get to is drawn. */
const REACH = 16;
/** Blocks of wall and scenery drawn round it. */
const MARGIN = 3;
/** Two parts of the way that touch but are further apart than this along it are a shortcut. */
const SHORTCUT = 2 * REACH + 8;
/** The path's way at a place is its direction over this many blocks either side. */
const LOOK = 6;

/** Where something sits on the strip: across (right is +) and along (up the page is +), in blocks. */
export interface StripPoint {
  c: number;
  a: number;
}

/** One drawn block of the unrolled map: its unwrapped place (x mod 100 is the map's). */
export interface CourseCell {
  x: number;
  y: number;
  /** On the way the hero can get to (else a wall or scenery round it). */
  way: boolean;
}

/** A mark (an arrival, a way out) moved onto the strip. */
export interface CourseMark<M> {
  mark: M;
  at: StripPoint;
}

/** A place where the way touches itself further on: from the earlier part to the later one. */
export interface Shortcut {
  from: StripPoint;
  to: StripPoint;
}

/** A crossing of the wrap: the seam's line on the strip (two ends), and which edges it joins. */
export interface Seam {
  ends: [StripPoint, StripPoint];
  axis: 'x' | 'y';
}

/**
 * Along the strip, where the way bends off straight up: a kink in the way itself, or a shortcut
 * taken (the way it left goes on straight ahead, so the path crossed over to another part).
 */
export interface Kink {
  a0: number;
  a1: number;
  at: StripPoint;
  taken: boolean;
}

/** One page-high piece of the strip. */
export interface CoursePanel {
  /** Along, bottom and top (the top runs a few blocks into the next panel's bottom). */
  a0: number;
  a1: number;
  /** Across, left and right. */
  c0: number;
  c1: number;
}

export interface CourseLayout<M> {
  /** The strip's up, a unit vector in map blocks (y down): the way on, or straight back up a way down. */
  up: [number, number];
  /** The way runs down the page, start at the top of the first panel (else up it, start at the foot). */
  down: boolean;
  /** The strip's right, a unit vector in map blocks. */
  right: [number, number];
  cells: CourseCell[];
  marks: CourseMark<M>[];
  seams: Seam[];
  /** The laps (counted by the edge the way crosses most): where each one starts, numbered from 1. */
  laps: { at: StripPoint; n: number }[];
  /** Along the strip, where the way bends off straight up. */
  kinks: Kink[];
  shortcuts: Shortcut[];
  panels: CoursePanel[];
  /** The whole strip, along and across. */
  box: CoursePanel;
}

const mod = (v: number, n: number) => ((v % n) + n) % n;
/** A block's key, unwrapped: x and y each fit 16 bits round an offset. */
const keyOf = (x: number, y: number) => (x + 16384) * 65536 + (y + 16384);

/** The 8-way direction nearest (dx, dy), as a unit vector. */
function snap(dx: number, dy: number): [number, number] {
  const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const t = (k * Math.PI) / 4;
  const r = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v);
  return [r(Math.cos(t)), r(Math.sin(t))];
}

/** The path as points every half block, each with how far along the path it is. */
function sample(path: CoursePath): { x: number; y: number; s: number }[] {
  const out: { x: number; y: number; s: number }[] = [];
  let s = 0;
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    if (i === 0) {
      out.push({ x, y, s });
      continue;
    }
    const [px, py] = path[i - 1];
    const len = Math.hypot(x - px, y - py);
    const n = Math.max(1, Math.ceil(len * 2));
    for (let k = 1; k <= n; k++) out.push({ x: px + ((x - px) * k) / n, y: py + ((y - py) * k) / n, s: s + (len * k) / n });
    s += len;
  }
  return out;
}

/** Cuts [a0, a1] into panels at most `height` high, all the same height, each running `overlap` into the next. */
function cutPanels(a0: number, a1: number, height: number, overlap: number): [number, number][] {
  const n = Math.max(1, Math.ceil((a1 - a0 - overlap) / (height - overlap)));
  const h = (a1 - a0 + (n - 1) * overlap) / n;
  return Array.from({ length: n }, (_, k) => [a0 + k * (h - overlap), a0 + k * (h - overlap) + h] as [number, number]);
}

/**
 * Lays out the course `path` on a map (`cells`, its blocks), with `marks` (map blocks) moved onto
 * it, cut into panels `height` blocks high that overlap by `overlap`.
 */
export function layOutCourse<M extends { x: number; y: number; w: number; h: number }>(
  cells: ArrayLike<number>,
  blocks: Block[],
  path: CoursePath,
  marks: M[],
  height: number,
  overlap = 3,
): CourseLayout<M> {
  const [sx, sy] = path[0];
  const [ex, ey] = path[path.length - 1];
  const way = snap(ex - sx, ey - sy);
  // a way straight down the map keeps the map upright: the strip's up is the map's
  const down = way[0] === 0 && way[1] === 1;
  const up: [number, number] = down ? [0, -1] : way;
  // right of the way on, with y down the map: (x, y) turned a quarter clockwise on screen
  const right: [number, number] = [-up[1] || 0, up[0]];
  const strip = (x: number, y: number): StripPoint => ({ c: x * right[0] + y * right[1], a: x * up[0] + y * up[1] });
  const at = (x: number, y: number) => strip(x + 0.5, y + 0.5);
  const open = (x: number, y: number) => openCell(cells, blocks, mod(y, MWID) * MLEN + mod(x, MLEN));

  // the way the hero can get to: out from the path through open blocks, each map block claimed
  // by the nearest part of the path, at the lap it is there
  const claim = new Map<number, { x: number; y: number; s: number; d: number }>();
  let front: number[] = [];
  for (const p of sample(path)) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const i = mod(y, MWID) * MLEN + mod(x, MLEN);
    if (claim.has(i) || !open(x, y)) continue;
    claim.set(i, { x, y, s: p.s, d: 0 });
    front.push(i);
  }
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let d = 1; d <= REACH && front.length; d++) {
    const next: number[] = [];
    for (const i of front) {
      const c = claim.get(i)!;
      for (const [dx, dy] of steps) {
        const x = c.x + dx;
        const y = c.y + dy;
        const j = mod(y, MWID) * MLEN + mod(x, MLEN);
        if (claim.has(j) || !open(x, y)) continue;
        claim.set(j, { x, y, s: c.s, d });
        next.push(j);
      }
    }
    front = next;
  }

  // the way, and a margin of what is round it
  const drawn = new Map<number, CourseCell>();
  for (const c of claim.values()) drawn.set(keyOf(c.x, c.y), { x: c.x, y: c.y, way: true });
  for (const c of claim.values())
    for (let dy = -MARGIN; dy <= MARGIN; dy++)
      for (let dx = -MARGIN; dx <= MARGIN; dx++) {
        const x = c.x + dx;
        const y = c.y + dy;
        const k = keyOf(x, y);
        if (drawn.has(k)) continue;
        // an open block of another lap's way is drawn there, not here
        const other = claim.get(mod(y, MWID) * MLEN + mod(x, MLEN));
        if (other && (other.x !== x || other.y !== y)) continue;
        drawn.set(k, { x, y, way: false });
      }

  // shortcuts: open neighbors claimed by parts of the path far apart along it
  const joins: { lo: { x: number; y: number }; hi: { x: number; y: number }; s: number }[] = [];
  for (const c of claim.values())
    for (const [dx, dy] of steps) {
      const o = claim.get(mod(c.y + dy, MWID) * MLEN + mod(c.x + dx, MLEN));
      if (o && o.s - c.s > SHORTCUT) joins.push({ lo: c, hi: o, s: c.s });
    }
  const shortcuts: Shortcut[] = [];
  const used = new Set<number>();
  joins.forEach((j, k) => {
    if (used.has(k)) return;
    const group = [j];
    used.add(k);
    for (let g = 0; g < group.length; g++)
      joins.forEach((o, m) => {
        if (!used.has(m) && Math.abs(o.lo.x - group[g].lo.x) + Math.abs(o.lo.y - group[g].lo.y) <= 2) (used.add(m), group.push(o));
      });
    const mid = (pts: { x: number; y: number }[]) => at(pts.reduce((a, p) => a + p.x, 0) / pts.length, pts.reduce((a, p) => a + p.y, 0) / pts.length);
    shortcuts.push({ from: mid(group.map((g) => g.lo)), to: mid(group.map((g) => g.hi)) });
  });
  shortcuts.sort((a, b) => a.from.a - b.from.a);

  // the seams: grid lines at a lap's edge between two drawn blocks
  const seams: Seam[] = [];
  const edgeRuns = (axis: 'x' | 'y') => {
    const lines = new Map<number, number[]>();
    for (const c of drawn.values()) {
      const [u, v] = axis === 'x' ? [c.x, c.y] : [c.y, c.x];
      if (mod(u, axis === 'x' ? MLEN : MWID) !== 0) continue;
      const nb = axis === 'x' ? drawn.has(keyOf(c.x - 1, c.y)) : drawn.has(keyOf(c.x, c.y - 1));
      if (!nb) continue;
      let l = lines.get(u);
      if (!l) lines.set(u, (l = []));
      l.push(v);
    }
    for (const [u, vs] of lines) {
      vs.sort((p, q) => p - q);
      let from = vs[0];
      for (let k = 1; k <= vs.length; k++) {
        if (k < vs.length && vs[k] === vs[k - 1] + 1) continue;
        const to = vs[k - 1] + 1;
        const ends: [StripPoint, StripPoint] = axis === 'x' ? [strip(u, from), strip(u, to)] : [strip(from, u), strip(to, u)];
        seams.push({ ends, axis });
        from = vs[k];
      }
    }
  };
  edgeRuns('x');
  edgeRuns('y');

  // laps: counted by the edge the way crosses most
  const pts = sample(path);
  const lapAxis = Math.abs(ex - sx) >= Math.abs(ey - sy) ? 0 : 1;
  const lapOf = (p: { x: number; y: number }) => Math.floor((lapAxis ? p.y : p.x) / (lapAxis ? MWID : MLEN));
  const laps: { at: StripPoint; n: number }[] = [{ at: strip(pts[0].x + 0.5, pts[0].y + 0.5), n: 1 }];
  for (let k = 1; k < pts.length; k++) if (lapOf(pts[k]) !== lapOf(pts[k - 1])) laps.push({ at: strip(pts[k].x + 0.5, pts[k].y + 0.5), n: laps.length + 1 });

  // kinks: where the path's own way (over a few blocks) isn't straight on (on a slant down the map
  // the way is never quite straight down, and its bends are the rider steering: none there)
  const kinks: Kink[] = [];
  const wayAt = (x: number, y: number) => drawn.get(keyOf(Math.floor(x), Math.floor(y)))?.way ?? false;
  let open0: number | undefined;
  for (let k = 0; k < (down ? 0 : pts.length); k++) {
    const b = pts[Math.max(0, k - LOOK * 2)];
    const f = pts[Math.min(pts.length - 1, k + LOOK * 2)];
    const d = snap(f.x - b.x, f.y - b.y);
    const off = Math.abs(d[0] - way[0]) > 1e-6 || Math.abs(d[1] - way[1]) > 1e-6;
    if (off && open0 === undefined) open0 = k;
    if ((!off || k === pts.length - 1) && open0 !== undefined) {
      const p0 = pts[open0];
      const p1 = pts[k];
      // a short wobble (dodging) isn't a bend
      if (p1.s - p0.s >= LOOK * 1.5) {
        const m = pts[Math.round((open0 + k) / 2)];
        // straight on from where it bent, past a lane's width: still the way there means another way went on
        let ahead = 0;
        for (let t = LOOK * 2; t <= LOOK * 3; t++) ahead += wayAt(p0.x + 0.5 + way[0] * t, p0.y + 0.5 + way[1] * t) ? 1 : 0;
        const taken = ahead * 2 > LOOK + 1;
        kinks.push({ a0: strip(p0.x + 0.5, p0.y + 0.5).a, a1: strip(p1.x + 0.5, p1.y + 0.5).a, at: strip(m.x + 0.5, m.y + 0.5), taken });
      }
      open0 = undefined;
    }
  }

  // marks: each at the lap the way meets it (its block's claim), else the nearest place by the path
  const placed = marks.map((m) => {
    const cx = m.x + (m.w - 1) / 2;
    const cy = m.y + (m.h - 1) / 2;
    const c = claim.get(m.y * MLEN + m.x);
    let ux = c ? c.x - m.x : 0;
    let uy = c ? c.y - m.y : 0;
    if (!c) {
      let best = Infinity;
      for (const p of pts) {
        const dx = Math.round((p.x - cx) / MLEN) * MLEN;
        const dy = Math.round((p.y - cy) / MWID) * MWID;
        const dist = Math.hypot(cx + dx - p.x, cy + dy - p.y);
        if (dist < best) ((best = dist), (ux = dx), (uy = dy));
      }
    }
    return { mark: m, at: at(cx + ux, cy + uy) };
  });

  // the strip's box, and its panels from the start: from the bottom up (from the top down on a way down)
  const corners = [...drawn.values()].flatMap((c) => [strip(c.x, c.y), strip(c.x + 1, c.y), strip(c.x, c.y + 1), strip(c.x + 1, c.y + 1)]);
  const box: CoursePanel = {
    a0: Math.min(...corners.map((p) => p.a)),
    a1: Math.max(...corners.map((p) => p.a)),
    c0: Math.min(...corners.map((p) => p.c)),
    c1: Math.max(...corners.map((p) => p.c)),
  };
  const panels = cutPanels(box.a0, box.a1, height, overlap).map(([a0, a1]) => {
    const inside = corners.filter((p) => p.a >= a0 - 1 && p.a <= a1 + 1);
    return { a0, a1, c0: Math.min(...inside.map((p) => p.c)), c1: Math.max(...inside.map((p) => p.c)) };
  });
  if (down) panels.reverse();
  return { up, down, right, cells: [...drawn.values()], marks: placed, seams, laps, kinks, shortcuts, panels, box };
}

/** The panel (0 the start's) a place along the strip is drawn on: the first whose top it is under (whose foot it is over, on a way down). */
export const panelOf = (l: { panels: CoursePanel[]; down?: boolean }, a: number): number => {
  const i = l.panels.findIndex((p) => (l.down ? a > p.a0 + 0.5 : a < p.a1 - 0.5));
  return i < 0 ? l.panels.length - 1 : i;
};

/**
 * The strip drawn: one palette index per pixel for the panel `p` at `scale` pixels a block,
 * sampled from `source` (the whole map at BLEN pixels a block) nearest-neighbor, so every block
 * stays crisp and every color stays in the palette; `blank` where nothing is drawn.
 */
export function courseRaster(
  l: CourseLayout<unknown>,
  p: CoursePanel,
  source: { width: number; height: number; pixels: Uint8Array },
  blen: number,
  scale: number,
  blank: number,
): { width: number; height: number; pixels: Uint16Array } {
  const width = Math.max(1, Math.round((p.c1 - p.c0) * scale));
  const height = Math.max(1, Math.round((p.a1 - p.a0) * scale));
  const pixels = new Uint16Array(width * height).fill(blank);
  const drawn = new Set(l.cells.map((c) => keyOf(c.x, c.y)));
  const [ux, uy] = l.up;
  const [rx, ry] = l.right;
  for (let py = 0; py < height; py++) {
    const a = p.a1 - (py + 0.5) / scale;
    for (let px = 0; px < width; px++) {
      const c = p.c0 + (px + 0.5) / scale;
      // back from the strip to the map: c along right, a along up
      const x = c * rx + a * ux;
      const y = c * ry + a * uy;
      const bx = Math.floor(x);
      const by = Math.floor(y);
      if (!drawn.has(keyOf(bx, by))) continue;
      const sx = mod(bx, MLEN) * blen + Math.min(blen - 1, Math.floor((x - bx) * blen));
      const sy = mod(by, MWID) * blen + Math.min(blen - 1, Math.floor((y - by) * blen));
      pixels[py * width + px] = source.pixels[sy * source.width + sx];
    }
  }
  return { width, height, pixels };
}
