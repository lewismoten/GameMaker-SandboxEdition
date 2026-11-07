// Level 5, KNOCK ON WOOD: up on the rooftops a crow keeps knocking on wood.
//   - three crows bob up and down across the lane: wait for each to fly up, then slip under (a bump is 5 hit points);
//   - a wall of wooden boxes closes the lane: knock on them (touch them) and the boxes you touch open, leaving a
//     doorway under the rest; a lucky feather waits behind;
//   - a ladder up to a high roof with a rainbow.
// Two charms: the feather and the rainbow.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';

export const FIVE = {
  crowA: 20,
  crowRow: 5,
  wood: 28,
  feather: 31,
  crowD: 40,
  ladder: 48,
  crowC: 66,
  rainbow: 58,
  planksEnd: 60,
  exit: 76,
} as const;

const SIGNS = {
  crow: ['A CROW! WAIT TILL IT FLIES UP, THEN GO.', 4, 3],
  knock: ['KNOCK ON WOOD: TOUCH THE BOXES.', 4, 3],
  roof: ['CLIMB TO THE HIGH ROOF FOR A RAINBOW.', 4, 3],
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
  m.mon(CROW.bobbing, FIVE.crowD, FIVE.crowRow);
  m.mon(CROW.bobbing, FIVE.crowC, FIVE.crowRow);
  for (const x of [70, 71, 72]) m.set(x, 9, 'fence');
  for (const x of [14, 34, 63]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(5, onGround(GROUND, s.crow), s.crow);
  m.sign(22, onGround(GROUND, s.knock), s.knock);
  m.sign(43, onGround(GROUND, s.roof), s.roof);
  return {
    file: 'five',
    title: 'Knock on Wood',
    hint: 'Wait for the crows. Knock on wood.',
    look: 'roof',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    story: [],
    crows: { run: 5, bob: 3 },
    charms: [...charms],
  };
}
