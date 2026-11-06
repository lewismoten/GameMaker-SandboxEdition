// THREE PHASES' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR      the friendly gold star Nova throws (hero.ts): power 200, so it beats every monster it touches
//   TWINKLE   the sparkle a star leaves behind
//   level 1   four stages: calm, calm, hurried, hurried
//   level 2   five stages: calm, calm, hurried, hurried, tiny
//   POOF      the puff left when the last hit lands
// A boss that changes as it is hurt is a chain of monsters: a star kills the one in front and it "becomes" the
// next in the same place, and the last becomes the puff. What makes a phase is the monster itself: its
// picture and its path, a back-and-forth walk along the tunnel, to the left and right of where it stands (a calm one is slow and short, a hurried one
// quick and long, the tiny one quickest). The next stage's walk starts from where the last one fell, so a
// boss that walks drifts a little. Every stage is solid on every side, stings a little, and has power 150: a
// touch from Nova cannot kill it (100 or more), but a star (200) can. Each hit scores 20.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';
import { drawBug, drawPoof, type Look } from './bugArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const TWINKLE = 4;

/** Each level's chain, in the order the stages come: level 1 has two calm, two hurried; level 2 adds a tiny last one. */
export const CHAINS: { first: number; looks: Look[] }[] = [
  { first: 5, looks: ['calm', 'calm', 'hurry', 'hurry'] },
  { first: 9, looks: ['calm', 'calm', 'hurry', 'hurry', 'tiny'] },
];
/** The puff after the last stage of either chain. */
export const POOF = CHAINS[1].first + CHAINS[1].looks.length;
/** How many hits each level's bug takes. */
export const HITS = CHAINS.map((c) => c.looks.length);
/** How a look walks: blocks either side of where it stands, and how fast (the engine's path speed). */
export const WALK: Record<Look, { run: number; speed: number }> = {
  calm: { run: 1, speed: 1 },
  hurry: { run: 2, speed: 3 },
  tiny: { run: 2, speed: 5 },
};

/** What the bug takes off Nova's hit points when she walks into it. */
export const STING = 1;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 9 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 45;
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

/** The monster pictures: the kit's, then the star's two turns, two sparkles, the three bug looks (two wiggles each) and the puff. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  // a bug is solid all around and stings a little when touched
  const rules = { solid: SOLBOT | SOLLEF | SOLRIG | SOLTOP, hp: -STING };
  for (const look of ['calm', 'hurry', 'tiny'] as const) for (const f of [0, 1] as const) mb.add(`${look}${f}`, drawBug(pal, f, look), rules);
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

/** The .MON: the kit's three, then the star, the sparkle, nine bug stages (each becomes the next) and the puff. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies toward where Nova was last walking, and dies when it hits something or when its lifetime (end, in ticks) is over
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  // a star kills a stage and it becomes the next; the last becomes the puff. Each walks its look's path
  for (const { first, looks } of CHAINS) {
    looks.forEach((look, i) => {
      const w = WALK[look];
      set[first + i] = mon(
        anim(look, look === 'calm' ? 6 : 3),
        { power: 150, thru: 1, newmon: i + 1 < looks.length ? first + i + 1 : POOF, upscore: HIT_SCORE },
        [corner(0, 0, w.speed), corner(-w.run, 0, w.speed, 4), corner(w.run, 0, w.speed, 0), corner(0, 0, w.speed, 4)],
      );
    });
  }
  // the puff swells and is gone in 18 ticks; end: 18 is its lifetime
  set[POOF] = mon(anim('poof', 6), { power: 150, thru: 1, end: 18 });
  return set;
}
