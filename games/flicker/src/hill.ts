// The hill the fire sits on (level 3): a dome ten blocks wide and two high (low, so the fire on it shows on screen), drawn once as one picture in the dark of
// the night, then cut into blocks. Blocks of it that came out the same (the plain middle) are one block used again.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

export const HILL_W = 10;
export const HILL_H = 2;

/** Adds the hill's blocks to `book` (names `hill.<col><row>`, sharing equal pictures) and returns the name for each cell, row by row. */
export function addHill(book: Book, pal: Pal, bg: number): string[][] {
  const { c } = pal;
  const W = HILL_W * 20;
  const H = HILL_H * 20;
  const p = new Pixels(W, H, bg);
  const rand = rng(77);
  for (let x = 0; x < W; x++) {
    const t = (x - (W - 1) / 2) / (W / 2);
    const top = Math.round(0 + 38 * (1 - Math.sqrt(Math.max(0, 1 - t * t))) * 0.9);
    p.rect(x, top, 1, H - top, c('grass', 0));
    p.set(x, top, c('grass', 1));
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand() * W);
    const y = 14 + Math.floor(rand() * (H - 16));
    if (p.get(x, y) === c('grass', 0)) p.set(x, y, c('grass', 1));
  }
  const seen = new Map<string, string>();
  const names: string[][] = [];
  for (let row = 0; row < HILL_H; row++) {
    names.push([]);
    for (let col = 0; col < HILL_W; col++) {
      const pic = p.crop(col * 20, row * 20, 20, 20);
      const key = Buffer.from(pic.px).toString('base64');
      let name = seen.get(key);
      if (!name) {
        name = `hill.${col}${row}`;
        book.add(name, pic, { grav: PULL.down });
        seen.set(key, name);
      }
      names[row].push(name);
    }
  }
  return names;
}
