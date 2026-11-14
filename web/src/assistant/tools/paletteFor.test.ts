// The Assistant's render tools pick a file's palette the way the editor does (project/scenePalette.ts).
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { paletteFor } from './common';
import type { GameContext } from './types';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { PALETTE_SIZE } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

const pal = (r: number): Uint8Array => {
  const p = new Uint8Array(PALETTE_SIZE);
  for (let i = 0; i < 255; i++) p.set([r, 30, 20], i * 3);
  p.set([63, 0, 63], 255 * 3);
  return p;
};
const ctxOf = (files: GameFiles): GameContext => ({ files, gam: 't.gam' }) as unknown as GameContext;

describe('assistant paletteFor', () => {
  it('a file shared by scenes with different palettes uses the most-used one', () => {
    const game = newGame('T');
    game.scenes = [0, 1, 2].map(() => structuredClone(game.scenes[0]));
    game.scenes.forEach((s, i) => {
      s.gametype = 10;
      s.files[0] = i === 0 ? 'a.pal' : 'b.pal';
      s.files[2] = 'x.bbl';
    });
    const files = new GameFiles([
      ['t.gam', serializeGame(game)],
      ['a.pal', pal(10)],
      ['b.pal', pal(40)],
    ]);
    expect([...paletteFor(ctxOf(files), 'x.bbl').subarray(0, 3)]).toEqual([40, 30, 20]);
  });
  it('the fallback is never a solid palette while another exists', () => {
    const files = new GameFiles([
      ['t.gam', serializeGame(newGame('T'))],
      ['a.pal', new Uint8Array(PALETTE_SIZE)],
      ['b.pal', pal(40)],
    ]);
    expect([...paletteFor(ctxOf(files), 'x.cbl').subarray(0, 3)]).toEqual([40, 30, 20]);
  });
});
