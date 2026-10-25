// Up the lighthouse, seen from the side: the door back out to the cove, a lift in the floor at the
// east end that rises to the first landing, then landings by turns, west and east, hop by hop, up
// to the lamp room. The lamp is out; touch it (walk into it) and it lights.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const LIGHTHOUSE_ROWS = [
  '##############',
  '#............#',
  '#.....l......#',
  '#..========..#',
  '#............#',
  '#......======#',
  '#............#',
  '#======......#',
  '#............#',
  '#......======#',
  '#............#',
  '#======......#',
  '#............#',
  '#......====..#',
  '#............#',
  '#....w.......#',
  '#............#',
  '#............#',
  '#......w.....#',
  '#D@..........#',
  '###########L##',
  '##############',
];

export function lighthouseMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    LIGHTHOUSE_ROWS,
    {
      '#': 'brick',
      '.': 'air',
      '=': 'beam',
      w: 'airWindow',
      l: 'lamp',
      D: 'door',
      '@': 'air',
      L: { tile: 'air', mon: 'lift' },
    },
    set,
    'brick',
    mons,
    'lD@L',
  );
}
