// plant.bbl: chapter 11, the tall plant, seen from the side, where gravity pulls down: the night
// sky getting darker and starrier the higher it goes, the great green stalk the mustard seed
// grew, its leaves (some steady, some that unfurl and fold up again on their own clocks, a
// little yellow at the tip before they fold), dandelion puffs drifting (a puff fills the heart
// balloon's air), the curled top leaf where the seed waits (it uncurls once the star is free),
// the star caught in the leaves, and the garden soil at the foot.
import { SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { gradient } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR } from '../ids';
import { AIR_SEQ, PUFF } from '../characters';
import { seed } from '../sprites/guests';
import { addKeepsakes } from './keepsakes';
import { BlockSet, GRAV, SOLID } from './sets';
import { on } from './tiles';

const DOWN = GRAV.s;

/** The night sky at height band `band` (0 the top: darkest, most stars). */
function sky(band: number, seed: number): Pixels {
  const p = new Pixels(20, 20);
  gradient(p, 0, 0, 20, 20, r('sky'), Math.max(0, band * 0.5 - 0.5), band * 0.5);
  const R = rng(seed);
  const n = Math.max(0, 5 - band);
  for (let i = 0; i < n; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c(R() < 0.3 ? 'yellow' : 'paper', 4));
  return p;
}

/** The stalk: a thick green stem, lit on one side. */
function stalk(band: number): Pixels {
  const p = sky(band, 40 + band);
  p.rect(6, 0, 8, 20, c('leaf', 1)).rect(7, 0, 5, 20, c('leaf', 2)).rect(8, 0, 2, 20, c('leaf', 3));
  for (let y = 3; y < 20; y += 7) p.rect(6, y, 8, 1, c('leaf', 0));
  return p;
}

/** A leaf off the stalk, flat on top: open, about to fold (yellowing at the tip), or folded up out of the way. */
function leaf(state: 'open' | 'warn' | 'folded', band: number, flip: boolean): Pixels {
  const p = sky(band, 60 + band);
  if (state === 'folded') {
    const x0 = flip ? 16 : 1;
    p.rect(x0, 2, 3, 14, c('leaf', 1)).rect(x0 + 1, 2, 1, 14, c('leaf', 3));
    return p;
  }
  for (let x = 0; x < 20; x++) {
    const d = flip ? 19 - x : x;
    const t = Math.round(3 - Math.abs(d - 9) / 4);
    p.rect(x, 0, 1, 4 + t, c('leaf', state === 'warn' && d > 13 ? 4 : 2));
    p.set(x, 0, c('leaf', state === 'warn' && d > 13 ? 4 : 3));
  }
  if (state === 'warn') for (let x = flip ? 0 : 14; x < (flip ? 6 : 20); x++) p.set(x, 1, c('yellow', 3));
  p.rect(0, 4, 20, 1, c('leaf', 0));
  return p;
}

/** A dandelion puff drifting: touch it and its air goes into the heart balloon. */
function puff(band: number, frame: number): Pixels {
  const p = sky(band, 80 + band);
  p.disc(10, 10, 6, c('paper', 2)).disc(10, 10, 5, c('paper', 4));
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6 + frame * 0.3;
    p.set(Math.round(10 + Math.cos(a) * 7), Math.round(10 + Math.sin(a) * 7), c('paper', 4));
  }
  p.disc(10, 10, 1.5, c('brass', 2)).line(10, 12, 10, 19, c('leaf', 2));
  return p;
}

/** The star caught in the top leaves: it wants to go home to the sky. */
function star(band: number, free: boolean): Pixels {
  const p = sky(band, 90);
  if (free) {
    for (const [x, y] of [
      [4, 4],
      [15, 6],
      [9, 15],
    ])
      p.set(x, y, c('yellow', 3));
    return p;
  }
  p.rect(0, 14, 20, 3, c('leaf', 2));
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    p.line(10, 9, Math.round(10 + Math.cos(a) * 7), Math.round(9 + Math.sin(a) * 7), c('yellow', 3));
  }
  p.disc(10, 9, 3, c('yellow', 3)).disc(9, 8, 1, c('paper', 4));
  return p;
}

/** The top leaf, curled up round the seed until the star is free, then uncurled. */
function curl(open: boolean, band: number): Pixels {
  const p = sky(band, 95);
  if (open) return p.rect(0, 16, 20, 3, c('leaf', 2)).rect(0, 16, 20, 1, c('leaf', 3));
  p.ring(10, 10, 8, c('leaf', 2)).ring(10, 10, 7, c('leaf', 1)).rect(0, 16, 20, 3, c('leaf', 2));
  return p;
}

function soil(top: boolean): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  const R = rng(top ? 5 : 6);
  p.map((_x, _y, v) => (R() < 0.25 ? c('wood', 0) : v));
  if (top) p.rect(0, 0, 20, 4, c('grass', 2));
  return p;
}

/** Stamp drawing helpers for the map: the band (0..4) a row is in. */
export const band = (row: number, height: number) => Math.min(4, Math.floor((row / height) * 5));

export function plantSet(): BlockSet {
  const s = new BlockSet(150, false);
  for (let b = 0; b < 5; b++) {
    s.add(`sky${b}`, sky(b, b + 1), { grav: DOWN });
    s.add(`stalk${b}`, stalk(b), { grav: DOWN });
    // steady leaves, left and right of the stalk
    s.add(`leaf${b}`, leaf('open', b, false), { solid: SOLTOP, grav: DOWN });
    s.add(`leafR${b}`, leaf('open', b, true), { solid: SOLTOP, grav: DOWN });
    // leaves on clocks: the A leaves fold while the B leaves are open, and back
    s.add(`leafA${b}`, leaf('open', b, false), { solid: SOLTOP, grav: DOWN, next: `leafAwarn${b}`, ntime: 40 });
    s.add(`leafAwarn${b}`, leaf('warn', b, false), { solid: SOLTOP, grav: DOWN, next: `leafAfold${b}`, ntime: 14 });
    s.add(`leafAfold${b}`, leaf('folded', b, false), { grav: DOWN, next: `leafA${b}`, ntime: 40 });
    s.add(`leafBfold${b}`, leaf('folded', b, true), { grav: DOWN, next: `leafB${b}`, ntime: 40 });
    s.add(`leafB${b}`, leaf('open', b, true), { solid: SOLTOP, grav: DOWN, next: `leafBwarn${b}`, ntime: 40 });
    s.add(`leafBwarn${b}`, leaf('warn', b, true), { solid: SOLTOP, grav: DOWN, next: `leafBfold${b}`, ntime: 14 });
    // dandelion puffs: the heart balloon's air
    s.add(`puff${b}`, puff(b, 0), { grav: DOWN, effect: AIR_SEQ, eamt: PUFF, score: 25, touch: `sky${b}` });
  }
  s.add('star', star(0, false), { grav: DOWN, effect: CTR.task, eamt: 1, score: 500, touch: 'starFree' });
  s.add('starFree', star(0, true), { grav: DOWN });
  s.add('curlOpen', curl(true, 0), { grav: DOWN });
  s.add('curl', curl(false, 0), { solid: SOLID, grav: DOWN, effect: CTR.task, eamt: -1, touch: 'curlOpen' });
  s.add('seedGlad', on(sky(0, 3), seed('joy', 'sprout')), { grav: DOWN });
  s.add('edge', sky(0, 9), { solid: SOLID });
  s.add('soil', soil(true), { solid: SOLID });
  // a patch of dandelions gone to seed at the foot: walking through it always fills the balloon
  const patch = sky(4, 33);
  for (let x = 2; x < 20; x += 5) patch.rect(x, 9, 1, 11, c('leaf', 2)).disc(x, 7, 3, c('paper', 4)).disc(x, 7, 1, c('brass', 2));
  s.add('patch', patch, { grav: DOWN, effect: AIR_SEQ, eamt: PUFF });
  s.add('soil2', soil(false), { solid: SOLID });
  addKeepsakes(s, sky(4, 5), 'sky4');
  return s;
}
