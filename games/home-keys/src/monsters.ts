// HOME KEYS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR     the friendly gold star Kit throws on Enter: power 200, so it beats whatever it touches
//   TWINKLE  the sparkle a star leaves behind
//   JELLY    a pink jelly that sits in a tunnel and blocks it: solid on every side, harmless, power 150
//            (a touch from Kit cannot move it; a star can). A hit scores 20.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { drawStar } from './starArt';

export const STAR = 3;
export const TWINKLE = 4;
export const JELLY = 5;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
export const HIT_SCORE = 20;

const T = 255;

/** A little four-point sparkle, upright (a plus) or turned (an x). */
function sparkle(pal: Pal, turned: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const gold = pal.r('gold');
  const arm = (dx: number, dy: number, len: number) => {
    for (let i = 1; i <= len; i++) p.set(10 + dx * i, 10 + dy * i, i < 3 ? gold[4] : gold[3]);
  };
  const dirs: [number, number][] = turned
    ? [[-1, -1], [1, -1], [-1, 1], [1, 1]]
    : [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of dirs) arm(dx, dy, turned ? 4 : 6);
  const white = pal.c('white', 3);
  p.set(10, 10, white).set(9, 10, gold[4]).set(11, 10, gold[4]).set(10, 9, gold[4]).set(10, 11, gold[4]);
  return p;
}

/** A wobbly pink jelly with a sleepy smile, squashed a little on frame 1. */
function jelly(pal: Pal, frame: 0 | 1): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const wide = frame ? 9.4 : 8.6;
  const high = frame ? 8.2 : 9;
  blob(p, 10, 10.5, wide, high, r('pink'), 0, 4);
  for (const x of [7, 12]) p.rect(x, 8, 2, 3, c('ink', 0)).set(x, 8, c('white', 3));
  p.set(8, 13, c('ink', 0)).set(9, 14, c('ink', 0)).set(10, 14, c('ink', 0)).set(11, 13, c('ink', 0));
  p.set(5, 6, c('white', 3)).set(6, 5, c('white', 3));
  return outline(p, c('ink', 0), { transparent: T });
}

export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  const rules = { solid: SOLBOT | SOLLEF | SOLRIG | SOLTOP };
  for (const f of [0, 1] as const) mb.add(`jelly${f}`, jelly(pal, f), rules);
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

export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [[mb.n(`${name}0`), t], [mb.n(`${name}1`), t]];
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  set[JELLY] = mon(anim('jelly', 8), { power: 150, thru: 1, upscore: HIT_SCORE });
  return set;
}
