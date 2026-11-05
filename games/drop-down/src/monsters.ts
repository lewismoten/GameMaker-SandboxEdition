// DROP DOWN's monster. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   PLOP  a plump round green friend with big eyes that blinks. It sits where the map puts it, solid
//         on every side (Lena cannot walk through it, she can stand on it) and it hurts nobody.
//   PIP   the same friend in pink, soft (not solid: Lena walks through it) and with a slower step down: it
//         falls at a tenth of Plop's speed.
//   SWING the whoosh of Lena's hit (Enter). It is born from a frame of her hit sequence (hero.ts, as THROW IT's
//         star is) at her own spot and flies a few pixels the way she last walked. A monster
//         she fired dies on a wall, and a crate is a wall to it; it then turns into a THUD in the same place.
//   THUD  the burst where the swing met the wall. A monster born from the character cannot touch her
//         until it has turned into something else, so this is the first thing that does: the touch
//         adds HIT_COST to the hit counter (sound 7), and the crate Lena pushes on spends it. The
//         burst's picture sits in the right half of its square, so it touches Lena only when the wall
//         was within a few pixels: a swing at nothing leaves no hit behind. A power under 100 dies on that touch.
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
import { HIT_COST, HIT_COUNTER } from './blocks';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const PLOP = 3;
export const PIP = 4;
export const SWING = 5;
export const THUD = 6;
/** The swing: pixels a tick, and ticks it lives (about 8 pixels of reach: it is a hit, not a throw). */
export const SWING_SPEED = 4;
export const SWING_LIFE = 2;
/** Powers: 100 or more cannot be popped by touching Lena. */
export const POWER = 110;
/** Hit points Lena starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** How fast each one drops, in pixels a tick (the speed of its one path corner). Plop: a block a tick; Pip: ten ticks a block. */
export const PLOP_SPEED = 20;
export const PIP_SPEED = 2;

const T = 255;

/** Plop: a round green body, two feet, a pink blush and a small smile; eyes open or shut. */
function plop(pal: Pal, open: boolean, ramp: 'green' | 'pink' = 'green'): Pixels {
  const { c, r } = pal;
  const body = ramp === 'green' ? 'green' : 'pink';
  const p = new Pixels(20, 20, T);
  blob(p, 10, 12, 8.4, 7, r(body), 0, ramp === 'green' ? 4 : 3);
  p.rect(5, 17, 4, 2, c('ink', 1)).rect(11, 17, 4, 2, c('ink', 1));
  const eye = (x: number) => {
    if (open) {
      p.disc(x, 9, 2.6, c('white', 3));
      p.rect(x - 1, 8, 2, 3, c('ink', 0)).set(x, 8, c('white', 3));
    } else p.line(x - 2, 10, x + 2, 10, c('ink', 0));
  };
  eye(6.5);
  eye(13.5);
  const blush = ramp === 'green' ? c('pink', 2) : c('red', 3);
  p.set(4, 12, blush).set(5, 12, blush).set(15, 12, blush).set(16, 12, blush);
  p.line(8, 14, 9, 15, c('ink', 0)).line(9, 15, 11, 15, c('ink', 0)).line(11, 15, 12, 14, c('ink', 0));
  // a tuft of three leaves on top, so it reads as a sprout, not a face
  p.line(10, 4, 10, 1, r('grass')[3]).line(10, 3, 7, 1, r('grass')[3]).line(10, 3, 13, 1, r('grass')[3]);
  return outline(p, c('ink', 0), { transparent: T });
}

/** The whoosh of a swing: two curved strokes in the right half of the square, white and gold, near the crate side. */
function swing(pal: Pal, big: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const gold = pal.r('gold');
  const white = pal.c('white', 3);
  const r = big ? 8 : 6;
  for (let a = -1.1; a <= 1.1; a += 0.05) {
    const x = 9 + Math.round(Math.cos(a) * r);
    const y = 10 + Math.round(Math.sin(a) * r * 1.1);
    p.set(x, y, white).set(x - 1, y, gold[4]);
  }
  p.line(11, 5, 15, 5, white).line(12, 15, 16, 15, white);
  return outline(p, pal.c('ink', 0), { transparent: T });
}

/** The burst of the hit: a gold star with white spikes (an x and a plus), in the right half of the square. */
function thud(pal: Pal, turned: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const gold = pal.r('gold');
  const white = pal.c('white', 3);
  const cx = 14;
  const cy = 10;
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
  for (const [dx, dy] of dirs) for (let i = 1; i <= (turned ? 4 : 5); i++) p.set(cx + dx * i, cy + dy * i, i < 3 ? gold[4] : gold[3]);
  p.disc(cx, cy, 2.5, gold[4]).set(cx, cy, white).set(cx - 1, cy, white).set(cx, cy - 1, white);
  return outline(p, pal.c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then Plop and Pip with their eyes open and shut, then the swing and the thud. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('plop0', plop(pal, true), {});
  mb.add('plop1', plop(pal, false), {});
  mb.add('pip0', plop(pal, true, 'pink'), {});
  mb.add('pip1', plop(pal, false, 'pink'), {});
  mb.add('swing0', swing(pal, false), {});
  mb.add('swing1', swing(pal, true), {});
  // the burst's touch fills the hit counter (it is spent on the next crate touch)
  mb.add('thud0', thud(pal, false), { effect: HIT_COUNTER, eamt: HIT_COST });
  mb.add('thud1', thud(pal, true), { effect: HIT_COUNTER, eamt: HIT_COST });
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless, Plop is solid all round and Pip is soft. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['plop0', 'plop1']) blocks[mb.n(n)].solid = SOLTOP | SOLBOT | SOLLEF | SOLRIG;
  // the swing and the burst are not solid (book.add set none), and nothing hurts
  // Pip stays 0 (soft): the kit's blocks start with no solid bits and book.add set none for it
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
    [corner(0, 0, PLOP_SPEED), corner(0, 1, PLOP_SPEED)],
  );
  // the same Movement at a slower speed (that one number is how fast it falls); its picture is not solid
  set[PIP] = mon(
    [
      [mb.n('pip0'), 24],
      [mb.n('pip1'), 3],
    ],
    { power: POWER, thru: 1, end: -2 },
    [corner(0, 0, PIP_SPEED), corner(0, 1, PIP_SPEED)],
  );
  // the swing flies the way Lena last walked, for a moment, and turns into a burst when it hits the crate (or its time is up)
  set[SWING] = mon(
    [
      [mb.n('swing0'), 1],
      [mb.n('swing1'), 1],
    ],
    { power: 200, thru: 1, towards: SWING_SPEED, end: SWING_LIFE, newmon: THUD },
  );
  // the burst touches Lena once (power under 100: that touch ends it) and is gone in a few ticks if nothing does
  set[THUD] = mon(
    [
      [mb.n('thud0'), 2],
      [mb.n('thud1'), 2],
    ],
    { power: 50, thru: 1, end: 6 },
  );
  return set;
}
