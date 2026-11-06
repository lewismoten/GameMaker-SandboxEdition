// THROW IT's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR     the friendly gold star Mia throws: it is born from a frame of the hero's throw
//            sequence (hero.ts) and flies the way Mia last walked, until it hits something,
//            a wall or its lifetime runs out. Power 200: it beats every monster it touches.
//   TWINKLE  what a star (or a popped monster) leaves behind for a moment: a little sparkle
//   TARGET   a mint green gumdrop sitting still: harmless, not solid, power 150, so only a star pops it
//   GUARD    a purple gumdrop with a frown that blocks a narrow way: solid on every side so
//            Mia cannot pass, harmless to touch, power 150, so only a star pops it
// What the engine does (code/GM/PLAYGAME.C, DoCollision): when two monsters overlap, the one
// with less power dies and the stronger one lives; but a monster born from the character
// (fromchar) is used up as well, and the character gets the dead monster's "score bonus". A star
// born from Mia can never hurt her. Touching a monster whose power is 100 or more does not
// kill it, so Mia can only get rid of a guard by throwing a star.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const TWINKLE = 4;
export const TARGET = 5;
export const GUARD = 6;

/** Hit points Mia starts with (nothing in this game takes any, but Game-Maker wants a number). */
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

/** The monster pictures: the kit's, then the star's two turns, two sparkles, the mint target and the guard. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const g0 = mb.pics.get('gumdrop0')!;
  const g1 = mb.pics.get('gumdrop1')!;
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  mb.add('target0', mint(pal, g0), {});
  mb.add('target1', mint(pal, g1), {});
  mb.add('guard0', grump(pal, g0, false), {});
  mb.add('guard1', grump(pal, g1, true), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid, and the guard is solid all around. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['guard0', 'guard1']) blocks[mb.n(n)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  return blocks;
}

/** The .MON: the kit's three, then the star, the sparkle, the target and the guard. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies toward where Mia was last walking (towards 1 to 63 is a speed; Game-Maker gives a monster
  // born from the character that direction), dies when it hits a wall or when its lifetime
  // (end, in ticks) is over, and leaves a sparkle either way
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  // both sit still (no path) and give points when a star pops them
  set[TARGET] = mon(anim('target', 5), { power: 150, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  set[GUARD] = mon(anim('guard', 8), { power: 150, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  return set;
}
