// Regression scenes for the color cues advisory.
import { expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { scenesOf } from '../../web/src/editor/check/sceneData';
import { testGame } from '../../web/src/editor/check/testGame';
import { pairsOf } from './colorCues';

function scene() {
  const files = testGame(['E.S']);
  const [d] = scenesOf(files.game, files);
  d.bbl = [emptyBlock(0), emptyBlock(1), emptyBlock(2)];
  d.map.blocks.fill(0);
  d.mon = [];
  return d;
}

it('reports identical key artwork only when the keys affect different counters', () => {
  const d = scene();
  d.map.blocks.set([1, 2]);
  for (const n of [1, 2]) {
    d.bbl[n].pixels.fill(7);
    d.bbl[n].effect = 19 + n;
    d.bbl[n].eamt = 1;
  }
  expect(pairsOf('test', d)).toMatchObject([{ kind: 'key/key', identicalArtwork: true, hueOnly: true }]);
  d.bbl[2].effect = d.bbl[1].effect;
  expect(pairsOf('test', d)).toEqual([]);
});

it('compares a damaging floor with the commonest solid floor', () => {
  const d = scene();
  d.map.blocks[0] = 1;
  for (const block of d.bbl.slice(0, 2)) {
    block.solid = 15;
    block.pixels.fill(7, 0, 150);
  }
  d.bbl[1].pixels[150] = 7;
  d.bbl[1].chHitPt = -1;
  expect(pairsOf('test', d)).toMatchObject([{ kind: 'hurt/floor', a: 'b1', b: 'b0', identicalArtwork: false, hueOnly: true }]);
});
