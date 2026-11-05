// TAKE THE WHEEL's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   HONK     the ripple of the kart's horn. It is born from a frame of the kart's honk sequence
//            (kart.ts, the same way Kit's thrown star is born in THROW IT) and flies the way the kart last
//            drove, about five blocks. Power 200: it beats every monster it touches.
//   BIRD     a blue bird sitting in the road. Solid on every side, so a kart that cannot jump
//            has to stop. Power 150: touching it does nothing to the bird, only a honk (200) does.
//            When a honk pops it, it BECOMES (`newmon`) a bird in flight.
//   FLY      the bird flapping up and away along a path, gone when the path ends (`end` -1).
// What the engine does (code/GM/PLAYGAME.C): when two monsters overlap the one with less power
// dies and, if it has a `newmon`, turns into that monster in the same place. The character cannot
// jump unless a sequence on a key pushes him upward, and a kart has no such sequence.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const HONK = 3;
export const BIRD = 4;
export const FLY = 5;

/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Pixels a honk flies a tick, and how many ticks it flies: the range is the product, five blocks. */
export const HONK_SPEED = 4;
export const HONK_LIFE = 25;
/** How far the freed bird flies (blocks across, up) and how fast (pixels a tick). */
const AWAY: [number, number, number] = [5, -6, 2];

const T = 255;

/** A friendly blue bird: sitting (facing left, toward the road the kart comes from), or flying with its wing up or down. */
function bird(pal: Pal, pose: 'sit' | 'up' | 'down', blink = false): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const dy = pose === 'sit' ? 0 : -3;
  blob(p, 11, 14 + dy, 7.5, 4.6, r('blue'), 1, 4);
  blob(p, 6, 10 + dy, 4, 4, r('blue'), 1, 4);
  if (pose === 'sit') {
    p.line(17, 12, 19, 10, c('blue', 1)).line(17, 13, 19, 12, c('blue', 1));
    p.line(9, 19, 9, 18, c('orange', 2)).line(13, 19, 13, 18, c('orange', 2));
  } else {
    p.line(17, 10, 19, 8, c('blue', 1)).line(17, 11, 19, 10, c('blue', 1));
  }
  blob(p, 9, 16 + dy, 4.5, 2, r('white'), 0, 3); // the pale belly
  p.set(1, 10 + dy, c('orange', 3))
    .set(2, 10 + dy, c('orange', 3))
    .set(1, 11 + dy, c('orange', 2)); // the beak
  if (pose === 'up') blob(p, 12, 9, 3, 6, r('blue'), 0, 4);
  if (pose === 'down') blob(p, 12, 17, 6, 2.6, r('blue'), 0, 4);
  if (blink) p.set(4, 9 + dy, c('ink', 0)).set(5, 9 + dy, c('ink', 0));
  else p.set(5, 9 + dy, c('ink', 0)).set(5, 8 + dy, c('white', 3));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The horn's ripple: two rings, wider in the second picture. */
function ripple(pal: Pal, wide: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const white = pal.c('white', 3);
  const sky = pal.c('sky', 4);
  for (const rad of wide ? [4, 8] : [3, 6]) p.ring(9.5, 9.5, rad, rad > 5 ? sky : white);
  p.disc(9.5, 9.5, 1, pal.c('gold', 4));
  return outline(p, pal.c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then the sitting bird, the flying bird's two wing positions and the ripple's two. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('bird0', bird(pal, 'sit'), {});
  mb.add('bird1', bird(pal, 'sit', true), {});
  mb.add('fly0', bird(pal, 'up'), {});
  mb.add('fly1', bird(pal, 'down'), {});
  mb.add('honk0', ripple(pal, false), {});
  mb.add('honk1', ripple(pal, true), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid, and the sitting bird is solid all around. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['bird0', 'bird1']) blocks[mb.n(n)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  return blocks;
}

/** The .MON: the kit's three, then the honk, the bird in the road and the bird flying away. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  // flies the way the kart last drove (towards 1 to 63 is a speed), is used up when it hits a wall or its lifetime (end) is over
  set[HONK] = mon(anim('honk', 3), { power: 200, thru: 1, towards: HONK_SPEED, end: HONK_LIFE });
  // sits still (no path); a honk pops it and it becomes the bird in flight
  set[BIRD] = mon(anim('bird', 18), { power: 150, thru: 1, newmon: FLY });
  set[FLY] = mon(anim('fly', 3), { power: 150, thru: 1, end: -1 }, [corner(AWAY[0], AWAY[1], AWAY[2])]);
  return set;
}
