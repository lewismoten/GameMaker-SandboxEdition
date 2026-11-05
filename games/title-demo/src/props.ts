// MAKE A TITLE's wall pictures: a framed thumbnail of the menu picture (level 1) and a meter of the
// 1,000 key changes a demo can hold (level 2). Each is cut into 20x20 blocks, so a copy can repaint them.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { miniMenu } from './screens';

/** A wall picture of w by h blocks, as block names by row for StarterMap.set(). */
export interface Mural {
  names: string[][];
}

/** Cuts `pic` into blocks called `mural.<name>.<col><row>` and adds them to the book. */
function cut(book: Book, name: string, pic: Pixels): Mural {
  const names: string[][] = [];
  for (let row = 0; row < pic.h / 20; row++) {
    names.push([]);
    for (let col = 0; col < pic.w / 20; col++) {
      const id = `mural.${name}.${col}${row}`;
      names[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20));
    }
  }
  return { names };
}

/** The menu picture in a gold frame, 6 by 4 blocks, with MENU.GIF under it. */
export function menuThumb(book: Book, pal: Pal): Mural {
  const { c } = pal;
  const p = new Pixels(120, 80, skyOf(pal));
  p.rect(0, 0, 120, 62, c('gold', 1)).rect(1, 1, 118, 60, c('gold', 4)).rect(3, 3, 114, 56, c('gold', 2));
  miniMenu(p, pal, 5, 5, 110, 52);
  p.rect(24, 64, 72, 14, c('wood', 2)).frame(24, 64, 72, 14, c('wood', 0));
  text(p, 28, 68, 'MENU.GIF', c('parch', 4));
  return cut(book, 'menu', p);
}

/** Ten boxes, one lit more than the rest: 1,000 key changes at a hundred a box, 8 by 2 blocks. */
export function demoMeter(book: Book, pal: Pal): Mural {
  const { c } = pal;
  const p = new Pixels(160, 40, skyOf(pal));
  p.rect(0, 0, 160, 40, c('wood', 2)).frame(0, 0, 160, 40, c('wood', 0)).rect(2, 2, 156, 36, c('parch', 3));
  for (let i = 0; i < 10; i++) p.rect(7 + i * 15, 6, 13, 12, c('teal', 3)).frame(7 + i * 15, 6, 13, 12, c('teal', 0));
  text(p, 12, 25, '1,000 KEY CHANGES', c('ink', 0));
  return cut(book, 'meter', p);
}
