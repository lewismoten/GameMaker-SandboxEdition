// Mr. Plume, Grandma's turkey and a guest (never the dinner), drawn in the block-print look: a tall black pilgrim hat
// with a gold buckle, one eyebrow lowered for the grudge, a fan of tail feathers, and a black belt tied round the
// middle (eleven tapes of a mail-order jujitsu course). Facing right, 20x40, cut into head and body blocks.
// The kick is three poses: the wind-up (knee up, wings in guard), the strike (leg straight out, body leaned back,
// impact lines) and the recovery.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Book } from '../../kit/starter/book';
import { oval, press, stamp, T } from './print';

type Face = 'glare' | 'blink' | 'look' | 'ouch' | 'yell' | 'oh' | 'back';
type Wings = 'down' | 'swingA' | 'swingB' | 'up' | 'guard' | 'flap';
type Legs = 'stand' | 'walk0' | 'walk1' | 'walk2' | 'walk3' | 'tuck' | 'dangle' | 'chamber' | 'strike' | 'climbA' | 'climbB';

/** The feet: [x of the back foot, its lift, x of the front foot, its lift]. */
const FEET: Record<Exclude<Legs, 'chamber' | 'strike'>, [number, number, number, number]> = {
  stand: [8, 0, 12, 0],
  walk0: [6, 0, 14, 0],
  walk1: [8, 0, 12, 2],
  walk2: [13, 0, 7, 0],
  walk3: [9, 2, 11, 0],
  tuck: [9, 4, 12, 4],
  dangle: [7, 0, 13, 1],
  climbA: [8, 3, 12, 0],
  climbB: [8, 0, 12, 3],
};

function turkey(pal: Pal, face: Face, wings: Wings, legs: Legs, lean = 0): Pixels {
  const { ink } = press(pal);
  const [brown, fan, red, beak, hat, gold] = ['tBrown', 'tFan', 'tRed', 'tBeak', 'tHat', 'tGold'].map((n) => pal.r(n));
  const p = new Pixels(20, 40, T);
  const back = face === 'back';
  const bx = 9 - lean; // the body's center
  // the tail fan, behind: stripes of feathers in a half circle
  const fx = back ? 10 : bx - 3;
  for (let a = 0; a < 7; a++) {
    const ang = back ? Math.PI * (0.1 + (a / 6) * 0.8) : Math.PI * (0.4 + (a / 6) * 0.75);
    const r = back ? 10 : 11;
    for (let t = 2; t <= r; t++) {
      const x = Math.round(fx + Math.cos(ang) * t);
      const y = Math.round(25 - Math.sin(ang) * t);
      p.rect(x, y, 2, 2, t > r - 2 ? fan[3] : fan[a % 3]);
    }
  }
  // legs
  if (legs === 'chamber') {
    p.line(bx - 1, 31, bx - 1, 38, beak[0]).rect(bx - 3, 38, 5, 1, beak[0]);
    p.line(bx + 2, 31, bx + 5, 30, beak[0])
      .line(bx + 5, 30, bx + 4, 34, beak[0])
      .rect(bx + 4, 34, 3, 1, beak[0]);
  } else if (legs === 'strike') {
    p.line(bx - 1, 31, bx - 2, 38, beak[0]).rect(bx - 4, 38, 5, 1, beak[0]);
    p.rect(bx + 2, 30, 19 - bx - 3, 2, beak[0]);
    p.rect(17, 28, 2, 6, beak[1]).set(19, 28, beak[1]).set(19, 33, beak[1]);
    // impact lines
    p.set(19, 26, ink[0]).set(18, 25, ink[0]).set(19, 36, ink[0]).set(18, 37, ink[0]);
  } else {
    const [b, bl, f, fl] = FEET[legs];
    p.line(bx - 1, 31, b + 1, 38 - bl, beak[0]).rect(b - 1, 38 - bl, 4, 1, beak[0]);
    p.line(bx + 1, 31, f + 1, 38 - fl, beak[0]).rect(f, 38 - fl, 4, 1, beak[0]);
  }
  // the body, round, with scallops of feathers
  oval(p, bx, 25, 6, 7, brown[1]);
  for (let y = 20; y < 31; y += 3) for (let x = bx - 4 + ((y / 3) % 2); x < bx + 5; x += 3) p.set(x, y, brown[3]).set(x + 1, y + 1, brown[2]);
  // the black belt and its tails
  p.rect(bx - 6, 26, 13, 2, hat[0]);
  if (!back) p.rect(bx + 3, 27, 1, 4, hat[0]).rect(bx + 5, 27, 1, 3, hat[0]);
  // wings
  const W: Record<Wings, [number, number, number, number]> = {
    down: [bx - 2, 22, bx + 2, 29],
    swingA: [bx - 3, 22, bx, 29],
    swingB: [bx, 22, bx + 3, 29],
    up: [bx - 1, 21, bx + 4, 15],
    guard: [bx + 1, 21, bx + 6, 19],
    flap: [bx - 2, 21, bx - 6, 16],
  };
  const [w0, w1, w2, w3] = W[wings];
  p.line(w0, w1, w2, w3, brown[0])
    .line(w0 + 1, w1, w2 + 1, w3, brown[0])
    .line(w0 + 1, w1 + 1, w2 + 1, w3 + 1, brown[2]);
  // neck and head
  const hx = back ? bx + 1 : bx + 4;
  p.rect(hx - 2, 13, 3, 9, brown[2]);
  oval(p, hx, 11, 3, 3, back ? brown[1] : brown[3]);
  if (!back) {
    p.rect(hx + 3, 11, 3, 2, beak[1]).set(hx + 5, 12, beak[0]);
    p.rect(hx + 2, 13, 2, 4, red[1]).set(hx + 2, 17, red[0]);
    if (face === 'blink') p.rect(hx, 10, 2, 1, ink[0]);
    else if (face === 'ouch')
      p.set(hx, 9, ink[0])
        .set(hx + 1, 10, ink[0])
        .set(hx, 11, ink[0]);
    else {
      p.rect(hx + (face === 'look' ? -1 : 0), 10, 2, 2, ink[0]);
      if (face === 'glare' || face === 'yell') p.line(hx - 1, 8, hx + 2, 9, ink[0]); // the eyebrow: lowered
    }
    if (face === 'yell' || face === 'oh') p.rect(hx + 3, 13, 2, 1, ink[0]);
  }
  // the pilgrim hat: tall crown, brim, gold buckle on the band
  const top = 1;
  p.rect(hx - 3, top, 7, 7, hat[1]).rect(hx - 3, top, 7, 1, hat[2]);
  p.rect(hx - 6, top + 7, 13, 2, hat[0]);
  p.rect(hx - 3, top + 5, 7, 2, hat[0]);
  if (!back) p.rect(hx - 1, top + 4, 3, 4, gold[1]).rect(hx, top + 5, 1, 2, hat[0]);
  return stamp(pal, p);
}

type FrontFace = 'glare' | 'blink' | 'yell';
type FrontWings = 'down' | 'guard' | 'out';
type FrontLegs = 'stand' | 'wide' | 'split';

/**
 * Mr. Plume face on, for the poses that do not walk (standing still and the kick): Game-Maker shows one picture set
 * for them whichever way he last walked, and his kick flies that way, so these face the player and the split kick
 * reaches out both sides. Drawn on the left half and mirrored, so it is the same both ways round.
 */
function turkeyFront(pal: Pal, face: FrontFace, wings: FrontWings, legs: FrontLegs): Pixels {
  const { ink } = press(pal);
  const [brown, fan, red, beak, hat, gold] = ['tBrown', 'tFan', 'tRed', 'tBeak', 'tHat', 'tGold'].map((n) => pal.r(n));
  const p = new Pixels(20, 40, T);
  // the tail fan, behind him
  for (let a = 0; a < 7; a++) {
    const ang = Math.PI * (0.1 + (a / 6) * 0.8);
    for (let t = 2; t <= 10; t++) p.rect(Math.round(10 + Math.cos(ang) * t), Math.round(25 - Math.sin(ang) * t), 2, 2, t > 8 ? fan[3] : fan[a % 3]);
  }
  // legs
  if (legs === 'split') {
    // a jumping split: each leg out and down to a foot flexed at the end
    p.line(8, 31, 2, 36, beak[0]).line(8, 32, 3, 36, beak[0]);
    p.rect(0, 34, 2, 5, beak[1]).set(2, 38, beak[1]);
  } else {
    const fx = legs === 'wide' ? 4 : 6;
    p.line(8, 31, fx + 1, 38, beak[0]).rect(fx - 1, 38, 4, 1, beak[0]);
  }
  // the body, its scallops, the black belt with its knot in front
  oval(p, 10, 25, 6, 7, brown[1]);
  for (let y = 20; y < 31; y += 3) for (let x = 5 + ((y / 3) % 2); x < 10; x += 3) p.set(x, y, brown[3]).set(x + 1, y + 1, brown[2]);
  p.rect(3, 26, 7, 2, hat[0]).rect(9, 25, 1, 4, hat[0]);
  // wings
  const W: Record<FrontWings, [number, number, number, number]> = { down: [5, 21, 3, 29], guard: [5, 22, 7, 17], out: [5, 21, 1, 18] };
  const [w0, w1, w2, w3] = W[wings];
  p.line(w0, w1, w2, w3, brown[0])
    .line(w0 - 1, w1, w2 - 1, w3, brown[0])
    .line(w0, w1 + 1, w2, w3 + 1, brown[2]);
  // neck and head: eyes either side of the beak, the wattle under it
  p.rect(9, 13, 1, 9, brown[2]);
  oval(p, 10, 12, 3.5, 3.5, brown[3]);
  if (face === 'blink') p.rect(7, 12, 2, 1, ink[0]);
  else p.rect(8, 11, 1, 2, ink[0]).set(7, 10, ink[0]); // the eyebrows: lowered
  p.rect(8, 13, 2, 1, beak[1]).set(9, 14, beak[0]);
  if (face === 'yell') p.set(9, 14, ink[0]).set(9, 15, beak[0]);
  p.rect(9, face === 'yell' ? 16 : 15, 1, 3, red[1]);
  // the pilgrim hat: tall crown, brim, gold buckle on the band
  p.rect(7, 1, 3, 7, hat[1]).rect(7, 1, 3, 1, hat[2]);
  p.rect(4, 8, 6, 2, hat[0]).rect(7, 6, 3, 2, hat[0]);
  p.rect(8, 5, 2, 4, gold[1]).rect(9, 6, 1, 2, hat[0]);
  for (let y = 0; y < 40; y++) for (let x = 10; x < 20; x++) p.set(x, y, p.get(19 - x, y));
  return stamp(pal, p);
}

/** Mr. Plume's character blocks (.CBL): the kit hero file's names, with throw0..2 as the kick. */
export function buildPlumeBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (top: string, bottom: string, face: Face, wings: Wings, legs: Legs, lean = 0) => {
    const f = turkey(pal, face, wings, legs, lean);
    if (!book.has(top)) book.add(top, f.crop(0, 0, 20, 20));
    if (!book.has(bottom)) book.add(bottom, f.crop(0, 20, 20, 20));
  };
  add('stand.top', 'stand', 'glare', 'down', 'stand');
  add('blink.top', 'stand', 'blink', 'down', 'stand');
  add('hurt.top', 'hurt', 'ouch', 'flap', 'dangle');
  add('cheer.top', 'jump', 'yell', 'up', 'tuck');
  for (let i = 0; i < 4; i++) add('stand.top', `walk${i}`, 'glare', i % 2 ? 'swingB' : 'swingA', `walk${i}` as Legs);
  add('up.top', 'jumpup', 'yell', 'flap', 'tuck');
  add('oh.top', 'fall', 'oh', 'up', 'dangle');
  add('cheer2.top', 'cheer', 'yell', 'up', 'stand');
  add('look.top', 'stand', 'look', 'down', 'stand');
  add('stand.top', 'dig0', 'glare', 'guard', 'walk1');
  add('stand.top', 'dig1', 'glare', 'guard', 'walk3');
  // the kick: wind-up, strike, recovery (each body drawn with its own lean, so the head moves with it)
  add('kick0.top', 'throw0', 'glare', 'guard', 'chamber', 1);
  add('kick1.top', 'throw1', 'yell', 'flap', 'strike', 2);
  add('stand.top', 'throw2', 'glare', 'guard', 'stand');
  // face on: standing still and the split kick (turkeyFront)
  const front = (top: string, bottom: string, face: FrontFace, wings: FrontWings, legs: FrontLegs) => {
    const f = turkeyFront(pal, face, wings, legs);
    if (!book.has(top)) book.add(top, f.crop(0, 0, 20, 20));
    if (!book.has(bottom)) book.add(bottom, f.crop(0, 20, 20, 20));
  };
  front('front.top', 'fstand', 'glare', 'down', 'stand');
  front('fblink.top', 'fstand', 'blink', 'down', 'stand');
  front('fkick0.top', 'fthrow0', 'glare', 'guard', 'wide');
  front('fkick1.top', 'fthrow1', 'yell', 'out', 'split');
  add('back.top', 'climb0', 'back', 'up', 'climbA');
  add('back.top', 'climb1', 'back', 'flap', 'climbB');
  return book;
}
