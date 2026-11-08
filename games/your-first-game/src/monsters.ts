// YOUR FIRST GAME's one monster: a mint-green gumdrop that is friendly. It walks a path, and
// touching it pops it for 50 points (Meet the Monsters explains why a monster with "power" under
// 100 is gone when touched). It takes the kit's gumdrop slot, number 0, so the map's "g" is this one.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** Points for popping a gumdrop. */
export const POP_POINTS = 50;

/** The gumdrop's picture with its purple turned mint green. */
function mint(pal: Pal, pic: Pixels): Pixels {
  const purple = pal.r('purple');
  const teal = pal.r('teal');
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = purple.indexOf(c);
    return k < 0 ? c : teal[k];
  });
}

/** The monster pictures (.MBL): the kit's, then the mint gumdrop, harmless, worth 50 points. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('pop0', mint(pal, mb.pics.get('gumdrop0')!), { score: POP_POINTS });
  mb.add('pop1', mint(pal, mb.pics.get('gumdrop1')!), { score: POP_POINTS });
  return mb;
}

/** The finished .MBL. */
export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

/** The .MON: slot 0 is the mint gumdrop, which walks four blocks and is gone when touched. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  set[0] = mon(
    [
      [mb.n('pop0'), 4],
      [mb.n('pop1'), 4],
    ],
    { power: 1, thru: 1 },
    pace(4, 2),
  );
  return set;
}
