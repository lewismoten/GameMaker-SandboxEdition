// ONE KEY, MANY WEAPONS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR     the friendly gold star Kit throws: born from a frame of the hero's star sequence (hero.ts), it
//            flies the way Kit last walked until it hits something or its lifetime runs out. Power 120.
//   FLAME    the little orange flame from the flame sequence: the same flight, but power 200.
//   TWINKLE  what a star, a flame or a popped monster leaves behind for a moment: a little sparkle
//   TARGET   a mint green gumdrop sitting still: harmless, not solid, power 110, so a star or a flame pops it
//   POUCH    a sack of stars or of flames (one monster each) that sits still. Its picture block carries the
//            Effect and Amount (a counter and how much to add), power 50 so touching it takes it, and it
//            "becomes" the slumped EMPTY sack, which has power 100 (touching does not take it) and a
//            lifetime of REFILL ticks, after which it becomes the full sack again.
//   FROSTY   a pale blue gumdrop with a frown that blocks a narrow way: solid on every side so Kit cannot
//            pass, harmless to touch, power 150: a star (120) is used up on it, only a flame (200) melts it
// What the engine does (code/GM/PLAYGAME.C, DoCollision): when two monsters overlap, the one
// with less power dies and the stronger one lives; but a monster born from the character
// (fromchar) is used up as well, and the character gets the dead monster's "score bonus". A star
// born from Kit can never hurt him. Touching a monster whose power is 100 or more does not
// kill it, so Kit can only get rid of a guard by throwing a star.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';
import { drawFlame } from './flameArt';
import { drawPouch } from './pouchArt';
import { FLAMES_PER_POUCH, SEQ_FLAME, SEQ_STAR, STARS_PER_POUCH } from './weapons';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const STAR = 3;
export const FLAME = 4;
export const TWINKLE = 5;
export const TARGET = 6;
export const FROSTY = 7;
export const STAR_POUCH = 8;
export const STAR_EMPTY = 9;
export const FLAME_POUCH = 10;
export const FLAME_EMPTY = 11;
/** The powers: a star beats a target but not frost; a flame beats both. */
export const POWER = { star: 120, flame: 200, target: 110, frosty: 150 } as const;

/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
/** Ticks before an empty pouch is full again (about four seconds). */
export const REFILL = 72;
/** Points for popping a target or melting a frosty one. */
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

/** The kit's gumdrop turned pale blue with a frown and two slanted brows, and a white shine: a frosty grump, not a monster to fear. */
function frosty(pal: Pal, pic: Pixels, tall: boolean): Pixels {
  const ink = pal.c('ink', 0);
  const body = pal.c('blue', 3);
  const purple = pal.r('purple');
  const ice = pal.r('blue');
  const p = pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = purple.indexOf(c);
    return k < 0 ? c : ice[Math.min(k, ice.length - 1)];
  });
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
  const white = pal.c('white', 3);
  p.set(5, y - 1, white).set(5, y, white).set(6, y - 2, white);
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

/** The monster pictures: the kit's, then the star's two turns, the flame's two sways, two sparkles, the mint target and the frosty one. */
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
  mb.add('flame0', drawFlame(pal, 0), {});
  mb.add('flame1', drawFlame(pal, 1), {});
  const pouch = (kind: 'star' | 'flame', counter: number, amount: number) => {
    // two frames, the second a pixel lower, so a sack sits there breathing
    for (const f of [0, 1]) {
      const bob = (p: Pixels) => new Pixels(20, 20, T).blit(p, 0, f, T);
      mb.add(`${kind}Pouch${f}`, bob(drawPouch(pal, kind, true)), { effect: counter, eamt: amount });
      mb.add(`${kind}Empty${f}`, bob(drawPouch(pal, kind, false)), {});
    }
  };
  pouch('star', SEQ_STAR, STARS_PER_POUCH);
  pouch('flame', SEQ_FLAME, FLAMES_PER_POUCH);
  mb.add('frosty0', frosty(pal, g0, false), {});
  mb.add('frosty1', frosty(pal, g1, true), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid, and the frosty one is solid all around. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['frosty0', 'frosty1']) blocks[mb.n(n)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  return blocks;
}

/** The .MON: the kit's three, then the star, the flame, the sparkle, the target and the frosty one. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // both fly toward where Kit was last walking (towards 1 to 63 is a speed; Game-Maker gives a monster born
  // from the character that direction), die when they hit a wall or when their lifetime (end, in ticks) is
  // over, and leave a sparkle either way. Only their power differs.
  set[STAR] = mon(anim('star', 2), { power: POWER.star, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[FLAME] = mon(anim('flame', 2), { power: POWER.flame, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 100, thru: 1, end: 9 });
  // both sit still (no path) and give points when popped
  set[TARGET] = mon(anim('target', 5), { power: POWER.target, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  set[FROSTY] = mon(anim('frosty', 8), { power: POWER.frosty, thru: 1, newmon: TWINKLE, upscore: POP_SCORE });
  // a pouch is taken by touching it (power under the hero's 100), which adds to the counter and
  // turns it into the slumped sack; that stays (power 100) REFILL ticks and turns back
  const pouchPair = (kind: string, full: number, empty: number) => {
    set[full] = mon(anim(`${kind}Pouch`, 9), { power: 50, thru: 1, newmon: empty });
    set[empty] = mon(anim(`${kind}Empty`, 9), { power: 100, thru: 1, end: REFILL, newmon: full });
  };
  pouchPair('star', STAR_POUCH, STAR_EMPTY);
  pouchPair('flame', FLAME_POUCH, FLAME_EMPTY);
  return set;
}
