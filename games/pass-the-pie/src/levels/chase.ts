// 6. Main Street (Mr. Plume). Big Gobble's test inflation snaps its tether and the giant face rolls down Main
// Street after him, a little slower than he runs. Everything in the way costs time: lawn turkeys and kick bags to
// smash, crates to climb, a quick vacuum to jump over on an awning, a wall of turkeys a POW clears. Out the far end
// before it rolls over him. Nothing knocks the balloon over; it deflates at the end of the street.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { MONS } from '../monsters';
import { newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  chaser: -10,
  turkeys: [12, 33, 34, 62, 63],
  bags: [27, 50, 73],
  crates: [18, 19],
  awning: [38, 45],
  quickVac: 40,
  stairs: [55, 56, 57],
  exit: 87,
} as const;

export function chase(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  const s = signs(book, pal, {
    run: ['IT GOT LOOSE. RUN!', 3, 2],
    end: ['END OF MAIN STREET', 4, 2],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  for (const x of AT.turkeys) st.g.put(x, G, '9');
  for (const x of AT.bags) st.g.put(x, G, '8');
  st.g
    .put(AT.crates[0], G, 'C')
    .put(AT.crates[1], G, 'C')
    .put(AT.crates[1], G - 1, 'C')
    .put(20, G, 'C')
    .put(20, G - 1, 'C');
  st.g.row(13, 17, 21, 'c');
  st.g
    .row(14, AT.awning[0], AT.awning[1], 'A')
    .row(13, AT.awning[0] + 1, AT.awning[1] - 1, 'c')
    .put(AT.quickVac, G, '4');
  st.g
    .put(AT.stairs[0], G, 'C')
    .put(AT.stairs[1], G, 'C')
    .put(AT.stairs[1], G - 1, 'C')
    .put(AT.stairs[2], G, 'C')
    .put(AT.stairs[2], G - 1, 'C')
    .put(AT.stairs[2], G - 2, 'C');
  st.g.row(11, 55, 60, 'c');
  // shop fronts along Main Street, behind everything
  for (const [x0, x1] of [
    [7, 16],
    [23, 31],
    [46, 53],
    [66, 80],
  ]) {
    st.g.fill(x0, 10, x1 - x0 + 1, 5, 'Z').row(9, x0, x1, 'R');
    for (let x = x0 + 2; x < x1; x += 4) st.g.put(x, 12, 'W');
  }
  const m = st.paint(book, pal, timed);
  m.sign(5, G - 2, s.run);
  m.sign(AT.exit - 5, G - 2, s.end);
  for (let i = 0; i < 4; i++) m.mon(MONS.chaser + i, AT.chaser + (i % 2), G - 1 + Math.floor(i / 2));
  return { file: 'chase', title: 'Main Street', hero: 'plume', hint: 'Big Gobble got loose. Run.', mood: 'parade', song: 'chase.cmf', book, map: m, timed };
}
