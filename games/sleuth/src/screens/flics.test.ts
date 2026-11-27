// Check the sleeve at native resolution with the actor hidden so it cannot fill gaps.
import { expect, it, vi } from 'vitest';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';
import { umbrellaManFli } from './flics';

vi.mock('./art', async (load) => ({
  ...(await load<typeof import('./art')>()),
  actor: () => new Pixels(1, 1, CLEAR),
}));

it('draws a continuous sleeve from the raised glove to the shoulder in frame 17', () => {
  const animation = parseFli(umbrellaManFli());
  const canvas = newFliCanvas(animation);
  for (let frame = 0; frame <= 17; frame++) applyFliFrame(animation, frame, canvas);
  const missing = [];
  for (let y = 73; y <= 112; y++) {
    const row = canvas.pixels.subarray(y * animation.width + 93, y * animation.width + 102);
    if (!row.includes(c('black', 1))) missing.push(y);
  }
  expect(missing).toEqual([]);
});
