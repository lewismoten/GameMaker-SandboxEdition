// Level 1, LADDER LANE: the town's first superstitions on the sidewalk.
//   - a painter's stepladder across the lane: walk under it and a drip of paint is bad luck (5 hit points);
//     go around by the scaffold over the top and a four-leaf clover waits on the awning;
//   - two cracks in the pavement (bad luck, once each): hop them;
//   - a ladder up to a high awning with a horseshoe, and a crate wall to hop.
// Two charms: the clover and the horseshoe.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';

/** Where things are, for the bot and the shots (columns; rows count down from the sky). */
export const ONE = {
  ladderUp: 12,
  ladder: 14,
  clover: 16,
  roadEnd: 21,
  cracks: 27,
  scaffoldLadder: 34,
  horseshoe: 38,
  crates: 46,
  cracks2: 62,
  exit: 70,
} as const;

const SIGNS = {
  start: ['NOTICE: BLACK CAT AT LARGE. AVOID EYE CONTACT.', 4, 3],
  ladder: ['LADDER: DO NOT WALK UNDER. USE THE SCAFFOLD.', 4, 3],
  crack: ["STEP ON A CRACK? DON'T. JUMP.", 4, 3],
  shoe: ['LOST: ONE LUCKY SHOE. LAST SEEN ON AN AWNING.', 4, 3],
  blame: ['CATS ARE BAD LUCK. THIS IS A FACT. SIGNED, THE COMMITTEE', 4, 4],
} as const;

export function levelOne(pal: Pal): Level {
  const charms = ['clover', 'horseshoe'] as const;
  const book = startBook(pal, ['stepladder', 'crack', 'crate', 'town'], charms);
  const s = addSigns(book, pal, SIGNS);
  const g = room(74, ONE.exit);
  // the scaffold over the first stepladder: a ladder up the left side, an awning to walk across
  g.col(ONE.ladderUp, 5, GROUND - 1, 'H');
  g.row(6, 13, 20, '=');
  // the second scaffold: a ladder and an awning
  g.col(ONE.scaffoldLadder, 5, GROUND - 1, 'H');
  g.row(6, 35, 40, '=');
  scenery(
    g,
    [
      [8, 2],
      [21, 1],
      [30, 3],
      [47, 2],
      [60, 1],
    ],
    [10, 19, 37, 54],
    [7, 24, 43, 64],
  );
  const m = new StarterMap(book, g.rows());
  // the stepladder: top beam on row 7, a leg either side, a paint drip hanging in the gap
  m.set(ONE.ladder, 7, 'stepTopL')
    .set(ONE.ladder + 1, 7, 'stepTop')
    .set(ONE.ladder + 2, 7, 'stepTop')
    .set(ONE.ladder + 3, 7, 'stepTopR');
  for (const y of [8, 9]) m.set(ONE.ladder, y, 'stepL').set(ONE.ladder + 3, y, 'stepR');
  m.set(ONE.ladder + 2, 8, 'drip');
  // the plank rows are awnings (stand on them, jump up through them)
  for (let x = 13; x <= 20; x++) m.set(x, 6, x % 2 ? 'awning' : 'awning2');
  for (let x = 35; x <= 40; x++) m.set(x, 6, x % 2 ? 'awning' : 'awning2');
  m.set(ONE.clover, 5, 'charm.clover').set(ONE.horseshoe, 5, 'charm.horseshoe');
  // cracks
  for (const x of [ONE.cracks, ONE.cracks + 1, ONE.cracks2]) m.set(x, GROUND - 1, 'crack');
  // crates to hop
  for (const y of [8, 9]) m.set(ONE.crates, y, 'crate').set(ONE.crates + 1, y, 'crate');
  // lamp posts and a fence for the street
  for (const x of [21, 44, 56, 68]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  for (const x of [58, 59, 60]) m.set(x, 9, 'fence');
  m.sign(4, onGround(GROUND, s.start), s.start);
  m.sign(8, onGround(GROUND, s.ladder), s.ladder);
  m.sign(22, onGround(GROUND, s.crack), s.crack);
  m.sign(30, onGround(GROUND, s.shoe), s.shoe);
  m.sign(49, onGround(GROUND, s.blame), s.blame);
  return {
    file: 'one',
    title: 'Ladder Lane',
    hint: 'Go over the ladder. Hop the cracks.',
    look: '',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [...charms],
  };
}
