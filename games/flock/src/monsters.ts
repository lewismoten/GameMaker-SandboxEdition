// BIRDS OF A FEATHER's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   BIRD  a small green bird that flies a path: 24 blocks right, 24 back, at speed 1. Harmless.
//   QUICK the same bird in gold, on the same path at speed 2, so it pulls away from the green ones.
// What the engine does (code/GM/PLAYGAME.C, the monster path): a monster walks its list of corners
// at the speed written on each one, and every monster of a kind starts its path when the level
// loads. So five birds of one kind, placed in a shape, keep that shape for as long as they live:
// each follows the same path at the same speed. Nothing makes them "a flock"; the shape is the
// level's placing, held by identical paths. A bird at another speed leaves the shape.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const BIRD = 3;
export const QUICK = 4;
/** Powers: 100 or more cannot be popped by touching Kit. */
export const POWER = 110;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** How many blocks a bird flies before it turns back, and its speeds. */
export const RUN = 24;
export const SPEED = 1;
export const QUICK_SPEED = 2;

const T = 255;

/** A bird facing right in the ramp `ramp` ('green' or 'gold'), its wing up or down. */
function bird(pal: Pal, ramp: 'green' | 'gold', wingUp: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  p.line(4, 11, 0, wingUp ? 9 : 12, c(ramp, 1)).line(4, 12, 1, wingUp ? 11 : 14, c(ramp, 1)); // tail feathers
  blob(p, 9.5, 11.5, 6.4, 4.6, r(ramp), 1, 4); // body
  blob(p, 9.5, 14, 4, 2, r('white'), 1, 3); // pale belly
  blob(p, 14.5, 7.5, 3.8, 3.6, r(ramp), 1, 4); // head
  p.rect(18, 7, 3, 2, c('orange', 3)).set(18, 9, c('orange', 2)); // beak
  p.rect(15, 6, 2, 2, c('ink', 0)).set(15, 6, c('white', 3)); // eye with a glint
  if (wingUp) blob(p, 8, 7.5, 2.4, 5, r(ramp), 3, 4);
  else blob(p, 8, 14, 4.6, 2.2, r(ramp), 3, 4);
  p.set(9, 17, c('orange', 2)).set(11, 17, c('orange', 2)); // feet
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then the green and the gold bird with wings up and down. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('bird0', bird(pal, 'green', true), {});
  mb.add('bird1', bird(pal, 'green', false), {});
  mb.add('quick0', bird(pal, 'gold', true), {});
  mb.add('quick1', bird(pal, 'gold', false), {});
  return mb;
}

/** The finished .MBL: nothing here hurts or blocks. The kit's own three are made harmless and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then the two birds. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const fly = (name: string, speed: number): Monster =>
    mon(
      [
        [mb.n(`${name}0`), 5],
        [mb.n(`${name}1`), 5],
      ],
      { power: POWER, thru: 0, end: -2 },
      pace(RUN, speed),
    );
  set[BIRD] = fly('bird', SPEED);
  set[QUICK] = fly('quick', QUICK_SPEED);
  return set;
}
