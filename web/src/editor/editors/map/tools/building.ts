// Smart buildings: a house of any size assembled from its parts (roof, walls, door, windows).
//
// The rectangle dragged out is the whole building: the top row(s) are roof, the rest wall,
// with the door in the middle of the bottom row and windows spaced along the wall rows.
//
//   roofTopLeft  roofTop … roofTop  roofTopRight      first roof row
//   roofLeft     roof    … roof     roofRight         more roof rows (roofRows > 1)
//   wallLeft     window  wall  window  wallRight      wall rows
//   wallLeft     wall  door  wall      wallRight      the bottom row
//
// A part left empty (-1) falls back to a near one (roofTopLeft → roofLeft → roofTop → roof,
// wallLeft → wall, window → wall, door → wall); a cell whose part and fallbacks are all
// empty is left as it was (-1 in the assembled grid).

export type BuildingPart =
  'roofTopLeft' | 'roofTop' | 'roofTopRight' | 'roofLeft' | 'roof' | 'roofRight' | 'wallLeft' | 'wall' | 'wallRight' | 'door' | 'window';

export const BUILDING_PARTS: { part: BuildingPart; label: string }[] = [
  { part: 'roofTopLeft', label: 'Roof corner, left' },
  { part: 'roofTop', label: 'Roof edge (top)' },
  { part: 'roofTopRight', label: 'Roof corner, right' },
  { part: 'roofLeft', label: 'Roof side, left' },
  { part: 'roof', label: 'Roof fill' },
  { part: 'roofRight', label: 'Roof side, right' },
  { part: 'wallLeft', label: 'Wall, left' },
  { part: 'wall', label: 'Wall fill' },
  { part: 'wallRight', label: 'Wall, right' },
  { part: 'door', label: 'Door' },
  { part: 'window', label: 'Window' },
];

export interface Building {
  id: string;
  name: string;
  parts: Record<BuildingPart, number>;
  /** How many rows of roof (at least 1; a building of one row is all wall). */
  roofRows: number;
  /** Columns between windows (2: every other column). */
  windowEvery: number;
}

const FALLBACK: Record<BuildingPart, BuildingPart[]> = {
  roofTopLeft: ['roofTopLeft', 'roofLeft', 'roofTop', 'roof'],
  roofTop: ['roofTop', 'roof'],
  roofTopRight: ['roofTopRight', 'roofRight', 'roofTop', 'roof'],
  roofLeft: ['roofLeft', 'roof'],
  roof: ['roof', 'roofTop'],
  roofRight: ['roofRight', 'roof'],
  wallLeft: ['wallLeft', 'wall'],
  wall: ['wall'],
  wallRight: ['wallRight', 'wall'],
  door: ['door', 'wall'],
  window: ['window', 'wall'],
};

export function newBuilding(id: string, name: string): Building {
  const parts = Object.fromEntries(BUILDING_PARTS.map((p) => [p.part, -1])) as Record<BuildingPart, number>;
  return { id, name, parts, roofRows: 1, windowEvery: 2 };
}

/** The block for a part, through its fallbacks; -1 when none is set. */
export function partBlock(b: Building, part: BuildingPart): number {
  for (const p of FALLBACK[part]) if ((b.parts[p] ?? -1) >= 0) return b.parts[p];
  return -1;
}

/** Which part each cell of a w×h building is, row by row. */
export function buildingLayout(b: Building, w: number, h: number): BuildingPart[][] {
  const roofRows = h > 1 ? Math.max(1, Math.min(b.roofRows, h - 1)) : 0;
  const door = (w - 1) >> 1;
  const every = Math.max(1, b.windowEvery);
  const out: BuildingPart[][] = [];
  for (let y = 0; y < h; y++) {
    const row: BuildingPart[] = [];
    for (let x = 0; x < w; x++) {
      const side = w > 1 && x === 0 ? 'Left' : w > 1 && x === w - 1 ? 'Right' : '';
      if (y < roofRows) row.push(y === 0 ? `roofTop${side}` : `roof${side}`);
      else if (side) row.push(`wall${side}` as BuildingPart);
      else if (y === h - 1 && x === door) row.push('door');
      else if (windowAt(x, y, w, h, roofRows, every, door)) row.push('window');
      else row.push('wall');
    }
    out.push(row);
  }
  return out;
}

/** Windows: inner columns beside the door's, `every` apart; not on the bottom row unless it is the only wall row. */
function windowAt(x: number, y: number, w: number, h: number, roofRows: number, every: number, door: number): boolean {
  if (w < 3 || x === door) return false;
  if (y === h - 1 && h - roofRows > 1) return false;
  return (Math.abs(x - door) + 1) % every === 0 || every === 1;
}

/** The blocks of a w×h building; -1 leaves a cell as it was. */
export function assembleBuilding(b: Building, w: number, h: number): number[][] {
  return buildingLayout(b, w, h).map((row) => row.map((p) => partBlock(b, p)));
}

/** Puts an assembled grid (or a stamp's rows) on a map at (x, y); -1 cells and cells off the map are skipped. Returns the changed indexes. */
export function placeGrid(blocks: Uint8Array, grid: number[][], x: number, y: number, mapW = 100, mapH = 100): number[] {
  const changed: number[] = [];
  grid.forEach((row, dy) =>
    row.forEach((v, dx) => {
      const cx = x + dx,
        cy = y + dy;
      if (v < 0 || cx < 0 || cy < 0 || cx >= mapW || cy >= mapH) return;
      const i = cy * mapW + cx;
      if (blocks[i] !== v) {
        blocks[i] = v;
        changed.push(i);
      }
    }),
  );
  return changed;
}
