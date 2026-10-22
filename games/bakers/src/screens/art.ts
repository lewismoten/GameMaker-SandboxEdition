// Big pictures for the screens: the root beer mug, the thirteen-star circle, THE CHEZ pulling
// the stand, the stand itself, Doc Leo and the dogs scaled up, recipe card paper and the
// CLASSIFIED stamp. All in the Pantry palette's fixed ramps.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, centered, gradient, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { c, r } from '../art/pal';

export const W = 320;
export const H = 200;

/** A five-pointed star. */
export function star(p: Pixels, cx: number, cy: number, rad: number, col: number): void {
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
  const R = (xx: number, yy: number, w: number, h: number, col: number) => p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
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
  const R = (xx: number, yy: number, w: number, h: number, col: number) => p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
  R(0, 5, 30, 5, c('ink', 0));
  R(1, 3, 3, 3, c('ink', 0));
  R(26, 3, 3, 3, c('ink', 0));
  R(7, 0, 16, 6, c('ink', 1));
  R(0, 9, 30, 1, c('brass', 2));
  p.disc(x + 22 * s, y + 6 * s, 1.8 * s, c('paper', 4));
  p.disc(x + 22 * s, y + 6 * s, 0.9 * s, c('red', 3));
}

/**
 * THE CHEZ: a 1976 CitiCar, a tomato-red wedge with a flat hood, round headlights in pods, a
 * huge upright windshield, a grey roof and little whitewall tires. Seen from the side, nose to
 * the right, about 60 x 34 units. (The charge port is at the rear, passenger side.)
 */
export function chez(p: Pixels, x: number, y: number, s: number, wheel = 0): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) => p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
  const red = c('red', 3);
  // body: the wedge (low nose, tall square back)
  for (let xx = 0; xx < 60; xx++) {
    const top = xx < 30 ? 6 : 6 + (xx - 30) * 0.55;
    R(xx, top, 1, 26 - top, xx < 2 || xx > 57 ? c('ink', 0) : red);
  }
  R(0, 25, 60, 2, c('ink', 0));
  R(2, 8, 54, 1, c('red', 4));
  // roof and windows
  R(4, 0, 30, 6, c('grey', 3));
  R(4, 0, 30, 1, c('grey', 5));
  R(6, 6, 12, 10, c('sky', 2));
  R(20, 6, 11, 10, c('sky', 3));
  for (let k = 0; k < 10; k++) R(31 + k * 0.4, 6 + k, 1, 1, c('sky', 3));
  R(18, 6, 2, 18, c('ink', 0));
  R(7, 7, 4, 1, c('sky', 4));
  // pinstripe, door handle, bumper, headlight, charge port at the back
  R(2, 17, 56, 1, c('paper', 4));
  R(14, 18, 3, 1, c('grey', 2));
  R(56, 21, 5, 4, c('ink', 1));
  R(53, 15, 4, 4, c('paper', 4));
  R(55, 18, 2, 2, c('orange', 3));
  R(1, 13, 2, 3, c('grey', 1));
  // wheels with whitewalls
  for (const wx of [12, 46]) {
    p.disc(x + wx * s, y + 27 * s, 6 * s, c('ink', 0));
    p.disc(x + wx * s, y + 27 * s, 3.4 * s, c('paper', 4));
    p.disc(x + wx * s, y + 27 * s, 2.2 * s, c('grey', 3));
    const a = wheel * 0.9;
    p.set(x + wx * s + Math.cos(a) * 2 * s, y + 27 * s + Math.sin(a) * 2 * s, c('ink', 0));
  }
}

/** Doc Leo's root beer stand on wheels, striped awning, a barrel and a sign: about 70 x 60 units. */
export function stand(p: Pixels, x: number, y: number, s: number, sign = "DOC LEO'S"): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) => p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.ceil(w * s), Math.ceil(h * s), col);
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
export function card(p: Pixels, x: number, y: number, w: number, h: number, tilt = 0): void {
  p.rect(x + 4, y + 4, w, h, c('dark', 0));
  for (let yy = 0; yy < h; yy++) {
    const dx = Math.round((tilt * yy) / h);
    p.rect(x + dx, y + yy, w, 1, c('paper', 4));
  }
  p.rect(x, y + 18, w, 1, c('red', 3));
  for (let yy = y + 30; yy < y + h - 4; yy += 11) p.rect(x + 2, yy, w - 4, 1, c('sky', 4));
  p.frame(x, y, w, h, c('paper', 2));
  // a ring stain (root beer)
  p.ring(x + w - 28, y + h - 22, 12, c('rootbeer', 4));
  p.ring(x + w - 28, y + h - 22, 11, c('paper', 3));
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
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = src.get(x, y);
      if (v === 255 || R() < 0.18) continue;
      const dx = x - w / 2;
      const dy = y - h / 2;
      p.set(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos, v);
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
  for (let y = floorY; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (Math.floor(x / 16) + Math.floor((y - floorY) / 10)) % 2 ? c('floor', 4) : c('floor2', 3));
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
    for (let yy = top; yy < 128; yy++) for (let xx = x; xx < x + w; xx++) p.set(xx, yy, yy % 4 === 3 || (xx + (Math.floor(yy / 4) % 2) * 3) % 6 === 0 ? c(brick, 1) : c(brick, 2));
    p.rect(x, top, w, 3, c('paper', 3));
    for (let wy = top + 10; wy < 110; wy += 22) for (let wx = x + 8; wx < x + w - 12; wx += 18) p.rect(wx, wy, 10, 14, c('sky', 1)).rect(wx, wy, 10, 1, c('paper', 4));
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
