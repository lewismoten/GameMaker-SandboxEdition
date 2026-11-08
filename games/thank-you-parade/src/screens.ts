// THE THANK-YOU PARADE's 320x200 pictures, as screen-printed parade posters: cream stock, sunburst rays, a halftone
// skyline of the town, the striped curb, a navy frame with a brass rule, and block lettering printed twice (vermilion
// under navy, a little off register). The title, the menu, the paper behind text pages, level cards, the save and load
// lists, the high scores and the ending cards. PLAYGAME writes its own words over the menu, the text pages and the lists,
// so those keep a plain panel where the Starters' did (the same places, so the words land on it).
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { halftone, rays, stripes, type Pal } from './print';

export const W = 320;
export const H = 200;

/** A picture as a GIF file in the given palette. */
export const gif = (p: Pixels, pal: Pal): Uint8Array => encodeGif({ width: p.w, height: p.h, pixels: p.px, palette: pal.pal });

/** Block lettering centered at `y`: the words in vermilion, then again in navy two pixels up and left (off register). */
export function lettering(p: Pixels, pal: Pal, y: number, s: string, scale: number, top = 'blue', under = 'red', x?: number): void {
  const w = textWidth(s, scale);
  const x0 = x ?? Math.round((W - w) / 2);
  text(p, x0 + scale, y + scale, s, pal.c(under, 2), scale, true);
  text(p, x0, y, s, pal.c(top, 1), scale, true);
}

/** Small words centered at `y` in one ink. */
export function line(p: Pixels, pal: Pal, y: number, s: string, ink = 'blue', shade = 0): void {
  text(p, Math.round((W - textWidth(s)) / 2), y, s, pal.c(ink, shade), 1, true);
}

/** The town's skyline from `top` to `ground`: rooftops, a water tower and the hall's bell tower, in halftone navy. */
function skyline(p: Pixels, pal: Pal, top: number, ground: number, seed: number): void {
  const navy = pal.c('blue', 3);
  let x = -seed * 7;
  let k = seed;
  while (x < W) {
    const w = 26 + ((k * 37) % 30);
    const h = 22 + ((k * 53) % 34);
    p.rect(x, ground - h, w - 2, h, navy);
    if (k % 3 === 0) p.rect(x + 4, ground - h - 8, w - 10, 8, navy); // a stepped roof
    if (k % 4 === 1) for (let i = 0; i < 6; i++) p.rect(x + 6 + i, ground - h - 6 + i, w - 14 - i * 2, 1, navy); // a gable
    x += w;
    k++;
  }
  // the water tower
  p.rect(250, ground - 74, 26, 16, navy)
    .rect(254, ground - 58, 2, 30, navy)
    .rect(270, ground - 58, 2, 30, navy);
  halftone(p, 0, top, W, ground - top, pal.c('paper', 2), 1, [navy]);
}

/** A poster backdrop: rays from a sun on the horizon, the skyline, then the street with the striped curb from `ground` down. */
export function backdrop(pal: Pal, ground = 160, seed = 3): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H, c('paper', 3));
  rays(p, 160, ground, 22, c('paper', 2), 0, 0, W, ground, seed * 0.013);
  halftone(p, 0, 0, W, ground, c('orange', 4), (_x, y) => (y > ground - 50 ? 1 : 0), [c('paper', 2)]);
  p.disc(160, ground, 34, c('orange', 4)).disc(160, ground, 28, c('gold', 4));
  skyline(p, pal, ground - 90, ground, seed);
  p.rect(0, ground, W, 6, c('paper', 3));
  stripes(p, 0, ground, W, 6, c('red', 2), 12, 6);
  p.rect(0, ground, W, 1, c('ink', 0)).rect(0, ground + 6, W, 1, c('ink', 0));
  p.rect(0, ground + 7, W, H - ground - 7, c('blue', 1));
  halftone(p, 0, ground + 7, W, H - ground - 7, c('blue', 0), 2);
  return p;
}

/** Pennant bunting along `y`. */
export function bunting(p: Pixels, pal: Pal, y: number): void {
  const inks = ['red', 'blue', 'gold', 'teal'];
  p.rect(0, y, W, 1, pal.c('ink', 0));
  for (let x = 2, k = 0; x < W; x += 12, k++) for (let i = 0; i < 9; i++) p.rect(x + Math.floor(i / 2), y + 1 + i, 9 - i, 1, pal.c(inks[k % 4], 3));
}

/** The navy frame with a brass rule inside it, round the whole poster. */
export function frame(p: Pixels, pal: Pal): void {
  const { c } = pal;
  p.frame(0, 0, W, H, c('blue', 0))
    .frame(1, 1, W - 2, H - 2, c('blue', 0))
    .frame(2, 2, W - 4, H - 4, c('blue', 1));
  p.frame(4, 4, W - 8, H - 8, c('gold', 4));
}

/** A figure 2x or 3x, feet at `ground`. */
export function standing(p: Pixels, fig: Pixels, x: number, ground: number, scale: number, flip = false): void {
  scaleBlit(p, fig, x, ground - fig.h * scale, scale, flip, 255);
}

/** The menu picture: the title small over the backdrop, and a paper panel for PLAYGAME's menu words. */
export function menuPicture(pal: Pal, penny: Pixels, name: string): Pixels {
  const { c } = pal;
  const p = backdrop(pal, 176, 7);
  bunting(p, pal, 6);
  lettering(p, pal, 20, name, 2);
  p.rect(56, 46, 208, 132, c('blue', 1)).rect(58, 48, 204, 128, c('gold', 4));
  p.rect(62, 52, 196, 120, c('paper', 3)).frame(62, 52, 196, 120, c('ink', 0));
  standing(p, penny, 270, 176, 2);
  frame(p, pal);
  return p;
}

/** Plain paper for a page of words: PLAYGAME writes in plum over it. */
export function paperPage(pal: Pal, heading: string): Pixels {
  const { c } = pal;
  const p = backdrop(pal, 176, 11);
  p.rect(22, 0, 276, 200, c('blue', 1)).rect(24, 0, 272, 200, c('gold', 4));
  p.rect(26, 4, 268, 194, c('paper', 3));
  halftone(p, 26, 4, 268, 26, c('paper', 2), 1);
  if (heading.length <= 17) lettering(p, pal, 12, heading, 2);
  else {
    const spaces = [...heading].flatMap((ch, i) => (ch === ' ' ? [i] : []));
    const at = spaces.reduce((a, b) => (Math.abs(b - heading.length / 2) < Math.abs(a - heading.length / 2) ? b : a));
    [heading.slice(0, at), heading.slice(at + 1)].forEach((l, i) => lettering(p, pal, 4 + i * 15, l, 2));
  }
  return p;
}

/** The load and save lists: PLAYGAME writes the names in yellow, so each slot is a dark strip. */
export function slotsPicture(pal: Pal, heading: string): Pixels {
  const p = paperPage(pal, heading);
  for (let i = 0; i < 10; i++) p.rect(56, 37 + i * 14, 189, 13, pal.c('blue', 0)).rect(56, 49 + i * 14, 189, 1, pal.c('ink', 0));
  return p;
}

/** The high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192 over a plain panel. */
export function scoresPicture(pal: Pal, heading: string): Pixels {
  const { c } = pal;
  const p = backdrop(pal, 176, 13);
  p.rect(4, 0, 312, H, c('paper', 3)).rect(4, 0, 1, H, c('blue', 1)).rect(315, 0, 1, H, c('blue', 1));
  line(p, pal, 11, heading);
  const rule = textWidth(heading) + 16;
  p.rect(160 - rule / 2, 21, rule, 1, c('red', 2));
  return p;
}

/** A level card: "LEVEL 1 OF 7", the level's name in block letters and a line, with the hero on the curb. */
export function cardPicture(pal: Pal, hero: Pixels, n: number, of: number, name: string, hint: string): Pixels {
  const { c } = pal;
  const p = backdrop(pal, 160, 20 + n);
  p.rect(16, 9, 288, 66, c('blue', 1)).rect(18, 11, 284, 62, c('gold', 4)).rect(21, 14, 278, 56, c('paper', 3));
  line(p, pal, 18, `LEVEL ${n} OF ${of}`, 'red', 1);
  const title = name.toUpperCase();
  lettering(p, pal, 29, title, title.length * 24 <= 272 ? 3 : 2);
  line(p, pal, 58, hint);
  standing(p, hero, 40, 160, 2);
  frame(p, pal);
  return p;
}

/** An ending card: a big line, a smaller one, and the hero over the curb (with confetti when it's a win). */
export function endPicture(pal: Pal, hero: Pixels, head: string, sub: string, tone: 'won' | 'lost'): Pixels {
  const { c } = pal;
  const p = backdrop(pal, 160, tone === 'won' ? 31 : 37);
  lettering(p, pal, 22, head, 4);
  p.rect(20, 62, 280, 22, c('blue', 1)).rect(22, 64, 276, 18, c('paper', 3));
  line(p, pal, 69, sub);
  standing(p, hero, 140, 160, 2);
  if (tone === 'won')
    for (let i = 0; i < 40; i++) {
      const x = (i * 83) % W;
      const y = 90 + ((i * 37) % 60);
      p.rect(x, y, i % 2 ? 4 : 2, i % 2 ? 2 : 4, c(['red', 'gold', 'teal', 'blue'][i % 4], 3));
    }
  frame(p, pal);
  return p;
}
