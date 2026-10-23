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
    roof: C('grey', 0),
    tire: C('grey', 0),
    hub: C('chrome', 6),
    rim: C('paper', 1),
    bumper: C('grey', 1),
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
  p.set(portX, portY, C('grey', 3));
  p.line(portX + 1, portY, 37, portY + 3, C('grey', 0)).line(37, portY + 3, 39, 31, C('grey', 0));
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
  chezSide(p, 0, 4, ink(k === 1), 'right', 0.5);
  // Stubby wings and a little tail fin.
  p.rect(6, 12, 9, 2, C('chrome', 5)).rect(6, 12, 9, 1, C('chrome', 7));
  p.rect(3, 2, 2, 3, C('chrome', 4));
  // Sparks where a flame would be.
  p.set(1, 10 + k, C('teal', 5)).set(1, 12 - k, C('grey', 7));
  outline(p, C('grey', 0));
  return p;
}
