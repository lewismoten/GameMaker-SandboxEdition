// Pictures bigger than one block (dome homes, billboards, the rocket...), drawn whole
// and then cut into 20x20 blocks.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient, hgradient, oval, shadeAt } from './draw';
import { micro, microWidth, text } from './font';
import { C, PAL } from './pal';

const R = PAL.r;

/** Fills the picture with a floor painter's tiles. */
export function tiled(p: Pixels, floor: (seed?: number) => Pixels): Pixels {
  for (let by = 0; by < p.h; by += 20) for (let bx = 0; bx < p.w; bx += 20) p.blit(floor(1 + bx + by * 7), bx, by);
  return p;
}

/** A dome home, 4x3 blocks: white chrome hemisphere, glass band, a round door. */
export function domeHome(floor: (seed?: number) => Pixels, tint = 'pink'): Pixels {
  const p = tiled(new Pixels(80, 60), floor);
  // Shadow on the ground.
  oval(p, 42, 53, 38, 6, C('grey', 1));
  // The dome.
  for (let y = 4; y < 54; y++)
    for (let x = 2; x < 78; x++) {
      const nx = (x + 0.5 - 40) / 37;
      const ny = (y + 0.5 - 54) / 50;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const l = 0.7 * z - 0.45 * nx - 0.4 * ny;
      p.set(x, y, shadeAt(R('chrome'), 2, 7, (l + 0.3) / 1.25, x, y));
    }
  // A ring of tinted glass windows.
  for (let y = 22; y < 32; y++)
    for (let x = 4; x < 76; x++) {
      const nx = (x + 0.5 - 40) / 37;
      const ny = (y + 0.5 - 54) / 50;
      if (nx * nx + ny * ny > 0.96) continue;
      const pane = Math.floor((x - 4) / 9);
      const edge = (x - 4) % 9 === 0;
      p.set(x, y, edge ? C('chrome', 2) : shadeAt(R('glass'), 0, 3, (y - 22) / 10 + (pane % 2) * 0.2, x, y));
    }
  for (let x = 6; x < 74; x += 9) p.line(x + 2, 23, x + 4, 25, C('grey', 7));
  // A stripe in the family color.
  for (let x = 3; x < 77; x++) {
    const nx = (x + 0.5 - 40) / 37;
    if (Math.abs(nx) < 0.97) p.set(x, 36, C(tint, 3)).set(x, 37, C(tint, 2));
  }
  // Round door and porch light.
  oval(p, 40, 47, 7, 8, C('chrome', 1));
  oval(p, 40, 47, 6, 7, C(tint, 2));
  p.rect(34, 48, 13, 7, C(tint, 2));
  p.rect(39, 40, 2, 15, C(tint, 1));
  p.set(37, 49, C('gold', 5)).set(43, 49, C('gold', 5));
  p.rect(30, 42, 2, 2, C('gold', 5));
  // Antenna and satellite dish on top.
  p.line(40, 4, 40, 0, C('chrome', 6));
  p.disc(40, 0, 1, C('red', 4));
  oval(p, 58, 12, 5, 3, C('chrome', 6));
  p.line(58, 12, 61, 9, C('chrome', 2));
  return p;
}

/** A garage block row piece: wall, door, roofline. 3x2 blocks. */
export function garage(): Pixels {
  const p = new Pixels(60, 40);
  // Roof (seen from above) and front wall.
  gradient(p, 0, 0, 60, 16, R('purple'), 2, 4);
  for (let x = 0; x < 60; x += 6) p.rect(x, 0, 1, 16, C('purple', 1));
  p.rect(0, 16, 60, 2, C('chrome', 6));
  gradient(p, 0, 18, 60, 22, R('concrete'), 4, 2);
  return p;
}

/** A billboard 3 blocks wide, 2 tall: two posts and a lit sign. */
export function billboard(lines: string[], bg: string, ink: string, floor: (seed?: number) => Pixels): Pixels {
  const p = tiled(new Pixels(60, 40), floor);
  p.rect(10, 26, 3, 13, C('chrome', 2)).rect(47, 26, 3, 13, C('chrome', 2));
  p.rect(1, 1, 58, 27, C('chrome', 6));
  gradient(p, 2, 2, 56, 25, R(bg), 1, 3);
  const lh = 7;
  const y0 = Math.round(14 - (lines.length * lh) / 2) + 1;
  lines.forEach((s, i) => {
    const w = microWidth(s);
    micro(p, Math.round(30 - w / 2) + 1, y0 + i * lh + 1, s, C('grey', 0));
    micro(p, Math.round(30 - w / 2), y0 + i * lh, s, C(ink, 5));
  });
  for (let x = 4; x < 58; x += 6) p.set(x, 1, C('gold', 5));
  return p;
}

/** A neon sign across `w` blocks on a wall color. */
export function neonSign(s: string, w: number, wall: (seed?: number) => Pixels, ink: string): Pixels {
  const p = tiled(new Pixels(w * 20, 20), wall);
  p.rect(1, 3, w * 20 - 2, 14, C('night', 0));
  const tw = microWidth(s, 2);
  const x = Math.round((w * 20 - tw) / 2);
  micro(p, x + 1, 5, s, C(ink, 2), 2);
  micro(p, x, 4, s, C(ink, 5), 2);
  return p;
}

/** The launch-pad rocket, 2x3 blocks: fins, portholes, flame-scorched pad. */
export function rocket(floor: (seed?: number) => Pixels): Pixels {
  const p = tiled(new Pixels(40, 60), floor);
  oval(p, 20, 56, 18, 4, C('grey', 1));
  for (let y = 2; y < 54; y++) {
    const half = y < 16 ? Math.round(Math.sqrt(y - 1) * 2.4) : 8;
    for (let x = 20 - half; x < 20 + half; x++) p.set(x, y, shadeAt(R('chrome'), 2, 7, 1 - Math.abs(x + 0.5 - 17) / 12, x, y));
  }
  p.rect(12, 16, 16, 2, C('red', 3)).rect(12, 40, 16, 2, C('red', 3));
  for (const y of [22, 31]) {
    oval(p, 20, y, 3.5, 3.5, C('chrome', 1));
    oval(p, 20, y, 2.5, 2.5, C('glass', 2));
    p.set(19, y - 1, C('grey', 7));
  }
  for (const s of [-1, 1]) {
    for (let k = 0; k < 10; k++) p.line(20 + s * 8, 42 + k, 20 + s * (8 + Math.min(9, k + 2)), 50 + Math.min(4, k / 2), C('red', 2 + (k % 2)));
  }
  micro(p, 15, 4, 'USA', C('denim', 2));
  return p;
}

/** Big text in the PC font, for signs and banners. */
export function banner(s: string, w: number, h: number, bg: string, ink: string): Pixels {
  const p = new Pixels(w * 20, h * 20);
  gradient(p, 0, 0, p.w, p.h, R(bg), 1, 3);
  p.frame(0, 0, p.w, p.h, C('chrome', 6));
  const x = Math.round((p.w - s.length * 8) / 2);
  const y = Math.round((p.h - 8) / 2);
  text(p, x + 1, y + 1, s, C('grey', 0));
  text(p, x, y, s, C(ink, 5));
  return p;
}

/** A crater, 2x2, rim lit from the upper left. */
export function crater(floor: (seed?: number) => Pixels, seed = 3): Pixels {
  const p = tiled(new Pixels(40, 40), floor);
  blob(p, 20, 20, 18, 16, R('moon'), 2, 5);
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 40; x++) {
      const nx = (x + 0.5 - 21) / 13;
      const ny = (y + 0.5 - 21) / 11;
      const d = nx * nx + ny * ny;
      if (d < 1) p.set(x, y, shadeAt(R('moon'), 0, 3, 0.5 + nx * 0.4 + ny * 0.3, x, y));
    }
  const r = rng(seed);
  for (let i = 0; i < 6; i++) p.set(12 + r() * 16, 14 + r() * 12, C('moon', 4));
  return p;
}

export { hgradient };
