// Check the indexed artwork passed to the canvas for the same map in two games.
import { expect, it, vi } from 'vitest';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameFiles } from '../../project/files';
import * as draw from '../core/draw';
import { fileThumb } from './thumbs';

it('draws an inherited block set from the selected game', () => {
  const files = new GameFiles();
  for (const [i, stem] of ['a', 'b'].entries()) {
    const game = newGame(stem);
    const first = emptyScene(ADVTYPE);
    first.files[2] = stem + '.bbl';
    const second = emptyScene(ADVTYPE);
    second.files[1] = 'next.map';
    game.scenes.push(first, second);
    files.set(stem + '.gam', serializeGame(game));
    const blocks = newBlockSet('bbl');
    blocks[0].pixels.fill(i + 1);
    files.set(stem + '.bbl', serializeBlocks(blocks));
  }
  const map = serializeMap(newMap());
  const paint = vi.spyOn(draw, 'paintIndexed').mockImplementation(() => {});
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({}) }) });
  try {
    for (const [i, gam] of ['a.gam', 'b.gam'].entries()) {
      fileThumb('next.map', map, { files, gam });
      expect(paint.mock.lastCall?.[1][0]).toBe(i + 1);
    }
  } finally {
    vi.unstubAllGlobals();
    paint.mockRestore();
  }
});
