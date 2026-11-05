// THE GIANT's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR      the friendly gold star Rima throws (hero.ts): power 200
//   TWINKLE   the sparkle a star leaves behind
//   POOF      the puff a part leaves when its last hit lands
//   ROCKY     level 1's giant: four parts (top left, top right, bottom left, bottom right), one hit each
//   FRESH, HURT, CRACKED   level 2's giant, four parts each: fresh (150), hurt (200, blinking red, for a
//             set time) and cracked (150, a picture with cracks)
// A giant is several monsters standing side by side, one block each (a monster is never bigger). Each
// part is its own monster and is hit on its own: a star kills it and it "becomes" the next one in
// the chain. Level 2's chain is fresh -> (hit) -> hurt -> (the timer runs out) -> cracked -> (hit) -> puff.
// While a part is hurt its power is 200, the same as a star's: a star meeting an equal power does
// nothing to either, so it flies on through (to whatever stands behind), and the part can't be hurt.
// Every part is solid on every side and stings a little if Rima walks into it, with power 150 (or 200
// when hurt): a touch from Rima cannot kill it (100 or more).
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';
import { PARTS, cutParts, drawGolem, drawRobot } from './giantArt';
import { drawPoof } from './poofArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const TWINKLE = 4;
export const POOF = 5;
/** Level 1's four parts (ROCKY + part index), then level 2's: fresh, hurt and cracked, four each. */
export const ROCKY = 6;
export const FRESH = ROCKY + 4;
export const HURT = FRESH + 4;
export const CRACKED = HURT + 4;

/** What a giant takes off Rima's hit points when he walks into it. */
export const STING = 1;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
/** Points each hit scores. */
export const HIT_SCORE = 20;
/** How long a hurt part blinks (ticks of the 18.2 a second clock), and how long each color shows: about 2 seconds, 1.8 blinks a second. */
export const HURT_TICKS = 40;
export const BLINK_TICKS = 5;

const T = 255;

/** A little four-point sparkle, upright (a plus) or turned (an x). */
function sparkle(pal: Pal, turned: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const gold = pal.r('gold');
  const white = pal.c('white', 3);
  const arm = (dx: number, dy: number, len: number) => {
    for (let i = 1; i <= len; i++) p.set(10 + dx * i, 10 + dy * i, i < 3 ? gold[4] : gold[3]);
  };
  const dirs: [number, number][] = turned
    ? [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]
    : [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
  for (const [dx, dy] of dirs) arm(dx, dy, turned ? 4 : 6);
  p.set(10, 10, white).set(9, 10, gold[4]).set(11, 10, gold[4]).set(10, 9, gold[4]).set(10, 11, gold[4]);
  return p;
}

/** The monster pictures: the kit's, then the star's two turns, two sparkles, the puff, and each giant's parts. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  mb.add('poof0', drawPoof(pal, false), {});
  mb.add('poof1', drawPoof(pal, true), {});
  // a part is solid all around and stings a little when touched
  const rules = { solid: SOLBOT | SOLLEF | SOLRIG | SOLTOP, hp: -STING };
  for (const f of [0, 1] as const) {
    const gol = cutParts(drawGolem(pal, f, 'plain'));
    const rob = cutParts(drawRobot(pal, f, 'plain'));
    const crk = cutParts(drawRobot(pal, f, 'cracked'));
    for (const k of PARTS) {
      mb.add(`gol_${k}${f}`, gol[k], rules);
      mb.add(`rob_${k}${f}`, rob[k], rules);
      mb.add(`crk_${k}${f}`, crk[k], rules);
    }
  }
  // the red picture of a cracked robot, one frame: the hurt blink is the cracked picture and this, one after the other
  const hot = cutParts(drawRobot(pal, 0, 'red'));
  for (const k of PARTS) mb.add(`hot_${k}`, hot[k], rules);
  return mb;
}

/** The finished .MBL: the kit's own three monsters are made harmless and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then the star, the sparkle, the puff, level 1's four parts and level 2's twelve. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies toward where Rima was last walking, and dies when it hits something or when its lifetime (end, in ticks) is over
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  // the puff swells and is gone in 18 ticks
  set[POOF] = mon(anim('poof', 6), { power: 150, thru: 1, end: 18 });
  PARTS.forEach((k, i) => {
    // level 1: one hit and the part is a puff
    set[ROCKY + i] = mon(anim(`gol_${k}`, 5), { power: 150, thru: 1, newmon: POOF, upscore: HIT_SCORE });
    // level 2: fresh, hit, hurt (blinks, power 200 so a star does nothing), then cracked; a hit on cracked is the puff
    set[FRESH + i] = mon(anim(`rob_${k}`, 5), { power: 150, thru: 1, newmon: HURT + i, upscore: HIT_SCORE });
    set[HURT + i] = mon(
      [
        [mb.n(`crk_${k}0`), BLINK_TICKS],
        [mb.n(`hot_${k}`), BLINK_TICKS],
      ],
      { power: 200, thru: 1, newmon: CRACKED + i, end: HURT_TICKS },
    );
    set[CRACKED + i] = mon(anim(`crk_${k}`, 5), { power: 150, thru: 1, newmon: POOF, upscore: HIT_SCORE });
  });
  return set;
}
