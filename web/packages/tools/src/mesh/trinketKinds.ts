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
  return subtract3(union3(...parts), ...cuts);
}

/** The outline for a key-chain tag: a rounded rectangle of half sizes hx, hy. */
export const tagOutline = (hx: number, hy: number, r: number): D2 => roundRect2(hx, hy, r);
export const holeAt = (x: number, y: number, r: number): D2 => circle2(r, x, y);

/** A die: a rounded cube of `size` mm with a dimple of radius `pipR` for each pip (the usual 1..6 on opposite faces summing to 7). */
export function die(size: number, pipR: number, corner = size * 0.18): D3 {
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
  const sink = pipR * 0.35;
  place(1, (u, v) => [u, v, size + pipR - sink]);
  place(6, (u, v) => [u, v, -pipR + sink]);
  place(2, (u, v) => [h + pipR - sink, u, h + v]);
  place(5, (u, v) => [-h - pipR + sink, u, h + v]);
  place(3, (u, v) => [u, h + pipR - sink, h + v]);
  place(4, (u, v) => [u, -h - pipR + sink, h + v]);
  return subtract3(cube, ...dimples);
}

/** A regular polygon outline (a hexagonal badge, a shield point up), `n` sides, radius `r`. */
export const regular2 = (n: number, r: number, turn = Math.PI / 2): D2 =>
  polygon2(Array.from({ length: n }, (_, i) => [r * Math.cos(turn + (i * 2 * Math.PI) / n), r * Math.sin(turn + (i * 2 * Math.PI) / n)] as [number, number]));
