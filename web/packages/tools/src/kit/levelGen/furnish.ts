// Furniture rules for interiors (home, shop): what goes where and which way it faces. Works on the plain
// cell codes (grid.ts) and writes no blocks. A piece is only put down when the floor stays walkable: from
// the entry every open cell is still reachable and every piece has an open, reachable side. Beds, shelves,
// counters and stoves stand against a wall with their front to the room; a chair stands next to a table
// and faces it. No DOM.
import type { Facing, Role } from '../blockRoles';
import { FLOOR, FURN, closed, distances, type Area, type Stream } from './grid';

export const DIR: Record<Facing, readonly [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const OPPOSITE: Record<Facing, Facing> = { N: 'S', E: 'W', S: 'N', W: 'E' };

export interface Item {
  cell: number;
  role: Role;
  /** Which way the front looks (the block with this facing is chosen). */
  facing?: Facing;
  /** A rug: walkable, drawn over the floor. */
  open?: boolean;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The facings each role has a block for (all four when a block of the role says none); a missing role has no entry. */
export type Avail = Partial<Record<Role, readonly Facing[]>>;

export function furnisher(area: Area, entry: number, avail: Avail, r: Stream, keep: Set<number>) {
  const items: Item[] = [];
  const skipped = new Set<string>();
  const at = (x: number, y: number) => y * area.w + x;
  const free = (c: number) => area.cells[c] === FLOOR && !keep.has(c);
  const shuffle = <T>(list: readonly T[]): T[] =>
    list
      .map((v) => [r.next(), v] as const)
      .sort((a, b) => a[0] - b[0])
      .map((p) => p[1]);
  const inRoom = (m: Room, x: number, y: number) => x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h;

  /** The floor is still all reachable from the entry and every piece has a reachable open side. */
  function sound(extra: Item[]): boolean {
    const d = distances(area, entry);
    for (let i = 0; i < d.length; i++) if (!closed(area.cells[i]) && d[i] < 0) return false;
    return [...items, ...extra].every((it) => {
      if (it.open) return true;
      const x = it.cell % area.w,
        y = (it.cell / area.w) | 0;
      return Object.values(DIR).some(([dx, dy]) => {
        const nx = x + dx,
          ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < area.w && ny < area.h && d[at(nx, ny)] >= 0;
      });
    });
  }

  /** Puts the pieces down together, or none of them. */
  function commit(list: Item[]): boolean {
    if (new Set(list.map((i) => i.cell)).size !== list.length || !list.every((i) => free(i.cell))) return false;
    for (const i of list) area.cells[i.cell] = FURN;
    if (sound(list)) {
      items.push(...list);
      return true;
    }
    for (const i of list) area.cells[i.cell] = FLOOR;
    return false;
  }

  const can = (role: Role, f: Facing) => !!avail[role]?.includes(f);

  /** A piece (`len` cells) against a wall of `room`, front to the room. `walls` limits which walls. Returns whether one was placed. */
  function against(room: Room, role: Role, len: number, walls: readonly Facing[] = ['N', 'E', 'S', 'W']): boolean {
    if (!avail[role]?.length) return false;
    // the wall named by where it is: a piece on the north wall looks south
    const sides = shuffle(walls).filter((w) => can(role, OPPOSITE[w]) || !['bed', 'counter', 'shelf', 'stove', 'chair'].includes(role));
    if (!sides.length) skipped.add(role);
    for (let tries = 0; tries < 14 && sides.length; tries++) {
      const wall = sides[tries % sides.length];
      const horizontal = wall === 'N' || wall === 'S';
      const span = horizontal ? room.w : room.h;
      const start = r.int(0, Math.max(0, span - len));
      const list: Item[] = [];
      for (let k = 0; k < len; k++) {
        const p = start + k;
        const x = horizontal ? room.x + p : wall === 'W' ? room.x : room.x + room.w - 1;
        const y = horizontal ? (wall === 'N' ? room.y : room.y + room.h - 1) : room.y + p;
        if (!inRoom(room, x, y)) break;
        list.push({ cell: at(x, y), role, facing: OPPOSITE[wall] });
      }
      if (list.length === len && commit(list)) return true;
    }
    return false;
  }

  /** A table (1 to 3 cells) with a free ring round it, then chairs on its sides facing it. Returns the table's cells. */
  function table(room: Room, chairs: boolean, len: number): number[] | undefined {
    if (!avail.table?.length) return undefined;
    for (let tries = 0; tries < 30; tries++) {
      const horizontal = r.chance(0.6);
      const w = horizontal ? len : 1,
        h = horizontal ? 1 : len;
      if (room.w < w + 2 || room.h < h + 2) continue;
      const x = r.int(room.x + 1, room.x + room.w - w - 1),
        y = r.int(room.y + 1, room.y + room.h - h - 1);
      const cells: number[] = [];
      let ring = true;
      for (let yy = y - 1; yy <= y + h; yy++)
        for (let xx = x - 1; xx <= x + w; xx++) {
          const c = at(xx, yy);
          if (xx >= x && xx < x + w && yy >= y && yy < y + h) cells.push(c);
          else if (!inRoom(room, xx, yy) || area.cells[c] !== FLOOR || keep.has(c)) ring = false;
        }
      if (!ring || !cells.every(free)) continue;
      if (!commit(cells.map((cell) => ({ cell, role: 'table' })))) continue;
      if (chairs) {
        if (avail.chair?.length) {
          // each chair stands on a ring cell next to the table, looking at it
          const spots: Item[] = [];
          for (const c of cells) {
            const cx = c % area.w,
              cy = (c / area.w) | 0;
            for (const f of ['N', 'E', 'S', 'W'] as Facing[]) {
              const [dx, dy] = DIR[f];
              const n = at(cx + dx, cy + dy);
              // the chair stands at n and looks back at the table: opposite of the direction it sits in
              if (!cells.includes(n) && can('chair', OPPOSITE[f])) spots.push({ cell: n, role: 'chair', facing: OPPOSITE[f] });
            }
          }
          let want = r.int(1, Math.min(4, Math.max(1, spots.length)));
          for (const s of shuffle(spots)) if (want > 0 && commit([s])) want--;
        } else if (avail.chair) skipped.add('chair');
      }
      return cells;
    }
    return undefined;
  }

  /** One piece in a corner of `room`. */
  function corner(room: Room, role: Role): boolean {
    if (!avail[role]?.length) return false;
    const spots = shuffle([at(room.x, room.y), at(room.x + room.w - 1, room.y), at(room.x, room.y + room.h - 1), at(room.x + room.w - 1, room.y + room.h - 1)]);
    return spots.some((cell) => commit([{ cell, role, facing: 'S' }]));
  }

  /** Rug cells (walkable) on free floor within `cells`. */
  function rug(cells: number[]): void {
    if (!avail.rug?.length) return;
    for (const cell of cells) if (area.cells[cell] === FLOOR && !items.some((i) => i.cell === cell)) items.push({ cell, role: 'rug', open: true });
  }

  return { items, skipped, commit, against, table, corner, rug, free, at, shuffle };
}
