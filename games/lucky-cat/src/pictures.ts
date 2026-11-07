// LUCKY CAT's own full-screen pictures: the title (a clothesline of the 13 charms in front of the town and its
// clock tower) and the story cards that open a level (a note on parchment over the street, Midnight below).
import { outlined, centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W, scene } from '../../kit/starter/screens';
import { skyOf } from '../../kit/starter/palette';

/** The town behind the title: a row of houses and the clock tower, standing on `ground`. */
export function town(p: Pixels, pal: Pal, ground: number, towerX: number): void {
  const { c } = pal;
  const houses: [number, number, number, string, number][] = [
    [6, 52, 44, 'brick', 5],
    [60, 40, 36, 'wood', 3],
    [104, 60, 50, 'purple', 4],
    [180, 46, 40, 'orange', 4],
    [232, 54, 46, 'teal', 5],
  ];
  for (const [x, w, h, ramp, shade] of houses) {
    p.rect(x, ground - h, w, h, c(ramp, 2)).frame(x, ground - h, w, h, c(ramp, 0));
    for (let i = 0; i < w; i += 14) p.rect(x + 5 + i, ground - h + 8, 7, 8, c('sky', 5)).frame(x + 5 + i, ground - h + 8, 7, 8, c(ramp, 0));
    p.rect(x - 2, ground - h - 4, w + 4, 5, c(ramp, shade)).frame(x - 2, ground - h - 4, w + 4, 5, c(ramp, 0));
    p.rect(x + Math.floor(w / 2) - 3, ground - 14, 7, 14, c('wood', 2));
  }
  // the clock tower: a tall brick tower, a big clock face and a pointed roof
  const tx = towerX;
  p.rect(tx, ground - 92, 36, 92, c('brick', 2)).frame(tx, ground - 92, 36, 92, c('brick', 0));
  for (let y = ground - 90; y < ground; y += 8) p.rect(tx + 1, y, 34, 1, c('brick', 1));
  p.disc(tx + 18, ground - 70, 13, c('stone', 4))
    .disc(tx + 18, ground - 70, 11.5, c('white', 3))
    .ring(tx + 18, ground - 70, 13, c('gold', 2));
  p.line(tx + 18, ground - 70, tx + 18, ground - 79, c('ink', 0)).line(tx + 18, ground - 70, tx + 24, ground - 73, c('red', 1));
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    p.set(Math.round(tx + 18 + Math.sin(a) * 9), Math.round(ground - 70 - Math.cos(a) * 9), c('ink', 0));
  }
  for (let k = 0; k < 18; k++) p.rect(tx + k, ground - 94 - Math.round(k * 1.1), 36 - k * 2, 1, c('red', k % 3 ? 2 : 3));
  p.rect(tx - 2, ground - 94, 40, 3, c('stone', 3));
  p.rect(tx + 17, ground - 130, 2, 18, c('ink', 1)).rect(tx + 19, ground - 130, 6, 4, c('gold', 3));
}

/** The title picture: the name, a ribbon, Midnight, the clothesline of charms and the town. */
export function titlePicture(pal: Pal, book: Book, cat: Pixels, charms: Pixels[], name: string, tagline: string): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 160, 14);
  town(p, pal, 152, 262);
  outlined(p, Math.round((W - textWidth(name, 4)) / 2), 10, name, c('gold', 4), c('ink', 0), 4, c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, c('ink', 0));
  // the clothesline: a string between two posts, a charm hanging at every 24 pixels
  p.line(56, 66, 184, 74, c('ink', 1)).line(184, 74, 316, 66, c('ink', 1));
  charms.forEach((ch, i) => {
    const x = 58 + i * 19;
    const y = 66 + Math.round(Math.sin(((x - 56) / 260) * Math.PI) * 8) + 1;
    p.blit(ch, x, y, 255);
  });
  p.rect(10, 150, 36, 3, c('grass', 1));
  scaleBlit(p, cat, 8, 160 - 80 - 4, 2);
  return p;
}

/** A story card: a note of up to four lines on parchment over the street, with Midnight under it. */
export function storyCard(pal: Pal, book: Book, cat: Pixels, lines: string[], seed: number): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 160, seed);
  const h = 16 + lines.length * 13;
  bevel(p, 14, 10, 292, h, pal.r('parch'), 3, 2);
  p.rect(18, 14, 284, h - 8, c('parch', 3));
  lines.forEach((l, i) => centered(p, 20 + i * 13, l, c('ink', 0)));
  // a little tail from the note to Midnight, who stands lower left
  scaleBlit(p, cat, 48, 160 - 80, 2);
  return p;
}

/** Rascal the raccoon as one 20x40 picture with his sky made clear, from level 6's block set. */
export function rascalPicture(pal: Pal, book: Book): Pixels {
  const out = new Pixels(20, 40, 255);
  const sky = skyOf(pal);
  for (const [name, dy] of [
    ['rascalTop', 0],
    ['rascalBottom', 20],
  ] as const) {
    const pic = book.pics.get(name)!;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (pic.get(x, y) !== sky) out.set(x, y + dy, pic.get(x, y));
  }
  return out;
}

/** The reveal: a note on parchment, Midnight on the left and Rascal on the right, over the street. */
export function revealCard(pal: Pal, book: Book, cat: Pixels, rascal: Pixels, lines: string[], seed: number): Pixels {
  const p = storyCard(pal, book, cat, lines, seed);
  scaleBlit(p, rascal, 228, 160 - 80, 2);
  return p;
}
