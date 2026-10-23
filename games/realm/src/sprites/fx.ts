// The little sprites every monster block set starts with: the two sword slashes, the kazoo's
// note, a tonic's sparkle, and what foes drop (a gem, a ruby, a heart).
import { C } from '../art/pal';
import { Canvas, mix } from '../art/rgb';
import type { SpriteSheet } from './sheet';
import { C as CNT } from '../ids';

function slash(light: [number, number, number], mid: [number, number, number], phase: number): Canvas {
  const cv = new Canvas(20, 20);
  // a crescent sweeping to the right: a thick arc minus an offset disc
  const r0 = 8.5 + phase;
  cv.fillSdf(
    (x, y) => {
      const a = Math.hypot(x - 4, y - 10) - r0;
      const b = r0 - 3.2 - Math.hypot(x - 2, y - 10);
      return Math.max(a, b, 4 - x);
    },
    (x, _y) => mix(mid, light, Math.min(1, (x - 4) / 9)),
  );
  return cv;
}

function note(tilt: number): Canvas {
  const cv = new Canvas(20, 20);
  const g = C('gold', 2);
  cv.ellipse(7, 14, 3.2, 2.4, C('gold', 1));
  cv.ellipse(6.6, 13.6, 2.6, 1.8, g);
  cv.line(9.6, 14, 9.6 + tilt, 4, 1.4, C('gold', 1));
  cv.line(9.6 + tilt, 4, 14 + tilt, 7, 1.6, g);
  cv.disc(6, 13, 0.7, C('gold', 3));
  return cv;
}

function sparkle(big: boolean): Canvas {
  const cv = new Canvas(20, 20);
  const c = C('teal', 2);
  const r = big ? 8 : 5;
  cv.poly(
    [
      [10, 10 - r],
      [11.2, 8.8],
      [10 + r, 10],
      [11.2, 11.2],
      [10, 10 + r],
      [8.8, 11.2],
      [10 - r, 10],
      [8.8, 8.8],
    ],
    (x, y) => mix(C('white', 1), c, Math.min(1, Math.hypot(x - 10, y - 10) / r)),
  );
  if (big)
    for (const [x, y] of [
      [4, 5],
      [15, 14],
      [15, 5],
    ])
      cv.disc(x, y, 1, C('white', 1));
  return cv;
}

function gem(cols: [number, number, number][], glint: boolean): Canvas {
  const cv = new Canvas(20, 20);
  cv.ellipse(10, 16.5, 5, 1.5, C('ink'));
  cv.poly(
    [
      [5, 9],
      [8, 5],
      [12, 5],
      [15, 9],
      [10, 16],
    ],
    cols[0],
  );
  cv.poly(
    [
      [6.5, 9],
      [8.5, 6],
      [11.5, 6],
      [13.5, 9],
      [10, 14],
    ],
    cols[1],
  );
  cv.poly(
    [
      [8, 9],
      [9, 6.5],
      [11, 6.5],
      [10, 9],
    ],
    cols[2],
  );
  if (glint) {
    cv.line(13, 3, 17, 3, 0.9, C('white', 1));
    cv.line(15, 1, 15, 5, 0.9, C('white', 1));
  }
  return cv;
}

function heart(beat: number): Canvas {
  const cv = new Canvas(20, 20);
  const s = 1 + beat * 0.08;
  const sdf = (x: number, y: number) => {
    const u = (x - 10) / (6 * s);
    const v = -(y - 10.5) / (6 * s);
    const f = (u * u + v * v - 0.6) ** 3 - u * u * v * v * v * 0.9;
    return f * 6;
  };
  cv.fillSdf(sdf, (x, y) => mix(C('red', 3), C('red', 1), Math.min(1, Math.hypot(x - 8, y - 7) / 8)));
  cv.disc(7.5, 7.5, 1.3, C('pink', 2));
  return cv;
}

/** Adds the shared effect sprites in their fixed order (every .MBL starts with these). */
export function addFx(mb: SpriteSheet): void {
  mb.add('slash', slash(C('white', 1), C('steel', 2), 0));
  mb.add('slash2', slash(C('steel', 3), C('steel', 1), 1));
  mb.add('steel', slash(C('white', 1), C('blue', 3), 0.5));
  mb.add('steel2', slash(C('blue', 3), C('blue', 2), 1.5));
  mb.add('note', note(0));
  mb.add('note2', note(1.5));
  mb.add('sparkle', sparkle(false));
  mb.add('heal', sparkle(true), { hp: 40 });
  mb.add('gem', gem([C('teal', 0), C('teal', 2), C('white', 1)], false), { effect: CNT.money, eamt: 5 });
  mb.add('gem2', gem([C('teal', 0), C('teal', 2), C('white', 1)], true), { effect: CNT.money, eamt: 5 });
  mb.add('ruby', gem([C('red', 0), C('red', 2), C('pink', 2)], false), { effect: CNT.money, eamt: 20 });
  mb.add('ruby2', gem([C('red', 0), C('red', 2), C('pink', 2)], true), { effect: CNT.money, eamt: 20 });
  mb.add('heart', heart(0), { hp: 25 });
  mb.add('heart2', heart(1), { hp: 25 });
}
