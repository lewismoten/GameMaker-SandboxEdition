// A level's block set: the parade's printed ground, door and lock blocks (blocks.ts), then each level's own, with timed blocks (a block that turns
// into another after some ticks: the gust meter, a squirting puddle, a waved-off card). 18.2 ticks are one second.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book } from '../../kit/starter/book';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL } from '../../kit/starter/book';
import { addPrintBlocks, onPaper } from './blocks';
import { halftone, type Pal } from './print';

/** Ticks in a second (18.2, rounded: Game-Maker counts block timers in ticks). */
export const SEC = 18;

export class PBook extends Book {
  private readonly timed: { name: string; next: string; ticks: number }[] = [];

  /** Block `name` turns into `next` after `ticks` (every block of one name changes together, from the scene's start). */
  time(name: string, next: string, ticks: number): this {
    this.timed.push({ name, next, ticks });
    return this;
  }

  override finish(): Block[] {
    const blocks = super.finish();
    for (const t of this.timed) {
      const b = blocks[this.n(t.name)];
      b.nextBl = this.n(t.next);
      b.ntime = t.ticks;
    }
    return blocks;
  }
}

/** A fresh set holding the shared printed blocks, in the order every level shares. */
export function baseBook(pal: Pal): PBook {
  const book = new PBook('bbl');
  addPrintBlocks(book, pal);
  return book;
}

/** Points for a page of Gigi's playbook, the secret in four of the levels. */
export const PAGE_POINTS = 250;

/** A torn page of Gigi's playbook: lilac paper, a purple diagram of X's and arrows, a corner torn off. */
export function addPage(book: PBook, pal: Pal): void {
  const { c } = pal;
  const p = new Pixels(20, 20, 255);
  p.rect(4, 2, 12, 16, c('purple', 4));
  halftone(p, 4, 2, 12, 16, c('purple', 3), 1, [c('purple', 4)]);
  for (const [x, y] of [
    [7, 6],
    [12, 9],
  ])
    p.set(x - 1, y - 1, c('purple', 1)).set(x + 1, y + 1, c('purple', 1)).set(x, y, c('purple', 1)).set(x + 1, y - 1, c('purple', 1)).set(x - 1, y + 1, c('purple', 1));
  p.line(7, 12, 12, 14, c('purple', 1)).set(12, 13, c('purple', 1)).set(11, 15, c('purple', 1));
  p.rect(13, 15, 3, 3, 255).set(13, 14, 255).set(15, 14, 255);
  book.add('page', onPaper(pal, p), { grav: PULL.down, score: PAGE_POINTS, touch: 'sky' });
}
