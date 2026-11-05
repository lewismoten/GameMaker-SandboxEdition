// SEEDS AND NESTS's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   BIRD      a small yellow bird that flutters about over the nest it hatched from. Not solid, harmless,
//             and it has a lifetime (`end`), so it flies away by itself after a while.
//   BLUEBIRD  the same bird in blue, for the nest Lami can empty, so a check can tell the two nests apart.
// What the engine does (code/GM/PLAYBACK.C BlocBirthMon, line ~2691): a background block with a
// "birth" monster and a "birth time" (ticks, 18.2 a second) gives birth to that monster at its own
// place every birth time, for as long as the block is within a screen of the hero. The timer is one
// per block KIND, not per square: every square of the same block hatches at the same moment.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const BIRD = 3;
export const BLUEBIRD = 4;

/** Powers: 100 or more cannot be popped by touching Lami (code/GM/PLAYGAME.C DoCollision); nothing here is thrown. */
export const POWER = 110;
/** Hit points Lami starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** How long a bird stays, in ticks (18.2 a second): level 1's flies off after about 8 seconds, level 2's blue ones go after about 5 seconds, so two are in the air at a time and the last one leaves soon after the nest is stopped. */
export const BIRD_LIFE = 150;
export const BLUEBIRD_LIFE = 100;

const T = 255;

/** A little round bird facing right: a plump body, one wing up or down, a beak and an eye. `body` and `wing` are color ramps. */
function bird(pal: Pal, wingUp: boolean, body: number[], wing: number[]): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 9, 12, 7, 5.4, body, 0, 4);
  // the tail, behind
  p.line(2, 10, 0, 8, wing[2]).line(2, 11, 0, 10, wing[2]).line(2, 12, 0, 12, wing[2]);
  // the beak
  p.rect(16, 11, 3, 2, r('orange')[3]).set(19, 12, r('orange')[2]);
  // the eye
  p.disc(13, 10, 1.6, c('white', 3)).set(13, 10, c('ink', 0)).set(14, 10, c('ink', 0));
  // the wing
  if (wingUp) blob(p, 7, 6, 2.6, 4.6, wing, 1, 4);
  else blob(p, 7, 15, 3.2, 3.4, wing, 1, 4);
  p.set(11, 17, r('orange')[2]).set(8, 17, r('orange')[2]);
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then the yellow bird and the blue bird, two frames each. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const { r } = pal;
  mb.add('bird0', bird(pal, true, r('gold'), r('orange')), {});
  mb.add('bird1', bird(pal, false, r('gold'), r('orange')), {});
  mb.add('bluebird0', bird(pal, true, r('blue'), r('teal')), {});
  mb.add('bluebird1', bird(pal, false, r('blue'), r('teal')), {});
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

/** The .MON: the kit's three, then the two birds. A bird flutters up and across and back (a path of 5 blocks, 1 up: higher and it would reach the top screen row, where a monster is not drawn), and goes when its time is up. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[BIRD] = mon(anim('bird', 3), { power: POWER, thru: 1, end: BIRD_LIFE }, pace(5, 2, -1));
  set[BLUEBIRD] = mon(anim('bluebird', 3), { power: POWER, thru: 1, end: BLUEBIRD_LIFE }, pace(4, 2, -2));
  return set;
}
