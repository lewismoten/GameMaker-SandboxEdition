// Plaque placement on the DOS map.
import { expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID, newMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { putCoolSign } from './coolSign';

const pal = new Uint8Array(768);

it('rejects a plaque that would wrap onto the next row without changing the map', () => {
  const map = newMap();
  const before = map.blocks.slice();
  const blocks = [0, 1, 2].map((index) => emptyBlock(index));
  expect(() => putCoolSign(blocks, map, pal, MLEN - 1, 3)).toThrow(/outside the map/);
  expect(map.blocks).toEqual(before);
});

it('preserves the gravity of each covered cell at the last valid placement', () => {
  const map = newMap();
  const left = map.blocks.length - 2;
  map.blocks[left + 1] = 1;
  const blocks = [4, 8, 0, 2].map((grav, index) => ({ ...emptyBlock(index), grav }));
  const decorated = putCoolSign(blocks, map, pal, MLEN - 2, MWID - 1);
  expect([decorated[map.blocks[left]].grav, decorated[map.blocks[left + 1]].grav]).toEqual([4, 8]);
});
