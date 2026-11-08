// Rory, drawn for this game in its block-print look: a young adult home for the holiday, in a mustard knit cap
// with ear flaps, a rust and cream striped scarf (its tail down the back), a sage barn coat and dark jeans. Each
// pose is one 20x40 figure, cut into the head block (.top) and the body block that the kit's hero file names.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Book } from '../../kit/starter/book';
import { oval, paperBlock, press, stamp, T } from './print';

type Face = 'smile' | 'blink' | 'look' | 'ouch' | 'cheer' | 'oh' | 'back';
type Arms = 'down' | 'swingA' | 'swingB' | 'high' | 'out' | 'flail' | 'upA' | 'upB' | 'carry';
/** Each leg as [knee dx, foot dx, foot lift], from the hip. */
type Legs = [[number, number, number], [number, number, number]];

const LEGS: Record<string, Legs> = {
  stand: [
    [0, -1, 0],
    [0, 1, 0],
  ],
  walk0: [
    [-1, -3, 0],
    [1, 3, 0],
  ],
  walk1: [
    [0, -1, 0],
    [1, 0, 2],
  ],
  walk2: [
    [1, 3, 0],
    [-1, -3, 0],
  ],
  walk3: [
    [1, 0, 2],
    [0, -1, 0],
  ],
  tuck: [
    [2, 0, 4],
    [3, 2, 3],
  ],
  dangle: [
    [-1, -2, 0],
    [1, 2, 1],
  ],
  climbA: [
    [0, 0, 3],
    [0, 0, 0],
  ],
  climbB: [
    [0, 0, 0],
    [0, 0, 3],
  ],
};

function figure(pal: Pal, face: Face, arms: Arms, legs: Legs): Pixels {
  const { ink } = press(pal);
  const [skin, hair, cap, scarf, coat, jeans] = ['rSkin', 'rHair', 'rCap', 'rScarf', 'rCoat', 'rJeans'].map((n) => pal.r(n));
  const p = new Pixels(20, 40, T);
  const back = face === 'back';
  // legs: two jeans strokes from the hips, shoes at the bottom
  const hips = back ? [8, 11] : [8, 11];
  legs.forEach(([knee, foot, lift], i) => {
    const hx = hips[i];
    const col = jeans[i === 0 ? 0 : 1];
    p.line(hx, 29, hx + knee, 33 - Math.min(lift, 2), col).line(hx + 1, 29, hx + knee + 1, 33 - Math.min(lift, 2), col);
    p.line(hx + knee, 33 - Math.min(lift, 2), hx + foot, 37 - lift, col).line(hx + knee + 1, 33 - Math.min(lift, 2), hx + foot + 1, 37 - lift, col);
    p.rect(hx + foot, 37 - lift, back ? 2 : 3, 2, ink[1]);
  });
  // coat
  p.rect(7, 19, 8, 11, coat[1]).rect(7, 28, 8, 2, coat[0]);
  if (!back) p.rect(12, 20, 1, 9, coat[0]).set(13, 23, cap[2]).set(13, 26, cap[2]);
  else p.rect(10, 20, 1, 9, coat[0]);
  // arms
  const arm = (x0: number, y0: number, x1: number, y1: number, col: number) => {
    p.line(x0, y0, x1, y1, col).line(x0 + 1, y0, x1 + 1, y1, col);
    p.rect(x1, y1, 2, 2, skin[1]);
  };
  const A: Record<Arms, [number, number, number, number][]> = {
    down: [
      [8, 21, 7, 28],
      [12, 21, 13, 28],
    ],
    swingA: [
      [8, 21, 5, 27],
      [12, 21, 15, 27],
    ],
    swingB: [
      [8, 21, 10, 28],
      [12, 21, 11, 28],
    ],
    high: [
      [8, 21, 5, 13],
      [12, 21, 16, 13],
    ],
    out: [
      [8, 21, 3, 22],
      [12, 21, 17, 22],
    ],
    flail: [
      [8, 21, 4, 16],
      [12, 21, 17, 18],
    ],
    upA: [
      [8, 21, 6, 12],
      [12, 21, 14, 18],
    ],
    upB: [
      [8, 21, 6, 18],
      [12, 21, 14, 12],
    ],
    carry: [
      [8, 21, 9, 25],
      [12, 21, 16, 24],
    ],
  };
  A[arms].forEach(([a, b, c, d], i) => arm(a, b, c, d, coat[i ? 2 : 0]));
  // scarf round the neck, its tail down the back
  for (let x = 7; x < 15; x++) for (let y = 17; y < 20; y++) p.set(x, y, (x + y) % 4 < 2 ? scarf[1] : scarf[2]);
  for (let y = 20; y < 27; y++) p.rect(back ? 10 : 6, y, 2, 1, y % 3 ? scarf[1] : scarf[2]);
  // head
  oval(p, 11, 12, 4, 5, skin[1]);
  if (back) oval(p, 11, 12, 4, 5, hair[1]);
  else {
    p.rect(7, 9, 3, 5, hair[1]);
    p.set(15, 12, skin[0]).set(16, 12, skin[1]); // nose
    const ey = face === 'look' ? 11 : 11;
    const ex = face === 'look' ? 12 : 13;
    if (face === 'blink' || face === 'cheer') p.rect(ex, ey, 2, 1, ink[0]);
    else if (face === 'ouch')
      p.set(ex, ey - 1, ink[0])
        .set(ex + 1, ey, ink[0])
        .set(ex, ey + 1, ink[0]);
    else p.rect(ex, ey - 1, 1, 2, ink[0]);
    if (face === 'oh' || face === 'ouch') p.rect(13, 14, 2, 2, ink[0]);
    else if (face === 'cheer') p.rect(12, 14, 3, 2, ink[0]).rect(13, 14, 1, 1, scarf[2]);
    else p.rect(13, 15, 2, 1, ink[0]);
  }
  // the cap, its pom-pom and the ear flap with its tie
  p.rect(7, 5, 9, 4, cap[1]).rect(6, 8, 11, 2, cap[0]);
  for (let x = 8; x < 16; x += 2) p.set(x, 6, cap[2]);
  oval(p, 11, 4, 2, 1.5, cap[2]);
  p.rect(back ? 13 : 8, 10, 2, 5, cap[1])
    .set(back ? 14 : 9, 15, cap[0])
    .set(back ? 14 : 9, 16, cap[0]);
  if (back) p.rect(6, 10, 2, 5, cap[1]);
  return stamp(pal, p);
}

/** Rory's character blocks (.CBL), with the names the kit's hero file (heroChar.ts) asks for. */
export function buildRoryBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (top: string, bottom: string, face: Face, arms: Arms, legs: Legs) => {
    const f = figure(pal, face, arms, legs);
    if (!book.has(top)) book.add(top, f.crop(0, 0, 20, 20));
    if (!book.has(bottom)) book.add(bottom, f.crop(0, 20, 20, 20));
  };
  add('stand.top', 'stand', 'smile', 'down', LEGS.stand);
  add('blink.top', 'stand', 'blink', 'down', LEGS.stand);
  add('hurt.top', 'hurt', 'ouch', 'out', LEGS.walk0);
  add('cheer.top', 'jump', 'cheer', 'out', LEGS.tuck);
  for (let i = 0; i < 4; i++) add('stand.top', `walk${i}`, 'smile', i % 2 ? 'swingB' : 'swingA', LEGS[`walk${i}`]);
  add('up.top', 'jumpup', 'cheer', 'high', LEGS.tuck);
  add('oh.top', 'fall', 'oh', 'flail', LEGS.dangle);
  add('cheer2.top', 'cheer', 'cheer', 'high', LEGS.stand);
  add('look.top', 'stand', 'look', 'down', LEGS.stand);
  add('stand.top', 'dig0', 'smile', 'carry', LEGS.walk1);
  add('stand.top', 'dig1', 'smile', 'carry', LEGS.walk3);
  add('stand.top', 'throw0', 'smile', 'carry', LEGS.stand);
  add('cheer.top', 'throw1', 'cheer', 'out', LEGS.stand);
  add('stand.top', 'throw2', 'smile', 'down', LEGS.stand);
  add('back.top', 'climb0', 'back', 'upA', LEGS.climbA);
  add('back.top', 'climb1', 'back', 'upB', LEGS.climbB);
  return book;
}

/** Rory standing still, out of breath, as two map blocks on the street's paper (the finale's hand-off). */
export function roryStanding(pal: Pal): [Pixels, Pixels] {
  const f = figure(pal, 'oh', 'carry', LEGS.stand);
  const p = paperBlock(pal, 20, 40, 5).blit(f, 0, 0, T);
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}
