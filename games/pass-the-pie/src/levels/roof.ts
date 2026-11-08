// 5. Rooftop Potluck (Rory). The street goes up: a building with no working elevator and a fire escape of four
// zigzag ledges (three blocks apart, so each is a jump), a quick vacuum pacing under the roof's edge (a roll, then
// stand on it), the potluck's dish on the roof with a friendly squirrel, then the alley between two buildings crossed
// on a tailwind, the next roof, a ladder down and the dish's door. The first level that is mostly climbing.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import * as art from '../art';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  ledges: [
    [12, 19],
    [18, 27],
    [13, 22],
    [19, 30],
  ],
  rows: [14, 11, 8, 5],
  gold: 14,
  vac: 24,
  roof: [20, 40],
  squirrel: 31,
  dish: 37,
  wind: [41, 48],
  roof2: [49, 62],
  ladder: 63,
  gate: 74,
  exit: 86,
} as const;

export function roof(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  dish(book, art.casserole(pal));
  const s = signs(book, pal, {
    lift: ['ELEVATOR OUT SINCE 1987. TAKE THE FIRE ESCAPE.', 5, 3],
    chili: ['3B: THE SMELL IS CHILI. IT IS ALWAYS CHILI.', 4, 3],
    party: ['ROOFTOP POTLUCK. 14 CASSEROLES. 1 DISH WITH A NAME.', 5, 3],
    gate: ['THE GATE TAKES A DISH. THE ROOF HAS ONE.', 4, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gate, GROUND);
  // the building: siding and windows behind the fire escape, the ledges, the vacuum under the roof's edge
  st.g.fill(12, 2, 30, 15, 'Z');
  for (const [x, y] of [
    [24, 14],
    [30, 13],
    [34, 10],
    [38, 7],
    [26, 5],
  ])
    st.g.put(x, y, 'W');
  AT.ledges.forEach(([x0, x1], i) => st.g.row(AT.rows[i], x0, x1, '='));
  st.g.row(13, 12, 13, 'c').row(10, 20, 24, 'c').put(AT.gold, 7, '$');
  st.g.put(AT.vac, 4, '4').row(1, AT.roof[0], AT.roof[1], 'R');
  st.g.put(AT.dish, 0, 'P').put(AT.squirrel, 0, '1').put(34, 0, 'N');
  // the second building across the alley, and a ladder down its side
  st.g.fill(AT.roof2[0], 5, AT.roof2[1] - AT.roof2[0] + 1, G - 4, 'Z').row(4, AT.roof2[0], AT.roof2[1], 'R').put(53, 8, 'W').put(58, 8, 'W');
  st.g.col(AT.ladder, 3, G, 'H').row(3, 52, 60, 'c');
  // the tailwind over the alley (a jump off the roof without it lands in the street)
  st.g.fill(AT.wind[0], 0, AT.wind[1] - AT.wind[0] + 1, GROUND, 'w');
  for (const [x, y] of [
    [6, 3],
    [28, 0],
    [66, 4],
    [80, 3],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  m.sign(5, GROUND - 1 - s.lift.board.length, s.lift);
  m.sign(14, AT.rows[0] - 1 - s.chili.board.length, s.chili);
  m.sign(55, 3 - s.party.board.length, s.party);
  m.sign(AT.gate - 4, GROUND - 1 - s.gate.board.length, s.gate);
  m.wallToSky(AT.gate);
  return { file: 'roof', title: 'Rooftop Potluck', hero: 'rory', hint: 'Up the fire escape. Mind the alley.', mood: 'rooftop', song: 'pie.cmf', book, map: m, timed };
}
