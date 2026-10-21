// The two acts in the theatre: who stands where.
import type { BlockSet } from '../blocks/blockset';
import { MON } from '../characters/critters';
import { buildTheatre, type Placed, type Theatre } from './theatre';

export function buildActs(bs: BlockSet): Theatre[] {
  const act1: Placed[] = [
    { mon: MON.dobbs, x: 21, y: 45 },
    { mon: MON.cat, x: 30, y: 31 },
    { mon: MON.sandbag, x: 3, y: 11 },
    { mon: MON.sandbag, x: 6, y: 14 },
  ];
  const act2: Placed[] = [
    { mon: MON.watchman, x: 4, y: 8 },
    { mon: MON.wispWander, x: 12, y: 29 },
    { mon: MON.wispWander, x: 36, y: 33 },
    { mon: MON.wispWander, x: 24, y: 42 },
    { mon: MON.wispWander, x: 30, y: 15 },
  ];
  return [buildTheatre(1, bs, act1), buildTheatre(2, bs, act2)];
}
