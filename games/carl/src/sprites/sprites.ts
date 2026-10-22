// CARL.CBL and CARL.MBL: Carl (a housefly with big red eyes and a smug grin, wings a blur) and
// everything that's after him or in his way: the dish towel snapping, a hand in the snack bowl,
// the old clap, a rolled-up magazine, Teddy the corgi snapping at flies, Loaf #13 on the coffee
// table, ears (his on the pillow, Teddy's in the dog bed), a slipper in the dark, the ceiling fan,
// sage smoke and oil mist, the mop and the man mopping, a robin, wasps, the begging hand at the
// window, a frog and its tongue, a dragonfly, a spider, the third goat, the mustard seed and
// Brother Camel (cameos from the Bard's other songs), and Carl's own barrel roll and buzz. Every
// sprite is drawn from shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { EARS } from '../ids';

export { T, outline };

export interface FlyPose {
  view: 'front' | 'side';
  /** Wings: 0 up, 1 down (a blur either way). */
  wing?: number;
  mood?: 'smug' | 'blink' | 'grin' | 'ouch' | 'splat' | 'buzz';
  /** Squashed flat (the splat). */
  flat?: number;
}

/** Carl's look, in the pal's ramps. */
export function flyArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const R = pal.r;

  const wings = (p: Pixels, pts: [number, number, number, number, number][]) => {
    for (const [cx, cy, rx, ry, tilt] of pts)
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          const u = dx * Math.cos(tilt) + dy * Math.sin(tilt);
          const v = -dx * Math.sin(tilt) + dy * Math.cos(tilt);
          const d = (u / rx) ** 2 + (v / ry) ** 2;
          if (d > 1) continue;
          p.set(x, y, d > 0.7 ? c('wing', 0) : (x + y) % 3 === 0 ? c('wing', 1) : c('wing', 2));
        }
  };

  const body = (o: FlyPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const mood = o.mood ?? 'smug';
    const w = o.wing ?? 0;
    if (o.view === 'front') {
      // wings out to the sides, behind
      if (w === 0)
        wings(p, [
          [4, 6, 5, 2.6, -0.7],
          [16, 6, 5, 2.6, 0.7],
        ]);
      else
        wings(p, [
          [3.5, 11, 5, 2.4, 0.3],
          [16.5, 11, 5, 2.4, -0.3],
        ]);
      // legs
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.line(10 + s * 2, 14 + k, 10 + s * (5 + k), 18 + (k % 2), ink);
      blob(p, 10, 14, 4.5, 4.5, R('fly'), 0, 3);
      for (let y = 14; y < 18; y += 2) p.line(7, y, 13, y, c('fly', 4));
      blob(p, 10, 8.5, 6, 4.6, R('fly'), 0, 3);
      // the eyes: big, red, faceted
      for (const ex of [6.2, 13.8]) {
        blob(p, ex, 7.4, 3.6, 3.6, R('eye'), 0, 3);
        if (mood === 'blink' || mood === 'grin') p.rect(ex - 3, 4, 7, 3, c('fly', 1));
        if (mood === 'ouch' || mood === 'splat') (p.line(ex - 2, 5.5, ex + 2, 9.5, ink), p.line(ex + 2, 5.5, ex - 2, 9.5, ink));
        else if (mood !== 'blink') p.set(ex - 1, 6, c('white', 3)).set(ex - 1.5, 6.5, c('white', 2));
        for (let k = 0; k < 4; k++) p.set(ex - 1 + (k % 2) * 2, 8 + (k >> 1), c('eye', 1));
      }
      // the smug grin (a smirk up on one side), or a buzz
      if (mood === 'buzz') {
        p.disc(10, 12, 1.6, ink).set(10, 12, c('eye', 0));
      } else if (mood === 'ouch' || mood === 'splat') {
        p.line(8, 13, 12, 12, ink);
      } else {
        p.line(7, 11, 12, 12, ink).line(12, 12, 14, 10, ink);
        p.rect(8, 12, 4, 1, c('white', 3));
        if (mood === 'grin') p.rect(8, 12, 5, 1, c('white', 3)).set(13, 11, c('white', 3));
      }
      // antennae
      p.set(8, 3, ink).set(7, 2, ink).set(12, 3, ink).set(13, 2, ink);
    } else {
      // facing right: abdomen, thorax, head, the big eye in front
      for (let k = 0; k < 3; k++) p.line(9 + k * 2, 13, 8 + k * 3, 18 - (k % 2), ink);
      blob(p, 6.5, 12, 5.4, 3.6, R('fly'), 0, 3);
      for (const x of [4, 6, 8]) p.line(x, 10, x, 14, c('fly', 4));
      blob(p, 11, 11, 3.6, 3.6, R('fly'), 0, 3);
      blob(p, 15, 10.5, 3.4, 3.6, R('fly'), 0, 3);
      blob(p, 16.2, 9, 3.2, 3.4, R('eye'), 0, 3);
      if (mood === 'ouch' || mood === 'splat') (p.line(14.5, 7, 17.5, 10, ink), p.line(17.5, 7, 14.5, 10, ink));
      else if (mood === 'blink') p.rect(13.5, 6, 6, 2, c('fly', 1));
      else p.set(16, 8, c('white', 3));
      if (mood === 'buzz') p.disc(18, 13, 1.2, ink);
      else p.line(15, 13, 18, 13, ink).line(18, 13, 19, 12, ink).set(16, 14, c('white', 3)).set(17, 14, c('white', 3));
      p.set(15, 6, ink).set(14, 5, ink);
      // wings: up and back, or flat back
      if (w === 0)
        wings(p, [
          [7, 5, 6, 2.6, 0.5],
          [9, 6, 5, 2.2, 0.9],
        ]);
      else
        wings(p, [
          [5, 9, 6, 2.2, -0.15],
          [6, 10, 5, 2, 0.1],
        ]);
    }
    if (o.flat) {
      const src = p.px.slice();
      p.px.fill(T);
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (src[y * 20 + x] !== T) p.set(x, Math.round(19 - (19 - y) * (1 - o.flat * 0.7)), src[y * 20 + x]);
    }
    if (mood === 'ouch') p.px.forEach((v, i) => v !== T && v !== ink && v !== c('white', 3) && v < 255 && R('fly').includes(v) && (p.px[i] = c('red', 2)));
    return outline(p, ink);
  };
  return { body };
}

/** Carl's poses: front (wings up and down), a smug blink, flying sideways, hurt, splat, buzzing, grinning. */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const a = flyArt(pal);
  book.add('front0', a.body({ view: 'front', wing: 0 }));
  book.add('front1', a.body({ view: 'front', wing: 1 }));
  book.add('blink', a.body({ view: 'front', wing: 0, mood: 'blink' }));
  book.add('grin', a.body({ view: 'front', wing: 1, mood: 'grin' }));
  book.add('side0', a.body({ view: 'side', wing: 0 }));
  book.add('side1', a.body({ view: 'side', wing: 1 }));
  book.add('hurt', a.body({ view: 'front', wing: 1, mood: 'ouch' }));
  book.add('splat0', a.body({ view: 'front', wing: 1, mood: 'splat', flat: 0.5 }));
  book.add('splat1', a.body({ view: 'front', wing: 1, mood: 'splat', flat: 1 }));
  book.add('buzz0', a.body({ view: 'front', wing: 0, mood: 'buzz' }));
  book.add('buzz1', a.body({ view: 'front', wing: 1, mood: 'buzz' }));
  book.add('rollSide', a.body({ view: 'side', wing: 1, mood: 'grin' }));
  return book;
}

/** Everything else that moves. */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const R = pal.r;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  /** A hazard: hurts on touch and shoves Carl back. */
  const hurt = (hp: number, solid = 15) => ({ chHitPt: -hp, solid });

  // ---- swatting things: they stand in one place and swing; Carl's barrel roll makes them miss ----
  // the dish towel, twisted into a rat tail, cocked and snapped
  const towel = (f: number) => {
    const p = P();
    const pts = f === 0 ? Array.from({ length: 16 }, (_, k) => [3 + k * 0.4, 18 - k] as const) : Array.from({ length: 18 }, (_, k) => [1 + k, 12 + Math.sin(k / 2.5) * 3] as const);
    pts.forEach(([x, y], k) => {
      const w = k < 6 ? 2 : k < 12 ? 1.4 : 0.8;
      p.disc(x, y, w, c(k % 4 < 2 ? 'red' : 'white', k % 4 < 2 ? 2 : 3));
    });
    if (f) for (const [x, y] of [[18, 7], [19, 16], [16, 5]]) p.set(x, y, c('white', 3));
    return done(p);
  };
  book.add('towel0', towel(0), hurt(10));
  book.add('towel1', towel(1), hurt(10));
  const miss = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + f * 0.5;
      p.line(10 + Math.cos(a) * 4, 10 + Math.sin(a) * 4, 10 + Math.cos(a) * (8 + f), 10 + Math.sin(a) * (8 + f), c('gold', 3));
    }
    micro(p, 2, 8, 'MISS', c('white', 3));
    return done(p);
  };
  book.add('miss0', miss(0));
  book.add('miss1', miss(1));
  // a hand in the snack bowl, reaching down
  const reach = (f: number) => {
    const p = P();
    p.rect(6, 0, 9, 5, c('shirt', 2)).rect(6, 4, 9, 1, c('shirt', 3));
    blob(p, 10.5, 9, 4.6, 4, R('skin'), 0, 3);
    const spread = f ? 0.4 : 1.4;
    for (let k = 0; k < 4; k++) p.line(7 + k * 2.4, 11, 7 + k * 2.4 + (k - 1.5) * spread, 17 - (f ? 2 : 0), c('skin', k % 2 ? 2 : 1));
    if (f) blob(p, 10, 18, 3, 1.6, R('chip'), 1, 3);
    return done(p);
  };
  book.add('reach0', reach(0), hurt(8));
  book.add('reach1', reach(1), hurt(8));
  // the old clap: a big flat hand seen edge-on, open at the side of its cell, or slammed to the middle
  const clap = (shut: boolean) => {
    const p = P();
    const x = shut ? 14 : 1;
    p.rect(x, 2, 5, 16, c('skin', 2)).rect(x, 2, 1, 16, c('skin', 3)).rect(x + 4, 2, 1, 16, c('skin', 1));
    for (let y = 3; y < 10; y += 2) p.set(x + 4, y, c('skin', 0));
    p.rect(x + 1, 0, 3, 3, c('skin', 2)).rect(x - 1, 14, 2, 4, c('skin', 2));
    if (shut) for (const [dx, dy] of [[-2, 4], [-3, 10], [-2, 16]]) p.line(x + dx, dy, x + dx - 3, dy, c('white', 3));
    return done(p);
  };
  book.add('clap0', clap(false), hurt(12));
  book.add('clap1', clap(true), hurt(12));
  book.add('clapB0', clap(false).flipX(), hurt(12));
  book.add('clapB1', clap(true).flipX(), hurt(12));
  // a rolled-up magazine, raised and slapped down
  const swatter = (f: number) => {
    const p = P();
    const ang = f ? 0.15 : -1.1;
    for (let t = 0; t < 17; t++) {
      const x = 2 + Math.cos(ang) * t;
      const y = 10 + Math.sin(ang) * t;
      p.disc(x, y, 2.2, c(t % 5 < 2 ? 'shirt' : 'white', 2));
    }
    if (f) for (const [x, y] of [[8, 16], [13, 17], [17, 15]]) p.set(x, y, c('white', 3)).set(x, y + 1, c('white', 2));
    return done(p);
  };
  book.add('swat0', swatter(0), hurt(12));
  book.add('swat1', swatter(1), hurt(12));

  // ---- Teddy the corgi, snapping at flies ----
  const corgi = (f: number) => {
    const p = P();
    blob(p, 9, 13, 7, 4, R('fur'), 1, 3);
    blob(p, 14, 7 - f, 3.6, 3.4, R('fur'), 1, 3);
    // the ears: the right one stands taller
    p.line(12, 4 - f, 11, 0, c('fur', 2)).line(13, 4 - f, 12, 0, c('fur', 2)).line(16, 4 - f, 18, 1 - f, c('fur', 2)).line(15, 4 - f, 17, 1 - f, c('fur', 2));
    p.rect(14, 8 - f, 3, 3, c('white', 3)).set(16, 6 - f, ink).set(18, 8 - f, ink);
    if (f) p.line(16, 10, 19, 9, c('red', 2)).line(16, 11, 19, 11, c('white', 3));
    p.rect(5, 15, 7, 2, c('white', 3));
    for (const x of [4, 7, 11, 13]) p.rect(x, 16, 2, 4 - f * 2, c('fur', 1));
    p.line(2, 11, 0, 9 - f, c('fur', 2));
    return done(p);
  };
  book.add('teddy0', corgi(0), hurt(8));
  book.add('teddy1', corgi(1), hurt(8));

  // ---- cameos: Loaf #13, the third goat, the mustard seed, Brother Camel ----
  const loaf = (f: number) => {
    const p = P();
    blob(p, 10, 13 - f, 8.4, 6, R('chip'), 0, 3, 1.1);
    for (const u of [5, 10, 15]) p.line(u - 2, 8 - f, u + 1, 10 - f, c('daisy', 2));
    p.set(7, 13 - f, ink).set(13, 13 - f, ink);
    if (f) p.disc(10, 16 - f, 1.4, ink);
    else p.line(8, 16, 12, 16, ink);
    p.set(5, 15 - f, c('pink', 2)).set(15, 15 - f, c('pink', 2));
    return done(p);
  };
  book.add('loaf0', loaf(0), { scorePts: 250 });
  book.add('loaf1', loaf(1), { scorePts: 250 });
  const goat = (f: number) => {
    const p = P();
    for (const [x, d] of [[5, 1], [8, -1], [12, 1], [15, -1]]) p.line(x, 14, x + (f ? d : 0), 18, c('white', 0));
    blob(p, 10, 11, 7, 4, R('white'), 1, 3);
    const hy = f ? 12 : 7;
    blob(p, 16, hy, 3, 2.6, R('white'), 1, 3);
    p.line(15, hy - 3, 13, hy - 6, c('grey', 2)).line(17, hy - 3, 16, hy - 6, c('grey', 2)).set(17, hy, ink);
    return done(p);
  };
  book.add('goat0', goat(0));
  book.add('goat1', goat(1));
  const seed = (f: number) => {
    const p = P();
    const y = f ? 10 : 13;
    p.rect(7, y + 5, 3, 2, c('red', 2)).rect(11, y + 5, 3, 2, c('red', 2)).set(9, y + 5, c('white', 3)).set(13, y + 5, c('white', 3));
    blob(p, 10, y, 4, 4.6, R('gold'), 0, 3, 1.2);
    p.set(9, y - 1, ink).set(12, y - 1, ink).set(10, y + 2, ink).set(11, y + 2, ink);
    p.line(11, y - 5, 12, y - 7, c('leaf', 2));
    return done(p);
  };
  book.add('seed0', seed(0), { scorePts: 250 });
  book.add('seed1', seed(1), { scorePts: 250 });
  const camelA = (f: number) => {
    const p = P();
    blob(p, 11, 14, 9, 4.6, R('ochre'), 0, 2);
    blob(p, 8, 9 + f * 0.3, 4, 3.4, R('ochre'), 0, 2);
    blob(p, 15, 10 - f * 0.3, 3.6, 3, R('ochre'), 0, 2);
    p.rect(3, 18, 16, 2, c('ochre', 0));
    return done(p);
  };
  const camelB = (f: number) => {
    const p = P();
    p.rect(0, 13, 8, 5, c('ochre', 1));
    for (let k = 0; k < 8; k++) p.rect(4 + k, 12 - k * 1.2 + (f ? 1 : 0), 3, 4, c('ochre', 1));
    blob(p, 13, 3 + f, 4, 2.6, R('ochre'), 0, 2);
    p.set(14, 2 + f, ink).line(15, 5 + f, 17, 5 + f, c('ochre', 0));
    if (f) micro(p, 2, 1, 'Z', c('white', 3));
    return done(p);
  };
  book.add('camelA0', camelA(0));
  book.add('camelA1', camelA(1));
  book.add('camelB0', camelB(0));
  book.add('camelB1', camelB(1));

  // ---- ears: his on the pillow, Teddy's in the dog bed ----
  const ear = (dog: boolean, state: 'asleep' | 'twitch0' | 'twitch1' | 'zzz') => {
    const p = P();
    const tw = state === 'twitch1' ? 2 : state === 'twitch0' ? -1 : 0;
    if (dog) {
      for (let y = 2; y < 18; y++) {
        const w = Math.round((y - 2) * 0.35) + 1;
        for (let x = 10 - w + tw; x <= 10 + w + tw; x++) p.set(x + Math.round((18 - y) * 0.15 * tw), y, c(Math.abs(x - 10 - tw) < w - 1 ? 'pink' : 'fur', 2));
      }
    } else {
      blob(p, 10 + tw * 0.5, 11, 5, 7, R('skin'), 1, 3);
      blob(p, 10.5 + tw * 0.5, 11, 2.6, 4.6, R('skin'), 0, 1);
      p.line(10 + tw, 8, 11 + tw, 14, c('skin', 0));
    }
    if (state === 'twitch0' || state === 'twitch1') for (const [x, y] of [[2, 4], [17, 5], [3, 15], [18, 14]]) p.line(x, y, x + (x < 10 ? -2 : 2), y, c('white', 3));
    if (state === 'zzz') micro(p, 13, 0, 'Z', c('white', 3));
    return done(p);
  };
  // asleep ears (harmless, solid-free); a twitching ear counts when Carl flies in ("near my ear")
  book.add('ear', ear(false, 'asleep'));
  book.add('earT0', ear(false, 'twitch0'), { effect: EARS, eamt: 1, scorePts: 200 });
  book.add('earT1', ear(false, 'twitch1'), { effect: EARS, eamt: 1, scorePts: 200 });
  book.add('earZ', ear(false, 'zzz'));
  book.add('dogEar', ear(true, 'asleep'));
  book.add('dogT0', ear(true, 'twitch0'), { effect: EARS, eamt: 1, scorePts: 200 });
  book.add('dogT1', ear(true, 'twitch1'), { effect: EARS, eamt: 1, scorePts: 200 });
  book.add('dogZ', ear(true, 'zzz'));
  const snore = P();
  micro(snore, 6, 6, 'Z', c('white', 3), 2);
  book.add('snore', done(snore), { scorePts: 20 });

  // ---- the bedroom in the dark ----
  const slipper = (f: number) => {
    const p = P();
    const s = new Pixels(20, 20, T);
    blob(s, 10, 12, 8, 3.6, R('purple'), 0, 2);
    s.rect(4, 8, 8, 4, c('white', 3)).rect(3, 15, 15, 1, c('ink', 1));
    if (f) p.map((x, y) => s.get(y, 19 - x));
    else p.blit(s, 0, 0, T);
    return done(p);
  };
  book.add('slipper0', slipper(0), hurt(10, 0));
  book.add('slipper1', slipper(1), hurt(10, 0));
  const fan = (f: number) => {
    const p = P();
    p.rect(9, 0, 2, 6, c('steel', 1));
    blob(p, 10, 7, 3, 2, R('wood'), 1, 3);
    const span = f ? 9 : 4;
    p.rect(10 - span, 8, span * 2, 2, c('wood', 2)).rect(10 - span, 8, span * 2, 1, c('wood', 3));
    return done(p);
  };
  book.add('fan0', fan(0), hurt(14));
  book.add('fan1', fan(1), hurt(14));

  // ---- the living room in gloom ----
  const puff = (ramp: string, f: number) => {
    const p = P();
    for (const [x, y, r] of [[7, 12, 5], [12, 9, 5.5], [14, 14, 4], [8, 7, 3.4]] as const) blob(p, x + f, y - f, r, r * 0.8, R(ramp), 0, 2);
    return done(p);
  };
  book.add('sage0', puff('smoke', 0), hurt(4, 0));
  book.add('sage1', puff('smoke', 1), hurt(4, 0));
  book.add('mist0', puff('purple', 0), hurt(4, 0));
  book.add('mist1', puff('purple', 1), hurt(4, 0));
  const mop = (f: number) => {
    const p = P();
    p.line(10 + f * 2, 0, 10, 10, c('wood', 2)).line(11 + f * 2, 0, 11, 10, c('wood', 3));
    for (let k = 0; k < 9; k++) p.line(10, 10, 4 + k * 1.5 + (f ? 1 : -1), 19, c('white', 1 + (k % 3)));
    return done(p);
  };
  book.add('mop0', mop(0), hurt(8));
  book.add('mop1', mop(1), hurt(8));
  // the man mopping (two blocks tall), gloomy, in a bathrobe
  const mopperA = (f: number) => {
    const p = P();
    blob(p, 10, 12, 6, 7, R('skin'), 1, 3);
    blob(p, 10, 6, 6.5, 3.6, R('hair'), 0, 2);
    p.rect(6, 12, 3, 1, ink).rect(12, 12, 3, 1, ink).rect(6, 13, 3, 1, c('skin', 0)).rect(12, 13, 3, 1, c('skin', 0));
    p.rect(8, 16 + f, 5, 1, ink);
    return done(p);
  };
  const mopperB = (f: number) => {
    const p = P();
    for (let y = 0; y < 18; y++) p.rect(4 - Math.floor(y / 6), y, 12 + Math.floor(y / 3), 1, c('purple', y % 6 === 0 ? 1 : 2));
    p.rect(9, 4, 2, 10, c('purple', 0)).rect(14, 4 + f, 4, 3, c('skin', 2)).line(17, 0, 17, 20, c('wood', 2));
    p.rect(5, 18, 4, 2, c('grey', 1)).rect(11, 18, 4, 2, c('grey', 1));
    return done(p);
  };
  book.add('mopperA0', mopperA(0), hurt(6));
  book.add('mopperA1', mopperA(1), hurt(6));
  book.add('mopperB0', mopperB(0), hurt(6));
  book.add('mopperB1', mopperB(1), hurt(6));

  // ---- the backyard ----
  const bird = (f: number) => {
    const p = P();
    blob(p, 9, 11, 6, 4, R('earth'), 1, 3);
    blob(p, 9, 13, 4, 2.4, R('red'), 1, 3);
    blob(p, 15, 8, 3, 3, R('earth'), 1, 3);
    p.rect(17, 8, 3, 1, c('ochre', 2)).set(16, 7, ink).line(3, 11, 0, 12, c('earth', 1));
    if (f) for (let k = 0; k < 6; k++) p.line(6 + k, 10, 4 + k, 2 + k / 2, c('earth', k > 3 ? 1 : 2));
    else for (let k = 0; k < 6; k++) p.line(6 + k, 12, 4 + k, 18 - k / 2, c('earth', k > 3 ? 1 : 2));
    return done(p);
  };
  book.add('bird0', bird(0), hurt(10));
  book.add('bird1', bird(1), hurt(10));
  const wasp = (f: number) => {
    const p = P();
    if (f) blob(p, 9, 5, 4, 2, R('wing'), 1, 2);
    else blob(p, 8, 8, 4, 1.6, R('wing'), 1, 2);
    blob(p, 7, 12, 5, 3, R('gold'), 0, 2);
    for (const x of [5, 8]) p.line(x, 9, x, 15, ink);
    p.line(2, 12, 0, 13, ink);
    blob(p, 14, 11, 3, 2.6, R('gold'), 0, 2);
    p.set(15, 10, ink).line(16, 8, 18, 6, ink);
    return done(p);
  };
  book.add('wasp0', wasp(0), hurt(8, 0));
  book.add('wasp1', wasp(1), hurt(8, 0));
  // the hand out the window, waving him out ("I've begged him to leave")
  const wave = (f: number) => {
    const p = P();
    const tilt = f ? 0.35 : -0.35;
    blob(p, 10, 12, 4.6, 4.2, R('skin'), 1, 3);
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + tilt + (k - 1.5) * 0.28;
      p.line(10 + Math.cos(a) * 3, 10 + Math.sin(a) * 3, 10 + Math.cos(a) * 9, 10 + Math.sin(a) * 9, c('skin', 2));
    }
    p.line(14, 13, 18, 10 + f * 2, c('skin', 2)).rect(7, 16, 7, 4, c('shirt', 2));
    for (const [x, y] of f ? [[2, 4], [3, 8]] : [[17, 3], [18, 7]]) p.line(x, y, x + 1, y + 2, c('white', 3));
    return done(p);
  };
  book.add('wave0', wave(0), hurt(6));
  book.add('wave1', wave(1), hurt(6));

  // ---- the wild ----
  const frog = (f: number) => {
    const p = P();
    blob(p, 10, 13, 8, 5 - f, R('leaf'), 1, 3);
    blob(p, 6, 8 - f, 2.6, 2.6, R('leaf'), 1, 3);
    blob(p, 14, 8 - f, 2.6, 2.6, R('leaf'), 1, 3);
    p.disc(6, 7 - f, 1.2, c('gold', 3)).disc(14, 7 - f, 1.2, c('gold', 3)).set(6, 7 - f, ink).set(14, 7 - f, ink);
    p.line(5, 14, 15, 14, ink);
    if (f) p.rect(9, 14, 3, 2, c('pink', 2));
    p.rect(2, 17, 5, 2, c('leaf', 1)).rect(13, 17, 5, 2, c('leaf', 1));
    return done(p);
  };
  book.add('frog0', frog(0), hurt(10));
  book.add('frog1', frog(1), hurt(10));
  // the frog's tongue, flicking up from where the frog sits
  const tongue = (f: number) => {
    const p = P();
    p.rect(9, f ? 2 : 10, 2, f ? 18 : 10, c('pink', 1)).rect(9, f ? 2 : 10, 1, f ? 18 : 10, c('pink', 2));
    p.disc(10, f ? 2 : 10, 2.4, c('pink', 2));
    return done(p);
  };
  book.add('tongue0', tongue(0), hurt(16, 0));
  book.add('tongue1', tongue(1), hurt(16, 0));
  const dragonfly = (f: number) => {
    const p = P();
    for (let x = 2; x < 13; x++) p.set(x, 11, c('shirt', x % 2 ? 2 : 3));
    blob(p, 14, 11, 2.6, 2, R('shirt'), 1, 3);
    blob(p, 17, 10.5, 2, 2, R('leaf'), 1, 3);
    for (const [dy, s] of [[-1, 1], [1, -1]] as const) {
      blob(p, 12 - (f ? 2 : 0), 11 + dy * (f ? 5 : 3), 5, 1.6, R('wing'), 1, 2);
      blob(p, 15, 11 + s * (f ? 3 : 5), 4, 1.4, R('wing'), 1, 2);
    }
    return done(p);
  };
  book.add('dragon0', dragonfly(0), hurt(10, 0));
  book.add('dragon1', dragonfly(1), hurt(10, 0));
  const spider = (f: number) => {
    const p = P();
    p.line(10, 0, 10, 8, c('white', 2));
    blob(p, 10, 12, 4, 4, R('ink'), 0, 1);
    blob(p, 10, 8, 2.6, 2.4, R('ink'), 0, 1);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) p.line(10 + s * 3, 10 + k * 1.5, 10 + s * 8, 8 + k * 3 + (f ? (k % 2 ? 1 : -1) : 0), ink);
    p.set(9, 8, c('eye', 2)).set(11, 8, c('eye', 2));
    return done(p);
  };
  book.add('spider0', spider(0), hurt(10, 0));
  book.add('spider1', spider(1), hurt(10, 0));

  // ---- Carl's own moves ----
  // the barrel roll's whoosh: swirl lines round where he was
  const whoosh = (f: number) => {
    const p = P();
    for (let a = 0; a < Math.PI * 1.6; a += 0.05) {
      const r = 6 + a * 1.4;
      p.set(10 + Math.cos(a + f * 1.5) * r * 0.9, 10 + Math.sin(a + f * 1.5) * r * 0.6, c('wing', 2));
    }
    return p;
  };
  book.add('whoosh0', whoosh(0));
  book.add('whoosh1', whoosh(1));
  // the buzz: sound waves and a BZZ
  const buzz = (f: number) => {
    const p = P();
    for (let k = 0; k < 3; k++) for (let a = -0.9; a <= 0.9; a += 0.06) p.set(4 + Math.cos(a) * (4 + k * 4 + f), 10 + Math.sin(a) * (4 + k * 4 + f), c('gold', 3 - k));
    micro(p, 1, 1 + f * 12, 'BZZ', c('white', 3));
    return p;
  };
  book.add('buzz0', buzz(0));
  book.add('buzz1', buzz(1));
  return book;
}
