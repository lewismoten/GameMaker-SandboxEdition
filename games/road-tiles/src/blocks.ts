// ROAD TILES' block set (roads.bbl), every block a 20x20 piece seen from above. Each piece is drawn once (roadArt.ts) and the
// others are that block flipped or turned, as the block editor's Flip and Rotate buttons do:
//
//   grounds     grass, sand, water, and two blend blocks (grass into sand, sand into water; the far shore is the near one flipped)
//   level 1     straights (across, up-down), round corners (one drawn, three turned), a finish line (across, up-down)
//   level 2     bends from a straight to a diagonal (one drawn, three flipped), the diagonal band (and its mirror) and the four
//               corner triangles that fill the gaps beside it
//   level 3     a crossroads, a T, roads over the blend block, over sand and over water (a bridge, with its two shore blocks)
//   scenery     trees, flowers and boulders (solid), and the signs
//
// Only water, trees and boulders stop the hero; every road block is open ground.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, SOLID } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { skyOf } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { N, arc, buildGrounds, flipX, flipY, laid, run, strip, turn, type Grounds, type Leg } from './roadArt';

const H_ON: Leg[] = [run([-20, 10], [0, 10]), run([0, 10], [20, 10], true), run([20, 10], [40, 10])];
const H_PLAIN: Leg[] = [run([-20, 10], [40, 10])];
const V_PLAIN: Leg[] = [run([10, -20], [10, 40])];
const BAND: Leg[] = [run([-20, 40], [0, 20]), run([0, 20], [20, 0], true), run([20, 0], [40, -20])];
const BEND: Leg[] = [run([-20, 10], [0, 10]), run([0, 10], [10, 10], true), run([10, 10], [20, 0], true), run([20, 0], [40, -20])];

/** The block names of every road piece, so the maps and the check can talk about them. */
export const PIECES = {
  straight: ['road.h', 'road.v'],
  corners: ['corner.se', 'corner.sw', 'corner.nw', 'corner.ne'],
  bends: ['bend.w-ne', 'bend.w-se', 'bend.e-nw', 'bend.e-sw'],
  diagonals: ['diag.ne', 'diag.se'],
  tips: ['tip.tl', 'tip.br', 'tip.tr', 'tip.bl'],
} as const;

/** A sign standing on `under`: the Starters' board and posts. The posts are named for the ground so each ground has its own. */
export function addRoadSign(book: Book, pal: Pal, under: Pixels, tag: string, name: string, text: string, w: number, h: number): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, name, text, w, h);
  const sky = skyOf(pal);
  const rename = (n: string) => (n.startsWith('signPost') ? `${n}.${tag}` : n);
  for (const [n, pic] of scratch.pics) {
    if (book.has(rename(n))) continue;
    book.add(
      rename(n),
      pic.crop(0, 0, pic.w, pic.h).map((x, y, c) => (c === sky ? under.get(x % N, y % N) : c)),
    );
  }
  return { board: sign.board, legs: [rename(sign.legs[0]), rename(sign.legs[1])] };
}

/** The whole block set, and the grounds the signs stand on. */
export function addRoadBlocks(book: Book, pal: Pal): Grounds {
  const { c, r } = pal;
  const g = buildGrounds(pal);
  const { grass, sand, water, gs, sw } = g;
  const ws = flipX(sw);
  const ink = c('ink', 0);
  const on = (ground: Pixels) => strip(ground, ground, ground);

  // grounds
  book.add('grass', grass);
  book.add('sand', sand);
  book.add('water', water, { solid: SOLID });
  book.add('blend.gs', gs);
  book.add('shore.sw', sw);
  book.add('shore.ws', ws);

  // level 1: straights, round corners, the finish line
  const across = laid(pal, on(grass), H_ON);
  book.add('road.h', across);
  book.add('road.v', turn(across));
  let corner = laid(pal, on(grass), [run([10, 40], [10, 20]), arc(20, 20, 180, 270), run([20, 10], [40, 10])]);
  for (const name of PIECES.corners) {
    book.add(name, corner);
    corner = turn(corner);
  }
  const finish = (road: Pixels): Pixels => {
    const p = road.crop(0, 0, N, N);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) p.rect(7 + i * 3, 4 + j * 3, 3, 3, (i + j) % 2 ? c('white', 3) : ink);
    return p;
  };
  const crossing = (ground: Pixels) => laid(pal, on(ground), H_PLAIN);
  book.add('finish.h', finish(crossing(grass)));
  book.add('finish.v', turn(finish(crossing(grass))));
  book.add('finish.sand', finish(crossing(sand)));

  // level 2: a bend drawn once (road from the west, up to the north-east corner), then flipped three ways
  const bend = laid(pal, on(grass), BEND);
  const mirrored = flipX(bend);
  book.add('bend.w-ne', bend);
  book.add('bend.w-se', flipY(bend));
  book.add('bend.e-nw', mirrored);
  book.add('bend.e-sw', flipY(mirrored));
  book.add('diag.ne', laid(pal, on(grass), BAND));
  book.add('diag.se', flipX(laid(pal, on(grass), BAND)));
  const tl = laid(pal, on(grass), BAND, { cx: 2, cy: 1 });
  const br = laid(pal, on(grass), BAND, { cx: 1, cy: 0 });
  book.add('tip.tl', tl);
  book.add('tip.br', br);
  book.add('tip.tr', flipX(tl));
  book.add('tip.bl', flipX(br));

  // level 3: junctions, the road over each ground, the bridge
  book.add('cross', laid(pal, on(grass), [...H_PLAIN, ...V_PLAIN]));
  book.add('tee', laid(pal, on(sand), [...H_PLAIN, run([10, 10], [10, 40])]));
  book.add('road.v.sand', turn(laid(pal, on(sand), H_ON)));
  book.add('road.h.sand', laid(pal, on(sand), H_ON));
  book.add('road.h.blend', laid(pal, strip(grass, gs, sand), H_ON));
  book.add('bridge.sw', laid(pal, strip(sand, sw, water), H_PLAIN, { deck: true }));
  book.add('bridge', laid(pal, on(water), H_PLAIN, { deck: true }));
  book.add('bridge.ws', laid(pal, strip(water, ws, sand), H_PLAIN, { deck: true }));

  // scenery
  {
    const gr = r('grass');
    const p = grass.crop(0, 0, N, N);
    p.disc(10.5, 11.5, 9, ink).disc(10, 11, 8.6, gr[0]).disc(10, 10, 8, gr[1]).disc(9, 8.5, 6.4, gr[2]).disc(8, 7, 3.8, gr[3]);
    for (const [x, y] of [
      [5, 12],
      [12, 14],
      [14, 8],
      [9, 4],
    ] as const)
      p.rect(x, y, 2, 1, gr[0]);
    book.add('tree', p, { solid: SOLID });
  }
  {
    const p = grass.crop(0, 0, N, N);
    for (const [x, y, col] of [
      [6, 6, c('pink', 2)],
      [13, 8, c('gold', 4)],
      [8, 13, c('white', 3)],
      [14, 14, c('pink', 2)],
    ] as const) {
      p.disc(x, y, 2.4, col).set(x, y, c('gold', 5));
      p.rect(x, y + 3, 1, 2, r('green')[2]);
    }
    book.add('flower', p);
  }
  {
    // a boulder on the sand: a round gray stone with a lit top
    const st = r('stone');
    const p = sand.crop(0, 0, N, N);
    p.disc(10.5, 11.5, 8.6, ink).disc(10, 11, 8.2, st[1]).disc(10, 10, 7.4, st[2]).disc(8.5, 8, 4.6, st[3]).disc(7.5, 7, 2, st[4]);
    const rand = rng(9);
    for (let i = 0; i < 6; i++) p.set(5 + Math.floor(rand() * 10), 9 + Math.floor(rand() * 8), st[1]);
    book.add('boulder', p, { solid: SOLID });
  }
  return g;
}
