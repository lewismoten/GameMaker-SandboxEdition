// THE CHEZ, Lewis's tomato-red 1976½ CitiCar, as a two-block (40x20) side view for parking a
// cameo in any game's lot or curb: the year2000 wedge (flat upright tail, short flat roof, raked
// windshield into a steep short hood, little upright nose) squashed to block height. From the
// side the only glass is the door's big window (no quarter window behind it). Facing right shows
// the driver's side; facing left shows the passenger side, with the charge port low at the rear.
import { Pixels } from './pixels';

/** The game's palette indices to draw with. */
export interface ChezInk {
  /** The red body: shadow, middle, highlight. */
  body: [number, number, number];
  /** Seams and the pinstripe (a deep red). */
  trim: number;
  /** The door window and the windshield's edge: dark, light. */
  glass: [number, number];
  roof: number;
  tire: number;
  hub: number;
  bumper: number;
  /** The headlight's lens. */
  lamp: number;
  tail: number;
  /** Drawn round the car where it meets the background (omit for none). */
  outline?: number;
}

type Pt = [number, number];

const BODY: Pt[] = [
  [2.5, 4],
  [3.5, 3.4],
  [19, 3.4],
  [26.5, 8.8],
  [37.5, 12.4],
  [38, 12.8],
  [38, 17.2],
  [2.5, 17.2],
];
const WINDOW: Pt[] = [
  [13.5, 4.6],
  [19.4, 4.6],
  [25.3, 8.9],
  [13.5, 8.9],
];
const SCREEN: Pt[] = [
  [19.3, 3.5],
  [20.6, 3.5],
  [26.6, 7.8],
  [25.9, 8.4],
];
const WHEELS = [8, 32];
const HOLE = 255;

function inPoly(poly: Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The car alone on a 40x20 picture (HOLE where there is no car), facing right. */
function profile(k: ChezInk, port: boolean): Pixels {
  const p = new Pixels(40, 20, HOLE);
  const fill = (poly: Pt[], c: (y: number) => number) => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) if (inPoly(poly, x + 0.5, y + 0.5)) p.set(x, y, c(y));
  };
  fill(BODY, (y) => k.body[y < 8 ? 2 : y < 13 ? 1 : 0]);
  for (const wx of WHEELS) p.disc(wx, 17.2, 3.1, HOLE);
  p.rect(4, 3, 15, 1, k.roof);
  fill(WINDOW, () => k.glass[0]);
  fill(SCREEN, () => k.glass[1]);
  p.line(15, 8, 18, 5, k.glass[1]);
  p.rect(12, 5, 1, 12, k.trim); // the door seam
  p.rect(14, 10, 2, 1, k.bumper); // the handle
  p.rect(3, 13, 33, 1, k.trim); // the pinstripe
  p.rect(36, 14, 3, 3, k.bumper).rect(1, 14, 2, 3, k.bumper);
  p.rect(3, 11, 1, 2, k.tail);
  p.disc(35, 10.5, 1.2, k.body[0]).set(35, 10, k.lamp).set(36, 10, k.lamp);
  if (port) p.rect(4, 8, 2, 2, k.trim).set(4, 8, k.bumper);
  for (const wx of WHEELS) p.disc(wx, 17.2, 2.6, k.tire).disc(wx, 17.2, 1.1, k.hub);
  if (k.outline !== undefined) {
    const o = k.outline;
    const edge: Pt[] = [];
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 40; x++)
        if (p.get(x, y) === HOLE && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = p.get(x + dx, y + dy); return v !== HOLE && v !== -1; })) edge.push([x, y]);
    for (const [x, y] of edge) p.set(x, y, o);
  }
  return p;
}

/**
 * Parks THE CHEZ on `p` with its 40x20 box's top left at (ox, oy). Facing 'left' shows the
 * passenger side and its charge port; returns where the port is, for a charger's cord.
 */
export function chezSide(p: Pixels, ox: number, oy: number, k: ChezInk, facing: 'left' | 'right' = 'right'): { portX: number; portY: number } {
  const left = facing === 'left';
  const car = left ? profile(k, true).flipX() : profile(k, false);
  p.blit(car, ox, oy, HOLE);
  return { portX: ox + (left ? 35 : 4), portY: oy + 9 };
}
