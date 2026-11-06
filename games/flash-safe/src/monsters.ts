// FLASH SAFE's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   BURR     a spiky seed ball that hangs in the air. Touching it takes hit points (its picture block's
//            Hit points), and its power is under 100, so the touch also destroys it: it BECOMES (`newmon`) its number.
//   POPFIVE  the number "-5": one picture that holds still (it never blinks), rises two blocks along its
//            path and is gone when the path ends (`end` -1). Power 150, so Lami walks through it, and it pays nothing.
// What the engine does (code/GM/PLAYGAME.C): a monster Lami touches whose power is under 100 first has its
// picture block's effects applied (the hit points; losing some starts Lami's own hurt sequence: her ouch
// face and a beep), then KillMon turns it into `newmon` at the same place. A number is only a picture.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { burr, minusFive } from './props';
import { THORN_HURT } from './timing';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const BURR = 3;
export const POPFIVE = 4;
/** A burr is under 100 (touching Lami destroys it); a number is over (touching Lami does nothing). */
const BURR_POWER = 50;
const NUMBER_POWER = 150;
/** How far the number rises (blocks) and how fast (pixels a tick). */
const RISE = 2;
const RISE_SPEED = 1;

/** The monster pictures: the kit's, then the burr in two frames and the number. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('burr0', burr(pal, false), { hp: THORN_HURT });
  mb.add('burr1', burr(pal, true), { hp: THORN_HURT });
  mb.add('minus5', minusFive(pal), {});
  return mb;
}

/** The finished .MBL: nothing in the kit's own three hurts or blocks. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then the burr and its number. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  // a burr hangs in the air with no path and turns a little now and then (slowly, a tiny picture)
  set[BURR] = mon(
    [
      [mb.n('burr0'), 14],
      [mb.n('burr1'), 14],
    ],
    { power: BURR_POWER, thru: 1, newmon: POPFIVE },
  );
  // the number holds still as it rises, and is gone when its path ends
  set[POPFIVE] = mon([[mb.n('minus5'), 8]], { power: NUMBER_POWER, thru: 1, end: -1 }, [corner(0, -RISE, RISE_SPEED)]);
  return set;
}
