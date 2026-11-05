// Interiors: a home (one to three rooms) or a shop (one room with a counter). A wall ring with a door in
// the south wall (the entry and the exit), a lane two cells wide from the door, then furniture by the rules
// in furnish.ts. The shop's counter runs across the room between the door and the back shelves, with
// an open end so the shopkeeper's side can be reached. Nothing blocks the door. No DOM.
import { DOORC, FLOOR, WALL, newArea, type Area, type Stream } from './grid';
import { furnisher, type Avail, type Item, type Room } from './furnish';

export interface Interior {
  area: Area;
  entry: number;
  exit: number;
  items: Item[];
  /** Where the shopkeeper could stand (shops, behind the counter). */
  shopkeeper?: number;
  /** Roles whose pieces were left out because no block faced the right way. */
  skipped: string[];
}

export const INTERIOR_MIN = { w: 12, h: 10 };

/** An interior filling at most a 24 (home) or 26 (shop) by 16 or 14 part of the middle of a w by h area. */
export function interior(w: number, h: number, r: Stream, kind: 'home' | 'shop', avail: Avail): Interior {
  const area = newArea(w, h, WALL);
  const W = Math.min(w, kind === 'home' ? 24 : 26),
    H = Math.min(h, kind === 'home' ? 16 : 14);
  const ox = (w - W) >> 1,
    oy = (h - H) >> 1;
  const whole: Room = { x: ox + 1, y: oy + 1, w: W - 2, h: H - 2 };
  const at = (x: number, y: number) => y * w + x;
  for (let y = whole.y; y < whole.y + whole.h; y++) for (let x = whole.x; x < whole.x + whole.w; x++) area.cells[at(x, y)] = FLOOR;
  // the door in the south wall; its lane is two cells wide
  const dx = Math.max(whole.x + 1, Math.min(whole.x + whole.w - 3, whole.x + (whole.w >> 1) + r.int(-2, 2)));
  const dy = oy + H - 1;
  area.cells[at(dx, dy)] = DOORC;
  const entry = at(dx, dy - 1);
  const keep = new Set<number>();
  const lane = (rows: number) => {
    for (let k = 1; k <= rows; k++) for (const x of [dx, dx + 1]) keep.add(at(x, dy - k));
  };
  const f = furnisher(area, entry, avail, r, keep);
  const rooms: Room[] = [whole];
  let shopkeeper: number | undefined;

  if (kind === 'home') {
    lane(4);
    // a wall across the room with a two-wide doorway, away from the front door's lane
    if (whole.w >= 13 && r.chance(0.75)) {
      const px = r.int(whole.x + 5, whole.x + whole.w - 6);
      if (Math.abs(px - dx - 0.5) > 3) {
        const gy = r.int(whole.y + 1, whole.y + whole.h - 4);
        for (let y = whole.y; y < whole.y + whole.h; y++) area.cells[at(px, y)] = y === gy || y === gy + 1 ? FLOOR : WALL;
        for (const y of [gy, gy + 1]) for (const x of [px - 1, px, px + 1]) keep.add(at(x, y));
        rooms.splice(0, 1, { x: whole.x, y: whole.y, w: px - whole.x, h: whole.h }, { x: px + 1, y: whole.y, w: whole.x + whole.w - px - 1, h: whole.h });
      }
    }
    // a second wall across the room that does not hold the front door
    const back = rooms.find((m) => !(dx >= m.x && dx < m.x + m.w));
    if (back && back.w >= 6 && back.h >= 10 && r.chance(0.5)) {
      const py = r.int(back.y + 4, back.y + back.h - 5);
      const gx = r.int(back.x + 1, back.x + back.w - 3);
      for (let x = back.x; x < back.x + back.w; x++) area.cells[at(x, py)] = x === gx || x === gx + 1 ? FLOOR : WALL;
      for (const x of [gx, gx + 1]) for (const y of [py - 1, py, py + 1]) keep.add(at(x, y));
      rooms.splice(rooms.indexOf(back), 1, { ...back, h: py - back.y }, { x: back.x, y: py + 1, w: back.w, h: back.y + back.h - py - 1 });
    }
    const living = rooms.find((m) => dx >= m.x && dx < m.x + m.w)!;
    const tableCells = f.table(living, true, r.int(2, 3)) ?? [];
    f.against(living, 'stove', 1);
    f.against(living, 'shelf', r.int(1, 2));
    f.corner(living, 'plant');
    f.against(living, 'lamp', 1);
    if (rooms.length === 1) f.against(living, 'bed', 2);
    const near: number[] = [];
    for (const c of tableCells) for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) near.push(c + yy * w + xx);
    f.rug(near.filter((c) => c >= 0 && c < area.cells.length));
    for (const m of rooms) {
      if (m === living) continue;
      for (let n = r.int(1, 2); n > 0; n--) f.against(m, 'bed', 2);
      if (r.chance(0.6)) f.against(m, 'shelf', r.int(1, 2));
      f.against(m, 'lamp', 1);
      f.corner(m, 'plant');
    }
  } else {
    // a shop: shelves along the back wall, the counter across the room, customers in front
    const crow = whole.y + Math.max(3, Math.floor(whole.h * 0.4));
    for (let y = crow + 1; y < dy; y++) for (const x of [dx, dx + 1]) keep.add(at(x, y));
    const gapLeft = dx - whole.x > whole.x + whole.w - dx - 2;
    const gap = gapLeft ? [whole.x, whole.x + 1] : [whole.x + whole.w - 2, whole.x + whole.w - 1];
    const counterOk = !!avail.counter?.includes('S');
    if (avail.counter?.length && !counterOk) f.skipped.add('counter');
    if (counterOk) {
      const cells: Item[] = [];
      for (let x = whole.x; x < whole.x + whole.w; x++) if (!gap.includes(x)) cells.push({ cell: at(x, crow), role: 'counter', facing: 'S' });
      // the shopkeeper's spot: behind the counter, near its middle
      const mid = whole.x + (whole.w >> 1);
      shopkeeper = at(mid, crow - 1);
      keep.add(shopkeeper);
      f.commit(cells);
    }
    const lo = whole.y;
    for (let x = whole.x; x < whole.x + whole.w; x++) {
      if (r.chance(0.25)) continue;
      f.against({ x, y: lo, w: 1, h: 1 }, 'shelf', 1, ['N']);
    }
    const front: Room = { x: whole.x, y: crow + 1, w: whole.w, h: dy - crow - 1 };
    f.against(front, 'shelf', r.int(1, 2), ['W', 'E']);
    f.table(front, false, r.int(1, 2));
    f.corner(front, 'plant');
    f.against(front, 'lamp', 1, ['W', 'E']);
    f.rug([dx, dx + 1].flatMap((x) => [at(x, dy - 1), at(x, dy - 2)]));
  }
  return { area, entry, exit: at(dx, dy), items: f.items, shopkeeper, skipped: [...f.skipped] };
}
