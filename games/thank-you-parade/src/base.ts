// A level's block set: the Starter blocks and locks, then the parade's own, with timed blocks (a block that turns
// into another after some ticks: the gust meter, a squirting puddle, a waved-off card). 18.2 ticks are one second.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { addLockBlocks } from '../../kit/starter/locks';
import type { Pal } from '../../kit/starter/palette';

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

/** A fresh set holding the Starter blocks and the lock blocks, in the order every level shares. */
export function baseBook(pal: Pal): PBook {
  const book = new PBook('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  return book;
}
