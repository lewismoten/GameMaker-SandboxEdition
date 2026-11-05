// HERE TODAY's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   TWINKLE  what a bubble leaves behind for a moment: a little sparkle
//   BUBBLE   a clear soap bubble sitting still in a tunnel, solid, with a lifetime (`end`): when the
//            ticks are up it is gone and leaves a sparkle (`newmon`)
//   SLEEPER  a sleepy blue gumdrop with closed eyes, solid, with a lifetime: when it is up it
//            BECOMES the awake one (`newmon`) instead of vanishing
//   AWAKE    the same gumdrop in sunrise orange with its eyes open: not solid, harmless, strolls
//            back and forth. It never goes away (`end` -2).
// What the engine does (code/GM/PLAYGAME.C): a monster's `end`, when more than 0, is its lifetime
// in ticks (18.2 a second) counted from its birth (BirthTime). When it is up, KillMon (line ~3253)
// either removes it or, if `newmon` names a monster, turns it into that monster at the same place,
// with that monster's own picture, solidity, path and lifetime. A monster put on the map is born
// when the scene starts, so its clock starts then, not when Kit arrives.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const TWINKLE = 3;
export const BUBBLE = 4;
export const SLEEPER = 5;
export const AWAKE = 6;
/** How many blocks the awake one strolls before it turns. */
export const STROLL = 3;

/** Powers: 100 or more cannot be popped by touching Kit (code/GM/PLAYGAME.C DoCollision); nothing here is thrown. */
export const POWER = 110;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Lifetimes in ticks (18.2 a second): the bubble in level 1 and the sleeper in level 2. */
export const BUBBLE_LIFE = 340;
export const SLEEPER_LIFE = 340;

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

/** A soap bubble: a thin blue-white ring you can see the sky through, a bright shine, resting on the ground. `tall` is the wobble. */
function bubble(pal: Pal, tall: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const blue = pal.r('blue');
  const white = pal.c('white', 3);
  const rx = tall ? 7 : 8;
  const ry = tall ? 9 : 8;
  const cy = 19 - ry;
  for (let a = 0; a < Math.PI * 2; a += 0.04) {
    const x = Math.round(9.5 + Math.cos(a) * rx);
    const y = Math.round(cy + Math.sin(a) * ry);
    p.set(x, y, a > 3.4 && a < 4.9 ? white : blue[3]);
  }
  // the shine, up on the left, and a small glint
  p.line(5, cy - 3, 5, cy - 1, white).line(6, cy - 4, 7, cy - 5, white);
  p.set(13, cy + 4, blue[4]);
  return p;
}

/** The kit's gumdrop with one color ramp swapped for another. */
function recolor(pic: Pixels, from: number[], to: number[]): Pixels {
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = from.indexOf(c);
    return k < 0 ? c : to[k];
  });
}

/** The gumdrop asleep: its eyes painted over with two closed curves, and a small z that drifts up. */
function asleep(pal: Pal, pic: Pixels, up: boolean): Pixels {
  const ink = pal.c('ink', 0);
  const p = pic.crop(0, 0, 20, 20);
  const body = p.get(4, 11);
  p.rect(5, 9, 5, 5, body).rect(11, 9, 5, 5, body);
  for (const x0 of [5, 11])
    p.set(x0, 11, ink)
      .set(x0 + 1, 12, ink)
      .set(x0 + 2, 12, ink)
      .set(x0 + 3, 12, ink)
      .set(x0 + 4, 11, ink);
  // a z, four pixels wide
  const zx = up ? 15 : 14;
  const zy = up ? 1 : 2;
  p.rect(zx, zy, 4, 1, ink)
    .set(zx + 3, zy + 1, ink)
    .set(zx + 2, zy + 2, ink)
    .rect(zx, zy + 3, 4, 1, ink);
  p.set(zx + 1, zy + 2, ink);
  return p;
}

/** The monster pictures: the kit's, then two sparkles, the bubble, the sleeper and the awake one, two frames each. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const g0 = mb.pics.get('gumdrop0')!;
  const g1 = mb.pics.get('gumdrop1')!;
  const blueGum = (g: Pixels) => recolor(g, pal.r('purple'), pal.r('blue'));
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  mb.add('bubble0', bubble(pal, false), {});
  mb.add('bubble1', bubble(pal, true), {});
  mb.add('sleeper0', asleep(pal, blueGum(g0), false), {});
  mb.add('sleeper1', asleep(pal, blueGum(g0), true), {});
  mb.add('awake0', recolor(g0, pal.r('purple'), pal.r('orange')), {});
  mb.add('awake1', recolor(g1, pal.r('purple'), pal.r('orange')), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid; the bubble and the sleeper are solid all around, and the awake one is not. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['bubble0', 'bubble1', 'sleeper0', 'sleeper1']) blocks[mb.n(n)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  return blocks;
}

/** The .MON: the kit's three, then the sparkle, the bubble, the sleeper and the awake one. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  // lifetime over: gone, leaving a sparkle (end counts ticks from birth; newmon is what it turns into)
  set[BUBBLE] = mon(anim('bubble', 6), { power: POWER, thru: 1, end: BUBBLE_LIFE, newmon: TWINKLE });
  // lifetime over: becomes the awake one, at the same place
  set[SLEEPER] = mon(anim('sleeper', 14), { power: POWER, thru: 1, end: SLEEPER_LIFE, newmon: AWAKE });
  // end -2 is "never dies"; a monster put on the map or born from another walks the path it has
  set[AWAKE] = mon(anim('awake', 6), { power: POWER, thru: 1, end: -2 }, pace(STROLL, 1));
  return set;
}
