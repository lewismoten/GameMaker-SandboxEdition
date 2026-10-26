// Under the stage: black until the lantern has been there.
import { Pixels } from '../../../kit/pixels';
import { pool } from '../art/draw';
import { c, ramp as r } from '../art/pal';
import { CTR } from '../ids';
import { Add, S, T, on } from './painters';

/** The dark under the stage: the boards are only just there, a faint seam every few feet. */
function dimFloor(seed: number): Pixels {
  const p = T(c('black', 0));
  for (let x = 0; x < 20; x++) p.set(x, 9, c('black', 1)).set(x, 19, c('black', 1));
  for (let y = 0; y < 9; y++) p.set(seed % 2 ? 6 : 13, y, c('black', 1));
  return p;
}

/** A wall in the dark: a dim block of stone, so the way through can be made out before the lantern finds it. */
function dimWall(): Pixels {
  const p = T(c('black', 2));
  for (let y = 4; y < 20; y += 5) for (let x = 0; x < 20; x++) p.set(x, y, c('black', 1));
  return p;
}

export function addUnder(add: Add, LF: Pixels, stairs: Pixels): void {
  // Under the stage: dim until the lantern has been there (it lights each spot Ada walks on).
  add('dark', dimFloor(5), { effect: CTR.lantern, eamt: -1, touch: 'litfloor' });
  add('dark2', dimFloor(6), { effect: CTR.lantern, eamt: -1, touch: 'litfloor2' });
  add('darkwall', dimWall(), { ...S, effect: CTR.lantern, eamt: -1, touch: 'litwall' });
  // the umbrella: a faint glint of its wet black shape, so the far corner reads as somewhere to go
  const glint = dimFloor(5);
  glint.line(5, 15, 15, 5, c('black', 2)).set(14, 6, c('ghost', 0)).set(15, 5, c('ghost', 1));
  add('umb_dark', glint, { effect: CTR.lantern, eamt: -1, touch: 'umbrella' });
  const hole = on(LF, (p) => {
    p.disc(10, 12, 5, c('black', 0));
    p.rect(5, 12, 11, 6, c('black', 0));
  });
  add('rathole', hole, { birthMon: 5, birthTime: 160 });
  const dimHole = dimFloor(5);
  dimHole.disc(10, 12, 5, c('black', 0)).rect(5, 12, 11, 6, c('black', 0)).ring(10, 12, 5, c('black', 2));
  add('rathole_dark', dimHole, { effect: CTR.lantern, eamt: -1, touch: 'rathole', birthMon: 5, birthTime: 160 });
  add(
    'pillar',
    on(LF, (p) => {
      p.rect(4, 0, 12, 20, c('wood', 1)).rect(5, 0, 2, 20, c('wood', 3)).rect(4, 0, 12, 2, c('gray', 2));
    }),
    S,
  );
  const dimPillar = dimFloor(5);
  dimPillar.rect(4, 0, 12, 20, c('black', 2)).rect(5, 0, 2, 20, c('wood', 0));
  add('pillar_dark', dimPillar, { ...S, effect: CTR.lantern, eamt: -1, touch: 'pillar' });
  add(
    'trapstairs',
    on(stairs, (p) => pool(p, 10, 2, 10, 6, r('ghost'), 0, 1)),
  );
}
