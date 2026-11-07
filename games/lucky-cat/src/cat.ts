// Midnight, the black cat: LUCKY CAT's hero. She is two blocks tall like every Game-Maker character (a head
// block over a body block), drawn facing right, with big gold eyes, a red collar and a little gold bell, white
// paws and a tail that curls up behind her. Her fur is the game's own `fur` ramp: dark purple-black with a
// blue-violet sheen, so she shows against the ink outline. The pose names match the Starters' hero
// (kit/starter/hero.ts) so kit/starter/heroChar.ts walks, jumps and climbs her unchanged.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

const T = 255;
export type Face = 'smile' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'back' | 'look';

/** Fills the triangle a, b, c. */
function tri(p: Pixels, a: [number, number], b: [number, number], c: [number, number], color: number): void {
  const sign = (p1: number[], p2: number[], p3: number[]) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const pt = [x + 0.5, y + 0.5];
      const d1 = sign(pt, a, b);
      const d2 = sign(pt, b, c);
      const d3 = sign(pt, c, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) p.set(x, y, color);
    }
}

/** Midnight's head: ears, face and whiskers; `back` is the back of her head (climbing). */
export function head(pal: Pal, face: Face): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const fur = r('fur');
  const pink = r('pink');
  const gold = r('gold');
  const back = face === 'back';
  // ears first, so the head covers their roots
  tri(p, [3, 1], [2, 9], [9, 8], fur[2]);
  tri(p, [15, 1], [10, 8], [17, 9], fur[2]);
  if (!back) {
    tri(p, [4, 3], [4, 8], [7, 8], pink[2]);
    tri(p, [14, 3], [12, 8], [15, 8], pink[2]);
  }
  blob(p, 10, 12, 8.4, 6.8, fur, 0, 4);
  if (back) {
    p.rect(8, 6, 4, 6, fur[2]);
    return outline(p, c('ink', 0), { transparent: T });
  }
  // eyes: big and gold with a slit pupil (a glad curve when she cheers, a line when she blinks)
  const eyeAt = (x: number, dx = 0) => {
    if (face === 'blink' || face === 'cheer') {
      // a closed, upturned eye
      p.set(x, 12, gold[3]).set(x + 1, 11, gold[4]).set(x + 2, 11, gold[4]).set(x + 3, 12, gold[3]);
      return;
    }
    const big = face === 'oh' || face === 'ouch' ? 1 : 0;
    p.rect(x, 10 - big, 4, 5 + big, gold[3]).rect(x + 1, 10 - big, 2, 5 + big, gold[4]);
    p.rect(x, 10 - big, 4, 1, gold[1]);
    const px = x + 1 + dx;
    p.rect(px, 11 - big, 1, 3 + big, c('ink', 0)).rect(px + 1, 11 - big, 1, 3 + big, c('ink', 0));
    p.set(x + 3, 11 - big, c('white', 3));
  };
  const look = face === 'look' ? -1 : 0;
  eyeAt(5 + look);
  eyeAt(12 + look);
  // nose and mouth
  p.rect(10, 15, 2, 1, pink[3]).set(10, 16, pink[1]);
  if (face === 'oh') p.rect(10, 17, 2, 2, c('ink', 0)).set(10, 17, pink[3]);
  else if (face === 'ouch') p.rect(9, 17, 4, 1, c('ink', 0));
  else {
    p.set(8, 17, c('ink', 0)).set(9, 18, c('ink', 0)).set(10, 17, c('ink', 0));
    p.set(11, 17, c('ink', 0)).set(12, 18, c('ink', 0)).set(13, 17, c('ink', 0));
  }
  // whiskers
  const w = c('white', 3);
  p.line(1, 14, 3, 15, w).line(1, 17, 3, 16, w).line(17, 15, 18, 14, w).line(17, 16, 18, 17, w);
  return outline(p, c('ink', 0), { transparent: T });
}

export interface Legs {
  back: [number, number];
  front: [number, number];
}
export type Arms = 'down' | 'out' | 'high' | 'swingA' | 'swingB' | 'flail' | 'upA' | 'upB';

/** Midnight's body: a small torso with a collar and bell, arms, a curling tail and white-toed feet. */
export function body(pal: Pal, o: { arms: Arms; legs: Legs | 'tuck' | 'dangle' | 'climbA' | 'climbB'; climbing?: boolean }): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const fur = r('fur');
  const red = r('red');
  const gold = r('gold');
  const white = r('white');
  const climbing = !!o.climbing;
  // the tail: a thick curl that rises behind her
  const lift = o.legs === 'tuck' || o.legs === 'dangle' || o.arms === 'flail' ? 2 : 0;
  const tailX = climbing ? 12 : 1;
  for (let i = 0; i < 9; i++) {
    const x = tailX + Math.round(2 - Math.sin(i * 0.5) * 2) - (climbing ? 0 : 0);
    p.rect(x, 12 - i + lift, 3, 2, fur[i > 6 ? 3 : 2]);
  }
  p.rect(tailX + 1, 3 + lift, 2, 2, fur[3]);
  // torso
  blob(p, 10, 8, 6, 7.5, fur, 0, 4);
  if (!climbing) {
    // the red collar and the gold bell at her throat
    p.rect(5, 1, 10, 2, red[3]).rect(5, 1, 10, 1, red[4]).rect(5, 3, 10, 1, red[1]);
    p.disc(13, 5, 1.8, gold[3]).set(12, 4, gold[5]).set(13, 6, gold[1]);
  } else {
    p.rect(5, 0, 10, 2, red[3]);
  }
  // arms (paws are white mitts)
  const arm = (x: number, y: number, dx: number, dy: number) => {
    p.line(x, y, x + dx, y + dy, fur[3]).line(x + 1, y, x + 1 + dx, y + dy, fur[2]);
    p.rect(x + dx, y + dy, 3, 3, white[3]);
  };
  switch (o.arms) {
    case 'down':
      arm(7, 5, 0, 5);
      arm(12, 5, 1, 5);
      break;
    case 'out':
      arm(4, 4, -3, 2);
      arm(14, 4, 2, 2);
      break;
    case 'high':
      arm(5, 5, -2, -5);
      arm(14, 5, 1, -5);
      break;
    case 'swingA':
      arm(7, 5, -2, 4);
      arm(12, 5, 3, 4);
      break;
    case 'swingB':
      arm(7, 5, 2, 4);
      arm(12, 5, -2, 4);
      break;
    case 'flail':
      arm(4, 3, -3, -3);
      arm(14, 3, 2, -4);
      break;
    case 'upA':
      arm(6, 4, 0, -5);
      arm(12, 5, 2, -3);
      break;
    case 'upB':
      arm(6, 5, -1, -3);
      arm(12, 4, 1, -5);
      break;
  }
  // legs and feet
  const foot = (x: number, up: number) => {
    const top = 14;
    p.rect(x, top, 4, 6 - up, fur[2]);
    p.rect(x, 17 - up, 5, 3, white[3]).rect(x, 17 - up, 5, 1, white[4]);
  };
  const legs = o.legs;
  if (legs === 'tuck') {
    foot(5, 4);
    foot(11, 4);
  } else if (legs === 'dangle') {
    foot(4, 2);
    foot(12, 1);
  } else if (legs === 'climbA') {
    foot(5, 0);
    foot(11, 4);
  } else if (legs === 'climbB') {
    foot(5, 4);
    foot(11, 0);
  } else {
    foot(legs.back[0], legs.back[1]);
    foot(legs.front[0], legs.front[1]);
  }
  return outline(p, c('ink', 0), { transparent: T });
}

/** A head over a body, outlined together so the outline passes across the neck. */
function pair(pal: Pal, top: Pixels, bottom: Pixels): readonly [Pixels, Pixels] {
  const whole = new Pixels(20, 40, T);
  whole.blit(top, 0, 0, T).blit(bottom, 0, 20, T);
  const out = outline(whole, pal.c('ink', 0), { transparent: T });
  return [out.crop(0, 0, 20, 20), out.crop(0, 20, 20, 20)] as const;
}

/** Midnight's character blocks (.CBL) by the Starters' pose names. */
export function buildCatBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = pair(pal, top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const stand = body(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } });
  add('stand.top', 'stand', head(pal, 'smile'), stand);
  add('blink.top', 'stand', head(pal, 'blink'), stand);
  add('hurt.top', 'hurt', head(pal, 'ouch'), body(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  add('cheer.top', 'jump', head(pal, 'cheer'), body(pal, { arms: 'out', legs: 'tuck' }));
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
  walk.forEach((legs, i) => add('stand.top', `walk${i}`, head(pal, 'smile'), body(pal, { arms: i % 2 ? 'swingB' : 'swingA', legs })));
  add('up.top', 'jumpup', head(pal, 'smile'), body(pal, { arms: 'high', legs: 'tuck' }));
  add('oh.top', 'fall', head(pal, 'oh'), body(pal, { arms: 'flail', legs: 'dangle' }));
  add('cheer2.top', 'cheer', head(pal, 'cheer'), body(pal, { arms: 'high', legs: { back: [5, 0], front: [11, 0] } }));
  add('look.top', 'stand', head(pal, 'look'), stand);
  const dig = { back: [3, 0], front: [10, 0] } as Legs;
  add('stand.top', 'dig0', head(pal, 'smile'), body(pal, { arms: 'swingA', legs: dig }));
  add('stand.top', 'dig1', head(pal, 'smile'), body(pal, { arms: 'swingB', legs: dig }));
  add('stand.top', 'throw0', head(pal, 'smile'), body(pal, { arms: 'out', legs: { back: [5, 0], front: [11, 0] } }));
  add('cheer.top', 'throw1', head(pal, 'cheer'), body(pal, { arms: 'high', legs: { back: [4, 0], front: [11, 0] } }));
  add('stand.top', 'throw2', head(pal, 'smile'), body(pal, { arms: 'swingA', legs: { back: [5, 0], front: [11, 0] } }));
  add('back.top', 'climb0', head(pal, 'back'), body(pal, { arms: 'upA', legs: 'climbA', climbing: true }));
  add('back.top', 'climb1', head(pal, 'back'), body(pal, { arms: 'upB', legs: 'climbB', climbing: true }));
  return book;
}

/** A pose as one 20x40 picture, for screens and previews. */
export function catPicture(book: Book, top: string, bottom: string): Pixels {
  const p = new Pixels(20, 40, T);
  p.px.set(book.pics.get(top)!.px, 0);
  p.px.set(book.pics.get(bottom)!.px, 400);
  return p;
}
