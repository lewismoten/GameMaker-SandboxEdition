// WHO WINS?'s monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR     the friendly gold star Lami throws (hero.ts). Power 140.
//   TWINKLE  what a popped monster leaves behind for a moment: a little gold sparkle
//   PIP      a small mint gumdrop (half a block) sitting still, solid, power 110: it beats nothing
//   MID      a purple grump sitting still, solid, power 130: a star (140) still beats it
//   BIG      a big red gumdrop with a gold crest, the whole block, never solid and harmless, power
//            180: it beats a star, a pip and a mid. In level 1 it paces through a tunnel and pops
//            the pips by itself; in level 2 it stands still and a star thrown at it fizzles.
//   FIZZLE   what a used-up star leaves: the star gone gray and shrinking. A star is used up
//            whenever it meets a monster, winning or losing (PLAYGAME kills a monster born from
//            the character either way), so it always fizzles; when it wins, the other one sparkles.
// The sparkle and the fizzle have the big one's power (180): equal powers pass through each
// other, so the big one does not wipe them away the moment they appear.
// What the engine does (code/GM/PLAYGAME.C, DoCollision): when two monsters overlap and their
// powers differ, the one with less power dies and the stronger one lives; equal powers pass through
// each other. A monster born from the character (the star) is used up as well when it wins, and
// the character gets the dead monster's "score bonus". Touching a monster whose power is 100 or
// more does not kill it, so Lami can only get rid of a pip or a mid by throwing a star.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';
import { sparkle } from '../../kit/starter/sparkle';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const TWINKLE = 4;
export const PIP = 5;
export const MID = 6;
export const BIG = 7;
export const BIG_STILL = 8;
export const FIZZLE = 9;
/** How many blocks the big one walks before it turns (level 1). */
export const BIG_RUN = 9;

/** The powers (code/GM/PLAYGAME.C DoCollision): higher kills lower; 100 or more cannot be killed by touching Lami. */
export const POWER = { pip: 110, mid: 130, star: 140, big: 180 } as const;

/** Hit points Lami starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
/** Points for popping a target or a guard. */
export const POP_SCORE = 50;

const T = 255;

/** A round white eye with an ink pupil; `size` 1 is a small one, 2 the kit's. */
function eye(p: Pixels, pal: Pal, x: number, y: number, size: number): void {
  p.disc(x, y, size + 0.6, pal.c('white', 3));
  p.rect(x, y - 1, size > 1 ? 2 : 1, size > 1 ? 3 : 2, pal.c('ink', 0));
  if (size > 1) p.set(x + 1, y - 1, pal.c('white', 3));
}

/** A small mint gumdrop, half the size of the kit's: low and wide, or (the second frame) a little taller. */
function mint(pal: Pal, tall: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const cy = tall ? 14.6 : 15.6;
  if (tall) blob(p, 10, cy, 4.6, 4.6, pal.r('teal'), 0, 4);
  else blob(p, 10, cy, 5.4, 3.8, pal.r('teal'), 0, 4);
  const y = Math.round(cy - 1);
  eye(p, pal, 8, y, 1);
  eye(p, pal, 12, y, 1);
  p.set(9, y + 2, c('ink', 0)).set(10, y + 2, c('ink', 0));
  p.set(7, y - 2, c('teal', 4));
  return outline(p, c('ink', 0), { transparent: T });
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

/** The big one: a red gumdrop filling the whole block, with big eyes, a wide smile and three gold points on top, a bit like a party hat. */
function big(pal: Pal, tall: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const cy = tall ? 11.8 : 12.6;
  const ry = tall ? 7.6 : 6.8;
  blob(p, 10, cy, tall ? 8 : 8.7, ry, pal.r('red'), 0, 4);
  const ink = c('ink', 0);
  const y = Math.round(cy - 1);
  eye(p, pal, 6, y, 2);
  eye(p, pal, 13, y, 2);
  // a wide smile and pink cheeks
  p.set(7, y + 4, ink)
    .line(8, y + 5, 12, y + 5, ink)
    .set(13, y + 4, ink);
  p.set(4, y + 3, c('pink', 2)).set(16, y + 3, c('pink', 2));
  p.set(5, y - 4, c('red', 4)).set(6, y - 5, c('red', 4));
  // the crest sits on the top of the body: three gold points with an ink edge
  const top = Math.ceil(cy - ry);
  for (const [x, dy] of [
    [7, 1],
    [10, 0],
    [13, 1],
  ] as const) {
    const t = top + dy;
    p.set(x, t, c('gold', 4))
      .set(x, t - 1, c('gold', 4))
      .set(x, t - 2, ink)
      .set(x - 1, t - 1, ink)
      .set(x + 1, t - 1, ink)
      .set(x - 1, t, ink)
      .set(x + 1, t, ink);
  }
  p.rect(7, top + 2, 7, 1, c('gold', 3));
  return outline(p, ink, { transparent: T });
}

/** A used-up star: the star gone gray, then smaller and grayer, with a few bits flying off. */
function fizzle(pal: Pal, late: boolean): Pixels {
  const gold = pal.r('gold');
  const stone = pal.r('stone');
  const star = drawStar(pal, late ? 1 : 0, late ? 0.68 : 0.85).map((_x, _y, c) => {
    const k = gold.indexOf(c);
    return k < 0 ? c : stone[Math.max(1, k - (late ? 0 : 1))];
  });
  const bit = stone[3];
  const bits: [number, number][] = late
    ? [
        [2, 4],
        [17, 3],
        [3, 17],
        [17, 16],
      ]
    : [
        [4, 6],
        [15, 5],
        [5, 15],
        [15, 15],
      ];
  for (const [x, y] of bits) star.set(x, y, bit).set(x + 1, y, bit);
  return star;
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
  mb.add('pip0', mint(pal, false), {});
  mb.add('pip1', mint(pal, true), {});
  mb.add('mid0', grump(pal, g0, false), {});
  mb.add('mid1', grump(pal, g1, true), {});
  mb.add('big0', big(pal, false), {});
  mb.add('big1', big(pal, true), {});
  mb.add('fizzle0', fizzle(pal, false), {});
  mb.add('fizzle1', fizzle(pal, true), {});
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

/** The .MON: the kit's three, then the star, the sparkle, the pip, the mid, the big one (walking and still) and the fizzle. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies toward where Lami was last walking (towards 1 to 63 is a speed; Game-Maker gives a monster
  // born from the character that direction), dies when it hits a wall, a monster or the end of its
  // lifetime (end, in ticks), and fizzles out each time
  set[STAR] = mon(anim('star', 2), { power: POWER.star, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: FIZZLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: POWER.big, thru: 1, end: 9 });
  set[FIZZLE] = mon(
    [
      [mb.n('fizzle0'), 6],
      [mb.n('fizzle1'), 8],
    ],
    { power: POWER.big, thru: 1, end: 14 },
  );
  // the pip and the mid sit still and give points when a star pops them
  set[PIP] = mon(anim('pip', 5), { power: POWER.pip, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  set[MID] = mon(anim('mid', 8), { power: POWER.mid, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  // the big one walks (level 1 puts it on a path, level 2 sits it still: a monster placed on the
  // map walks its own path, so level 2 uses BIG_STILL, the same picture with no path)
  set[BIG] = mon(anim('big', 6), { power: POWER.big, thru: 1 }, pace(BIG_RUN, 1));
  set[BIG_STILL] = mon(anim('big', 6), { power: POWER.big, thru: 1 });
  return set;
}
