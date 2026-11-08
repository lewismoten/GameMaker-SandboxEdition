// WHO WINS?'s power charts: a sign board (the kit's, kit/starter/sign.ts) with POWER at the top
// and, under it, one row a monster: its picture and its power number, strongest first. The
// numbers are the real ones from the .MON (monsters.ts POWER), in the PC's 8x8 font like every
// sign. Ordinary blocks, like any sign, so a copy of the game can repaint them.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

const T = 255;

/** One row of a chart: a monster's picture (20 by 20, clear where 255) and its power. */
export interface ChartRow {
  pic: Pixels;
  power: number;
}

function letters(p: Pixels, ink: number, text: string, x0: number, y0: number): void {
  [...text].forEach((ch, k) => {
    const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.set(x0 + k * 8 + x, y0 + y, ink);
  });
}

/**
 * Adds a chart sign called `name` to `book`, 4 blocks wide and one block high for every row
 * (plus a little for the heading, so 2 rows take 3 blocks and 4 take 5). `book` must already
 * hold a sign, for its posts.
 */
export function addChart(book: Book, pal: Pal, name: string, rows: ChartRow[]): Sign {
  const w = 4;
  const h = rows.length + 1;
  // the kit's empty board, drawn in a scratch book and put back together
  const scratch = new Book('bbl');
  const blank = addSign(scratch, pal, 'blank', '', w, h);
  const p = new Pixels(20 * w, 20 * h, T);
  blank.board.forEach((line, row) => line.forEach((id, col) => p.blit(scratch.pics.get(id)!, col * 20, row * 20)));
  const ink = pal.c('ink', 0);
  const W = 20 * w;
  // POWER across the top, then a row every 20 pixels: the picture on the left, the number beside it
  letters(p, ink, 'POWER', Math.floor((W - 5 * 8) / 2), 5);
  const top = 14;
  rows.forEach((r, i) => {
    const y = top + i * 20;
    p.blit(r.pic, 14, y, T);
    letters(p, ink, String(r.power), 40, y + 7);
  });
  const board: string[][] = [];
  for (let row = 0; row < h; row++) {
    board.push([]);
    for (let col = 0; col < w; col++) {
      const id = `sign.${name}.${col}${row}`;
      board[row].push(id);
      book.add(id, p.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
    }
  }
  if (!book.has('signPostL')) throw new Error('addChart: add a sign first, for its posts');
  return { board, legs: ['signPostL', 'signPostR'] };
}
