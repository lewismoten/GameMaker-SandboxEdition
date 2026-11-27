// The editor opens lesson targets in world coordinates.
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { expect, it } from 'vitest';
import manual from './manual.json';
import { buildLevels } from './src/levels';

const { book, levels } = buildLevels();
const maps = levels.map((level) => level.map.done());

it.each([
  ['start', 2, 'post'],
  ['pit', 2, 'sky'],
  ['ladder', 3, 'ladder'],
  ['planks', 3, 'plank'],
  ['blocks', 3, 'dirt'],
  ['back', 2, 'post'],
] as const)('opens the %s lesson on its map feature', (id, scene, block) => {
  const target = manual.howDoI.find((lesson) => lesson.id === id)!;
  expect(target.scene).toBe(scene);
  expect(maps[scene - 2].blocks[target.y * MLEN + target.x]).toBe(book.n(block));
});
