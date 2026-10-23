// Every text PLAYGAME draws over a Sandbox game's pictures lands on plain paper
// (games/kit/textfit.ts): text pages, the menu, the high scores, load and save.
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { checkTextScreen, readDisk, textScreens, W, H, type TextScreen } from '../../games/kit/textfit';

const GAMES = ['blaster', 'logic', 'maximus', 'sandcast', 'sleuth', 'snowbound', 'teddy'];

describe('text fit', () => {
  it('flags art under a line and low contrast', () => {
    const palette = new Uint8Array(768);
    palette.set([63, 63, 60], 3); // 1: paper
    palette.set([0, 0, 0], 6); // 2: a border
    palette.set([50, 10, 50], 9); // 3: purple ink
    const pixels = new Uint8Array(W * H).fill(1);
    const s: TextScreen = { name: 't', kind: 'page', pixels, palette, texts: [{ x: 40, y: 40, col: 3, text: 'HELLO' }] };
    expect(checkTextScreen(s)).toEqual([]);
    for (let x = 0; x < W; x++) pixels[47 * W + x] = 2;
    expect(checkTextScreen(s)[0].problems[0]).toMatch(/art pixels/);
    pixels.fill(1);
    palette.set([60, 58, 60], 9);
    expect(checkTextScreen(s)[0].problems[0]).toMatch(/contrast/);
  });

  for (const id of GAMES)
    it(`${id}: no text over art`, () => {
      const screens = textScreens(readDisk(join(__dirname, '..', '..', 'games', id, 'disk')));
      expect(screens.length).toBeGreaterThan(5);
      expect(screens.flatMap((s) => checkTextScreen(s)).map((i) => `${i.screen} "${i.text}": ${i.problems.join(', ')}`)).toEqual([]);
    });
});
