// 9. Aisle Nine (Rory). The supermarket at opening time, seen from the shelf tops: a runaway cart (a quick vacuum)
// fed with a roll and stood on, up to the first shelf, then across the store from shelf to shelf, each higher than
// the last and a jump apart, the cranberry sauce on the top one, a ladder down and the express lane (a gate that takes
// the dish). Mostly a level of jumps: where the last two had a stall or a wind, this one is only your hops.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import * as art from '../art';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  cart: 20,
  shelves: [
    [19, 33],
    [36, 46],
    [49, 58],
  ],
  rows: [13, 11, 8],
  gold: 44,
  dish: 56,
  ladder: 59,
  mower: 64,
  gate: 76,
  exit: 86,
} as const;

export function aisle(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  dish(book, art.cranberry(pal));
  const s = signs(book, pal, {
    nine: ['AISLE 9: PIE FILLING, PIE CRUST, PIE REGRET.', 5, 3],
    cart: ['THE CART IS NOT A STEP. IT IS MAKING AN EXCEPTION.', 5, 3],
    top: ['STAFF ONLY: THE TOP SHELF. YOU ARE STAFF NOW.', 5, 3],
    lane: ['EXPRESS LANE: 12 ITEMS OR FEWER. YOU HAVE ONE PIE.', 5, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gate, GROUND);
  // the store: shelving behind the shelf tops, price tags for windows
  st.g.fill(18, 4, 42, 13, 'Z');
  for (const [x, y] of [
    [23, 8],
    [29, 10],
    [41, 6],
    [53, 12],
  ])
    st.g.put(x, y, 'W');
  AT.shelves.forEach(([x0, x1], i) => st.g.row(AT.rows[i], x0, x1, '='));
  st.g.row(12, 24, 26, 'c').row(10, 39, 41, 'c').row(7, 50, 53, 'c');
  st.g.put(AT.cart, G, '4').put(AT.gold, 10, '$').put(AT.dish, 7, 'P').put(57, 7, 'N');
  st.g.col(AT.ladder, 7, G, 'H');
  st.g.put(AT.mower, G, '5');
  for (const [x, y] of [
    [8, 3],
    [34, 1],
    [62, 3],
    [80, 2],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['nine']) => GROUND - 1 - sg.board.length;
  m.sign(5, board(s.nine), s.nine);
  m.sign(13, board(s.cart), s.cart);
  m.sign(AT.shelves[2][0], AT.rows[2] - 1 - s.top.board.length, s.top);
  m.sign(AT.gate - 5, board(s.lane), s.lane);
  m.wallToSky(AT.gate);
  return { file: 'aisle', title: 'Aisle Nine', hero: 'rory', hint: 'Shelf to shelf. Mind the cart.', mood: 'market', song: 'pie.cmf', book, map: m, timed };
}
