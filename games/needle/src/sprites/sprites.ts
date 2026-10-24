// The camel's .CBL files and NEEDLE.MBL. Brother Camel, side on, two blocks tall (his humps,
// neck and head up top, his body and long legs below), drawn four ways as he slims down: loaded
// with the rich man's saddle, saddlebags of gold and fancy curled shoes at the city gate; the
// saddle and shoes on the desert road; just the fancy shoes in the tailor's shop; and nothing
// at all up the needle. Kneeling he is one block high ("hump down"): that is how he crawls
// through the narrow ways. Everything else that moves: the rich man (two blocks wide), market
// dogs, pigeons, rolling melons, the city guard, scorpions, vultures, a white goat, tumbleweeds,
// a tiny mustard seed in red sneakers, snipping scissors, moths, the sewing machine's needle,
// rolling thimbles, falling stars and a dove. Every sprite is drawn from shapes and outlined.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import type { Pal } from '../art/pal';
import { SOLBOT, SOLLEF, SOLRIG } from '../../../../web/src/formats/blocks';

export { T };

/** Gives every drawn pixel's empty neighbors the outline color. */
export function outline(p: Pixels, ink: number): Pixels {
  const src = p.px.slice();
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (src[y * p.w + x] !== T) continue;
      const near = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => {
        const xx = x + dx;
        const yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < p.w && yy < p.h && src[yy * p.w + xx] !== T && src[yy * p.w + xx] !== ink;
      });
      if (near) p.px[y * p.w + x] = ink;
    }
  return p;
}

/** What the camel still carries. */
export interface Load {
  saddle: boolean;
  bags: boolean;
  shoes: boolean;
}

export type Form = 'loaded' | 'saddled' | 'shod' | 'bare';
export const FORMS: Record<Form, Load> = {
  loaded: { saddle: true, bags: true, shoes: true },
  saddled: { saddle: true, bags: false, shoes: true },
  shod: { saddle: false, bags: false, shoes: true },
  bare: { saddle: false, bags: false, shoes: false },
};

/** Where the four feet are: x of each leg and how high its hoof is lifted, back legs first. */
type Legs = [number, number][];
const STAND: Legs = [
  [3, 0],
  [5, 0],
  [11, 0],
  [13, 0],
];
const WALK: Legs[] = [
  [
    [2, 0],
    [6, 2],
    [10, 0],
    [14, 2],
  ],
  [
    [3, 0],
    [5, 0],
    [11, 0],
    [13, 0],
  ],
  [
    [4, 2],
    [4, 0],
    [12, 2],
    [12, 0],
  ],
];

export interface CamelPose {
  legs: Legs | 'tuck' | 'kneel' | 'flop';
  /** Head: up (proud), chew (mouth moving), dream (eyes shut, chin up), ouch, faint. */
  head?: 'up' | 'chew' | 'dream' | 'ouch' | 'faint';
  blink?: boolean;
  /** Body lifted (a hop), in pixels. */
  dy?: number;
  /** For crawling: a little shuffle forward. */
  shuffle?: number;
}

/** Brother Camel in the pal's ramps. `pose` gives a 20x40 picture (top block over bottom). */
export function camelArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const fur = pal.r('camel');
  let load: Load = FORMS.bare;

  const shoe = (p: Pixels, x: number, y: number) => {
    // a fancy curled slipper, purple with a gold tip
    p.rect(x - 1, y - 1, 3, 2, c('purple', 2))
      .set(x, y - 1, c('purple', 3))
      .set(x + 2, y - 2, c('gold', 3));
  };

  const pose = (o: CamelPose): Pixels => {
    const p = new Pixels(20, 40, T);
    const k = o.legs === 'kneel' || o.legs === 'flop';
    const lift = o.dy ?? 0;
    const sh = o.shuffle ?? 0;
    // the body: a barrel on long legs; kneeling it rests on the ground
    const bx = 8 + sh;
    const by = k ? 35 : 27 - lift;
    const ry = k ? 3.4 : 3.8;
    // tail
    p.line(bx - 7, by - 1, bx - 8, by + 4, c('camel', 1)).set(bx - 8, by + 5, c('hair', 0));
    // legs: thin, knobbly at the knee
    if (Array.isArray(o.legs)) {
      for (const [x0, up] of o.legs) {
        const x = x0 + sh;
        const top = by + 2;
        const foot = 39 - up - lift;
        const knee = Math.round((top + foot) / 2);
        p.line(x, top, x, foot, c('camel', 2))
          .set(x + 1, top, c('camel', 3))
          .set(x + 1, top + 1, c('camel', 3));
        p.set(x - 1, knee, c('camel', 1)).set(x + 1, knee, c('camel', 1));
        if (load.shoes) shoe(p, x, foot);
        else p.rect(x - 1, foot, 3, 1, c('camel', 0));
      }
    } else if (o.legs === 'tuck') {
      for (const x of [4, 12]) {
        p.line(x, by + 3, x - 2, by + 6, c('camel', 2)).line(x - 2, by + 6, x + 2, by + 8, c('camel', 2));
        if (load.shoes) shoe(p, x + 2, by + 9);
      }
    } else {
      // folded under him, knees out in front
      p.rect(bx + 3, by + 2, 4, 2, c('camel', 1)).rect(bx - 6, by + 2, 3, 2, c('camel', 1));
      if (load.shoes) shoe(p, bx + 6, 39);
    }
    blob(p, bx, by, 7.4, ry, fur, 1, 4, 1.1);
    // the humps: two good ones; kneeling squashes them flat ("hump down")
    const hh = k ? 2.4 : 5.6;
    const hTop = by - ry + 0.6;
    for (const hx of [bx - 3.6, bx + 2.4]) blob(p, hx, hTop, 2.8, hh, fur, 2, 5, 1.3);
    p.line(Math.round(bx - 0.6), Math.round(hTop - 1), Math.round(bx - 0.6), Math.round(hTop + 1), c('camel', 1));
    if (load.saddle) {
      // a red saddle blanket with a gold fringe over the humps, the saddle's horn on top
      const y0 = Math.round(hTop - hh + 2);
      for (let x = bx - 6; x <= bx + 5; x++) {
        const yy = y0 + Math.round(Math.abs(x - bx + 0.5) * 0.35);
        p.rect(x, yy, 1, Math.round(by - yy + 1), c('red', (x + yy) % 4 === 0 ? 3 : 2));
        p.set(x, by + 1, c('gold', x % 2 ? 3 : 2));
      }
      p.rect(bx - 2, y0 - 2, 3, 2, c('wood', 3)).set(bx - 1, y0 - 3, c('gold', 4));
      p.rect(bx - 5, y0 + 3, 10, 1, c('gold', 3));
    }
    if (load.bags) {
      // saddlebags full of the rich man's gold
      blob(p, bx - 1, by + 1.5, 3, 2.6, pal.r('wood'), 1, 4);
      p.set(bx - 2, by - 1, c('gold', 4))
        .set(bx - 1, by - 1, c('gold', 3))
        .set(bx, by - 1, c('gold', 4))
        .set(bx - 1, by + 1, c('gold', 3));
    }
    // the neck curves up and forward from his chest; the head points right
    const head = o.head ?? 'up';
    const dream = head === 'dream';
    const hx = k ? 16 + sh : 16;
    const hy = k ? (dream ? by - 12 : by - 7) : dream ? 9 - lift : 12 - lift;
    const n0 = [bx + 5, by - 1];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const x = n0[0] + (hx - 1 - n0[0]) * Math.sin((t * Math.PI) / 2);
      const y = n0[1] + (hy + 2 - n0[1]) * t;
      p.rect(Math.round(x) - 1, Math.round(y), 3, 1, c('camel', 2)).set(Math.round(x) + 1, Math.round(y), c('camel', 3));
    }
    blob(p, hx, hy, 2.6, 2.2, fur, 2, 5);
    const up = dream ? -1 : 0;
    blob(p, hx + 2.6, hy + 1 + up, 1.8, 1.5, fur, 2, 4);
    p.set(hx - 2, hy - 2, c('camel', 2)).set(hx - 2, hy - 3, c('camel', 1));
    if (head === 'faint')
      p.set(hx, hy - 1, ink)
        .set(hx - 1, hy - 2, ink)
        .set(hx + 1, hy - 2, ink)
        .set(hx - 1, hy, ink)
        .set(hx + 1, hy, ink);
    else if (o.blink || dream) p.rect(hx - 1, hy - 1, 2, 1, ink);
    else p.rect(hx, hy - 2, 1, 2, ink).set(hx - 1, hy - 2, c('white', 2));
    p.set(hx + 4, hy + up, ink);
    if (head === 'chew') p.rect(hx + 2, hy + 2 + up, 3, 1, ink).set(hx + 3, hy + 3 + up, c('camel', 1));
    else if (head === 'ouch' || head === 'faint') p.rect(hx + 2, hy + 2 + up, 2, 2, ink);
    else p.line(hx + 2, hy + 2 + up, hx + 3, hy + 2 + up, ink).set(hx + 1, hy + 1 + up, ink);
    if (head === 'ouch') p.px.forEach((v, i) => v !== T && v !== ink && (p.px[i] = c('red', 3)));
    return outline(p, ink);
  };

  /** A tiny thought over his head: stars (the dream). */
  const dreamTop = (k: number): Pixels => {
    const p = new Pixels(20, 20, T);
    for (const [x, y, s] of [
      [3, 4, k],
      [8, 2, 1 - k],
      [15, 5, k],
    ]) {
      p.set(x, y, c('star', 2));
      if (s)
        p.set(x - 1, y, c('star', 1))
          .set(x + 1, y, c('star', 1))
          .set(x, y - 1, c('star', 1))
          .set(x, y + 1, c('star', 1));
    }
    return p;
  };

  return {
    /** The camel as `form` in `pose`: [top block, bottom block]. */
    camel(form: Form, o: CamelPose): [Pixels, Pixels] {
      load = FORMS[form];
      const p = pose(o);
      return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
    },
    dreamTop,
  };
}

/** One form's .CBL: the camel posed for every sequence. */
export function buildCharBlocks(pal: Pal, form: Form) {
  const book = makeBook('cbl');
  const a = camelArt(pal);
  const add = (name: string, o: CamelPose, tall = true) => {
    const [top, bottom] = a.camel(form, o);
    if (tall) book.add(`${name}.top`, top);
    book.add(name, bottom);
  };
  add('stand', { legs: STAND });
  add('blink', { legs: STAND, blink: true });
  add('chew', { legs: STAND, head: 'chew' });
  WALK.forEach((legs, i) => add(`walk${i}`, { legs }));
  add('hop', { legs: 'tuck', dy: 2 });
  add('dream', { legs: STAND, head: 'dream' });
  add('hurt', { legs: STAND, head: 'ouch' });
  // kneeling and crawling: one block high
  add('kneel0', { legs: 'kneel', head: 'up' }, false);
  add('kneel1', { legs: 'kneel', head: 'chew' }, false);
  add('crawl0', { legs: 'kneel', shuffle: 0 }, false);
  add('crawl1', { legs: 'kneel', shuffle: 1 }, false);
  add('faint0', { legs: 'kneel', head: 'ouch' }, false);
  add('faint1', { legs: 'flop', head: 'faint' }, false);
  book.add('stars0', a.dreamTop(0));
  book.add('stars1', a.dreamTop(1));
  if (book.index.size > 50) throw new Error(`${form}.cbl has ${book.index.size} blocks`);
  return book;
}

/** Everything else that moves. */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // Hazards are solid (they push the camel back) and hurt to bump into. A monster's SOLTOP side
  // is the one that pushes a camel below it (ChkMonChr), into the ground he walks on, so
  // they leave it out: he can still stand on one's back (SOLBOT) but is never pushed under it.
  const hurt = (hp: number) => ({ chHitPt: Math.round(hp / 2), solid: SOLBOT | SOLLEF | SOLRIG });
  const person = (p: Pixels, x: number, robe: string, head: string, f: number) => {
    // a robed figure, side on, walking right
    p.line(x - 2, 14, x - 3 + f, 19, c(robe, 0)).line(x + 2, 14, x + 3 - f, 19, c(robe, 0));
    blob(p, x, 10, 3.6, 6, pal.r(robe), 0, 3);
    blob(p, x + 1, 3.4, 2.4, 2.4, pal.r('skin'), 1, 3);
    p.set(x + 2, 3, ink);
    if (head === 'turban') blob(p, x, 1.5, 3, 1.8, pal.r('white'), 0, 2);
    if (head === 'helmet') p.rect(x - 2, 0, 5, 2, c('steel', 2)).set(x + 3, 1, c('steel', 3));
    if (head === 'hood') blob(p, x - 1, 2.5, 3, 2.6, pal.r('cloth'), 0, 2);
  };

  // The rich man, two blocks wide: A is his back (a moneybag over his shoulder), B his front.
  const richBack = (f: number) => {
    const p = P();
    blob(p, 14, 12, 6, 6.4, pal.r('purple'), 0, 3);
    p.rect(8, 17, 12, 2, c('gold', 2));
    blob(p, 8, 8 + f, 4.4, 4.6, pal.r('cloth'), 0, 3);
    p.rect(6, 4 + f, 5, 1, c('gold', 3)).set(8, 3 + f, c('gold', 4));
    micro(p, 6, 7 + f, '$', c('gold', 1));
    p.line(14, 18, 13 - f, 19, c('ink', 1));
    return done(p);
  };
  const richFront = (f: number) => {
    const p = P();
    blob(p, 4, 12, 5, 6.4, pal.r('purple'), 0, 3);
    p.rect(0, 17, 10, 2, c('gold', 2)).rect(0, 10, 9, 1, c('gold', 3));
    blob(p, 6, 3.6, 3, 3, pal.r('skin'), 1, 3);
    blob(p, 5, 1.2, 4, 2, pal.r('white'), 1, 2);
    p.set(5, 0, c('gold', 4)).set(7, 3, ink).rect(8, 5, 2, 1, c('hair', 0));
    // nose in the air, a gold ring on the hand
    p.set(9, 3, c('skin', 2)).disc(9, 10, 1.4, c('skin', 2)).set(9, 10, c('gold', 4));
    p.line(4, 18, 5 + f, 19, c('ink', 1));
    if (f) micro(p, 12, 0, 'HM', c('red', 3));
    return done(p);
  };
  book.add('richA0', richBack(0), hurt(-6));
  book.add('richA1', richBack(1), hurt(-6));
  book.add('richB0', richFront(0), hurt(-6));
  book.add('richB1', richFront(1), hurt(-6));
  // A market dog, yapping.
  const dog = (f: number) => {
    const p = P();
    for (const [x, d] of [
      [5, f],
      [8, -f],
      [12, f],
      [15, -f],
    ])
      p.line(x, 14, x + d, 19, c('wood', 1));
    blob(p, 10, 12, 6.5, 3.4, pal.r('sand'), 0, 3);
    blob(p, 16, 9, 3, 2.8, pal.r('sand'), 0, 3);
    p.rect(18, 10, 2, 1, ink)
      .set(16, 8, ink)
      .line(15, 6, 14, 4, c('sand', 1))
      .line(3, 10, 1, 7 - f, c('sand', 2));
    if (f) micro(p, 13, 0, '!', c('red', 3));
    return done(p);
  };
  book.add('dog0', dog(0), hurt(-6));
  book.add('dog1', dog(1), hurt(-6));
  // A pigeon, flapping.
  const pigeon = (f: number) => {
    const p = P();
    blob(p, 9, 11, 5, 3.4, pal.r('grey'), 1, 3);
    blob(p, 14, 8, 2.4, 2.2, pal.r('grey'), 1, 4);
    p.rect(16, 8, 2, 1, c('pink', 1)).set(14, 7, ink).set(13, 10, c('purple', 3));
    for (let k = 0; k < 6; k++) p.line(6 + k, 10, 4 + k, f ? 3 + k / 2 : 17 - k / 2, c('grey', 2));
    return done(p);
  };
  book.add('pigeon0', pigeon(0), hurt(-4));
  book.add('pigeon1', pigeon(1), hurt(-4));
  // A melon rolling off a cart, and its splat.
  const melon = (f: number) => {
    const p = P();
    blob(p, 10, 12, 7, 6.5, pal.r('leaf'), 1, 4);
    for (let k = 0; k < 4; k++) {
      const a = f * 0.8 + (k * Math.PI) / 4;
      p.line(10 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, 10 - Math.cos(a) * 6, 12 - Math.sin(a) * 6, c('leaf', 0));
    }
    return done(p);
  };
  book.add('melon0', melon(0), hurt(-6));
  book.add('melon1', melon(1), hurt(-6));
  const splat = P();
  blob(splat, 10, 17, 8, 2.4, pal.r('red'), 2, 3);
  for (const x of [5, 8, 12, 15]) splat.set(x, 15, c('ink', 1));
  splat.rect(2, 18, 4, 1, c('leaf', 2)).rect(14, 18, 4, 1, c('leaf', 2));
  book.add('splat', done(splat));
  // A scorpion, its tail curled up over its back, pincers out front.
  const scorpion = (f: number) => {
    const p = P();
    for (let k = 0; k < 4; k++) p.line(8 + k * 2, 16, 7 + k * 2 + (f ? 2 : -1), 19, c('hair', 2));
    blob(p, 11, 15.5, 5.4, 2.4, pal.r('wood'), 0, 3);
    // the tail: segments arcing up and over toward the front, the sting hanging down
    for (let k = 0; k <= 7; k++) {
      const a = Math.PI * (1 - k / 9);
      p.disc(10 + Math.cos(a) * 5, 12 - Math.sin(a) * 7 + (k > 5 ? 1 : 0), 1.3, c('wood', k % 2 ? 1 : 2));
    }
    p.line(13, 8, 14, 10 + f, c('ink', 1));
    // pincers
    p.line(16, 15, 18, 13, c('wood', 2))
      .line(18, 13, 19, 12 - f, c('wood', 1))
      .line(18, 13, 19, 14 + f, c('wood', 1));
    p.set(15, 14, ink);
    return done(p);
  };
  book.add('scorpion0', scorpion(0), hurt(-8));
  book.add('scorpion1', scorpion(1), hurt(-8));
  // A vulture, circling.
  const vulture = (f: number) => {
    const p = P();
    for (let k = 0; k < 9; k++) {
      const y = f ? 7 - Math.round(k * 0.5) : 9 + Math.round(k * 0.3);
      p.rect(9 - k, y, 1, 3, c('hair', k > 5 ? 0 : 1)).rect(10 + k, y, 1, 3, c('hair', k > 5 ? 0 : 1));
    }
    blob(p, 10, 10, 3, 3.6, pal.r('hair'), 0, 2);
    blob(p, 10, 5.6, 2, 2, pal.r('pink'), 0, 2);
    p.rect(9, 7, 3, 1, c('white', 1)).set(10, 8, c('gold', 1)).set(9, 5, ink).set(11, 5, ink);
    return done(p);
  };
  book.add('vulture0', vulture(0), hurt(-6));
  book.add('vulture1', vulture(1), hurt(-6));
  // A white goat with her horns, third from the left in another song, a long way from Bethlehem. Friendly.
  const goat = (f: number) => {
    const p = P();
    const leg = (x: number, dx: number) => p.line(x, 14, x + dx, 18, c('white', 0));
    leg(5, f ? 1 : 0);
    leg(8, f ? -1 : 0);
    leg(12, f ? 1 : 0);
    leg(15, f ? -1 : 0);
    blob(p, 10, 11, 7, 4, pal.r('white'), 0, 2);
    blob(p, 16, 7, 3, 2.6, pal.r('white'), 0, 2);
    p.line(15, 4, 13, 1, c('grey', 2)).line(17, 4, 16, 1, c('grey', 2));
    p.set(17, 7, ink).line(17, 10, 17, 12, c('white', 0));
    if (f) micro(p, 1, 1, '3', c('red', 2));
    return done(p);
  };
  book.add('goat0', goat(0));
  book.add('goat1', goat(1));
  // A tumbleweed bounding along.
  const tumble = (f: number) => {
    const p = P();
    for (let k = 0; k < 14; k++) {
      const a = k * 0.9 + f * 0.5;
      p.line(10 + Math.cos(a) * 6, 11 + Math.sin(a) * 6, 10 - Math.cos(a * 1.7) * 5, 11 - Math.sin(a * 1.3) * 5, c('sand', k % 2 ? 1 : 2));
    }
    return done(p);
  };
  book.add('tumble0', tumble(0), hurt(-4));
  book.add('tumble1', tumble(1), hurt(-4));
  // A tiny mustard seed with a face and red sneakers, a long way from its garden. Friendly.
  const seed = (f: number) => {
    const p = P();
    const y = 13 - f * 4;
    blob(p, 10, y, 3.4, 4, pal.r('seed'), 0, 2, 1.2);
    p.set(9, y - 1, ink)
      .set(11, y - 1, ink)
      .set(10, y + 1, ink);
    p.rect(7, y + 4, 3, 1, c('red', 2)).rect(11, y + 4, 3, 1, c('red', 2));
    if (f) micro(p, 13, 1, '!', c('gold', 3));
    return done(p);
  };
  book.add('seed0', seed(0), { effect: 1, eamt: 1, scorePts: 100 });
  book.add('seed1', seed(1), { effect: 1, eamt: 1, scorePts: 100 });
  // Scissors, snipping.
  const scissors = (f: number) => {
    const p = P();
    const open = f ? 0.5 : 0.15;
    for (const s of [-1, 1]) {
      const a = Math.PI + s * open;
      p.line(10, 10, 10 + Math.cos(a) * 10, 10 + Math.sin(a) * 10, c('steel', 3)).line(10, 11, 10 + Math.cos(a) * 9, 11 + Math.sin(a) * 9, c('steel', 1));
      p.ring(14 + Math.cos(-a) * 0, 10 + s * 4, 2.6, c('red', 2));
    }
    p.disc(10, 10, 1.2, c('gold', 3));
    return done(p);
  };
  book.add('scissors0', scissors(0), hurt(-8));
  book.add('scissors1', scissors(1), hurt(-8));
  // A moth, fluttering for the wool.
  const moth = (f: number) => {
    const p = P();
    blob(p, 10, 11, 1.6, 4, pal.r('cloth'), 0, 2);
    const s = f ? 7 : 5;
    blob(p, 10 - s / 2 - 1, 9, s / 2, 3.6, pal.r('cloth'), 1, 3);
    blob(p, 10 + s / 2 + 1, 9, s / 2, 3.6, pal.r('cloth'), 1, 3);
    p.line(9, 6, 7, 3, ink).line(11, 6, 13, 3, ink);
    return done(p);
  };
  book.add('moth0', moth(0), hurt(-4));
  book.add('moth1', moth(1), hurt(-4));
  // The sewing machine's needle, stabbing up and down: a long steel shaft with its eye.
  const needle = (f: number) => {
    const p = P();
    p.rect(8, 0, 4, 16 + f, c('steel', 2)).rect(9, 0, 1, 16 + f, c('steel', 3));
    p.line(8, 16 + f, 10, 19, c('steel', 1)).line(11, 16 + f, 10, 19, c('steel', 1));
    p.rect(9, 5, 2, 4, c('ink', 1));
    return done(p);
  };
  book.add('needle0', needle(0), hurt(-10));
  book.add('needle1', needle(1), hurt(-10));
  // A thimble, hopping along on its rim.
  const thimble = (f: number) => {
    const p = P();
    const y = 6 - f * 2;
    for (let yy = 0; yy < 12; yy++) {
      const w = 5 + Math.min(yy, 4) * 0.6;
      for (let x = Math.round(10 - w); x <= Math.round(10 + w); x++) p.set(x, y + yy, c('steel', (x + yy) % 3 === 0 ? 0 : x < 10 ? 3 : 2));
    }
    p.rect(4, y + 11, 13, 2, c('steel', 1));
    return done(p);
  };
  book.add('thimble0', thimble(0), hurt(-6));
  book.add('thimble1', thimble(1), hurt(-6));
  // A falling star: catch it for points.
  const star = (f: number) => {
    const p = P();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5 + f * 0.3;
      p.line(10, 10, 10 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, c('star', 2));
    }
    p.disc(10, 10, 2.4, c('star', 2)).set(10, 10, c('white', 2));
    p.line(4, 4, 1, 1, c('star', 0)).line(5, 3, 3, 0, c('star', 0));
    return done(p);
  };
  book.add('star0', star(0), { scorePts: 100 });
  book.add('star1', star(1), { scorePts: 100 });
  const sparkle = (f: number) => {
    const p = P();
    for (const [x, y] of [
      [5, 5],
      [15, 7],
      [9, 14],
    ])
      p.set(x, y, c('star', 2))
        .set(x + (f ? 2 : 1), y, c('star', 1))
        .set(x, y + (f ? 2 : 1), c('star', 1));
    return p;
  };
  book.add('starOff0', sparkle(0));
  book.add('starOff1', sparkle(1));
  // A dove, gliding.
  const dove = (f: number) => {
    const p = P();
    blob(p, 9, 11, 5, 3, pal.r('white'), 1, 2);
    blob(p, 14, 9, 2.4, 2, pal.r('white'), 1, 2);
    p.rect(16, 9, 2, 1, c('gold', 2)).set(14, 8, ink);
    for (let k = 0; k < 6; k++) p.line(6 + k, 10, 3 + k, f ? 2 + k / 2 : 17 - k / 2, c('white', 1));
    return done(p);
  };
  book.add('dove0', dove(0));
  book.add('dove1', dove(1));
  // The city guard with his spear, pacing.
  const guard = (f: number) => {
    const p = P();
    person(p, 9, 'red', 'helmet', f);
    p.line(14, 0, 14, 19, c('wood', 2)).line(13, 2, 15, 2, c('steel', 3)).set(14, 0, c('steel', 3));
    p.rect(11, 9, 3, 2, c('skin', 2));
    return done(p);
  };
  book.add('guard0', guard(0), hurt(-8));
  book.add('guard1', guard(1), hurt(-8));
  return book;
}
