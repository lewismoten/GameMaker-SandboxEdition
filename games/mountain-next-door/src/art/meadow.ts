// The low meadow of GATHERING MIST as 20x20 blocks: the damp air inside a dell, a bead of Wisp's mist to take, and the
// mist steps that stack themselves up the dell's wall (a step is solid cloud, thins, goes, and comes back).
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';
import { clear, inked } from './land';

/** The air inside a dell: sky with a faint haze, so a hole in the ground does not read as open sky. */
export function dellAir(pal: Pal): Pixels {
  const p = clear(pal);
  const f = pal.r('fog');
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x * 3 + y * 2) % 7 === 0 && y % 2 === 0) p.set(x, y, f[1]);
  return p;
}

/** A bead of mist: a little cloud-puff of damp (three lumps on a flat base) with two sparkles beside it, so it reads as Wisp's. */
export function bead(pal: Pal, inDell = false): Pixels {
  const p = clear(pal);
  const f = pal.r('fog');
  const w = pal.r('water');
  p.disc(6, 13, 3, f[2]).disc(11, 11, 4, f[2]).disc(15, 13, 3, f[2]).rect(4, 13, 13, 4, f[2]);
  p.disc(10, 10, 2, f[3]).rect(5, 14, 6, 1, f[3]).rect(5, 16, 12, 1, w[3]);
  const white = pal.c('white', 3);
  p.set(3, 4, white).set(2, 5, f[3]).set(4, 5, f[3]).set(3, 6, f[3]);
  p.set(16, 2, white).set(15, 3, f[3]).set(17, 3, f[3]).set(16, 4, f[3]);
  const out = inked(pal, p);
  return inDell ? dellAir(pal).blit(out, 0, 0, skyOf(pal)) : out;
}

/** A mist step: `up` is solid cloud to stand on, `half` is thinning, `gone` is a few drifting beads of damp. */
export function mistStep(pal: Pal, how: 'up' | 'half' | 'gone'): Pixels {
  const p = how === 'up' ? clear(pal) : dellAir(pal);
  const f = pal.r('fog');
  const w = pal.r('water');
  if (how === 'up') {
    p.disc(5, 5, 4, f[2]).disc(11, 3, 5, f[2]).disc(16, 5, 4, f[2]).rect(2, 5, 16, 5, f[2]);
    p.disc(10, 3, 3, f[3]).disc(5, 4, 2, f[3]).rect(4, 9, 12, 1, w[3]);
    p.rect(3, 8, 3, 1, f[1]).rect(12, 7, 3, 1, f[1]);
    return dellAir(pal).blit(inked(pal, p), 0, 0, skyOf(pal));
  }
  if (how === 'half') {
    p.rect(3, 4, 14, 3, f[1]).rect(5, 3, 9, 1, f[2]);
    for (let x = 3; x < 17; x += 3) p.set(x, 7, f[2]);
    return p;
  }
  for (const [x, y] of [
    [4, 5],
    [9, 4],
    [14, 6],
    [11, 8],
  ])
    p.set(x, y, f[2]).set(x + 1, y, f[1]);
  return p;
}
