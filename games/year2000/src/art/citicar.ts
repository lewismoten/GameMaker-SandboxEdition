// The 1976½ CitiCar: a tomato-red electric wedge, the "car of tomorrow" since the
// Bicentennial, drawn from the shared side view of THE CHEZ (games/kit/chez.ts). Parked in
// Hover Heights on a plug-in charger (one mile of range for every hour on the cord), and, with
// stubby wings bolted on, puttering along the Skyway's slow lane.
import { Pixels } from '../../../kit/pixels';
import { chezSide, CHEZ_LAMP, type ChezInk } from '../../../kit/chez';
import { T, oval, outline } from './draw';
import { micro } from './font';
import { C } from './pal';
import { tiled } from './bigart';
import { FLOORS } from '../blocks/floors';

/** THE CHEZ's side in this game's colors (the shared side view, games/kit/chez.ts). */
function ink(headlights: boolean): ChezInk {
  return {
    body: [C('red', 2), C('red', 3), C('red', 4)],
    trim: C('red', 1),
    glass: [C('glass', 0), C('glass', 3)],
    roof: C('gray', 0),
    tire: C('gray', 0),
    hub: C('chrome', 6),
    rim: C('paper', 1),
    bumper: C('gray', 1),
    lamp: C('orange', 3),
    tail: C('red', 4),
    stripe: C('asphalt', 1),
    pin: C('paper', 2),
    lens: headlights ? C('gold', 5) : C('paper', 1),
  };
}

/** The parked CitiCar, 2x2 blocks, facing left so its passenger side shows, plugged in at the
 * charge port on its rear passenger corner (the charger stands behind it, to the right). */
export function citicar(headlights: boolean): Pixels {
  const car = new Pixels(40, 40, T);
  const { portX, portY } = chezSide(car, 0, 18, ink(headlights), 'left');
  outline(car, C('red', 0));
  // the headlight's beam, forward off the nose (on the left)
  const lx = 39 - Math.round(CHEZ_LAMP[0]);
  const ly = 18 + Math.round(CHEZ_LAMP[1]);
  if (headlights)
    for (const [dx, dy] of [
      [-2, -2],
      [-3, 0],
      [-2, 2],
    ])
      car.line(lx - 1, ly, lx - 1 + dx, ly + dy, C('gold', 5));
  const p = tiled(new Pixels(40, 40), FLOORS.grass);
  oval(p, 20, 37.5, 19, 2.5, C('green', 0));
  p.blit(car, 0, 0, T);
  // The charge port's plug, and its cord off to the charger next door.
  p.set(portX, portY, C('gray', 3));
  p.line(portX + 1, portY, 37, portY + 3, C('gray', 0)).line(37, portY + 3, 39, 31, C('gray', 0));
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
  p.line(5, 13, 3, 15, C('gray', 0)).line(3, 15, 0, 11, C('gray', 0));
  return p;
}

/** The flying CitiCar on the Skyway: same wedge, stubby wings, an electric hum instead of a flame. */
export function flyingCiticar(k: number): Pixels {
  const p = new Pixels(20, 20, T);
  oval(p, 10, 19, 8, 1, C('gray', 1));
  chezSide(p, 0, 4, ink(k === 1), 'right', 0.5);
  // Stubby wings and a little tail fin.
  p.rect(6, 12, 9, 2, C('chrome', 5)).rect(6, 12, 9, 1, C('chrome', 7));
  p.rect(3, 2, 2, 3, C('chrome', 4));
  // Sparks where a flame would be.
  p.set(1, 10 + k, C('teal', 5)).set(1, 12 - k, C('gray', 7));
  outline(p, C('gray', 0));
  return p;
}

/**
 * The flying CitiCar from behind, for the Cloud Lane (one block). The rear is all body: a
 * CitiCar has no back window, only the flat red tail under the black roof. The racing stripes
 * run along the sides, so from behind they show only as the sides' edges: two charcoal stripes
 * with red between and a white pinstripe either side. Tail lights, the square black bumper,
 * white wheels under it, the charge port on the passenger side (on the right, from behind), the
 * stubby wings, and a teal hum underneath. `bank` tips the wings: -1 steering left, 1 right.
 */
export function citicarRear(k: number, bank = 0): Pixels {
  const p = new Pixels(20, 20, T);
  const ink0 = ink(false);
  // the wings: chrome stubs at the sides, tipped when steering
  for (let i = 0; i < 4; i++) {
    const dyL = Math.round(bank * (3 - i) * 0.5);
    p.set(i, 10 - dyL, C('chrome', i === 0 ? 7 : 5)).set(i, 11 - dyL, C('chrome', 3));
    p.set(19 - i, 10 + dyL, C('chrome', i === 0 ? 7 : 5)).set(19 - i, 11 + dyL, C('chrome', 3));
  }
  // white steel wheels on black tires, under the bumper
  for (const x0 of [4, 13]) {
    p.rect(x0, 15, 3, 3, ink0.tire);
    p.set(x0 === 4 ? x0 : x0 + 2, 16, ink0.rim!);
  }
  // the flat red tail: lit on the left, shaded on the right
  for (let y = 4; y < 14; y++) for (let x = 4; x < 16; x++) p.set(x, y, x < 6 ? ink0.body[2] : x > 13 ? ink0.body[0] : ink0.body[1]);
  p.rect(4, 8, 12, 1, ink0.trim);
  // the black roof on top
  p.rect(5, 2, 10, 2, ink0.roof).set(4, 3, ink0.roof).set(15, 3, ink0.roof);
  // the sides' edges, with the stripes: pinstripe, charcoal, red, charcoal, pinstripe
  for (const x of [3, 16]) {
    p.rect(x, 4, 1, 10, ink0.body[x === 3 ? 1 : 0]);
    p.set(x, 6, ink0.pin!).set(x, 7, ink0.stripe!).set(x, 9, ink0.stripe!).set(x, 10, ink0.pin!);
  }
  // the charge port, low on the rear passenger corner
  p.set(16, 12, C('gray', 2));
  // tail lights
  p.rect(5, 10, 2, 2, ink0.tail).rect(13, 10, 2, 2, ink0.tail);
  p.set(5, 10, C('pink', 5)).set(13, 10, C('pink', 5));
  // the square black bumper
  p.rect(3, 13, 14, 2, ink0.bumper).rect(3, 13, 14, 1, C('gray', 2));
  outline(p, C('red', 0));
  // the hum underneath (outside the outline: it's light, not car)
  for (let x = 6; x < 14; x++) if ((x + k) % 2 === 0 && p.get(x, 18) === T) p.set(x, 18 + ((x >> 1) % 2), C('teal', 5));
  p.set(9 + k, 19, C('gray', 7));
  return p;
}

/**
 * The CitiCar big, for the cartoons around the Cloud Lane: THE CHEZ's side view at `scale`,
 * facing left so the passenger side and the charge port at the rear show. `wings` (0 to 1) slides
 * the stubby wings out from under the door; `driver` puts Dex's head in the door window (the only
 * window from the side); `hum` adds the teal glow under it in flight. Transparent around the car.
 */
export function citicarBig(
  scale: number,
  o: { wings?: number; driver?: Pixels; hum?: number; headlights?: boolean } = {},
): { pic: Pixels; portX: number; portY: number } {
  const w = 40 * scale;
  const h = 22 * scale;
  const p = new Pixels(w + 20 * scale, h, T);
  const ox = 10 * scale;
  const { portX, portY } = chezSide(p, ox, 0, ink(!!o.headlights), 'left', scale);
  // the stubby wing on this side: a chrome plate along the sill that swings down and out
  const wings = o.wings ?? 0;
  if (wings > 0) {
    const top = Math.round(12.6 * scale);
    const drop = Math.max(1, Math.round(4 * scale * wings));
    for (let j = 0; j < drop; j++) {
      const x0 = ox + Math.round((9 - j * 0.6) * scale);
      const x1 = ox + Math.round((30 + j * 0.3) * scale);
      p.rect(x0, top + j, x1 - x0, 1, j === 0 ? C('chrome', 7) : j === drop - 1 ? C('chrome', 2) : C('chrome', 5));
    }
  }
  if (o.driver) {
    // Dex at the wheel, seen through the door window (the window's middle, mirrored for facing left)
    const hx = ox + Math.round((40 - 18.5) * scale) - o.driver.w / 2;
    const hy = Math.round(3.2 * scale);
    for (let y = 0; y < o.driver.h; y++)
      for (let x = 0; x < o.driver.w; x++) {
        const c = o.driver.get(x, y);
        const sx = hx + x;
        const sy = hy + y;
        if (c !== T && sy < Math.round(8.2 * scale) && p.get(sx, sy) !== T) p.set(sx, sy, c);
      }
  }
  if (o.hum) for (let x = ox + 6 * scale; x < ox + 34 * scale; x += 2) if ((x + o.hum) % 4 < 2) p.rect(x, h - 2 * scale + ((x >> 2) % 2), 2, 1, C('teal', 5));
  return { pic: p, portX, portY };
}
