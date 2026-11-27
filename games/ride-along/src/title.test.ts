// Check the stars against the pixels players see on the title screen.
import { expect, it } from 'vitest';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { buildStarterPalette } from '../../kit/starter/palette';
import { addSpaceRamp, starSprite } from './rideBlocks';
import { titlePicture } from './title';

it('draws four complete stars in a level row', () => {
  const pal = buildStarterPalette(addSpaceRamp, 'ride-along');
  const title = titlePicture(pal, new Pixels(1, 1, 255), 'RIDE ALONG', 'A STARTER GAME');
  const star = starSprite(pal);
  for (const left of [98, 128, 158, 188]) {
    for (let y = 0; y < star.h; y++) {
      for (let x = 0; x < star.w; x++) {
        const color = star.get(x, y);
        if (color !== 255) expect(title.get(left + x, 74 + y), `pixel at ${left + x}, ${74 + y}`).toBe(color);
      }
    }
  }
});
