// cast.fli: "Starring...", the cast in close-up before the credits, painted big in the
// screens' palette: Teddy grinning (his right ear always a little taller), Teddy and Gwin in
// the grass, Doc Leo the hobo clown and his rubber chicken, the CitiCar plugged in at a
// charging station, and the Dog House library at dusk.
//
// The last two scenes animate the 1995 way, by palette cycling: the pictures stay still and
// only the colors move (current running down the charging cable, fireflies blinking), so
// those frames are nothing but a color chunk each and cost the file almost nothing.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, centered, gradient, klubArt, outline, outlined, scaleBlit, shadeAt, speckle } from '../art/draw';
import { buildScreenPalette, type Pal } from '../art/pal';
import { GWIN } from '../sprites/gwin';

const W = 320;
const H = 200;

/** The screen palette plus the ramps only the cast needs (the cycling colors last). */
export const CP: Pal = (() => {
  const pal = buildScreenPalette();
  pal.b.ramp('amber', 3, [150, 90, 10], [255, 200, 60]);
  pal.b.ramp('denim', 3, [50, 70, 110], [140, 170, 210]);
  pal.b.ramp('volt', 6, [40, 60, 90], [140, 255, 255]);
  pal.b.ramp('fly', 6, [30, 40, 30], [255, 255, 140]);
  return pal;
})();
const c = (n: string, k: number) => CP.c(n, k);
const r = (n: string) => CP.r(n);

type Pt = [number, number];

/** Fills a polygon, coloring each pixel with `fill(x, y)`. */
function poly(p: Pixels, pts: Pt[], fill: (x: number, y: number) => number): void {
  const ys = pts.map((q) => q[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (y0 === y1 || y + 0.5 < Math.min(y0, y1) || y + 0.5 >= Math.max(y0, y1)) continue;
      xs.push(x0 + ((y + 0.5 - y0) * (x1 - x0)) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) p.set(x, y, fill(x, y));
  }
}

/** A polygon shaded from ramp[hi] at its top to ramp[lo] at its bottom. */
function shadedPoly(p: Pixels, pts: Pt[], ramp: number[], lo: number, hi: number): void {
  const ys = pts.map((q) => q[1]);
  const top = Math.min(...ys);
  const h = Math.max(1, Math.max(...ys) - top);
  poly(p, pts, (x, y) => shadeAt(ramp, lo, hi, 1 - (y - top) / h, x, y));
}

/** Outlines whatever differs from `bg` in a picture's region with ink. */
function inkEdges(p: Pixels, x0: number, y0: number, w: number, h: number, bg: (x: number, y: number) => boolean): void {
  const ink = c('ink', 0);
  const marks: Pt[] = [];
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      if (!bg(x, y)) continue;
      if ([bg(x - 1, y), bg(x + 1, y), bg(x, y - 1), bg(x, y + 1)].some((b) => !b)) marks.push([x, y]);
    }
  for (const [x, y] of marks) p.set(x, y, ink);
}

export interface Face {
  blink?: boolean;
  /** Mouth open, panting (or shut). */
  pant?: boolean;
  /** Tongue up licking his nose (Teddy) / hanging out (Gwin). */
  lick?: boolean;
  /** The tall ear twitches. */
  twitch?: boolean;
}

/**
 * Teddy's head and chest, `s` pixels per unit, centered at (cx, cy): red-gold fur, the
 * white blaze up to his forehead, big upright ears (his right one, on our left, taller).
 */
export function teddyHead(p: Pixels, cx: number, cy: number, s: number, f: Face = {}): void {
  const T = (u: number, v: number): Pt => [cx + u * s, cy + v * s];
  const fur = r('corgi');
  const white = r('fur');
  // his long fluffy body going off behind him, a white front paw, the chest ruff
  blob(p, cx - 62 * s, cy + 46 * s, 58 * s, 30 * s, fur, 0, 4);
  blob(p, cx - 100 * s, cy + 70 * s, 12 * s, 8 * s, white, 0, 2);
  blob(p, cx + 10 * s, cy + 74 * s, 10 * s, 7 * s, white, 0, 2);
  blob(p, cx + 4 * s, cy + 48 * s, 34 * s, 26 * s, white, 0, 2);
  // ears: outer fur, then the pink-and-cream inside
  const tall = f.twitch ? -74 : -80;
  shadedPoly(p, [T(-40, -6), T(-34, tall), T(-6, -30)], fur, 1, 4);
  shadedPoly(p, [T(-32, -12), T(-31, tall + 14), T(-14, -30)], [c('pink', 1), c('pink', 2), c('skin', 3), c('fur', 1)], 0, 3);
  shadedPoly(p, [T(6, -30), T(30, -68), T(40, -4)], fur, 1, 4);
  shadedPoly(p, [T(13, -30), T(29, -55), T(33, -10)], [c('pink', 1), c('pink', 2), c('skin', 3), c('fur', 1)], 0, 3);
  // the head and cheek fluff
  blob(p, cx, cy, 40 * s, 34 * s, fur, 0, 4);
  shadedPoly(p, [T(-40, 4), T(-44, 22), T(-30, 30), T(-20, 22)], fur, 1, 3);
  shadedPoly(p, [T(40, 4), T(44, 22), T(30, 30), T(20, 22)], fur, 1, 3);
  // the blaze and the muzzle
  shadedPoly(p, [T(-3, -34), T(4, -34), T(9, -6), T(16, 10), T(-16, 10), T(-9, -6)], white, 1, 2);
  blob(p, cx, cy + 17 * s, 22 * s, 15 * s, white, 0, 2);
  // eyes: dark and glossy
  for (const side of [-1, 1]) {
    const ex = cx + side * 17 * s;
    const ey = cy - 8 * s;
    if (f.blink) {
      p.rect(Math.round(ex - 5 * s), Math.round(ey), Math.round(10 * s), Math.max(1, Math.round(s)), c('ink', 0));
      continue;
    }
    blob(p, ex, ey, 5 * s, 6 * s, [c('ink', 0), c('gwin', 0), c('gwin', 1)], 0, 2);
    p.rect(Math.round(ex - 2 * s), Math.round(ey - 3 * s), Math.max(1, Math.round(1.5 * s)), Math.max(1, Math.round(1.5 * s)), c('fur', 2));
  }
  // the mouth: open in a grin with one fang, or shut
  if (f.pant !== false) {
    blob(p, cx, cy + 25 * s, 13 * s, 8 * s, [c('red', 0), c('tent', 0)], 0, 1);
    if (!f.lick) blob(p, cx + 2 * s, cy + 29 * s, 8 * s, 5 * s, [c('pink', 1), c('pink', 2), c('pink', 3)], 0, 2);
    shadedPoly(p, [T(-9, 21), T(-6, 21), T(-7.5, 26)], white, 2, 2);
  } else p.rect(Math.round(cx - 9 * s), Math.round(cy + 24 * s), Math.round(18 * s), Math.max(1, Math.round(s)), c('ink', 0));
  // the nose (and the tongue licking it)
  blob(p, cx, cy + 9 * s, 9 * s, 6 * s, [c('ink', 0), c('ink', 1), c('stone', 1)], 0, 2);
  if (f.lick) blob(p, cx + 1 * s, cy + 13 * s, 6 * s, 6 * s, [c('pink', 1), c('pink', 2), c('pink', 3)], 0, 2);
}

/**
 * Gwin's head: chocolate brown, soft floppy ears, amber eyes, a liver nose, a big grin with
 * her tongue out, and her pink collar.
 */
export function gwinHead(p: Pixels, cx: number, cy: number, s: number, f: Face = {}): void {
  const T = (u: number, v: number): Pt => [cx + u * s, cy + v * s];
  const coat = r('gwin');
  // sitting up: shoulders, a little white chest patch, front legs
  blob(p, cx, cy + 62 * s, 38 * s, 34 * s, coat, 0, 3);
  shadedPoly(p, [T(-24, 70), T(-12, 70), T(-12, 104), T(-24, 104)], coat, 1, 3);
  shadedPoly(p, [T(12, 70), T(24, 70), T(24, 104), T(12, 104)], coat, 1, 3);
  blob(p, cx, cy + 56 * s, 7 * s, 9 * s, r('fur'), 0, 2);
  // the pink collar
  p.rect(Math.round(cx - 24 * s), Math.round(cy + 34 * s), Math.round(48 * s), Math.round(6 * s), c('pink', 2));
  p.rect(Math.round(cx - 24 * s), Math.round(cy + 34 * s), Math.round(48 * s), Math.max(1, Math.round(s)), c('pink', 3));
  blob(p, cx + 2 * s, cy + 43 * s, 3 * s, 3 * s, r('gold'), 0, 2);
  blob(p, cx, cy, 32 * s, 32 * s, coat, 0, 4);
  // floppy ears
  const flop = f.twitch ? 4 : 0;
  shadedPoly(p, [T(-24, -26), T(-44, -14 + flop), T(-46, 18 + flop), T(-34, 24 + flop), T(-24, -2)], coat, 0, 2);
  shadedPoly(p, [T(24, -26), T(44, -14), T(46, 18), T(34, 24), T(24, -2)], coat, 0, 2);
  // the muzzle
  blob(p, cx, cy + 16 * s, 19 * s, 15 * s, coat, 1, 4);
  // amber eyes
  for (const side of [-1, 1]) {
    const ex = cx + side * 14 * s;
    const ey = cy - 8 * s;
    if (f.blink) {
      p.rect(Math.round(ex - 4 * s), Math.round(ey), Math.round(8 * s), Math.max(1, Math.round(s)), c('ink', 0));
      continue;
    }
    blob(p, ex, ey, 4.5 * s, 4.5 * s, r('amber'), 0, 2);
    blob(p, ex, ey, 2 * s, 2.5 * s, [c('ink', 0)], 0, 0);
    p.set(Math.round(ex - 2 * s), Math.round(ey - 2 * s), c('fur', 2));
  }
  // the big grin, tongue out
  blob(p, cx, cy + 24 * s, 15 * s, 7 * s, [c('red', 0), c('tent', 0)], 0, 1);
  if (f.lick !== false) blob(p, cx + 3 * s, cy + 29 * s, 6 * s, 6 * s, [c('pink', 1), c('pink', 2), c('pink', 3)], 0, 2);
  shadedPoly(p, [T(-12, 21), T(12, 21), T(10, 23), T(-10, 23)], r('fur'), 2, 2);
  // the liver nose
  blob(p, cx, cy + 9 * s, 8 * s, 6 * s, [c('gwin', 0), c('gwin', 1), c('pink', 1)], 0, 2);
}

/** A sheet of frames (all on one palette unless a frame brings its own). */
class Reel {
  frames: Uint8Array[] = [];
  pals: Uint8Array[] = [];
  add(p: Pixels, n = 1, pal: Uint8Array = CP.pal): void {
    for (let i = 0; i < n; i++) {
      this.frames.push(Uint8Array.from(p.px));
      this.pals.push(pal);
    }
  }
}

const say = (p: Pixels, words: string, y: number, col = c('paint', 3), cx = W / 2) => centered(p, y, klubArt(words), col, 1, c('ink', 0), cx);
const big = (p: Pixels, words: string, y: number, cx = W / 2) => centered(p, y, klubArt(words), c('yellow', 3), 2, c('ink', 0), cx);

/** Scene 1: Teddy, grinning up at the camera on the kitchen floor. */
function teddyScene(reel: Reel): void {
  const bg = new Pixels(W, H);
  gradient(bg, 0, 0, W, 120, r('cream'), 1, 3);
  // the door behind him, the tiles under him
  bg.rect(214, 0, 90, 132, c('paint', 3)).rect(214, 0, 2, 132, c('paint', 1)).rect(226, 14, 66, 50, c('paint', 2)).rect(226, 76, 66, 50, c('paint', 2));
  bg.rect(222, 70, 6, 3, c('metal', 3));
  speckle(bg, 0, 120, W, 80, r('stone'), 3, 1, 5, 0.15);
  for (let x = -40; x < W; x += 56) bg.line(x, 200, x + 40, 120, c('stone', 2));
  bg.rect(0, 120, W, 1, c('stone', 2)).rect(0, 156, W, 1, c('stone', 2));
  for (let f = 0; f < 40; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const pant = f % 4 < 2;
    const t = new Pixels(W, H, CLEAR);
    teddyHead(t, 112, 106 + (pant ? 0 : 1), 1.1, { blink: f === 14 || f === 15 || f === 33, pant: true, twitch: f >= 22 && f <= 24 });
    p.blit(outline(t, c('ink', 0)), 0, 0, CLEAR);
    big(p, 'TEDDY', 24, 250);
    say(p, 'RED-GOLD CORGI.', 52, undefined, 250);
    say(p, 'ONE EAR TALLER.', 64, undefined, 250);
    say(p, 'A TON OF TRICKS.', 76, undefined, 250);
    if (f >= 20) {
      say(p, 'KNOWS LEFT', 150, c('yellow', 3), 250);
      say(p, 'FROM RIGHT!', 162, c('yellow', 3), 250);
    }
    reel.add(p);
  }
}

/** A rope leash running from (x0, y0) off the bottom of the screen, two-tone twisted. */
function leash(p: Pixels, x0: number, y0: number, x1: number, ramp: string): void {
  const n = H - y0;
  for (let i = 0; i <= n; i++) {
    const y = y0 + i;
    const x = Math.round(x0 + ((x1 - x0) * i) / n + Math.sin(i / 9) * 4);
    p.rect(x - 1, y, 3, 1, c('ink', 0)).set(x, y, c(ramp, (i >> 1) % 2 ? 2 : 3));
  }
}

/** Scene 2: Teddy and Gwin in the grass. Gwin was adopted, and she is still learning. */
function gwinScene(reel: Reel): void {
  const bg = new Pixels(W, H);
  speckle(bg, 0, 0, W, H, r('grass'), 2, 1, 9, 0.35);
  for (let i = 0; i < 900; i++) {
    const x = (i * 97) % W;
    const y = (i * 61) % H;
    bg.line(x, y, x + ((i % 3) - 1), y - 3, c('grass', i % 2 ? 4 : 1));
  }
  // the person on the end of the leashes: a jeans knee at the bottom
  blob(bg, 150, 214, 70, 30, r('denim'), 0, 2);
  for (let f = 0; f < 52; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const t = new Pixels(W, H, CLEAR);
    teddyHead(t, 98, 96, 0.85, { lick: f % 6 < 3 && f < 40, pant: f % 6 >= 3 || f >= 40, blink: f === 9 });
    p.blit(outline(t, c('ink', 0)), 0, 0, CLEAR);
    leash(p, 104, 132, 150, 'purple');
    if (f < 34) {
      const g = new Pixels(W, H, CLEAR);
      gwinHead(g, 222, 84 + (f >= 24 && f % 2 ? 1 : 0), 0.95, { blink: f === 17, twitch: f >= 24 && f % 4 < 2 });
      p.blit(outline(g, c('ink', 0)), 0, 0, CLEAR);
      leash(p, 222, 126, 170, 'pink');
    } else {
      // gone: zoomies, trailing her pink leash
      const x = 150 + (f - 34) * 14;
      scaleBlit(p, GWIN[f % 2 ? 'gwinRun1' : 'gwinRun2'], x, 96, 4);
      for (let k = 0; k < 3; k++) p.rect(x - 16 - k * 14 - (f % 2) * 4, 130 + k * 10, 10 - k * 2, 2, c('paint', 3));
    }
    big(p, 'GWIN', 8, 222);
    if (f < 24) {
      say(p, 'BIG SISTER. ADOPTED.', 182);
    } else if (f < 34) {
      say(p, 'SIT, GWIN! SIT!', 170, c('yellow', 3));
      if (f >= 29) say(p, '...NOPE.', 182);
    } else {
      say(p, 'SHE KNOWS ONE TRICK:', 170);
      say(p, 'ZOOMIES!', 182, c('yellow', 3));
    }
    reel.add(p);
  }
}

export function castFli(): Uint8Array {
  const reel = new Reel();
  teddyScene(reel);
  gwinScene(reel);
  return encodeFli(reel.frames, CP.pal, { speed: 7, palettes: reel.pals });
}

void inkEdges;
void outlined;
