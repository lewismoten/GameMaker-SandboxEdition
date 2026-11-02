// Dressing a garage level's wall: the GARAGE set's passable shop lights, shadow boards and THE
// CHEZ's charger (blocks/sets.ts), each put only where the map still shows plain wall, so the
// dressing never covers anything a level placed.
import { MapBuilder, ORIGIN } from './maps';

/** What goes up: a light (one block), a board (two blocks: board.l, board.r) or the charger. */
export type Decor = ['light' | 'board' | 'charger', number, number];

export function decorate(m: MapBuilder, spots: Decor[]): void {
  const wall = m.book.n('wall');
  const free = (x: number, y: number) => m.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] === wall;
  for (const [what, x, y] of spots)
    if (what === 'board') {
      if (free(x, y) && free(x + 1, y)) m.set(x, y, 'board.l').set(x + 1, y, 'board.r');
    } else if (free(x, y)) m.set(x, y, what);
}
