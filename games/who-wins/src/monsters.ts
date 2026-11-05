// WHO WINS?'s monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR     the friendly gold star Kit throws (hero.ts). Power 140.
//   TWINKLE  what a star (or a popped monster) leaves behind for a moment: a little sparkle
//   PIP      a small mint gumdrop sitting still, solid, power 110: it beats nothing and loses to all
//   MID      a purple grump sitting still, solid, power 130: a star (140) still beats it
//   BIG      a big red gumdrop with a gold crest, never solid and harmless, power 180: it beats a
//            star, a pip and a mid. In level 1 it paces through a tunnel and pops the pips by itself;
//            in level 2 it stands still and a star thrown at it is used up.
// What the engine does (code/GM/PLAYGAME.C, DoCollision): when two monsters overlap and their
// powers differ, the one with less power dies and the stronger one lives; equal powers pass through
// each other. A monster born from the character (the star) is used up as well when it wins, and
// the character gets the dead monster's "score bonus". Touching a monster whose power is 100 or
// more does not kill it, so Kit can only get rid of a pip or a mid by throwing a star.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const TWINKLE = 4;
export const PIP = 5;
export const MID = 6;
export const BIG = 7;
export const BIG_STILL = 8;
/** How many blocks the big one walks before it turns (level 1). */
export const BIG_RUN = 9;

/** The powers (code/GM/PLAYGAME.C DoCollision): higher kills lower; 100 or more cannot be killed by touching Kit. */
export const POWER = { pip: 110, mid: 130, star: 140, big: 180 } as const;

/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
/** Points for popping a target or a guard. */
export const POP_SCORE = 50;

const T = 255;

/** The kit's gumdrop picture with its purple turned mint green. */
function mint(pal: Pal, pic: Pixels): Pixels {
  const purple = pal.r('purple');
  const teal = pal.r('teal');
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = purple.indexOf(c);
    return k < 0 ? c : teal[k];
  });
}

/** The kit's gumdrop with a frown and two slanted brows: a grump, not a monster to fear. */
function grump(pal: Pal, pic: Pixels, tall: boolean): Pixels {
  const ink = pal.c('ink', 0);
  const body = pal.c('purple', 2);
  const p = pic.crop(0, 0, 20, 20);
  const y = tall ? 9 : 11;
  // the kit's smile off, a frown on
  for (const [x, dy] of [
    [8, 4],
    [9, 5],
    [10, 5],
    [11, 4],
  ] as const)
    p.set(x, y + dy, body);
  p.set(8, y + 5, ink)
    .set(9, y + 4, ink)
    .set(10, y + 4, ink)
    .set(11, y + 5, ink);
  // brows slanting down toward the middle
  p.line(5, y - 4, 8, y - 3, ink).line(14, y - 4, 11, y - 3, ink);
  return p;
}

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

/** The kit's gumdrop with its purple turned red and three gold points on top, a bit like a party hat. */
function big(pal: Pal, pic: Pixels): Pixels {
  const purple = pal.r('purple');
  const red = pal.r('red');
  const gold = pal.r('gold');
  const p = pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = purple.indexOf(c);
    return k < 0 ? c : red[k];
  });
  const ink = pal.c('ink', 0);
  // the crest sits on the top of the body: three gold points with an ink edge
  for (const [x, y] of [
    [7, 5],
    [10, 4],
    [13, 5],
  ] as const) {
    p.set(x, y, gold[4]).set(x, y - 1, gold[4]).set(x, y - 2, ink).set(x - 1, y - 1, ink).set(x + 1, y - 1, ink).set(x - 1, y, ink).set(x + 1, y, ink);
  }
  p.rect(7, 6, 7, 1, gold[3]);
  return p;
}

/** The monster pictures: the kit's, then the star's two turns, two sparkles, the mint target and the guard. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const g0 = mb.pics.get('gumdrop0')!;
  const g1 = mb.pics.get('gumdrop1')!;
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  mb.add('pip0', mint(pal, g0), {});
  mb.add('pip1', mint(pal, g1), {});
  mb.add('mid0', grump(pal, g0, false), {});
  mb.add('mid1', grump(pal, g1, true), {});
  mb.add('big0', big(pal, g0), {});
  mb.add('big1', big(pal, g1), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid, and the pip and the mid are solid all around. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['pip0', 'pip1', 'mid0', 'mid1']) blocks[mb.n(n)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  return blocks;
}

/** The .MON: the kit's three, then the star, the sparkle, the target and the guard. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies toward where Kit was last walking (towards 1 to 63 is a speed; Game-Maker gives a monster
  // born from the character that direction), dies when it hits a wall or when its lifetime
  // (end, in ticks) is over, and leaves a sparkle either way
  set[STAR] = mon(anim('star', 2), { power: POWER.star, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  // the pip and the mid sit still and give points when a star pops them
  set[PIP] = mon(anim('pip', 5), { power: POWER.pip, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  set[MID] = mon(anim('mid', 8), { power: POWER.mid, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  // the big one walks (level 1 puts it on a path, level 2 sits it still: a monster placed on the
  // map walks its own path, so level 2 uses BIG_STILL, the same picture with no path)
  set[BIG] = mon(anim('big', 6), { power: POWER.big, thru: 1 }, pace(BIG_RUN, 1));
  set[BIG_STILL] = mon(anim('big', 6), { power: POWER.big, thru: 1 });
  return set;
}
