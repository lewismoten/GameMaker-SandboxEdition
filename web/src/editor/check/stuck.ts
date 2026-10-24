// Softlocks from an exploration: resting places the hero can reach but never leave the scene
// from (no exit, no link back), grouped into areas with the likeliest reason: a pit, a drop
// that only goes one way, or a lock whose key the hero can no longer get. A place is only
// called stuck when every place it leads to was tried, so a run cut short by its time budget
// doesn't report false alarms, and a place the hero only dies from is a death, not a softlock.
import { BACKBL, type Block } from '../../formats/blocks';
import { MLEN } from '../../formats/map';
import type { Exploration } from './explore';

export type StuckReason = 'pit' | 'drop' | 'lock' | 'unknown';

export interface StuckArea {
  /** Map cells of the places in the area. */
  cells: number[];
  /** The place the hero first arrives in it at. */
  entry: number;
  reason: StuckReason;
  /** Where the way in was (the edge of the drop, the lock's cell). */
  at?: number;
}

/** Places that lead to a way out of the scene (an exit or any link). */
export function canLeave(ex: Exploration): Uint8Array {
  const n = ex.places.length;
  const ok = new Uint8Array(n);
  const back: number[][] = Array.from({ length: n }, () => []);
  ex.places.forEach((p, i) => p.out.forEach((t) => back[t].push(i)));
  const q: number[] = [];
  ex.places.forEach((p, i) => {
    if (p.exits.length) {
      ok[i] = 1;
      q.push(i);
    }
  });
  while (q.length) for (const pr of back[q.pop()!]) if (!ok[pr]) ((ok[pr] = 1), q.push(pr));
  return ok;
}

/** Lock blocks: a touch they refuse while a counter is short, standing in the way (solid). */
export function lockBlocks(bg: Block[]): Set<number> {
  const out = new Set<number>();
  for (let n = 0; n < BACKBL; n++) {
    const b = bg[n];
    if (b && b.solid && (b.effect >= 20 || b.effect === 3) && b.eamt < 0) out.add(n);
  }
  return out;
}

/**
 * The stuck areas of an exploration. `map` is the scene's map as loaded and `bg` its blocks,
 * to spot locks beside an area.
 */
export function stuckAreas(ex: Exploration, map: Uint8Array, bg: Block[]): StuckArea[] {
  if (!ex.places.some((p) => p.exits.length)) return [];
  const ok = canLeave(ex);
  const n = ex.places.length;
  // a place whose onward places weren't all tried might yet have a way out
  const unknown = new Uint8Array(n);
  const back: number[][] = Array.from({ length: n }, () => []);
  ex.places.forEach((p, i) => p.out.forEach((t) => back[t].push(i)));
  const q: number[] = [];
  ex.places.forEach((p, i) => {
    if (!p.done && !ok[i]) {
      unknown[i] = 1;
      q.push(i);
    }
  });
  while (q.length) for (const pr of back[q.pop()!]) if (!unknown[pr] && !ok[pr]) ((unknown[pr] = 1), q.push(pr));
  // a place where every move dies (a death sequence under way, a hold that kills) costs a life,
  // and the scene starts over: that is a death, not a softlock
  const stuck = ex.places.map((p, i) => !ok[i] && !unknown[i] && !p.doomed);
  const locks = lockBlocks(bg);
  // areas: stuck places joined by their moves
  const area = new Int32Array(n).fill(-1);
  const out: StuckArea[] = [];
  for (let i = 0; i < n; i++) {
    if (!stuck[i] || area[i] >= 0) continue;
    const id = out.length;
    const members: number[] = [];
    const stack = [i];
    area[i] = id;
    while (stack.length) {
      const p = stack.pop()!;
      members.push(p);
      for (const t of [...ex.places[p].out, ...back[p]]) if (stuck[t] && area[t] < 0) ((area[t] = id), stack.push(t));
    }
    // the way in: the earliest member reached from a place that isn't stuck
    const entry = members.reduce((a, b) => (ex.places[b].tick < ex.places[a].tick ? b : a));
    const cells = [...new Set(members.map((m) => ex.places[m].cell))];
    let reason: StuckReason = 'unknown';
    let at: number | undefined;
    const lockCell = cells
      .flatMap((c) => [c - 1, c + 1, c - MLEN, c + MLEN, c - MLEN - 1, c - MLEN + 1])
      .find((c) => c >= 0 && c < map.length && locks.has(map[c]));
    const parent = ex.places[entry].via?.parent;
    if (ex.places[entry].dropIn) {
      reason = 'drop';
      at = parent !== undefined ? ex.places[parent].cell : undefined;
    } else if (lockCell !== undefined) {
      reason = 'lock';
      at = lockCell;
    } else if (cells.length <= 6) reason = 'pit';
    out.push({ cells, entry, reason, at });
  }
  return out;
}
