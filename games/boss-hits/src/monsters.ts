// BIG BUG's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR      the friendly gold star Kit throws (hero.ts): power 200, so it beats every monster it touches
//   TWINKLE   the sparkle a star leaves behind
//   PLAIN     level 1's bug, five monsters in a row (PLAIN + 0 is fresh, PLAIN + 4 is on its last hit)
//   LAMPED    level 2's bug, five more, each with one fewer light lit on its shell
//   POOF      the puff left when the last hit lands
// A boss that takes several hits is a chain of monsters: each one "becomes" the next when a star kills it,
// and the last becomes the puff. Every stage sits still, is solid on every side so Kit cannot get past,
// stings a little if he walks into it, and has power 150: a touch from Kit cannot kill it (100 or more),
// but a star (200) can. A kill by a star gives the stage's "score bonus", so each hit scores 20.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';
import { drawBug, drawPoof } from './bugArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const TWINKLE = 4;
/** How many hits the bug takes. */
export const HITS = 5;
/** The first of level 1's five stages, of level 2's five, and the puff after the last: stage i of a bug has HITS - i hits left. */
export const PLAIN = 5;
export const LAMPED = PLAIN + HITS;
export const POOF = LAMPED + HITS;

/** What the bug takes off Kit's hit points when he walks into it. */
export const STING = 5;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
/** Points each hit scores. */
export const HIT_SCORE = 20;

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

/** The monster pictures: the kit's, then the star's two turns, two sparkles, the plain bug, the lamped bug (a picture for each count of lights) and the puff. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  // a bug is solid all around and stings a little when touched
  const rules = { solid: SOLBOT | SOLLEF | SOLRIG | SOLTOP, hp: -STING };
  for (const f of [0, 1] as const) mb.add(`bug${f}`, drawBug(pal, f), rules);
  for (let lit = HITS; lit >= 1; lit--) for (const f of [0, 1] as const) mb.add(`lamp${lit}_${f}`, drawBug(pal, f, lit), rules);
  mb.add('poof0', drawPoof(pal, false), {});
  mb.add('poof1', drawPoof(pal, true), {});
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

/** The .MON: the kit's three, then the star, the sparkle, ten bug stages (each becomes the next) and the puff. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies toward where Kit was last walking, and dies when it hits something or when its lifetime (end, in ticks) is over
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  // five stages a bug: a star kills one and it becomes the next; the fifth hit leaves the puff. They sit still (no path)
  for (let i = 0; i < HITS; i++) {
    const next = (first: number) => (i + 1 < HITS ? first + i + 1 : POOF);
    set[PLAIN + i] = mon(anim('bug', 5), { power: 150, thru: 1, newmon: next(PLAIN), upscore: HIT_SCORE });
    set[LAMPED + i] = mon(anim(`lamp${HITS - i}_`, 5), { power: 150, thru: 1, newmon: next(LAMPED), upscore: HIT_SCORE });
  }
  // the puff swells and is gone in 18 ticks; end: 18 is its lifetime
  set[POOF] = mon(anim('poof', 6), { power: 150, thru: 1, end: 18 });
  return set;
}
