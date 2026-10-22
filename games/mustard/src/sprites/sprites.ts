// MUSTARD.CBL and MUSTARD.MBL: the mustard seed (a round yellow seed with a face and tiny red
// sneakers, the greatest feet there are; a sprout on top in the dust, and a whole plant, two
// blocks tall, on the mountain and up to the sky) and everything else that moves: raindrops,
// beetles, ants, crows, the peacock (two blocks wide), the mole in his miner's helmet,
// earthworms, rolling pebbles, the eagle, a certain goat, squirrels, nesting birds and a bee.
// Every sprite is drawn from shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import type { Pal } from '../art/pal';

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

export type Stage = 'seed' | 'sprout' | 'plant';
export type Feet = 0 | 1 | 2 | 'tuck' | 'squat' | 'none';

export interface SeedPose {
  /** front: both eyes; side: looking right (mirror for left). */
  face: 'front' | 'side';
  feet: Feet;
  blink?: boolean;
  /** What grows out of the top: a tip (the seed), a sprout, or the plant's stem. */
  top: 'tip' | 'sprout' | 'stem';
  mood?: 'smile' | 'joy' | 'ouch' | 'wilt';
  /** Squash (positive: lower and wider, for a landing or pushing roots). */
  squash?: number;
}

/** The seed's look: in the pal's ramps (seed for the body, red sneakers, leaf for the sprout). */
export function seedArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);

  const body = (o: SeedPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const sq = o.squash ?? 0;
    const wilt = o.mood === 'wilt';
    const cy = 10.5 + sq + (o.feet === 'tuck' ? -1 : 0) + (wilt ? 2 : 0);
    const ry = 6.4 - sq * 0.8 - (wilt ? 1.2 : 0);
    const rx = 5.6 + sq * 0.6 + (wilt ? 0.8 : 0);
    const cx = o.face === 'side' ? 10.5 : 10;
    // what grows out of the top, behind the seed
    const topY = Math.round(cy - ry);
    if (o.top === 'tip') p.set(Math.round(cx) + 1, topY, c('seed', 1)).set(Math.round(cx) + 2, topY - 1, c('leaf', 2));
    if (o.top === 'sprout') {
      const lean = wilt ? 3 : 0;
      p.line(cx, topY + 1, cx + 1 + lean, topY - 2, c('leaf', 2));
      blob(p, cx + 3 + lean, topY - 3 + (wilt ? 2 : 0), 2.6, 1.6, pal.r('leaf'), 1, 4);
      blob(p, cx - 2 + lean, topY - 2 + (wilt ? 2 : 0), 2.2, 1.4, pal.r('leaf'), 1, 3);
    }
    if (o.top === 'stem') p.rect(Math.round(cx) - 1, 0, 3, topY + 2, c('leaf', 2)).rect(Math.round(cx), 0, 1, topY + 2, c('leaf', 3));
    // sneakers: red with a white toe and sole, under the seed
    const shoe = (x: number, y: number, flip = false) => {
      const d = flip ? -1 : 1;
      p.rect(x - (flip ? 3 : 0), y, 4, 2, c('red', 2)).set(x + (flip ? -3 : 3), y, c('white', 2));
      p.rect(x - (flip ? 3 : 0), y + 2, 4, 1, c('white', 1)).set(x + d, y, c('red', 3));
    };
    const fy = Math.min(17, Math.round(cy + ry) - 1);
    if (o.feet === 0) (shoe(5, fy), shoe(11, fy));
    else if (o.feet === 1) (shoe(4, fy - 1), shoe(12, fy));
    else if (o.feet === 2) (shoe(6, fy), shoe(10, fy - 1));
    else if (o.feet === 'squat') (shoe(3, fy), shoe(13, fy));
    // the seed
    blob(p, cx, cy, rx, ry, pal.r('seed'), 0, 4, 1.15);
    // tucked feet kick up in front of the seed
    if (o.feet === 'tuck') (shoe(4, fy + 1), shoe(12, fy));
    p.set(Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.55), c('seed', 4)).set(Math.round(cx - rx * 0.45) + 1, Math.round(cy - ry * 0.55), c('seed', 4));
    // the face
    const ey = Math.round(cy - 1);
    const eyes = o.face === 'front' ? [Math.round(cx) - 2, Math.round(cx) + 2] : [Math.round(cx) + 1, Math.round(cx) + 4];
    for (const ex of eyes) {
      if (wilt) p.set(ex - 1, ey - 1, ink).set(ex + 1, ey + 1, ink).set(ex, ey, ink).set(ex + 1, ey - 1, ink).set(ex - 1, ey + 1, ink);
      else if (o.blink || o.mood === 'joy') p.rect(ex - 1, ey, 2, 1, ink);
      else p.rect(ex, ey - 1, 1, 2, ink).set(ex, ey - 1, c('white', 2));
    }
    const mx = o.face === 'front' ? Math.round(cx) : Math.round(cx) + 2;
    const my = ey + 3;
    if (o.mood === 'joy') p.rect(mx - 1, my - 1, 3, 2, c('red', 1)).set(mx - 2, my - 1, ink).set(mx + 2, my - 1, ink);
    else if (o.mood === 'ouch' || wilt) p.rect(mx - 1, my, 3, 1, ink).set(mx - 2, my + 1, ink).set(mx + 2, my + 1, ink);
    else p.set(mx - 1, my, ink).set(mx, my + 1, ink).set(mx + 1, my, ink);
    // rosy cheeks
    if (o.face === 'front' && !wilt) p.set(Math.round(cx) - 4, ey + 2, c('clay', 3)).set(Math.round(cx) + 4, ey + 2, c('clay', 3));
    if (o.mood === 'ouch') p.px.forEach((v, i) => v !== T && v !== ink && v !== c('white', 2) && (p.px[i] = c('red', 3)));
    return outline(p, ink);
  };

  /** The plant's top half: its stem, two leaves and the yellow bud of the song's cover. */
  const top = (sway: number, mood: 'still' | 'joy' | 'wilt' | 'ouch' = 'still'): Pixels => {
    const p = new Pixels(20, 20, T);
    const droop = mood === 'wilt';
    const bx = 10 + sway + (droop ? 3 : 0);
    const by = droop ? 10 : 5;
    // the stem, from the bottom block's top up to the bud
    for (let y = 19; y >= by + 3; y--) {
      const x = Math.round(10 + ((19 - y) / (19 - by)) * (bx - 10));
      p.set(x, y, c('leaf', 2)).set(x + 1, y, c('leaf', 1));
    }
    // two leaves, raised for joy
    const lift = mood === 'joy' ? -4 : droop ? 4 : 0;
    blob(p, 5 + sway / 2, 12 + lift, 4, 2, pal.r('leaf'), 1, 4);
    blob(p, 15 + sway / 2, 10 + lift, 4, 2, pal.r('leaf'), 1, 4);
    p.line(7 + sway / 2, 12 + lift, 10, 14, c('leaf', 1)).line(13 + sway / 2, 10 + lift, 10, 12, c('leaf', 1));
    // the bud, like a little lemon
    blob(p, bx, by, 3.2, 4, pal.r('seed'), 1, 4, 1.2);
    p.set(bx, by - 4, c('leaf', 2));
    if (mood === 'joy') for (const [x, y] of [[3, 3], [17, 2], [16, 6]]) p.set(x, y, c('sun', 3)).set(x - 1, y, c('sun', 1)).set(x + 1, y, c('sun', 1)).set(x, y - 1, c('sun', 1)).set(x, y + 1, c('sun', 1));
    if (mood === 'ouch') p.px.forEach((v, i) => v !== T && (p.px[i] = c('red', 3)));
    return outline(p, ink);
  };

  return { body, top };
}

const STAGES: [Stage, SeedPose['top']][] = [
  ['seed', 'tip'],
  ['sprout', 'sprout'],
  ['plant', 'stem'],
];

/** The seed's three stages, posed: front, blink, walk (side 0..2), hop, root (two), joy, hurt, wilt (two). */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const s = seedArt(pal);
  for (const [stage, top] of STAGES) {
    const k = (name: string) => `${stage}.${name}`;
    book.add(k('front'), s.body({ face: 'front', feet: 0, top }));
    book.add(k('blink'), s.body({ face: 'front', feet: 0, top, blink: true }));
    book.add(k('side0'), s.body({ face: 'side', feet: 0, top }));
    book.add(k('side1'), s.body({ face: 'side', feet: 1, top }));
    book.add(k('side2'), s.body({ face: 'side', feet: 2, top }));
    book.add(k('hop'), s.body({ face: 'side', feet: 'tuck', top, mood: 'joy', squash: -0.6 }));
    book.add(k('hopFront'), s.body({ face: 'front', feet: 'tuck', top, mood: 'joy', squash: -0.6 }));
    book.add(k('root0'), s.body({ face: 'front', feet: 'squat', top, squash: 1.2, blink: true }));
    book.add(k('root1'), s.body({ face: 'front', feet: 'squat', top, squash: 0.6 }));
    book.add(k('joy'), s.body({ face: 'front', feet: 'tuck', top, mood: 'joy', squash: -0.4 }));
    book.add(k('hurt'), s.body({ face: 'front', feet: 0, top, mood: 'ouch' }));
    book.add(k('wilt0'), s.body({ face: 'front', feet: 'squat', top, mood: 'wilt', squash: 0.4 }));
    book.add(k('wilt1'), s.body({ face: 'front', feet: 'none', top, mood: 'wilt', squash: 1.6 }));
  }
  book.add('top0', s.top(0));
  book.add('top1', s.top(-1));
  book.add('top2', s.top(1));
  book.add('topJoy', s.top(0, 'joy'));
  book.add('topWilt', s.top(0, 'wilt'));
  book.add('topOuch', s.top(0, 'ouch'));
  return book;
}

/** Everything else that moves. */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // Big loud things are solid (they push the seed away) and hurt to bump into.
  const hurt = (hp: number) => ({ chHitPt: Math.round(hp / 2), solid: 15 });

  // Raindrops: catch one and it is a drop of water (and a sip).
  const drop = (f: number) => {
    const p = P();
    const y = 6 + f;
    for (let k = 0; k < 6; k++) p.rect(10 - Math.floor(k / 2), y + k, 1 + Math.floor(k / 2) * 2, 1, c('water', 2));
    blob(p, 10, y + 8, 3.5, 3.5, pal.r('water'), 1, 3, 1.3);
    p.set(9, y + 7, c('white', 2));
    return done(p);
  };
  book.add('drop0', drop(0), { effect: 20, eamt: 1, chHitPt: 4, scorePts: 10 });
  book.add('drop1', drop(1), { effect: 20, eamt: 1, chHitPt: 4, scorePts: 10 });
  const splash = P();
  for (const [x, y] of [[5, 14], [8, 12], [12, 12], [15, 14], [10, 11]]) splash.set(x, y, c('water', 3)).set(x, y + 1, c('water', 2));
  splash.rect(4, 17, 13, 1, c('water', 1));
  book.add('splash', splash);

  // A beetle, side on, legs going.
  const beetle = (f: number) => {
    const p = P();
    for (let k = 0; k < 3; k++) p.line(5 + k * 4, 15, 4 + k * 4 + (f ? 2 : -1), 18, ink);
    blob(p, 9, 12, 7, 4.5, pal.r('beetle'), 0, 2, 1.2);
    p.line(9, 8, 9, 16, c('beetle', 0));
    blob(p, 16, 13, 2.6, 2.4, pal.r('crow'), 0, 2);
    p.line(17, 11, 19, 8, ink).set(17, 12, c('white', 2));
    return done(p);
  };
  book.add('beetle0', beetle(0), hurt(-4));
  book.add('beetle1', beetle(1), hurt(-4));
  // An ant, small and red, all business.
  const ant = (f: number) => {
    const p = P();
    for (let k = 0; k < 3; k++) p.line(7 + k * 3, 15, 6 + k * 3 + (f ? 2 : -1), 18, ink);
    blob(p, 5, 13, 2.6, 2.2, pal.r('red'), 0, 2);
    blob(p, 9.5, 13, 2, 1.8, pal.r('red'), 0, 2);
    blob(p, 14, 12, 2.6, 2.4, pal.r('red'), 0, 3);
    p.line(15, 10, 18, 6 + f, ink).set(15, 11, ink);
    return done(p);
  };
  book.add('ant0', ant(0), hurt(-3));
  book.add('ant1', ant(1), hurt(-3));
  // The crow: big, black and loud, flapping.
  const crow = (f: number) => {
    const p = P();
    blob(p, 9, 11, 6, 4, pal.r('crow'), 0, 2);
    blob(p, 15, 8, 3, 3, pal.r('crow'), 0, 2);
    p.rect(18, 8, 2, 1, c('sun', 0)).set(15, 7, c('white', 2));
    p.line(3, 11, 0, 14, c('crow', 0)).line(3, 12, 1, 15, c('crow', 0));
    if (f) for (let k = 0; k < 7; k++) p.line(7 + k, 9, 4 + k, 1 + k / 2, c('crow', 1));
    else for (let k = 0; k < 7; k++) p.line(7 + k, 13, 5 + k, 19 - k / 3, c('crow', 1));
    return done(p);
  };
  book.add('crow0', crow(0), hurt(-5));
  book.add('crow1', crow(1), hurt(-5));
  // The peacock, two blocks wide: A the tail fan (behind), B the head and the strut.
  const peaTail = (f: number) => {
    const p = P();
    for (let a = 0; a < 9; a++) {
      const ang = Math.PI * (0.55 + a * 0.06) + (f ? 0.03 : 0);
      for (let t = 2; t < 17; t++) p.set(19 + Math.cos(ang) * t, 15 - Math.sin(ang) * t * 0.95, c(t > 13 ? 'beetle' : 'leaf', t > 13 ? 2 : 1 + ((t + a) % 2)));
      const ex = 19 + Math.cos(ang) * 14;
      const ey = 15 - Math.sin(ang) * 13.3;
      p.disc(ex, ey, 1.4, c('blue', 2)).set(Math.round(ex), Math.round(ey), c('sun', 2));
    }
    blob(p, 17, 15, 4, 3, pal.r('blue'), 0, 3);
    return done(p);
  };
  const peaHead = (f: number) => {
    const p = P();
    blob(p, 3, 14, 5, 3.4, pal.r('blue'), 0, 3);
    p.rect(6, 5, 3, 9, c('blue', 2)).rect(7, 5, 1, 9, c('blue', 3));
    blob(p, 8, 4, 2.4, 2.2, pal.r('blue'), 1, 3);
    p.set(9, 3, c('white', 2)).rect(10, 4, 3, 1, c('sun', 0));
    for (const x of [6, 8, 10]) p.line(8, 2, x, 0, c('blue', 3));
    p.line(2, 17, 1 + (f ? 2 : 0), 19, c('sun', 0)).line(5, 17, 6 - (f ? 2 : 0), 19, c('sun', 0));
    if (f) micro(p, 11, 9, '!', c('red', 3));
    return done(p);
  };
  book.add('peaA0', peaTail(0), hurt(-5));
  book.add('peaA1', peaTail(1), hurt(-5));
  book.add('peaB0', peaHead(0), hurt(-5));
  book.add('peaB1', peaHead(1), hurt(-5));
  // The mole in his miner's helmet, lamp lit, digging for a miracle.
  const mole = (f: number) => {
    const p = P();
    blob(p, 9, 12, 7, 6, pal.r('fur'), 0, 2);
    blob(p, 15, 13, 3, 2.4, pal.r('pink'), 1, 3);
    p.rect(3, 4, 11, 3, c('sun', 1)).rect(4, 3, 9, 1, c('sun', 2)).disc(13, 5, 1.6, c('white', 2));
    if (f) p.line(15, 5, 19, 3, c('sun', 3)).line(15, 6, 19, 7, c('sun', 3));
    p.set(12, 10, ink).rect(14 + f, 17, 4, 2, c('pink', 2)).rect(2, 17, 4, 2, c('pink', 2));
    return done(p);
  };
  book.add('mole0', mole(0), hurt(-5));
  book.add('mole1', mole(1), hurt(-5));
  // An earthworm, minding its own business.
  const worm = (f: number) => {
    const p = P();
    for (let x = 3; x < 17; x++) p.rect(x, 13 + Math.round(Math.sin(x / 2 + f * 1.6) * 1.5), 1, 3, c('pink', x % 3 ? 2 : 1));
    p.set(16, 13 + Math.round(Math.sin(8 + f * 1.6) * 1.5), ink);
    return done(p);
  };
  book.add('worm0', worm(0), hurt(-1));
  book.add('worm1', worm(1), hurt(-1));
  // A pebble rolling down the mountain.
  const pebble = (f: number) => {
    const p = P();
    blob(p, 10, 12, 6, 5.5, pal.r('stone'), 1, 4);
    const a = f * 1.4;
    p.line(10, 12, 10 + Math.cos(a) * 4, 12 + Math.sin(a) * 4, c('stone', 0)).set(7, 9, c('stone', 5));
    return done(p);
  };
  book.add('pebble0', pebble(0), hurt(-5));
  book.add('pebble1', pebble(1), hurt(-5));
  const puff = P();
  for (const [x, y, r] of [[6, 14, 3], [12, 13, 3.5], [9, 10, 2.5]]) blob(puff, x, y, r, r * 0.8, pal.r('dust'), 1, 3);
  book.add('dust', puff);
  // The eagle: wide wings, a scream you can see.
  const eagle = (f: number) => {
    const p = P();
    for (let k = 0; k < 10; k++) {
      const y = f ? 8 - Math.round(k * 0.5) : 9 + Math.round(k * 0.4);
      p.rect(9 - k, y, 1, 3, c('bark', k > 6 ? 0 : 1)).rect(10 + k, y, 1, 3, c('bark', k > 6 ? 0 : 1));
    }
    blob(p, 10, 10, 3.5, 4, pal.r('bark'), 0, 2);
    blob(p, 10, 6, 2.4, 2.2, pal.r('white'), 0, 2);
    p.set(10, 8, c('sun', 1)).set(9, 6, ink).set(11, 6, ink);
    p.rect(8, 14, 5, 2, c('white', 1));
    return done(p);
  };
  book.add('eagle0', eagle(0), hurt(-6));
  book.add('eagle1', eagle(1), hurt(-6));
  // A white goat with her horns, third from the left in another song. Friendly.
  const goat = (f: number) => {
    const p = P();
    const leg = (x: number, dx: number) => p.line(x, 14, x + dx, 18, c('white', 0));
    leg(5, f ? 1 : 0);
    leg(8, f ? -1 : 0);
    leg(12, f ? 1 : 0);
    leg(15, f ? -1 : 0);
    blob(p, 10, 11, 7, 4, pal.r('white'), 0, 2);
    blob(p, 16, 7, 3, 2.6, pal.r('white'), 0, 2);
    p.line(15, 4, 13, 1, c('stone', 2)).line(17, 4, 16, 1, c('stone', 2));
    p.set(17, 7, ink).line(17, 10, 17, 12, c('white', 0));
    return done(p);
  };
  book.add('goat0', goat(0));
  book.add('goat1', goat(1));
  // A squirrel, tail up, chattering.
  const squirrel = (f: number) => {
    const p = P();
    for (let k = 0; k < 9; k++) blob(p, 4 + Math.sin(k / 2) * 2, 15 - k * 1.4, 2.6, 1.6, pal.r('clay'), 0, 2);
    blob(p, 11, 14, 4, 3.5, pal.r('clay'), 0, 3);
    blob(p, 15, 10, 2.8, 2.6, pal.r('clay'), 0, 3);
    p.set(16, 9, ink).set(14, 7, c('clay', 1)).line(13, 18, 12 + f, 19, c('clay', 0)).line(9, 18, 8 - f, 19, c('clay', 0));
    if (f) micro(p, 16, 1, '!', c('red', 3));
    return done(p);
  };
  book.add('squirrel0', squirrel(0), hurt(-4));
  book.add('squirrel1', squirrel(1), hurt(-4));
  // Birds of the air, come to lodge in the branches: a hello is worth points, and off they go.
  const bird = (f: number, flying: boolean) => {
    const p = P();
    blob(p, 10, 12, 4, 3.4, pal.r('blue'), 1, 3);
    blob(p, 13, 9, 2.4, 2.2, pal.r('blue'), 1, 3);
    p.rect(15, 9, 2, 1, c('sun', 1)).set(13, 8, ink);
    blob(p, 9, 13, 2.4, 1.6, pal.r('white'), 1, 2);
    if (flying) for (let k = 0; k < 5; k++) p.line(8 + k, 11, 5 + k, f ? 4 + k / 2 : 17 - k / 2, c('blue', 2));
    else p.line(9, 15, 9, 18, c('sun', 0)).line(11, 15, 11, 18, c('sun', 0));
    if (!flying && f) micro(p, 14, 1, '~', c('white', 2));
    return done(p);
  };
  book.add('bird0', bird(0, false), { scorePts: 100 });
  book.add('bird1', bird(1, false), { scorePts: 100 });
  book.add('birdOff0', bird(0, true));
  book.add('birdOff1', bird(1, true));
  // A bee, fuzzy and busy.
  const bee = (f: number) => {
    const p = P();
    blob(p, 10, 11, 5, 3.6, pal.r('sun'), 0, 2);
    for (const x of [8, 11]) p.rect(x, 8, 2, 7, ink);
    p.set(15, 10, ink).line(5, 11, 3, 12, ink);
    blob(p, 9, f ? 5 : 7, 3, 2, pal.r('white'), 1, 2);
    return done(p);
  };
  book.add('bee0', bee(0), hurt(-3));
  book.add('bee1', bee(1), hurt(-3));
  return book;
}
