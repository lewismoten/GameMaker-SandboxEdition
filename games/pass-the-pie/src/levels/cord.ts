// 5. The Cord (Rory). Uncle Dale's street at dusk, with the rolls for the town hall. An orange extension cord runs
// along the curb from Grandma's end of the street, and Rory follows it: a vacuum to feed, the bakery's ladder up to
// its roof for a bone, Biscuit the dog who will not move for rolls but will for a bone, a quick vacuum under the
// florist's awning (fed, it is the step up), the mower, the hardware store's roof with a squirrel and the gold
// acorn, the town hall kitchen door, and where the cord ends.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import * as art from '../art';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  rolls: 5,
  vac: 12,
  bakery: [15, 25],
  ladder: 22,
  bone: 24,
  dog: 34,
  quickVac: 38,
  awning: [37, 45],
  mower: 52,
  store: [62, 72],
  storeLadder: 61,
  gold: 72,
  gate: 77,
  plug: 82,
  exit: 87,
} as const;

export function cord(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  dish(book, art.rolls(pal));
  const s = signs(book, pal, {
    cord: ['AN ORANGE CORD, ALL THE WAY DOWN THE STREET.', 4, 3],
    dog: ['BISCUIT WILL NOT MOVE FOR ROLLS. A BONE, MAYBE.', 4, 3],
    hall: ['TOWN HALL KITCHEN', 4, 2],
    plug: ["THE CORD ENDS IN DALE'S GARAGE. IN A 30 FT TURKEY.", 4, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gate, GROUND);
  // the cord along the curb, the whole way (other things stand on it where they are)
  st.g.row(G, 4, AT.plug - 1, '~').put(AT.plug, G, ';');
  st.g.put(AT.rolls, G, 'P').put(AT.vac, G, '3');
  // the bakery: siding, a ladder up, its roof with acorns and the bone at the far end
  st.g.fill(AT.bakery[0] + 1, 10, AT.bakery[1] - AT.bakery[0] - 1, G - 9, 'Z').row(9, AT.bakery[0], AT.bakery[1], 'R');
  st.g.col(AT.ladder, 8, G, 'H').put(18, 12, 'W').put(20, 12, 'W');
  st.g.row(8, AT.bakery[0] + 1, AT.ladder - 1, 'c').put(AT.bone, 8, 'O');
  // Biscuit, in the gap between two hedges
  st.g.col(AT.dog, 0, G - 2, 'X').put(AT.dog, G - 1, 'l').put(AT.dog, G, 'Q');
  // the florist's awning four blocks up, a quick vacuum under it
  st.g.put(AT.quickVac, G, '4').row(13, AT.awning[0], AT.awning[1], 'A').row(12, AT.awning[0] + 1, AT.awning[1] - 1, 'c').put(AT.awning[1] - 1, 12, 'N');
  // the mower, and the hardware store's roof (a ladder up, a squirrel, the gold acorn at the far end)
  st.g.put(AT.mower, G, '5');
  st.g.fill(AT.store[0] + 1, 11, AT.store[1] - AT.store[0] - 1, G - 10, 'Z').row(10, AT.store[0], AT.store[1], 'R').col(AT.storeLadder, 9, G, 'H');
  st.g.row(9, AT.store[0] + 2, AT.store[1] - 2, 'c').put(AT.store[0] + 3, 9, '1').put(AT.gold, 9, '$').put(66, 13, 'W').put(69, 13, 'W');
  for (const [x, y] of [
    [9, 3],
    [30, 2],
    [50, 4],
    [80, 2],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['cord']) => GROUND - 1 - sg.board.length;
  m.sign(6, board(s.cord), s.cord);
  m.sign(AT.dog - 5, board(s.dog), s.dog);
  m.sign(AT.gate - 5, board(s.hall), s.hall);
  m.sign(AT.plug + 1, board(s.plug), s.plug);
  m.wallToSky(AT.dog).wallToSky(AT.gate);
  return { file: 'cord', title: 'The Cord', hero: 'rory', hint: 'Follow the orange cord.', mood: 'dusk', song: 'pie.cmf', book, map: m, timed };
}
