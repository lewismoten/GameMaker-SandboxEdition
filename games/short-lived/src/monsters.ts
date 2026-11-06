// HERE TODAY's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   TWINKLE  what a bubble leaves behind for a moment: a little sparkle
//   BUBBLE   a clear soap bubble sitting still in a tunnel, solid, with a lifetime (`end`): when the
//            ticks are up it BECOMES a smaller bubble (`newmon`), BUBBLE_MID, which becomes a smaller
//            one still, BUBBLE_SMALL, wobbling faster, which pops into a sparkle. The shrinking is the
//            countdown the player watches.
//   SLEEPER  a sleepy blue gumdrop with closed eyes and a z, solid, with a lifetime: when it is up it
//            becomes DROWSY (one eye peeks open now and then), then STIRRING (blinking fast, both
//            eyes), then the awake one, instead of vanishing
//   AWAKE    the same gumdrop in sunrise orange with its eyes open: not solid, harmless, strolls
//            back and forth. It never goes away (`end` -2).
// What the engine does (code/GM/PLAYGAME.C): a monster's `end`, when more than 0, is its lifetime
// in ticks (18.2 a second) counted from its birth (BirthTime). When it is up, KillMon (line ~3253)
// either removes it or, if `newmon` names a monster, turns it into that monster at the same place,
// with that monster's own picture, solidity, path and lifetime (BirthMon starts its clock afresh,
// line ~3345), so a chain of stages adds up. A monster put on the map is born
// when the scene starts, so its clock starts then, not when Mia arrives.
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
export const BUBBLE_MID = 7;
export const BUBBLE_SMALL = 8;
export const DROWSY = 9;
export const STIRRING = 10;
/** Every stage of the bubble, and of the sleeper before it is awake. */
export const BUBBLES = [BUBBLE, BUBBLE_MID, BUBBLE_SMALL];
export const SLEEPERS = [SLEEPER, DROWSY, STIRRING];
/** How many blocks the awake one strolls before it turns. */
export const STROLL = 3;

/** Powers: 100 or more cannot be popped by touching Mia (code/GM/PLAYGAME.C DoCollision); nothing here is thrown. */
export const POWER = 110;
/** Hit points Mia starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Each stage's lifetime in ticks (18.2 a second): three stages, so the bubble pops and the sleeper wakes 120 ticks (6.6 s) after the level starts. */
export const STAGE_LIFE = 40;

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

/**
 * A soap bubble: a thin blue-white ring you can see the sky through, a bright shine, resting on
 * the ground. `r` is its radius in pixels (it shrinks stage by stage as its time runs out) and
 * `tall` is the wobble.
 */
function bubble(pal: Pal, r: number, tall: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const blue = pal.r('blue');
  const white = pal.c('white', 3);
  const rx = tall ? r - 1 : r;
  const ry = tall ? r + 1 : r;
  const cx = 9.5;
  const cy = 19 - ry;
  for (let a = 0; a < Math.PI * 2; a += 0.04) {
    const x = Math.round(cx + Math.cos(a) * rx);
    const y = Math.round(cy + Math.sin(a) * ry);
    p.set(x, y, a > 3.4 && a < 4.9 ? white : blue[3]);
  }
  // the shine, up on the left, and a small glint low on the right
  const sx = Math.round(cx - rx * 0.55);
  const sy = Math.round(cy - ry * 0.4);
  p.line(sx, sy - 1, sx, sy + 1, white).line(sx + 1, sy - 2, sx + 2, sy - 3, white);
  p.set(Math.round(cx + rx * 0.45), Math.round(cy + ry * 0.5), blue[4]);
  return p;
}

/** The kit's gumdrop with one color ramp swapped for another. */
function recolor(pic: Pixels, from: number[], to: number[]): Pixels {
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = from.indexOf(c);
    return k < 0 ? c : to[k];
  });
}

/** How an eye of the waking gumdrop looks: shut (a curve) or open. */
type Eye = 'shut' | 'open';

/**
 * The gumdrop waking up: each eye shut or open (the kit's open eyes painted over), and
 * while it is still fast asleep a small z that drifts up (`z`: 0 none, 1 low, 2 drifted up).
 */
function waking(pal: Pal, pic: Pixels, eyes: [Eye, Eye], z: 0 | 1 | 2): Pixels {
  const ink = pal.c('ink', 0);
  const p = pic.crop(0, 0, 20, 20);
  const body = p.get(4, 11);
  [5, 11].forEach((x0, i) => {
    if (eyes[i] === 'shut') {
      p.rect(x0, 9, 5, 5, body);
      p.set(x0, 11, ink)
        .set(x0 + 1, 12, ink)
        .set(x0 + 2, 12, ink)
        .set(x0 + 3, 12, ink)
        .set(x0 + 4, 11, ink);
    }
  });
  if (z) {
    // a z, four pixels wide
    const zx = z === 2 ? 15 : 14;
    const zy = z === 2 ? 1 : 2;
    p.rect(zx, zy, 4, 1, ink)
      .set(zx + 3, zy + 1, ink)
      .set(zx + 2, zy + 2, ink)
      .rect(zx, zy + 3, 4, 1, ink);
    p.set(zx + 1, zy + 2, ink);
  }
  return p;
}

/** The monster pictures: the kit's, then two sparkles, the bubble, the sleeper, the awake one, and the stages between, two frames each. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const g0 = mb.pics.get('gumdrop0')!;
  const g1 = mb.pics.get('gumdrop1')!;
  const blueGum = (g: Pixels) => recolor(g, pal.r('purple'), pal.r('blue'));
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  mb.add('bubble0', bubble(pal, 8, false), {});
  mb.add('bubble1', bubble(pal, 8, true), {});
  mb.add('sleeper0', waking(pal, blueGum(g0), ['shut', 'shut'], 1), {});
  mb.add('sleeper1', waking(pal, blueGum(g0), ['shut', 'shut'], 2), {});
  mb.add('awake0', recolor(g0, pal.r('purple'), pal.r('orange')), {});
  mb.add('awake1', recolor(g1, pal.r('purple'), pal.r('orange')), {});
  // the run-down: the bubble shrinking stage by stage, and the sleeper opening its eyes
  mb.add('bubblemid0', bubble(pal, 6.5, false), {});
  mb.add('bubblemid1', bubble(pal, 6.5, true), {});
  mb.add('bubblesmall0', bubble(pal, 5, false), {});
  mb.add('bubblesmall1', bubble(pal, 5, true), {});
  mb.add('drowsy0', waking(pal, blueGum(g0), ['shut', 'open'], 0), {});
  mb.add('drowsy1', waking(pal, blueGum(g0), ['shut', 'shut'], 0), {});
  mb.add('stirring0', waking(pal, blueGum(g0), ['open', 'open'], 0), {});
  mb.add('stirring1', waking(pal, blueGum(g0), ['shut', 'shut'], 0), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid; the bubble and the sleeper are solid all around, and the awake one is not. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  const solid = ['bubble', 'bubblemid', 'bubblesmall', 'sleeper', 'drowsy', 'stirring'].flatMap((n) => [`${n}0`, `${n}1`]);
  for (const n of solid) blocks[mb.n(n)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  return blocks;
}

/** The .MON: the kit's three, then the sparkle, the bubble, the sleeper, the awake one, and the in-between stages. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  const stage = (name: string, t: number, newmon: number) => mon(anim(name, t), { power: POWER, thru: 1, end: STAGE_LIFE, newmon });
  // each lifetime over: the next, smaller bubble, then gone, leaving a sparkle (end counts ticks from birth; newmon is what it turns into)
  set[BUBBLE] = stage('bubble', 6, BUBBLE_MID);
  set[BUBBLE_MID] = stage('bubblemid', 5, BUBBLE_SMALL);
  set[BUBBLE_SMALL] = stage('bubblesmall', 2, TWINKLE);
  // each lifetime over: a little more awake, and at last the awake one, at the same place
  set[SLEEPER] = stage('sleeper', 14, DROWSY);
  set[DROWSY] = stage('drowsy', 8, STIRRING);
  set[STIRRING] = stage('stirring', 4, AWAKE);
  // end -2 is "never dies"; a monster put on the map or born from another walks the path it has
  set[AWAKE] = mon(anim('awake', 6), { power: POWER, thru: 1, end: -2 }, pace(STROLL, 1));
  return set;
}
