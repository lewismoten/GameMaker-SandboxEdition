// THE CHEZ, Lewis's tomato-red 1976½ CitiCar, from the side: two blocks (40x20) at scale 1, for
// parking a cameo in any game's lot or curb, and the one side view the other games' CitiCars
// are drawn from. Measured off the photos (.for-lewis/citicar): a very short wedge, one long
// straight line rising from a short low nose over the hood and the windshield to a short flat
// BLACK roof, and a flat rear that leans back a little toward the bumper. One trapezoid window
// in the door (its front edge slanted, its back edge upright), no quarter window behind it, a
// tall flat rear quarter. The racing stripes (they make it go faster): a pair of dark stripes
// edged with thin white pinstripes run along the lower body from the nose, then step UP over the
// rear quarter behind the door. An amber marker up front, a red one at the back, white steel
// wheels with chrome caps on black tires, plain square black bumpers at both ends. Facing right
// shows the driver's side; facing left shows the passenger side, with the charge port at the rear.
import { Pixels } from './pixels';

/** The game's palette indices to draw with. */
export interface ChezInk {
  /** The red body: shadow, middle, highlight. */
  body: [number, number, number];
  /** The door's seams (a deep red). */
  trim: number;
  /** The door window and the windshield's edge: dark, light. */
  glass: [number, number];
  /** The black roof panel. */
  roof: number;
  tire: number;
  /** The chrome hubcaps (and the door handle unless `chrome` is given). */
  hub: number;
  bumper: number;
  /** The amber marker up front. */
  lamp: number;
  /** The red marker at the back. */
  tail: number;
  /** The racing stripes (default: the tire's black). */
  stripe?: number;
  /** Their white pinstripes, drawn at scale 2 and up (default: the light glass). */
  pin?: number;
  /** The white steel wheels (default: the pinstripe white). */
  rim?: number;
  /** The door handle (default: the hubcaps). */
  chrome?: number;
  /** Drawn round the car where it meets the background (omit for none). */
  outline?: number;
}

type Pt = [number, number];

/** The body, facing right, in units of the 40x20 box (the ground is y=20). The front and rear
 * quarters stop flat at the top of the tires (no round arches: the tires tuck up behind them);
 * only the door comes down to the sill between the wheels. */
export const CHEZ_BODY: Pt[] = [
  [7.9, 1.3], // the roof's back corner
  [17.9, 1.3], // the top of the windshield
  [36.0, 13.2], // one straight line down over the windshield and the hood
  [36.0, 14.4], // the short low nose
  [26.1, 14.4], // the front quarter's flat bottom, over the front tire
  [26.1, 18.1], // the door, down to the sill
  [13.7, 18.1],
  [13.7, 14.4],
  [5.2, 14.4], // the rear quarter's flat bottom, and the flat rear leaning back a little
];
/** The door window: its front edge slanted, its back edge (nearly) upright. */
export const CHEZ_WINDOW: Pt[] = [
  [12.5, 2.8],
  [18.5, 2.8],
  [24.5, 8.3],
  [13.0, 8.3],
];
export const CHEZ_WHEELS = [9.35, 31.1];
export const CHEZ_AXLE = 16.75;
const TIRE = 3.25;
/** The roof's black panel comes down to here. */
const ROOF_EDGE = 2.05;
/** The racing stripes' band: its middle along the front, the step up it takes over the rear
 * quarter (from KINK[1] back to KINK[0], an S curve), where it ends at the back, and each dark
 * stripe's width and the gap between their middles (both at least a pixel apart when small). */
const BAND = 12.5;
const KINK: [number, number] = [10.0, 13.0];
const RISE = 2.6;
const BAND_END = 6.9;
const STRIPE_W = 0.5;
const STRIPE_GAP = 1.0;
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

/** How far up the stripes have stepped at x (0 along the front, RISE over the rear quarter),
 * and how steep they are there. */
function step(x: number): [number, number] {
  const [a, b] = KINK;
  if (x >= b) return [0, 0];
  if (x <= a) return [RISE, 0];
  const t = (b - x) / (b - a);
  return [RISE * t * t * (3 - 2 * t), (RISE * 6 * t * (1 - t)) / (b - a)];
}

/** Whether (x, y) is on the body (in units). */
export function onChez(x: number, y: number): boolean {
  return inPoly(CHEZ_BODY, x, y);
}

/** The car alone on a picture (HOLE where there is no car), facing right, `s` pixels per unit
 * (1: the 40x20 two-block car; smaller for one seen far off, bigger for a close-up). */
function profile(k: ChezInk, port: boolean, s: number): Pixels {
  const W = Math.round(40 * s);
  const H = Math.round(20 * s);
  const p = new Pixels(W, H, HOLE);
  const stripe = k.stripe ?? k.tire;
  const pin = k.pin ?? k.glass[1];
  const rim = k.rim ?? pin;
  const box = (x: number, y: number, w: number, h: number, c: number) => p.rect(Math.round(x * s), Math.round(y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), c);
  const at = (x: number) => Math.round(x * s);
  // white steel wheels and chrome caps on black tires, tucked up behind the quarters
  for (const wx of CHEZ_WHEELS) {
    p.disc(wx * s - 0.5, CHEZ_AXLE * s - 0.5, TIRE * s, k.tire);
    p.disc(wx * s - 0.5, CHEZ_AXLE * s - 0.5, Math.max(0.6, 2.15 * s), rim);
    if (s >= 0.8) p.disc(wx * s - 0.5, CHEZ_AXLE * s - 0.5, Math.max(0.5, 1.0 * s), k.hub);
  }
  // plain square black bumpers at both ends (not the later CommutaCar's long thick ones)
  box(35.2, 13.0, 2.0, 1.8, k.bumper);
  box(3.9, 12.8, 2.0, 1.8, k.bumper);
  const px = 1 / s; // one pixel, in units
  const w = Math.max(STRIPE_W, px) / 2;
  const gap = Math.max(STRIPE_GAP, 2 * px) / 2;
  const fall = 11.9 / 18.1; // the windshield-hood line
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const X = (x + 0.5) / s;
      const Y = (y + 0.5) / s;
      if (!onChez(X, Y)) continue;
      // flat red sides, lit along the top of the hood's slope, shadowed under the door
      let c = k.body[Y > 16.9 ? 0 : X > 17.9 && Y - 1.3 - (X - 17.9) * fall < Math.max(0.9, 1.5 * px) ? 2 : 1];
      if (Y < ROOF_EDGE) c = k.roof;
      else if (inPoly(CHEZ_WINDOW, X, Y)) c = k.glass[0];
      else if (X >= BAND_END - (s >= 2 ? px : 0)) {
        // the stripes: a dark pair, the red between them, a white pinstripe round the band
        const [up, dy] = step(X);
        const d = Math.abs(Y - (BAND - up)) / Math.sqrt(1 + dy * dy);
        if (X < BAND_END) {
          if (s >= 2 && d <= gap + w + px) c = pin; // the band's squared-off end
        } else if (s < 0.75 ? d <= px / 2 : Math.abs(d - gap) <= w) c = stripe; // (far off, one line)
        else if (s >= 2 && d > gap + w && d <= gap + w + px) c = pin;
      }
      p.set(x, y, c);
    }
  if (s >= 1) {
    // the windshield, edge on, down the top of the slope; a glint on the door glass
    p.line(at(18.3), at(1.7), at(27.2), at(7.5), k.glass[1]);
    if (s >= 1.5) p.line(at(15.5), at(7.6), at(19), at(3.5), k.glass[1]);
    // the door: its seams and its chrome handle
    const seam = (x0: number, x1: number, y0: number, y1: number) => {
      for (let y = at(y0); y < at(y1); y++) {
        const x = at(x0 + ((x1 - x0) * ((y + 0.5) / s - y0)) / (y1 - y0));
        if (p.get(x, y) !== HOLE && p.get(x, y) !== k.glass[0]) p.set(x, y, k.trim);
      }
    };
    seam(12.1, 13.7, 2.2, 18.1);
    seam(26.1, 26.1, 8.3, 18.1);
    box(14.5, 10.6, 1.5, 0.6, k.chrome ?? k.hub);
    if (s >= 3) for (let x = 28.4; x < 31.8; x += 0.5) p.set(at(x), at(BAND) - (Math.round(x * 2) % 3 === 0 ? 1 : 0), pin); // "electric"
    if (s >= 2) box(13.7, 18.1, 12.4, 0.5, k.bumper); // the black rocker under the door
  }
  // the markers: amber up front over the stripes, red at the back under them
  box(30.4, 10.9, 1.2, 0.8, k.lamp);
  box(7.1, 12.4, 1.2, 0.8, k.tail);
  if (port) box(6.6, 5.0, 1.3, 1.3, k.trim); // the charge port, rear passenger side
  if (k.outline !== undefined) {
    const o = k.outline;
    const edge: Pt[] = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (p.get(x, y) === HOLE && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = p.get(x + dx, y + dy); return v !== HOLE && v !== -1; })) edge.push([x, y]);
    for (const [x, y] of edge) p.set(x, y, o);
  }
  return p;
}

/** The car facing `facing` on its own picture, 255 where there is no car. */
export function chezPicture(k: ChezInk, facing: 'left' | 'right' = 'right', scale = 1): Pixels {
  return facing === 'left' ? profile(k, true, scale).flipX() : profile(k, false, scale);
}

/**
 * Parks THE CHEZ on `p` with its box's top left at (ox, oy): 40x20 at scale 1, 40s x 20s at
 * scale s. Facing 'left' shows the passenger side and its charge port; returns where the port
 * is, for a charger's cord.
 */
export function chezSide(p: Pixels, ox: number, oy: number, k: ChezInk, facing: 'left' | 'right' = 'right', scale = 1): { portX: number; portY: number } {
  const left = facing === 'left';
  const car = chezPicture(k, facing, scale);
  p.blit(car, ox, oy, HOLE);
  const px = Math.round(7.2 * scale);
  return { portX: ox + (left ? car.w - 1 - px : px), portY: oy + Math.round(5.6 * scale) };
}
