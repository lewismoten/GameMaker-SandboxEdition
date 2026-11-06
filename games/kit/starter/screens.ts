// The 320x200 pictures every Starter needs, drawn from the Starter blocks so they match the
// game: a sunny scene (sky, clouds, hills and the same grass and dirt blocks as the levels),
// the title, the menu, the paper behind text pages, level cards, the save and load lists and
// the ending cards. PLAYGAME writes its own words over the menu, the text pages and the lists,
// so those leave a plain place for them.
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel, gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from './book';
import type { Pal } from './palette';
import { backdrop, frameOf, lookOf, type GroupStyle } from './titleStyles';

export type { GroupStyle } from './titleStyles';

export const W = 320;
export const H = 200;

/** A picture as a GIF file in the given palette. */
export const gif = (p: Pixels, pal: Pal): Uint8Array => encodeGif({ width: p.w, height: p.h, pixels: p.px, palette: pal.pal });

/** A cloud from (x, y), `s` puffs wide. */
function cloud(p: Pixels, pal: Pal, x: number, y: number, s = 1): void {
  const puffs: [number, number, number][] = [
    [0, 5, 7],
    [9, 1, 9],
    [20, 3, 8],
    [28, 6, 6],
  ];
  for (const [dx, dy, r] of puffs) p.disc(x + dx * s, y + dy * s, r * s, pal.c('white', 2));
  for (const [dx, dy, r] of puffs) p.disc(x + dx * s - s, y + dy * s - s, r * s - 2, pal.c('white', 3));
  p.rect(x - 6 * s, y + 9 * s, 38 * s, 3 * s, pal.c('white', 2));
}

/** A sunny scene: sky, clouds, two rows of hills, then the grass and dirt blocks of the levels from `ground` down. */
export function scene(pal: Pal, book: Book, ground = 160, seed = 3): Pixels {
  const { c, r } = pal;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, ground, r('sky'), 1, 4);
  const rand = rng(seed);
  for (let i = 0; i < 5; i++) cloud(p, pal, Math.floor(rand() * 300), 8 + Math.floor(rand() * 60), 1 + (i % 2) * 0.5);
  for (let x = 0; x < W; x++) {
    const far = ground - 20 - Math.round(Math.sin(x / 40 + 1) * 12 + Math.sin(x / 13) * 3);
    const near = ground - 8 - Math.round(Math.sin(x / 27 + 4) * 7);
    p.rect(x, far, 1, ground - far, c('green', 1));
    p.set(x, far, c('green', 3));
    p.rect(x, near, 1, ground - near, c('grass', 2));
    p.set(x, near, c('grass', 4));
  }
  for (let y = ground; y < H; y += 20) for (let x = 0; x < W; x += 20) p.blit(book.pics.get(y === ground ? 'grass' : 'dirt')!, x, y, 255);
  return p;
}

/** The big lettering of a title: gold with a dark outline and a soft drop shadow. */
function lettering(p: Pixels, pal: Pal, y: number, s: string, scale: number): void {
  outlined(p, Math.round((W - textWidth(s, scale)) / 2), y, s, pal.c('gold', 4), pal.c('ink', 0), scale, pal.c('ink', 1));
}

/** A hero (20x40), scaled, standing with his feet on `ground`. */
function standing(p: Pixels, hero: Pixels, x: number, ground: number, scale: number): void {
  scaleBlit(p, hero, x, ground - 40 * scale, scale);
}

/** A gold coin of radius 5 at (x, y). */
function coin(p: Pixels, pal: Pal, x: number, y: number): void {
  p.disc(x, y, 5, pal.c('gold', 0)).disc(x, y, 4, pal.c('gold', 3)).disc(x, y, 2.4, pal.c('gold', 4));
}

/** A gold key, about 40x20, with its ring at (x, y): a floating prize at the hero's waist height. */
function bigKey(p: Pixels, pal: Pal, x: number, y: number): void {
  const g = pal.r('gold');
  p.disc(x + 9, y + 9, 9, g[1])
    .disc(x + 9, y + 9, 7.5, g[4])
    .disc(x + 9, y + 9, 3.6, pal.c('sky', 2));
  p.rect(x + 17, y + 7, 22, 5, g[1])
    .rect(x + 17, y + 8, 22, 3, g[3])
    .rect(x + 17, y + 8, 22, 1, g[5]);
  p.rect(x + 29, y + 12, 4, 7, g[1]).rect(x + 30, y + 12, 2, 6, g[3]);
  p.rect(x + 35, y + 12, 4, 9, g[1]).rect(x + 36, y + 12, 2, 8, g[3]);
}

/**
 * The title picture: the name over a sunny scene with the hero and a door. `prize` is what floats
 * between them: a straight row of coins at head height (the hero ready to hop) or a key at his waist (walking).
 * `groupStyle` is the look of the Starter's group (titleStyles.ts); meadow, The Basics', is the default.
 */
export function titlePicture(
  pal: Pal,
  book: Book,
  hero: Pixels,
  door: Pixels,
  name: string,
  tagline: string,
  prize: 'coins' | 'key' = 'coins',
  groupStyle: GroupStyle = 'meadow',
): Pixels {
  const look = groupStyle === 'meadow' ? undefined : lookOf(pal, groupStyle);
  const p = groupStyle === 'meadow' ? scene(pal, book, 160) : backdrop(pal, groupStyle);
  const size = name.length > 11 ? 2 : 3;
  if (look) outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, look.fill, look.outline, size, look.shadow);
  else lettering(p, pal, 14, name, size);
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look?.ribbon ?? 'parch'), 3, 2);
  text(p, rx + 10, 54, tagline, look?.ribbonText ?? pal.c('ink', 0));
  if (prize === 'coins') {
    // a shadow on the grass, and the hero a little off it
    p.rect(44, 158, 32, 3, look?.floorShadow ?? pal.c('grass', 1));
    scaleBlit(p, hero, 40, 160 - 80 - 4, 2);
    for (let i = 0; i < 4; i++) coin(p, pal, 124 + i * 26, 76);
  } else {
    standing(p, hero, 40, 160, 2);
    bigKey(p, pal, 130, 118);
  }
  standing(p, door, 236, 160, 2);
  if (groupStyle !== 'meadow') frameOf(p, pal, groupStyle);
  return p;
}

/** The menu picture: the title small over the scene, and a board for PLAYGAME's menu words. */
export function menuPicture(pal: Pal, book: Book, hero: Pixels, name: string): Pixels {
  const p = scene(pal, book, 170, 7);
  lettering(p, pal, 8, name, name.length > 11 ? 2 : 3);
  const c = pal.c;
  p.rect(56, 46, 208, 132, c('wood', 1)).rect(58, 48, 204, 128, c('wood', 3));
  p.rect(62, 52, 196, 120, c('parch', 4)).frame(62, 52, 196, 120, c('wood', 2));
  scaleBlit(p, hero, 272, 90, 2);
  return p;
}

/** Plain paper for a page of words: PLAYGAME writes in plum over it. */
export function paper(pal: Pal, book: Book, heading: string): Pixels {
  const c = pal.c;
  const p = scene(pal, book, 176, 11);
  bevel(p, 22, 0, 276, 200, pal.r('parch'), 3, 2);
  p.rect(26, 4, 268, 194, c('parch', 4));
  centered(p, 14, heading, c('wood', 1), 2);
  return p;
}

/** The load and save lists: PLAYGAME writes the names in yellow, so each slot is a dark strip. */
export function slotsPicture(pal: Pal, book: Book, heading: string): Pixels {
  const p = paper(pal, book, heading);
  for (let i = 0; i < 10; i++) p.rect(56, 37 + i * 14, 189, 13, pal.c('wood', 0)).rect(56, 49 + i * 14, 189, 1, pal.c('ink', 0));
  return p;
}

/** The high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192 over a plain panel. */
export function scoresPicture(pal: Pal, book: Book, heading: string): Pixels {
  const c = pal.c;
  const p = scene(pal, book, 176, 13);
  p.rect(4, 0, 312, H, c('parch', 4)).rect(4, 0, 1, H, c('wood', 2)).rect(315, 0, 1, H, c('wood', 2));
  centered(p, 11, heading, c('wood', 1));
  const rule = textWidth(heading) + 16;
  p.rect(160 - rule / 2, 21, rule, 1, c('wood', 3));
  return p;
}

/** A level card: "LEVEL 1 OF 2", the level's name and a line, with the hero on the grass. */
export function cardPicture(pal: Pal, book: Book, hero: Pixels, n: number, of: number, name: string, hint: string): Pixels {
  const p = scene(pal, book, 160, 20 + n);
  bevel(p, 16, 8, 288, 68, pal.r('parch'), 3, 2);
  p.rect(20, 12, 280, 60, pal.c('parch', 3));
  centered(p, 18, `LEVEL ${n} OF ${of}`, pal.c('wood', 1));
  const title = name.toUpperCase();
  centered(p, 34, title, pal.c('ink', 0), title.length * 16 <= 272 ? 2 : 1);
  centered(p, 56, hint, pal.c('wood', 1));
  standing(p, hero, 60, 160, 2);
  return p;
}

/** An ending card: a big line, a smaller one, and the hero cheering over the grass. */
export function endPicture(pal: Pal, book: Book, hero: Pixels, head: string, line: string, tone: 'won' | 'lost'): Pixels {
  const p = scene(pal, book, 160, tone === 'won' ? 31 : 37);
  lettering(p, pal, 14, head, 3);
  bevel(p, 20, 50, 280, 26, pal.r('parch'), 3, 2);
  centered(p, 59, line, pal.c('ink', 0));
  standing(p, hero, 140, 160, 2);
  if (tone === 'won') {
    const rand = rng(9);
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rand() * W);
      const y = 84 + Math.floor(rand() * 60);
      const col = [pal.c('red', 2), pal.c('gold', 4), pal.c('blue', 3), pal.c('pink', 2)][i % 4];
      p.rect(x, y, 3, 2, col);
    }
  }
  return p;
}
