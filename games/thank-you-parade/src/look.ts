// THE THANK-YOU PARADE's look: Penny the drum major (her own colors on the Starter hero's palette ranges,
// and her own head: a tall navy hat with a gold band and a red plume instead of a knit cap), and the
// level palettes, one per time of the parade morning (the same blocks in other colors).
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { body, head, outlinedPair, type Face, type Legs } from '../../kit/starter/hero';
import { kitRamp, recolor, type Look } from '../../kit/starter/heroLook';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];
export type Ramp = [number, RGB, RGB, RGB?];

/** Penny: warm brown skin, black hair in a ponytail, a navy hat, a red band jacket, white trousers. */
export const PENNY: Look = {
  skin: [4, [112, 62, 38], [228, 172, 122], [182, 114, 72]],
  hair: [3, [18, 12, 26], [84, 62, 88]],
  hat: [5, [10, 14, 70], [120, 150, 230], [34, 56, 140]],
  hood: [5, [120, 12, 32], [255, 150, 124], [220, 44, 54]],
  pants: [5, [150, 160, 196], [255, 255, 255], [226, 232, 248]],
};

/** The shared Starter palette with Penny's colors in the hero's index ranges. */
export function pennyPalette(): Pal {
  const base = buildStarterPalette();
  return { ...base, pal: recolor(base, PENNY) };
}

/** A copy of `pal` with some ramps recolored (same indices, other colors): the same blocks at another time of day. */
export function swap(pal: Pal, ramps: Record<string, Ramp>): Pal {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const [name, [n, from, to, mid]] of Object.entries(ramps)) {
    const made = scratch.ramp(name, n, from, to, mid);
    pal.r(name).forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return { ...pal, pal: out };
}

/** Penny's head: the Starter head with the knit cap taken off and a shako put on (a tall hat with a gold band, a brim and a plume). */
function pennyHead(pal: Pal, face: Face, front = false, look = 0, raised: 'left' | 'right' | 'both' | '' = ''): Pixels {
  const p = head(pal, face, front, look, raised);
  const hat = kitRamp(pal, 'hat');
  const white = pal.r('white');
  const gold = pal.r('gold');
  const red = pal.r('red');
  const cap = new Set([...hat, white[1], white[2], white[3]]);
  for (let y = 0; y <= 10; y++) for (let x = 0; x < 20; x++) if (cap.has(p.get(x, y))) p.set(x, y, 255);
  const cx = front ? 10 : 9; // the crown's middle
  for (let y = 3; y <= 7; y++) {
    const half = y === 7 ? 5 : 4;
    p.rect(cx - half, y, half * 2 + 1, 1, hat[3]);
    p.set(cx - half, y, hat[4]).set(cx + half, y, hat[1]).set(cx + half - 1, y, hat[2]);
  }
  p.rect(cx - 4, 3, 9, 1, hat[4]);
  p.rect(cx - 6, 8, 13, 1, gold[4]);
  p.set(cx, 5, gold[5]).set(cx, 6, gold[3]);
  const vx = front ? 0 : 2;
  p.rect(cx - 7, 9, 15 + vx, 2, hat[0]).rect(cx - 7, 9, 15 + vx, 1, hat[1]);
  // the plume: a tall red feather rising from the crown and curling back
  p.rect(cx - 1, 0, 5, 1, red[3]).rect(cx, 1, 4, 1, red[3]).rect(cx + 1, 2, 2, 1, red[3]).set(cx + 1, 3, red[2]);
  p.set(cx, 0, red[4]).set(cx + 1, 1, red[4]).set(cx - 2, 0, red[2]).set(cx + 4, 0, red[2]).set(cx + 3, 1, red[2]);
  return p;
}

/** Penny's character blocks (.CBL): the Starter hero's poses with her head. */
export function buildPennyBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const pair = (top: Pixels, bottom: Pixels) => outlinedPair(pal, top, bottom);
  const stand = body(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } });
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = pair(top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const h = (face: Face, front = false, look = 0, raised: 'left' | 'right' | 'both' | '' = '') => pennyHead(pal, face, front, look, raised);
  add('stand.top', 'stand', h('smile'), stand);
  add('blink.top', 'stand', h('blink'), stand);
  add('hurt.top', 'hurt', h('ouch'), body(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  add('cheer.top', 'jump', h('cheer'), body(pal, { arms: 'out', legs: 'tuck' }));
  walk.forEach((legs, i) => add('stand.top', `walk${i}`, h('smile'), body(pal, { arms: i % 2 ? 'swingB' : 'swingA', legs })));
  add('up.top', 'jumpup', h('smile', false, 0, 'both'), body(pal, { arms: 'high', legs: 'tuck' }));
  add('oh.top', 'fall', h('oh', false, 0, 'left'), body(pal, { arms: 'flail', legs: 'dangle' }));
  add('cheer2.top', 'cheer', h('cheer', false, 0, 'both'), body(pal, { arms: 'high', legs: { back: [5, 0], front: [11, 0] } }));
  add('look.top', 'stand', h('smile', false, -1), stand);
  const dig = { back: [3, 0], front: [10, 0] } as Legs;
  add('stand.top', 'dig0', h('smile'), body(pal, { arms: 'dig0', legs: dig }));
  add('stand.top', 'dig1', h('smile'), body(pal, { arms: 'dig1', legs: dig }));
  add('stand.top', 'throw0', h('smile'), body(pal, { arms: 'windup', legs: { back: [5, 0], front: [11, 0] } }));
  add('cheer.top', 'throw1', h('cheer'), body(pal, { arms: 'release', legs: { back: [4, 0], front: [11, 0] } }));
  add('stand.top', 'throw2', h('smile'), body(pal, { arms: 'follow', legs: { back: [5, 0], front: [11, 0] } }));
  add('back.top', 'climb0', h('back', true), body(pal, { arms: 'upA', legs: 'climbA', front: true, back: true }));
  add('back.top', 'climb1', h('back', true), body(pal, { arms: 'upB', legs: 'climbB', front: true, back: true }));
  return book;
}
