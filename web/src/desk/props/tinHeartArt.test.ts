// The room's tin heart is drawn from a copy of the kit's (the dev server can't load games/):
// keep the two the same, pixel for pixel, at every frame of its shine.
import { describe, expect, it } from 'vitest';
import { drawTinHeart, SHINE_FRAMES } from '../../../../games/kit/tinHeart';
import { Pixels } from '../../../../games/kit/pixels';
import { tinHeartParts } from './tinHeartArt';

describe('the room’s tin heart', () => {
  it('is the games’ tin heart (games/kit/tinHeart.ts)', () => {
    for (let k = 0; k < SHINE_FRAMES; k++) {
      const kit = drawTinHeart(new Pixels(20, 20, 0), { ink: 1, tin: [2, 3, 4], white: 5, dark: 6 }, k).px;
      expect([...tinHeartParts(k)]).toEqual([...kit]);
    }
  });
});
