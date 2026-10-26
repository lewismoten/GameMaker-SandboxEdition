// Chapter 4, The Music Box. A toy shop at night: shelves of toys all round, the counter, and on
// the floor a big music box that won't play, because the third goat from the left wandered in and
// ate its crank. (She is sorry. She is a goat.) Its keyhole is just big enough for a small tin
// robot (walk onto it). When it plays again, the goat dances in her corner by the window, which
// opens once (chapter 4's rope) and lets Joe out by a swing gate.
import type { BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

const SHOP_ROWS = [
  'TTTTTTTTTTTTTTTTTTTT',
  'T..................T',
  'T.tt.tt....01..hLkhT',
  'T.tt.tt....23..h..hT',
  'T...........K..hJVhT',
  'T..................T',
  'T.cccc.........tt..T',
  'T..............tt..T',
  'T.....G............T',
  'T..tt.....tt.......T',
  'T..tt.....tt.......T',
  'T..................T',
  'T.........@........T',
  'TTTTTTTTTTSTTTTTTTTT',
];

export function shopMap(set: BlockSet, playing: boolean): Stamped {
  // before it plays the goat is out on the floor, and her corner stands empty and shut (no rope
  // to spend the chapter's flag on too soon)
  const rows = SHOP_ROWS.map((r) => (playing ? r.replace('G', '.') : r.replace('L', '.').replace('k', '.').replace('J', 'h').replace('V', 'h')));
  return stamp(
    rows,
    {
      T: 'toys',
      t: 'toys2',
      h: 'toys',
      c: 'counter',
      '.': 'shopFloor',
      '0': 'box0',
      '1': 'box1',
      '2': 'box2',
      '3': 'box3',
      K: 'keyhole',
      G: 'goat',
      L: 'goatGlad',
      k: 'dancer',
      J: 'rope4',
      V: 'swing4',
      '@': 'shopFloor',
      S: 'shopFloor',
    },
    set,
    'toys',
    undefined,
    playing ? 'LkJV@S' : 'GK@S',
  );
}
