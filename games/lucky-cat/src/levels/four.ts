// Level 4, RACE TO THE FAIR: the fair's gate shuts at the 13th chime of the clock tower.
//   - a row of seven bells (after a little clock face) hangs over the whole street, repeating every eight blocks so
//     one is always in view: they go dark one at a time, and when the last is dark the gate shuts (meter.ts);
//   - the way: cracks to hop, a painter's stepladder (under it a drip of paint, or over its top), a brick wall with
//     a ladder up and down, a lucky shooting star on top of the wall, crates, dice that make seven on the street;
//   - the gate is four blocks tall: late means waiting a few seconds for it to open again and the bells to relight.
// Two charms: the shooting star and the dice.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';
import { addMeter } from '../meter';

export const FOUR = {
  cracks: 12,
  ladder: 20,
  wallLadder: 33,
  wall: [34, 36],
  star: 35,
  cracks2: 44,
  crates: 54,
  dice: 62,
  gate: 81,
  exit: 84,
} as const;

/** The row (counting down from the sky) where the bells hang. */
export const METER_ROW = 4;

const SIGNS = {
  race: ['THE GATE SHUTS ON THE 13TH CHIME. EACH BELL IS A CHIME LEFT.', 4, 4],
  wall: ['A SHOOTING STAR. OVER THE WALL.', 4, 3],
  seven: ['SEVEN IS LUCKY. TAKE THE DICE.', 4, 3],
  gate: ['LAST BELL GOES DARK, GATE SHUTS.', 4, 3],
} as const;

export function levelFour(pal: Pal): Level {
  const charms = ['star', 'dice'] as const;
  const book = startBook(pal, ['stepladder', 'crack', 'crate', 'town'], charms);
  const timed = addMeter(book, pal);
  const s = addSigns(book, pal, SIGNS);
  const g = room(88, FOUR.exit);
  g.col(FOUR.wallLadder, 6, GROUND - 1, 'H');
  g.fill(FOUR.wall[0], 7, 3, 3, 'B');
  scenery(
    g,
    [
      [10, 1],
      [26, 2],
      [48, 1],
      [66, 2],
    ],
    [9, 29, 50, 70],
    [16, 31, 58, 76],
  );
  const m = new StarterMap(book, g.rows());
  // the bells: groups of eight (a clock face, then seven bells) from x 4 on, hung at METER_ROW
  for (let x0 = 4; x0 + 7 < 80; x0 += 8) {
    m.set(x0, METER_ROW, 'meterCap');
    for (let j = 0; j < 7; j++) m.set(x0 + 1 + j, METER_ROW, `bellOn${j}`);
  }
  // the gate before the door: four blocks tall
  for (let y = GROUND - 4; y < GROUND; y++) m.set(FOUR.gate, y, 'gateOpen');
  // the stepladder, with its drip
  m.set(FOUR.ladder, 7, 'stepTopL')
    .set(FOUR.ladder + 1, 7, 'stepTop')
    .set(FOUR.ladder + 2, 7, 'stepTop')
    .set(FOUR.ladder + 3, 7, 'stepTopR');
  for (const y of [8, 9]) m.set(FOUR.ladder, y, 'stepL').set(FOUR.ladder + 3, y, 'stepR');
  m.set(FOUR.ladder + 2, 8, 'drip');
  m.set(FOUR.star, 6, 'charm.star');
  for (const x of [FOUR.cracks, FOUR.cracks + 1, FOUR.cracks2, FOUR.cracks2 + 1]) m.set(x, GROUND - 1, 'crack');
  for (const y of [8, 9]) m.set(FOUR.crates, y, 'crate').set(FOUR.crates + 1, y, 'crate');
  m.set(FOUR.dice, GROUND - 1, 'charm.dice');
  for (const x of [72, 76]) m.set(x, 9, 'tentL').set(x + 1, 9, 'tentR');
  m.sign(5, onGround(GROUND, s.race), s.race);
  m.sign(26, onGround(GROUND, s.wall), s.wall);
  m.sign(64, onGround(GROUND, s.seven), s.seven);
  m.sign(68, onGround(GROUND, s.gate), s.gate);
  return {
    file: 'four',
    title: 'Race to the Fair',
    hint: 'Beat the 13th chime.',
    look: 'fair',
    chr: 'hero',
    map: m,
    book,
    timed,
    charms: [...charms],
  };
}
