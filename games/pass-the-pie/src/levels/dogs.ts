// 8. The Dog Park (Mr. Plume). Three dogs lie across the path, one in each stretch, and each will move for one bone and
// nothing else (no combo moves a dog, which is the joke). The bones are out of the way and each stretch has its own
// way to get its bone: turkeys and an oak to climb; a napping vacuum kicked into a step, a drone on the ledge and a
// swooping one to read; a shed roof by crate stairs with a drone and the gold acorn. Carry the bone back to its dog.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  turkeys: [9, 11],
  bag: 13,
  oak: 19,
  branch: [16, 23],
  bone1: 22,
  dog1: 28,
  vac: 33,
  ledge: [32, 46],
  ledgeDrone: 41,
  bone2: 44,
  swoop: 49,
  dog2: 55,
  shedLadder: 63,
  shed: [64, 72],
  shedDrone: 66,
  bone3: 71,
  gold: 68,
  wall: [74, 75],
  dog3: 80,
  exit: 86,
} as const;

export function dogs(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  const s = signs(book, pal, {
    park: ['THREE DOGS. THREE BONES. THE DOGS CAN COUNT.', 5, 3],
    dog1: ['DOG 1 DOES NOT CARE ABOUT YOUR COMBO.', 4, 3],
    dog2: ['DOG 2 HAS HEARD ABOUT THE HAT.', 4, 3],
    dog3: ['DOG 3 IS THE SMALL ONE. IT IS THE WORST.', 4, 3],
    end: ['ALL THREE DOGS ARE HAPPY. THE TURKEY IS WORKING ON IT.', 5, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  const dog = (x: number) => st.g.col(x, 0, G - 2, 'X').put(x, G - 1, 'l').put(x, G, 'Q');
  // the first stretch: two lawn turkeys, a kick bag, an oak with the bone out on its low branch
  for (const x of AT.turkeys) st.g.put(x, G, '9');
  st.g.put(AT.bag, G, '8');
  st.g.row(13, AT.branch[0], AT.branch[1], '%').row(9, AT.branch[0] + 1, AT.branch[1] - 1, '%').col(AT.oak, 9, G, 'T');
  st.g.row(12, AT.branch[0], AT.branch[0] + 1, 'c').put(AT.bone1, 12, 'O').row(8, AT.branch[0] + 2, AT.branch[1] - 2, 'c');
  dog(AT.dog1);
  // the second: a ledge four blocks up with a quick vacuum under it, a drone on it, the bone at its far end
  st.g.row(13, AT.ledge[0], AT.ledge[1], '=').row(12, 34, 36, 'c').put(AT.ledgeDrone, 12, '6').put(AT.bone2, 12, 'O');
  st.g.fill(AT.ledge[0] + 1, 14, AT.ledge[1] - AT.ledge[0] - 1, 3, 'Z').put(36, 15, 'W').put(41, 15, 'W');
  st.g.put(AT.vac, G, '4').put(AT.swoop, 13, '7');
  dog(AT.dog2);
  // the third: a ladder up to a shed roof with a drone, the gold acorn and the bone; a wall of turkeys
  st.g.fill(AT.shed[0], 11, AT.shed[1] - AT.shed[0] + 1, G - 10, 'Z').row(10, AT.shed[0], AT.shed[1], 'R').put(67, 13, 'W').put(70, 13, 'W');
  st.g.col(AT.shedLadder, 9, G, 'H').put(AT.shedDrone, 9, '6').put(AT.gold, 9, '$').put(AT.bone3, 9, 'O').row(8, 65, 70, 'c');
  for (const x of AT.wall) st.g.put(x, G, '9');
  dog(AT.dog3);
  for (const [x, y] of [
    [6, 3],
    [30, 2],
    [52, 4],
    [76, 3],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['park']) => GROUND - 1 - sg.board.length;
  m.sign(4, board(s.park), s.park);
  m.sign(AT.dog1 - 4, board(s.dog1), s.dog1);
  m.sign(AT.dog2 - 4, board(s.dog2), s.dog2);
  m.sign(AT.dog3 - 4, board(s.dog3), s.dog3);
  m.sign(AT.exit - 5, board(s.end), s.end);
  return { file: 'dogs', title: 'The Dog Park', hero: 'plume', hint: 'Three dogs. One bone each.', mood: 'orchard', song: 'payback.cmf', book, map: m, timed };
}
