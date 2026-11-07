// PASS THE PIE's one monster (.MBL, .MON): a friendly squirrel, worth 50 points when touched (it hops away). The
// hazards (robot vacuums, footballs, loose cranberries, parade floats) are blocks, like spikes: a bump costs 10 hit
// points once and the thing is gone. Nothing here is a foe: nothing chases you.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import * as art from './art';

/** Monster numbers (the map's `mon`). */
export const MONS = { squirrel: 0, plume: 3 } as const;
/** Points for popping a squirrel. */
export const POP_POINTS = 50;

/** The monster pictures: the kit's, then ours (each two frames). */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('squirrel0', art.squirrel(pal, false), { score: POP_POINTS });
  mb.add('squirrel1', art.squirrel(pal, true), { score: POP_POINTS });
  // Mr. Plume: not solid, hurts nobody
  mb.add('plume0', art.turkey(pal, false), {});
  mb.add('plume1', art.turkey(pal, true), {});
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

/** The .MON file. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (n: string, t: number): [number, number][] => [
    [mb.n(`${n}0`), t],
    [mb.n(`${n}1`), t],
  ];
  set[MONS.squirrel] = mon(anim('squirrel', 4), { power: 1, thru: 1 }, pace(4, 2));
  // Mr. Plume follows Rory about, slowly (`towards`: the speed it moves straight toward the hero), and stops at solid blocks
  set[MONS.plume] = mon(anim('plume', 5), { power: 150, thru: 1, end: -2, towards: 1 });
  return set;
}
