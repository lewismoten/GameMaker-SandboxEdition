// MARCUS.CBL, FELIX.CBL and RISI.MBL: Marcus Iocundus the poet (curly dark hair, a white toga
// with a narrow purple stripe, sandals, a wax tablet of jokes), Felix, the cat (grey tabby, a
// white chest, very brave), and everything else that moves: the jokes he tells ("HA!"), Rufus's
// clouds, Lady Flavia behind her fan, Teddy and Gwinn as good Roman dogs (red collars with a
// golden bulla; Gwinn's is pink), a slave with figs, mice (one with its cheese), ants, the
// meow, the Gaulish horde, arrows, a crow, the wise man's spells, pigeons, the wise man, Doc
// Leo twice (a philosopher in a navy cloak with a rubber chicken on a leash; the theater's
// jester), the diva's golden notes, the mice who cheer at the baths, scalding bubbles, a
// floating senator, the stone-faced audience and the same faces laughing, cabbages, Emperor
// Gravis (two blocks tall, four stages from stern to helpless laughter), his decrees, and the
// laurel crown. Every sprite is drawn from shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { SOLBOT, SOLLEF, SOLRIG } from '../../../../web/src/formats/blocks';
import { CHEESE, CROWN, LAUGHS } from '../ids';

export { T, outline };

export interface ManPose {
  /** front: to you; side: walking right (mirror for left); back: away from you (climbing). */
  face: 'front' | 'side' | 'back';
  /** Walk cycle (0..3); legs apart on 1 and 3. */
  step?: number;
  mood?: 'calm' | 'blink' | 'worry' | 'ouch' | 'shout' | 'swoon' | 'bliss' | 'laugh';
  /** Arms: down, up (a hop), chest (a hand on his heart, declaiming), orate (an arm flung out), gut, joke (hand to mouth), toss (forward). */
  arms?: 'down' | 'up' | 'chest' | 'orate' | 'gut' | 'joke' | 'toss';
  crouch?: boolean;
  sweat?: number;
  /** Fainted flat on the floor (0 standing .. 1 lying). */
  faint?: number;
}

/** Tips a sprite over about its middle and settles it onto the floor (fainting). */
function tipOver(p: Pixels, t: number): void {
  const src = p.px.slice();
  p.px.fill(T);
  const a = (t * Math.PI) / 2;
  let low = 0;
  const out: [number, number, number][] = [];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = x - 10;
      const dy = y - 10;
      const sx = Math.round(10 + dx * Math.cos(a) + dy * Math.sin(a));
      const sy = Math.round(10 - dx * Math.sin(a) + dy * Math.cos(a));
      if (sx < 0 || sy < 0 || sx >= 20 || sy >= 20) continue;
      const v = src[sy * 20 + sx];
      if (v === T) continue;
      out.push([x, y, v]);
      low = Math.max(low, y);
    }
  for (const [x, y, v] of out) p.set(x, y + 19 - low, v);
}

/** Marcus's look, in the pal's ramps. */
export function marcusArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const body = (o: ManPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const side = o.face === 'side';
    const crouch = o.crouch ? 2 : 0;
    const step = o.step ?? 0;
    const arms = o.arms ?? 'down';
    const mood = o.mood ?? 'calm';
    // bare shins and sandals under the toga's hem
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
      for (let y = 16 + crouch; y < 19; y++) p.rect(lx + Math.round(((y - 16) / 3) * d) - 1, y, 2, 1, c('skin', 2));
      p.rect(lx + d - 2, 19, 4 + (side ? 1 : 0), 1, c('wood', 2)).set(lx + d - 1, 18, c('wood', 1));
    }
    // the toga: wrapped from the left shoulder, a narrow purple stripe along its edge
    for (let y = 8 + crouch; y < 17 + crouch; y++) {
      const w = y < 10 + crouch ? 9 : 11;
      p.rect(10 - Math.floor(w / 2), y, w, 1, c('toga', (y + (side ? 1 : 0)) % 3 ? 2 : 1));
    }
    for (let k = 0; k < 9; k++) p.set(side ? 13 - k : 6 + k, 8 + crouch + k, c('toga', 3)).set(side ? 12 - k : 7 + k, 9 + crouch + k, c('purple', 1));
    p.rect(5, 16 + crouch, 11, 1, c('purple', 1));
    // the head: curly dark hair
    const hx = side ? 11 : 10;
    const hy = 4 + crouch;
    blob(p, hx + 0.5, hy + 0.5, 3.8, 3.8, pal.r('skin'), 1, 4);
    // from behind: the curls cover his head, his ears either side, no face
    const back = o.face === 'back';
    if (back)
      blob(p, hx + 0.5, hy, 3.6, 3.4, pal.r('hair'), 0, 2)
        .set(hx - 3, hy + 1, c('skin', 2))
        .set(hx + 4, hy + 1, c('skin', 2));
    for (const [cx, cy] of [
      [-3, -3],
      [-1, -4],
      [1, -4],
      [3, -3],
      [4, -1],
      [-4, -1],
    ])
      if (!(side && cx > 2)) p.disc(hx + cx, hy + cy, 1.3, c('hair', (cx + cy) % 2 ? 1 : 2));
    if (side) p.disc(hx - 3, hy, 1.4, c('hair', 1));
    const ey = hy;
    const eyes = back ? [] : side ? [hx + 2] : [hx - 1, hx + 2];
    for (const ex of eyes) {
      if (mood === 'blink' || mood === 'bliss' || mood === 'swoon' || mood === 'laugh') p.set(ex - 1, ey, ink).set(ex, ey, ink);
      else if (mood === 'ouch') p.set(ex - 1, ey - 1, ink).set(ex, ey, ink);
      else p.set(ex, ey, ink).set(ex, ey - 1, mood === 'worry' ? ink : c('toga', 3));
    }
    const mx = side ? hx + 2 : hx + 0.5;
    if (back) {
      // no mouth to show
    } else if (mood === 'shout' || mood === 'ouch' || mood === 'laugh') p.rect(Math.round(mx) - 1, hy + 2, 3, 2, ink).set(Math.round(mx), hy + 3, c('red', 2));
    else if (mood === 'worry')
      p.set(mx - 1, hy + 3, ink)
        .set(mx, hy + 2, ink)
        .set(mx + 1, hy + 3, ink);
    else
      p.set(mx - 1, hy + 2, ink)
        .set(mx, hy + 3, ink)
        .set(mx + 1, hy + 2, ink);
    // arms (bare forearms out of the toga)
    const skin = c('skin', 2);
    const arm = (x0: number, y0: number, x1: number, y1: number) => p.line(x0, y0, x1, y1, skin).line(x0 + 1, y0, x1 + 1, y1, c('skin', 1));
    const sy = 9 + crouch;
    if (arms === 'down') (arm(5, sy, 4, sy + 5), arm(15, sy, 16, sy + 5));
    if (arms === 'up') (arm(5, sy, 2, sy - 6), arm(15, sy, 17, sy - 6));
    if (arms === 'chest') (arm(5, sy, 4, sy + 5), arm(15, sy, 11, sy + 2));
    if (arms === 'orate') (arm(5, sy, 4, sy + 5), arm(15, sy, 18, sy - 5));
    if (arms === 'gut') (arm(5, sy, 8, sy + 4), arm(15, sy, 12, sy + 4));
    if (arms === 'joke') (arm(5, sy, 3, sy + 4), arm(14, sy, 14, hy + 3), p.rect(3, sy + 3, 3, 4, c('wood', 2)).rect(4, sy + 4, 1, 2, c('ochre', 1)));
    if (arms === 'toss') (arm(5, sy, 3, sy + 4), arm(15, sy, 19, sy - 2));
    for (let k = 0; k < (o.sweat ?? 0); k++) {
      const [x, y] = [
        [3, 3],
        [17, 5],
        [2, 9],
        [18, 1],
      ][k % 4];
      p.set(x, y, c('water', 4)).set(x, y + 1, c('water', 2));
    }
    if (o.faint) tipOver(p, o.faint);
    return outline(p, ink);
  };
  return { body };
}

/** Marcus's poses. */
export function buildMarcusBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const a = marcusArt(pal);
  book.add('front', a.body({ face: 'front' }));
  book.add('blink', a.body({ face: 'front', mood: 'blink' }));
  book.add('worry', a.body({ face: 'front', mood: 'worry', arms: 'gut', sweat: 2 }));
  for (let s = 0; s < 4; s++) book.add(`walk${s}`, a.body({ face: 'side', step: s }));
  // Up hops, and on a ladder climbs: his back, arms up
  book.add('hop', a.body({ face: 'back', arms: 'up' }));
  book.add('hopSide', a.body({ face: 'side', arms: 'up', step: 1, mood: 'worry' }));
  book.add('sneak0', a.body({ face: 'side', crouch: true, step: 0, mood: 'worry' }));
  book.add('sneak1', a.body({ face: 'side', crouch: true, step: 1, mood: 'worry' }));
  book.add('sing0', a.body({ face: 'front', arms: 'chest', mood: 'swoon' }));
  book.add('sing1', a.body({ face: 'front', arms: 'orate', mood: 'shout', sweat: 1 }));
  book.add('hurt', a.body({ face: 'front', arms: 'gut', mood: 'ouch', sweat: 4 }));
  book.add('faint0', a.body({ face: 'front', arms: 'chest', mood: 'swoon', sweat: 2, faint: 0.4 }));
  book.add('faint1', a.body({ face: 'front', arms: 'chest', mood: 'swoon', sweat: 2, faint: 1 }));
  book.add('joke0', a.body({ face: 'side', arms: 'joke', mood: 'calm' }));
  book.add('joke1', a.body({ face: 'side', arms: 'toss', mood: 'laugh' }));
  book.add('bliss', a.body({ face: 'front', mood: 'bliss', arms: 'orate' }));
  return book;
}

export interface CatPose {
  face: 'front' | 'side';
  step?: number;
  mood?: 'calm' | 'blink' | 'ouch' | 'yowl' | 'bliss';
  /** Crouched to stalk, or leaping. */
  crouch?: boolean;
  leap?: boolean;
  faint?: number;
}

/** Felix's look: a grey tabby with a white chest and green eyes. */
export function felixArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const body = (o: CatPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const mood = o.mood ?? 'calm';
    const fur = pal.r('cat');
    if (o.face === 'front') {
      // sitting up, tail curled round the paws
      blob(p, 10, 14, 5.6, 5.4, fur, 1, 3);
      blob(p, 10, 15, 2.6, 3.4, pal.r('marble'), 2, 3);
      p.rect(6, 18, 3, 2, c('marble', 3)).rect(11, 18, 3, 2, c('marble', 3));
      p.line(15, 18, 18, 15, c('cat', 2)).line(18, 15, 17, 12, c('cat', 2));
      blob(p, 10, 6, 4.6, 4, fur, 1, 3);
      p.line(6, 4, 6, 0, c('cat', 2)).line(7, 3, 8, 1, c('cat', 2)).line(14, 4, 14, 0, c('cat', 2)).line(13, 3, 12, 1, c('cat', 2));
      for (let k = 0; k < 3; k++) p.set(9 + k, 3, c('cat', 0));
      const eye = mood === 'blink' || mood === 'bliss' ? c('cat', 0) : c('laurel', 3);
      p.set(8, 6, eye)
        .set(12, 6, eye)
        .set(8, 5, mood === 'calm' ? ink : eye);
      p.set(10, 8, c('red', 3));
      if (mood === 'yowl' || mood === 'ouch') p.rect(9, 9, 3, 2, ink);
      else p.set(9, 9, ink).set(11, 9, ink);
      for (const s of [-1, 1]) p.line(10 + s * 3, 8, 10 + s * 7, 7, c('marble', 3));
    } else {
      const crouch = o.crouch ? 2 : 0;
      const lift = o.leap ? -2 : 0;
      const step = o.step ?? 0;
      blob(p, 9, 13 + crouch + lift, 7, 3.6 - crouch / 2, fur, 1, 3);
      for (let k = 0; k < 4; k++) p.line(5 + k * 3, 10 + crouch + lift, 6 + k * 3, 15 + crouch + lift, c('cat', 0));
      // legs
      const legs = o.leap
        ? [
            [4, -3],
            [6, -2],
            [12, 3],
            [14, 3],
          ]
        : step % 2
          ? [
              [4, -1],
              [7, 1],
              [12, -1],
              [14, 1],
            ]
          : [
              [4, 0],
              [7, 0],
              [12, 0],
              [14, 0],
            ];
      for (const [lx, d] of legs) p.line(lx, 15 + crouch + lift, lx + d, 19, c('cat', 1)).set(lx + d, 19, c('marble', 3));
      // the tail, up and curling
      p.line(2, 12 + crouch + lift, 0, 6 + crouch, c('cat', 2)).set(1, 5 + crouch, c('cat', 2));
      // the head
      const hy = 8 + crouch + lift;
      blob(p, 15, hy, 3.8, 3.4, fur, 1, 3);
      p.line(13, hy - 3, 13, hy - 6, c('cat', 2)).line(17, hy - 3, 18, hy - 6, c('cat', 2));
      const eye = mood === 'blink' || mood === 'bliss' ? c('cat', 0) : c('laurel', 3);
      p.set(16, hy - 1, eye).set(17, hy - 1, mood === 'calm' ? ink : eye);
      p.set(18, hy + 1, c('red', 3));
      if (mood === 'yowl' || mood === 'ouch') p.rect(16, hy + 2, 3, 2, ink).set(17, hy + 3, c('red', 2));
      blob(p, 14, hy + 3, 1.6, 1.4, pal.r('marble'), 2, 3);
      p.line(17, hy + 1, 19, hy, c('marble', 3));
    }
    if (o.faint) tipOver(p, o.faint);
    return outline(p, ink);
  };
  return { body };
}

/** Felix's poses (the same names as Marcus's, so one character builder serves both). */
export function buildFelixBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const a = felixArt(pal);
  book.add('front', a.body({ face: 'front' }));
  book.add('blink', a.body({ face: 'front', mood: 'blink' }));
  book.add('worry', a.body({ face: 'front', mood: 'ouch' }));
  for (let s = 0; s < 4; s++) book.add(`walk${s}`, a.body({ face: 'side', step: s }));
  book.add('hop', a.body({ face: 'side', leap: true, mood: 'yowl' }));
  book.add('hopSide', a.body({ face: 'side', leap: true }));
  book.add('sneak0', a.body({ face: 'side', crouch: true, step: 0 }));
  book.add('sneak1', a.body({ face: 'side', crouch: true, step: 1 }));
  book.add('sing0', a.body({ face: 'front', mood: 'blink' }));
  book.add('sing1', a.body({ face: 'front', mood: 'yowl' }));
  book.add('hurt', a.body({ face: 'front', mood: 'ouch' }));
  book.add('faint0', a.body({ face: 'side', mood: 'blink', faint: 0.4 }));
  book.add('faint1', a.body({ face: 'side', mood: 'blink', faint: 1 }));
  book.add('joke0', a.body({ face: 'side', crouch: true, mood: 'calm' }));
  book.add('joke1', a.body({ face: 'side', mood: 'yowl' }));
  book.add('bliss', a.body({ face: 'front', mood: 'bliss' }));
  return book;
}

/** Everything else that moves (RISI.MBL, one set for every level). */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const R = pal.r;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // Hurting things are solid (they push him away) and cost dignity, but only on their "S" picture,
  // which each shows for one tick a round of its animation (characters.ts sting()): a hurt holds
  // the hero still, so a monster that hurt on every tick would hold him there.
  const hurt = (hp: number, solid = 15) => ({ chHitPt: hp, solid });
  const solid = { solid: 15 };
  /** Two dot eyes and a mouth on a face at (x, y). */
  const face = (p: Pixels, x: number, y: number, o: { grin?: boolean; stern?: boolean; laugh?: boolean; shock?: boolean; shut?: boolean } = {}) => {
    if (o.shut || o.laugh) p.line(x - 3, y, x - 1, y - 1, ink).line(x + 1, y - 1, x + 3, y, ink);
    else p.set(x - 2, y, ink).set(x + 2, y, ink);
    if (o.stern) p.line(x - 3, y - 2, x - 1, y - 1, ink).line(x + 1, y - 1, x + 3, y - 2, ink);
    if (o.laugh) p.rect(x - 2, y + 2, 5, 3, ink).rect(x - 1, y + 4, 3, 1, c('red', 2));
    else if (o.shock) p.rect(x - 1, y + 2, 2, 3, ink);
    else if (o.grin)
      p.set(x - 2, y + 2, ink)
        .set(x - 1, y + 3, ink)
        .set(x, y + 3, ink)
        .set(x + 1, y + 3, ink)
        .set(x + 2, y + 2, ink);
    else p.line(x - 1, y + 3, x + 1, y + 3, ink);
  };
  /** Big "HA!" style lettering in a burst. */
  const burst = (word: string, ramp: string, f: number) => {
    const p = P();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + f * 0.4;
      p.line(10 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, 10 + Math.cos(a) * (8 + f), 10 + Math.sin(a) * (8 + f), c(ramp, 2));
    }
    blob(p, 10, 10, 6, 5, R(ramp), 2, 3);
    micro(p, 10 - word.length * 2, 8, word, ink);
    return done(p);
  };
  book.add('joke0', burst('HA!', 'gold', 0));
  book.add('joke1', burst('HA!', 'gold', 1));

  // ---- I. the banquet
  // a cloud of Rufus's wind: green, with stink lines (a joke clears it)
  const gas = (f: number) => {
    const p = P();
    for (const [gx, gy, r] of [
      [7, 12, 4],
      [12, 11, 4.4],
      [10, 8, 3.6],
    ] as const)
      blob(p, gx + f, gy - f, r, r * 0.8, R('gas'), 1, 3);
    for (let k = 0; k < 3; k++) p.line(5 + k * 5, 4 - f, 6 + k * 5, 1, c('gas', 1)).set(6 + k * 5, 0, c('gas', 0));
    return done(p);
  };
  book.add('gas0', gas(0), { solid: 0 });
  book.add('gas1', gas(1), { solid: 0 });
  book.add('gasS', gas(0), hurt(-6, 0));
  // Lady Flavia, aghast behind her fan (a bow is points)
  const flavia = (f: number) => {
    const p = P();
    for (let y = 8; y < 20; y++) p.rect(10 - Math.floor((y - 4) / 3), y, Math.floor((y - 4) / 1.5), 1, c('blue', y % 3 ? 2 : 1));
    blob(p, 10, 5, 3.4, 3.6, R('skin'), 2, 4);
    for (const [hx, hy] of [
      [7, 2],
      [9, 1],
      [11, 1],
      [13, 2],
      [10, 0],
    ])
      p.disc(hx, hy, 1.4, c('hair', 2));
    face(p, 10, 5, { shock: true });
    // the fan
    for (let k = 0; k < 5; k++) p.line(14, 12, 12 + k * 2, 6 + f, c('ochre', 3));
    p.set(14, 12, c('skin', 2)).line(14, 12, 13, 15, c('skin', 2));
    return done(p);
  };
  book.add('flavia0', flavia(0), { scorePts: 250 });
  book.add('flavia1', flavia(1), { scorePts: 250 });
  // Teddy and Gwinn, sitting like good Roman dogs: red (Gwinn: pink) collars, a golden bulla
  const dog = (f: number, fur: string, chest: string, collar: string, tallEar: boolean) => {
    const p = P();
    blob(p, 9, 15, 6, 4.4, R(fur), 1, 3);
    blob(p, 11, 15, 2.6, 3.6, R(chest), 1, 3);
    p.rect(5, 18, 3, 2, c(chest, 2)).rect(11, 18, 3, 2, c(chest, 2));
    blob(p, 12, 7, 4.4, 4, R(fur), 1, 3);
    if (tallEar) {
      p.line(9, 5, 8, 0, c(fur, 2)).line(10, 4, 10, 1, c(fur, 1)).line(15, 5, 16, 1, c(fur, 2)).line(14, 4, 15, 2, c(fur, 1));
      p.line(12, 4, 12, 9, c('marble', 3));
    } else p.rect(7, 5, 3, 5, c(fur, 0)).rect(15, 5, 3, 5, c(fur, 0));
    p.set(10, 7, ink).set(14, 7, ink).disc(12, 10, 1.1, ink);
    if (f) p.rect(12, 11, 2, 2, c('red', 3));
    p.rect(9, 12, 7, 1, c(collar, 2)).disc(12, 13.5, 1.2, c('gold', 2));
    p.line(3, 17, 1, 14 - f, c(fur, 2));
    return done(p);
  };
  book.add('teddy0', dog(0, 'fur', 'marble', 'red', true), solid);
  book.add('teddy1', dog(1, 'fur', 'marble', 'red', true), solid);
  book.add('gwinn0', dog(0, 'liver', 'liver', 'tile', false), solid);
  book.add('gwinn1', dog(1, 'liver', 'liver', 'tile', false), solid);
  // a slave with a tray of figs, walking
  const servus = (f: number) => {
    const p = P();
    for (let y = 8; y < 16; y++) p.rect(6, y, 8, 1, c('ochre', y % 3 ? 1 : 2));
    for (const [lx, d] of f
      ? [
          [7, -1],
          [12, 1],
        ]
      : [
          [8, 0],
          [11, 0],
        ])
      p.line(lx, 16, lx + d, 19, c('skin', 1));
    blob(p, 11, 5, 3, 3, R('skin'), 1, 3);
    p.rect(8, 2, 6, 2, c('hair', 0)).set(12, 5, ink);
    p.line(13, 9, 17, 6, c('skin', 2)).rect(13, 4, 7, 2, c('bronze', 2));
    for (const fx of [14, 16, 18]) p.disc(fx, 3, 1.1, c('grape', 1));
    return done(p);
  };
  book.add('servus0', servus(0), solid);
  book.add('servus1', servus(1), solid);

  // ---- IV. the kitchen
  const mouse = (f: number, cheese: boolean) => {
    const p = P();
    blob(p, 9, 15, 5, 3.4, R('mouse'), 0, 2);
    p.disc(14, 13, 2.6, c('mouse', 1)).disc(12, 10, 1.6, c('mouse', 2)).disc(12, 10, 0.8, c('tile', 3));
    p.set(15, 12, ink).set(17, 14, c('red', 3)).line(17, 14, 19, 13, c('marble', 3));
    p.line(4, 15, 0, 13 - f, c('tile', 2));
    p.set(6 + f, 18, c('mouse', 0)).set(11 - f, 18, c('mouse', 0));
    if (cheese) p.rect(15, 15, 4, 3, c('cheese', 2)).set(16, 16, c('cheese', 0));
    // lamplight along its edge (gold keeps its light at night), so a gray mouse reads on the
    // dark kitchen floor; the same pixels, so the same reach
    return outline(p, c('gold', 1));
  };
  book.add('mouse0', mouse(0, true), solid);
  book.add('mouse1', mouse(1, true), solid);
  book.add('mouseS', mouse(0, true), hurt(-6));
  const crumb = (f: number) => {
    const p = P();
    p.rect(5, 10, 10, 7, c('cheese', 2)).line(5, 10, 15, 10, c('cheese', 3)).line(5, 10, 10, 6, c('cheese', 3)).line(10, 6, 15, 10, c('cheese', 1));
    p.set(8, 13, c('cheese', 0)).set(12, 12, c('cheese', 0));
    if (f) p.set(4, 5, c('gold', 3)).set(16, 6, c('gold', 3)).set(10, 3, c('gold', 2));
    return done(p);
  };
  book.add('crumb0', crumb(0), { effect: CHEESE, eamt: 1, scorePts: 150 });
  book.add('crumb1', crumb(1), { effect: CHEESE, eamt: 1, scorePts: 150 });
  book.add('meow0', burst('MIAU', 'laurel', 0));
  book.add('meow1', burst('MIAU', 'laurel', 1));
  const ant = (f: number) => {
    const p = P();
    for (const [ax, r] of [
      [6, 1.8],
      [10, 1.4],
      [14, 2],
    ] as const)
      p.disc(ax, 16, r, c('ink', 1));
    for (let k = 0; k < 3; k++) p.line(8 + k * 2, 17, 7 + k * 2 + (f ? 1 : -1), 19, ink);
    p.line(15, 15, 18, 12, ink);
    return done(p);
  };
  book.add('ant0', ant(0), solid);
  book.add('ant1', ant(1), solid);
  book.add('antS', ant(0), hurt(-3));

  // ---- II. the battle: the Gaulish horde (winged helmets, moustaches, braids)
  const gaul = (f: number, kind: 0 | 1) => {
    const p = P();
    const tunic = kind ? 'blue' : 'laurel';
    for (let y = 9; y < 16; y++) p.rect(5, y, 10, 1, c(tunic, (y + kind) % 2 ? 1 : 2));
    for (const [lx, d] of f
      ? [
          [7, -2],
          [12, 2],
        ]
      : [
          [7, 1],
          [12, -1],
        ])
      p.line(lx, 16, lx + d, 19, c('skin', 1)).line(lx + 1, 16, lx + d + 1, 19, c('skin', 2));
    blob(p, 10, 5, 3.6, 3.4, R('skin'), 1, 3);
    p.rect(6, 1, 9, 3, c('iron', 2)).rect(6, 1, 9, 1, c('iron', 1));
    if (kind === 0) p.line(5, 2, 2, -1, c('marble', 3)).line(15, 2, 18, -1, c('marble', 3)).line(5, 3, 2, 1, c('marble', 2)).line(15, 3, 18, 1, c('marble', 2));
    else p.line(6, 4, 4, 11, c('ochre', 2)).line(14, 4, 16, 11, c('ochre', 2));
    p.line(7, 7, 13, 7, c('ochre', 2)).set(6, 8, c('ochre', 2)).set(14, 8, c('ochre', 2));
    p.set(8, 5, ink).set(12, 5, ink).line(8, 4, 9, 4, ink).line(11, 4, 12, 4, ink);
    if (kind === 0) p.line(15, 10, 19, 4 + f, c('wood', 2)).rect(17, 2 + f, 3, 4, c('iron', 2));
    else blob(p, 4, 12, 3, 5, R('wood'), 1, 3);
    return done(p);
  };
  book.add('gaul0', gaul(0, 0), solid);
  book.add('gaul1', gaul(1, 0), solid);
  book.add('gaulS', gaul(0, 0), hurt(-20));
  book.add('gaulB0', gaul(0, 1), solid);
  book.add('gaulB1', gaul(1, 1), solid);
  book.add('gaulBS', gaul(0, 1), hurt(-20));
  const arrow = (f: number) => {
    const p = P();
    p.line(10, 2, 10, 16, c('wood', 2)).line(8, 14, 10, 18, c('iron', 2)).line(12, 14, 10, 18, c('iron', 2)).set(10, 19, c('iron', 1));
    p.line(8, 2 + f, 10, 5, c('red', 2)).line(12, 2 + f, 10, 5, c('red', 2));
    return done(p);
  };
  book.add('arrow0', arrow(0), { solid: 0 });
  book.add('arrow1', arrow(1), { solid: 0 });
  book.add('arrowS', arrow(0), hurt(-8, 0));
  const crow = (f: number) => {
    const p = P();
    blob(p, 10, 11, 4, 2.4, R('ink'), 0, 1);
    p.line(4, 11 - f * 4, 9, 10, c('ink', 1))
      .line(16, 11 - f * 4, 11, 10, c('ink', 1))
      .set(14, 10, c('ochre', 3))
      .set(13, 10, c('marble', 3));
    return p;
  };
  book.add('crow0', crow(0));
  book.add('crow1', crow(1));

  // ---- III. the rooftops
  const spell = (f: number) => {
    const p = P();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + f * 0.6;
      p.line(10, 10, 10 + Math.cos(a) * 7, 10 + Math.sin(a) * 7, c('spell', 1 + (k % 2)));
    }
    blob(p, 10, 10, 3, 3, R('spell'), 1, 2);
    micro(p, 8, 8, 'S', c('marble', 3));
    return done(p);
  };
  book.add('spell0', spell(0), { solid: 0 });
  book.add('spell1', spell(1), { solid: 0 });
  book.add('spellS', spell(0), hurt(-6, 0));
  const pigeon = (f: number) => {
    const p = P();
    // a slate-dark rock dove, so it reads against the sunset roofs: pale wing bars, a green sheen
    blob(p, 9, 14, 5, 3.6, R('grey'), 0, 1);
    blob(p, 14, 10 + f, 2.6, 2.4, R('grey'), 0, 2);
    p.line(6, 13, 11, 13, c('grey', 3)).line(6, 15, 10, 15, c('grey', 3));
    p.set(15, 9 + f, c('marble', 3))
      .set(17, 11 + f, c('ochre', 2))
      .rect(12, 12, 3, 1, c('laurel', 2));
    p.line(8, 18, 8, 19, c('red', 2)).line(11, 18, 11, 19, c('red', 2)).line(3, 13, 1, 15, c('grey', 1));
    return done(p);
  };
  // Pigeons are solid only at their sides: Marcus landing on one slides down beside it onto the
  // roof instead of being pushed down into the tiles under it.
  const sides = SOLLEF | SOLRIG;
  book.add('pigeon0', pigeon(0), { solid: sides });
  book.add('pigeon1', pigeon(1), { solid: sides });
  book.add('pigeonS', pigeon(0), hurt(-4, sides));
  /** Doc Leo's face: his own nose and cheeks sunburned, white paint round the mouth and eyes, painted stubble. */
  const leoFace = (p: Pixels, x: number, y: number, f: number) => {
    blob(p, x, y, 3.6, 3.8, R('skin'), 2, 4);
    for (let k = -3; k <= 3; k++) p.set(x + k, y + 2 + (Math.abs(k) > 2 ? -1 : 0), c('grey', 1)).set(x + k, y + 3, c('grey', 1));
    p.rect(x - 1, y + 2, 3, 2, c('marble', 3)).set(x, y + 3, c('red', 1));
    p.disc(x - 2, y - 1, 1, c('marble', 3))
      .disc(x + 2, y - 1, 1, c('marble', 3))
      .set(x - 2, y - 1, ink)
      .set(x + 2, y - 1 + f, ink);
    p.disc(x, y + 1, 1.2, c('tile', 3))
      .set(x - 3, y + 1, c('tile', 2))
      .set(x + 3, y + 1, c('tile', 2));
    p.line(x - 3, y - 3, x - 1, y - 2, ink).line(x + 1, y - 2, x + 3, y - 3, ink);
  };
  // Doc Leo the philosopher: a navy cloak over his purple tunic, red sneakers, a scroll, and
  // the rubber chicken on its leash
  const leo = (f: number) => {
    const p = P();
    for (let y = 8; y < 17; y++) p.rect(5, y, 9, 1, c('purple', 1));
    for (let y = 8; y < 17; y++) p.rect(4, y, 3, 1, c('blue', 1)).rect(12, y, 3, 1, c('blue', 1));
    p.line(9, 8, 9, 14, c('laurel', 2));
    for (const lx of [6, 11]) p.rect(lx, 17, 2, 2, c('blue', 0)).rect(lx - 1, 19, 4, 1, c('red', 2));
    leoFace(p, 9, 4, f);
    // the rubber chicken, on a red leash
    p.line(14, 12, 17, 17, c('red', 2));
    blob(p, 17, 17, 2.4, 1.8, R('cheese'), 2, 3);
    p.set(19, 16 - f, c('red', 3)).set(18, 15, c('cheese', 3));
    return done(p);
  };
  book.add('leo0', leo(0), { scorePts: 500 });
  book.add('leo1', leo(1), { scorePts: 500 });
  // the clever wise man on his chimney: a long beard, a starry hat, shooting spells
  const sagax = (f: number) => {
    const p = P();
    for (let y = 9; y < 20; y++) p.rect(10 - Math.floor((y - 5) / 3), y, Math.floor((y - 5) / 1.5), 1, c('spell', 0));
    blob(p, 10, 7, 3, 3, R('skin'), 2, 4);
    for (let y = 0; y < 5; y++) p.rect(10 - Math.floor(y / 1.5), y, Math.floor(y / 0.8) + 1, 1, c('blue', 1));
    p.set(10, 1, c('gold', 3)).set(8, 3, c('gold', 2));
    for (let k = 0; k < 8; k++) p.rect(8, 9 + k, 5, 1, c('marble', 3 - (k % 2)));
    p.set(9, 7, ink).set(11, 7, ink);
    p.line(14, 12, 17 + f, 7 - f, c('wood', 2)).set(17 + f, 6 - f, c('spell', 2));
    return done(p);
  };
  book.add('sagax0', sagax(0), solid);
  book.add('sagax1', sagax(1), solid);

  // ---- V. the baths
  const note = (f: number) => {
    const p = P();
    p.disc(8, 14, 2.6, c('fish', 2)).rect(10, 3, 2, 11, c('fish', 2)).line(11, 3, 16, 7, c('fish', 3)).line(11, 4, 16, 8, c('fish', 2));
    if (f) p.set(4, 4, c('gold', 3)).set(16, 14, c('gold', 3));
    return done(p);
  };
  book.add('note0', note(0), { scorePts: 50 });
  book.add('note1', note(1), { scorePts: 50 });
  // a mouse of the baths in a little towel, arms up, cheering
  const fan = (f: number) => {
    const p = P();
    blob(p, 10, 14, 4, 4, R('mouse'), 1, 2);
    p.rect(6, 14, 8, 4, c('toga', 2));
    blob(p, 10, 8, 3, 2.8, R('mouse'), 1, 2);
    p.disc(7, 5, 1.6, c('mouse', 2)).disc(13, 5, 1.6, c('mouse', 2)).set(9, 8, ink).set(11, 8, ink).set(10, 10, c('red', 3));
    p.line(6, 12, 3, 7 - f * 2, c('mouse', 1)).line(14, 12, 17, 7 - f * 2, c('mouse', 1));
    if (f) micro(p, 13, 0, '!', c('gold', 3));
    return done(p);
  };
  book.add('fan0', fan(0), { scorePts: 150 });
  book.add('fan1', fan(1), { scorePts: 150 });
  const bubble = (f: number) => {
    const p = P();
    p.ring(10, 10, 4 + f * 0.6, c('tile', 3))
      .disc(10, 10, 3, c('tile', 2))
      .set(8, 8, c('marble', 3));
    p.set(10, 3 - f, c('steam', 2)).set(12, 2, c('steam', 1));
    return done(p);
  };
  book.add('bubble0', bubble(0), { solid: 0 });
  book.add('bubble1', bubble(1), { solid: 0 });
  book.add('bubbleS', bubble(0), hurt(-5, 0));
  // a drop of hot water off the vault: a deep blue teardrop with a red-hot glint, outlined dark so it shows on the pale wall
  const drip = (f: number) => {
    const p = P();
    p.disc(10, 13, 3.4, c('water', 1)).line(10, 7, 10, 12, c('water', 1)).line(9, 10, 11, 10, c('water', 1));
    p.set(9, 12, c('marble', 3)).set(11, 15, c('tile', 3)).set(10, 15, c('tile', 2));
    p.set(8 + f * 4, 4, c('water', 2)).set(10, 2 + f, c('water', 2));
    return done(p);
  };
  book.add('drip0', drip(0), { solid: 0 });
  book.add('drip1', drip(1), { solid: 0 });
  book.add('dripS', drip(0), hurt(-6, 0));
  // a senator floating on his back, belly up, blissful (solid: stand on him)
  const bather = (f: number) => {
    const p = P();
    blob(p, 10, 12 - f, 9, 3.4, R('skin'), 1, 3);
    blob(p, 10, 9 - f, 4, 3, R('skin'), 2, 4);
    p.disc(2, 12 - f, 2.4, c('skin', 2))
      .line(1, 10 - f, 3, 10 - f, c('laurel', 2))
      .set(2, 12 - f, ink);
    p.rect(0, 14, 20, 6, c('water', 3));
    for (let k = 0; k < 20; k += 4) p.set(k + f, 14, c('water', 4));
    return done(p);
  };
  book.add('bather0', bather(0), solid);
  book.add('bather1', bather(1), solid);

  // ---- VI. the theater
  // a spectator: stone-faced (grey, arms crossed) or laughing at last (counter 24)
  const spectator = (laugh: boolean, f: number) => {
    const p = P();
    const robe = laugh ? 'ochre' : 'grey';
    for (let y = 9; y < 20; y++) p.rect(4, y, 12, 1, c(robe, y % 3 ? 2 : 1));
    blob(p, 10, 6 - (laugh ? f : 0), 4, 4, laugh ? R('skin') : R('grey'), 1, 3);
    if (laugh) {
      face(p, 10, 6 - f, { laugh: true });
      p.line(4, 11, 1, 6 - f * 2, c('skin', 2)).line(16, 11, 19, 6 - f * 2, c('skin', 2));
      micro(p, 13, 0, f ? 'HA' : '', c('gold', 3));
    } else {
      face(p, 10, 6, { stern: true });
      p.rect(5, 12, 10, 2, c('grey', 3));
    }
    return done(p);
  };
  book.add('stony0', spectator(false, 0), solid);
  book.add('stony1', spectator(false, 1), solid);
  book.add('giggle0', spectator(true, 0));
  book.add('giggle1', spectator(true, 1));
  book.add('laugher0', spectator(true, 0), { effect: LAUGHS, eamt: 1, scorePts: 300 });
  book.add('laugher1', spectator(true, 1), { effect: LAUGHS, eamt: 1, scorePts: 300 });
  const cabbage = (f: number) => {
    const p = P();
    blob(p, 10, 10, 6, 5.6, R('laurel'), 1, 3);
    for (let k = 0; k < 4; k++) p.line(10, 10, 10 + Math.cos(k + f) * 6, 10 + Math.sin(k + f) * 5, c('laurel', 0));
    return done(p);
  };
  book.add('cabbage0', cabbage(0), hurt(-6, 0));
  book.add('cabbage1', cabbage(1), hurt(-6, 0));
  // Doc Leo the jester: a two-pointed hood in red and gold with bells, the rubber chicken
  const jester = (f: number) => {
    const p = P();
    for (let y = 9; y < 17; y++) p.rect(5, y, 10, 1, (y + Math.floor(y / 2)) % 2 ? c('red', 2) : c('ochre', 3));
    for (const lx of [6, 11]) p.rect(lx, 17, 2, 2, c('purple', 1)).rect(lx - 1, 19, 4, 1, c('red', 2));
    p.line(6, 3, 2, 0 + f, c('red', 2))
      .line(13, 3, 17, 0 + f, c('ochre', 3))
      .disc(2, 0 + f, 1, c('gold', 3))
      .disc(17, 0 + f, 1, c('gold', 3));
    leoFace(p, 9, 5, f);
    p.line(15, 10, 18, 6 - f, c('skin', 2));
    blob(p, 18, 4 - f, 1.8, 2.6, R('cheese'), 2, 3);
    return done(p);
  };
  book.add('jester0', jester(0), { scorePts: 500 });
  book.add('jester1', jester(1), { scorePts: 500 });
  // Emperor Gravis: A his laurel and face (stern, then less so, then laughing helplessly), B his
  // purple toga and the gilt throne; each joke makes him a stage worse at keeping a straight face
  const gravis = (half: 'A' | 'B', stage: number, f: number) => {
    const p = P();
    if (half === 'A') {
      blob(p, 10, 11 - (stage >= 3 ? f : 0), 7, 7, R('skin'), 1, 3);
      for (let k = 0; k < 12; k++)
        p.set(4 + k, 5 - Math.round(Math.sin((k / 11) * Math.PI) * 2) + (stage >= 2 ? (k % 3 === 0 ? 1 : 0) : 0), c('laurel', 2 + (k % 2)));
      p.line(5, 6, 4, 9, c('grey', 2)).line(15, 6, 16, 9, c('grey', 2));
      if (stage === 0) face(p, 10, 10, { stern: true });
      else if (stage === 1) (face(p, 10, 10, { stern: true }), p.set(13, 13, c('red', 3)));
      else if (stage === 2) face(p, 10, 10, { grin: true });
      else face(p, 10, 10 - f, { laugh: true });
      if (stage >= 2) p.set(4, 12, c('red', 3)).set(16, 12, c('red', 3));
      if (stage >= 3) p.set(3, 9, c('water', 4)).set(17, 9 - f, c('water', 4));
    } else {
      p.rect(0, 0, 20, 20, T);
      p.rect(1, 2, 18, 18, c('gold', 1)).rect(1, 2, 18, 2, c('gold', 3)).rect(3, 4, 14, 16, c('gold', 0));
      for (let y = 0; y < 16; y++) p.rect(4, y, 12, 1, c('purple', y % 3 ? 1 : 2));
      p.rect(4, 15, 12, 1, c('gold', 2));
      const shake = stage >= 3 ? f : 0;
      p.line(4, 4, 2 - shake, 9, c('skin', 2)).line(16, 4, 18 + shake, 9, c('skin', 2));
      if (stage >= 1) p.set(7, 8, c('gold', 3));
      if (stage >= 2) p.set(12, 11, c('gold', 3));
    }
    return done(p);
  };
  const seated = SOLBOT | SOLLEF | SOLRIG;
  // (his toga and throne look the same until he shakes with laughter: stages 0 and 3 only)
  for (const [half, s] of [
    ['A', 0],
    ['A', 1],
    ['A', 2],
    ['A', 3],
    ['B', 0],
    ['B', 3],
  ] as const) {
    // solid but not SOLTOP, the side that pushes a hero under a monster (PLAYGAME's ChkMonChr):
    // Marcus landing on him is never pushed down into the stage, where his stamp would hurt
    book.add(`gravis${half}${s}a`, gravis(half, s, 0), { solid: seated });
    book.add(`gravis${half}${s}b`, gravis(half, s, 1), { solid: seated });
    book.add(`gravis${half}${s}s`, gravis(half, s, 0), hurt(-10, seated));
  }
  // his "SILENTIUM!": a purple hush rolling toward Marcus, a finger to its lips, white-rimmed to read on the red stage front
  const hush = (f: number) => {
    const p = P();
    blob(p, 10, 10, 8, 6, R('purple'), 1, 2);
    p.ring(10, 10, 8, c('marble', 3));
    micro(p, 4, 7, 'SH!', c('marble', 3));
    p.rect(15, 4 + f, 2, 6, c('skin', 3));
    for (let k = 0; k < 3; k++) p.set(19, 6 + k * 4 + f, c('purple', 2));
    return done(p);
  };
  book.add('hush0', hush(0), { solid: 0 });
  book.add('hush1', hush(1), { solid: 0 });
  book.add('hushS', hush(0), hurt(-8, 0));
  // his empty gilt throne, a purple cushion squashed where he sat (walk past it)
  const throne = P();
  throne.rect(1, 2, 18, 18, c('gold', 1)).rect(1, 2, 18, 2, c('gold', 3)).rect(3, 4, 14, 16, c('gold', 0));
  throne.rect(4, 11, 12, 4, c('purple', 2)).rect(4, 11, 12, 1, c('purple', 1)).rect(4, 15, 12, 1, c('gold', 2));
  book.add('throne', done(throne), { solid: 0 });
  // a decree, rolled, flying ("SILENTIUM!"), and where it lands
  const decree = (f: number) => {
    const p = P();
    p.rect(4, 7, 12, 7, c('toga', 3))
      .disc(4, 10.5, 2, c('toga', 2))
      .disc(16, 10.5, 2, c('toga', 2))
      .rect(8, 9 + f, 4, 3, c('red', 2));
    return done(p);
  };
  book.add('decree0', decree(0), { solid: 0 });
  book.add('decree1', decree(1), { solid: 0 });
  book.add('decreeS', decree(0), hurt(-6, 0));
  const thud = P();
  thud.rect(2, 15, 16, 4, c('toga', 3)).rect(8, 15, 4, 2, c('red', 2));
  micro(thud, 1, 9, 'SHH', c('red', 3));
  book.add('thud', done(thud), hurt(-1, 0));
  // the laurel crown, glowing
  const crown = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) p.set((k * 7 + f * 3) % 20, (k * 5 + f * 7) % 20, c('gold', 2));
    for (let k = 0; k < 16; k++) {
      const a = Math.PI * 0.1 + (k / 15) * Math.PI * 0.8;
      p.disc(10 - Math.cos(a) * 7, 13 - Math.sin(a) * 6, 1.4, c('laurel', 2 + (k % 2)));
    }
    p.disc(10, 15, 1.2, c('gold', 3));
    return done(p);
  };
  book.add('crown0', crown(0), { effect: CROWN, eamt: 1, scorePts: 1000 });
  book.add('crown1', crown(1), { effect: CROWN, eamt: 1, scorePts: 1000 });
  // (last, so every other block keeps its number) the friends going off: one picture each, worth
  // nothing, so brushing past them as they go doesn't score every tick
  book.add('flaviaOff', flavia(1));
  book.add('leoOff', leo(1));
  book.add('fanOff', fan(1));
  book.add('jesterOff', jester(1));
  return book;
}
