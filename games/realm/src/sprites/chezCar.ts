// THE CHEZ for driving: a tomato-red 1976 1/2 CitiCar wedge, its side from the shared side view
// (games/kit/chez.ts: the black roof, the racing stripe, the one door window), and from the
// front and back with round lamps, a huge upright windshield and the black roof. Facing right
// (left is the same picture mirrored), up and down, two frames each (a bounce).
import { Canvas, mix, clamp01, type RGB } from '../art/rgb';
import { C } from '../art/pal';
import { Pixels } from '../../../kit/pixels';
import { chezSide, type ChezInk } from '../../../kit/chez';

/** THE CHEZ's side (the shared side view, games/kit/chez.ts) in this game's colors. */
const INK: RGB[] = [
  C('red', 1),
  C('red', 2),
  C('red', 3),
  C('red', 0),
  C('blue', 1),
  C('blue', 3),
  C('ink'),
  C('steel', 2),
  C('white', 0),
  C('orange', 2),
  C('red', 3),
  C('steel', 0),
];
const KIT: ChezInk = { body: [0, 1, 2], trim: 3, glass: [4, 5], roof: 6, tire: 6, hub: 7, rim: 8, bumper: 6, lamp: 9, tail: 10, stripe: 11, pin: 8, lens: 8 };

/** Parks THE CHEZ's side view on a canvas, its box's top left at (x, y), `s` pixels per unit
 * (40s x 20s, `tall` times taller); returns where the charge port is (facing left). */
export function chezSideOn(cv: Canvas, x: number, y: number, facing: 'left' | 'right', s: number, tall = 1): { portX: number; portY: number } {
  const w = Math.round(40 * s);
  const h = Math.round(20 * s * tall);
  const car = new Pixels(w, h, 255);
  const port = chezSide(car, 0, 0, KIT, facing, s, tall);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (car.get(i, j) !== 255) cv.set(Math.round(x) + i, Math.round(y) + j, INK[car.get(i, j)]);
  return { portX: Math.round(x) + port.portX, portY: Math.round(y) + port.portY };
}

function side(bounce: number): Canvas {
  const cv = new Canvas(20, 20);
  cv.ellipse(10, 17.5, 9, 1.8, C('ink'));
  // (a little taller than true, to stand as high as the front and back views)
  chezSideOn(cv, 0, 6 + Math.round(bounce), 'right', 0.5, 1.2);
  return cv;
}

function front(back: boolean, bounce: number): Canvas {
  const cv = new Canvas(20, 20);
  const y = 3 + bounce;
  cv.ellipse(10, 17.5, 8, 2, C('ink'));
  cv.rrect(3, y + 5, 14, 9, 1.5, (px, py) => mix(C('red', 3), C('red', 1), clamp01((py - y - 5) / 10 + Math.abs(px - 10) / 30)));
  cv.rrect(4, y, 12, 6, 1, back ? C('red', 2) : C('blue', 3));
  cv.rect(4, y - 0.4, 12, 1.2, C('ink')); // the black roof
  if (back) {
    cv.rect(5, y + 1.5, 10, 3, C('blue', 2));
    cv.rect(4, y + 10, 3, 1.4, C('red', 0));
    cv.rect(13, y + 10, 3, 1.4, C('red', 0));
    // the charge port, rear passenger side
    cv.rect(14.5, y + 7, 1.5, 1.5, C('ink'));
  } else {
    cv.disc(6, y + 9, 1.4, C('white', 1));
    cv.disc(14, y + 9, 1.4, C('white', 1));
    cv.rect(8, y + 8, 4, 2, C('ink'));
  }
  cv.rect(3, y + 12, 14, 1.2, C('ink'));
  cv.rect(3, y + 13, 3, 2.5, C('ink'));
  cv.rect(14, y + 13, 3, 2.5, C('ink'));
  return cv;
}

/** The CHEZ's pictures by name: side0/1 (facing right), front0/1 (coming at you), rear0/1. */
export function chezPics(): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  m.set('carSide0', side(0));
  m.set('carSide1', side(-1));
  m.set('carFront0', front(false, 0));
  m.set('carFront1', front(false, -0.6));
  m.set('carRear0', front(true, 0));
  m.set('carRear1', front(true, -0.6));
  const hurt = side(0).tint((c) => mix(c, [255, 255, 255], 0.5));
  m.set('carHurt', hurt);
  const dead = side(0).tint((c) => mix(c, [40, 40, 50], 0.6));
  m.set('carFlat', dead);
  return m;
}
