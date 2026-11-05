// Props for a generated area: locked doors in one-wide passages with each key in a cell the hero can
// reach before that lock, treasure in corners and dead ends, a heart, and monster spots away from the
// entry. Works on the plain cell codes and writes no blocks. No DOM. The key-before-lock rule holds by
// construction (a lock only goes where it cuts the entry off from the exit, and its key goes in the part
// still reachable with that lock and every later one shut) and `proveKeys` checks it again by playing it out.
import { KEY, LIFE, LOCK, TREASURE, closed, distances, FLOOR, type Area, type Stream } from './grid';

export interface LockInfo {
  /** The door's cell and its key's cell (area-local indexes), and the lock number they share. */
  cell: number;
  key: number;
  pair: number;
  /** 0 is the nearest to the entry. */
  order: number;
}

export interface PropsOptions {
  /** Lock numbers that have both a locked-door block and a key block. */
  pairs: number[];
  treasure: boolean;
  life: boolean;
  /** Monster numbers to place (empty: none). */
  monsters: number[];
}

export interface Props {
  locks: LockInfo[];
  treasure: number[];
  life?: number;
  monsters: { cell: number; monnum: number }[];
}

const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** How many of the eight neighbors are shut or off the area (a corner has 5, a dead end 7). */
function shut(a: Area, c: number): number {
  const x = c % a.w,
    y = (c / a.w) | 0;
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h || closed(a.cells[ny * a.w + nx])) n++;
    }
  return n;
}

/** The area as a copy where the given cells are walls. */
function withShut(a: Area, cells: Iterable<number>): Area {
  const cp: Area = { w: a.w, h: a.h, cells: a.cells.slice() };
  for (const c of cells) cp.cells[c] = 0;
  return cp;
}

/** A shortest walk of cells from `from` to `to` (inclusive), or []. */
function walk(a: Area, from: number, to: number): number[] {
  const d = distances(a, to);
  if (d[from] < 0) return [];
  const out = [from];
  while (out[out.length - 1] !== to) {
    const c = out[out.length - 1];
    const x = c % a.w,
      y = (c / a.w) | 0;
    let next = -1;
    for (const [dx, dy] of SIDES) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) continue;
      const n = ny * a.w + nx;
      if (d[n] >= 0 && d[n] < d[c] && next < 0) next = n;
    }
    out.push(next);
  }
  return out;
}

/** A cell in a one-wide passage: open on exactly two opposite sides. */
function inPassage(a: Area, c: number): boolean {
  const x = c % a.w,
    y = (c / a.w) | 0;
  const open = (dx: number, dy: number) => {
    const nx = x + dx,
      ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < a.w && ny < a.h && !closed(a.cells[ny * a.w + nx]);
  };
  return (open(1, 0) && open(-1, 0) && !open(0, 1) && !open(0, -1)) || (open(0, 1) && open(0, -1) && !open(1, 0) && !open(-1, 0));
}

/** Adds the props to `a` (changing its cell codes) and says what went where. Uses its own random stream. */
export function addProps(a: Area, entry: number, exit: number, r: Stream, o: PropsOptions): Props {
  const taken = new Set<number>([entry, exit]);
  const locks: LockInfo[] = [];
  const treasure: number[] = [];
  const monsters: Props['monsters'] = [];
  const space = (list: number[], c: number, gap: number) =>
    list.every((o2) => Math.max(Math.abs((o2 % a.w) - (c % a.w)), Math.abs(((o2 / a.w) | 0) - ((c / a.w) | 0))) >= gap);

  // locked doors: cut cells on the way from the entry to the exit
  if (o.pairs.length) {
    const route = walk(a, entry, exit);
    const cuts = route.filter(
      (c, i) => i >= 4 && i < route.length - 3 && a.cells[c] === FLOOR && inPassage(a, c) && distances(withShut(a, [c]), entry)[exit] < 0,
    );
    const n = Math.min(o.pairs.length, 3, cuts.length);
    const chosen: number[] = [];
    for (let j = 0; j < n; j++) chosen.push(cuts[Math.min(cuts.length - 1, Math.floor(((j + 1) * cuts.length) / (n + 1)))]);
    const uniq = [...new Set(chosen)];
    uniq.forEach((cell, order) => {
      // the part reachable from the entry with this lock and every later one shut
      const shutCells = uniq.slice(order);
      const reach = distances(withShut(a, shutCells), entry);
      let best = -1,
        bestScore = -1;
      for (let i = 0; i < reach.length; i++) {
        if (reach[i] < 3 || taken.has(i) || shutCells.includes(i)) continue;
        const sc = shut(a, i) * 4 + Math.min(reach[i], 40) + r.next() * 3;
        if (sc > bestScore) ((bestScore = sc), (best = i));
      }
      if (best < 0) return;
      taken.add(cell);
      taken.add(best);
      locks.push({ cell, key: best, pair: o.pairs[order % o.pairs.length], order });
    });
    for (const l of locks) {
      a.cells[l.cell] = LOCK;
      a.cells[l.key] = KEY;
    }
  }

  const dist = distances(a, entry);
  const open: number[] = [];
  for (let i = 0; i < dist.length; i++) if (dist[i] >= 0 && !taken.has(i) && a.cells[i] !== LOCK) open.push(i);

  // treasure: corners and dead ends, far ones first, spread out
  if (o.treasure) {
    const budget = Math.max(3, Math.min(12, Math.round(open.length / 150)));
    const scored = open
      .filter((i) => dist[i] >= 3 && shut(a, i) >= 5)
      .map((i) => ({ i, s: shut(a, i) * 3 + Math.min(dist[i], 60) / 2 + r.next() * 4 }))
      .sort((p, q) => q.s - p.s || p.i - q.i);
    for (const { i } of scored) {
      if (treasure.length >= budget) break;
      if (!space(treasure, i, 4)) continue;
      treasure.push(i);
      taken.add(i);
    }
  }
  let life: number | undefined;
  if (o.life && treasure.length > 2) {
    life = treasure.pop();
    a.cells[life!] = LIFE;
  }
  for (const c of treasure) a.cells[c] = TREASURE;

  // monsters: open cells at least five steps from the entry, spread out, never on a prop
  if (o.monsters.length) {
    const budget = Math.max(2, Math.min(10, Math.round(open.length / 130)));
    const spots = open.filter((i) => dist[i] >= 5 && !taken.has(i) && shut(a, i) <= 2);
    const placed: number[] = [];
    for (let tries = 0; tries < spots.length * 2 && monsters.length < budget && spots.length; tries++) {
      const c = spots[Math.floor(r.next() * spots.length)];
      if (!space(placed, c, 5)) continue;
      placed.push(c);
      monsters.push({ cell: c, monnum: r.pick(o.monsters) });
    }
    monsters.sort((p, q) => p.cell - q.cell);
  }
  return { locks, treasure, life, monsters };
}

/**
 * Plays the keys out on the cell codes: from the entry, a locked door opens once the hero has picked up its
 * key. `strict` also asks that each key can be reached with its own lock and every later one shut
 * (the key-before-lock rule). Everything picked up and the exit must be reachable at the end.
 */
export function proveKeys(a: Area, entry: number, exit: number, locks: LockInfo[], pickups: number[]): { ok: boolean; strict: boolean } {
  const have = new Set<number>();
  const byCell = new Map(locks.map((l) => [l.cell, l]));
  const keyAt = new Map(locks.map((l) => [l.key, l.pair]));
  let reached = new Uint8Array(a.cells.length);
  for (let again = true; again;) {
    again = false;
    reached = new Uint8Array(a.cells.length);
    const stack = [entry];
    reached[entry] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      const kp = keyAt.get(c);
      if (kp !== undefined && !have.has(kp)) (have.add(kp), (again = true));
      const x = c % a.w,
        y = (c / a.w) | 0;
      for (const [dx, dy] of SIDES) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) continue;
        const n = ny * a.w + nx;
        const lock = byCell.get(n);
        if (reached[n] || closed(a.cells[n]) || (lock && !have.has(lock.pair))) continue;
        reached[n] = 1;
        stack.push(n);
      }
    }
  }
  const all = reached[exit] === 1 && locks.every((l) => reached[l.cell] && reached[l.key]) && pickups.every((c) => reached[c]);
  const strict = locks.every((l) => {
    const later = locks.filter((m) => m.order >= l.order).map((m) => m.cell);
    return distances(withShut(a, later), entry)[l.key] >= 0;
  });
  return { ok: all, strict };
}
