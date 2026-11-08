// Level 12, THE NIGHT MARKET: the stalls close at the 13th chime, all at once. Three shutters (the fair's gate, four
// blocks tall) stand across the lane; the row of bells overhead counts down to the chime, and when the last bell goes
// dark every shutter slams down together for a few seconds. Run the lane ahead of the clock, past the crows who keep
// the stalls' watch (a crow bobs between each pair of shutters).
//   - stacks of two wooden boxes at three stalls: knock through them (5 points a box);
//   - cracks to hop on the way; crates to climb at the last stall.
// No charms: the market is for cats in a hurry, not for luck.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';
import { addMeter } from '../meter';

export const MARKET = {
  boxes: [14, 40, 66],
  cracks: 20,
  cracks2: 45,
  gates: [27, 52, 74],
  crows: [35, 57],
  crowRow: 5,
  crates: 61,
  exit: 84,
  width: 88,
} as const;

const SIGNS = {
  close: ['THE MARKET SHUTS AT THE 13TH CHIME. ALL THE SHUTTERS. AT ONCE.', 4, 4],
  knock: ['STALL STOCK: KNOCK AND GO THROUGH.', 4, 3],
  crow: ['WATCHMAN CROW. MIND HIS HOURS.', 4, 3],
  last: ['LAST SHUTTER. THEN THE NIGHT IS YOURS.', 4, 3],
} as const;

export function levelMarket(pal: Pal): Level {
  const book = startBook(pal, ['crack', 'crate', 'town', 'wood'], []);
  const timed = addMeter(book, pal);
  const s = addSigns(book, pal, SIGNS);
  const g = room(MARKET.width, MARKET.exit);
  scenery(
    g,
    [
      [10, 2],
      [40, 1],
      [70, 2],
    ],
    [18, 48, 76],
    [24, 58, 86],
  );
  const m = new StarterMap(book, g.rows());
  // the bells: a clock face, then seven bells, hung the whole way along
  for (let x0 = 4; x0 + 7 < MARKET.width - 6; x0 += 8) {
    m.set(x0, 4, 'meterCap');
    for (let j = 0; j < 7; j++) m.set(x0 + 1 + j, 4, `bellOn${j}`);
  }
  // lanterns (bunting) over the stalls, below the bells
  for (let x = 5; x < MARKET.width - 4; x += 2) m.set(x, 2, 'bunting');
  for (const x of MARKET.gates) for (let y = GROUND - 4; y < GROUND; y++) m.set(x, y, 'gateOpen');
  for (const x of MARKET.boxes) for (const y of [GROUND - 2, GROUND - 1]) m.set(x, y, 'woodBox');
  for (const x of [MARKET.cracks, MARKET.cracks + 1, MARKET.cracks2, MARKET.cracks2 + 1]) m.set(x, GROUND - 1, 'crack');
  for (const y of [8, 9]) m.set(MARKET.crates, y, 'crate').set(MARKET.crates + 1, y, 'crate');
  for (const x of MARKET.crows) m.mon(CROW.bobbing, x, MARKET.crowRow);
  for (const x of [22, 47, 78])
    m.set(x, 8, 'tentL')
      .set(x + 1, 8, 'tentR')
      .set(x, 9, 'tentL')
      .set(x + 1, 9, 'tentR');
  m.sign(5, onGround(GROUND, s.close), s.close);
  m.sign(9, onGround(GROUND, s.knock), s.knock);
  m.sign(30, onGround(GROUND, s.crow), s.crow);
  m.sign(69, onGround(GROUND, s.last), s.last);
  return {
    file: 'market',
    title: 'The Night Market',
    hint: 'Beat the 13th chime. Three times.',
    look: 'market',
    chr: 'hero',
    map: m,
    book,
    timed,
    charms: [],
  };
}
