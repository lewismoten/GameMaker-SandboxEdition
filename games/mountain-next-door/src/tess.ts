// Tess, the trail marker: the Starter hero's poses in Tess's colors (palette.ts TESS) with her own head: the knit
// cap taken off and a wide-brimmed sun hat put on, with a long braid down her back. Drawn facing right; the
// character file mirrors the pictures for walking left.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { body, head, outlinedPair, type Face, type Legs } from '../../kit/starter/hero';
import { kitRamp } from '../../kit/starter/heroLook';
import type { Pal } from '../../kit/starter/palette';

type Raised = 'left' | 'right' | 'both' | '';

/** Tess's head: the Starter head with a sun hat (a round crown, a red-brown band, a wide brim) and a braid. */
function tessHead(pal: Pal, face: Face, front = false, look = 0, raised: Raised = ''): Pixels {
  const p = head(pal, face, front, look, raised);
  const hat = kitRamp(pal, 'hat');
  const hair = kitRamp(pal, 'hair');
  const white = pal.r('white');
  const band = pal.r('brick');
  const cap = new Set([...hat, white[1], white[2], white[3]]);
  for (let y = 0; y <= 10; y++) for (let x = 0; x < 20; x++) if (cap.has(p.get(x, y))) p.set(x, y, 255);
  const cx = front ? 10 : 9;
  // the crown: a soft dome
  const crown: [number, number][] = [
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 5],
    [7, 5],
  ];
  for (const [y, half] of crown) {
    p.rect(cx - half, y, half * 2 + 1, 1, hat[3]);
    p.set(cx - half, y, hat[4]).set(cx + half, y, hat[1]);
  }
  p.rect(cx - 2, 3, 3, 1, hat[4]);
  // the band
  p.rect(cx - 5, 8, 11, 1, band[2]);
  // the brim: wide, tipped a little down at the front
  const vx = front ? 0 : 1;
  p.rect(cx - 8, 9, 17 + vx, 1, hat[4]).rect(cx - 8, 10, 17 + vx, 1, hat[2]);
  p.set(cx - 9, 10, hat[2]).set(cx + 9 + vx, 10, hat[1]);
  // the braid: down the back of the neck, out from under the hat
  if (!front && face !== 'back') {
    for (let y = 12; y <= 19; y++) p.rect(2, y, 2, 1, y % 2 ? hair[1] : hair[2]);
    p.rect(2, 19, 2, 1, pal.c('green', 2));
  }
  if (face === 'back') for (let y = 13; y <= 19; y++) p.rect(9, y, 2, 1, y % 2 ? hair[0] : hair[1]);
  return p;
}

/** Tess's character blocks (.CBL): the Starter hero's poses with her head. */
export function buildTessBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = outlinedPair(pal, top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const h = (face: Face, front = false, look = 0, raised: Raised = '') => tessHead(pal, face, front, look, raised);
  const stand = body(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } });
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
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

/** A standing picture of Tess (head over body), for the title, cards and cartoons. */
export function tessPicture(book: Book, top: string, bottom: string): Pixels {
  const p = new Pixels(20, 40, 255);
  p.blit(book.pics.get(top)!, 0, 0, 255);
  p.blit(book.pics.get(bottom)!, 0, 20, 255);
  return p;
}
