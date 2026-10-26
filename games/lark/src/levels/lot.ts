// Chapter 5, The Charging Run. THE CHEZ ran its battery flat and Doc Leo pushed it the last block
// to the charger at the far corner of the car lot, and the charger is dead: its three breakers are
// off, one in each part of the lot, and the lot's sliding gates open and shut on timers (amber
// means about to shut). Throw all three, and the charger comes on; plug in (walk onto it). Then
// Doc Leo's corner by THE CHEZ opens once (chapter 5's rope) and lets Joe out by a swing gate.
import type { BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

const LOT_ROWS = [
  'FFFFFFFFFFFFFFFFFFFFFFFF',
  'F,,,,,,,,,,F.....C01LkFF',
  'F.ab..ef...F.......F..FF',
  'F..........A.......FJVFF',
  'F.cd..ab...F....ef.....F',
  'F..........F...........F',
  'FFFFFBFFFFFFFFFFFAFFFFFF',
  'F..........F...........F',
  'F..x.......B.......x...F',
  'F.ef..cd...F...cd......F',
  'F..........F...........F',
  'FFFFFFFFAFFFFFFFFFFFBFFF',
  'F......................F',
  'F...cd....x....ab......F',
  'F.@.D..................F',
  'FFFFFFFFFFFSFFFFFFFFFFFF',
];

export function lotMap(set: BlockSet, charging: boolean): Stamped {
  // Doc Leo waits by the entrance until the car is plugged in; then he is in his corner by it
  const rows = LOT_ROWS.map((r) => (charging ? r.replace('D', '.') : r.replace('L', '.').replace('k', '.').replace('J', 'F').replace('V', 'F')));
  return stamp(
    rows,
    {
      F: 'lotFence',
      '.': 'lot',
      ',': 'lotLine',
      a: 'car0a',
      b: 'car0b',
      c: 'car1a',
      d: 'car1b',
      e: 'car2a',
      f: 'car2b',
      A: 'gateA',
      B: 'gateBshut',
      x: 'breaker',
      C: charging ? 'chargerLive' : 'charger',
      '0': charging ? 'chezLit0' : 'chez0',
      '1': charging ? 'chezLit1' : 'chez1',
      D: 'leo',
      L: 'leoGlad',
      k: 'fuse',
      J: 'rope5',
      V: 'swing5',
      '@': 'lot',
      S: 'lot',
    },
    set,
    'lotFence',
    undefined,
    charging ? 'LkJV@S' : 'DxABC@S',
  );
}
