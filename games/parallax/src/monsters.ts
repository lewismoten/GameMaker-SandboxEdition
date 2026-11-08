// PARALLAX's monsters: the kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file, made harmless
// and never placed in a level (Game-Maker wants a monster file for a scene, and nothing here moves
// but the scenery). To the Horizon (kit/starter) shows monsters that grow as they come.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** Hit points Rima starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;

/** The monster pictures: the kit's. */
export const monsterPictures = (pal: Pal): Book => buildMonsterBlocks(pal);

/** The finished .MBL: nothing here hurts or blocks. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three. */
export const monsterSet = (mb: Book): Monster[] => buildMonsters(mb);
