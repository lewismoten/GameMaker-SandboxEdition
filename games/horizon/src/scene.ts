// TO THE HORIZON's pictures: the road in perspective, painted once on 320x200 pixels, then
// cut into 20x20 blocks (cells that come out alike share one block). Flat bands of color keep
// the number of different blocks small; the road's edges and lane lines are the only slanted cells.
//   drawScene(pal)            the empty road: sky, far hills, a lawn and the road
//   drawArch(pal, p, stage)   the finish arch standing on the road at one of four distances
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { HORIZON, VX, halfWidth, dividerX } from './view';

export const W = 320;
export const H = 200;

/** Where the arch stands at each of its four sizes: the road row its feet are on. */
export const ARCH_FEET = [64, 74, 86, 100] as const;

/** The empty scene. */
export function drawScene(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H, c('sky', 3));
  // sky in three flat bands, lighter toward the horizon
  p.rect(0, 0, W, 20, c('sky', 2)).rect(0, 20, W, 20, c('sky', 3)).rect(0, 40, W, 20, c('sky', 4));
  // one fluffy cloud
  for (const [x, y, r] of [
    [236, 24, 7],
    [246, 20, 9],
    [258, 24, 7],
    [250, 27, 8],
  ] as const)
    p.disc(x, y, r, c('white', 3));
  p.rect(232, 28, 32, 3, c('white', 3));
  // far hills, hazy blue: bumps 40 pixels apart, so the picture repeats every two blocks; then the flat lawn
  for (let x = 0; x < W; x++) {
    const far = 54 + Math.round(5 * (1 - Math.cos((x / 40) * Math.PI * 2)) * 0.5 * 1.2);
    p.rect(x, far, 1, HORIZON - far, c('blue', 3));
  }
  p.rect(0, HORIZON, W, H - HORIZON, c('grass', 3));
  // the road: asphalt between the slanted edges, white edge lines, white lane lines
  for (let y = HORIZON; y < H; y++) {
    const hw = halfWidth(y);
    const l = Math.round(VX - hw);
    const r = Math.round(VX + hw);
    p.rect(l, y, r - l + 1, 1, c('stone', 1));
    const edge = Math.max(1, Math.round(hw / 28));
    p.rect(l, y, edge, 1, c('white', 3)).rect(r - edge + 1, y, edge, 1, c('white', 3));
    // lane lines, dashed in step with the distance (a dash gets longer as it comes)
    if (hw > 2 && Math.floor(400 / (y - HORIZON + 6)) % 2 === 0)
      for (const side of [-1, 1]) {
        const x = Math.round(dividerX(side, y));
        p.rect(x - Math.max(0, Math.floor(hw / 60)), y, 1 + Math.floor(hw / 40), 1, c('white', 3));
      }
  }
  // the crest: a small rise of lawn where the road meets the hills, so it seems to climb over the top
  p.disc(VX, HORIZON + 3, 5, c('grass', 3));
  return p;
}

/** The finish arch at `stage` (0 far to 3 near): two gold posts and a checkered banner across the road. */
export function drawArch(pal: Pal, p: Pixels, stage: number): Pixels {
  const { c } = pal;
  const feet = ARCH_FEET[stage];
  const hw = Math.round(halfWidth(feet));
  const post = Math.max(1, Math.round(hw / 10));
  const tall = Math.round(8 + hw * 0.55);
  const top = feet - tall;
  const band = Math.max(2, Math.round(hw / 6));
  // posts
  for (const x of [VX - hw, VX + hw])
    p.rect(x - Math.floor(post / 2), top, post + 1, tall, c('gold', 3)).rect(x - Math.floor(post / 2), top, 1, tall, c('gold', 5));
  // the banner: checks the size of the band, red and white
  const sq = Math.max(1, Math.round(band / 2));
  for (let y = 0; y < band; y++)
    for (let x = VX - hw; x <= VX + hw; x++) p.set(x, top + y, Math.floor((x - VX + hw) / sq + Math.floor(y / sq)) % 2 === 0 ? c('red', 2) : c('white', 3));
  p.rect(VX - hw, top + band, 2 * hw + 1, 1, c('ink', 0));
  p.rect(VX - hw, top - 1, 2 * hw + 1, 1, c('ink', 0));
  return p;
}
