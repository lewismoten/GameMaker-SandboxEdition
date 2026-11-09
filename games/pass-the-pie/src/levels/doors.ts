// 10. Doorbusters (Mr. Plume). The day-after sale, and the shoppers are lawn turkeys: eight packed in the entrance, a
// ladder up to the mezzanine where the mannequins (kick bags) stand in a row with a drone on patrol and the gold
// acorn, a ladder down into a crowd of ten more, two swooping delivery drones, and the stockroom door, which
// shuts with the bar. The level is a test of stamina: it is all one move, kept up against a clock.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { ORIGIN } from '../../../kit/starter/map';
import { addClock, clock, placeBar, placeDoor, placeOven } from '../timing';
import { newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
/** Seconds the bar runs. */
export const SECONDS = 130;
export const AT = {
  oven: 1,
  crowd1: [12, 19],
  ladder: 24,
  mezz: [25, 52],
  bags: [30, 34, 38],
  drone: 44,
  gold: 49,
  ladder2: 53,
  crowd2: [56, 65],
  swoops: [71, 77],
  door: 82,
  exit: 86,
} as const;

export function doors(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  addClock(book, pal, timed, clock(SECONDS));
  const s = signs(book, pal, {
    sale: ['DOORBUSTER SALE. 80% OFF EVERYTHING. 100% OF THE SHOPPERS.', 5, 3],
    mezz: ['MEZZANINE: MANNEQUINS. THEY HAVE HEARD NOTHING.', 5, 3],
    crowd: ['LINE STARTS HERE. IT STARTED YESTERDAY.', 5, 3],
    delivery: ['DRONE DELIVERY: 90 MINUTES OR YOUR PIE IS FREE.', 5, 3],
    door: ['STOCKROOM CLOSES WITH THE BAR. SO DOES THE SALE.', 5, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  // the store: a front of siding and windows, a mezzanine over the middle
  st.g.fill(10, 6, 46, 11, 'Z').put(15, 9, 'W').put(21, 9, 'W').put(33, 7, 'W').put(41, 7, 'W').put(47, 7, 'W');
  for (let x = AT.crowd1[0]; x <= AT.crowd1[1]; x++) st.g.put(x, G, '9');
  st.g.put(22, G, 'N');
  st.g.row(12, AT.mezz[0], AT.mezz[1], '=').col(AT.ladder, 11, G, 'H');
  for (const x of AT.bags) st.g.put(x, 11, '8');
  st.g.row(11, 31, 32, 'c').row(11, 35, 36, 'c').put(AT.drone, 11, '6').put(AT.gold, 11, '$').col(AT.ladder2, 11, G, 'H');
  for (let x = AT.crowd2[0]; x <= AT.crowd2[1]; x++) st.g.put(x, G, '9');
  for (const x of AT.swoops) st.g.put(x, 13, '7');
  st.g.col(AT.door, 0, G - 2, 'B');
  for (const [x, y] of [
    [6, 3],
    [28, 2],
    [58, 3],
    [78, 5],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['sale']) => GROUND - 1 - sg.board.length;
  m.sign(5, board(s.sale), s.sale);
  m.sign(26, 11 - s.mezz.board.length, s.mezz);
  m.sign(46, board(s.crowd), s.crowd);
  m.sign(66, board(s.delivery), s.delivery);
  m.sign(AT.door - 5, board(s.door), s.door);
  for (const x of [7, 33, 60]) placeBar(m, x, 8);
  placeDoor(m, AT.door, GROUND);
  placeOven(m, AT.oven, GROUND);
  m.wallToSky(AT.door);
  return {
    file: 'doors',
    title: 'Doorbusters',
    hero: 'plume',
    hint: 'Eighteen turkeys. One clock.',
    mood: 'sale',
    song: 'payback.cmf',
    book,
    map: m,
    timed,
    restart: [AT.oven + ORIGIN, GROUND - 1 + ORIGIN],
  };
}
