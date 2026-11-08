// Loops of blocks. A block can turn into another block after some ticks (its "Next block" and "Time" in the Blocks tab);
// a ring of them is an animation. The engine keeps one clock for each block number, so every cell of one block changes
// in the same tick. Everything that moves in this game is such a ring.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';

/** A block that turns into another after some ticks (the engine's only clock). */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** Adds the frames `${base}.0`, `${base}.1` ... as a ring: each shows for `ticks[k]` ticks, then turns into the next. Frames are in the air. */
export function addRing(book: Book, timed: Timed[], base: string, frames: Pixels[], ticks: readonly number[]): void {
  if (frames.length !== ticks.length) throw new Error(`${base}: ${frames.length} frames, ${ticks.length} times`);
  frames.forEach((pic, k) => {
    book.add(`${base}.${k}`, pic, { grav: PULL.down });
    timed.push({ name: `${base}.${k}`, next: `${base}.${(k + 1) % frames.length}`, ticks: ticks[k] });
  });
}

/** A level's finished blocks: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: { book: Book; timed: Timed[] }) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
