// The town's signs are handbills: the Committee's notices, printed on cheap paper and tacked to a black post. Ink
// letters in the PC's 8x8 font, two gold tacks, a torn corner. Same sizes and word wrap as the kit's signs
// (kit/starter/sign.ts), so a level lays them out with StarterMap.sign() as before.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { lettersAcross, linesDown, wrapWords, type Sign } from '../../kit/starter/sign';
import { skyTile, type Pal } from './print';

const glyph = (ch: string): number[] => [...FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8)];

/** The handbill, w*20 by h*20, on the night plate. `seed` picks which corner is torn. */
function bill(pal: Pal, lines: string[], w: number, h: number, seed: number): Pixels {
  const { c } = pal;
  const W = 20 * w;
  const H = 20 * h;
  const p = new Pixels(W, H, c('sky', 1));
  for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) p.blit(skyTile(pal), x, y);
  // the sheet, its shadow edge, and a torn corner
  p.rect(1, 1, W - 2, H - 2, c('paper', 4));
  p.rect(1, H - 2, W - 2, 1, c('paper', 2)).rect(W - 2, 1, 1, H - 2, c('paper', 2));
  const torn = seed % 2 ? W - 2 : 1;
  for (let k = 0; k < 5; k++) for (let j = 0; j < 5 - k; j++) p.set(torn === 1 ? 1 + j : W - 2 - j, H - 2 - k, c('sky', 1));
  // two gold tacks
  for (const x of [4, W - 5])
    p.rect(x - 1, 3, 2, 2, c('gold', 3))
      .set(x - 1, 3, c('gold', 3))
      .set(x, 4, c('gold', 1));
  // the words, centered
  const pitch = lines.length * 9 - 1 > H - 6 ? 8 : 9;
  const top = 3 + Math.floor((H - 6 - (lines.length * pitch - 1)) / 2);
  lines.forEach((line, i) => {
    const x0 = Math.floor((W - line.length * 8) / 2);
    const y0 = top + i * pitch;
    [...line].forEach((ch, k) => {
      const g = glyph(ch);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.set(x0 + k * 8 + x, y0 + y, c('ink', 0));
    });
  });
  return p;
}

/** The black posts under a handbill (added once). */
function addPosts(book: Book, pal: Pal): [string, string] {
  if (!book.has('signPostL')) {
    const post = (x: number) => {
      const p = skyTile(pal);
      p.rect(x - 1, 0, 5, 20, pal.c('paper', 3))
        .rect(x, 0, 3, 20, pal.c('ink', 0))
        .rect(x + 1, 0, 1, 20, pal.c('ink', 2));
      return p;
    };
    book.add('signPostL', post(4), { grav: PULL.down });
    book.add('signPostR', post(13), { grav: PULL.down });
  }
  return ['signPostL', 'signPostR'];
}

/** Adds a handbill called `name`, `w` blocks wide (2 to 4) and `h` high, saying `text`. */
export function addBill(book: Book, pal: Pal, name: string, text: string, w: number, h = 1): Sign {
  if (w < 2 || w > 4) throw new Error(`Handbill ${name} should be 2 to 4 blocks wide`);
  const lines = wrapWords(text, lettersAcross(w), linesDown(h));
  const pic = bill(
    pal,
    lines,
    w,
    h,
    [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0),
  );
  const board: string[][] = [];
  for (let row = 0; row < h; row++) {
    board.push([]);
    for (let col = 0; col < w; col++) {
      const id = `sign.${name}.${col}${row}`;
      board[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
    }
  }
  return { board, legs: addPosts(book, pal) };
}
