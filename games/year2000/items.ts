// The things you pick up, drawn on transparent 20x20 squares so they can be laid over
// any floor (and shown big on the screens). In the year 2000 everything hovers a little,
// so each one floats over its own shadow.
import { Pixels } from '../kit/pixels';
import { T, blob, oval, outline } from './src/art/draw';
import { micro } from './src/art/font';
import { C } from './src/art/pal';

const K = () => C('grey', 0);

function base(): Pixels {
  return new Pixels(20, 20, T);
}

/** A hover shadow under an item. */
export function shadow(p: Pixels, cx = 10, cy = 17, rx = 5, ry = 1.6): Pixels {
  oval(p, cx, cy, rx, ry, C('grey', 1));
  return p;
}

export function pagePic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 6);
  // A sheet of notebook paper, tilted a little, with a big bite out of the corner.
  for (let y = 2; y < 17; y++)
    for (let x = 4; x < 16; x++) {
      const sx = x + Math.floor((y - 2) / 6);
      const bite = (sx - 16) ** 2 + (y - 2) ** 2 < 14 || (sx - 14) ** 2 + (y - 1) ** 2 < 6;
      if (bite) continue;
      let c = C('paper', 2);
      if (y % 3 === 0) c = C('sky', 4);
      if (x === 6) c = C('red', 3);
      p.set(sx, y, c);
    }
  // Scribbles and an A+.
  p.rect(9, 6, 4, 1, C('denim', 1)).rect(9, 9, 5, 1, C('denim', 1)).rect(10, 12, 3, 1, C('denim', 1));
  outline(p, C('grey', 2));
  return p;
}

export function quarterPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 5);
  blob(p, 10, 9, 6, 6, PALR('chrome'), 2, 7);
  p.ring(10, 9, 5.5, C('chrome', 3));
  micro(p, 7, 7, '25', C('chrome', 2));
  p.set(7, 5, C('grey', 7)).set(8, 4, C('grey', 7));
  outline(p, C('chrome', 0));
  return p;
}

export function pillPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 6);
  // A capsule lying diagonally: one half hot pink, one half white. Contains: Thanksgiving.
  for (let t = 0; t <= 1; t += 0.02) {
    const cx = 5 + t * 10;
    const cy = 13 - t * 8;
    oval(p, cx, cy, 3.3, 3.3, t < 0.5 ? C('pink', 3) : C('paper', 2));
  }
  p.line(6, 10, 9, 7, C('pink', 5)).line(12, 4, 14, 3, C('grey', 7));
  outline(p, C('pink', 0));
  return p;
}

export function batteryPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 4);
  p.rect(7, 4, 6, 12, C('grey', 1)).rect(7, 4, 6, 5, C('gold', 3)).rect(9, 2, 2, 2, C('chrome', 5));
  p.rect(8, 5, 1, 10, C('grey', 3)).rect(8, 5, 1, 3, C('gold', 5));
  micro(p, 9, 10, '+', C('gold', 4));
  outline(p, K());
  return p;
}

export function zapperPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 7);
  // A chunky Laser-Tag Zapper: grey body, teal barrel, orange safety tip, neon sensor.
  p.rect(3, 6, 12, 5, C('chrome', 4)).rect(3, 6, 12, 1, C('chrome', 6));
  p.rect(14, 7, 4, 3, C('teal', 3)).rect(17, 7, 1, 3, C('orange', 3));
  p.rect(5, 10, 4, 6, C('chrome', 3)).rect(5, 15, 4, 1, C('chrome', 1));
  p.rect(9, 11, 2, 2, C('chrome', 2));
  p.rect(5, 4, 4, 2, C('neon', 2)).set(6, 4, C('neon', 3));
  p.rect(10, 8, 3, 1, C('pink', 3));
  outline(p, K());
  return p;
}

export function colaPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 6);
  // A can of Hover-Cola, with little chrome wings.
  p.rect(7, 4, 7, 12, C('red', 2)).rect(7, 4, 7, 2, C('chrome', 5)).rect(7, 14, 7, 2, C('chrome', 4));
  p.rect(8, 6, 1, 8, C('red', 4)).rect(10, 8, 3, 3, C('paper', 2));
  p.rect(11, 9, 1, 1, C('red', 2));
  for (const s of [-1, 1]) {
    const x = s < 0 ? 6 : 14;
    p.line(x, 9, x + s * 4, 6, C('chrome', 6))
      .line(x, 10, x + s * 4, 8, C('chrome', 4))
      .line(x, 11, x + s * 3, 10, C('chrome', 3));
  }
  outline(p, K());
  return p;
}

export function remotePic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 4);
  p.rect(7, 6, 6, 10, C('grey', 2)).rect(7, 6, 6, 1, C('grey', 4));
  oval(p, 10, 10, 2, 2, C('red', 3));
  p.set(9, 9, C('red', 4));
  p.rect(8, 13, 4, 1, C('grey', 4));
  p.line(12, 6, 15, 2, C('chrome', 5));
  p.set(15, 1, C('red', 4));
  outline(p, K());
  return p;
}

export function keycardPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 6);
  p.rect(4, 5, 12, 9, C('pink', 3)).rect(4, 7, 12, 2, C('grey', 1));
  p.rect(5, 10, 4, 3, C('paper', 2)).rect(10, 10, 5, 1, C('pink', 5)).rect(10, 12, 4, 1, C('pink', 5));
  p.rect(5, 5, 10, 1, C('pink', 5));
  outline(p, C('pink', 0));
  return p;
}

export function passPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 6);
  p.rect(3, 5, 14, 9, C('gold', 4)).rect(3, 5, 14, 2, C('purple', 2));
  oval(p, 7, 10, 2.5, 2.5, C('moon', 4));
  oval(p, 8, 9, 2, 2, C('gold', 4));
  micro(p, 10, 8, 'GO', C('purple', 1));
  for (let y = 5; y < 14; y += 2) p.set(16, y, C('gold', 2));
  outline(p, C('gold', 0));
  return p;
}

export function coverPic(): Pixels {
  const p = base();
  shadow(p, 10, 18, 7);
  p.rect(3, 2, 14, 15, C('sky', 6)).rect(3, 2, 14, 3, C('denim', 2));
  micro(p, 4, 3, 'MY', C('paper', 2));
  micro(p, 4, 7, 'SCI', C('denim', 1));
  micro(p, 4, 12, 'FAIR', C('denim', 1));
  // A gold star sticker.
  for (const [x, y] of [
    [14, 7],
    [13, 8],
    [14, 8],
    [15, 8],
    [14, 9],
    [13, 10],
    [15, 10],
  ])
    p.set(x, y, C('gold', 4));
  outline(p, C('denim', 0));
  return p;
}

function PALR(name: string): number[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((k) => C(name, k));
}

export const ITEM_PICS = {
  page: pagePic,
  quarter: quarterPic,
  pill: pillPic,
  battery: batteryPic,
  zapper: zapperPic,
  cola: colaPic,
  remote: remotePic,
  keycard: keycardPic,
  pass: passPic,
  cover: coverPic,
} as const;
export type ItemName = keyof typeof ITEM_PICS;
