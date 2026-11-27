// The bakery reveal makes the lightest night and sky shades identical on disk.
import { newMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { expect, it } from 'vitest';
import { Book, SOLID } from '../../kit/starter/book';
import { invisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildNoodlePalette, lookOf } from '../src/palette';

it('finds a night-colored wall only when the scene makes it sky-colored', () => {
  const pal = buildNoodlePalette();
  const book = new Book('bbl');
  book.add('sky', new Pixels(20, 20, pal.c('sky', 5)));
  const wall = book.add('wall', new Pixels(20, 20, pal.c('night', 4)), { solid: SOLID });
  const map = newMap();
  map.blocks.fill(0);
  map.blocks[1010] = wall;
  const maps = [{ name: 'bakery', map }];
  const blocks = book.finish();
  expect(invisibleWalls(book, blocks, pal, maps)).toEqual([]);
  expect(invisibleWalls(book, blocks, { ...pal, pal: lookOf(pal, 'reveal') }, maps)).toHaveLength(1);
});
