// The 1976½ CitiCar: a tomato-red electric wedge, the "car of tomorrow" since the
// Bicentennial. Parked in Hover Heights on a plug-in charger (one mile of range for every
// hour on the cord), and, with stubby wings bolted on, puttering along the Skyway's slow lane.
import { Pixels } from '../../../kit/pixels';
import { T, oval, outline } from './draw';
import { micro } from './font';
import { C } from './pal';
import { tiled } from './bigart';
import { FLOORS } from '../blocks/floors';

/** Is (x, y) inside the wedge? Rear top-left, flat roof, upright windshield, long sloped hood. */
function inWedge(x: number, y: number, s: number): boolean {
  // Corners at scale 1 (40 wide): rear 3, roof 10..22, windshield to (28,20), hood to (38,27), floor 32.
  const X = x / s;
  const Y = y / s;
  if (X < 3 || X > 38.5 || Y > 32 || Y < 10) return false;
  if (X > 22 && X <= 28 && Y < 10 + ((X - 22) * 10) / 6) return false;
  if (X > 28 && Y < 20 + ((X - 28) * 7) / 10.5) return false;
  if (X < 4 && Y < 12) return false;
  return true;
}

/** The car in profile facing right, `s` pixels per unit, on its own canvas. */
function wedge(p: Pixels, ox: number, oy: number, s: number, headlights: boolean): void {
  const w = Math.round(40 * s);
  const h = Math.round(34 * s);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (inWedge(x + 0.5, y + 0.5, s)) p.set(ox + x, oy + y, C('red', y / s < 14 ? 4 : y / s < 27 ? 3 : 2));
  const at = (x: number, y: number) => [ox + Math.round(x * s), oy + Math.round(y * s)] as const;
  const box = (x: number, y: number, bw: number, bh: number, c: number) => {
    const [px, py] = at(x, y);
    p.rect(px, py, Math.max(1, Math.round(bw * s)), Math.max(1, Math.round(bh * s)), c);
  };
  // Grey roof cap, the side windows and the windshield seen edge on.
  box(4, 10, 18, 1.5, C('concrete', 3));
  box(6, 13, 7, 7, C('glass', 1));
  box(14, 13, 8, 7, C('glass', 2));
  for (let i = 0; i <= 6; i++) {
    const [x, y] = at(22 + i, 11 + (i * 9) / 6);
    p.set(x, y, C('glass', 3)).set(x - 1, y, C('glass', 1));
  }
  box(14, 13, 0.7, 15, C('red', 1)); // the door seam
  box(4, 24, 34, 0.7, C('paper', 2)); // the pinstripe
  // Black bumper bars, front and back.
  box(35, 28, 4, 2.5, C('grey', 1));
  box(2, 27, 2.5, 3, C('grey', 1));
  // A round headlight in its pod.
  const [hx, hy] = at(33.5, 24.5);
  p.disc(hx, hy, Math.max(1, 1.6 * s), headlights ? C('gold', 5) : C('paper', 1));
  if (headlights) p.set(hx, hy, C('grey', 7));
  // Small whitewall tires.
  for (const wx of [9, 31]) {
    const [cx, cy] = at(wx, 32);
    p.disc(cx, cy, 3.6 * s, C('grey', 0));
    p.disc(cx, cy, Math.max(0.6, 1.6 * s), C('paper', 2));
    if (s >= 1) p.set(cx, cy, C('concrete', 2));
  }
}

/** The parked CitiCar, 2x2 blocks, plugged in at its rear charge port. */
export function citicar(headlights: boolean): Pixels {
  const p = tiled(new Pixels(40, 40), FLOORS.grass);
  oval(p, 21, 36, 19, 2.5, C('green', 0));
  wedge(p, 0, 2, 1, headlights);
  // A little Bicentennial flag decal on the back window, 1976 and all.
  p.rect(7, 19, 5, 3, C('red', 4)).rect(7, 20, 5, 1, C('paper', 2)).rect(7, 19, 2, 2, C('denim', 2));
  // The charge port and its cord, off to the charger on the left.
  p.rect(2, 29, 2, 2, C('grey', 1));
  p.line(0, 31, 2, 30, C('grey', 0));
  if (headlights)
    for (const [dx, dy] of [
      [3, -2],
      [4, 0],
      [3, 2],
    ])
      p.line(36, 26 + dy / 2, 36 + dx, 26 + dy, C('gold', 5));
  return p;
}

/** A plug-in charging post on the lawn; its little screen tells the awful truth, a word at a time. */
export function chargerPost(word: string): Pixels {
  const p = FLOORS.grass(4);
  oval(p, 9, 18, 6, 1.5, C('green', 0));
  p.rect(3, 2, 12, 16, C('chrome', 3)).rect(3, 2, 12, 2, C('chrome', 6)).rect(14, 2, 1, 16, C('chrome', 1));
  p.rect(4, 5, 10, 7, C('night', 0));
  micro(p, 4 + Math.floor((10 - (word.length * 4 - 1)) / 2), 6, word, C('neon', 3));
  p.disc(9, 14, 1, C('neon', 3));
  // The cord, looping over to the car next door.
  p.line(14, 13, 16, 15, C('grey', 0)).line(16, 15, 19, 11, C('grey', 0));
  return p;
}

/** The flying CitiCar on the Skyway: same wedge, stubby wings, an electric hum instead of a flame. */
export function flyingCiticar(k: number): Pixels {
  const p = new Pixels(20, 20, T);
  oval(p, 10, 18, 8, 1.2, C('grey', 1));
  wedge(p, 0, 1, 0.5, k === 1);
  // Stubby wings and a fin.
  p.rect(5, 12, 9, 2, C('chrome', 5)).rect(5, 12, 9, 1, C('chrome', 7));
  p.rect(1, 5, 2, 3, C('chrome', 4));
  // Sparks where a flame would be.
  p.set(0, 12 + k, C('teal', 5)).set(1, 14 - k, C('grey', 7));
  outline(p, C('grey', 0));
  return p;
}
