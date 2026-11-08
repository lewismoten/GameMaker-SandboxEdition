// 1. Pumpkin Yard (Rory). The storybook, played straight, but a yard worth climbing: the low oak's branches up to
// the porch roof, Dale's robot mower under a branch too high to jump to (feed it a roll and it is the step up), the
// big oak over a hedge too tall to cross, and Mrs. Pettigrew's gate. The hedge has a way in on its far side.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { press } from '../print';
import * as art from '../art';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
/** Where things are, for the bot (level columns; rows count down from the top). */
export const AT = {
  pie: 6,
  piles: [10, 11],
  lowOak: 20,
  porchLadder: 28,
  roof: [29, 42],
  mower: [47, 54],
  stepBranch: [46, 57],
  bigOak: 60,
  hedge: [66, 72],
  secretGold: 69,
  gate: 80,
  exit: 86,
} as const;

export function yard(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  dish(book, art.pie(pal));
  const s = signs(book, pal, {
    hello: ["GRANDMA'S OVEN WENT KA-CLUNK. RORY HAS THE PIE.", 4, 3],
    mower: ["DALE'S MOWER LOVES BREAD. ENTER TOSSES A ROLL.", 4, 3],
    door: ['PIE GOES HERE.', 3, 2],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  st.gate(AT.gate, GROUND, false, 0, 'X');
  // the low oak: climb the trunk to two branches
  st.g.col(AT.lowOak, 6, GROUND - 1, 'T');
  st.draw(17, 8, ['.cc.ccc...', '%%%T%%%%%%', '...T......', '...T......', 'cc.T.cc...', '%%%T%%%%..']);
  st.g.put(33, 9, '1');
  // the porch: a ladder up, the roof a ledge with acorns, windows and pumpkins under it
  st.g.fill(AT.roof[0], 11, AT.roof[1] - AT.roof[0] + 1, GROUND - 12, 'Z');
  st.g.col(AT.porchLadder, 10, GROUND - 1, 'H').row(10, AT.roof[0], AT.roof[1], 'R');
  for (let x = AT.roof[0] + 1; x < AT.roof[1]; x += 2) st.g.put(x, 9, 'c');
  st.g.put(32, 13, 'W').put(38, 13, 'W').put(30, GROUND - 1, 'p').put(34, GROUND - 1, 'p').put(26, GROUND - 1, 'F');
  st.g.put(36, GROUND - 1, 'h').put(37, GROUND - 1, 'h');
  st.g.put(AT.pie, GROUND - 1, 'P').put(8, GROUND - 1, '&');
  for (const x of AT.piles) st.g.put(x, GROUND - 1, 'h');
  // the mower's stretch, and the branch over it four blocks up (too high to jump to from the grass)
  st.g.put(AT.mower[0], GROUND - 1, '5').row(GROUND - 4, AT.stepBranch[0], AT.stepBranch[1], '%');
  for (let x = AT.stepBranch[0] + 1; x < AT.stepBranch[1] - 1; x += 2) st.g.put(x, GROUND - 5, 'c');
  st.g.put(AT.stepBranch[1] - 1, GROUND - 5, 'N');
  // the big oak: its trunk up past the hedge, a branch out over it and a high one with the gold acorn
  st.g.col(AT.bigOak, 3, GROUND - 1, 'T');
  st.g.row(13, 58, 59, '%').row(8, 52, 59, '%').row(8, 61, 68, '%').row(4, 56, 59, '%').row(4, 61, 64, '%');
  st.g.put(64, 3, '$').put(62, 3, 'c').put(57, 3, 'c').put(54, 7, 'c').put(56, 7, 'c').put(63, 7, '1');
  // the hedge, too tall to cross on the grass; its far side is only leaves, and inside is a stash
  st.g.fill(AT.hedge[0], 10, AT.hedge[1] - AT.hedge[0] + 1, GROUND - 10, 'X').fill(AT.hedge[0] + 1, 14, 5, 3, 'Y');
  st.g.put(AT.hedge[1], 14, 'Y').put(AT.hedge[1], 15, 'Y').put(AT.hedge[1], 16, 'Y');
  st.g.put(AT.secretGold, GROUND - 1, '$').put(67, GROUND - 1, 'c').put(68, GROUND - 1, 'c').put(70, GROUND - 1, 'N');
  st.g.row(9, AT.hedge[0], AT.hedge[1], 'c');
  // past the hedge: squirrels, acorns and the gate
  st.g.put(74, GROUND - 1, '1').row(GROUND - 3, 73, 75, 'c').put(83, GROUND - 1, 'p').put(84, GROUND - 1, 'p');
  for (const [x, y] of [
    [7, 3],
    [36, 2],
    [74, 4],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['hello']) => GROUND - 1 - sg.board.length;
  m.sign(12, board(s.hello), s.hello);
  m.sign(42, board(s.mower), s.mower);
  m.sign(AT.gate - 3, board(s.door), s.door);
  m.wallToSky(AT.gate);
  void press;
  return { file: 'yard', title: 'Pumpkin Yard', hero: 'rory', hint: 'One pie. One mower. Climb.', mood: 'yard', song: 'pie.cmf', book, map: m, timed };
}
