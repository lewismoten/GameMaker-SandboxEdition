// Inside the music box, seen from the side. Joe drops in through the keyhole at the bottom left;
// seven notes have come off the cylinder and float about. Along the bottom, the comb's teeth
// spring down and up by turns over the pit; at the east end a pin lift rides the turning cylinder
// up to the middle floor; then pins up to the top floor, a hop over the gap, and the crank's
// socket, which turns once every note is back, by the keyhole out.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const INBOX_ROWS = [
  '########################',
  '#......................#',
  '#......................#',
  '#......................#',
  '#.n....n.........SX....#',
  '#=========..=======....#',
  '#......................#',
  '#=====.................#',
  '#......................#',
  '#.....====.............#',
  '#...n....n....n......n.#',
  '#=====================.#',
  '#......................#',
  '#......,.......,.......#',
  '#......................#',
  '#......................#',
  '#@..........n..........#',
  '#########AABBAA#######L#',
  '#########......#########',
  '########################',
];

export function inboxMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    INBOX_ROWS,
    {
      '#': 'wood',
      '.': 'air',
      ',': 'air2',
      '=': 'pin',
      A: 'toothA',
      B: 'toothBwarn',
      n: 'note',
      S: 'socket',
      X: 'keyhole',
      '@': 'air',
      L: { tile: 'air', mon: 'lift' },
    },
    set,
    'wood',
    mons,
    'nSX@L',
  );
}
