// TICKLE.CBL and TICKLE.MBL: Doc Leo (Lewis Moten's hobo clown: a chewed-up dark fedora, a red
// nose, white mouth and eye patches, a stubble "ash beard", a purple shirt and a green tie, red
// sneakers; for the occasion, a lab coat over it all), two blocks tall; and everything that moves:
// his hands pinning and his fingers tickling, the rats (white lab rats and the city's agouti wild
// rats: wary, tense, pinned on their backs, giggling, scampering off to the laughing carpet), the
// night janitor's floor buffer, Dean Dour of the Board of Serious Science, a sewer alligator,
// bats, a pigeon, Jacob's ladder sparks, and three old friends from the Bard's other songs (Loaf
// #13, the mustard seed in red sneakers and the third goat from the left).
//
// The pin and the tickle work by the shapes of these pictures (see ids.ts): a wary rat's pixels
// stay in the bottom half of its block (rows 11 and down), a pinned rat's paws reach up into the
// top half, and the tickling fingers stay in the top half (rows 8 and up). spriteRules() checks it.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { SOLLEF, SOLRIG } from '../../../../web/src/formats/blocks';

export { T, outline };

/** The lowest row a tickle's pixels may reach, and the highest a wary rat's may. */
export const TICKLE_LOW = 8;
export const RAT_HIGH = 11;

// ---------------------------------------------------------------------------------------------
// Doc Leo
// ---------------------------------------------------------------------------------------------

export interface LeoPose {
  view: 'front' | 'side';
  /** Walking stride (0..3) in side view. */
  stride?: number;
  /** What his arms do. */
  arms?: 'down' | 'up' | 'press' | 'wiggle0' | 'wiggle1' | 'swing';
  face?: 'smile' | 'blink' | 'laugh' | 'ouch' | 'dazed' | 'grin';
  /** Pixels the whole body is lowered (crouching to pin). */
  crouch?: number;
  /** Knees bent for a hop. */
  hop?: boolean;
  /** Head thrown back (the maniacal laugh). */
  back?: boolean;
  /** No hat: it has fallen off. */
  hatless?: boolean;
}

/** Doc Leo, 20 x 40 (top block over bottom block). */
export function leoArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  return (o: LeoPose): Pixels => {
    const p = new Pixels(20, 40, T);
    const side = o.view === 'side';
    const dy = o.crouch ?? 0;
    const hx = (o.back ? -1 : 0) + (side ? 0 : 0);
    // ---- legs and sneakers
    const shoe = (x: number, y: number, flip = false) => {
      p.rect(x, y, 5, 2, c('sneaker', 1)).rect(x + (flip ? 0 : 1), y, 3, 1, c('sneaker', 2));
      p.rect(x, y + 2, 5, 1, c('paint', 1));
    };
    if (!side) {
      const knee = o.hop ? 2 : 0;
      const legTop = 32 + dy;
      if (dy >= 4) {
        // crouched: knees out
        p.rect(4, legTop, 5, 4, c('navy', 1)).rect(11, legTop, 5, 4, c('navy', 1));
        shoe(3, 37, true);
        shoe(12, 37);
      } else {
        p.rect(6 - knee, legTop, 4, 37 - legTop, c('navy', 1))
          .rect(10 + knee, legTop, 4, 37 - legTop, c('navy', 1))
          .rect(9, legTop + 1, 2, 37 - legTop - 1, c('navy', 0));
        shoe(5 - knee, 37, true);
        shoe(10 + knee, 37);
      }
    } else {
      const s = o.stride ?? 0;
      const swing = [0, 3, 0, -3][s % 4];
      const lift = [0, 1, 0, 1][s % 4];
      if (o.hop) {
        p.line(9, 33, 6, 36, c('navy', 1)).line(10, 33, 7, 36, c('navy', 1)).line(11, 33, 13, 35, c('navy', 1)).line(12, 33, 14, 35, c('navy', 0));
        shoe(4, 36);
        shoe(12, 35);
      } else {
        // the far leg, then the near one
        p.line(10, 31, 10 - swing, 37, c('navy', 0)).line(11, 31, 11 - swing, 37, c('navy', 0));
        p.line(9, 31, 9 + swing, 37 - lift, c('navy', 1)).line(10, 31, 10 + swing, 37 - lift, c('navy', 1));
        shoe(8 - swing, 37);
        shoe(8 + swing, 37 - lift);
      }
    }
    // ---- the lab coat, open over the purple shirt and green tie
    const top = 19 + dy;
    const hem = (side ? 31 : 33) + dy;
    for (let y = top; y < hem; y++) {
      const half = side ? 4 + (y - top) * 0.12 : 5 + (y - top) * 0.15;
      const cx = side ? 10 : 10;
      for (let x = Math.round(cx - half); x <= cx + half; x++) p.set(x, y, c('coat', x < cx - half + 2 ? 2 : y > hem - 3 ? 3 : 4));
    }
    if (!side) {
      for (let y = top; y < top + 9; y++) p.rect(8, y, 4, 1, c('purple', 1));
      for (let y = top; y < top + 8; y++) p.rect(9, y, 2, 1, c('tie', y < top + 2 ? 2 : 1));
      p.set(9, top + 8, c('tie', 1)).set(10, top + 8, c('tie', 0));
      p.line(7, top, 9, top + 8, c('coat', 1)).line(12, top, 10, top + 8, c('coat', 1));
      // the pocket: the bat detector peeks out
      p.rect(12, top + 5, 3, 3, c('coat', 1))
        .rect(13, top + 3, 2, 2, c('steel', 2))
        .set(13, top + 3, c('potion', 3));
    } else {
      p.rect(12, top, 2, 6, c('purple', 1)).rect(13, top + 1, 1, 6, c('tie', 1));
      p.rect(7, top + 6, 3, 3, c('coat', 2));
    }
    // ---- arms
    const sleeve = (x0: number, y0: number, x1: number, y1: number) => {
      p.line(x0, y0, x1, y1, c('coat', 3)).line(x0 + 1, y0, x1 + 1, y1, c('coat', 2));
      p.disc(x1 + 0.5, y1 + 1, 1.3, c('skin', 2));
    };
    const arms = o.arms ?? 'down';
    if (side) {
      const s = o.stride ?? 0;
      if (arms === 'up') sleeve(10, top + 2, 13, top - 6);
      else sleeve(10, top + 2, 10 + [2, 0, -2, 0][s % 4], top + 10);
    } else if (arms === 'down' || arms === 'swing') {
      sleeve(4, top + 1, 3, top + 11);
      sleeve(15, top + 1, 15, top + 11);
    } else if (arms === 'up') {
      sleeve(4, top + 2, 1, top - 8);
      sleeve(15, top + 2, 17, top - 8);
    } else if (arms === 'press') {
      // both hands pressing down, out to the sides
      sleeve(4, top + 1, 0, top + 12);
      sleeve(15, top + 1, 18, top + 12);
    } else {
      // tickling: hands out at the chest, fingers wiggling
      const w = arms === 'wiggle1' ? 1 : 0;
      sleeve(4, top + 2, 1, top + 6 - w);
      sleeve(15, top + 2, 17, top + 6 - w);
      for (let k = 0; k < 3; k++) {
        p.set(0, top + 4 + k * 2 - w, c('skin', 3));
        p.set(19, top + 4 + k * 2 + w - 1, c('skin', 3));
      }
    }
    // ---- the head
    const hy = 8 + dy + (o.back ? 1 : 0);
    const fx = side ? 11 : 10 + hx;
    const face = o.face ?? 'smile';
    // collar
    p.rect(7, top - 1, 6, 1, c('purple', 2));
    if (side) blob(p, fx, hy + 4.5, 4, 5, pal.r('skin'), 1, 3);
    else blob(p, fx, hy + 4.5, 5, 5, pal.r('skin'), 1, 3);
    // the ash beard: stubble over the jaw
    for (let y = hy + 5; y < hy + 10; y++)
      for (let x = fx - 5; x <= fx + 5; x++) if (p.get(x, y) !== T && (x + y) % 2 === 0 && (y > hy + 6 || Math.abs(x - fx) > 3)) p.set(x, y, c('navy', 1));
    // the white mouth patch, and the mouth
    const mx = side ? fx + 2 : fx;
    p.rect(mx - (side ? 1 : 2), hy + 6, side ? 3 : 5, 3, c('paint', 1));
    if (face === 'laugh') p.rect(mx - (side ? 0 : 1), hy + 6, side ? 2 : 3, 3, c('nose', 0)).set(mx, hy + 6, c('paint', 1));
    else if (face === 'ouch' || face === 'dazed') p.rect(mx - 1, hy + 8, 3, 1, ink).set(mx, hy + 7, ink);
    else if (face === 'grin')
      p.rect(mx - 2, hy + 7, 5, 1, ink)
        .set(mx - 2, hy + 6, ink)
        .set(mx + 2, hy + 6, ink);
    else
      p.set(mx - 1, hy + 7, ink)
        .set(mx, hy + 8, ink)
        .set(mx + 1, hy + 7, ink);
    // eyes: white patches, and pupils (shut for a blink and a laugh)
    const eyes = side ? [fx + 1] : [fx - 2, fx + 2];
    for (const ex of eyes) {
      p.rect(ex - 1, hy + 2, 2, 2, c('paint', 1));
      if (face === 'blink' || face === 'laugh') p.rect(ex - 1, hy + 3, 2, 1, ink);
      else if (face === 'dazed') p.set(ex - 1, hy + 2, ink).set(ex, hy + 3, ink);
      else p.set(ex, hy + 3, ink);
      p.rect(ex - 1, hy + 1, 2, 1, ink);
    }
    // the red nose
    p.disc(side ? fx + 4 : fx + 0.5, hy + 5, 1.3, c('nose', 1)).set(side ? fx + 4 : fx, hy + 4, c('nose', 2));
    // ---- the fedora: chewed brim, dented crown, a few pins on the band
    if (!o.hatless) {
      const by = hy - 1 + (o.back ? 1 : 0);
      const bx0 = side ? 4 : 3 + hx;
      const bx1 = side ? 17 : 16 + hx;
      p.rect(bx0, by, bx1 - bx0 + 1, 1, c('hat', 1))
        .set(bx0 + 1, by, T)
        .set(bx1 - 2, by, T);
      for (let y = by - 6; y < by; y++) {
        const w = y === by - 6 ? 3 : 4;
        p.rect(fx - w - (side ? 1 : 0), y, w * 2 + 1, 1, c('hat', y === by - 1 ? 0 : y === by - 6 ? 2 : 1));
      }
      p.set(fx, by - 6, c('hat', 0)).set(fx - 1, by - 5, c('hat', 2));
      for (const [x, k] of [
        [fx - 3, 'nose'],
        [fx - 1, 'cheese'],
        [fx + 2, 'spark'],
      ] as const)
        p.set(x, by - 1, c(k, 2));
    }
    return outline(p, ink);
  };
}

/** Doc Leo's poses, as top and bottom blocks (identical halves are shared). */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const draw = leoArt(pal);
  const seen = new Map<string, string>();
  const poses = new Map<string, [string, string]>();
  const half = (pic: Pixels, y: number): Pixels => pic.crop(0, y, 20, 20);
  const add = (name: string, o: LeoPose) => {
    const pic = draw(o);
    const names: string[] = [];
    for (const [k, y] of [
      ['top', 0],
      ['bot', 20],
    ] as const) {
      const h = half(pic, y);
      const key = Array.from(h.px).join(',');
      let n = seen.get(key);
      if (!n) {
        n = `${name}.${k}`;
        book.add(n, h);
        seen.set(key, n);
      }
      names.push(n);
    }
    poses.set(name, names as [string, string]);
    book.pics.set(`pose.${name}`, pic);
  };
  add('front', { view: 'front' });
  add('blink', { view: 'front', face: 'blink' });
  add('grin', { view: 'front', face: 'grin' });
  for (let s = 0; s < 4; s++) add(`walk${s}`, { view: 'side', stride: s });
  add('hop', { view: 'front', arms: 'up', hop: true, face: 'grin' });
  add('hopSide', { view: 'side', arms: 'up', hop: true, face: 'grin' });
  add('pin', { view: 'front', arms: 'press', crouch: 4, face: 'grin' });
  add('tickle0', { view: 'front', arms: 'wiggle0', face: 'laugh' });
  add('tickle1', { view: 'front', arms: 'wiggle1', face: 'grin' });
  add('laugh0', { view: 'front', arms: 'up', face: 'laugh', back: true });
  add('laugh1', { view: 'front', arms: 'up', face: 'laugh' });
  add('hurt', { view: 'front', face: 'ouch', arms: 'up' });
  add('die0', { view: 'front', face: 'dazed', crouch: 4, arms: 'press' });
  add('die1', { view: 'front', face: 'dazed', crouch: 8, arms: 'press', hatless: true });
  if (book.index.size > 50) throw new Error(`Doc Leo needs ${book.index.size} character blocks`);
  return { ...book, poses };
}

// ---------------------------------------------------------------------------------------------
// The rats
// ---------------------------------------------------------------------------------------------

export type Fur = 'lab' | 'wild';

/** A rat in one of its moods, 20 x 20, facing right. */
export function ratArt(pal: Pal, fur: Fur) {
  const c = pal.c;
  const ink = c('ink', 0);
  const coat = fur === 'lab' ? 'rat' : 'agouti';
  const eye = fur === 'lab' ? c('eye', 1) : ink;
  const R = pal.r(coat);
  const tail = (x0: number, y0: number, pts: [number, number][]) => {
    let [x, y] = [x0, y0];
    const p = (q: Pixels) => {
      for (const [nx, ny] of pts) {
        q.line(x, y, nx, ny, c('pink', 0));
        [x, y] = [nx, ny];
      }
    };
    return p;
  };
  return {
    /** Crouched low on all fours, sniffing along (tense: fur up, tail stiff, ears back). */
    wary(f: number, tense = false): Pixels {
      const p = new Pixels(20, 20, T);
      tail(
        4,
        17,
        tense
          ? [[0, 17]]
          : [
              [1, 16 + f],
              [0, 18],
            ],
      )(p);
      blob(p, 9, 16, 6, 2.8, R, 1, 4);
      blob(p, 14.5, 16, 3.2, 2.2, R, 1, 4);
      // a wild rat's pale belly, so it reads against the sewer's brick and the tower's stone
      if (fur === 'wild') p.rect(6, 18, 9, 1, c('paper', 1)).rect(13, 18, 3, 1, c('paper', 1));
      // the ear (a wild rat's with a light rim)
      if (fur === 'wild') p.disc(13, 13.6, 1.8, c('paper', 2));
      p.disc(13, 13.6, 1.2, c('pink', 1));
      if (tense) for (const x of [5, 7, 9, 11]) p.set(x, 13, c(coat, 2));
      // eye, nose, whiskers
      p.set(15, 15, eye).set(18, 16, c('pink', 2));
      if (!tense) p.line(17, 17, 19, 18 - f, c(coat, 4));
      // feet
      p.set(6 + f, 19, c('pink', 1)).set(12 - f, 19, c('pink', 1));
      return outline(p, ink);
    },
    /** Pinned on its back, paws up (and kicking). */
    pinned(f: number): Pixels {
      const p = new Pixels(20, 20, T);
      tail(3, 17, [
        [1, 18],
        [0, 16],
      ])(p);
      blob(p, 9, 16, 6, 2.8, R, 1, 4);
      // the belly, pale
      blob(p, 9, 14.6, 4, 1.4, pal.r('pink'), 1, 2);
      blob(p, 15, 16.4, 3, 2, R, 1, 4);
      p.set(16, 17, eye).set(15, 15, c('pink', 1));
      // four paws in the air
      for (const [x, k] of [
        [5, 0],
        [8, 1],
        [11, 0],
        [13, 1],
      ] as const) {
        const up = 6 + ((k + f) % 2) * 2;
        p.line(x, 14, x + (k ? 1 : -1), up, c(coat, 3));
        p.set(x + (k ? 1 : -1), up - 1, c('pink', 2));
      }
      return outline(p, ink);
    },
    /** Giggling: up on its hind legs, mouth open, chirping (50 kHz). */
    giggle(f: number): Pixels {
      const p = new Pixels(20, 20, T);
      const y = f ? -2 : 0;
      tail(7, 18 + y, [
        [3, 19 + y],
        [1, 16 + y],
      ])(p);
      blob(p, 9, 14 + y, 4, 4.6, R, 1, 4);
      blob(p, 11, 8 + y, 3.4, 3, R, 1, 4);
      p.disc(9, 5 + y, 1.4, c('pink', 1)).disc(13, 5 + y, 1.4, c('pink', 1));
      p.set(10, 8 + y, c('ink', 0)).set(13, 8 + y, c('ink', 0));
      p.rect(11, 10 + y, 2, 1, c('pink', 2));
      p.set(7, 13 + y, c('pink', 2)).set(12, 13 + y, c('pink', 2));
      outline(p, ink);
      // chirps
      for (const [x, yy] of f
        ? [
            [16, 3],
            [18, 1],
          ]
        : [
            [16, 5],
            [17, 2],
          ])
        p.set(x, yy, c('gold', 3)).set(x + 1, yy - 1, c('gold', 2));
      return p;
    },
    /** Scampering off with a skip, happy. */
    off(f: number): Pixels {
      const p = new Pixels(20, 20, T);
      const y = f ? -3 : 0;
      tail(4, 15 + y, [[1, 12 + y]])(p);
      blob(p, 9, 14 + y, 5.6, 2.6, R, 1, 4);
      blob(p, 14.5, 13 + y, 3, 2.2, R, 1, 4);
      p.disc(13, 10.8 + y, 1.2, c('pink', 1));
      p.set(15, 12 + y, ink).set(18, 13 + y, c('pink', 2));
      p.line(6, 16 + y, 4 - f * 2, 19 + y, c('pink', 1)).line(12, 16 + y, 14 + f * 2, 19 + y, c('pink', 1));
      outline(p, ink);
      p.set(10, 6 + y, c('nose', 1))
        .set(12, 6 + y, c('nose', 1))
        .rect(10, 7 + y, 3, 1, c('nose', 1))
        .set(11, 8 + y, c('nose', 1));
      return p;
    },
  };
}

/** Checks the shapes the pin and the tickle depend on. */
export function spriteRules(mb: ReturnType<typeof buildMonsterBlocks>): void {
  const rows = (name: string) => {
    const p = mb.pics.get(name)!;
    let lo = 20;
    let hi = -1;
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++)
        if (p.get(x, y) !== T) {
          lo = Math.min(lo, y);
          hi = Math.max(hi, y);
        }
    return { lo, hi };
  };
  for (const fur of ['lab', 'wild'])
    for (const name of [`${fur}.rat0`, `${fur}.rat1`, `${fur}.tense0`, `${fur}.tense1`, 'mort.rat0', 'mort.rat1', 'mort.half0', 'mort.half1'])
      if (rows(name).lo < RAT_HIGH) throw new Error(`${name} reaches up to row ${rows(name).lo}: a tickle would touch it`);
  for (const name of ['tickle0', 'tickle1'])
    if (rows(name).hi > TICKLE_LOW) throw new Error(`${name} reaches down to row ${rows(name).hi}: it would touch a wary rat`);
  for (const fur of ['lab', 'wild'])
    for (const name of [`${fur}.pinned0`, `${fur}.pinned1`]) if (rows(name).lo > TICKLE_LOW - 2) throw new Error(`${name}'s paws are too low for a tickle`);
}

// ---------------------------------------------------------------------------------------------
// Everything that moves
// ---------------------------------------------------------------------------------------------

export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // Hazards are solid (they push Doc Leo away) and cost rapport.
  const hurt = (hp: number) => ({ chHitPt: hp, solid: 15 });

  // ---- Doc Leo's hands
  // PIN: a hand coming down flat, palm to the floor, out from his side (facing right; mirrored for the left)
  const pin = (f: number) => {
    const p = P();
    p.rect(0, 6 + f, 6, 4, c('coat', 4)).rect(0, 6 + f, 6, 1, c('coat', 3));
    blob(p, 10, 13 + f, 6, 3, pal.r('skin'), 1, 3);
    for (let k = 0; k < 4; k++) p.line(9 + k * 2, 14 + f, 11 + k * 2, 18, c('skin', 2 + (k % 2)));
    p.line(6, 15 + f, 6, 18, c('skin', 1));
    return done(p);
  };
  book.add('pin0', pin(0));
  book.add('pin1', pin(1));
  // TICKLE: fingers wiggling high, over a belly (rows 0..8 only)
  const tickle = (f: number) => {
    const p = P();
    p.rect(0, 2, 5, 4, c('coat', 4)).rect(0, 2, 5, 1, c('coat', 3));
    blob(p, 8, 4, 3.4, 2.2, pal.r('skin'), 1, 3);
    for (let k = 0; k < 4; k++) {
      const y = 1 + k * 2;
      const w = (k + f) % 2 ? 2 : 0;
      p.line(10, y + 1, 15 + w, y + (w ? 0 : 1), c('skin', 2 + (k % 2)));
    }
    p.set(18, 2 + f * 2, c('gold', 3)).set(18, 6 - f * 2, c('gold', 2));
    // keep the outline above row 9
    done(p);
    for (let y = 9; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, T);
    return p;
  };
  book.add('tickle0', tickle(0));
  book.add('tickle1', tickle(1));

  // ---- the rats
  for (const fur of ['lab', 'wild'] as Fur[]) {
    const a = ratArt(pal, fur);
    // bumping a rat that isn't playing: 22 kHz, dread (rapport down)
    book.add(`${fur}.rat0`, a.wary(0), hurt(-4));
    book.add(`${fur}.rat1`, a.wary(1), hurt(-4));
    book.add(`${fur}.tense0`, a.wary(0, true), hurt(-6));
    book.add(`${fur}.tense1`, a.wary(1, true), hurt(-6));
    book.add(`${fur}.pinned0`, a.pinned(0), { solid: 15 });
    book.add(`${fur}.pinned1`, a.pinned(1), { solid: 15 });
    // a giggling rat joins the laughing carpet when Doc Leo's hand reaches it
    book.add(`${fur}.giggle0`, a.giggle(0), { effect: 20, eamt: 1, scorePts: 100 });
    book.add(`${fur}.giggle1`, a.giggle(1), { effect: 20, eamt: 1, scorePts: 100 });
    book.add(`${fur}.off0`, a.off(0));
    book.add(`${fur}.off1`, a.off(1));
  }

  // ---- Mortimer, Dean Dour's own rat: a lab rat in a little mortarboard (kept low, like any
  // wary rat's), a red bow tie; half won over, he grins and his cap goes askew
  {
    const a = ratArt(pal, 'lab');
    const cap = (p: Pixels, tilt: number) => {
      p.rect(12, 12 + tilt, 5, 1, ink)
        .rect(13, 13, 3, 1, ink)
        .set(17, 13 + tilt, c('gold', 3))
        .set(17, 14 + tilt, c('gold', 2));
      p.set(11, 17, c('red', 2)).set(11, 18, c('red', 2)).set(12, 17, c('red', 3));
      return p;
    };
    const grin = (p: Pixels) => p.set(16, 17, ink).set(17, 17, c('pink', 2));
    book.add('mort.rat0', cap(a.wary(0), 0), hurt(-6));
    book.add('mort.rat1', cap(a.wary(1), 0), hurt(-6));
    book.add('mort.half0', grin(cap(a.wary(0, true), 1)), hurt(-6));
    book.add('mort.half1', grin(cap(a.wary(1, true), 1)), hurt(-6));
    // pinned, paws up, the mortarboard fallen off beside him
    const fallen = (p: Pixels) => p.rect(0, 18, 4, 1, ink).rect(1, 17, 2, 1, ink).set(4, 18, c('gold', 3));
    book.add('mort.pinned0', fallen(a.pinned(0)), { solid: 15 });
    book.add('mort.pinned1', fallen(a.pinned(1)), { solid: 15 });
  }

  // ---- the night janitor's floor buffer
  const buffer = (f: number) => {
    const p = P();
    p.line(4, 0, 9, 13, c('steel', 3)).line(5, 0, 10, 13, c('steel', 2)).rect(2, 0, 5, 2, c('red', 2));
    blob(p, 10, 16, 8, 3.4, pal.r('steel'), 1, 4);
    p.rect(2, 18, 16, 2, c('grey', 0));
    for (let k = 0; k < 4; k++) p.set(3 + ((k * 4 + f * 2) % 15), 19, c('paper', 2));
    p.set(15, 15, c('red', 3));
    return done(p);
  };
  book.add('buffer0', buffer(0), hurt(-8));
  book.add('buffer1', buffer(1), hurt(-8));
  // ---- Dean Dour (A: his head and the mortarboard, B: grey suit and clipboard)
  const deanA = (f: number) => {
    const p = P();
    p.rect(3, 2, 14, 2, c('ink', 1))
      .rect(7, 4, 6, 2, c('ink', 1))
      .line(16, 3, 17, 8 + f, c('gold', 2));
    blob(p, 10, 11, 4.6, 5.4, pal.r('skin'), 1, 3);
    p.rect(6, 9, 3, 2, c('glass', 1)).rect(11, 9, 3, 2, c('glass', 1)).rect(9, 9, 2, 1, c('ink', 0));
    p.set(7, 10, ink).set(12, 10, ink).line(6, 8, 9, 9, ink).line(11, 9, 14, 8, ink);
    p.line(8, 15, 12, 15, ink).set(7, 16, ink).set(13, 16, ink);
    p.rect(7, 17, 6, 3, c('grey', 1)).rect(8, 17, 4, 3, c('paper', 2)).rect(9, 18, 2, 2, c('red', 1));
    return done(p);
  };
  const deanB = (f: number) => {
    const p = P();
    // a white shirt front under the red tie, so he reads against the tower's purple stone
    p.rect(4, 0, 12, 12, c('grey', 1)).rect(7, 0, 6, 7, c('paper', 2)).rect(9, 0, 2, 8, c('red', 1)).rect(4, 0, 2, 12, c('grey', 0));
    // the clipboard
    p.rect(12, 3, 7, 8, c('wood', 2)).rect(13, 4, 5, 6, c('paper', 2)).rect(14, 5, 3, 1, ink).rect(14, 7, 3, 1, ink);
    p.rect(5, 12, 4, 6, c('grey', 0)).rect(11, 12, 4, 6, c('grey', 0));
    p.rect(4 - f, 18, 5, 2, c('ink', 1)).rect(11 + f, 18, 5, 2, c('ink', 1));
    return done(p);
  };
  // Dean Dour is solid only at his sides: Doc Leo landing on his head slides down beside him
  // (a frown or two) instead of being pushed down into the floor under him.
  const dour = { chHitPt: -8, solid: SOLLEF | SOLRIG };
  book.add('deanA0', deanA(0), dour);
  book.add('deanA1', deanA(1), dour);
  book.add('deanB0', deanB(0), dour);
  book.add('deanB1', deanB(1), dour);
  // ---- the sewer alligator (A: snout, B: tail), swimming in the channel
  const gatorA = (f: number) => {
    const p = P();
    blob(p, 8, 14, 9, 3.4, pal.r('gator'), 0, 3);
    p.rect(8, 11 - f, 12, 3, c('gator', 2)).rect(8, 14, 12, 2, c('gator', 1));
    for (let x = 10; x < 19; x += 2) p.set(x, 14 - f, c('paper', 2));
    p.disc(7, 10, 1.6, c('gator', 2))
      .set(7, 10, c('cheese', 2))
      .set(18, 11 - f, ink);
    return done(p);
  };
  const gatorB = (f: number) => {
    const p = P();
    blob(p, 12, 14, 8, 3.2, pal.r('gator'), 0, 3);
    for (let x = 2; x < 20; x += 3) p.set(x, 11 + ((x + f) % 2), c('gator', 3));
    p.line(4, 14, 0, 12 + f * 2, c('gator', 1));
    return done(p);
  };
  book.add('gatorA0', gatorA(0), hurt(-10));
  book.add('gatorA1', gatorA(1), hurt(-10));
  book.add('gatorB0', gatorB(0), hurt(-10));
  book.add('gatorB1', gatorB(1), hurt(-10));
  // ---- a little brown bat (the bat detector loves it)
  const bat = (f: number) => {
    const p = P();
    blob(p, 10, 10, 2.6, 3.4, pal.r('agouti'), 0, 2);
    p.set(9, 6, c('agouti', 1)).set(11, 6, c('agouti', 1)).set(9, 9, c('eye', 1)).set(11, 9, c('eye', 1));
    for (const s of [-1, 1]) {
      const tip = f ? 4 : 15;
      p.line(10 + s * 2, 9, 10 + s * 8, tip, c('ink', 1))
        .line(10 + s * 8, tip, 10 + s * 5, 13, c('ink', 1))
        .line(10 + s * 2, 11, 10 + s * 5, 13, c('ink', 1));
      for (let k = 3; k < 8; k++) p.line(10 + s * 2, 10, 10 + s * k, tip + (13 - tip) * ((k - 3) / 5), c('agouti', 1));
    }
    return done(p);
  };
  book.add('bat0', bat(0), { scorePts: 150 });
  book.add('bat1', bat(1), { scorePts: 150 });
  // ---- three old friends from the Bard's other songs (a hello for points)
  const loaf = (f: number) => {
    const p = P();
    p.rect(1, 17, 18, 3, c('steel', 3)).rect(1, 17, 18, 1, c('steel', 4));
    blob(p, 10, 12 - f, 7, 5, pal.r('crust'), 0, 3);
    for (const x of [7, 10, 13]) p.line(x, 8 - f, x + 1, 10 - f, c('paper', 2));
    p.set(8, 12 - f, ink)
      .set(12, 12 - f, ink)
      .rect(9, 14 - f, 3, 1, ink);
    return done(p);
  };
  book.add('loaf0', loaf(0), { scorePts: 250 });
  book.add('loaf1', loaf(1), { scorePts: 250 });
  const seed = (f: number) => {
    const p = P();
    const y = f ? 10 : 13;
    p.rect(7, y + 5, 3, 2, c('sneaker', 1)).rect(11, y + 5, 3, 2, c('sneaker', 1));
    blob(p, 10, y, 4, 4.6, pal.r('cheese'), 0, 2, 1.2);
    p.set(9, y - 1, ink)
      .set(12, y - 1, ink)
      .set(10, y + 2, ink)
      .set(11, y + 2, ink);
    p.line(11, y - 5, 12, y - 7, c('green', 2));
    return done(p);
  };
  book.add('seed0', seed(0), { scorePts: 250 });
  book.add('seed1', seed(1), { scorePts: 250 });
  const goat = (f: number) => {
    const p = P();
    for (const [x, dx] of [
      [5, 1],
      [8, -1],
      [12, 1],
      [15, -1],
    ])
      p.line(x, 14, x + (f ? dx : 0), 18, c('paper', 0));
    blob(p, 10, 11, 7, 4, pal.r('paper'), 0, 2);
    const hy = f ? 9 : 7;
    blob(p, 16, hy, 3, 2.6, pal.r('paper'), 0, 2);
    p.line(15, hy - 3, 13, hy - 6, c('stone', 2)).line(17, hy - 3, 16, hy - 6, c('stone', 2));
    p.set(17, hy, ink).line(17, hy + 3, 17, hy + 5, c('paper', 0));
    if (f) micro(p, 1, 1, 'BAA', c('gold', 3));
    return done(p);
  };
  book.add('goat0', goat(0), { scorePts: 250 });
  book.add('goat1', goat(1), { scorePts: 250 });
  // ---- a spark off a Jacob's ladder, and a pigeon in the storm
  const spark = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) {
      const a = k + f * 0.5;
      p.line(10, 10, 10 + Math.cos(a) * (3 + (k % 2) * 3), 10 + Math.sin(a) * (3 + (k % 2) * 3), c('spark', 2 + (k % 2)));
    }
    p.disc(10, 10, 1.4, c('paint', 1));
    return p;
  };
  book.add('spark0', spark(0), { chHitPt: -5 });
  book.add('spark1', spark(1), { chHitPt: -5 });
  const pigeon = (f: number) => {
    const p = P();
    blob(p, 10, 11, 5, 2.8, pal.r('grey'), 1, 3);
    blob(p, 15, 8, 2.4, 2.2, pal.r('grey'), 2, 3);
    p.rect(17, 8, 2, 1, c('wood', 2)).set(15, 7, c('nose', 1)).line(4, 11, 1, 12, c('grey', 1));
    p.set(13, 10, c('purple', 2)).set(14, 11, c('tie', 2));
    if (f) for (let k = 0; k < 6; k++) p.line(7 + k, 10, 5 + k, 3 + k / 3, c('grey', k > 3 ? 1 : 2));
    else for (let k = 0; k < 6; k++) p.line(7 + k, 12, 5 + k, 18 - k / 3, c('grey', k > 3 ? 1 : 2));
    return done(p);
  };
  book.add('pigeon0', pigeon(0), hurt(-5));
  book.add('pigeon1', pigeon(1), hurt(-5));
  // (last, so every other block keeps its number) the bat and the old friends flying off: the
  // same pictures, worth nothing, so brushing past them as they go doesn't score every tick
  for (const [name, art] of [
    ['bat', bat],
    ['loaf', loaf],
    ['seed', seed],
    ['goat', goat],
  ] as const) {
    book.add(`${name}Off0`, art(0));
    book.add(`${name}Off1`, art(1));
  }
  return book;
}
