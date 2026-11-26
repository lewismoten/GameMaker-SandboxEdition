// Baked card text must stay inside the Starter parchment.
import { expect, it } from 'vitest';
import { cardOverflow } from '@lewismoten/gamemaker-sandbox-tools/kit/textfit';

it('detects a stroke crossing the parchment on the first text row', () => {
  const pixels = new Uint8Array(320 * 200);
  for (let y = 12; y < 72; y++) pixels.fill(1, y * 320 + 20, y * 320 + 300);
  pixels.fill(2, 18 * 320 + 294, 18 * 320 + 305);
  expect(cardOverflow({ name: 'Starter card', pixels, palette: new Uint8Array(768) })).toEqual([
    'text runs past the right edge of its box (5 pixels outside it)',
  ]);
});
