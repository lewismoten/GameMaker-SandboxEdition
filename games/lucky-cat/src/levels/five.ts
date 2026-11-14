// Level 5, KNOCK ON WOOD: up on the rooftops a crow keeps knocking on wood.
//   - three crows bob up and down across the lane: go as each lifts off and slip under (every tick it touches is bad luck); the middle watch is two crows wing to wing;
//   - a wall of wooden boxes closes the lane: knock on them (touch them) and the boxes you touch open, leaving a
//     doorway under the rest; a lucky feather lies under the two-crow watch beyond;
//   - a ladder up to a high roof with a rainbow.
// Two charms: the feather and the rainbow.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';

export const FIVE = {
  crowA: 20,
  crowRow: 5,
  wood: 28,
  /** Under the two-crow watch: take it in the gap. */
  feather: 41,
  crowD: 40,
  ladder: 48,
  crowC: 66,
  rainbow: 58,
  planksEnd: 60,
  exit: 76,
} as const;

const SIGNS = {
  roof: ["RAINBOW UP ON THE ROOF. DON'T ASK HOW.", 4, 3],
} as const;

export function levelFive(pal: Pal): Level {
  const charms = ['feather', 'rainbow'] as const;
  const book = startBook(pal, ['wood', 'town'], charms);
  const s = addSigns(book, pal, SIGNS);
  const g = room(80, FIVE.exit);
  g.col(FIVE.ladder, 4, GROUND - 1, 'H');
  g.row(5, FIVE.ladder + 1, FIVE.planksEnd, '=');
  scenery(
    g,
    [
      [9, 1],
      [33, 2],
      [44, 1],
      [66, 2],
    ],
    [24, 36, 63],
    [18, 38, 70],
  );
  const m = new StarterMap(book, g.rows());
  for (let y = 6; y < GROUND; y++) m.set(FIVE.wood, y, 'woodBox');
  m.set(FIVE.feather, GROUND - 1, 'charm.feather').set(FIVE.rainbow, 4, 'charm.rainbow');
  m.mon(CROW.bobbing, FIVE.crowA, FIVE.crowRow);
  m.mon(CROW.bobbing, FIVE.crowD, FIVE.crowRow).mon(CROW.bobbing, FIVE.crowD + 1, FIVE.crowRow);
  m.mon(CROW.bobbing, FIVE.crowC, FIVE.crowRow);
  for (const x of [70, 71, 72]) m.set(x, 9, 'fence');
  for (const x of [14, 34, 63]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(43, onGround(GROUND, s.roof), s.roof);
  return {
    file: 'five',
    title: 'Knock on Wood',
    hint: 'Let the crows pass. Knock.',
    look: 'roof',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [...charms],
  };
}
