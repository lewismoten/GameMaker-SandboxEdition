// Big pictures for the screens: the root beer mug, the thirteen-star circle, THE CHEZ pulling
// the stand, the stand itself, Doc Leo and the dogs scaled up, recipe card paper and the
// CLASSIFIED stamp. All in the Pantry palette's fixed ramps.
import { Pixels, rng } from '../../../kit/pixels';
import { chezSide, CHEZ_WHEELS } from '../../../kit/chez';
import { blob, centered, gradient, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { c, r } from '../art/pal';

export const W = 320;
export const H = 200;

/** A five-pointed star. */
function star(p: Pixels, cx: number, cy: number, rad: number, col: number): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? rad * 0.42 : rad;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
    for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) p.set(x, y, col);
    }
}

/** Thirteen stars in a circle, as on the 1777 flag: a baker's dozen of them. */
export function starCircle(p: Pixels, cx: number, cy: number, rad: number, size: number, col: number, lit = -1, litCol = col): void {
  for (let i = 0; i < 13; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 13;
    star(p, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9, size, i === lit ? litCol : col);
  }
}

/** A frosty glass mug of root beer, foam on top, `s` pixels per unit (about 30 x 40 units). */
export function mug(p: Pixels, x: number, y: number, s: number): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) =>
    p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
  // handle
  for (let a = -1.4; a < 1.4; a += 0.05) {
    const hx = x + (30 + Math.cos(a) * 9) * s;
    const hy = y + (22 + Math.sin(a) * 11) * s;
    p.disc(hx, hy, 2.4 * s, c('ink', 0));
    p.disc(hx, hy, 1.4 * s, c('sky', 4));
  }
  R(-1, 6, 32, 38, c('ink', 0));
  R(0, 7, 30, 36, c('sky', 4));
  // root beer, darker at the bottom, bubbles rising
  for (let yy = 10; yy < 42; yy++) R(2, yy, 26, 1, (r('rootbeer') as number[])[Math.max(0, Math.min(4, Math.round(3.5 - (yy - 10) / 9)))]);
  R(3, 11, 3, 30, c('rootbeer', 4));
  const R2 = rng(5);
  for (let i = 0; i < 14; i++) p.disc(x + (8 + R2() * 18) * s, y + (14 + R2() * 26) * s, 0.7 * s, c('foam', 1));
  R(0, 42, 30, 2, c('sky', 3));
  // foam
  for (const [fx, fy, fr] of [
    [4, 6, 5],
    [11, 4, 6],
    [19, 5, 6],
    [26, 6, 5],
    [8, 9, 5],
    [22, 9, 5],
    [27, 11, 3],
  ])
    blob(p, x + fx * s, y + fy * s, fr * s, fr * 0.8 * s, [c('foam', 0), c('foam', 1), c('foam', 2), c('paper', 4)], 0, 3);
  // a drip down the side
  R(28, 10, 2, 8, c('foam', 1));
  p.disc(x + 29 * s, y + 18 * s, 1.2 * s, c('foam', 1));
}

/** The colonial tricorn, `s` per unit (about 30 x 10 units). */
export function bigTricorn(p: Pixels, x: number, y: number, s: number): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) =>
    p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
  R(0, 5, 30, 5, c('ink', 0));
  R(1, 3, 3, 3, c('ink', 0));
  R(26, 3, 3, 3, c('ink', 0));
  R(7, 0, 16, 6, c('ink', 1));
  R(0, 9, 30, 1, c('brass', 2));
  p.disc(x + 22 * s, y + 6 * s, 1.8 * s, c('paper', 4));
  p.disc(x + 22 * s, y + 6 * s, 0.9 * s, c('red', 3));
}

/**
 * THE CHEZ: a 1976½ CitiCar, from the shared side view (games/kit/chez.ts): a short tomato-red
 * wedge, the black roof, one door window, the racing stripes stepping up over the rear quarter,
 * white wheels on black tires. Seen from the side, nose to the right, about 60 x 33 units, the
 * back of the rear bumper at x and the tires on the ground at y + 33s. `wheel` turns them.
 */
export function chez(p: Pixels, x: number, y: number, s: number, wheel = 0): void {
  const k = 1.5 * s;
  const ox = Math.round(x - 3.9 * k);
  const oy = Math.round(y + 33 * s - 20 * k);
  chezSide(
    p,
    ox,
    oy,
    {
      body: [c('red', 2), c('red', 3), c('red', 4)],
      trim: c('red', 1),
      glass: [c('sky', 0), c('sky', 4)],
      roof: c('ink', 0),
      tire: c('ink', 0),
      hub: c('grey', 3),
      rim: c('paper', 4),
      bumper: c('ink', 1),
      lamp: c('orange', 3),
      tail: c('red', 5),
      stripe: c('ink', 2),
      pin: c('paper', 4),
      chrome: c('grey', 4),
    },
    'right',
    k,
  );
  // a mark on each wheel, going round
  const a = wheel * 0.9;
  for (const wx of CHEZ_WHEELS) p.set(ox + wx * k + Math.cos(a) * 1.4 * k, oy + 20 * k - 3.25 * k - 0.5 + Math.sin(a) * 1.4 * k, c('grey', 1));
}

/** Doc Leo's root beer stand on wheels, striped awning, a barrel and a sign: about 70 x 60 units. */
export function stand(p: Pixels, x: number, y: number, s: number, sign = "DOC LEO'S"): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) =>
    p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
  // awning
  for (let i = 0; i < 7; i++) R(i * 10, 0, 10, 10, i % 2 ? c('paper', 4) : c('red', 3));
  for (let i = 0; i < 7; i++) p.disc(x + (i * 10 + 5) * s, y + 10 * s, 5 * s, i % 2 ? c('paper', 4) : c('red', 3));
  R(2, 12, 2, 28, c('wood', 2));
  R(66, 12, 2, 28, c('wood', 2));
  // counter
  R(0, 32, 70, 18, c('wood', 3));
  R(0, 32, 70, 2, c('wood', 5));
  R(4, 36, 62, 10, c('paper', 4));
  const t = sign.length * 8;
  text(p, Math.round(x + 35 * s - t / 2), Math.round(y + 37 * s), sign, c('red', 2));
  micro(p, Math.round(x + 22 * s), Math.round(y + 45 * s), 'ROOT BEER  5 CENTS', c('rootbeer', 1));
  // a keg on top, and mugs
  blob(p, x + 50 * s, y + 25 * s, 9 * s, 7 * s, r('wood'), 1, 5);
  R(14, 26, 6, 6, c('sky', 4));
  R(15, 27, 4, 5, c('rootbeer', 2));
  R(24, 26, 6, 6, c('sky', 4));
  R(25, 27, 4, 5, c('rootbeer', 2));
  // wheels
  for (const wx of [12, 58]) {
    p.disc(x + wx * s, y + 54 * s, 6 * s, c('ink', 0));
    p.disc(x + wx * s, y + 54 * s, 4 * s, c('wood', 2));
    p.disc(x + wx * s, y + 54 * s, 1.5 * s, c('brass', 3));
  }
}

/** Index card paper: cream, a red header line and blue rules. */
export function card(p: Pixels, x: number, y: number, w: number, h: number, tilt = 0, opts: { rule?: number; stain?: [number, number] | null } = {}): void {
  p.rect(x + 4, y + 4, w, h, c('dark', 0));
  for (let yy = 0; yy < h; yy++) {
    const dx = Math.round((tilt * yy) / h);
    p.rect(x + dx, y + yy, w, 1, c('paper', 4));
  }
  const rule = opts.rule ?? 18;
  p.rect(x, y + rule, w, 1, c('red', 3));
  for (let yy = y + rule + 12; yy < y + h - 4; yy += 11) p.rect(x + 2, yy, w - 4, 1, c('sky', 4));
  p.frame(x, y, w, h, c('paper', 2));
  // a ring stain (root beer), by default near the bottom right corner
  if (opts.stain === null) return;
  const [sx, sy] = opts.stain ?? [x + w - 28, y + h - 22];
  p.ring(sx, sy, 12, c('rootbeer', 4));
  p.ring(sx, sy, 11, c('paper', 3));
}

/** A rubber stamp, red, at an angle, a little uneven. */
export function stamp(p: Pixels, cx: number, cy: number, words: string, scale = 2, angle = -0.18): void {
  const w = textWidth(words, scale) + 12;
  const h = 8 * scale + 10;
  const src = new Pixels(w, h, 255);
  src.frame(0, 0, w, h, c('red', 2)).frame(2, 2, w - 4, h - 4, c('red', 2));
  text(src, 6, 5, words, c('red', 2), scale);
  const R = rng(words.length * 13);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const span = Math.ceil(Math.hypot(w, h) / 2) + 1;
  // each pixel of the page looks back into the unrotated stamp (no holes)
  for (let dy = -span; dy <= span; dy++)
    for (let dx = -span; dx <= span; dx++) {
      const sx = Math.round(dx * cos + dy * sin + w / 2);
      const sy = Math.round(-dx * sin + dy * cos + h / 2);
      const v = src.get(sx, sy);
      if (v === 255 || v < 0 || R() < 0.07) continue;
      p.set(cx + dx, cy + dy, v);
    }
}

/** A big headline with a drop shadow. */
export function headline(p: Pixels, y: number, s: string, scale: number, fill: number, edge: number, cx = W / 2): void {
  const x = Math.round(cx - textWidth(s, scale) / 2);
  text(p, x + 2, y + 3, s, c('ink', 0), scale);
  text(p, x + 3, y + 3, s, c('ink', 0), scale);
  outlined(p, x, y, s, fill, edge, scale);
}

/** A kitchen wall: subway tile above, wainscot below, in the fixed ramps. */
export function kitchenWall(p: Pixels, floorY = 150): void {
  for (let y = 0; y < floorY; y++)
    for (let x = 0; x < W; x++) p.set(x, y, y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 0 ? c('grey', 4) : c('paper', 4));
  p.rect(0, floorY - 30, W, 4, c('wood', 3)).rect(0, floorY - 26, W, 26, c('wood', 2));
  for (let x = 6; x < W; x += 26) p.rect(x, floorY - 22, 18, 18, c('wood', 1));
  for (let y = floorY; y < H; y++)
    for (let x = 0; x < W; x++) p.set(x, y, (Math.floor(x / 16) + Math.floor((y - floorY) / 10)) % 2 ? c('floor', 4) : c('floor2', 3));
}

/** A night sky over Main Street: brick fronts, flags, a string of lights. */
export function mainStreet(p: Pixels, seed = 1): void {
  gradient(p, 0, 0, W, 120, r('sky'), 0, 4);
  const R = rng(seed);
  let x = 0;
  while (x < W) {
    const w = 50 + Math.floor(R() * 40);
    const h = 60 + Math.floor(R() * 40);
    const top = 128 - h;
    const brick = R() < 0.5 ? 'red' : 'brown';
    for (let yy = top; yy < 128; yy++)
      for (let xx = x; xx < x + w; xx++) p.set(xx, yy, yy % 4 === 3 || (xx + (Math.floor(yy / 4) % 2) * 3) % 6 === 0 ? c(brick, 1) : c(brick, 2));
    p.rect(x, top, w, 3, c('paper', 3));
    for (let wy = top + 10; wy < 110; wy += 22)
      for (let wx = x + 8; wx < x + w - 12; wx += 18) p.rect(wx, wy, 10, 14, c('sky', 1)).rect(wx, wy, 10, 1, c('paper', 4));
    // a flag on a pole
    p.rect(x + w - 6, top - 14, 1, 16, c('grey', 3));
    for (let i = 0; i < 6; i++) p.rect(x + w - 5, top - 14 + i, 12, 1, i % 2 ? c('paper', 4) : c('red', 3));
    p.rect(x + w - 5, top - 14, 5, 3, c('blue', 2));
    x += w + 2;
  }
  p.rect(0, 128, W, 6, c('grey', 4));
  p.rect(0, 134, W, 66, c('grey', 1));
  for (let xx = 0; xx < W; xx += 24) p.rect(xx, 166, 12, 2, c('yellow', 2));
}

export { centered, scaleBlit, text, micro, outlined, gradient, blob, textWidth };

/**
 * Doc Leo, large: a chewed grey fedora with a red band, the hobo face (ash beard, the white
 * mouth turned down, white round the eyes, rosy cheeks and the red nose), round spectacles,
 * a navy corduroy jacket with pins over a purple shirt and a green tie, and the rubber
 * chicken held up or hanging on its red leash. 40 x 64 units of `s` pixels, top-left at (x, y).
 */
export function bigLeo(p: Pixels, x: number, y: number, s: number, chickenUp = false): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) =>
    p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
  const D = (xx: number, yy: number, r0: number, col: number) => p.disc(x + xx * s, y + yy * s, r0 * s, col);
  const ink = c('ink', 0);
  // legs and red sneakers
  R(11, 50, 7, 11, c('blue', 0));
  R(22, 50, 7, 11, c('blue', 0));
  R(9, 60, 10, 4, c('red', 3));
  R(21, 60, 10, 4, c('red', 3));
  R(9, 63, 10, 1, c('paper', 4));
  R(21, 63, 10, 1, c('paper', 4));
  // jacket (corduroy ribs), shirt and tie
  R(6, 28, 28, 24, ink);
  R(7, 29, 26, 22, c('blue', 1));
  for (let i = 8; i < 33; i += 2) R(i, 29, 0.5, 22, c('blue', 2));
  R(16, 29, 8, 14, c('purple', 2));
  R(19, 29, 2, 13, c('green', 3));
  R(18.5, 41, 3, 2, c('green', 2));
  D(10, 33, 1.2, c('brass', 3));
  D(11, 37, 1, c('red', 3));
  D(9, 40, 1, c('sky', 3));
  // arms
  R(2, 30, 5, 16, c('blue', 1));
  R(2, 45, 5, 3, c('skin', 2));
  if (chickenUp) {
    R(33, 18, 5, 14, c('blue', 1));
    R(33, 15, 5, 3, c('skin', 2));
    // the chicken, squeezed, beak open
    R(30, 4, 12, 7, c('yellow', 3));
    R(30, 9, 12, 2, c('yellow', 1));
    R(40, 1, 5, 5, c('yellow', 3));
    R(45, 2, 3, 1, c('orange', 2));
    R(45, 4, 3, 1, c('orange', 2));
    R(41, 0, 2, 1, c('red', 3));
    R(42, 2, 1, 1, ink);
  } else {
    R(33, 30, 5, 16, c('blue', 1));
    R(33, 45, 5, 3, c('skin', 2));
    p.line(x + 36 * s, y + 47 * s, x + 40 * s, y + 56 * s, c('red', 2));
    R(37, 56, 9, 5, c('yellow', 3));
    R(44, 54, 3, 3, c('yellow', 3));
    R(47, 55, 2, 1, c('orange', 2));
    R(45, 53, 1, 1, c('red', 3));
  }
  // head
  R(10, 10, 20, 19, ink);
  R(11, 11, 18, 17, c('skin', 2));
  // the ash beard, and the white mouth turned down
  R(11, 20, 18, 8, c('night', 2));
  R(15, 21, 10, 5, c('paper', 4));
  R(17, 23, 6, 1, c('red', 1));
  R(16, 24, 1, 1, c('red', 1));
  R(23, 24, 1, 1, c('red', 1));
  // white round the eyes, spectacles, brows
  R(12, 13, 7, 6, c('paper', 4));
  R(21, 13, 7, 6, c('paper', 4));
  p.ring(x + 15.5 * s, y + 16 * s, 3.4 * s, c('brass', 2));
  p.ring(x + 24.5 * s, y + 16 * s, 3.4 * s, c('brass', 2));
  R(19, 16, 2, 0.6, c('brass', 2));
  R(15, 15, 2, 2, ink);
  R(24, 15, 2, 2, ink);
  R(12, 11, 7, 1.5, ink);
  R(21, 11, 7, 1.5, ink);
  // cheeks and the red nose
  D(13, 20, 1.6, c('red', 4));
  D(27, 20, 1.6, c('red', 4));
  D(20, 19, 2.6, c('red', 3));
  D(19.3, 18.3, 0.8, c('red', 5));
  // the chewed grey fedora
  R(4, 9, 32, 3, ink);
  R(5, 9, 30, 2, c('grey', 2));
  R(10, 1, 20, 9, ink);
  R(11, 2, 18, 7, c('grey', 3));
  R(11, 6, 18, 2, c('red', 1));
  R(18, 2, 4, 1, c('grey', 1));
  R(30, 9, 3, 1, c('night', 1)); // a bite out of the brim
}
