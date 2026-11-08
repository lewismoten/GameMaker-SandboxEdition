// A Starter rule: nothing solid is drawn like open sky. A player who is stopped by something
// they cannot see learns nothing, so a block that stops the hero (solid on any side) must show
// something: a wall, a hedge, a fence, ground. This lists every block of a Starter's maps whose
// picture is only sky colors (or fully transparent) and that is solid, when it sits next to a
// block the hero can move through. It is a suggestion for the author: it sees pictures, not
// whether a player would read them as a wall.
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Book } from './book';
import type { Pal } from './palette';

/** Descriptions of the invisible walls in `maps` (empty when there are none). `blocks` is `book.finish()`. */
export function invisibleWalls(book: Book, blocks: Block[], pal: Pal, maps: { name: string; map: GameMap }[]): string[] {
  const sky = new Set<number>([255, ...Array.from({ length: 6 }, (_, i) => pal.c('sky', i))]);
  const invisible = new Set<number>();
  for (let n = 0; n < book.index.size; n++) if (blocks[n].solid && [...blocks[n].pixels].every((v) => sky.has(v))) invisible.add(n);
  const out: string[] = [];
  for (const { name, map } of maps) {
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= 100 || y >= 100 ? -1 : map.blocks[y * 100 + x]);
    let first = '';
    let count = 0;
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++) {
        if (!invisible.has(at(x, y))) continue;
        const open = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((b) => b >= 0 && !blocks[b].solid);
        if (!open) continue;
        count++;
        first ||= `${x - 10},${y - 10}`;
      }
    if (count) out.push(`${name}: ${count} solid blocks drawn as sky next to open space (first at level block ${first})`);
  }
  return out;
}

/** For a Starter's check: throws if any of its levels (or rooms) has an invisible wall. `built` is what the game's buildLevels() returns. */
export function assertNoInvisibleWalls(built: {
  book: Book;
  pal: Pal;
  levels?: { file: string; map: { done(): GameMap } }[];
  rooms?: { file: string; map: { done(): GameMap } }[];
}): void {
  const maps = (built.levels ?? built.rooms ?? []).map((l) => ({ name: l.file, map: l.map.done() }));
  const found = invisibleWalls(built.book, built.book.finish(), built.pal, maps);
  if (found.length) throw new Error(`Invisible walls (a solid block drawn as sky). Draw a wall, hedge or fence instead:\n  ${found.join('\n  ')}`);
}
