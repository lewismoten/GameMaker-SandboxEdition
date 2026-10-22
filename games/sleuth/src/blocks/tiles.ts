// The Paragon Theatre's background blocks (PARAGON.BBL), seen from above: boards, carpet,
// marble, paneled walls, velvet seats, the stage and its set, the rooms backstage, the
// evidence, the safe's three dials, and the dark under the stage that only shows where
// Ada's lantern has been, and the lobby's history wall.
//
// The pictures are painted by painters.ts and items.ts; each part of the building adds its
// blocks in turn (a block's number is the order it was added, so keep this order).
import type { Pixels } from '../../../kit/pixels';
import { BlockSet, type BlockDef } from './blockset';
import { addItems } from './items';
import { addHouse } from './house';
import { addStage } from './stage';
import { addBackstage } from './backstage';
import { addLobby } from './lobby';
import { addUnder } from './under';
import { addArchives } from './archives';

export function buildTheatreBlocks(): BlockSet {
  const bs = new BlockSet(150, false);
  const add = (name: string, p: Pixels, d: BlockDef = {}) => bs.add(name, p, d);
  addItems(bs, true);
  const floors = addHouse(add);
  addStage(add, floors);
  addBackstage(add, floors);
  const LF = addLobby(add, floors);
  addUnder(add, LF, floors.stairs);
  addArchives(add);
  return bs;
}
