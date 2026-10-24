// cast.fli: "Starring...", the cast in close-up before the credits, drawn big in the
// screens' palette over the family's photos (the portraits are pixel art in castTeddy,
// castGwinn, castLeo and castCar; see castArt.ts): Teddy grinning, Teddy and Gwinn in the
// grass (then her zoomies), Doc Leo the hobo clown with his rubber chicken in his fist, the
// CitiCar THE CHEZ plugged in at a charging station, and the Dog House library at dusk.
//
// The last two scenes animate the 1995 way, by palette cycling: the pictures stay still and
// only the colors move (current running down the charging cable, fireflies blinking), so
// those frames are nothing but a color chunk each and cost the file almost nothing.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, centered, gradient, clubArt, micro, outline, outlined, scaleBlit, speckle } from '../art/draw';
import { buildScreenPalette, type Pal } from '../art/pal';
import { drawArt } from './castArt';
import { CITICAR } from './castCar';
import { CHICKEN, CHICKEN_BAWK, LEO, LEO_BLINK, LEO_NOSE, paintFace } from './castLeo';
import { GRASS_GWINN, GRASS_TEDDY, GRASS_TEDDY_PANT, GWINN_BLINK, GWINN_RUN1, GWINN_RUN2, JEANS } from './castGwinn';
import { TEDDY, TEDDY_BLINK, TEDDY_PANT } from './castTeddy';
import { dogHouseLibrary } from '../sprites/library';
import { POSES } from '../sprites/teddy';

const W = 320;
const H = 200;

/** The screen palette plus the ramps only the cast needs (the cycling colors last). */
export const CP: Pal = (() => {
  const pal = buildScreenPalette();
  pal.b.ramp('tomato', 6, [90, 14, 10], [255, 178, 156], [200, 54, 38]);
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

const say = (p: Pixels, words: string, y: number, col = c('paint', 3), cx = W / 2) => centered(p, y, clubArt(words), col, 1, c('ink', 0), cx);
const big = (p: Pixels, words: string, y: number, cx = W / 2) => centered(p, y, clubArt(words), c('yellow', 3), 2, c('ink', 0), cx);

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
    const t = new Pixels(W, H, CLEAR);
    drawArt(t, TEDDY, c);
    if (f % 4 < 2) drawArt(t, TEDDY_PANT, c);
    if (f === 14 || f === 15 || f === 33) drawArt(t, TEDDY_BLINK, c);
    p.blit(outline(t, c('ink', 0)), 0, 0, CLEAR);
    big(p, 'TEDDY', 24, 250);
    say(p, 'RED-GOLD CORGI.', 52, undefined, 250);
    say(p, 'ALL EARS.', 64, undefined, 250);
    say(p, 'A TON OF TRICKS.', 76, undefined, 250);
    if (f >= 20) {
      say(p, 'KNOWS LEFT', 150, c('yellow', 3), 250);
      say(p, 'FROM RIGHT!', 162, c('yellow', 3), 250);
    }
    reel.add(p);
  }
}

/**
 * A rope leash along a path, `w0` thick at its start and `w1` at its end (closer to the
 * camera), two-tone twisted; `dots` flecks it white like Gwinn's pink one.
 */
function rope(p: Pixels, path: Pt[], w0: number, w1: number, ramp: string, dots = false): void {
  const pts: [number, number, number][] = [];
  let len = 0;
  for (let i = 0; i + 1 < path.length; i++) len += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
  let s = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const [x0, y0] = path[i];
    const [x1, y1] = path[i + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    for (let k = 0; k < d; k += 0.5) pts.push([x0 + ((x1 - x0) * k) / d, y0 + ((y1 - y0) * k) / d, s + k]);
    s += d;
  }
  const disc = (x: number, y: number, rad: number, col: (dx: number, dy: number) => number) => {
    for (let dy = -Math.ceil(rad); dy <= rad; dy++)
      for (let dx = -Math.ceil(rad); dx <= rad; dx++) if (dx * dx + dy * dy <= rad * rad + 0.3) p.set(Math.round(x + dx), Math.round(y + dy), col(dx, dy));
  };
  const rad = (at: number) => (w0 + ((w1 - w0) * at) / Math.max(1, len)) / 2;
  for (const [x, y, at] of pts) disc(x, y, rad(at) + 1, () => c('ink', 0));
  for (const [x, y, at] of pts)
    disc(x, y, rad(at), (dx, dy) => {
      const twist = Math.floor((at + dx - dy) / 3) % 2;
      if (dots && (Math.round(x + dx) * 7 + Math.round(y + dy) * 5) % 11 === 0) return c('paint', 3);
      return c(ramp, dy < -rad(at) / 3 ? 3 : twist ? 2 : 1);
    });
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
  const knee = new Pixels(W, H, CLEAR);
  bg.blit(outline(drawArt(knee, JEANS, c), c('ink', 0)), 0, 0, CLEAR);
  // Teddy's purple rope leash, from his collar clip round in a loop and under the knee
  const purple: Pt[] = [
    [93, 126],
    [110, 124],
    [140, 122],
    [165, 120],
    [179, 124],
    [185, 135],
    [183, 150],
    [175, 162],
    [160, 168],
    [140, 171],
    [124, 173],
  ];
  for (let f = 0; f < 52; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const t = new Pixels(W, H, CLEAR);
    drawArt(t, GRASS_TEDDY, c);
    if (f % 6 >= 3 || f >= 40) drawArt(t, GRASS_TEDDY_PANT, c);
    const gone = f >= 40;
    if (!gone) {
      const bob = f >= 24 && f % 2 ? 1 : 0;
      drawArt(t, GRASS_GWINN, c, 0, bob);
      if (f === 9 || f === 17 || f === 33) drawArt(t, GWINN_BLINK, c, 0, bob);
    }
    p.blit(outline(t, c('ink', 0)), 0, 0, CLEAR);
    rope(p, purple, 4, 5, 'purple');
    if (!gone) {
      rope(
        p,
        [
          [196, 108],
          [205, 113],
          [210, 125],
          [207, 142],
          [205, 160],
          [203, 175],
          [195, 185],
          [180, 190],
          [165, 189],
          [150, 191],
          [130, 196],
          [112, 203],
        ],
        4,
        8,
        'pink',
        true,
      );
    } else {
      // zoomies: she bolts past Teddy, right in front of him, trailing her pink leash
      const x = 166 - (f - 40) * 20;
      const y = 100;
      rope(
        p,
        [
          [x + 38, y + 24],
          [x + 70, y + 46],
          [x + 110, y + 62],
          [x + 150, y + 80],
          [x + 170, y + 110],
        ],
        4,
        7,
        'pink',
        true,
      );
      const g = new Pixels(W, H, CLEAR);
      drawArt(g, f % 2 ? GWINN_RUN1 : GWINN_RUN2, c, x, y, true);
      for (let k = 0; k < 4; k++) g.rect(x + 152 + k * 12 + (f % 2) * 4, y + 14 + k * 9, 12 - k * 2, 2, c('paint', 3));
      p.blit(outline(g, c('ink', 0)), 0, 0, CLEAR);
    }
    big(p, 'GWINN', 4, 250);
    if (f < 24) {
      say(p, 'BIG SISTER. ADOPTED.', 182);
    } else if (f < 40) {
      say(p, 'SIT, GWINN! SIT!', 170, c('yellow', 3));
      if (f >= 31) say(p, '...NOPE.', 182);
    } else {
      say(p, 'SHE KNOWS ONE TRICK:', 170);
      say(p, 'ZOOMIES!', 182, c('yellow', 3));
    }
    reel.add(p);
  }
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
    const bawk = f > 4 && f % 6 < 2;
    const l = new Pixels(W, H, CLEAR);
    const bob = on && f % 2 ? 1 : 0;
    drawArt(l, LEO, c, 0, bob);
    paintFace(l, bob, c);
    if (on) drawArt(l, LEO_NOSE, c, 0, bob);
    if (f === 8 || f === 40) drawArt(l, LEO_BLINK, c, 0, bob);
    // his right arm up, in its corduroy sleeve, the chicken in his fist and its leash hanging
    poly(
      l,
      [
        [194, 200],
        [198, 172],
        [212, 158],
        [226, 164],
        [222, 176],
        [210, 186],
        [212, 200],
      ],
      (x) => c('ink', x % 3 ? 1 : 0),
    );
    l.line(212, 158, 198, 172, c('blue', 0)).line(198, 172, 194, 200, c('blue', 0));
    rope(
      l,
      [
        [219, 138],
        [214, 150],
        [212, 168],
        [214, 186],
        [218, 204],
      ],
      3,
      3,
      'red',
    );
    drawArt(l, bawk ? CHICKEN_BAWK : CHICKEN, c, 196, 55);
    p.blit(outline(l, c('ink', 0)), 0, 0, CLEAR);
    if (bawk) outlined(p, 262, 50, 'BAWK!', c('yellow', 3), c('ink', 0), 1);
    big(p, 'DOC LEO', 6, 262);
    if (!on) say(p, 'A HOBO CLOWN, AND HIS', 170);
    if (!on) say(p, 'RUBBER CHICKEN ON A LEASH.', 182);
    if (on) say(p, 'NOSE ON: SHOWTIME!', 170, c('yellow', 3));
    if (f >= 32) say(p, '(HE ALWAYS ORDERS ROOT BEER.)', 182);
    if (f === 22 || f === 23) for (let k = 0; k < 8; k++) p.set(128 + Math.round(Math.cos(k) * 14), 100 + Math.round(Math.sin(k) * 12), c('yellow', 3));
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

/** Scene 4: the CitiCar plugged in at a charging station; the current runs down the cable. */
function carScene(reel: Reel): void {
  const p = new Pixels(W, H);
  // stucco wall over a stone base, the parking space, a strip of grass, the curb
  gradient(p, 0, 0, W, 70, r('cream'), 3, 1);
  p.rect(0, 68, W, 2, c('cream', 0));
  for (let y = 70; y < 122; y += 5)
    for (let x = (y / 5) % 2 ? 0 : 7; x < W; x += 14) p.rect(x, y, 13, 4, c('stone', 2 + ((x * 3 + y) % 7 === 0 ? 1 : 0))).rect(x, y + 4, 13, 1, c('stone', 1));
  p.rect(0, 122, W, 78, c('asphalt', 1));
  speckle(p, 0, 122, W, 78, r('asphalt'), 1, 1, 13, 0.2);
  p.rect(250, 122, 70, 78, c('grass', 2));
  speckle(p, 250, 122, 70, 78, r('grass'), 2, 1, 7, 0.3);
  poly(
    p,
    [
      [246, 122],
      [252, 122],
      [228, 200],
      [220, 200],
    ],
    () => c('cream', 2),
  );
  p.line(0, 196, 210, 140, c('paint', 3));
  // the red charging-station sign
  p.rect(8, 6, 116, 32, c('red', 1)).frame(8, 6, 116, 32, c('paint', 3));
  outlined(p, 34, 10, 'EV ONLY', c('paint', 3), c('red', 0), 1);
  outlined(p, 34, 23, 'CHARGING', c('paint', 3), c('red', 0), 1);
  p.ring(21, 22, 9, c('paint', 3)).rect(18, 17, 6, 8, c('paint', 3)).rect(19, 14, 1, 3, c('paint', 3)).rect(22, 14, 1, 3, c('paint', 3));
  // the charger post on its pad, its screen showing the charge
  p.rect(262, 168, 34, 8, c('stone', 3)).rect(262, 175, 34, 2, c('stone', 1));
  p.rect(268, 92, 22, 78, c('ink', 0)).rect(270, 94, 18, 74, c('ink', 1)).rect(272, 98, 14, 30, c('paint', 3)).rect(274, 102, 10, 12, c('ink', 0));
  const volt = r('volt');
  for (let k = 0; k < 4; k++) p.rect(276, 111 - k * 3, 6, 2, volt[k % volt.length]);
  p.rect(287, 130, 5, 8, c('ink', 0));
  const car = new Pixels(W, H, CLEAR);
  drawArt(car, CITICAR, c);
  micro(car, 48, 153, 'THE CHEZ', c('ink', 0));
  p.blit(outline(car, c('ink', 0)), 0, 0, CLEAR);
  // the cable: from the post round to the port at the back of the car, its colors cycling
  const path: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    path.push([Math.round(289 + (189 - 289) * t), Math.round(134 + (106 - 134) * t + Math.sin(t * Math.PI) * 38)]);
  }
  for (const [x, y] of path) p.rect(x - 1, y - 1, 3, 3, c('ink', 0));
  path.forEach(([x, y], i) => p.set(x, y, volt[Math.floor(i / 3) % volt.length]));
  p.rect(186, 104, 5, 5, c('ink', 0)).rect(187, 105, 3, 3, c('metal', 3));
  big(p, 'CITICAR', 4, 258);
  say(p, 'RED. 1976.', 26, undefined, 258);
  say(p, '100% ELECTRIC.', 38, undefined, 258);
  for (let f = 0; f < 36; f++) {
    const q = new Pixels(W, H);
    q.px.set(p.px);
    if (f >= 8) say(q, 'ITS NAME:', 56, c('yellow', 3), 258);
    if (f >= 8) say(q, 'THE CHEZ.', 68, c('yellow', 3), 258);
    if (f >= 18) say(q, 'CHARGES A MILE AN HOUR.', 190, c('yellow', 3));
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
    if (f >= 10) say(q, 'LEAVE A BOOK.', 66, undefined, 250);
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
