// Level 5, THE CLOCK TOWER: a tall level, four floors up inside the tower to the 13th bell.
//   floor 1  a ladder up from the street, a long plank, and a column of floating umbrellas at the far end;
//   floor 2  a wall of wooden boxes to knock through, then a ladder up the left side;
//   floor 3  a crow bobbing across the plank (wait for it to fly up), and another umbrella lift;
//   floor 4  the bell chamber: the lucky bell and the door out.
// One charm: the bell.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { CROW } from '../monsters';
import { addSigns, onGround, startBook, type Level } from '../level';

/** The tower's size: 30 blocks wide and tall, its street on row 27. */
const W = 30;
const H = 30;
const STREET = 27;

/** The rows of the four floors' planks, bottom to top (a person stands on the row above). */
export const FLOORS = [22, 17, 12, 6] as const;

export const TOWER = {
  ladder: 4,
  liftRight: 26,
  box: 14,
  crow: 15,
  crowRow: 7,
  bell: 12,
  exit: 6,
} as const;

const SIGNS = {
  tower: ['THE CLOCK TOWER! CLIMB TO THE 13TH BELL.', 4, 3],
  boxes: ['KNOCK ON WOOD TO GET THROUGH.', 4, 3],
  crow: ['A CROW ON THE THIRD FLOOR. WAIT FOR IT.', 4, 3],
  bell: ['RING IT! THEN THE DOOR OUT.', 4, 3],
} as const;

export function levelTower(pal: Pal): Level {
  const charms = ['bell'] as const;
  const book = startBook(pal, ['brolly', 'wood', 'town', 'clock'], charms);
  const s = addSigns(book, pal, SIGNS);
  const g = new Grid(W, H);
  g.row(STREET, 0, W - 1, 'G').fill(0, STREET + 1, W, 2, 'D');
  g.col(0, 0, STREET - 1, 'X').col(W - 1, 0, STREET - 1, 'X');
  g.put(2, STREET - 2, 's').put(2, STREET - 1, 'S');
  // floor 1 and its ladder up from the street, floors 2 to 4, each with its ladder up the left side
  g.col(TOWER.ladder, FLOORS[0] - 1, STREET - 1, 'H');
  g.row(FLOORS[0], TOWER.ladder + 1, 25, '=');
  g.row(FLOORS[1], TOWER.ladder + 1, 25, '=');
  // (this ladder reaches one row below the plank, so a cat stepping onto it from the floor is held, and is out of reach from floor 1)
  g.col(TOWER.ladder, FLOORS[2] - 1, FLOORS[1], 'H');
  g.row(FLOORS[2], TOWER.ladder + 1, 25, '=');
  g.row(FLOORS[3], TOWER.ladder + 1, 25, '=');
  g.put(TOWER.exit, FLOORS[3] - 2, 'e').put(TOWER.exit, FLOORS[3] - 1, 'E');
  const m = new StarterMap(book, g.rows());
  // a brick ceiling over the top floor
  for (let x = 1; x < W - 1; x++) m.set(x, 1, 'brick');
  // the two umbrella lifts (right end): floor 1 to 2, floor 3 to 4
  const colors = ['brollyRed', 'brollyGold', 'brollyTeal'];
  for (const [low, top] of [
    [FLOORS[0] - 1, FLOORS[1] - 1],
    [FLOORS[2] - 1, FLOORS[3] - 1],
  ])
    for (let y = top; y <= low; y++) m.set(TOWER.liftRight, y, colors[y % 3]);
  // a rafter two rows over each lift's top holds the umbrellas' passenger (two blocks tall) at the floor's height
  for (const top of [FLOORS[1] - 1, FLOORS[3] - 1]) m.set(TOWER.liftRight, top - 2, 'brick');
  // wooden boxes across floor 2
  for (let y = FLOORS[1] - 3; y < FLOORS[1]; y++) m.set(TOWER.box, y, 'woodBox');
  // the crow on floor 3 and the bell on floor 4
  m.mon(CROW.bobbing, TOWER.crow, TOWER.crowRow);
  m.set(TOWER.bell, FLOORS[3] - 1, 'charm.bell');
  // the clock's face on the wall of the bell chamber
  m.set(18, 2, 'clockTL').set(19, 2, 'clockTR').set(18, 3, 'clockBL').set(19, 3, 'clockBR');
  m.sign(8, onGround(FLOORS[0], s.tower), s.tower);
  m.sign(17, onGround(FLOORS[1], s.boxes), s.boxes);
  m.sign(8, onGround(FLOORS[2], s.crow), s.crow);
  m.sign(21, onGround(FLOORS[3], s.bell), s.bell);
  return {
    file: 'tower',
    title: 'The Clock Tower',
    hint: 'Climb to the 13th bell.',
    look: 'tower',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [...charms],
  };
}
