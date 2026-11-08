// Midnight, the black cat: LUCKY CAT's hero, cut in the game's white-line woodcut (print.ts). Solid ink with a few
// carved strokes of sheen, a paper cut line all round, tall ears, narrow gold eyes with slit pupils, and the one
// thing anyone notices in the dark: a red collar with a gold bell. She is two blocks tall like every Game-Maker
// character (a head block over a body block), facing right. The pose names match the Starters' hero
// (kit/starter/hero.ts) so kit/starter/heroChar.ts walks, jumps and climbs her unchanged.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { T, cut, tri, type Pal } from './print';

export type Face = 'smile' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'back' | 'look' | 'smug';

/** A filled ellipse. */
export function oval(p: Pixels, cx: number, cy: number, rx: number, ry: number, color: number): Pixels {
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) p.set(x, y, color);
  return p;
}

/** Midnight's head: tall ears, a neat face, gold eyes; `back` is the back of her head (climbing). */
export function head(pal: Pal, face: Face): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  const sheen = c('ink', 2);
  const back = face === 'back';
  tri(p, [4, 1], [3, 11], [10, 9], ink);
  tri(p, [16, 1], [10, 9], [17, 11], ink);
  if (!back) {
    p.line(5, 4, 5, 9, c('ink', 3)).line(15, 4, 15, 9, c('ink', 3));
  }
  oval(p, 10, 13, 7.2, 5.8, ink);
  oval(p, 10, 16.5, 4.5, 3, ink);
  // carved sheen: a stroke over the brow
  p.rect(6, 9, 4, 1, sheen).rect(12, 9, 2, 1, sheen);
  if (back) {
    p.rect(7, 11, 6, 1, sheen).rect(8, 14, 4, 1, sheen);
    return p;
  }
  const gold = c('gold', 3);
  const lid = c('gold', 1);
  const eyeAt = (x: number, dx = 0) => {
    if (face === 'blink' || face === 'cheer') {
      p.rect(x, 13, 4, 1, gold)
        .set(x, 12, gold)
        .set(x + 3, 12, gold);
      return;
    }
    if (face === 'smug') {
      // half-lidded: she has seen this before
      p.rect(x, 13, 4, 1, gold)
        .rect(x, 12, 4, 1, lid)
        .set(x + 1 + dx, 13, ink);
      return;
    }
    const big = face === 'oh' || face === 'ouch' ? 1 : 0;
    p.rect(x, 11 - big, 4, 3 + big, gold).rect(x, 11 - big, 4, 1, lid);
    p.rect(x + 1 + dx, 11 - big, 1, 3 + big, ink);
    p.set(x + 3, 12, c('paper', 4));
  };
  const look = face === 'look' ? -1 : 0;
  eyeAt(4 + look);
  eyeAt(12 + look);
  // nose and mouth, cut in paper
  p.set(10, 16, c('red', 1)).set(11, 16, c('red', 1));
  const line = c('paper', 1);
  if (face === 'oh') p.rect(10, 18, 2, 1, c('red', 1));
  else if (face === 'ouch') p.rect(9, 18, 4, 1, line);
  else if (face === 'smug') p.set(9, 18, line).set(10, 18, line).set(12, 17, line);
  else p.set(9, 17, line).set(10, 18, line).set(11, 18, line).set(12, 17, line);
  // whiskers, cut through to the paper
  const w = c('paper', 3);
  p.line(0, 15, 4, 16, w).line(0, 18, 4, 17, w).line(16, 16, 19, 15, w).line(16, 17, 19, 18, w);
  return p;
}

export interface Legs {
  back: [number, number];
  front: [number, number];
}
export type Arms = 'down' | 'out' | 'high' | 'swingA' | 'swingB' | 'flail' | 'upA' | 'upB';

/** Midnight's body: a slim torso with the collar and bell, thin arms, a long tail that rises behind and narrow feet. */
export function body(pal: Pal, o: { arms: Arms; legs: Legs | 'tuck' | 'dangle' | 'climbA' | 'climbB'; climbing?: boolean }): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  const sheen = c('ink', 2);
  const climbing = !!o.climbing;
  // the tail: a long S that rises behind her
  const lift = o.legs === 'tuck' || o.legs === 'dangle' || o.arms === 'flail' ? 2 : 0;
  const tailX = climbing ? 13 : 0;
  for (let i = 0; i < 12; i++) {
    const x = tailX + Math.round(2 + Math.sin(i * 0.55) * 1.6);
    p.rect(x, 14 - i + lift, 2, 2, ink);
  }
  // torso
  oval(p, 10, 8, 4.6, 7.2, ink);
  p.rect(7, 4, 1, 6, sheen);
  if (!climbing) {
    p.rect(6, 0, 8, 2, c('red', 2)).rect(6, 1, 8, 1, c('red', 1));
    p.rect(11, 2, 3, 3, c('gold', 3)).set(13, 4, c('gold', 1)).set(11, 2, c('paper', 4));
  } else {
    p.rect(6, 0, 8, 2, c('red', 2));
  }
  const arm = (x: number, y: number, dx: number, dy: number) => {
    p.line(x, y, x + dx, y + dy, ink).line(x + 1, y, x + 1 + dx, y + dy, ink);
    p.rect(x + dx, y + dy, 2, 2, ink);
  };
  switch (o.arms) {
    case 'down':
      arm(7, 5, -1, 5);
      arm(12, 5, 1, 5);
      break;
    case 'out':
      arm(5, 4, -4, 2);
      arm(13, 4, 4, 2);
      break;
    case 'high':
      arm(6, 5, -3, -5);
      arm(13, 5, 2, -5);
      break;
    case 'swingA':
      arm(7, 5, -3, 4);
      arm(12, 5, 3, 4);
      break;
    case 'swingB':
      arm(7, 5, 2, 4);
      arm(12, 5, -2, 4);
      break;
    case 'flail':
      arm(5, 3, -4, -3);
      arm(13, 3, 3, -4);
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
  const foot = (x: number, up: number) => {
    p.rect(x + 1, 13, 2, 7 - up, ink);
    p.rect(x, 18 - up, 4, 2, ink);
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
  return p;
}

/** A head over a body, cut together so the paper line passes round the neck, not across it. */
export function pair(pal: Pal, top: Pixels, bottom: Pixels): readonly [Pixels, Pixels] {
  const whole = new Pixels(20, 40, T);
  whole.blit(top, 0, 0, T).blit(bottom, 0, 20, T);
  const out = cut(pal, whole);
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
  add('look.top', 'stand', head(pal, 'smug'), stand);
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
