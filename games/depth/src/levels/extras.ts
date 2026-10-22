// What a level adds to the stock blocks: kinds of its own and how they behave, block numbers it
// keeps (the felt egg's), and anything its scenes need besides.
import type { Behavior, TileBook } from '../tiles/book';
import type { Plane } from '../tiles/cells';
import type { Level } from './levels';

/** The felt egg's block number in the Hall of Mirrors' block sets (about.json "egg"). */
export const EGG_BLOCK = 149;

export interface LevelExtras {
  rules?: (kind: string, plane: Plane, part: number) => Behavior | undefined;
  prepare?: (book: TileBook) => void;
}

export function levelExtras(level: Level): LevelExtras {
  switch (level.n) {
    case 3:
      // the felt egg keeps one block number, the same in both planes (see web/src/eggs/eggs.ts)
      return { prepare: (book) => book.pin('egg', EGG_BLOCK) };
    default:
      return {};
  }
}
