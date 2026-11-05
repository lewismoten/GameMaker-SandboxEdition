// Town: a winding main street from a west gate to an east gate, a few cross streets, a plaza where
// the main street meets the middle cross street, and houses on both sides of the main street with
// their doors facing it (a short path joins each door to the street). Trees ring the town and dot
// the open ground. Doors are returned as proposed links to an interior (the nearest to the plaza
// are shops); nothing is linked here. Pockets the layout cut off are filled in, so all open ground
// can be reached from the west gate.
import { DECOR, DOORC, FLOOR, PATH, ROOF, TREE, WALL, closed, distances, newArea, type Area, type Stream } from './grid';

export const TOWN_MIN = { w: 40, h: 28 };

export interface SceneLink {
  /** The door or site (area-local cell). */
  cell: number;
  /** What it could lead to. */
  kind: 'home' | 'shop' | 'town' | 'dungeon' | 'castle' | 'overworld';
  label: string;
}

export interface Town {
  area: Area;
  entry: number;
  exit: number;
  links: SceneLink[];
}

export interface TownUses {
  tree: boolean;
  decor: boolean;
}

/** A town filling a w by h area (at least 40 by 28). */
export function town(w: number, h: number, r: Stream, u: TownUses): Town {
  const area = newArea(w, h, FLOOR);
  const at = (x: number, y: number) => y * w + x;
  const set = (x: number, y: number, v: number) => x >= 0 && y >= 0 && x < w && y < h && (area.cells[at(x, y)] = v);
  // the main street's middle row at each column: it drifts a step now and then, within the middle third
  const mid = h >> 1,
    lo = Math.max(5, mid - (h >> 3)),
    hi = Math.min(h - 6, mid + (h >> 3));
  const yc: number[] = [];
  let y0 = mid;
  for (let x = 0; x < w; x++) {
    if (x % 4 === 3) y0 = Math.min(hi, Math.max(lo, y0 + r.int(-1, 1)));
    yc.push(y0);
  }
  const fixed = new Uint8Array(w * h); // street, plaza and yard cells houses keep clear of
  const mark = (x: number, y: number, pad: number) => {
    for (let dy = -pad; dy <= pad; dy++)
      for (let dx = -pad; dx <= pad; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) fixed[at(x + dx, y + dy)] = 1;
  };
  // the ring of trees first, so streets and gates cut through it
  if (u.tree) for (let i = 0; i < w * h; i++) if (i % w < 1 || i % w >= w - 1 || i < w || i >= w * (h - 1)) area.cells[i] = TREE;
  // cross streets: two wide, up and down from the main street
  const crossX: number[] = [];
  const midX = w >> 1;
  crossX.push(midX - 1);
  for (let x = midX - r.int(17, 21); x > 8; x -= r.int(20, 26)) crossX.push(x);
  for (let x = midX + r.int(17, 21); x < w - 9; x += r.int(20, 26)) crossX.push(x);
  // each runs to one side of the main street only (the middle one north, the others alternate), ends short of the
  // edge, and jogs one cell sideways partway, so the streets do not form a grid
  crossX.forEach((cx, i) => {
    const north = i % 2 === 0;
    const jogAt = r.int(0, 1) ? 0.4 : 0.6;
    const jog = r.chance(0.5) ? 1 : -1;
    const stop = r.int(3, 5);
    for (let k = 0; k <= 1; k++) {
      const cy = yc[Math.min(w - 1, cx + k)];
      const ends = north ? [stop, cy] : [cy, h - 1 - stop];
      for (let y = ends[0]; y <= ends[1]; y++) {
        const x = cx + k + (Math.abs(y - cy) > jogAt * (ends[1] - ends[0]) ? jog : 0);
        set(x, y, PATH);
        mark(x, y, 1);
      }
    }
  });
  // the main street, three wide, and the gates at both ends
  for (let x = 0; x < w; x++)
    for (let d = -1; d <= 1; d++) {
      set(x, yc[x] + d, PATH);
      mark(x, yc[x] + d, 1);
    }
  const links: SceneLink[] = [];
  set(0, yc[0], DOORC);
  set(w - 1, yc[w - 1], DOORC);
  links.push({ cell: at(0, yc[0]), kind: 'overworld', label: 'West gate' }, { cell: at(w - 1, yc[w - 1]), kind: 'overworld', label: 'East gate' });
  // the plaza: a paved square where the main street meets the middle cross street, with a feature in the middle
  const px = midX - 1,
    py = yc[midX];
  for (let y = py - 3; y <= py + 3; y++)
    for (let x = px - 4; x <= px + 5; x++) {
      set(x, y, PATH);
      mark(x, y, 1);
    }
  if (u.decor) (set(px + 0, py, DECOR), set(px + 1, py, DECOR));
  // houses along both sides; each faces the street with its door in the bottom (north side) or top (south side) row
  const doors: { cell: number; d: number }[] = [];
  for (const north of [true, false]) {
    for (let x = 2; x < w - 8;) {
      const hw = r.int(5, 7),
        hh = r.int(4, 5);
      let top = north ? h : 0;
      for (let i = 0; i < hw; i++) top = north ? Math.min(top, yc[x + i] - 2) : Math.max(top, yc[x + i] + 2);
      // north: the house's bottom row is two above the street's highest edge under it; south: its top row is two below the lowest
      const y1 = north ? top - 2 : top + 2;
      const yTop = north ? y1 - hh + 1 : y1;
      let fits = yTop >= 2 && yTop + hh <= h - 2;
      for (let yy = yTop - 1; fits && yy <= yTop + hh; yy++)
        for (let xx = x - 1; xx <= x + hw; xx++) if (xx < 1 || xx >= w - 1 || fixed[at(xx, yy)] || area.cells[at(xx, yy)] !== FLOOR) fits = false;
      if (!fits) {
        x += 1;
        continue;
      }
      for (let yy = yTop; yy < yTop + hh; yy++) for (let xx = x; xx < x + hw; xx++) set(xx, yy, yy < yTop + 2 ? ROOF : WALL);
      const dx = x + (hw >> 1);
      const dy = north ? yTop + hh - 1 : yTop;
      set(dx, dy, DOORC);
      // the stub of path from the door to the street
      if (north) for (let yy = dy + 1; yy <= yc[dx] - 1; yy++) set(dx, yy, PATH);
      else for (let yy = dy - 1; yy >= yc[dx] + 1; yy--) set(dx, yy, PATH);
      mark(x, yTop, 0);
      for (let yy = yTop; yy < yTop + hh; yy++) for (let xx = x; xx < x + hw; xx++) fixed[at(xx, yy)] = 1;
      doors.push({ cell: at(dx, dy), d: Math.abs(dx - px) });
      x += hw + r.int(1, 2);
    }
  }
  // the three nearest the plaza are shops, the rest homes
  const byPlaza = doors.slice().sort((a, b) => a.d - b.d || a.cell - b.cell);
  const shops = new Set(byPlaza.slice(0, Math.min(3, Math.floor(doors.length / 3))).map((d) => d.cell));
  let homes = 0,
    shopN = 0;
  for (const d of doors.slice().sort((a, b) => a.cell - b.cell))
    links.push(shops.has(d.cell) ? { cell: d.cell, kind: 'shop', label: `Shop ${++shopN}` } : { cell: d.cell, kind: 'home', label: `Home ${++homes}` });
  // trees and decoration in the open ground, not beside a street or a house
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const c = at(x, y);
      if (area.cells[c] !== FLOOR || fixed[c]) continue;
      if (u.tree && r.chance(0.03)) area.cells[c] = TREE;
      else if (u.decor && r.chance(0.05)) area.cells[c] = DECOR;
    }
  const entry = at(1, yc[1]),
    exit = at(w - 2, yc[w - 2]);
  // anything the layout cut off is filled in, so every open cell can be reached from the west gate
  const d = distances(area, entry);
  for (let i = 0; i < d.length; i++) if (!closed(area.cells[i]) && d[i] < 0) area.cells[i] = u.tree ? TREE : WALL;
  return { area, entry, exit, links };
}
