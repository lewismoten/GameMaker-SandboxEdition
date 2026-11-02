// Score pop-ups: a pickup that, when touched, shows its points ("+250") for a moment before it
// turns into what it leaves behind. Drawn in a 3x5 font over the block's own picture; no monsters.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Kit } from './common';

/** The glyphs "+0123456789", 3 wide and 5 tall, row by row. */
const GLYPHS: Record<string, string> = {
  '+': '000010111010000',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001111001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001111',
};
/** Ticks a pop-up shows. */
export const POP_TICKS = 14;

/** Draws "+points" with an ink edge at the top of `p` (up to five characters fit a block). */
export function drawPoints(k: Kit, p: Pixels, points: number, y = 1): Pixels {
  const text = `+${points}`;
  const x0 = Math.floor((20 - (text.length * 4 - 1)) / 2);
  const ink = k.c('ink', 0);
  const gold = k.c('yellow', 3);
  for (const pass of [0, 1])
    [...text].forEach((ch, i) =>
      [...GLYPHS[ch]].forEach((bit, j) => {
        if (bit !== '1') return;
        const gx = x0 + i * 4 + (j % 3);
        const gy = y + Math.floor(j / 3);
        if (pass === 0)
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ])
            p.set(gx + dx, gy + dy, ink);
        else p.set(gx, gy, gold);
      }),
    );
  return p;
}
