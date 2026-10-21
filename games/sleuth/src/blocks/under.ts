// Under the stage: black until the lantern has been there.
import { Pixels } from '../../../kit/pixels';
import { pool } from '../art/draw';
import { c, ramp as r } from '../art/pal';
import { CTR } from '../ids';
import { Add, S, T, on } from './painters';

export function addUnder(add: Add, LF: Pixels, stairs: Pixels): void {
  // Under the stage: black until the lantern has been there.
  add('dark', T(0), { effect: CTR.lantern, eamt: -1, touch: 'litfloor' });
  add('dark2', T(0), { effect: CTR.lantern, eamt: -1, touch: 'litfloor2' });
  add('darkwall', T(0), { ...S, effect: CTR.lantern, eamt: -1, touch: 'litwall' });
  add('umb_dark', T(0), { effect: CTR.lantern, eamt: -1, touch: 'umbrella' });
  const hole = on(LF, (p) => {
    p.disc(10, 12, 5, c('black', 0));
    p.rect(5, 12, 11, 6, c('black', 0));
  });
  add('rathole', hole, { birthMon: 5, birthTime: 160 });
  add('rathole_dark', T(0), { effect: CTR.lantern, eamt: -1, touch: 'rathole', birthMon: 5, birthTime: 160 });
  add(
    'pillar',
    on(LF, (p) => {
      p.rect(4, 0, 12, 20, c('wood', 1)).rect(5, 0, 2, 20, c('wood', 3)).rect(4, 0, 12, 2, c('grey', 2));
    }),
    S,
  );
  add('pillar_dark', T(0), { ...S, effect: CTR.lantern, eamt: -1, touch: 'pillar' });
  add(
    'trapstairs',
    on(stairs, (p) => pool(p, 10, 2, 10, 6, r('ghost'), 0, 1)),
  );
}
