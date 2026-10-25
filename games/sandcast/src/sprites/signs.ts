// The two little wooden signs by the start of the sandbox, which teach the keys the game
// needs first: G picks up what Teddy stands on, and Space flings sand once he has the shovel.
// Every background block is taken, so each sign is a row of monster blocks (a stationary,
// harmless monster for each block, MON.sign in monsters.ts) lying in the sand.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { textInk } from '../../../kit/textBounds';
import { STEEL, WOOD } from '../art/palette';
import { CLEAR, Pixels } from '../art/draw';
import { mb } from './monsterBlocks';

/** Each sign: its name, its width in blocks and its two lines. */
export const SIGNS = [
  { name: 'signG', blocks: 5, lines: ['STAND ON IT', 'AND PRESS G'] },
  { name: 'signSpace', blocks: 8, lines: ['GRAB THE SHOVEL:', 'SPACE FLINGS SAND'] },
] as const;

/** A board `blocks` wide and one block tall, its lines centered in the PC font. */
function board(blocks: number, lines: readonly string[]): Pixels {
  const w = blocks * 20;
  const p = new Pixels(w, 20, CLEAR);
  p.rect(1, 1, w - 2, 18, WOOD[1]).rect(2, 2, w - 4, 16, WOOD[5]);
  // grain, and a nail at each end
  for (let x = 4; x < w - 4; x += 7) p.set(x, 5 + (x % 3), WOOD[4]);
  p.set(3, 9, STEEL[2]).set(w - 4, 9, STEEL[2]);
  lines.forEach((s, row) => {
    const x0 = Math.floor((w - s.length * 8) / 2);
    const y0 = 2 + row * 8;
    const ink = textInk(p, s, [2, 2, w - 2, 18]);
    [...s].forEach((ch, i) => {
      const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
      for (let gy = 0; gy < 8; gy++)
        for (let gx = 0; gx < 8; gx++)
          if (g[gy] & (1 << gx)) {
            p.set(x0 + i * 8 + gx, y0 + gy, WOOD[0]);
            ink?.add(x0 + i * 8 + gx, y0 + gy, 1, 1);
          }
    });
    ink?.end();
  });
  return p;
}

for (const { name, blocks, lines } of SIGNS) {
  const p = board(blocks, lines);
  for (let i = 0; i < blocks; i++) mb.add(`${name}${i}`, p.crop(i * 20, 0, 20, 20));
}
