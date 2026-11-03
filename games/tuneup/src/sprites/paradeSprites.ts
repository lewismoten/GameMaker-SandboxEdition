// The Parade Route's followers, as monster pictures (CAST.MBL): two small decorated cars and four
// friendly Clown Club walkers (a waver, a juggler, a horn honker, a unicycle rider), each in two
// frames and facing left, the way the parade drives. A block each, drawn in the fixed colors only
// so they read the same in the morning, at sunset and under the fireworks.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { P } from '../art/palette';

const c = P.c;
const ink = c('ink', 0);
type Add = (name: string, pic: Pixels) => number;
const blank = () => new Pixels(20, 20, 255);

/** A car's wheels (white, a dark hub), turning a spoke on frame f. */
function wheels(p: Pixels, f: number, xs: number[]): void {
  for (const x of xs)
    p.disc(x, 16.5, 2.8, c('paint', 3))
      .disc(x, 16.5, 1, ink)
      .set(x + (f ? 1 : -1), 16, c('metal', 2));
}

/** A little blue car with a yellow stripe and a bunch of balloons tied on behind, bobbing. */
function carA(f: number): Pixels {
  const p = blank();
  const y = f ? 0 : 1;
  p.rect(2, 11 + y, 16, 5, c('blue', 2)).rect(2, 13 + y, 16, 1, c('yellow', 3));
  p.rect(6, 8 + y, 8, 3, c('blue', 2))
    .rect(7, 9 + y, 3, 2, c('paint', 3))
    .rect(11, 9 + y, 2, 2, c('paint', 3));
  p.rect(1, 12 + y, 2, 3, c('metal', 4)).rect(17, 12 + y, 2, 3, c('metal', 4));
  // balloons on a string over the trunk (right)
  p.line(16, 11 + y, 15, 5 - f, c('metal', 3));
  p.disc(14, 3 - f, 2.2, c('red', 2))
    .disc(17, 4 - f, 2, c('yellow', 3))
    .disc(11, 5 - f, 1.8, c('green', 2));
  wheels(p, f, [6, 14]);
  return outline(p, ink);
}

/** A green parade float: a flat bed with a star banner on two poles and confetti, rolling. */
function carB(f: number): Pixels {
  const p = blank();
  const y = f ? 0 : 1;
  p.rect(1, 12 + y, 18, 4, c('green', 2)).rect(1, 12 + y, 18, 1, c('green', 3));
  for (let x = 2; x < 18; x += 4) p.rect(x, 14 + y, 2, 1, c('yellow', 3));
  p.rect(4, 4 + y, 1, 8, c('metal', 3)).rect(15, 4 + y, 1, 8, c('metal', 3));
  p.rect(3, 3 + y, 14, 5, c('red', 2)).rect(3, 3 + y, 14, 1, c('red', 3));
  p.rect(7, 5 + y, 6, 1, c('yellow', 3)).rect(9, 4 + y, 2, 3, c('yellow', 3));
  for (const [x, yy, col] of [
    [1, 1, 'blue'],
    [18, 0, 'yellow'],
    [10, 0, 'red'],
  ] as const)
    p.set(x, yy + (f ? 1 : 0), c(col, 3));
  wheels(p, f, [5, 15]);
  return outline(p, ink);
}

/** A clown a block tall, walking: legs apart on frame f, a ruffled collar, a big smile and a red nose. */
function clownBase(f: number, coat: number, hat: number): Pixels {
  const p = blank();
  p.rect(f ? 7 : 8, 16, 2, 4, ink).rect(f ? 12 : 11, 16, 2, 4, ink);
  p.rect(6, 11, 9, 6, coat).rect(7, 11, 7, 1, c('paint', 3));
  p.disc(10.5, 7, 3.6, c('paint', 3));
  p.set(9, 6, ink).set(12, 6, ink).set(10, 8, c('nose', 2)).set(11, 8, c('nose', 2)).rect(9, 10, 4, 1, c('red', 1));
  p.rect(7, 2, 8, 2, hat).rect(9, 0, 4, 2, hat);
  return p;
}

/** The waver: one arm up and waving (the hand swings side to side), the other down. */
function waver(f: number): Pixels {
  const p = clownBase(f, c('purple', 2), c('yellow', 3));
  p.rect(4, 12, 2, 4, c('purple', 2)).disc(4.5, 16, 1.6, c('paint', 3));
  p.rect(15, 6, 2, 6, c('purple', 2)).disc(f ? 17 : 15, 5, 1.8, c('paint', 3));
  return outline(p, ink);
}

/** The juggler: both hands up, three balls going round (a different spot each frame). */
function juggler(f: number): Pixels {
  const p = clownBase(f, c('orange', 2), c('red', 2));
  p.rect(4, 8, 2, 5, c('orange', 2)).rect(15, 8, 2, 5, c('orange', 2));
  const spots = f
    ? [
        [4, 5],
        [10, 0],
        [16, 5],
      ]
    : [
        [5, 3],
        [10, 2],
        [15, 3],
      ];
  (['red', 'yellow', 'blue'] as const).forEach((col, i) => p.disc(spots[i][0], spots[i][1], 1.6, c(col, 3)));
  return outline(p, ink);
}

/** The honker: a bulb horn squeezed (a sound arc on frame 1), a flat cap. */
function honker(f: number): Pixels {
  const p = clownBase(f, c('green', 1), c('blue', 2));
  p.rect(3, 12, 4, 2, c('green', 1));
  p.disc(3, 13, f ? 1.8 : 2.4, c('gold', 3))
    .rect(0, 12, 2, 2, c('gold', 2))
    .set(3, 12, c('paint', 3));
  if (f) p.line(0, 9, 1, 8, c('yellow', 3)).line(0, 11, 0, 10, c('yellow', 3)).line(1, 6, 3, 6, c('yellow', 3));
  p.rect(14, 12, 3, 2, c('green', 1));
  return outline(p, ink);
}

/** The unicycle rider: one wheel under a clown with arms out, the wheel's spoke turning. */
function rider(f: number): Pixels {
  const p = blank();
  p.ring(10, 16, 3.6, ink).ring(10, 16, 2.8, c('metal', 3));
  if (f) p.line(8, 14, 12, 18, c('red', 2)).set(10, 16, c('red', 2));
  else p.line(8, 18, 12, 14, c('red', 2)).set(10, 16, c('red', 2));
  p.rect(9, 10, 2, 4, ink).rect(7, 9, 7, 5, c('red', 2)).rect(7, 9, 7, 1, c('paint', 3));
  p.rect(3, 9 + f, 4, 2, c('red', 2)).rect(14, 10 - f, 4, 2, c('red', 2));
  p.disc(10.5, 5, 3.4, c('paint', 3)).set(9, 4, ink).set(12, 4, ink).rect(10, 6, 2, 1, c('nose', 2)).rect(9, 7, 4, 1, c('red', 1));
  p.rect(8, 0, 5, 2, c('blue', 2)).disc(10.5, 0, 1.5, c('yellow', 3));
  return outline(p, ink);
}

/** The followers, by name (two frames each: `parade.<name>0`, `parade.<name>1`). */
export const PARADE_FOLLOWERS = ['carA', 'carB', 'waver', 'juggler', 'honker', 'rider'] as const;
const DRAW = { carA, carB, waver, juggler, honker, rider };

export function addParadeCast(add: Add): void {
  for (const name of PARADE_FOLLOWERS) for (const f of [0, 1]) add(`parade.${name}${f}`, DRAW[name](f));
}
