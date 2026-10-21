// The 320x200 pictures: the title, the menu (on a TV, of course), the illustrated
// storyline, notebook-paper text pages, level cards, the endings, and the FLI
// animations: the intro counting from 1992 up to 2000, the teleporter, and the rocket.
import { encodeFli } from '../../web/src/formats/fli';
import { encodeGif } from '../../web/src/formats/gif';
import { Pixels, dither, rng } from '../kit/pixels';
import { T, blob, gradient, oval, shadeAt } from './src/art/draw';
import { micro, microWidth, outlined, text, textWidth } from './src/art/font';
import { C, PAL } from './src/art/pal';

const R = PAL.r;
export const W = 320;
export const H = 200;

export function gif(p: Pixels): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: p.px, palette: PAL.pal });
}

export function fli(frames: Pixels[], speed: number, palettes?: Uint8Array[]): Uint8Array {
  return encodeFli(
    frames.map((f) => Uint8Array.from(f.px)),
    PAL.pal,
    { speed, palettes },
  );
}

/** Copies a picture scaled up by an integer factor, skipping transparent pixels. */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): Pixels {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const c = src.px[yy * src.w + (flip ? src.w - 1 - xx : xx)];
      if (c !== T) dst.rect(x + xx * s, y + yy * s, s, s, c);
    }
  return dst;
}

// ------------------------------------------------------------------ lettering
/** 80s chrome lettering: sky-blue top, dark horizon line, bright bottom, outlined. */
export function chrome(p: Pixels, x: number, y: number, s: string, scale: number, warm = false): void {
  const mask = new Pixels(W, H, 0);
  text(mask, x, y, s, 1, scale);
  const h = 8 * scale;
  const ink = C('night', 0);
  // Drop shadow, then a thick outline.
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (mask.get(xx - 3, yy - 3) === 1 && mask.get(xx, yy) !== 1) p.set(xx, yy, C('purple', 1));
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) {
      if (mask.get(xx, yy) === 1) continue;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 2],
        [-1, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
      ])
        if (mask.get(xx + dx, yy + dy) === 1) {
          p.set(xx, yy, ink);
          break;
        }
    }
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + s.length * 8 * scale; xx++) {
      if (mask.get(xx, yy) !== 1) continue;
      const t = (yy - y) / h;
      let c: number;
      if (warm) c = t < 0.48 ? shadeAt(R('gold'), 5, 3, t * 2, xx, yy) : t < 0.55 ? C('orange', 1) : shadeAt(R('orange'), 2, 4, (t - 0.55) * 2.2, xx, yy);
      else c = t < 0.48 ? shadeAt(R('sky'), 7, 3, t * 2, xx, yy) : t < 0.54 ? C('night', 2) : shadeAt(R('pink'), 2, 5, (t - 0.54) * 2.2, xx, yy);
      p.set(xx, yy, c);
    }
  // Glints.
  const r = rng(s.length * 17 + x);
  for (let i = 0; i < Math.max(2, s.length / 2); i++) {
    const gx = x + Math.floor(r() * s.length * 8 * scale);
    const gy = y + Math.floor(r() * h * 0.4);
    if (mask.get(gx, gy) !== 1) continue;
    for (let k = -3; k <= 3; k++) {
      p.set(gx + k, gy, C('grey', 7));
      p.set(gx, gy + k, C('grey', 7));
    }
  }
}

export function chromeCentered(p: Pixels, y: number, s: string, scale: number, warm = false): void {
  chrome(p, Math.round((W - textWidth(s, scale)) / 2), y, s, scale, warm);
}

function centeredText(p: Pixels, y: number, s: string, col: number, shadow?: number, scale = 1): void {
  const x = Math.round((W - textWidth(s, scale)) / 2);
  if (shadow !== undefined) text(p, x + 1, y + 1, s, shadow, scale);
  text(p, x, y, s, col, scale);
}

// ------------------------------------------------------------------ scenery
function sunsetSky(p: Pixels, horizon: number, seed = 1): void {
  for (let y = 0; y < horizon; y++) for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('sunset'), 0, 11, (y / horizon) ** 1.4, x, y));
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const y = Math.floor(r() * horizon * 0.45);
    p.set(Math.floor(r() * W), y, C('grey', 5 + Math.floor(r() * 3)));
  }
}

/** The striped setting sun every 1980s album cover had. */
function stripedSun(p: Pixels, cx: number, cy: number, rad: number): void {
  for (let y = cy - rad; y <= cy; y++)
    for (let x = cx - rad; x <= cx + rad; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue;
      const t = (y - (cy - rad)) / rad;
      const gap = t > 0.45 && Math.floor((y - cy) / 3) % 2 === 0 && cy - y < rad * 0.55 && (cy - y) % (2 + Math.floor((t - 0.45) * 8)) === 0;
      if (gap) continue;
      p.set(x, y, shadeAt(R('gold'), 5, 2, t, x, y));
    }
}

/** A dome city skyline: domes, needle towers, a monorail. */
function skyline(p: Pixels, base: number, seed = 3, dark = 'purple'): void {
  const r = rng(seed);
  const col = (k: number) => C(dark, k);
  // Back row of needles and towers.
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * W);
    const h = 40 + Math.floor(r() * 50);
    p.rect(x - 2, base - h, 4, h, col(1));
    oval(p, x, base - h, 9, 3, col(1));
    p.rect(x - 1, base - h - 12, 2, 12, col(1));
    for (let k = 0; k < 4; k++) p.set(x - 6 + k * 4, base - h, C('gold', 5));
  }
  // Front row of domes with lit windows.
  for (let i = 0; i < 8; i++) {
    const cx = 20 + i * 42 + Math.floor(r() * 12);
    const rad = 14 + Math.floor(r() * 14);
    for (let y = base - rad; y <= base; y++)
      for (let x = cx - rad; x <= cx + rad; x++) if ((x - cx) ** 2 + ((y - base) * 1.1) ** 2 <= rad * rad) p.set(x, y, x - cx < -rad / 3 ? col(2) : col(1));
    for (let x = cx - rad + 3; x < cx + rad - 2; x += 4) if (r() < 0.7) p.set(x, base - Math.floor(rad / 2), C('gold', 4));
  }
  // The monorail.
  p.rect(0, base - 30, W, 2, col(2));
  for (let x = 10; x < W; x += 50) p.rect(x, base - 30, 3, 30, col(1));
}

/** A neon perspective grid floor. */
function grid(p: Pixels, top: number): void {
  for (let y = top; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, shadeAt(R('night'), 1, 3, (y - top) / (H - top), x, y));
  for (let k = -20; k <= 20; k++) p.line(160 + k * 4, top, 160 + k * 40, H, C('pink', 3));
  let y = top + 1;
  let step = 2;
  while (y < H) {
    p.rect(0, y, W, 1, C('pink', 3));
    y += step;
    step += 2;
  }
  p.rect(0, top, W, 1, C('pink', 5));
}

function speedLines(p: Pixels, x: number, y: number, len: number, col: number): void {
  for (let k = 0; k < 3; k++) p.rect(x - len + k * 4, y + 4 + k * 5, len - k * 8, 1, col);
}

/** A big 1992 console TV, screen rectangle given. Returns nothing; draws in place. */
function consoleTv(p: Pixels, sx: number, sy: number, sw: number, sh: number, screen: number): void {
  const x0 = sx - 18;
  const y0 = sy - 16;
  const w = sw + 64;
  const h = sh + 32;
  p.rect(x0, y0, w, h, C('wood', 2));
  for (let y = y0 + 2; y < y0 + h; y += 4) p.rect(x0, y, w, 1, C('wood', 1));
  p.frame(x0, y0, w, h, C('wood', 0));
  p.rect(sx - 6, sy - 6, sw + 12, sh + 12, C('grey', 1));
  p.rect(sx - 4, sy - 4, sw + 8, sh + 8, C('grey', 2));
  p.rect(sx, sy, sw, sh, screen);
  // Rounded corners of the tube.
  for (const [cx, cy] of [
    [sx, sy],
    [sx + sw - 1, sy],
    [sx, sy + sh - 1],
    [sx + sw - 1, sy + sh - 1],
  ])
    p.set(cx, cy, C('grey', 2));
  // Knobs and speaker grille on the right.
  const kx = sx + sw + 14;
  oval(p, kx + 10, sy + 12, 7, 7, C('chrome', 3));
  oval(p, kx + 10, sy + 12, 5, 5, C('chrome', 5));
  oval(p, kx + 10, sy + 34, 7, 7, C('chrome', 3));
  oval(p, kx + 10, sy + 34, 5, 5, C('chrome', 5));
  for (let y = sy + 50; y < sy + sh; y += 3) p.rect(kx + 2, y, 18, 1, C('wood', 0));
  // Rabbit ears.
  p.line(sx + sw / 2 - 4, y0, sx + sw / 2 - 50, y0 - 40, C('chrome', 5));
  p.line(sx + sw / 2 + 4, y0, sx + sw / 2 + 40, y0 - 44, C('chrome', 5));
  oval(p, sx + sw / 2, y0 - 2, 10, 4, C('grey', 1));
  p.disc(sx + sw / 2 - 50, y0 - 40, 2, C('chrome', 6));
  p.disc(sx + sw / 2 + 40, y0 - 44, 2, C('chrome', 6));
}

export interface Art {
  dex: Pixels;
  dexSide: Pixels;
  dexUp: Pixels;
  dexMoon: Pixels;
  sparky: Pixels;
  sparkyMad: Pixels;
  car: Pixels;
  carT: Pixels;
  truck: Pixels;
  alien: Pixels;
  alien2: Pixels;
  mower: Pixels;
  tele: Pixels;
  grandma: Pixels;
  page: Pixels;
  quarter: Pixels;
  pill: Pixels;
  zapper: Pixels;
  cover: Pixels;
  booth: Pixels;
  boothTop: Pixels;
  meteor: Pixels;
  dino: Pixels;
}

// ------------------------------------------------------------------ title
export function titleScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  sunsetSky(p, 140);
  stripedSun(p, 160, 140, 46);
  skyline(p, 140);
  grid(p, 140);
  // Flying cars streak across.
  scaleBlit(p, a.car, 18, 92, 2);
  speedLines(p, 18, 92, 30, C('pink', 5));
  scaleBlit(p, a.carT, 236, 100, 2, true);
  scaleBlit(p, a.truck, 196, 122, 1, true);
  chromeCentered(p, 8, 'IN THE YEAR', 3);
  chromeCentered(p, 40, '2000!', 7, true);
  // Dex and Sparky on the grid.
  scaleBlit(p, a.dex, 30, 138, 3);
  scaleBlit(p, a.sparky, 238, 152, 2, true);
  p.rect(0, 186, W, 14, C('night', 0));
  centeredText(p, 189, 'SANDBOX SOFTWARE  (C) 1992', C('teal', 5));
  return p;
}

// ------------------------------------------------------------------ menu
export function menuScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  sunsetSky(p, 120, 9);
  grid(p, 120);
  consoleTv(p, 66, 96, 190, 84, C('paper', 2));
  // A faint scanline texture on the screen, light enough for the menu text.
  for (let y = 96; y < 180; y += 2) for (let x = 66; x < 256; x++) if (dither(x, y, 0.15)) p.set(x, y, C('paper', 1));
  chromeCentered(p, 6, 'IN THE YEAR 2000!', 2);
  micro(p, 70, 172, 'CHANNEL 2000', C('grey', 4));
  scaleBlit(p, a.dex, 6, 132, 3);
  scaleBlit(p, a.alien, 268, 140, 2, true);
  return p;
}

// ------------------------------------------------------------------ text pages
/** A sheet of Dex's notebook paper under a chrome heading: Display_File writes on the lines. */
export function paperScreen(heading: string, a: Art, deco: 'pages' | 'stars' | 'credits'): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('purple'), 0, 2);
  const r = rng(heading.length);
  for (let i = 0; i < 60; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('purple', 3));
  // The paper.
  p.rect(30, 32, 266, 156, C('grey', 1));
  p.rect(28, 30, 266, 156, C('paper', 2));
  for (let y = 46; y < 184; y += 8) p.rect(28, y, 266, 1, C('sky', 6));
  p.rect(36, 30, 1, 156, C('red', 4));
  for (const y of [52, 108, 164]) oval(p, 32, y, 2.5, 2.5, C('purple', 1));
  chromeCentered(p, 6, heading, 2);
  if (deco === 'pages') {
    scaleBlit(p, a.page, 290, 150, 1);
    scaleBlit(p, a.sparky, 288, 168, 1, true);
  } else if (deco === 'credits') {
    scaleBlit(p, a.alien, 296, 160, 1, true);
  } else scaleBlit(p, a.zapper, 294, 162, 1);
  return p;
}

// ------------------------------------------------------------------ the story
function caption(p: Pixels, lines: string[], ink = C('grey', 7), bg = C('night', 0)): void {
  const h = lines.length * 10 + 8;
  p.rect(0, H - h, W, h, bg);
  p.rect(0, H - h, W, 1, C('pink', 4));
  lines.forEach((s, i) => centeredText(p, H - h + 5 + i * 10, s, ink));
}

export function storyScreens(a: Art): Pixels[] {
  const out: Pixels[] = [];
  // 1. The neighborhood.
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, 100, R('sky'), 2, 6);
    for (let y = 100; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, Math.floor(x / 20) % 2 ? C('green', 2) : C('green', 3));
    skyline(p, 100, 5, 'sky');
    oval(p, 90, 120, 60, 40, C('chrome', 6));
    for (let y = 80; y < 121; y++)
      for (let x = 30; x < 151; x++) if ((x - 90) ** 2 / 3600 + (y - 120) ** 2 / 1600 <= 1) p.set(x, y, shadeAt(R('chrome'), 3, 7, 1 - (x - 30) / 140, x, y));
    p.rect(30, 121, 121, 30, C('green', 2));
    for (let x = 36; x < 146; x += 12) p.rect(x, 96, 8, 8, C('glass', 2));
    scaleBlit(p, a.mower, 180, 112, 2);
    scaleBlit(p, a.car, 210, 30, 2);
    speedLines(p, 210, 30, 24, C('grey', 7));
    scaleBlit(p, a.boothTop, 280, 96, 2);
    scaleBlit(p, a.booth, 280, 136, 2);
    scaleBlit(p, a.alien, 150, 120, 2);
    chromeCentered(p, 4, 'HOVER HEIGHTS', 2);
    caption(p, ['THE YEAR 2000. CARS FLY. ROBOTS MOW.', 'ALIENS LIVE NEXT DOOR. AND THERE IS A', 'PHONE BOOTH ON EVERY SINGLE CORNER.']);
    out.push(p);
  }
  // 2. Dex and his report.
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, R('teal'), 1, 3);
    p.rect(40, 20, 120, 130, C('paper', 2));
    for (let y = 34; y < 150; y += 7) p.rect(40, y, 120, 1, C('sky', 5));
    p.rect(52, 20, 1, 130, C('red', 4));
    text(p, 58, 26, 'THE POCKET', C('denim', 1));
    text(p, 58, 36, 'TELEPHONE', C('denim', 1));
    text(p, 58, 50, 'BY DEX', C('denim', 2));
    micro(p, 58, 70, 'A PHONE YOU CARRY', C('denim', 2));
    micro(p, 58, 78, 'IN YOUR POCKET!!', C('denim', 2));
    micro(p, 58, 90, '20 PAGES. NO', C('denim', 2));
    micro(p, 58, 98, 'WIRES. NO BOOTH.', C('denim', 2));
    p.rect(126, 116, 14, 26, C('grey', 1)).rect(128, 118, 10, 8, C('neon', 2)).line(138, 116, 142, 104, C('grey', 2));
    scaleBlit(p, a.dex, 190, 40, 5);
    chromeCentered(p, 160 - 10, '', 2);
    caption(p, ['DEX DYNAMO, AGE 11, WROTE THE BEST', 'SCIENCE FAIR REPORT IN THE SOLAR SYSTEM:', '"THE POCKET TELEPHONE." 20 WHOLE PAGES.']);
    out.push(p);
  }
  // 3. Sparky ate it.
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, R('red'), 0, 2);
    for (let k = 0; k < 24; k++) {
      const ang = (k / 24) * Math.PI * 2;
      p.line(160, 80, 160 + Math.cos(ang) * 260, 80 + Math.sin(ang) * 260, k % 2 ? C('red', 3) : C('orange', 3));
    }
    scaleBlit(p, a.sparkyMad, 90, 20, 7);
    const r = rng(4);
    for (let i = 0; i < 9; i++) {
      const x = 20 + r() * 270;
      const y = 10 + r() * 120;
      scaleBlit(p, a.page, x, y, 2);
    }
    chrome(p, 10, 6, 'CHOMP!', 3, true);
    caption(p, ['THEN SPARKY 3000, THE ROBOT DOG,', 'ATE IT. EVERY PAGE. AND RAN OFF WITH', 'THE COVER IN HIS MOUTH. BAD DOG!']);
    out.push(p);
  }
  // 4. The Moon at 3:00.
  {
    const p = new Pixels(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, C('night', y < 100 ? 0 : 1));
    const r = rng(8);
    for (let i = 0; i < 120; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('grey', 4 + Math.floor(r() * 4)));
    blob(p, 230, 80, 60, 60, R('moon'), 1, 5);
    for (const [x, y, s] of [
      [210, 60, 9],
      [250, 100, 12],
      [235, 40, 6],
    ])
      oval(p, x, y, s, s * 0.8, C('moon', 1));
    blob(p, 50, 150, 30, 30, R('sky'), 1, 5);
    blob(p, 44, 142, 10, 8, R('green'), 2, 4);
    // The school's clock: 3:00.
    oval(p, 110, 60, 34, 34, C('paper', 2));
    p.ring(110, 60, 34, C('chrome', 3));
    p.line(110, 60, 110, 34, C('grey', 0)).line(110, 60, 130, 60, C('grey', 0));
    for (let k = 0; k < 12; k++) p.set(110 + Math.cos((k * Math.PI) / 6) * 29, 60 + Math.sin((k * Math.PI) / 6) * 29, C('grey', 0));
    caption(p, ['AND THE SCIENCE FAIR IS TODAY... ON', 'THE MOON. AT 3:00. FIND EVERY PAGE,', 'CATCH SPARKY, AND GET THERE ON TIME!']);
    out.push(p);
  }
  return out;
}

// ------------------------------------------------------------------ level cards
export function levelCard(n: number, title: string, lines: string[], view: Pixels): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('night'), 0, 3);
  p.blit(view, 0, 46);
  p.rect(0, 45, W, 1, C('pink', 4)).rect(0, 46 + view.h, W, 1, C('pink', 4));
  chrome(p, 8, 6, `LEVEL ${n}`, 2, true);
  const tx = 8 + textWidth(`LEVEL ${n}`, 2) + 14;
  text(p, tx + 1, 13, title, C('grey', 0));
  text(p, tx, 12, title, C('teal', 5));
  p.rect(tx, 23, textWidth(title), 1, C('teal', 3));
  lines.forEach((s, i) => text(p, 10, 152 + i * 11, s, i === lines.length - 1 ? C('gold', 5) : C('grey', 7)));
  return p;
}

// ------------------------------------------------------------------ endings
export function wonScreen1(a: Art): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 90, R('gold'), 1, 2);
  for (let y = 90; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, y % 10 === 0 ? C('wood', 2) : C('wood', 3));
  // Banner.
  p.rect(40, 6, 240, 18, C('denim', 2)).frame(40, 6, 240, 18, C('chrome', 6));
  centeredText(p, 11, 'MOON SCHOOL SCIENCE FAIR 2000', C('gold', 5), C('grey', 0));
  // The podium: Dex on the second step, first place goes to a robot that folds laundry.
  const step = (x: number, y: number, n: string) => {
    p.rect(x, y, 56, 170 - y, C('gold', 3))
      .rect(x, y, 56, 4, C('gold', 5))
      .frame(x, y, 56, 170 - y, C('gold', 1));
    micro(p, x + 24, y + 12, n, C('gold', 1), 2);
  };
  step(84, 124, '2');
  step(140, 104, '1');
  step(196, 134, '3');
  scaleBlit(p, a.dex, 82, 64, 3);
  // The robot: chrome box, red eyes, a folded shirt in each hand.
  p.rect(156, 54, 24, 50, C('chrome', 4)).rect(156, 54, 24, 3, C('chrome', 6)).frame(156, 54, 24, 50, C('chrome', 1));
  p.rect(158, 36, 20, 16, C('chrome', 5)).frame(158, 36, 20, 16, C('chrome', 1));
  p.rect(162, 42, 3, 3, C('red', 4)).rect(171, 42, 3, 3, C('red', 4));
  p.line(168, 36, 168, 28, C('chrome', 3)).set(168, 27, C('red', 4));
  p.rect(140, 70, 16, 4, C('chrome', 3)).rect(132, 66, 12, 8, C('pink', 3));
  p.rect(180, 70, 16, 4, C('chrome', 3)).rect(192, 66, 12, 8, C('teal', 4));
  // Dex's ribbon.
  oval(p, 104, 100, 6, 6, C('red', 3));
  p.rect(101, 105, 3, 8, C('red', 2)).rect(105, 105, 3, 8, C('red', 2));
  micro(p, 103, 98, '2', C('grey', 7));
  scaleBlit(p, a.sparky, 244, 124, 2, true);
  scaleBlit(p, a.cover, 276, 140, 1);
  // The judges' verdict.
  p.rect(4, 26, 84, 38, C('paper', 2)).frame(4, 26, 84, 38, C('grey', 0));
  p.line(70, 64, 86, 74, C('grey', 0));
  micro(p, 8, 30, 'A PHONE IN YOUR', C('denim', 1));
  micro(p, 8, 38, 'POCKET? WHO', C('denim', 1));
  micro(p, 8, 46, 'WOULD WANT THAT?', C('denim', 1));
  micro(p, 8, 55, 'SECOND PLACE!', C('red', 2));
  caption(
    p,
    ['YOU MADE IT! SECOND PLACE IN THE WHOLE', 'SOLAR SYSTEM. FIRST PLACE: A ROBOT THAT', 'FOLDS LAUNDRY. THE FUTURE IS AMAZING!'],
    C('grey', 7),
    C('night', 0),
  );
  return p;
}

export function wonScreen2(a: Art): Pixels {
  const p = new Pixels(W, H);
  sunsetSky(p, 150, 21);
  skyline(p, 150, 8);
  grid(p, 150);
  chromeCentered(p, 10, 'THE END', 4, true);
  const lines = [
    'NOBODY EVER BUILT A POCKET PHONE.',
    "WHY WOULD THEY? THERE'S A BOOTH",
    'ON EVERY CORNER, AND IT ONLY',
    'COSTS A QUARTER TO TELEPORT.',
    '',
    'SPARKY ATE THE TROPHY.',
  ];
  p.rect(30, 52, 260, lines.length * 11 + 10, C('night', 0));
  lines.forEach((s, i) => centeredText(p, 58 + i * 11, s, i === lines.length - 1 ? C('gold', 5) : C('grey', 7)));
  scaleBlit(p, a.dex, 34, 140, 2);
  scaleBlit(p, a.sparky, 262, 158, 2, true);
  centeredText(p, 188, 'THANKS FOR PLAYING!', C('teal', 5), C('grey', 0));
  return p;
}

export function lostScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('night'), 0, 3);
  // Living-room carpet and a TV showing the bad news.
  for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, dither(x, y, 0.4) ? C('orange', 1) : C('orange', 0));
  consoleTv(p, 120, 70, 120, 72, C('sky', 4));
  gradient(p, 120, 70, 120, 72, R('sky'), 2, 4);
  micro(p, 126, 76, 'NEWS 2000', C('gold', 5));
  micro(p, 126, 90, 'SCIENCE FAIR', C('grey', 7));
  micro(p, 126, 98, 'WINNER: A ROBOT', C('grey', 7));
  micro(p, 126, 106, 'THAT FOLDS', C('grey', 7));
  micro(p, 126, 114, 'LAUNDRY', C('grey', 7));
  scaleBlit(p, a.dexUp, 40, 100, 3);
  scaleBlit(p, a.sparky, 10, 160, 1);
  chromeCentered(p, 8, 'GAME OVER', 4, true);
  caption(p, ['YOU MISSED THE SCIENCE FAIR. SPARKY', 'IS VERY SORRY. HE ATE THE TV GUIDE', 'TOO. TRY AGAIN - THE FUTURE CAN WAIT!']);
  return p;
}

export function hiscoreScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  // PLAYGAME writes 'Top Ten Scores' on rows 0-7 and 'Hit any key' on rows 192-199 in the
  // palette's nearest red, so both sit on plain dark bands with the frame kept between them.
  gradient(p, 0, 0, W, H, R('chrome'), 7, 5);
  p.rect(0, 0, W, 11, C('night', 0)).rect(0, 189, W, 11, C('night', 0));
  p.rect(0, 11, W, 1, C('pink', 3)).rect(0, 188, W, 1, C('pink', 3));
  p.frame(4, 14, W - 8, 172, C('pink', 3)).frame(6, 16, W - 12, 168, C('teal', 4));
  scaleBlit(p, a.quarter, 8, 18, 1);
  scaleBlit(p, a.quarter, 292, 18, 1);
  scaleBlit(p, a.page, 8, 163, 1);
  scaleBlit(p, a.pill, 292, 163, 1);
  return p;
}

export function filesScreen(heading: string, a: Art): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('purple'), 0, 2);
  p.rect(62, 34, 230, 148, C('paper', 2)).frame(62, 34, 230, 148, C('chrome', 6));
  for (let i = 0; i < 10; i++) p.rect(80, 47 + i * 14, 200, 1, C('sky', 6));
  chromeCentered(p, 6, heading, 2);
  scaleBlit(p, a.boothTop, 16, 120, 2);
  scaleBlit(p, a.booth, 16, 160, 2);
  return p;
}

// ------------------------------------------------------------------ FLI animations
/** The intro: a flip calendar counts 1992 up to 2000, a flash, and the future arrives. */
export function introFli(a: Art): Uint8Array {
  const frames: Pixels[] = [];
  const title = titleScreen(a);
  const cal = (year: string, flip: number) => {
    const p = new Pixels(W, H, C('night', 0));
    const r = rng(3);
    for (let i = 0; i < 80; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('grey', 3 + Math.floor(r() * 4)));
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
  // Flash to white, then the title fades up out of it.
  const flash = new Pixels(W, H, C('grey', 7));
  frames.push(flash, flash);
  for (let k = 1; k <= 5; k++) frames.push(new Pixels(W, H).map((x, y) => (dither(x, y, k / 5) ? title.get(x, y) : C('grey', 7))));
  // A flying car swoops across the title.
  for (let k = 0; k < 14; k++) {
    const p = new Pixels(W, H);
    p.px.set(title.px);
    const x = -50 + k * 28;
    const y = 120 - Math.round(Math.sin((k / 13) * Math.PI) * 40);
    scaleBlit(p, a.carT, x, y, 2);
    speedLines(p, x, y, 36, C('grey', 7));
    frames.push(p);
  }
  frames.push(title, title, title);
  return fli(frames, 6);
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
    for (let i = 0; i < 40; i++) p.set(160 + (r() - 0.5) * 240, 100 + (r() - 0.5) * 160, C('grey', 7));
    if (k < 10) scaleBlit(p, a.dex, 130, 70, 3);
    else if (k < 13) {
      const d = new Pixels(20, 20, T).map((x, y) => (a.dex.get(x, y) !== T && (y + k) % (k - 8) === 0 ? C('teal', 5) : T));
      scaleBlit(p, d, 130, 70, 3);
    }
    if (k >= 4 && k % 2 === 0) centeredText(p, 20, 'BZZZZZZT!', C('gold', 5), C('grey', 0), 2);
    centeredText(p, 180, 'THANK YOU FOR USING TELEPORT-A-PHONE', C('grey', 6));
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
      for (let i = 0; i < 80 * sky; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('grey', 6));
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
    if (count) centeredText(p, 20, count, C('gold', 5), C('grey', 0), 3);
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

export { microWidth, outlined };
