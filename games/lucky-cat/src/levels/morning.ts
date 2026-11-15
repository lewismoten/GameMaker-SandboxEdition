// Level 4, EARLIER THAT MORNING: the story turns over. The same town at dawn (the print in reverse: a pale plate),
// and the player is Rascal the raccoon, rigging the day's pranks after the Committee chained the trash cans shut.
//   - chores to do on the way: three rope cleats to tie off and three bare doorsteps to set a saucer of cream on
//     (the saucers that will keep bringing a certain black cat to every prank);
//   - crates to hop, a ladder to an awning with a cleat and the bins' key at its far end;
//   - two cracks (bad luck for raccoons too), a crow on its rounds (the crows report to the Committee: let it pass);
//   - the bins' padlock under a brick wall: the key opens it, and the bins and the way out are behind.
// No charms: Rascal isn't collecting luck, he's arranging it.
import { StarterMap } from '../../../kit/starter/map';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';
import type { Pal } from '../print';

/** Where things are, for the bot and the shots (columns; rows count down from the sky). */
export const MORNING = {
  cleat1: 11,
  step1: 19,
  crates: 22,
  ladder: 27,
  awning: [28, 36],
  cleat2: 31,
  key: 35,
  cracks: 40,
  step2: 45,
  crow: 53,
  crowRow: 5,
  cleat3: 58,
  wall: 62,
  step3: 67,
  exit: 70,
} as const;

const SIGNS = {
  todo: ['TO DO: TIE ROPES. SET OUT CREAM. GET KEY.', 4, 3],
} as const;

export function levelMorning(pal: Pal): Level {
  const book = startBook(pal, ['crate', 'crack', 'town', 'chores', 'salt'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(74, MORNING.exit);
  g.col(MORNING.ladder, 5, GROUND - 1, 'H');
  g.row(6, MORNING.awning[0], MORNING.awning[1], '=');
  scenery(
    g,
    [
      [9, 1],
      [26, 2],
      [44, 1],
      [64, 2],
    ],
    [18, 38, 51],
    [25, 56],
  );
  const m = new StarterMap(book, g.rows());
  for (let x = MORNING.awning[0]; x <= MORNING.awning[1]; x++) m.set(x, 6, x % 2 ? 'awning' : 'awning2');
  for (const x of [MORNING.cleat1, MORNING.cleat3]) m.set(x, GROUND - 1, 'cleat');
  m.set(MORNING.cleat2, 5, 'cleat').set(MORNING.key, 5, 'binKey');
  for (const x of [MORNING.step1, MORNING.step2, MORNING.step3]) m.set(x, GROUND - 1, 'step');
  for (const y of [8, 9]) m.set(MORNING.crates, y, 'crate').set(MORNING.crates + 1, y, 'crate');
  for (const x of [MORNING.cracks, MORNING.cracks + 1, MORNING.cracks + 2]) m.set(x, GROUND - 1, 'crack');
  m.mon(CROW.bobbing, MORNING.crow, MORNING.crowRow);
  // the bins' wall: brick to the top of the world, an arch, and the padlock
  for (let y = -10; y < GROUND - 2; y++) m.set(MORNING.wall, y, 'brick');
  m.set(MORNING.wall, GROUND - 2, 'saltArch').set(MORNING.wall, GROUND - 1, 'padlock');
  for (const x of [64, 65]) m.set(x, GROUND - 2, 'binTop').set(x, GROUND - 1, 'bin');
  for (const x of [9, 33]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(13, onGround(GROUND, s.todo), s.todo);
  return {
    file: 'rascal',
    title: 'Earlier That Morning',
    hint: 'Play Rascal. Rig the town.',
    look: 'morning',
    chr: 'rascal',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
