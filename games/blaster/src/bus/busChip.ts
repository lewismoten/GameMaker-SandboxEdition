// The chip at the end of each data bus ride, standing on the horizon over the bus and
// growing as the ship nears it: a black package with its pins along the bottom and its
// name printed on it. Drawn 60 x 20 at full size: a flat chip, seen from the bus coming at it.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, micro, text } from '../art/draw';
import type { Pal } from '../art/pal';

export const CHIP_W = 60;
export const CHIP_H = 20;

/** What each destination's chip looks like: the name printed on it, a second line, and its accent ramp. */
const LOOKS: Record<number, { name: string; line: string; accent: string }> = {
  2: { name: 'DRAM', line: '4M X 9', accent: 'glow' },
  3: { name: 'FM', line: 'SOUND', accent: 'gold' },
  4: { name: 'IDE', line: 'DRIVE 0', accent: 'glow' },
  5: { name: '486', line: 'DX2-66', accent: 'gold' },
};

/** The chip at full size, on a clear ground. */
export function chipArt(p: Pal, n: number): Pixels {
  const look = LOOKS[n];
  const c = new Pixels(CHIP_W, CHIP_H, CLEAR);
  // pins along the bottom, standing on the board
  for (let x = 3; x < CHIP_W - 3; x += 4) c.rect(x, 16, 2, 4, p.c('steel', 5)).rect(x + 1, 16, 1, 4, p.c('steel', 3));
  // the package: black, a lighter top edge, the notch at its left
  c.rect(0, 0, CHIP_W, 17, p.c('deep', 1)).rect(0, 0, CHIP_W, 1, p.c('deep', 3)).rect(0, 16, CHIP_W, 1, p.c('ink', 0));
  c.rect(0, 5, 2, 6, p.c('ink', 0));
  // the name, then the line beside it, and the dot by pin 1
  text(c, 30 - look.name.length * 4, 2, look.name, p.c('gray', 7));
  micro(c, 30 - look.line.length * 2, 11, look.line, p.c(look.accent, 3));
  c.rect(4, 12, 2, 2, p.c(look.accent, 4));
  return c;
}

/** The chip shrunk to `scale` (nearest pixel), its bottom middle at (cx, bottom) on `onto`. */
export function chipAt(onto: Pixels, chip: Pixels, scale: number, cx: number, bottom: number): Pixels {
  const w = Math.max(2, Math.round(CHIP_W * scale));
  const h = Math.max(2, Math.round(CHIP_H * scale));
  const x0 = Math.round(cx - w / 2);
  const y0 = bottom - h;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = chip.get(Math.min(CHIP_W - 1, Math.floor((x + 0.5) / scale)), Math.min(CHIP_H - 1, Math.floor((y + 0.5) / scale)));
      if (v !== CLEAR) onto.set(x0 + x, y0 + y, v);
    }
  return onto;
}
