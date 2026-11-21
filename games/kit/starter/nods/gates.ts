// Register the shared gold lock and stamp a gate beneath its brick wall.
import { SOLID } from '../book';
import { KEYS } from '../blocks';
import { archPicture, gatePicture } from '../locks';
import type { StarterMap } from '../map';
import type { NodCtx } from './types';
import { air } from './rules';
import { add } from './blocks';

export const locks = (c: NodCtx): void => {
  if (c.book.has('gate')) return;
  add(c, 'gateTop', archPicture(c.pal, 'gold'), air);
  add(c, 'gate', gatePicture(c.pal, 'wood', 'gold'), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
};
/** A brick wall one block wide down from the sky to a gate's arch, with the gate in the row above the path. */
export const gateWall = (m: StarterMap, x: number, gate: string): void => {
  for (let y = 0; y < 8; y++) m.set(x, y, 'brick');
  m.set(x, 8, 'gateTop').set(x, 9, gate);
};
