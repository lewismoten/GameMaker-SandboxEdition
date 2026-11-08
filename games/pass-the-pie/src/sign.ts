// PASS THE PIE's signs, as printed bills pasted on a post: paper a shade lighter than the street, a thick ink
// border, a strip of accent ink across the top and the words in ink. Rory's streets use them for the storybook's
// narration; Mr. Plume's for notes, flyers and the family group chat. The word wrapping is the kit's (sign.ts).
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Book, PULL } from '../../kit/starter/book';
import { lettersAcross, linesDown, wrapWords, type Sign } from '../../kit/starter/sign';
import { paperBlock, press } from './print';

function bill(pal: Pal, lines: string[], w: number, h: number, pitch: number): Pixels {
  const { paper, ink, acc } = press(pal);
  const W = 20 * w;
  const H = 20 * h;
  const p = paperBlock(pal, W, H, 7);
  p.rect(1, 1, W - 2, H - 2, ink[0]);
  p.rect(3, 3, W - 6, H - 6, paper[3]);
  p.rect(3, 3, W - 6, 2, acc[2]);
  // a torn corner, folded back
  p.rect(W - 6, H - 6, 3, 3, paper[1]).set(W - 6, H - 4, ink[0]).set(W - 5, H - 5, ink[0]).set(W - 4, H - 6, ink[0]);
  const top = 5 + Math.floor((H - 8 - (lines.length * pitch - 1)) / 2);
  lines.forEach((line, i) => text(p, Math.floor((W - line.length * 8) / 2), top + i * pitch, line, ink[0]));
  return p;
}

function legs(book: Book, pal: Pal): [string, string] {
  if (!book.has('postL')) {
    const { ink, acc2 } = press(pal);
    const post = (x: number) => paperBlock(pal).rect(x, 0, 4, 20, ink[0]).rect(x + 1, 0, 2, 20, acc2[0]);
    book.add('postL', post(3), { grav: PULL.down });
    book.add('postR', post(13), { grav: PULL.down });
  }
  return ['postL', 'postR'];
}

/** Adds a sign `w` blocks wide (2 to 4) and `h` high, saying `words`; returns its blocks for StarterMap.sign(). */
export function addBill(book: Book, pal: Pal, name: string, words: string, w: number, h: number): Sign {
  const lines = wrapWords(words, lettersAcross(w), linesDown(h, true));
  const pitch = lines.length * 9 - 1 > 20 * h - 10 ? 8 : 9;
  const pic = bill(pal, lines, w, h, pitch);
  const board: string[][] = [];
  for (let row = 0; row < h; row++) {
    board.push([]);
    for (let col = 0; col < w; col++) {
      const id = `bill.${name}.${col}${row}`;
      board[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
    }
  }
  return { board, legs: legs(book, pal) };
}
