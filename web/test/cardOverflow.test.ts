// Synthetic Starter card rasters exercise paper bounds independently of game builds.
import { expect, it } from 'vitest';
import { cardOverflow } from '../packages/tools/src/kit/textfit';

function paper(bottom: number) {
  const pixels = new Uint8Array(320 * 200);
  for (let y = 10; y <= bottom; y++) pixels.fill(1, y * 320 + 20, y * 320 + 301);
  pixels.fill(2, 40 * 320 + 295, 40 * 320 + 305);
  return { name: 'paper', pixels, palette: new Uint8Array(768) };
}

it('detects four pixels of overflow even with a single extended paper column', () => {
  const card = paper(69);
  const overflow = ['text runs past the right edge of its box (4 pixels outside it)'];
  expect(cardOverflow(card)).toEqual(overflow);
  for (let y = 70; y <= 109; y++) card.pixels[y * 320 + 50] = 1;
  expect(cardOverflow(card)).toEqual(overflow);
});

it('skips tall blank paper even with a stroke crossing its edge', () => {
  expect(cardOverflow(paper(109))).toEqual([]);
});
