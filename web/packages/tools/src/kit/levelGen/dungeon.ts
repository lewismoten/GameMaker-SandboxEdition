// Dungeon: binary space partition. The area splits into leaves, each leaf holds one room, and every pair
// of sibling branches is joined by an L-shaped corridor, so all rooms are connected. A few extra
// corridors make loops. Everything outside rooms and corridors stays wall.
import { DECOR, FLOOR, WALL, farthest, newArea, openAround, type Area, type Stream } from './grid';

interface Leaf {
  x: number;
  y: number;
  w: number;
  h: number;
  a?: Leaf;
  b?: Leaf;
  room?: { x: number; y: number; w: number; h: number };
}

const MIN_LEAF = 9;

function split(n: Leaf, r: Stream, depth: number): void {
  const horizontal = n.w < n.h ? true : n.h < n.w ? false : r.chance(0.5);
  const size = horizontal ? n.h : n.w;
  if (depth > 6 || size < MIN_LEAF * 2 || (depth > 1 && r.chance(0.15))) return;
  const cut = r.int(MIN_LEAF, size - MIN_LEAF);
  n.a = horizontal ? { x: n.x, y: n.y, w: n.w, h: cut } : { x: n.x, y: n.y, w: cut, h: n.h };
  n.b = horizontal ? { x: n.x, y: n.y + cut, w: n.w, h: n.h - cut } : { x: n.x + cut, y: n.y, w: n.w - cut, h: n.h };
  split(n.a, r, depth + 1);
  split(n.b, r, depth + 1);
}

const leaves = (n: Leaf): Leaf[] => (n.a && n.b ? [...leaves(n.a), ...leaves(n.b)] : [n]);
const centre = (l: Leaf) => ({ x: l.room!.x + (l.room!.w >> 1), y: l.room!.y + (l.room!.h >> 1) });

function carve(a: Area, x0: number, y0: number, x1: number, y1: number): void {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) a.cells[y * a.w + x] = FLOOR;
}

function corridor(a: Area, p: { x: number; y: number }, q: { x: number; y: number }, r: Stream): void {
  if (r.chance(0.5)) {
    carve(a, p.x, p.y, q.x, p.y);
    carve(a, q.x, p.y, q.x, q.y);
  } else {
    carve(a, p.x, p.y, p.x, q.y);
    carve(a, p.x, q.y, q.x, q.y);
  }
}

/** A room from any leaf under `n`. */
const anyRoom = (n: Leaf, r: Stream): Leaf => r.pick(leaves(n));

function join(n: Leaf, a: Area, r: Stream): void {
  if (!n.a || !n.b) return;
  join(n.a, a, r);
  join(n.b, a, r);
  corridor(a, centre(anyRoom(n.a, r)), centre(anyRoom(n.b, r)), r);
}

export interface Dungeon {
  area: Area;
  entry: number;
  exit: number;
  rooms: number;
  /** Whether decoration was placed (needs the role). */
  decorated: boolean;
}

/** A dungeon filling a w by h area (at least 12 by 12). `decorate` sprinkles decoration cells in the rooms. */
export function dungeon(w: number, h: number, r: Stream, decorate: boolean): Dungeon {
  const area = newArea(w, h, WALL);
  // one cell of wall all round the area, so the walls close
  const root: Leaf = { x: 1, y: 1, w: w - 2, h: h - 2 };
  split(root, r, 0);
  const all = leaves(root);
  for (const l of all) {
    const rw = r.int(Math.min(4, l.w - 3), l.w - 3);
    const rh = r.int(Math.min(4, l.h - 3), l.h - 3);
    l.room = { x: l.x + 1 + r.int(0, l.w - 2 - rw), y: l.y + 1 + r.int(0, l.h - 2 - rh), w: rw, h: rh };
    carve(area, l.room.x, l.room.y, l.room.x + rw - 1, l.room.y + rh - 1);
  }
  join(root, area, r);
  for (let i = 0; i < all.length >> 2; i++) corridor(area, centre(r.pick(all)), centre(r.pick(all)), r);
  // the hero comes in at the first room's middle; the exit is the open cell farthest from it
  const first = centre(all[0]);
  const entry = first.y * w + first.x;
  const exit = farthest(area, entry);
  let decorated = false;
  if (decorate)
    for (const l of all) {
      const room = l.room!;
      if (room.w * room.h < 20) continue;
      for (let i = r.int(1, 3); i > 0; i--) {
        const x = room.x + r.int(0, room.w - 1),
          y = room.y + r.int(0, room.h - 1);
        const c = y * w + x;
        if (c === entry || c === exit || !openAround(area, x, y)) continue;
        area.cells[c] = DECOR;
        decorated = true;
      }
    }
  return { area, entry, exit, rooms: all.length, decorated };
}
