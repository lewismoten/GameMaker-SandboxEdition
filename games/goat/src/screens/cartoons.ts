// The cartoons (FLIs drawn here, frame by frame, with the game's own sprites in its own
// palettes): the story's night, told in three scenes (the star rising over Bethlehem, the
// angels and the shepherds, the goat nobody painted). Each reel opens on black and fades
// in and out by palette (kit/reel.ts), and only what moves is stored in each frame.
import { Pixels } from '../../../kit/pixels';
import { Reel } from '../../../kit/reel';
import { blob } from '../../../snowbound/src/art/draw';
import { centered, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette, type Pal } from '../art/pal';
import { bigStar, H, skyline, stars, twinkle, W } from './night';
import { CARDS } from './text';

/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** The goat's sprites (the .CBL's pictures). */
  goat: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture. */
  block: (name: string) => Pixels;
}

/** Gives every drawn pixel's empty neighbors the outline color. */
function outline(p: Pixels, ink: number): Pixels {
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
        const v = p.get(x + dx, y + dy);
        return v >= 0 && src[(y + dy) * p.w + x + dx] !== T && v !== ink;
      });
      if (near) p.px[y * p.w + x] = ink;
    }
  return p;
}

/** An angel in a white robe with a gold halo, wings up (f 0) or down (f 1), a trumpet raised. */
export function angel(pal: Pal, f: number): Pixels {
  const c = pal.c;
  const p = new Pixels(28, 30, T);
  // wings behind
  for (const side of [-1, 1])
    for (let k = 0; k < 11; k++) {
      const x = 14 + side * (4 + k);
      const tip = f ? 12 + Math.round(k * 0.7) : 12 - Math.round(k * 0.8);
      for (let y = Math.min(tip, 13); y <= Math.max(tip + 4 - Math.round(k / 4), 14); y++) p.set(x, y, c('cloth', k > 7 ? 1 : (y + k) % 3 ? 3 : 2));
    }
  // the robe, wider at the hem
  for (let y = 11; y < 30; y++) {
    const half = 3 + Math.round((y - 11) * 0.3);
    for (let x = 14 - half; x <= 14 + half; x++) p.set(x, y, c('cloth', x < 14 - half + 2 ? 3 : x > 14 + half - 2 ? 1 : 2));
  }
  p.rect(12, 11, 5, 1, c('gold', 2));
  // head, hair and halo
  p.disc(14, 7, 3, c('skin', 2)).rect(11, 4, 7, 2, c('hay', 3)).set(13, 7, c('ink', 0)).set(15, 7, c('ink', 0));
  for (let x = 10; x <= 18; x++) p.set(x, 1, c('gold', 3));
  p.set(9, 2, c('gold', 2)).set(19, 2, c('gold', 2));
  // the trumpet
  p.line(16, 9, 24, 5, c('gold', 3)).line(24, 3, 24, 7, c('gold', 2)).set(17, 11, c('skin', 2)).set(18, 10, c('skin', 2));
  return outline(p, c('ink', 0));
}

/** A campfire's flames, frame f (flicker). */
function fire(p: Pixels, pal: Pal, x: number, y: number, f: number): void {
  const c = pal.c;
  p.rect(x - 9, y + 2, 18, 3, c('wood', 1)).line(x - 10, y + 5, x + 10, y + 1, c('wood', 0));
  const h = [10, 13, 11][f % 3];
  for (let k = 0; k < h; k++) {
    const half = Math.round((1 - k / h) * 7 + (k % 2) * ((f % 2) * 2 - 1));
    for (let xx = -half; xx <= half; xx++) p.set(x + xx, y + 1 - k, k < h / 3 ? c('red', 3) : Math.abs(xx) < half / 2 ? c('glow', 3) : c('gold', 2));
  }
}

/** A shepherd: a robed walker with a crook. */
function shepherd(p: Pixels, cast: Cast, pal: Pal, x: number, y: number, f: number, flip = false): void {
  scaleBlit(p, cast.mons.get(f % 2 ? 'walkB1' : 'walkB0')!, x, y, 2, flip);
  const cx = flip ? x + 6 : x + 34;
  p.rect(cx, y - 6, 2, 46, pal.c('wood', 2));
  for (let k = 0; k < 6; k++) p.set(cx + (flip ? -1 : 1) * Math.round(Math.sin((k / 5) * Math.PI) * 4), y - 6 - Math.round(Math.cos((k / 5) * Math.PI) * 3) - 3, pal.c('wood', 3));
}

/** A vertical gradient in solid bands (no dither: long runs keep the frames small). */
function bands(p: Pixels, x0: number, y0: number, w: number, h: number, ramp: number[], lo: number, hi: number): void {
  for (let y = y0; y < y0 + h; y++) p.rect(x0, y, w, 1, ramp[Math.round(lo + ((hi - lo) * (y - y0)) / Math.max(1, h - 1))]);
}

const caption = (p: Pixels, pal: Pal, lines: string[], color = 'cloth') => {
  p.rect(0, 172, W, H - 172, pal.c('night', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i && color === 'mixed' ? 'gold' : 'cloth', 3)));
};

/** The story: the star rises over Bethlehem; angels over the field and the shepherds run; the goat nobody painted. */
export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);

  // ---- 1. the star rises over Bethlehem and lights the stable
  const town = new Pixels(W, H);
  bands(town, 0, 0, W, 150, pal.r('night'), 0, 7);
  stars(town, pal, 5, 150, 160);
  skyline(town, pal, 150);
  town.rect(132, 122, 56, 28, c('wood', 0)).rect(126, 118, 68, 6, c('wood', 1));
  // the goat on the hillside, watching
  scaleBlit(town, cast.goat.get('side0')!, 60, 134, 2);
  const door = (p: Pixels, lit: number) => {
    p.rect(146, 128, 28, 22, c('glow', lit > 0 ? 1 : 0));
    if (lit > 1) p.rect(150, 132, 20, 18, c('glow', 2));
    if (lit > 2) p.rect(156, 138, 8, 6, c('glow', 3));
  };
  const SPARKS: [number, number][] = [
    [30, 20],
    [80, 60],
    [120, 14],
    [210, 40],
    [262, 18],
    [296, 70],
    [52, 96],
    [240, 90],
  ];
  const sparkle = (p: Pixels, f: number) => SPARKS.forEach(([x, y], k) => twinkle(p, pal, x, y, [0, 1, 2, 1, 0, 0][(f + k * 2) % 6]));
  const beam = (p: Pixels, to: number) => {
    for (let y = 40; y < to; y++) {
      const half = (y - 40) * 0.35;
      for (let xx = Math.round(160 - half); xx <= 160 + half; xx++) if ((xx + y) % 3 === 0) p.set(xx, y, c('night', 7));
    }
  };
  const first = new Pixels(W, H);
  first.px.set(town.px);
  door(first, 0);
  caption(first, pal, ['BETHLEHEM.  A NIGHT LIKE NO OTHER.']);
  r.fadeIn(first, 4);
  let f = 0;
  for (let k = 0; k <= 18; k++) {
    const t = k / 18;
    const y = Math.round(150 - (150 - 34) * (1 - (1 - t) * (1 - t)));
    r.frame(town, (p) => {
      sparkle(p, f++);
      bigStar(p, pal, 160, y, Math.max(2, Math.round(2 + t * 5)));
      door(p, 0);
      caption(p, pal, ['BETHLEHEM.  A NIGHT LIKE NO OTHER.']);
    });
  }
  for (let k = 0; k <= 14; k++)
    r.frame(town, (p) => {
      sparkle(p, f++);
      beam(p, Math.min(150, 40 + k * 10));
      bigStar(p, pal, 160, 34, 7 + (k % 2));
      door(p, Math.min(3, Math.floor(k / 3)));
      caption(p, pal, ['BETHLEHEM.  A NIGHT LIKE NO OTHER.', 'The stars were bright...'], 'mixed');
    });
  r.fadeOut(3);

  // ---- 2. the angels over the shepherds' field; the shepherds run to Bethlehem
  const field = new Pixels(W, H);
  bands(field, 0, 0, W, 130, pal.r('night'), 0, 6);
  stars(field, pal, 7, 120, 110);
  for (let x = 0; x < W; x++) {
    const top = 120 + Math.round(Math.sin(x / 40) * 6 + Math.sin(x / 13) * 2);
    for (let y = top; y < 172; y++) field.set(x, y, c('olive', y - top < 3 ? 2 : y > 150 ? 0 : 1));
  }
  for (const [x, y] of [
    [210, 150],
    [250, 140],
    [282, 156],
  ])
    blob(field, x, y, 9, 3, pal.r('olive'), 0, 1);
  const lambs: [number, number][] = [
    [200, 128],
    [240, 140],
    [276, 126],
  ];
  const angels = [
    [100, 0],
    [160, -10],
    [220, 4],
  ];
  const wings = [angel(pal, 0), angel(pal, 1)];
  const loud = ['GLORIA!', 'GLORIA!', 'PEACE ON EARTH!'];
  const ANGELS = 42;
  for (let k = 0; k < ANGELS; k++)
    r.frame(field, (p) => {
      const come = Math.min(1, k / 14);
      // the angels glide down, then hover, wings beating
      angels.forEach(([x, dy], i) => {
        const y = Math.round(-34 + (34 + 22 + dy) * (1 - (1 - come) ** 2));
        const a = wings[(k >> 2) % 2];
        scaleBlit(p, a, x - 28, y, 2, i === 0);
        if (k > 16 && (k + i * 3) % 8 < 5) twinkle(p, pal, x + (i === 0 ? -24 : 24), y + 8, 1 + ((k + i) % 3));
      });
      if (k > 16) {
        const words = loud[Math.floor((k - 17) / 6) % 3];
        outlined(p, 160 - textWidth(words) / 2, 100, words, c('gold', 3), c('ink', 0));
      }
      // the shepherds by their fire: startled, then off to Bethlehem (and the lambs after them)
      fire(p, pal, 160, 152, k);
      const run = Math.max(0, k - 26);
      for (const [i, x0] of [40, 96].entries()) {
        const jump = k >= 16 && k < 22 ? -4 * ((k + i) % 2) - 2 : 0;
        const x = x0 + run * 9;
        shepherd(p, cast, pal, x, 116 + jump, run ? k + i : 0, false);
        if (k >= 16 && k < 26) outlined(p, x + 16, 96 + jump, '!', c('gold', 3), c('ink', 0));
      }
      lambs.forEach(([x, y], i) => scaleBlit(p, cast.mons.get(k % 2 ? 'lamb1' : 'lamb0')!, x + Math.max(0, k - 30) * 8, y - (k > 16 && (k + i) % 4 === 0 ? 2 : 0), 1));
      caption(p, pal, k < 26 ? ['The stars were bright,', 'the angels loud,'] : ['...and the shepherds ran', 'to Bethlehem to see.'], 'mixed');
    });
  r.fadeOut(3);

  // ---- 3. in the stable: the donkey and the ox in a painting; the goat chews
  const stall = new Pixels(W, H);
  for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) stall.set(x, y, c('wood', x % 32 === 0 ? 0 : y % 40 === 39 ? 1 : 2));
  for (let y = 120; y < 172; y++) stall.rect(0, y, W, 1, c('hay', y % 9 === 0 ? 1 : 2));
  for (let k = 0; k < 40; k++) stall.rect((k * 73) % 300, 124 + ((k * 29) % 44), 6 + (k % 3) * 3, 1, c('hay', k % 2 ? 4 : 1));
  // the painting: a gold frame round the donkey and the ox
  stall.rect(24, 14, 150, 96, c('gold', 1)).rect(28, 18, 142, 88, c('gold', 3)).rect(32, 22, 134, 80, c('dusk', 8));
  bands(stall, 32, 22, 134, 60, pal.r('dusk'), 3, 9);
  stall.rect(32, 82, 134, 20, c('olive', 2));
  scaleBlit(stall, cast.mons.get('donkey0')!, 40, 52, 2);
  scaleBlit(stall, cast.mons.get('ox0')!, 104, 52, 2);
  blob(stall, 250, 148, 46, 16, pal.r('hay'), 1, 4);
  const frameSparks: [number, number][] = [
    [26, 16],
    [172, 18],
    [26, 108],
    [172, 106],
    [100, 14],
  ];
  const STALL = 48;
  for (let k = 0; k < STALL; k++)
    r.frame(stall, (p) => {
      frameSparks.forEach(([x, y], i) => twinkle(p, pal, x, y, [0, 1, 2, 3, 2, 1][(k + i * 2) % 6]));
      // a pigeon on the frame, singing hymns
      const sing = k >= 14 && k < 30;
      scaleBlit(p, cast.mons.get(sing && k % 2 ? 'pigeon0' : 'pigeon1')!, 150, -4 + (sing && k % 2 ? -2 : 0), 2, true);
      if (sing)
        for (let n = 0; n < 3; n++) {
          const t = (k - 14 + n * 4) % 12;
          outlined(p, 140 - t * 2 - n * 10, 20 - t * 2 + n * 4, n % 2 ? '\x0e' : '\x0d', c('gold', 3), c('ink', 0));
        }
      // the goat by the hay, chewing all night long
      const chew = k >= 28;
      const pose = chew ? (k % 4 < 2 ? 'chew0' : 'chew1') : k % 12 < 1 ? 'bleat' : 'side0';
      scaleBlit(p, cast.goat.get(pose)!, 214, 80, 3, true);
      if (chew) for (let s = 0; s < 3; s++) p.line(224, 103 + s, 213 - s * 2 - (k % 2), 104 + s * 3, c('hay', 4 - s));
      caption(
        p,
        pal,
        k < 14 ? ["The donkey's in paintings,", 'the ox gets praise,'] : k < 28 ? ['Even pigeons got hymns', 'these days.'] : k < 40 ? ['But me? I stood there,', 'chewing hay...'] : ['...and a goat nobody', 'painted.'],
        'mixed',
      );
    });
  r.fadeOut(4);
  return r.fli(SPEED);
}

export interface CardView {
  /** The level's view (16 x 6 blocks), without the goat, in the level's palette. */
  map: Pixels;
  pal: Pal;
  /** Where the goat starts in the view (pixels), when it is in it. */
  start?: [number, number];
}

/** The strip of level on a card: y 54 to 174. */
const STRIP = 54;

/**
 * A level's card (cardN.fli): its name drops in, the place comes alive (the goat greets an
 * angel in the field; the crowd shoves through Bethlehem; the wise men's camel parade; a
 * sneeze on Joseph and a kicked pail in the stable), and its lines of the song appear.
 */
export function cardFli(i: number, card: CardView, cast: Cast): Uint8Array {
  const pal = card.pal;
  const c = pal.c;
  const ink = c('ink', 0);
  const info = CARDS[i];
  const bg = new Pixels(W, H, ink);
  bg.blit(card.map, 0, STRIP);
  const frame = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, ink).rect(0, 174, W, 26, ink);
    p.rect(0, STRIP - 1, W, 1, c('gold', 2)).rect(0, 174, W, 1, c('gold', 2));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('gold', 3), c('ink', 1), 2);
    if (k >= 5) centered(p, 32, info.where, c('cloth', 3));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('cloth', 3));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('cloth', 3));
  };
  const say = (p: Pixels, x: number, y: number, words: string, color = 'cloth') => outlined(p, Math.round(x - textWidth(words) / 2), y, words, c(color, 3), ink);
  const sprite = (set: Map<string, Pixels>, name: string) => set.get(name)!;
  const goat = (name: string) => sprite(cast.goat, name);
  const mon = (name: string) => sprite(cast.mons, name);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the field: an angel flies over, trailing stars, and the goat bleats at it
    (p, k) => {
      const [gx, gy] = card.start ?? [60, 114];
      const ax = 330 - k * 13;
      for (let t = 1; t <= 4; t++) twinkle(p, pal, ax + 14 + t * 14, STRIP + 18 + ((t + k) % 2) * 3, 3 - Math.floor(t * 0.7));
      p.blit(angel(pal, (k >> 1) % 2), ax, STRIP + 2, T);
      const looking = ax < gx + 60;
      const bleat = k >= 22;
      p.blit(goat(bleat ? 'bleat' : looking ? (k % 6 < 1 ? 'blink' : 'down0') : 'down0'), gx, gy, T);
      if (bleat) say(p, gx + 10, gy - 12, 'BLEAT!', 'gold');
    },
    // 2. Bethlehem: the crowd, home to be counted, streams past; the goat gets lost in it
    (p, k) => {
      for (let n = 0; n < 8; n++) {
        const x = 330 + n * 34 - k * 6;
        p.blit(mon(`walk${n % 2 ? 'B' : 'A'}${(k + n) % 2}`), x, STRIP + 22 + (n % 2) * 14, T);
      }
      const gx = Math.min(-20 + k * 5, 100);
      const walking = gx < 100;
      p.blit(walking ? goat(`side${k % 3}`) : goat(k % 6 < 1 ? 'blink' : 'down0'), gx, STRIP + 100, T);
      if (!walking) say(p, gx + 10, STRIP + 86, '?', 'gold');
    },
    // 3. the caravan: the wise men strut, each with his camel
    (p, k) => {
      let x = 40 + k * 5;
      for (let n = 0; n < 3; n++) {
        const step = (k + n) % 2;
        p.blit(mon(`front${step}`), x, STRIP + 22, T);
        p.blit(mon(`rear${step}`), x - 20, STRIP + 22, T);
        x -= 26;
        p.blit(mon(`wise${step}`), x, STRIP + 20 - step, T);
        if ((k + n * 3) % 6 < 2) twinkle(p, pal, x + 10, STRIP + 16, 2);
        x -= 32;
      }
    },
    // 4. the stable: dusty straw makes the goat sneeze on Joseph; backing off, she kicks the pail
    (p, k) => {
      const shake = k >= 12 && k < 20 ? (k % 2 ? 1 : -1) : 0;
      p.blit(cast.block('joseph'), 100 + shake, STRIP + 20);
      if (k >= 12 && k < 22) say(p, 110, STRIP + 4, '!', 'gold');
      p.blit(cast.block(k >= 22 ? 'pailKicked' : 'pail'), 40, STRIP + 40);
      const y = STRIP + 40;
      if (k < 6) p.blit(goat(`up${k % 3}`), 80, y + (5 - k) * 16, T);
      else if (k < 11) {
        p.blit(goat(k % 2 ? 'chew0' : 'chew1'), 80, y, T);
        say(p, 90, y + 24, 'MUNCH', 'cloth');
      } else if (k < 18) {
        p.blit(goat('scream0'), 80, y + (k === 11 ? 1 : 0), T);
        say(p, 90, y + 24, 'ACHOO!', 'gold');
        for (let d = 0; d < 5; d++) p.set(98 + d * 2 + (k - 11) * 2, y + 6 - (k - 11) * 2 - d, c('cloth', 3));
      } else if (k < 22) p.blit(goat(`side${k % 3}`).flipX(), 80 - (k - 17) * 5, y, T);
      else {
        p.blit(goat('scream1').flipX(), 60, y - (k === 22 ? 2 : 0), T);
        say(p, 50, y - 14, 'CLANG!', 'gold');
      }
    },
  ];
  const r = new Reel(pal.pal);
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  actors[i](first, 0);
  frame(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 28; k++) r.frame(bg, (p) => (actors[i](p, k), frame(p, k)));
  return r.fli(SPEED);
}
