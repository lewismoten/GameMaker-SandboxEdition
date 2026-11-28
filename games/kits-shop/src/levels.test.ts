// Regression checks for the shop facade as painted on the level.
import { expect, it } from 'vitest';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from './levels';

it('tiles the continuous striped awning with one block', () => {
  const { levels } = buildLevels();
  const start = (ORIGIN + 3) * MLEN + ORIGIN + 24;
  const awning = levels[0].map.map.blocks.slice(start, start + 27);
  expect(new Set(awning).size).toBe(1);
});
