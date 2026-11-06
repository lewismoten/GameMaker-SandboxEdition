// SLOW COMPUTERS' monsters: the kit's gumdrop 0, buzzer 1 and shelly 2, made harmless (power 150: the hero
// walks through, and their picture blocks take no hit points). Level 2 has 36 of them on one screen,
// which is the lesson: every monster on screen costs time to move and draw, and a slow PC runs out.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster pictures: the kit's. */
export function monsterPictures(pal: Pal): Book {
  return buildMonsterBlocks(pal);
}

/** The finished .MBL: nothing in the kit's three hurts or blocks. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three. */
export function monsterSet(mb: Book): Monster[] {
  return buildMonsters(mb);
}
