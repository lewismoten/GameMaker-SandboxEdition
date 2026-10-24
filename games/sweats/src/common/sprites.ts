// POET.CBL, and the sprites every group's .MBL starts with. The poet is Will, The Hive's
// open-mic regular, dressed for the part from the waist up and for the couch from the waist
// down: a bald dome with a fringe of brown hair, a pointed beard, a gold earring, a starched
// white ruff, a velvet doublet with gold buttons, grey sweatpants and fuzzy slippers. The common
// monster sprites: his word balloons ("ALAS!" and "FORSOOTH!" in gold on parchment) and the
// friends who turn up all evening: Teddy and Gwinn asleep, Carl the fly, the third goat from the
// left, and Doc Leo (fedora, navy corduroy, purple shirt, teal tie, red sneakers) walking his
// rubber chicken on its leash. Every sprite is drawn from shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { SOLBOT, SOLLEF, SOLRIG } from '../../../../web/src/formats/blocks';

export { T, outline, makeBook };
export type SpriteBook = ReturnType<typeof makeBook>;

export interface PoetPose {
  /** front: to you; side: walking right (mirror for left). */
  face: 'front' | 'side';
  /** Walk cycle (0..3); legs apart on 1 and 3. */
  step?: number;
  mood?: 'calm' | 'blink' | 'worry' | 'ouch' | 'shout' | 'swoon' | 'smug';
  /** Arms: down, up (a hop), heart (a hand on it, the other flung out), raise (one fist up), yorick (a coffee cup held up like a skull), bow, clutch (his head). */
  arms?: 'down' | 'up' | 'heart' | 'raise' | 'yorick' | 'bow' | 'clutch';
  crouch?: boolean;
  /** Fainted flat on the floor (0 standing .. 1 lying). */
  faint?: number;
}

/** The poet, in the pal's common ramps. */
export function poetArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  /** Walking right, in profile: he faces the way he goes (mirror for left). */
  const profile = (o: PoetPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const cr = o.crouch ? 2 : 0;
    const step = o.step ?? 0;
    const arms = o.arms ?? 'down';
    const mood = o.mood ?? 'calm';
    // legs: the far one first (a shade darker), then the near one; slippers point the way he goes
    const stride = step === 1 ? 3 : step === 3 ? -3 : 0;
    const leg = (dx: number, k: number) => {
      for (let y = 13 + cr; y < 18; y++) p.rect(9 + Math.round(((y - 13) / 5) * dx), y, 3, 1, c('sweats', k));
      const fx = 9 + dx;
      p.rect(fx, 18, 5, 2, c('pink', k === 2 ? 1 : 0)).set(fx + 4, 19, c('pink', 2));
    };
    leg(-stride, 1);
    leg(stride, 2);
    // the seat of the sweatpants, the waistband
    p.rect(7, 12 + cr, 6, 2, c('sweats', 2)).rect(7, 12 + cr, 6, 1, c('white', 0));
    // the doublet, its front edge and buttons
    for (let y = 8 + cr; y < 12 + cr; y++) p.rect(7, y, 6, 1, c('velvet', y === 8 + cr ? 3 : 2));
    p.rect(7, 8 + cr, 1, 4, c('velvet', 1));
    for (let y = 9 + cr; y < 12 + cr; y += 2) p.set(12, y, c('gold', 2));
    // the head in profile: bald dome, the fringe at the back, the ear and its earring, the nose, the beard
    const hx = 10.5;
    const hy = 3.5 + cr;
    blob(p, hx, hy, 3.4, 3.4, pal.r('skin'), 1, 4);
    p.set(10, hy - 3, c('skin', 4)).set(11, hy - 3, c('skin', 4));
    for (let y = Math.round(hy) - 1; y <= Math.round(hy) + 2; y++) p.set(7, y, c('hair', 1)).set(8, y, c('hair', y % 2 ? 2 : 1));
    p.set(9, Math.round(hy) + 1, c('skin', 1)).set(9, Math.round(hy) + 3, c('gold', 3));
    const ey = Math.round(hy);
    if (mood === 'blink' || mood === 'swoon') p.set(12, ey, ink).set(13, ey, ink);
    else p.set(12, ey, ink).set(12, ey - 1, mood === 'worry' || mood === 'shout' ? ink : c('white', 2));
    p.set(14, ey + 1, c('skin', 2)).set(14, ey, c('skin', 3));
    p.set(12, ey + 2, c('hair', 0)).set(13, ey + 2, c('hair', 0));
    if (mood === 'shout') p.set(13, ey + 3, ink);
    p.set(12, ey + 3, c('hair', 1)).set(13, ey + 4, c('hair', 0));
    // the ruff, seen from the side: a starched wheel sticking out front and back
    const ry = 7 + cr;
    for (let x = 5; x <= 15; x++) {
      const up = x % 2;
      p.set(x, ry + up, c('white', up ? 1 : 2)).set(x, ry + 1 - up, c('white', 2));
    }
    // the near arm, swinging against the near leg (up for a hop, out ahead when sneaking)
    const sleeve = c('velvet', 2);
    const hand = c('skin', 2);
    const sy = 9 + cr;
    const swing = arms === 'up' ? [12, sy - 7] : o.crouch ? [14, sy + 1] : step === 1 ? [7, sy + 3] : step === 3 ? [13, sy + 3] : [10, sy + 4];
    p.line(10, sy, swing[0], swing[1], sleeve).line(9, sy, swing[0] - 1, swing[1], c('velvet', 1));
    p.set(swing[0], swing[1], hand).set(swing[0], swing[1] + (arms === 'up' ? -1 : 1), hand);
    return outline(p, ink);
  };

  const body = (o: PoetPose): Pixels => {
    if (o.face === 'side') return profile(o);
    const p = new Pixels(20, 20, T);
    const side = (o.face as string) === 'side';
    const cr = o.crouch ? 2 : 0;
    const bow = o.arms === 'bow' ? 3 : 0;
    const step = o.step ?? 0;
    const arms = o.arms ?? 'down';
    const mood = o.mood ?? 'calm';
    // sweatpants (baggy, a darker crease) and fuzzy slippers
    const legs =
      side && step % 2
        ? [
            [7, -2],
            [12, 2],
          ]
        : [
            [7, 0],
            [12, 0],
          ];
    for (const [lx, d] of legs) {
      for (let y = 13 + cr; y < 18; y++) p.rect(lx + Math.round(((y - 13) / 5) * d) - 2, y, 4, 1, c('sweats', y % 4 === 0 ? 1 : 2));
      p.rect(lx + d - 2, 18, 5, 2, c('pink', 1))
        .set(lx + d - 2, 18, c('pink', 2))
        .set(lx + d + 2, 19, c('pink', 0));
    }
    p.rect(5, 12 + cr, 10, 2, c('sweats', 2)).rect(9, 12 + cr, 1, 2, c('white', 0));
    // the velvet doublet with its gold buttons
    for (let y = 8 + cr; y < 13 + cr; y++) p.rect(5, y, 10, 1, c('velvet', y === 8 + cr ? 3 : 2));
    p.rect(5, 8 + cr, 1, 5, c('velvet', 1)).rect(14, 8 + cr, 1, 5, c('velvet', 1));
    for (let y = 9 + cr; y < 13 + cr; y += 2) p.set(side ? 12 : 10, y, c('gold', 2));
    // the head: a bald dome, a fringe of hair over the ears, a pointed beard, an earring
    const hx = (side ? 11 : 10) + (bow ? 2 : 0);
    const hy = 3 + cr + bow;
    blob(p, hx, hy, 3.6, 3.6, pal.r('skin'), 1, 4);
    p.set(hx - 1, hy - 3, c('skin', 4)).set(hx, hy - 3, c('skin', 4));
    for (const sx of side ? [hx - 3, hx - 4] : [hx - 4, hx - 3, hx + 3, hx + 4])
      for (let y = hy - 1; y <= hy + 2; y++) p.set(sx, y, c('hair', (sx + y) % 2 ? 1 : 2));
    if (!side) p.set(hx - 4, hy + 2, c('gold', 3));
    else p.set(hx - 2, hy + 2, c('gold', 3));
    const eyes = side ? [hx + 1, hx + 3] : [hx - 2, hx + 1];
    for (const ex of eyes) {
      if (mood === 'blink' || mood === 'swoon' || mood === 'smug') p.set(ex, hy, ink).set(ex + 1, hy, ink);
      else if (mood === 'ouch') p.set(ex, hy - 1, ink).set(ex + 1, hy, ink);
      else p.set(ex, hy, ink).set(ex, hy - 1, mood === 'worry' || mood === 'shout' ? ink : c('white', 2));
    }
    const mx = side ? hx + 2 : hx;
    // the moustache and beard
    p.set(mx - 1, hy + 2, c('hair', 0))
      .set(mx + 1, hy + 2, c('hair', 0))
      .set(mx, hy + 2, c('hair', 0));
    if (mood === 'shout' || mood === 'ouch') p.rect(mx - 1, hy + 3, 2, 1, ink).set(mx, hy + 3, c('red', 2));
    else if (mood === 'smug') p.set(mx + 1, hy + 3, ink);
    p.set(mx, hy + 4, c('hair', 1)).set(mx, hy + 5, c('hair', 0));
    // the ruff: a starched white wheel round the neck
    const ry = 7 + cr + bow;
    for (let x = 4; x <= 15; x++) {
      const up = (x - 4) % 2 === 0 ? 0 : 1;
      p.set(x + (bow ? 1 : 0), ry + up, c('white', up ? 1 : 2)).set(x + (bow ? 1 : 0), ry + 1 - up, c('white', 2));
    }
    if (!side) p.set(mx, hy + 4, c('hair', 1));
    // arms in the velvet sleeves, hands bare
    const sleeve = c('velvet', 2);
    const hand = c('skin', 2);
    const arm = (x0: number, y0: number, x1: number, y1: number) => {
      p.line(x0, y0, x1, y1, sleeve).line(x0 + 1, y0, x1 + 1, y1, c('velvet', 1));
      p.set(x1, y1, hand).set(x1 + 1, y1, hand);
    };
    const sy = 9 + cr;
    if (arms === 'down') (arm(3, sy, 3, sy + 4), arm(15, sy, 16, sy + 4));
    if (arms === 'up') (arm(3, sy, 1, sy - 6), arm(15, sy, 17, sy - 6));
    if (arms === 'heart') (arm(14, sy, 18, sy - 3), p.rect(7, sy + 1, 3, 2, hand));
    if (arms === 'raise') (arm(3, sy, 3, sy + 4), arm(15, sy, 17, sy - 8), p.disc(17.5, sy - 9, 1.3, hand));
    if (arms === 'yorick') {
      arm(3, sy, 3, sy + 4);
      arm(15, sy, 17, sy - 5);
      // the coffee cup held up and contemplated: to drink, or not to drink
      p.rect(15, sy - 10, 5, 5, c('white', 2))
        .rect(15, sy - 10, 5, 1, c('coffee', 2))
        .set(19, sy - 8, c('white', 0));
      p.set(16, sy - 12, c('white', 1)).set(17, sy - 13, c('white', 1));
    }
    if (arms === 'bow') (arm(4, sy + 2, 2, sy + 6), arm(15, sy + 2, 12, sy + 4));
    if (arms === 'clutch') (arm(3, sy, hx - 4, hy - 1), arm(15, sy, hx + 4, hy - 1));
    if (o.faint) {
      const src = p.px.slice();
      p.px.fill(T);
      const a = (o.faint * Math.PI) / 2;
      let low = 0;
      const out: [number, number, number][] = [];
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const dx = x - 10;
          const dy = y - 10;
          const sx = Math.round(10 + dx * Math.cos(a) + dy * Math.sin(a));
          const sy2 = Math.round(10 - dx * Math.sin(a) + dy * Math.cos(a));
          if (sx < 0 || sy2 < 0 || sx >= 20 || sy2 >= 20) continue;
          const v = src[sy2 * 20 + sx];
          if (v === T) continue;
          out.push([x, y, v]);
          low = Math.max(low, y);
        }
      for (const [x, y, v] of out) p.set(x, y + 19 - low, v);
    }
    return outline(p, ink);
  };
  return { body };
}

/** The poet's poses. */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const a = poetArt(pal);
  book.add('front', a.body({ face: 'front' }));
  book.add('blink', a.body({ face: 'front', mood: 'blink' }));
  book.add('smug', a.body({ face: 'front', mood: 'smug', arms: 'heart' }));
  for (let s = 0; s < 4; s++) book.add(`walk${s}`, a.body({ face: 'side', step: s }));
  book.add('hop', a.body({ face: 'front', arms: 'up', mood: 'worry' }));
  book.add('hopSide', a.body({ face: 'side', arms: 'up', step: 1, mood: 'worry' }));
  book.add('sneak0', a.body({ face: 'side', crouch: true, step: 0, mood: 'worry' }));
  book.add('sneak1', a.body({ face: 'side', crouch: true, step: 1, mood: 'worry' }));
  book.add('declaim0', a.body({ face: 'front', arms: 'heart', mood: 'swoon' }));
  book.add('declaim1', a.body({ face: 'front', arms: 'raise', mood: 'shout' }));
  book.add('yorick', a.body({ face: 'front', arms: 'yorick', mood: 'calm' }));
  book.add('hurt', a.body({ face: 'front', arms: 'clutch', mood: 'ouch' }));
  book.add('faint0', a.body({ face: 'front', arms: 'heart', mood: 'swoon', faint: 0.4 }));
  book.add('faint1', a.body({ face: 'front', arms: 'heart', mood: 'swoon', faint: 1 }));
  book.add('bow', a.body({ face: 'front', arms: 'bow', mood: 'blink' }));
  return book;
}

/**
 * Hurting things are solid (they push him away) and cost composure. Not SOLTOP: on a monster
 * that is the side that pushes the hero under it (PLAYGAME's ChkMonChr), into the floor; SOLBOT
 * still lets him stand on one.
 */
export const hurts = (hp: number, solid = SOLBOT | SOLLEF | SOLRIG) => ({ chHitPt: hp, solid });
/**
 * Solid only at the sides, for a foe he could land on (hurts(hp, SIDES)): PLAYGAME pushes a hero
 * on a monster's top past it without checking walls, down into the floor under it, so this one
 * pushes only sideways and he slides down beside it.
 */
export const SIDES = SOLLEF | SOLRIG;
/** A friend's hello: a tip (money, so it never plays the score sound: that one is the opening line). */
export const hello = { effect: 3, eamt: 1 };

/** A dot-eyed face at (x, y) for things come to life. */
export function face(p: Pixels, pal: Pal, x: number, y: number, o: { wink?: boolean; grin?: boolean; angry?: boolean; sad?: boolean } = {}): void {
  const ink = pal.c('ink', 0);
  p.set(x - 2, y, ink).set(x + 2, y, o.wink ? pal.c('white', 2) : ink);
  if (o.wink) p.set(x + 1, y, ink).set(x + 3, y, ink);
  if (o.angry)
    p.set(x - 3, y - 2, ink)
      .set(x - 2, y - 1, ink)
      .set(x + 3, y - 2, ink)
      .set(x + 2, y - 1, ink);
  if (o.sad) p.set(x - 3, y - 1, ink).set(x + 3, y - 1, ink);
  if (o.grin)
    p.set(x - 2, y + 2, ink)
      .set(x - 1, y + 3, ink)
      .set(x, y + 3, ink)
      .set(x + 1, y + 3, ink)
      .set(x + 2, y + 2, ink);
  else if (o.sad)
    p.set(x - 2, y + 3, ink)
      .set(x - 1, y + 2, ink)
      .set(x, y + 2, ink)
      .set(x + 1, y + 2, ink)
      .set(x + 2, y + 3, ink);
  else
    p.set(x - 1, y + 2, ink)
      .set(x, y + 2, ink)
      .set(x + 1, y + 2, ink);
}

/** The sprites every .MBL starts with (in this order, so every group's monster file agrees). */
export function commonSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // the word balloons: a scroll of parchment with a word on it, a tail toward the poet
  const balloon = (word: string, f: number, left: boolean) => {
    const p = P();
    const y = 5 + f;
    // the whole block wide: a four-letter word takes 15 pixels and needs a gap either side
    p.rect(0, y, 20, 9, c('paper', 1)).rect(1, y + 1, 18, 7, c('paper', 2));
    p.rect(0, y, 1, 9, c('paper', 0)).rect(19, y, 1, 9, c('paper', 0));
    const tx = left ? 15 : 4;
    p.set(tx, y + 9, c('paper', 1)).set(tx + (left ? 1 : -1), y + 10, c('paper', 1));
    micro(p, 10 - Math.floor((word.length * 4 - 1) / 2), y + 2, word, c('velvet', 1));
    return done(p);
  };
  book.add('wordR0', balloon('ALAS', 0, false));
  book.add('wordR1', balloon('ALAS', 1, false));
  book.add('wordL0', balloon('HARK', 0, true));
  book.add('wordL1', balloon('HARK', 1, true));
  const burst = (f: number) => {
    const p = P();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + f * 0.4;
      for (let r = 3 + f * 2; r < 7 + f * 3; r++) p.set(10 + Math.cos(a) * r, 10 + Math.sin(a) * r, c(k % 2 ? 'gold' : 'paper', 2));
    }
    return p;
  };
  book.add('burst0', burst(0));
  book.add('burst1', burst(1));
  // Teddy and Gwinn, curled up asleep, breathing
  const dogAsleep = (f: number, fur: string, chest: string, collar?: string) => {
    const p = P();
    blob(p, 10, 15, 8.6, 4 + f * 0.4, pal.r(fur), 0, 3);
    blob(p, 6, 13, 3.4, 2.8, pal.r(fur), 1, 3);
    // Teddy's ears stand up, a matched pair; Gwinn's flop
    p.line(4, 10, 3, fur === 'fur' ? 7 : 8, c(fur, 2)).line(7, 10, 8, 7, c(fur, 2));
    blob(p, 7, 15, 2.2, 1.6, pal.r(chest), 1, 2);
    p.set(4, 13, ink).set(7, 13, ink).set(2, 14, ink);
    if (collar) p.rect(5, 15, 4, 1, c(collar, 2));
    micro(p, 13, 2 - f, 'z', c('white', 2));
    return done(p);
  };
  book.add('teddy0', dogAsleep(0, 'fur', 'white'), hurts(0));
  book.add('teddy1', dogAsleep(1, 'fur', 'white'), hurts(0));
  book.add('gwinn0', dogAsleep(0, 'liver', 'liver', 'pink'), hurts(0));
  book.add('gwinn1', dogAsleep(1, 'liver', 'liver', 'pink'), hurts(0));
  // Carl: a fat fly with big red eyes and blurred wings
  const carl = (f: number) => {
    const p = P();
    blob(p, 10, 11, 4.5, 3.4, pal.r('fly'), 0, 2);
    p.disc(13.5, 9.5, 1.8, c('red', 2)).set(14, 9, c('white', 2));
    const wy = f ? 4 : 6;
    for (const [x0, x1] of [
      [6, 9],
      [10, 13],
    ])
      p.line(x0, wy, x1, 8, c('white', 1)).line(x0, wy + 1, x1, 8, c('white', 0));
    for (const x of [8, 10, 12]) p.line(x, 14, x - 1 + (f ? 1 : 0), 16, ink);
    return done(p);
  };
  book.add('carl0', carl(0), hello);
  book.add('carl1', carl(1), hello);
  // the third goat from the left, chewing
  const goat = (f: number) => {
    const p = P();
    for (const x of [6, 9, 13, 16]) p.rect(x, 14, 1, 5, c('grey', 1));
    blob(p, 11, 11, 6.5, 3.8, pal.r('grey'), 2, 3);
    blob(p, 4.5, 8 + f * 0.5, 2.8, 2.6, pal.r('grey'), 2, 3);
    p.line(3, 5, 1, 3, c('grey', 1)).line(5, 5, 6, 2, c('grey', 1));
    p.set(4, 8, ink)
      .set(2, 10 + f, c('grey', 1))
      .set(3, 11 + f, c('grey', 1));
    p.line(17, 9, 19, 8, c('grey', 2));
    return done(p);
  };
  book.add('goat0', goat(0), hello);
  book.add('goat1', goat(1), hello);
  // Doc Leo, hobo clown: grey fedora, painted stubble, his own nose sunburned, navy corduroy, purple shirt, teal tie,
  // red sneakers, and the rubber chicken on its leash. Side on, walking right (mirrored for
  // left), the chicken trotting behind; f 0 is a stride, f 1 the legs passing.
  const leo = (f: number) => {
    const p = P();
    // the rubber chicken behind him, facing the way he goes, on its leash from his hand
    blob(p, 3.5, 17, 2.6, 1.7, pal.r('yellow'), 0, 2);
    p.rect(5, 14 + f, 2, 2, c('yellow', 2))
      .set(7, 15 + f, c('red', 3))
      .set(5, 13 + f, c('red', 2))
      .set(6, 14 + f, ink);
    p.line(4, 19, 3 + f, 19, c('red', 2)).line(8, 12, 6, 14 + f, c('red', 1));
    // legs: the far one a shade darker; red sneakers pointing ahead
    const stride = f ? 0 : 2;
    const leg = (dx: number, k: number) => {
      for (let y = 14; y < 18; y++) p.rect(10 + Math.round(((y - 13) / 5) * dx), y, 2, 1, c('navy', k));
      p.rect(10 + dx, 18, 4, 2, c('red', k + 1));
    };
    leg(-stride, 0);
    leg(stride, 1);
    // the corduroy jacket, the purple shirt and teal tie showing at the front
    p.rect(8, 8, 6, 6, c('navy', 2)).rect(8, 8, 1, 6, c('navy', 1));
    p.rect(13, 8, 1, 5, c('purple', 2)).rect(13, 9, 1, 3, c('teal', 2));
    // the near arm, back to the leash
    p.line(10, 9, 8, 12, c('navy', 1)).set(8, 12, c('skin', 3));
    // the head in profile: painted stubble, white mouth, his own sunburned nose out front, one eye in white paint
    blob(p, 11, 4.5, 3, 3, pal.r('skin'), 2, 4);
    p.rect(10, 6, 4, 2, c('grey', 0)).set(12, 5, c('grey', 0)).set(13, 6, c('white', 2));
    p.set(13, 3, c('white', 2)).set(12, 2, c('white', 2));
    p.set(14, 4, c('pink', 1)).set(15, 4, c('pink', 1)).set(14, 5, c('pink', 0)).set(12, 3, ink).set(9, 4, c('skin', 1));
    // the fedora, side on: crown and brim
    p.rect(8, 0, 6, 2, c('grey', 2)).rect(7, 2, 9, 1, c('grey', 1)).rect(8, 1, 6, 1, c('grey', 0));
    return done(p);
  };
  book.add('leo0', leo(0), hello);
  book.add('leo1', leo(1), hello);
  // the friends going on their way after a hello (no second tip as they pass him)
  book.add('carlAway0', carl(0));
  book.add('carlAway1', carl(1));
  book.add('goatAway0', goat(0));
  book.add('goatAway1', goat(1));
  book.add('leoAway0', leo(0));
  book.add('leoAway1', leo(1));
}

/**
 * Every sprite that costs composure gets a pale parchment rim outside its dark outline (paper
 * keeps its light in every scene), so a thrown plate, an ant or a raindrop reads on any set's
 * backdrop, and danger looks the same all evening.
 */
export function rimFoes(mb: SpriteBook, pal: Pal): void {
  for (const [name, i] of mb.index) {
    if (!(mb.blocks[i].chHitPt < 0)) continue;
    const pic = outline(mb.pics.get(name)!.crop(0, 0, 20, 20), pal.c('paper', 2));
    mb.pics.set(name, pic);
    mb.blocks[i].pixels = Uint8Array.from(pic.px);
  }
}
