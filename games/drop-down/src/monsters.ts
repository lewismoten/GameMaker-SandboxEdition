// DROP DOWN's monster. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   PLOP  a plump round green friend with big eyes that blinks. It sits where the map puts it, solid
//         on every side (Kit cannot walk through it, he can stand on it) and it hurts nobody.
//
// What the engine does (code/GM/PLAYGAME.C, and the same in web/packages/engine/src/engine/monsters.ts):
// GAME-MAKER MONSTERS HAVE NO GRAVITY. MON.H has a `fly` field ("whether gravity has an effect on a
// monster") that PLAYGAME never reads; a monster goes only where its Movement sends it. So Plop's
// Movement is a pull of its own: a path of one corner, one block straight down, walked again and again.
// With `thru` ("stops on solid") set, a solid block under it clamps every step, so it sits still on a
// crate; when the crate turns to rubble the very next step takes it down a block, and the next, until
// something solid is under it. That is gravity made out of a Movement setting.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster number this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const PLOP = 3;
/** Powers: 100 or more cannot be popped by touching Kit. */
export const POWER = 110;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** How fast Plop drops, in pixels a tick (the speed of its one path corner). */
export const DROP_SPEED = 4;

const T = 255;

/** Plop: a round green body, two feet, a pink blush and a small smile; eyes open or shut. */
function plop(pal: Pal, open: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 10, 12, 8.4, 7, r('green'), 0, 4);
  p.rect(5, 17, 4, 2, c('ink', 1)).rect(11, 17, 4, 2, c('ink', 1));
  const eye = (x: number) => {
    if (open) {
      p.disc(x, 9, 2.6, c('white', 3));
      p.rect(x - 1, 8, 2, 3, c('ink', 0)).set(x, 8, c('white', 3));
    } else p.line(x - 2, 10, x + 2, 10, c('ink', 0));
  };
  eye(6.5);
  eye(13.5);
  p.set(4, 12, c('pink', 2)).set(5, 12, c('pink', 2)).set(15, 12, c('pink', 2)).set(16, 12, c('pink', 2));
  p.line(8, 14, 9, 15, c('ink', 0)).line(9, 15, 11, 15, c('ink', 0)).line(11, 15, 12, 14, c('ink', 0));
  // a tuft of three leaves on top, so it reads as a sprout, not a face
  p.line(10, 4, 10, 1, r('grass')[3]).line(10, 3, 7, 1, r('grass')[3]).line(10, 3, 13, 1, r('grass')[3]);
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then Plop with its eyes open and shut. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('plop0', plop(pal, true), {});
  mb.add('plop1', plop(pal, false), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless, and Plop is solid all round. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['plop0', 'plop1']) blocks[mb.n(n)].solid = SOLTOP | SOLBOT | SOLLEF | SOLRIG;
  return blocks;
}

/** The .MON: the kit's three, then Plop. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  // end -2 is "never dies"; thru is "stops at solid blocks"; the path is one block straight down, over and over
  set[PLOP] = mon(
    [
      [mb.n('plop0'), 24],
      [mb.n('plop1'), 3],
    ],
    { power: POWER, thru: 1, end: -2 },
    [corner(0, 0, DROP_SPEED), corner(0, 1, DROP_SPEED)],
  );
  return set;
}
