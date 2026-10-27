// The FLI animations: the intro counting from 1992 up to 2000, the teleporter, the rocket
// launch to the Moon, and the winning ending.
import { Pixels, dither, rng } from '../../../kit/pixels';
import { T, blob, oval, shadeAt } from '../art/draw';
import { textWidth } from '../art/font';
import { C } from '../art/pal';
import { H, R, W, centeredText, chrome, chromeCentered, fli, grid, scaleBlit, skyline, speedLines, sunsetSky, type Art } from './paint';

// ------------------------------------------------------------------ FLI animations
/** The intro: a flip calendar counts 1992 up to 2000, a flash, and the future arrives (then fades out). */
export function introFli(a: Art): Uint8Array {
  const frames: Pixels[] = [];
  const cal = (year: string, flip: number) => {
    const p = new Pixels(W, H, C('night', 0));
    const r = rng(3);
    for (let i = 0; i < 80; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('gray', 3 + Math.floor(r() * 4)));
    centeredText(p, 30, 'MEANWHILE, IN 1992, WE ASKED:', C('teal', 5));
    centeredText(p, 42, 'WHAT WILL THE FUTURE BE LIKE?', C('teal', 5));
    p.rect(80, 70, 160, 90, C('chrome', 2)).rect(84, 74, 152, 82, C('paper', 2));
    p.rect(84, 112, 152, 2, C('chrome', 3));
    const yy = 92 - 24;
    if (flip === 0) chrome(p, 160 - textWidth(year, 4) / 2, yy + 24, year, 4);
    else {
      // The top half folds down.
      chrome(p, 160 - textWidth(year, 4) / 2, yy + 24, year, 4);
      p.rect(84, 74, 152, Math.min(38, flip * 12), C('paper', 1));
    }
    return p;
  };
  for (let i = 0; i < 4; i++) frames.push(cal('1992', 0));
  for (let y = 1993; y <= 2000; y++) {
    frames.push(cal(String(y - 1), 1), cal(String(y - 1), 2), cal(String(y), 0));
    if (y >= 1998) frames.push(cal(String(y), 0));
  }
  for (let i = 0; i < 6; i++) frames.push(cal('2000', 0));
  // Flash to white, then the future fades up out of it: the city at dusk, seen lower than the
  // title shows it and without its lettering, a flying car swooping past close by; then a fade
  // to black, and the title fades in after.
  const city = new Pixels(W, H);
  sunsetSky(city, 112, 5);
  skyline(city, 112, 7);
  grid(city, 112);
  const flash = new Pixels(W, H, C('gray', 7));
  frames.push(flash, flash);
  for (let k = 1; k <= 5; k++) frames.push(new Pixels(W, H).map((x, y) => (dither(x, y, k / 5) ? city.get(x, y) : C('gray', 7))));
  for (let k = 0; k < 16; k++) {
    const p = new Pixels(W, H);
    p.px.set(city.px);
    const x = -70 + k * 26;
    const y = 130 - Math.round(Math.sin((k / 15) * Math.PI) * 60);
    if (x < W) {
      scaleBlit(p, a.carT, x, y, 3);
      speedLines(p, x, y + 4, 48, C('gray', 7));
    }
    frames.push(p);
  }
  frames.push(city, city, city, city);
  return fli(frames, 6, undefined, true);
}

/** The Teleport-A-Phone: BZZZT. */
export function teleFli(a: Art): Uint8Array {
  const frames: Pixels[] = [];
  for (let k = 0; k < 16; k++) {
    const p = new Pixels(W, H, C('night', 0));
    for (let ring = 0; ring < 6; ring++) {
      const rad = ((k * 12 + ring * 30) % 180) + 2;
      p.ring(160, 100, rad, ring % 2 ? C('teal', 4) : C('pink', 4));
      p.ring(160, 100, rad + 1, C('teal', 2));
    }
    const r = rng(k + 1);
    for (let i = 0; i < 40; i++) p.set(160 + (r() - 0.5) * 240, 100 + (r() - 0.5) * 160, C('gray', 7));
    if (k < 10) scaleBlit(p, a.dex, 130, 70, 3);
    else if (k < 13) {
      const d = new Pixels(20, 20, T).map((x, y) => (a.dex.get(x, y) !== T && (y + k) % (k - 8) === 0 ? C('teal', 5) : T));
      scaleBlit(p, d, 130, 70, 3);
    }
    if (k >= 4 && k % 2 === 0) centeredText(p, 20, 'BZZZZZZT!', C('gold', 5), C('gray', 0), 2);
    centeredText(p, 180, 'THANK YOU FOR USING TELEPORT-A-PHONE', C('gray', 6));
    frames.push(p);
  }
  return fli(frames, 5);
}

/** The Moon Shuttle: 3, 2, 1, liftoff, and the Moon comes up fast. */
export function launchFli(a: Art): Uint8Array {
  void a;
  const frames: Pixels[] = [];
  const scene = (rocketY: number, flame: number, sky: number, moonR: number, count?: string) => {
    const p = new Pixels(W, H);
    for (let y = 0; y < H; y++) p.rect(0, y, W, 1, sky >= 1 ? C('night', 0) : C('sky', Math.min(7, Math.floor((1 - sky) * (y / H) * 8))));
    if (sky > 0.3) {
      const r = rng(5);
      for (let i = 0; i < 80 * sky; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('gray', 6));
    }
    if (moonR > 0) blob(p, 160, 60, moonR, moonR, R('moon'), 1, 5);
    if (sky < 0.5) p.rect(0, 170 + sky * 60, W, 40, C('concrete', 2));
    // The rocket.
    const cx = 160;
    for (let y = 0; y < 60; y++) {
      const half = y < 14 ? Math.round(Math.sqrt(y) * 2.6) : 9;
      for (let x = -half; x < half; x++) p.set(cx + x, rocketY + y, shadeAt(R('chrome'), 2, 7, 1 - Math.abs(x + 3) / 12, cx + x, rocketY + y));
    }
    p.rect(cx - 9, rocketY + 16, 18, 2, C('red', 3));
    oval(p, cx, rocketY + 26, 4, 4, C('glass', 2));
    for (const s of [-1, 1])
      for (let k = 0; k < 10; k++) p.line(cx + s * 9, rocketY + 44 + k, cx + s * (10 + Math.min(9, k + 2)), rocketY + 54 + k / 2, C('red', 2));
    if (flame > 0)
      for (let k = 0; k < flame; k++) {
        const r = rng(k * 7 + rocketY);
        for (let i = 0; i < 30; i++) p.set(cx + (r() - 0.5) * (8 + k * 3), rocketY + 60 + k * 4 + r() * 6, i % 3 ? C('orange', 4) : C('gold', 5));
      }
    if (count) centeredText(p, 20, count, C('gold', 5), C('gray', 0), 3);
    return p;
  };
  for (const c of ['3', '2', '1']) for (let i = 0; i < 5; i++) frames.push(scene(110, i % 2, 0, 0, c));
  for (let i = 0; i < 4; i++) frames.push(scene(110 - i, 4 + (i % 2), 0, 0, 'LIFTOFF!'));
  for (let i = 0; i < 16; i++) frames.push(scene(106 - i * 8, 6, i / 16, 0));
  for (let i = 0; i < 14; i++) frames.push(scene(-80, 0, 1, 8 + i * 9));
  return fli(frames, 6);
}

/** Fireworks over Hover Heights, for the ending. */
export function wonFli(): Uint8Array {
  const frames: Pixels[] = [];
  const bursts = [
    [80, 50, 0, 'pink'],
    [220, 40, 4, 'gold'],
    [150, 70, 8, 'teal'],
    [60, 80, 12, 'neon'],
    [250, 70, 14, 'pink'],
  ] as const;
  for (let k = 0; k < 26; k++) {
    const p = new Pixels(W, H);
    sunsetSky(p, 150, 30);
    for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) if (y < 110) p.set(x, y, C('night', 1 + Math.floor((y / 110) * 3)));
    skyline(p, 150, 8);
    grid(p, 150);
    for (const [x, y, t0, col] of bursts) {
      const t = k - t0;
      if (t < 0) continue;
      if (t < 3) p.rect(x, 150 - (150 - y) * (t / 3), 1, 4, C('gold', 5));
      else if (t < 12) {
        const rad = (t - 3) * 5;
        for (let s = 0; s < 16; s++) {
          const ang = (s / 16) * Math.PI * 2;
          const px = x + Math.cos(ang) * rad;
          const py = y + Math.sin(ang) * rad + (t - 3) * (t - 3) * 0.15;
          p.set(px, py, C(col, t < 8 ? 5 : 3)).set(px + 1, py, C(col, 4));
        }
      }
    }
    chromeCentered(p, 170, 'YOU DID IT!', 2, true);
    frames.push(p);
  }
  return fli(frames, 7);
}
