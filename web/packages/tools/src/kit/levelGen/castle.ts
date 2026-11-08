// Castle: an outer wall two cells thick with a tower at each corner and a gate in the south wall, a
// courtyard, and a keep in the courtyard's north half. The keep is a small dungeon (rooms joined by
// corridors, from dungeon.ts) with its own door facing the courtyard. Nothing outside the outer wall.
import { DECOR, DOORC, FLOOR, PATH, WALL, distances, newArea, openAround, type Area, type Stream } from './grid';
import { dungeon } from './dungeon';

export const CASTLE_MIN = { w: 30, h: 24 };

export interface Castle {
  area: Area;
  /** Inside the gate. */
  entry: number;
  /** The far end of the keep. */
  exit: number;
}

const TOWER = 5;

/** A castle filling a w by h area (at least 30 by 24). `path` draws a road from the gate to the keep door; `decorate` scatters decoration in the courtyard. */
export function castle(w: number, h: number, r: Stream, o: { path: boolean; decorate: boolean }): Castle {
  const area = newArea(w, h, WALL);
  const at = (x: number, y: number) => y * w + x;
  // the courtyard, inside a wall two thick
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) area.cells[at(x, y)] = FLOOR;
  // corner towers: a 3 by 3 room each, opening to the courtyard
  for (const [tx, ty] of [
    [0, 0],
    [w - TOWER, 0],
    [0, h - TOWER],
    [w - TOWER, h - TOWER],
  ]) {
    for (let y = ty; y < ty + TOWER; y++) for (let x = tx; x < tx + TOWER; x++) area.cells[at(x, y)] = WALL;
    for (let y = ty + 1; y <= ty + 3; y++) for (let x = tx + 1; x <= tx + 3; x++) area.cells[at(x, y)] = FLOOR;
    const east = tx === 0;
    // the opening faces the courtyard on the row of the tower's middle
    area.cells[at(east ? tx + 4 : tx, ty + 2)] = FLOOR;
    area.cells[at(east ? tx + 5 : tx - 1, ty + 2)] = FLOOR;
  }
  // the gate: two cells wide through the south wall; the outer row holds door blocks
  const gx = (w >> 1) - 1;
  for (const x of [gx, gx + 1]) {
    area.cells[at(x, h - 1)] = DOORC;
    area.cells[at(x, h - 2)] = FLOOR;
  }
  const entry = at(gx, h - 3);
  // the keep: a dungeon in a rectangle of the courtyard, then a door in its south wall
  const cw = w - 4,
    ch = h - 4;
  const kw = Math.min(Math.max(12, Math.round(cw * 0.6)), cw - 6),
    kh = Math.min(Math.max(12, Math.round(ch * 0.62)), ch - 6);
  const kx = 2 + ((cw - kw) >> 1),
    ky = 3;
  const d = dungeon(kw, kh, r, o.decorate);
  for (let y = 0; y < kh; y++) for (let x = 0; x < kw; x++) area.cells[at(kx + x, ky + y)] = d.area.cells[y * kw + x];
  const doorX = kx + (kw >> 1) + r.int(-2, 2);
  const doorY = ky + kh - 1;
  area.cells[at(doorX, doorY)] = DOORC;
  // a short passage from the door up to the first open cell of the keep
  for (let y = doorY - 1; y > ky && area.cells[at(doorX, y)] === WALL; y--) area.cells[at(doorX, y)] = FLOOR;
  // the road: up from the gate to the row below the keep door, then along to the door
  if (o.path) {
    for (let y = h - 3; y >= doorY + 1; y--) area.cells[at(gx, y)] = PATH;
    for (let x = Math.min(gx, doorX); x <= Math.max(gx, doorX); x++) area.cells[at(x, doorY + 1)] = PATH;
  }
  if (o.decorate)
    for (let n = r.int(4, 8); n > 0; n--) {
      const x = r.int(3, w - 4),
        y = r.int(doorY + 2, h - 5);
      const c = at(x, y);
      if (area.cells[c] === FLOOR && openAround(area, x, y) && Math.abs(x - gx) > 2) area.cells[c] = DECOR;
    }
  // the exit is the far end of the keep
  const dist = distances(area, entry);
  let exit = at(doorX, doorY);
  for (let y = ky; y < ky + kh; y++) for (let x = kx; x < kx + kw; x++) if (dist[at(x, y)] > dist[exit]) exit = at(x, y);
  return { area, entry, exit };
}
