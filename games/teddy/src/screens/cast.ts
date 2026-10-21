// cast.fli: "Starring...", the cast in close-up before the credits, painted big in the
// screens' palette: Teddy grinning (his right ear always a little taller), Teddy and Gwinn in
// the grass, Doc Leo the hobo clown and his rubber chicken, the CitiCar plugged in at a
// charging station, and the Dog House library at dusk.
//
// The last two scenes animate the 1995 way, by palette cycling: the pictures stay still and
// only the colors move (current running down the charging cable, fireflies blinking), so
// those frames are nothing but a color chunk each and cost the file almost nothing.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, blob, centered, gradient, klubArt, outline, outlined, scaleBlit, shadeAt, speckle } from '../art/draw';
import { buildScreenPalette, type Pal } from '../art/pal';
import { GWINN } from '../sprites/gwinn';
import { dogHouseLibrary } from '../sprites/library';
import { POSES } from '../sprites/teddy';

const W = 320;
const H = 200;

/** The screen palette plus the ramps only the cast needs (the cycling colors last). */
export const CP: Pal = (() => {
  const pal = buildScreenPalette();
  pal.b.ramp('amber', 3, [150, 90, 10], [255, 200, 60]);
  pal.b.ramp('denim', 3, [50, 70, 110], [140, 170, 210]);
  pal.b.ramp('volt', 6, [40, 60, 90], [140, 255, 255]);
  pal.b.ramp('fly', 6, [90, 70, 110], [255, 255, 140]);
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

export interface Face {
  blink?: boolean;
  /** Mouth open, panting (or shut). */
  pant?: boolean;
  /** Tongue up licking his nose (Teddy) / hanging out (Gwinn). */
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
    blob(p, ex, ey, 5 * s, 6 * s, [c('ink', 0), c('gwinn', 0), c('gwinn', 1)], 0, 2);
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
 * Gwinn's head: chocolate brown, soft floppy ears, amber eyes, a liver nose, a big grin with
 * her tongue out, and her pink collar.
 */
export function gwinnHead(p: Pixels, cx: number, cy: number, s: number, f: Face = {}): void {
  const T = (u: number, v: number): Pt => [cx + u * s, cy + v * s];
  const coat = r('gwinn');
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
  blob(p, cx, cy + 9 * s, 8 * s, 6 * s, [c('gwinn', 0), c('gwinn', 1), c('pink', 1)], 0, 2);
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

/** Scene 2: Teddy and Gwinn in the grass. Gwinn was adopted, and she is still learning. */
function gwinnScene(reel: Reel): void {
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
      gwinnHead(g, 222, 84 + (f >= 24 && f % 2 ? 1 : 0), 0.95, { blink: f === 17, twitch: f >= 24 && f % 4 < 2 });
      p.blit(outline(g, c('ink', 0)), 0, 0, CLEAR);
      leash(p, 222, 126, 170, 'pink');
    } else {
      // gone: zoomies, trailing her pink leash
      const x = 150 + (f - 34) * 14;
      scaleBlit(p, GWINN[f % 2 ? 'gwinnRun1' : 'gwinnRun2'], x, 96, 4);
      for (let k = 0; k < 3; k++) p.rect(x - 16 - k * 14 - (f % 2) * 4, 130 + k * 10, 10 - k * 2, 2, c('paint', 3));
    }
    big(p, 'GWINN', 8, 222);
    if (f < 24) {
      say(p, 'BIG SISTER. ADOPTED.', 182);
    } else if (f < 34) {
      say(p, 'SIT, GWINN! SIT!', 170, c('yellow', 3));
      if (f >= 29) say(p, '...NOPE.', 182);
    } else {
      say(p, 'SHE KNOWS ONE TRICK:', 170);
      say(p, 'ZOOMIES!', 182, c('yellow', 3));
    }
    reel.add(p);
  }
}

/**
 * Doc Leo from the chest up: chewed felt fedora, wire glasses, thick painted brows, an
 * ash-gray painted beard round a white mouth, rosy cheeks, purple shirt, green tie, blue
 * suspenders and the navy corduroy jacket. `nose` puts the red nose on (and the smile).
 */
export function leoBust(p: Pixels, cx: number, cy: number, nose: boolean, blink = false): void {
  const T = (u: number, v: number): Pt => [cx + u, cy + v];
  const skin = r('skin');
  // the jacket, cord lines and all, then shirt, suspenders, tie
  shadedPoly(p, [T(-78, 106), T(-60, 52), T(-20, 40), T(20, 40), T(60, 52), T(78, 106)], [c('blue', 0), c('blue', 1)], 0, 1);
  for (let x = -74; x < 76; x += 4) for (let y = 50; y < 106; y += 1) if (p.get(cx + x, cy + y) === c('blue', 1)) p.set(cx + x, cy + y, c('blue', 0));
  shadedPoly(p, [T(-22, 42), T(22, 42), T(14, 106), T(-14, 106)], r('purple'), 1, 3);
  for (const side of [-1, 1]) shadedPoly(p, [T(side * 18, 44), T(side * 24, 44), T(side * 16, 106), T(side * 10, 106)], [c('blue', 2), c('blue', 3)], 0, 1);
  shadedPoly(p, [T(-6, 42), T(6, 42), T(4, 50), T(-4, 50)], r('green'), 1, 2);
  shadedPoly(p, [T(-4, 50), T(4, 50), T(9, 92), T(0, 100), T(-9, 92)], r('green'), 0, 2);
  for (let k = 0; k < 5; k++) p.set(cx - 3 + ((k * 5) % 7), cy + 56 + k * 8, c('yellow', 2));
  // collar points
  shadedPoly(p, [T(-22, 38), T(-6, 42), T(-14, 54)], r('purple'), 2, 3);
  shadedPoly(p, [T(22, 38), T(6, 42), T(14, 54)], r('purple'), 2, 3);
  // neck and head
  p.rect(cx - 12, cy + 26, 24, 16, c('skin', 1));
  blob(p, cx, cy, 34, 40, skin, 1, 3);
  // shaggy gray-brown hair under the hat
  for (const side of [-1, 1]) blob(p, cx + side * 30, cy - 22, 9, 12, [c('stone', 0), c('dirt', 1), c('stone', 2)], 0, 2);
  // ears
  blob(p, cx - 34, cy + 2, 6, 9, skin, 0, 2);
  blob(p, cx + 34, cy + 2, 6, 9, skin, 0, 2);
  // the ash beard: jaw and chin, dithered gray-blue, with the white mouth patch inside
  for (let y = cy + 2; y < cy + 42; y++)
    for (let x = cx - 34; x <= cx + 34; x++) {
      const nx = (x - cx) / 34;
      const ny = (y - cy) / 40;
      if (nx * nx + ny * ny > 1) continue;
      const jaw = (y - cy - 2) / 40 + Math.abs(nx) * 0.35;
      if (jaw > 0.18) p.set(x, y, shadeAt([c('stone', 0), c('stone', 1), c('stone', 2), c('blue', 1)], 0, 3, 0.75 - jaw * 0.6, x, y));
    }
  blob(p, cx, cy + 24, 15, 10, [c('paint', 1), c('paint', 2), c('paint', 3)], 0, 2);
  // the mouth: turned down sad, or a big smile once the nose is on
  for (let x = -9; x <= 9; x++) {
    const dy = nose ? Math.round((x * x) / 18) : -Math.round((x * x) / 22);
    p.set(cx + x, cy + 24 + (nose ? -dy + 3 : -dy - 1), c('ink', 0));
    if (nose && Math.abs(x) < 7) p.set(cx + x, cy + 25 - dy + 3, c('red', 0));
  }
  // rosy cheeks, white round the eyes, thick black brows
  blob(p, cx - 20, cy + 8, 8, 6, [c('red', 2), c('pink', 1), c('pink', 2)], 0, 2);
  blob(p, cx + 20, cy + 8, 8, 6, [c('red', 2), c('pink', 1), c('pink', 2)], 0, 2);
  for (const side of [-1, 1]) {
    blob(p, cx + side * 13, cy - 6, 9, 7, [c('paint', 2), c('paint', 3)], 0, 1);
    if (blink) p.rect(cx + side * 13 - 4, cy - 6, 9, 1, c('ink', 0));
    else p.rect(cx + side * 13 - 2, cy - 8, 4, 4, c('ink', 0)).set(cx + side * 13 - 1, cy - 8, c('fur', 2));
    shadedPoly(p, [T(side * 4, -21), T(side * 22, -16), T(side * 23, -12), T(side * 5, -17)], [c('ink', 0), c('ink', 1)], 0, 1);
    // wire glasses
    p.frame(cx + side * 13 - 9, cy - 13, 19, 14, c('metal', 2));
  }
  p.rect(cx - 4, cy - 8, 8, 1, c('metal', 2));
  // the nose: his own, or the red one
  if (nose) blob(p, cx, cy + 8, 8, 7, r('red'), 0, 3);
  else blob(p, cx, cy + 6, 5, 7, [c('red', 1), c('skin', 1), c('skin', 2)], 0, 2);
  // the fedora: pinched crown, dark band, a wide brim with a chew mark
  shadedPoly(p, [T(-26, -36), T(-22, -66), T(-6, -72), T(0, -64), T(6, -72), T(22, -66), T(26, -36)], [c('stone', 0), c('stone', 1), c('stone', 2)], 0, 2);
  p.rect(cx - 26, cy - 44, 52, 8, c('ink', 0));
  shadedPoly(p, [T(-54, -30), T(-40, -40), T(40, -40), T(54, -30), T(48, -26), T(-48, -26)], [c('stone', 0), c('stone', 1), c('stone', 2)], 0, 2);
  for (const [x, y] of [
    [42, -32],
    [45, -30],
    [48, -31],
  ] as Pt[])
    p.rect(cx + x, cy + y, 3, 3, CLEAR);
}

/** The rubber chicken in its red harness, held up by the leash; `bawk` opens its beak. */
function chicken(p: Pixels, x: number, y: number, bawk: boolean): void {
  const yel = r('yellow');
  blob(p, x, y + 30, 16, 11, yel, 0, 3);
  shadedPoly(p, [[x + 8, y + 26], [x + 14, y + 2], [x + 20, y + 2], [x + 18, y + 28]], yel, 1, 3);
  blob(p, x + 18, y, 7, 7, yel, 1, 3);
  for (let k = 0; k < 3; k++) blob(p, x + 14 + k * 3, y - 8 + (k % 2), 2.5, 3, r('red'), 1, 3);
  p.set(x + 19, y - 2, c('ink', 0));
  const beak = r('gold');
  if (bawk) {
    shadedPoly(p, [[x + 24, y - 2], [x + 34, y - 6], [x + 25, y + 1]], beak, 0, 2);
    shadedPoly(p, [[x + 24, y + 2], [x + 33, y + 6], [x + 24, y + 4]], beak, 0, 2);
  } else shadedPoly(p, [[x + 24, y - 1], [x + 32, y + 1], [x + 24, y + 3]], beak, 0, 2);
  p.rect(x - 10, y + 26, 22, 4, c('red', 2)).rect(x + 2, y + 22, 4, 16, c('red', 2));
  p.line(x + 4, y + 22, x - 6, y - 40, c('red', 1)).line(x + 5, y + 22, x - 5, y - 40, c('red', 2));
}

/** Scene 3: Doc Leo on Main Street, flags out. Nose on: showtime. */
function leoScene(reel: Reel): void {
  const bg = new Pixels(W, H);
  gradient(bg, 0, 0, W, 90, r('sky'), 2, 7);
  // brick storefronts and an awning, flags along the street
  bg.rect(0, 40, 70, 160, c('brick', 2)).rect(250, 30, 70, 170, c('brick', 1));
  for (let y = 40; y < H; y += 5) for (let x = (y / 5) % 2 ? 0 : 6; x < 70; x += 12) bg.rect(x, y, 1, 5, c('brick', 0));
  for (let y = 30; y < H; y += 5) for (let x = 250 + ((y / 5) % 2 ? 0 : 6); x < W; x += 12) bg.rect(x, y, 1, 5, c('brick', 0));
  bg.rect(8, 60, 50, 40, c('sky', 6)).frame(8, 60, 50, 40, c('paint', 3));
  bg.rect(262, 52, 46, 44, c('sky', 5)).frame(262, 52, 46, 44, c('paint', 3));
  for (const [fx, fy] of [
    [60, 50],
    [258, 40],
  ] as Pt[]) {
    bg.line(fx, fy, fx, fy + 70, c('metal', 2));
    for (let k = 0; k < 7; k++) bg.rect(fx + 1, fy + k * 2, 24, 2, k % 2 ? c('paint', 3) : c('red', 2));
    bg.rect(fx + 1, fy, 10, 8, c('blue', 1));
    for (let k = 0; k < 6; k++) bg.set(fx + 2 + (k % 3) * 3, fy + 2 + Math.floor(k / 3) * 3, c('paint', 3));
  }
  bg.rect(0, 180, W, 20, c('stone', 2));
  for (let f = 0; f < 50; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const on = f >= 22;
    const l = new Pixels(W, H, CLEAR);
    leoBust(l, 150, 98 + (on && f % 2 ? 1 : 0), on, f === 8 || f === 40);
    chicken(l, 240, 132, f % 6 < 2 && f > 4);
    p.blit(outline(l, c('ink', 0)), 0, 0, CLEAR);
    if (f > 4 && f % 6 < 2) outlined(p, 266, 104, 'BAWK!', c('yellow', 3), c('ink', 0), 1);
    big(p, 'DOC LEO', 6);
    if (!on) say(p, 'A HOBO CLOWN, AND HIS', 170);
    if (!on) say(p, 'RUBBER CHICKEN ON A LEASH.', 182);
    if (on) say(p, 'NOSE ON: SHOWTIME!', 170, c('yellow', 3));
    if (f >= 32) say(p, '(HE ALWAYS ORDERS ROOT BEER.)', 182);
    if (f === 22 || f === 23) for (let k = 0; k < 8; k++) p.set(150 + Math.round(Math.cos(k) * 16), 104 + Math.round(Math.sin(k) * 14), c('yellow', 3));
    reel.add(p);
  }
}

/** The palette with a ramp's colors rotated `step` places (palette cycling). */
function cycled(name: string, step: number, base: Uint8Array = CP.pal): Uint8Array {
  const pal = Uint8Array.from(base);
  const ramp = r(name);
  ramp.forEach((idx, k) => pal.set(base.subarray(ramp[(k + step) % ramp.length] * 3, ramp[(k + step) % ramp.length] * 3 + 3), idx * 3));
  return pal;
}

/** The CitiCar, three-quarters from the front: a red wedge with a flat hood, headlight pods and a black bumper. */
export function citiCarBig(p: Pixels): void {
  const red = r('red');
  // the far wheel peeking out, then the body side, roof, glass, hood and nose
  blob(p, 102, 170, 12, 14, [c('ink', 0), c('ink', 1)], 0, 1);
  shadedPoly(p, [[70, 92], [124, 80], [138, 168], [74, 166]], red, 1, 2);
  p.rect(68, 158, 10, 9, c('ink', 0));
  shadedPoly(p, [[108, 72], [200, 64], [216, 73], [124, 82]], r('stone'), 1, 3);
  shadedPoly(p, [[80, 94], [117, 84], [121, 118], [83, 126]], r('sky'), 3, 7);
  shadedPoly(p, [[126, 83], [214, 75], [221, 118], [131, 125]], r('sky'), 4, 7);
  for (let k = 0; k < 14; k++) p.set(150 + k * 2, 112 - k * 2, c('fur', 2)).set(151 + k * 2, 112 - k * 2, c('fur', 2));
  p.line(126, 83, 131, 125, c('red', 0)).line(214, 75, 221, 118, c('red', 0));
  shadedPoly(p, [[131, 125], [221, 118], [252, 148], [140, 160]], red, 2, 3);
  shadedPoly(p, [[140, 160], [252, 148], [252, 168], [140, 176]], red, 1, 2);
  // the hood scoop, the pinstripe, the door seam and handle
  p.line(176, 124, 188, 151, c('red', 0)).line(178, 124, 190, 151, c('red', 3));
  p.line(74, 140, 132, 132, c('red', 3));
  p.line(117, 84, 123, 162, c('red', 0));
  p.rect(108, 128, 6, 2, c('metal', 3));
  // headlights in raised pods, amber corner lights
  for (const [x, y] of [
    [164, 150],
    [228, 143],
  ] as Pt[]) {
    blob(p, x, y, 11, 10, red, 1, 3);
    blob(p, x, y + 1, 7, 7, [c('metal', 2), c('cloud', 0), c('cloud', 2)], 0, 2);
    p.rect(x - 3, y - 2, 2, 2, c('fur', 2));
  }
  p.rect(144, 158, 6, 4, c('amber', 2)).rect(244, 150, 6, 4, c('amber', 2));
  // the black bumper bar and a blank plate
  p.rect(134, 168, 122, 9, c('ink', 0)).rect(134, 168, 122, 2, c('ink', 1));
  p.rect(182, 170, 22, 10, c('yellow', 3)).frame(182, 170, 22, 10, c('ink', 1));
  // the near front wheel: a little whitewall
  blob(p, 150, 182, 12, 13, [c('ink', 0), c('ink', 1)], 0, 1);
  blob(p, 150, 182, 7, 8, [c('paint', 2), c('paint', 3)], 0, 1);
  blob(p, 150, 182, 4, 5, [c('metal', 2), c('metal', 3)], 0, 1);
}

/** Scene 4: the CitiCar plugged in at a charging station; the current runs down the cable. */
function carScene(reel: Reel): void {
  const p = new Pixels(W, H);
  // stucco wall over a stone base, the parking space, a strip of grass
  gradient(p, 0, 0, W, 110, r('cream'), 3, 1);
  for (let y = 110; y < 150; y += 6) for (let x = (y / 6) % 2 ? 0 : 9; x < W; x += 18) p.rect(x, y, 17, 5, c('stone', 2 + ((x + y) % 3 === 0 ? 1 : 0)));
  p.rect(0, 150, W, 50, c('asphalt', 1));
  speckle(p, 0, 150, W, 50, r('asphalt'), 1, 1, 13, 0.2);
  p.rect(0, 176, 40, 24, c('grass', 2)).rect(40, 172, 4, 28, c('amber', 1));
  p.line(300, 150, 270, 200, c('paint', 3));
  // the red EV CHARGING sign
  p.rect(40, 20, 120, 34, c('red', 1)).frame(40, 20, 120, 34, c('paint', 3));
  outlined(p, 52, 26, 'EV ONLY', c('paint', 3), c('red', 0), 1);
  outlined(p, 52, 38, 'CHARGING', c('paint', 3), c('red', 0), 1);
  p.ring(140, 37, 10, c('paint', 3)).rect(137, 31, 6, 9, c('paint', 3)).rect(138, 28, 1, 3, c('paint', 3)).rect(141, 28, 1, 3, c('paint', 3));
  // the charger post with its screen
  p.rect(16, 70, 22, 110, c('ink', 1)).rect(18, 72, 18, 106, c('metal', 1)).rect(21, 80, 12, 16, c('ink', 0));
  p.rect(14, 176, 26, 6, c('stone', 3));
  const volt = r('volt');
  for (let k = 0; k < 5; k++) p.rect(23, 92 - k * 3, 8, 2, volt[k % volt.length]);
  citiCarBig(p);
  // the cable: a droop from the charger to the car's side port, its colors cycling
  let prev: Pt = [30, 110];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = Math.round(30 + t * 58);
    const y = Math.round(110 + Math.sin(t * Math.PI) * 50 + t * 26);
    p.rect(x - 1, y - 1, 3, 3, c('ink', 0));
    prev = [x, y];
  }
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    p.set(Math.round(30 + t * 58), Math.round(110 + Math.sin(t * Math.PI) * 50 + t * 26), volt[Math.floor(i / 3) % volt.length]);
  }
  p.rect(prev[0] - 2, prev[1] - 3, 6, 6, c('ink', 0));
  big(p, 'CITICAR', 8, 240);
  say(p, 'RED. 1976.', 30, undefined, 240);
  say(p, '100% ELECTRIC.', 42, undefined, 240);
  for (let f = 0; f < 36; f++) {
    const q = new Pixels(W, H);
    q.px.set(p.px);
    if (f >= 12) say(q, 'CHARGES A MILE AN HOUR.', 190, c('yellow', 3));
    reel.add(q, 1, cycled('volt', volt.length - (f % volt.length)));
  }
}

/** Scene 5: the Dog House at dusk, its solar light on, fireflies blinking (palette cycling). */
function libraryScene(reel: Reel): void {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 150, r('dusk'), 1, 10);
  // the blue house behind, its porch light on
  p.rect(0, 70, 190, 80, c('siding', 1));
  for (let y = 72; y < 150; y += 5) p.rect(0, y, 190, 1, c('siding', 0));
  p.rect(150, 90, 22, 30, c('glow', 2)).frame(150, 90, 22, 30, c('paint', 3)).rect(160, 90, 1, 30, c('paint', 3));
  p.rect(0, 60, 196, 10, c('roof', 1));
  // the lawn, autumn leaves on it
  p.rect(0, 150, W, 50, c('grass', 1));
  speckle(p, 0, 150, W, 50, r('grass'), 1, 1, 17, 0.3);
  const R = rng(19);
  for (let i = 0; i < 70; i++) p.rect(Math.floor(R() * W), 152 + Math.floor(R() * 48), 2, 1, c(['amber', 'dirt', 'red', 'yellow'][i % 4], 1 + (i % 2)));
  // the library itself, as it stands on Maple Street, three times as big
  const lib = new Pixels(40, 60, CLEAR);
  dogHouseLibrary(lib);
  scaleBlit(p, lib, 40, 12, 3);
  p.rect(94, 192, 12, 8, c('wood', 0));
  // the solar light on the roof and the fireflies, all in the cycling colors
  const fly = r('fly');
  p.rect(97, 14, 6, 6, c('ink', 0)).rect(98, 15, 4, 4, fly[5]);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(R() * W);
    const y = 40 + Math.floor(R() * 140);
    p.rect(x, y, 2, 2, fly[i % fly.length]);
  }
  big(p, 'THE DOG', 10, 250);
  big(p, 'HOUSE', 28, 250);
  for (let f = 0; f < 44; f++) {
    const q = new Pixels(W, H);
    q.px.set(p.px);
    scaleBlit(q, POSES[f % 10 < 5 ? 'front' : 'frontTilt'], 196, 120, 4);
    say(q, 'TAKE A BOOK.', 54, undefined, 250);
    if (f >= 10) say(q, 'SHARE A BOOK.', 66, undefined, 250);
    if (f >= 22) say(q, 'SNACKS IN THE', 84, c('yellow', 3), 250);
    if (f >= 22) say(q, 'DRAWER. WOOF!', 96, c('yellow', 3), 250);
    reel.add(q, 1, cycled('fly', f % fly.length));
  }
}

export function castFli(): Uint8Array {
  const reel = new Reel();
  teddyScene(reel);
  gwinnScene(reel);
  leoScene(reel);
  carScene(reel);
  libraryScene(reel);
  return encodeFli(reel.frames, CP.pal, { speed: 7, palettes: reel.pals });
}

