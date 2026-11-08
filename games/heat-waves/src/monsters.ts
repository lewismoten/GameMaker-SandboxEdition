// HEAT WAVES' monsters: the kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file, made harmless and
// never placed (Game-Maker wants a monster file for a scene), then:
//   MIRAGE 3, 4  the left and right blocks of a shiny puddle on level 2's road.
// What the engine does (code/GM/PLAYGAME.C, MonInRange and moveallmons): a monster with an attack path
// switches to it when the hero comes closer than 8 blocks across and 5 down (ATTACKX, ATTACKY). The
// puddle's own path stands still; its attack path is one long, fast jump 20 blocks straight down, into
// the ground under the road where the screen never looks, so it is there one tick and gone the next.
// Its blocks are not solid and take no hit points, and its power is too high for Kit to pop it.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { ATTACKMOVEMENT, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { puddle } from './scene';

/** The puddle's left block's monster number (its right block is the next). */
export const MIRAGE = 3;
/** How far down (blocks) the puddle jumps to hide, and how fast (pixels a tick: the whole way in two ticks). */
export const HIDE_DEPTH = 20;
const HIDE_SPEED = 200;
/** Ticks each of the puddle's three glints shows. */
const GLINT_TICKS = 6;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;

/** The monster pictures: the kit's, then the puddle's two halves in three glints each. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  for (let h = 0; h < 2; h++) for (let f = 0; f < 3; f++) mb.add(`puddle${h}${f}`, puddle(pal, f, h), {});
  return mb;
}

/** The finished .MBL: nothing here hurts or blocks. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then the mirage's two halves. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  for (let h = 0; h < 2; h++) set[MIRAGE + h] = mirage(mb, h);
  return set;
}

/** Half `h` of the puddle: still until Kit is near, then a jump down out of sight. */
function mirage(mb: Book, h: number): Monster {
  const m = mon(
    [0, 1, 2].map((f) => [mb.n(`puddle${h}${f}`), GLINT_TICKS] as [number, number]),
    // activate 1: an attack path, set off when Kit is near; thru 0: it goes through the ground
    { power: 150, thru: 0, activate: 1 },
    [corner(0, 0, 1)], // stands still
  );
  // the attack path starts at its second corner (PLAYGAME sets dest to 1), measured from the first
  m.march[ATTACKMOVEMENT][0] = corner(0, 0, HIDE_SPEED);
  m.march[ATTACKMOVEMENT][1] = corner(0, HIDE_DEPTH, HIDE_SPEED);
  return m;
}
