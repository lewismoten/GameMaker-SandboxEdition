// HOME KEYS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR     the friendly gold star Mara throws on Enter: power 200, so it beats whatever it touches
//   TWINKLE  the sparkle a star leaves behind
//   JELLY    a lime jelly that sits in a tunnel and blocks it: solid on every side, harmless, power 150
//            (a touch from Mara cannot move it; a star can). A hit scores 20.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { sparkle } from '../../kit/starter/sparkle';
import { drawStar } from './starArt';

export const STAR = 3;
export const TWINKLE = 4;
export const JELLY = 5;
/** Pixels a star flies a tick, and how many ticks it flies: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
export const HIT_SCORE = 20;

const T = 255;

/** A lime jelly, a wobbly cube with a flat bottom, a shine on its top and a sleepy smile; squashed a little on frame 1. */
function jelly(pal: Pal, frame: 0 | 1): Pixels {
  const { c, r } = pal;
  const g = r('green');
  const p = new Pixels(20, 20, T);
  const [x0, x1, y0, y1] = frame ? [1, 18, 7, 18] : [3, 16, 4, 18];
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      // round the top corners more than the bottom ones
      const dx = Math.min(x - x0, x1 - x);
      const dy = y - y0;
      if (dx + dy < 3 && dy < 3) continue;
      const light = (x - x0 + (y - y0)) / (x1 - x0 + y1 - y0);
      p.set(x, y, light < 0.3 ? g[4] : light < 0.65 ? g[3] : g[2]);
    }
  const mid = frame ? 9 : 9;
  for (const x of [mid - 3, mid + 2]) p.rect(x, y0 + 5, 2, 3, c('ink', 0)).set(x, y0 + 5, c('white', 3));
  p.set(mid - 2, y0 + 9, c('ink', 0))
    .set(mid - 1, y0 + 10, c('ink', 0))
    .set(mid, y0 + 10, c('ink', 0))
    .set(mid + 1, y0 + 10, c('ink', 0))
    .set(mid + 2, y0 + 9, c('ink', 0));
  p.rect(x0 + 3, y0 + 1, 4, 1, c('white', 3)).set(x0 + 2, y0 + 2, c('white', 3));
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
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  set[JELLY] = mon(anim('jelly', 8), { power: 150, thru: 1, upscore: HIT_SCORE });
  return set;
}
