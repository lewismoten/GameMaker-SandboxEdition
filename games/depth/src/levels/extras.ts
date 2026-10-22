// What a level adds to the stock blocks: kinds of its own and how they behave, block numbers it
// keeps (the felt egg's), and anything its scenes need besides.
import type { Behavior, TileBook } from '../tiles/book';
import type { Plane } from '../tiles/cells';
import type { Level } from './levels';

export interface LevelExtras {
  rules?: (kind: string, plane: Plane, part: number) => Behavior | undefined;
  prepare?: (book: TileBook) => void;
}

export function levelExtras(level: Level): LevelExtras {
  switch (level.n) {
    default:
      return {};
  }
}
