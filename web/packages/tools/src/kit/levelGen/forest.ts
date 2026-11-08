// Forest: cellular automata on a tree mask (about half trees, smoothed over four passes), a few
// round clearings, only the biggest open region kept (the rest becomes trees), then a winding path
// (the cheapest walk over noisy costs) from the entry to the farthest open cell, rocks and flowers
// in the open. Cells beside the path stay open, so the path never has to squeeze.
import { DECOR, FLOOR, PATH, ROCK, TREE, closed, farthest, newArea, openAround, type Area, type Stream } from './grid';

function smooth(a: Area): void {
  const { w, h, cells } = a;
  const next = cells.slice();
  for (let y = 0; y < h; y++) {
    const inY = y > 0 && y < h - 1;
    for (let x = 0; x < w; x++) {
      let trees = 0;
      if (inY && x > 0 && x < w - 1) {
        // inside the area: all eight neighbors exist, so no bounds tests
        const i = y * w + x;
        trees =
          +(cells[i - w - 1] === TREE) +
          +(cells[i - w] === TREE) +
          +(cells[i - w + 1] === TREE) +
          +(cells[i - 1] === TREE) +
          +(cells[i + 1] === TREE) +
          +(cells[i + w - 1] === TREE) +
          +(cells[i + w] === TREE) +
          +(cells[i + w + 1] === TREE);
      } else {
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || cells[ny * w + nx] === TREE) trees++;
          }
      }
      next[y * w + x] = trees >= 4 ? TREE : FLOOR;
    }
  }
  cells.set(next);
}

/** Every open cell outside the biggest open region becomes a tree. Returns the open cells left. One shared flood fill, so a map of many small pockets costs no more than one pass. */
function keepBiggest(a: Area): number {
  const { w, h, cells } = a;
  const seen = new Int32Array(cells.length).fill(-1);
  const queue = new Int32Array(cells.length);
  let best = -1,
    bestSize = 0,
    id = 0;
  for (let s = 0; s < cells.length; s++) {
    if (closed(cells[s]) || seen[s] >= 0) continue;
    let head = 0,
      tail = 0;
    queue[tail++] = s;
    seen[s] = id;
    while (head < tail) {
      const c = queue[head++];
      const x = c % w,
        y = (c / w) | 0;
      if (x + 1 < w && seen[c + 1] < 0 && !closed(cells[c + 1])) ((seen[c + 1] = id), (queue[tail++] = c + 1));
      if (x > 0 && seen[c - 1] < 0 && !closed(cells[c - 1])) ((seen[c - 1] = id), (queue[tail++] = c - 1));
      if (y + 1 < h && seen[c + w] < 0 && !closed(cells[c + w])) ((seen[c + w] = id), (queue[tail++] = c + w));
      if (y > 0 && seen[c - w] < 0 && !closed(cells[c - w])) ((seen[c - w] = id), (queue[tail++] = c - w));
    }
    if (tail > bestSize) ((best = id), (bestSize = tail));
    id++;
  }
  for (let i = 0; i < cells.length; i++) if (!closed(cells[i]) && seen[i] !== best) cells[i] = TREE;
  return bestSize;
}

/** The cheapest route over per-cell costs (Dijkstra with a binary heap). */
export function route(a: Area, from: number, to: number, cost: Float32Array): number[] {
  const best = new Float64Array(a.cells.length).fill(Infinity);
  const from_ = new Int32Array(a.cells.length).fill(-1);
  const heap: [number, number][] = [[0, from]];
  best[from] = 0;
  const push = (e: [number, number]) => {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1,
          r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, c] = pop();
    if (d > best[c]) continue;
    if (c === to) break;
    const x = c % a.w,
      y = (c / a.w) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) continue;
      const n = ny * a.w + nx;
      if (closed(a.cells[n])) continue;
      const nd = d + cost[n];
      if (nd < best[n]) ((best[n] = nd), (from_[n] = c), push([nd, n]));
    }
  }
  const out: number[] = [];
  for (let c = to; c >= 0; c = from_[c]) out.push(c);
  return out.reverse();
}

export interface Forest {
  area: Area;
  entry: number;
  exit: number;
  open: number;
  trail: boolean;
}

export interface ForestUses {
  path: boolean;
  rock: boolean;
  decor: boolean;
}

/** A forest filling a w by h area (at least 12 by 12). The uses switch on the trail, rocks and flowers. */
export function forest(w: number, h: number, r: Stream, uses: ForestUses): Forest {
  const area = newArea(w, h, TREE);
  let open = 0;
  for (let attempt = 0; attempt < 6 && open < w * h * 0.22; attempt++) {
    const fill = 0.5 - attempt * 0.03;
    for (let i = 0; i < area.cells.length; i++) area.cells[i] = r.chance(fill) ? TREE : FLOOR;
    for (let p = 0; p < 4; p++) smooth(area);
    for (let c = r.int(2, 4); c > 0; c--) {
      const rad = r.int(3, 5),
        cx = r.int(rad, Math.max(rad, w - 1 - rad)),
        cy = r.int(rad, Math.max(rad, h - 1 - rad));
      for (let y = cy - rad; y <= cy + rad; y++)
        for (let x = cx - rad; x <= cx + rad; x++)
          if (x >= 0 && y >= 0 && x < w && y < h && (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) area.cells[y * w + x] = FLOOR;
    }
    open = keepBiggest(area);
  }
  // the entry: the open cell furthest left (first in reading order); the exit: furthest from it by steps
  let entry = area.cells.findIndex((c) => !closed(c));
  for (let i = 0; i < area.cells.length; i++) if (!closed(area.cells[i]) && i % w < entry % w) entry = i;
  const exit = farthest(area, entry);
  let trail = false;
  if (uses.path && entry !== exit) {
    const cost = new Float32Array(area.cells.length);
    for (let i = 0; i < cost.length; i++) cost[i] = 1 + r.next() * 4;
    for (const c of route(area, entry, exit, cost)) area.cells[c] = PATH;
    trail = true;
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = y * w + x;
      if (area.cells[c] !== FLOOR || c === entry || c === exit || !openAround(area, x, y)) continue;
      if (uses.rock && r.chance(0.02)) area.cells[c] = ROCK;
      else if (uses.decor && r.chance(0.05)) area.cells[c] = DECOR;
    }
  return { area, entry, exit, open, trail };
}
