// The 1976½ CitiCar: a tomato-red electric wedge, the "car of tomorrow" since the
// Bicentennial. Parked in Hover Heights on a plug-in charger (one mile of range for every
// hour on the cord), and, with stubby wings bolted on, puttering along the Skyway's slow lane.
import { Pixels } from '../../../kit/pixels';
import { T, oval, outline } from './draw';
import { micro } from './font';
import { C } from './pal';
import { tiled } from './bigart';
import { FLOORS } from '../blocks/floors';

/** The body's side, facing right, in units (the car is 38 long and 23 tall; the ground is y=34):
 * a flat vertical tail, a short flat roof, a raked windshield running into a steep, short hood,
 * and a little upright nose over the bumper. */
const BODY: [number, number][] = [
  [2.5, 8],
  [3.5, 7],
  [19, 7],
  [26.5, 16],
  [37.5, 22],
  [38, 22.7],
  [38, 30],
  [2.5, 30],
];
const WHEELS = [8, 32];

function inPoly(poly: [number, number][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The car in profile facing right (its driver's side), `s` pixels per unit. */
function wedge(p: Pixels, ox: number, oy: number, s: number, headlights: boolean): void {
  const w = Math.round(40 * s);
  const h = Math.round(35 * s);
  const cut = (X: number, Y: number) => WHEELS.some((wx) => Math.hypot(X - wx, Y - 30.4) < 4.5);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const X = (x + 0.5) / s;
      const Y = (y + 0.5) / s;
      if (inPoly(BODY, X, Y) && !cut(X, Y)) p.set(ox + x, oy + y, C('red', Y < 17 ? 4 : Y < 25 ? 3 : 2));
    }
  const at = (x: number, y: number) => [ox + Math.round(x * s), oy + Math.round(y * s)] as const;
  const box = (x: number, y: number, bw: number, bh: number, c: number) => {
    const [px, py] = at(x, y);
    p.rect(px, py, Math.max(1, Math.round(bw * s)), Math.max(1, Math.round(bh * s)), c);
  };
  const poly = (pts: [number, number][], c: number) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inPoly(pts, (x + 0.5) / s, (y + 0.5) / s)) p.set(ox + x, oy + y, c);
  };
  // The dark grey roof panel and the door's big flat window: from the side that is the only
  // glass (the panel behind the door is solid red, no quarter window).
  box(3.5, 6, 15.5, 2, C('concrete', 0));
  poly([[13.5, 9], [19.4, 9], [25.3, 16.2], [13.5, 16.2]], C('glass', 1));
  poly([[19.3, 7.2], [20.6, 7.2], [26.6, 14.4], [25.9, 15.4]], C('glass', 3)); // the windshield, edge on
  if (s >= 1) {
    p.line(...at(15, 15), ...at(20, 10), C('glass', 3)); // a glint
    box(12.5, 8.5, 0.6, 21.5, C('red', 1)); // the door seam
    box(13.5, 18, 2, 0.6, C('grey', 1)); // the handle
  }
  box(3, 23.8, 33, 0.7, C('red', 1)); // the pinstripe
  // Black bumpers, a chunky one at the nose and a smaller one at the tail.
  box(36, 26, 3.5, 3.5, C('grey', 1));
  box(1, 26.5, 2.5, 3, C('grey', 1));
  box(3, 24.5, 1, 1.5, C('red', 0)); // tail light
  box(36.5, 24, 1.2, 1.5, C('orange', 3)); // turn signal
  // The round headlight in its pod, standing up off the hood's front corner.
  const [hx, hy] = at(34.8, 19.8);
  p.disc(hx, hy, Math.max(1, 2 * s), C('red', 1));
  p.disc(hx, hy, Math.max(0.6, 1.4 * s), C('red', 4));
  box(36.3, 18.3, 1.2, 3, C('chrome', 6));
  box(36.8, 18.8, 0.8, 2, headlights ? C('gold', 5) : C('paper', 1));
  // Small black tires with white wheels and a chrome cap, round side on.
  for (const wx of WHEELS) {
    const [cx, cy] = at(wx, 30.4);
    p.disc(cx, cy, 3.6 * s, C('grey', 0));
    p.disc(cx, cy, Math.max(0.6, 1.9 * s), C('paper', 2));
    if (s >= 1) p.disc(cx, cy, 0.8 * s, C('concrete', 1));
  }
}

/** The parked CitiCar, 2x2 blocks, facing left so its passenger side shows, plugged in at the
 * charge port on its rear passenger corner (the charger stands behind it, to the right). */
export function citicar(headlights: boolean): Pixels {
  const car = new Pixels(40, 40, T);
  wedge(car, 0, 4, 1, headlights);
  outline(car, C('red', 0));
  if (headlights)
    for (const [dx, dy] of [
      [2, -2],
      [3, 0],
      [2, 2],
    ])
      car.line(39 - 0.5, 25, 39 - 0.5 + dx, 25 + dy, C('gold', 5));
  const p = tiled(new Pixels(40, 40), FLOORS.grass);
  oval(p, 20, 37.5, 19, 2.5, C('green', 0));
  p.blit(car.flipX(), 0, 0, T);
  // The charge port on the rear passenger quarter, and its cord off to the charger.
  p.rect(33, 24, 2, 2, C('grey', 1)).set(33, 24, C('grey', 3));
  p.line(35, 25, 37, 26, C('grey', 0)).line(37, 26, 39, 31, C('grey', 0));
  return p;
}

/** A plug-in charging post on the lawn; its little screen tells the awful truth, a word at a time. */
export function chargerPost(word: string): Pixels {
  const p = FLOORS.grass(4);
  oval(p, 10, 18, 6, 1.5, C('green', 0));
  p.rect(5, 2, 12, 16, C('chrome', 3)).rect(5, 2, 12, 2, C('chrome', 6)).rect(16, 2, 1, 16, C('chrome', 1));
  p.rect(6, 5, 10, 7, C('night', 0));
  micro(p, 6 + Math.floor((10 - (word.length * 4 - 1)) / 2), 6, word, C('neon', 3));
  p.disc(11, 14, 1, C('neon', 3));
  // The cord, looping back to the car's charge port next door.
  p.line(5, 13, 3, 15, C('grey', 0)).line(3, 15, 0, 11, C('grey', 0));
  return p;
}

/** The flying CitiCar on the Skyway: same wedge, stubby wings, an electric hum instead of a flame. */
export function flyingCiticar(k: number): Pixels {
  const p = new Pixels(20, 20, T);
  oval(p, 10, 19, 8, 1, C('grey', 1));
  wedge(p, 0, 1, 0.5, k === 1);
  // Stubby wings and a little tail fin.
  p.rect(6, 12, 9, 2, C('chrome', 5)).rect(6, 12, 9, 1, C('chrome', 7));
  p.rect(1, 4, 2, 3, C('chrome', 4));
  // Sparks where a flame would be.
  p.set(0, 13 + k, C('teal', 5)).set(0, 15 - k, C('grey', 7));
  outline(p, C('grey', 0));
  return p;
}
