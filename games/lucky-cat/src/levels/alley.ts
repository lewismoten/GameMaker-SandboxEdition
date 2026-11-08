// Level 2, SAUCER ALLEY: a back lane behind the shops where somebody has left a saucer of cream every few steps.
// Midnight is suspicious. She drinks them anyway (a cat is a cat).
//   - five saucers of cream along the lane (7 points each);
//   - a tall pile of crates to hop, then cracks, then a fire escape (a ladder up to an awning) with the gate's key;
//   - a crow on the wire (let it pass) and a padlocked gate across the lane: the key opens it, once.
// No charms: the point is the trail.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';

export const ALLEY = {
  saucer1: 11,
  crates: 17,
  saucer2: 24,
  cracks: 28,
  ladder: 34,
  awning: [35, 43],
  key: 41,
  saucer3: 46,
  crow: 52,
  crowRow: 5,
  saucer4: 57,
  wall: 62,
  saucer5: 67,
  exit: 72,
} as const;

const SIGNS = {
  back: ['BACK LANE. NO CATS. NO CREAM. NO LOITER.', 4, 3],
  trail: ['SOMEONE LEFT A SAUCER OF CREAM. AGAIN.', 4, 3],
  escape: ['FIRE ESCAPE: THE GATE KEY IS HUNG UP TOP.', 4, 3],
  crow: ['A CROW ON THE WIRE. IT TELLS ALL.', 4, 3],
  gate: ['GATE LOCKED. KEY HOLDERS ONLY.', 4, 3],
} as const;

export function levelAlley(pal: Pal): Level {
  const book = startBook(pal, ['crate', 'crack', 'town', 'chores', 'salt'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(76, ALLEY.exit);
  g.col(ALLEY.ladder, 5, GROUND - 1, 'H');
  g.row(6, ALLEY.awning[0], ALLEY.awning[1], '=');
  scenery(
    g,
    [
      [8, 1],
      [30, 2],
      [52, 1],
      [68, 2],
    ],
    [14, 21, 49],
    [26, 39, 70],
  );
  const m = new StarterMap(book, g.rows());
  for (let x = ALLEY.awning[0]; x <= ALLEY.awning[1]; x++) m.set(x, 6, x % 2 ? 'awning' : 'awning2');
  for (const x of [ALLEY.saucer1, ALLEY.saucer2, ALLEY.saucer3, ALLEY.saucer4, ALLEY.saucer5]) m.set(x, GROUND - 1, 'step');
  for (const y of [8, 9]) for (const x of [ALLEY.crates, ALLEY.crates + 1]) m.set(x, y, 'crate');
  for (const x of [ALLEY.cracks, ALLEY.cracks + 1]) m.set(x, GROUND - 1, 'crack');
  m.set(ALLEY.key, 5, 'binKey');
  m.mon(CROW.bobbing, ALLEY.crow, ALLEY.crowRow);
  for (let y = -10; y < GROUND - 2; y++) m.set(ALLEY.wall, y, 'brick');
  m.set(ALLEY.wall, GROUND - 2, 'saltArch').set(ALLEY.wall, GROUND - 1, 'padlock');
  for (const x of [20, 55]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(4, onGround(GROUND, s.back), s.back);
  m.sign(13, onGround(GROUND, s.trail), s.trail);
  m.sign(30, onGround(GROUND, s.escape), s.escape);
  m.sign(48, onGround(GROUND, s.crow), s.crow);
  m.sign(59, onGround(GROUND, s.gate), s.gate);
  return {
    file: 'alley',
    title: 'Saucer Alley',
    hint: 'Follow the cream. Mind the crow.',
    look: 'alley',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
