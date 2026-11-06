// Each room's block set: the same blocks as every Starter (kit/starter/blocks.ts), copied for the room with the
// ground, hedges, scenery and doors turned to face the hero, and every block of air pulling toward the surface.
// Signs, coins and sky stay as drawn: a sign is read upright wherever it hangs.
import { Book, PULL, type Rules } from '../../kit/starter/book';
import { turn, turnedPair } from './turn';
import type { Room } from './frame';

/** Blocks drawn turned with the room (all but the doors, which are turned as pairs). */
const TURNED = new Set(['edge', 'grass', 'dirt', 'brick', 'bush', 'flower']);

/** The room's copy of `base` (made with addStarterBlocks and the signs, for the floor). */
export function roomBook(base: Book, k: Room, pull: number): Book {
  const book = new Book('bbl');
  const pairs = {
    door: turnedPair(base.pics.get('doorTop')!, base.pics.get('doorBottom')!, k),
    doorway: turnedPair(base.pics.get('doorwayTop')!, base.pics.get('doorwayBottom')!, k),
  };
  for (const [name] of [...base.index].sort((a, b) => a[1] - b[1])) {
    let pic = base.pics.get(name)!;
    if (TURNED.has(name)) pic = turn(pic, k);
    else if (name === 'doorTop') pic = pairs.door.top;
    else if (name === 'doorBottom') pic = pairs.door.bottom;
    else if (name === 'doorwayTop') pic = pairs.doorway.top;
    else if (name === 'doorwayBottom') pic = pairs.doorway.bottom;
    const rules: Rules = base.rulesOf(name);
    if (rules.grav === PULL.down) rules.grav = pull;
    book.add(name, pic, rules);
  }
  return book;
}
