// Chapter 6, The Lighthouse. The cove at night with the lighthouse out: next to nothing shows
// (the scene's palette is all but black, but for what glows) except, every couple of seconds, the
// rocks, when the old lamp sputters (every rock keeps one clock, so they all flash together).
// Carl the fly buzzes ahead with his bright eyes, round and round the way through. Up the
// lighthouse (lighthouse.ts) Joe lights the lamp, and the cove comes back lit: the same map by a
// kinder light, Carl in his corner by the door, which opens once (chapter 6's rope).
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

const COVE_ROWS = [
  'wwwwwwwwwwwwwwwwwwwwwwwwww',
  'w,,,RR,,,,,,RRR,,,,,,01,ww',
  'w,R,,,,RR,R,,,,,RR,,,23,ww',
  'w,R,RRR,,,R,RRR,,R,,,D,,ww',
  'w,,,,,R,R,,,,,R,RR,RRR,,ww',
  'wRRRR,R,RRRRR,R,,,,,,,R,ww',
  'w,,,,,,,,,,,R,RRRRRRR,R,ww',
  'w,RRRRRRRR,,R,,,,,,,R,,,ww',
  'w,,,,,,,,R,RRRRRR,R,R,R,ww',
  'wRRRRRR,,R,,,,,,R,R,,,RRww',
  'w,,,,,R,RRRRRRR,R,RRRRR,ww',
  'w,RRR,R,,,,,,,R,,,,,,,,,ww',
  'w,R,,,RRRRRRR,RRRRRRRRR,ww',
  'w,RcR,,,,,,,,,,,,,,,,,R,ww',
  'w@,,RRRRRRRRRRRRRRRRR,,,ww',
  'wwSwwwwwwwwwwwwwwwwwwwwwww',
];

/** Carl's loop, from where he starts (c): along the way through to the lighthouse door, and back. */
export const CARL_LOOP: [number, number][] = [
  [0, 0],
  [18, 0],
  [20, -2],
  [14, -2],
  [14, -6],
  [18, -4],
  [20, -6],
  [20, -9],
  [18, -10],
];

export function coveMap(set: BlockSet, mons: Bestiary | undefined, lit: boolean): Stamped {
  // lit: the rocks stand still in the light, the lamp is on, and Carl waits in his corner by the
  // door (rope, swing gate, the lens he keeps for Joe), up on the point
  const corner: Record<number, string> = { 1: 'Lk', 2: ',,', 3: 'JV', 4: ',,' };
  const rows = COVE_ROWS.map((r, y) => (lit && corner[y] ? r.slice(0, 23) + corner[y] + r.slice(25) : r));
  return stamp(
    rows,
    {
      w: 'sea',
      ',': 'sand',
      R: lit ? 'rockStill' : 'rock',
      '0': lit ? 'lightLit0' : 'light0',
      '1': lit ? 'lightLit1' : 'light1',
      '2': lit ? 'lightLit2' : 'light2',
      '3': lit ? 'lightLit3' : 'light3',
      D: 'lightDoor',
      c: lit ? 'sand' : { tile: 'sand', mon: 'carl' },
      L: 'carlTile',
      k: 'lens',
      J: 'rope6',
      V: 'swing6',
      '@': 'sand',
      S: 'sand',
    },
    set,
    'sea',
    lit ? undefined : mons,
    lit ? 'LkJVD@S' : 'cD@S',
  );
}
