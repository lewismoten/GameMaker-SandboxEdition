// The kinds of 3D-print trinket every game can have, as distance fields in millimeters (see sdfShapes.ts): a coin or token
// with a raised rim and relief, a key-chain tag with a hole, a badge (a plate in any outline, with small holes to glue a pin back into), and a die with dimpled faces.
// A game supplies the artwork (a flat 2D shape for the raised or sunk parts, as `relief` and `engrave`) and its colors.
// Every kind stands flat on z = 0 with vertical walls, so it prints without supports.
import { circle2, extrude, polygon2, roundBox3, roundRect2, sphere3, subtract3, union3, type D2, type D3 } from './sdfShapes';

export interface FlatKind {
  /** A 2D outline of the flat part (a circle, a rounded rectangle). */
  outline: D2;
  /** Thickness of the plate in mm. */
  thick: number;
  /** Width of the raised rim in mm (0 for none), and how far it stands above the face. */
  rim?: { width: number; height: number };
  /** Raised artwork (lettering, a crown) and how far it stands above the face. */
  relief?: { shape: D2; height: number };
  /** Sunk artwork and how deep it goes. */
  engrave?: { shape: D2; depth: number };
  /** Holes through the plate (a key-chain hole). */
  holes?: D2[];
  /** A recess in the back (the floor) for gluing in a pin back or a magnet, as a solid to cut away (see pinBack). */
  pocket?: D3;
}

/** A plate with its rim, relief, engraving and holes: the face is at z = thick. */
export function plate(k: FlatKind): D3 {
  const rimW = k.rim?.width ?? 0;
  const parts: D3[] = [extrude(k.outline, 0, k.thick)];
  if (k.rim) parts.push(extrude((x, y) => Math.max(k.outline(x, y), -k.outline(x, y) - rimW), 0, k.thick + k.rim.height));
  if (k.relief) parts.push(extrude(k.relief.shape, 0, k.thick + k.relief.height));
  const cuts: D3[] = [];
  if (k.engrave) cuts.push(extrude(k.engrave.shape, k.thick - k.engrave.depth, k.thick + 5));
  for (const h of k.holes ?? []) cuts.push(extrude(h, -1, k.thick + 10));
  if (k.pocket) cuts.push(k.pocket);
  return subtract3(union3(...parts), ...cuts);
}

/** The outline for a key-chain tag: a rounded rectangle of half sizes hx, hy. */
export const tagOutline = (hx: number, hy: number, r: number): D2 => roundRect2(hx, hy, r);
export const holeAt = (x: number, y: number, r: number): D2 => circle2(r, x, y);

/**
 * A die: a rounded cube of `size` mm with a dimple of radius `pipR` for each pip (the usual 1..6 on opposite faces summing to 7).
 * The dimples are deep (about three quarters of a radius), so the pips read in plain light; `pips` is the union of them, to color
 * the pips apart (a point on a dimple's surface has `pips` near zero).
 */
export function die(size: number, pipR: number, corner = size * 0.18): D3 & { pips: D3 } {
  const h = size / 2;
  const cube = roundBox3(0, 0, h, h, h, h, corner);
  const s = size * 0.25;
  const grids: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [
      [-s, s],
      [s, -s],
    ],
    3: [
      [-s, s],
      [0, 0],
      [s, -s],
    ],
    4: [
      [-s, s],
      [s, s],
      [-s, -s],
      [s, -s],
    ],
    5: [
      [-s, s],
      [s, s],
      [0, 0],
      [-s, -s],
      [s, -s],
    ],
    6: [
      [-s, s],
      [s, s],
      [-s, 0],
      [s, 0],
      [-s, -s],
      [s, -s],
    ],
  };
  const dimples: D3[] = [];
  // face -> pips: top 1... the axes: +z 1, -z 6, +x 2, -x 5, +y 3, -y 4
  const place = (n: number, map: (u: number, v: number) => [number, number, number]) =>
    grids[n].forEach(([u, v]) => {
      const [x, y, z] = map(u, v);
      dimples.push(sphere3(x, y, z, pipR));
    });
  const sink = pipR * 0.75;
  place(1, (u, v) => [u, v, size + pipR - sink]);
  place(6, (u, v) => [u, v, -pipR + sink]);
  place(2, (u, v) => [h + pipR - sink, u, h + v]);
  place(5, (u, v) => [-h - pipR + sink, u, h + v]);
  place(3, (u, v) => [u, h + pipR - sink, h + v]);
  place(4, (u, v) => [u, -h - pipR + sink, h + v]);
  const field = subtract3(cube, ...dimples) as D3 & { pips: D3 };
  field.pips = union3(...dimples);
  return field;
}

/** A regular polygon outline (a hexagonal badge, a shield point up), `n` sides, radius `r`. */
export const regular2 = (n: number, r: number, turn = Math.PI / 2): D2 =>
  polygon2(Array.from({ length: n }, (_, i) => [r * Math.cos(turn + (i * 2 * Math.PI) / n), r * Math.sin(turn + (i * 2 * Math.PI) / n)] as [number, number]));

/**
 * The pocket for a pin back: a bar-shaped recess `len` mm long and `w` mm wide at the floor, centered on (cx, cy), to glue a
 * bar pin into (give it as `pocket`). Its roof is a gable at 45 degrees, so it prints without supports.
 */
export const pinBack =
  (cx = 0, cy = 0, len = 22, w = 5): D3 =>
  (x, y, z) => {
    const h = w / 2;
    const across = (Math.abs(y - cy) + z - h) * Math.SQRT1_2;
    return Math.max(across, Math.abs(x - cx) - len / 2, -z - 1);
  };

/** A key-chain ring tab: a round lug of outer radius `r + wall` with a hole of radius `r`, at (x, y). Join `shape` to the outline with union2 and give `hole` to `holes`. */
export const ringTab = (x: number, y: number, r = 3.2, wall = 2.6): { shape: D2; hole: D2 } => ({ shape: circle2(r + wall, x, y), hole: circle2(r, x, y) });

export interface GemShape {
  /** Sides of the table and girdle (6 or 8). */
  sides: number;
  /** Apothems in mm: the flat table the gem stands on, and the widest part (the girdle). */
  table: number;
  girdle: number;
  /** Height of the crown (table to girdle) and of the pavilion (girdle to the point), in mm. */
  crown: number;
  pavilion: number;
  /** Turn the pavilion's facets by half a side, as a brilliant cut does (default true). */
  offset?: boolean;
}

/**
 * A faceted gem standing on its table (flat down), the crown flaring out as it rises and the pavilion narrowing to the point:
 * the crown leans out at under 45 degrees from vertical, so it prints without supports. Also the shape of a crystal shard.
 * `facet(x, y, z)` is the number of the facet a surface point belongs to, for coloring.
 */
export function gem(g: GemShape): { field: D3; facet: (x: number, y: number, z: number) => number } {
  const { sides: n, table, girdle, crown, pavilion } = g;
  const step = (2 * Math.PI) / n;
  const turn = g.offset === false ? 0 : step / 2;
  const lc = Math.hypot(crown, girdle - table);
  const lp = Math.hypot(pavilion, girdle);
  const faces = (x: number, y: number, z: number): number[] => {
    const out: number[] = [-z];
    for (let k = 0; k < n; k++) {
      const u = x * Math.cos(k * step) + y * Math.sin(k * step);
      out.push(((u - table) * crown - z * (girdle - table)) / lc);
    }
    for (let k = 0; k < n; k++) {
      const a = turn + k * step;
      const u = x * Math.cos(a) + y * Math.sin(a);
      out.push(((u - girdle) * pavilion + (z - crown) * girdle) / lp);
    }
    return out;
  };
  return {
    field: (x, y, z) => Math.max(...faces(x, y, z)),
    facet: (x, y, z) => {
      const f = faces(x, y, z);
      return f.indexOf(Math.max(...f));
    },
  };
}
