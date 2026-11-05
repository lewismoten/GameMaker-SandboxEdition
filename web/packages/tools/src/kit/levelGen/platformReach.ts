// The reach model for side views: where a hero with these physics (jumpModel.ts) can get to in a grid of
// plain cell codes. It plays his real moves tick by tick (walk four pixels, jump, fall off a ledge, climb a
// ladder, steering in the air for different lengths) from the start, against the cells: solid cells block
// him and stop a jump at the ceiling, a ledge (PLAT) is solid on top only, spikes hurt (a move through them
// is thrown away), and he lands only with his middle over a footing, as PLAYGAME does. It records every
// cell he touches, so coins and keys can be proven collectable. No DOM.
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { HAZARD, LADDER, LOCK, PLAT, WALL, type Area } from './grid';
import { ARC_TICKS, Flight, arcVariants, type HeroPhysics } from './jumpModel';

const FREE = 0,
  BLOCKED = 1,
  DEADLY = 2;

export interface Reach {
  /** Cells the hero's body overlapped on some move he can make (row-major, as the area). */
  touched: Uint8Array;
  /** Cells he can stand in (his feet cell). */
  stood: Uint8Array;
}

/** Plays every move from `start` (the feet cell) and says where he gets. `locksOpen`: the locked doors are open. With `goal` (a feet cell) it stops as soon as he can stand there. */
export function reachFrom(a: Area, p: HeroPhysics, start: number, locksOpen: boolean, goal?: number): Reach {
  const { w, h } = a;
  const touched = new Uint8Array(w * h),
    stood = new Uint8Array(w * h);
  const cell = (cx: number, cy: number): number => (cx < 0 || cx >= w || cy >= h ? WALL : cy < 0 ? 0xff : a.cells[cy * w + cx]);
  const solid = (c: number) => c === WALL || (c === LOCK && !locksOpen);
  /** What his body is in at (X, py): the cells of the two rows he fills. */
  const body = (X: number, py: number): number => {
    const y0 = Math.floor((py - BLEN) / BLEN),
      y1 = Math.floor((py + BLEN - 1) / BLEN);
    let r = FREE;
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = Math.floor(X / BLEN); cx <= Math.floor((X + BLEN - 1) / BLEN); cx++) {
        const c = cell(cx, cy);
        if (c === HAZARD) return DEADLY;
        if (c === 0xff) continue;
        if (solid(c)) r = BLOCKED;
      }
    return r;
  };
  const mark = (X: number, py: number) => {
    const y0 = Math.floor((py - BLEN) / BLEN),
      y1 = Math.floor((py + BLEN - 1) / BLEN);
    for (let cy = Math.max(0, y0); cy <= Math.min(h - 1, y1); cy++)
      for (let cx = Math.floor(X / BLEN); cx <= Math.floor((X + BLEN - 1) / BLEN); cx++) if (cx >= 0 && cx < w) touched[cy * w + cx] = 1;
  };
  /** Footing under his middle (or a ladder holding him). Only at whole rows. */
  const standable = (X: number, row: number): boolean => {
    const cm = Math.floor((X + BLEN / 2) / BLEN);
    const below = cell(cm, row + 1);
    return solid(below) || below === PLAT || cell(cm, row) === LADDER || cell(cm, row - 1) === LADDER;
  };
  /** Pixels a walking step moves him. */
  const STEP = Math.max(1, Math.round(p.vx));
  const nodes = w * BLEN * h;
  const seen = new Uint8Array(nodes);
  const id = (X: number, row: number) => row * w * BLEN + X;
  const queue: number[] = [];
  let found = false;
  const push = (X: number, row: number) => {
    if (row < 0 || row >= h || X < 0 || X >= w * BLEN) return;
    const i = id(X, row);
    if (seen[i]) return;
    seen[i] = 1;
    queue.push(X, row);
    stood[row * w + Math.min(w - 1, Math.floor((X + BLEN / 2) / BLEN))] = 1;
    if (goal !== undefined && stood[goal]) found = true;
  };
  const variants = arcVariants();
  const fly = (X0: number, py0: number, kind: 'jump' | 'fall', dir: -1 | 0 | 1, steerTicks: number) => {
    const f = new Flight(p, kind, dir, steerTicks);
    let X = X0,
      py = py0;
    for (let t = 0; t < ARC_TICKS; t++) {
      const s = f.step();
      if (s.dx) {
        const r = body(X + s.dx, py);
        if (r === DEADLY) return;
        if (r === FREE) X += s.dx;
      }
      const ny = py + s.dy;
      if (s.dy > 0) {
        // the row his feet reach: he lands if his middle is over a footing there (and ignores a corner it is not over)
        const rr = Math.floor((ny + BLEN - 1) / BLEN);
        if (rr >= h) return;
        const cm = Math.floor((X + BLEN / 2) / BLEN);
        if (rr > Math.floor((py + BLEN - 1) / BLEN)) {
          const c = cell(cm, rr);
          if (solid(c) || c === PLAT) {
            const row = rr - 1;
            if (body(X, row * BLEN) !== FREE) return;
            mark(X, row * BLEN);
            push(X, row);
            return;
          }
        }
        const b = body(X, ny);
        if (b === DEADLY) return;
        if (b === BLOCKED && [Math.floor((ny - BLEN) / BLEN), Math.floor((ny + BLEN - 1) / BLEN)].some((cy) => solid(cell(cm, cy)))) return;
        py = ny;
      } else if (s.dy < 0) {
        if (body(X, ny) === BLOCKED) {
          f.bump();
          // up to the ceiling
          let top = py;
          while (body(X, top - 1) === FREE) top--;
          py = top;
        } else if (body(X, ny) === DEADLY) return;
        else py = ny;
      }
      mark(X, py);
      if (py < -BLEN) return;
    }
  };
  push(start % w * BLEN, Math.floor(start / w));
  for (let q = 0; q < queue.length && !found; q += 2) {
    const X = queue[q],
      row = queue[q + 1];
    const py = row * BLEN;
    if (body(X, py) !== FREE) continue;
    mark(X, py);
    const held = cell(Math.floor((X + BLEN / 2) / BLEN), row) === LADDER;
    // walk either way a step
    for (const d of [-1, 1] as const) {
      const nx = X + d * STEP;
      if (nx < 0 || nx > w * BLEN - BLEN || body(nx, py) !== FREE) continue;
      mark(nx, py);
      if (standable(nx, row)) push(nx, row);
      else for (const v of variants) if (v.kind === 'fall' && v.dir !== 0) fly(nx, py, 'fall', v.dir, v.steerTicks);
    }
    // jump (and let go of a ladder)
    for (const v of variants) if (v.kind === 'jump') fly(X, py, 'jump', v.dir, v.steerTicks);
    if (!standable(X, row)) for (const v of variants) if (v.kind === 'fall') fly(X, py, 'fall', v.dir, v.steerTicks);
    // climb: straight up or down a ladder
    if (held && p.climb && X % BLEN === 0) {
      const cx = X / BLEN;
      for (const d of [-1, 1]) if (cell(cx, row + d) === LADDER && body(X, (row + d) * BLEN) === FREE) push(X, row + d);
    }
  }
  return { touched, stood };
}

/** Whether a cell was touched. */
export const touchedAt = (r: Reach, cell: number): boolean => r.touched[cell] === 1;
