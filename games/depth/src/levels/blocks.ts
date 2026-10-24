// A level's two block sets and its palette: lay the level out (which makes the blocks it
// needs), render every block in both planes, pick the level's colors and dither them in.
import type { Block } from '../../../../web/src/formats/blocks';
import { levelPalette } from '../art/palette';
import { toBytes } from '../render/image';
import type { Col } from '../render/quant';
import { TileBook } from '../tiles/book';
import { PLANES, type Plane } from '../tiles/cells';
import { rulesFor } from '../tiles/rules';
import type { Behavior } from '../tiles/book';
import { buildLevel, type BuiltLevel } from './map';
import { isHidden, overlayHidden, pinHidden } from './hidden';
import type { Level } from './levels';

export interface LevelSet {
  level: Level;
  built: BuiltLevel;
  book: TileBook;
  blocks: Record<Plane, Block[]>;
  pal: Uint8Array;
}

export function buildLevelSet(
  level: Level,
  spriteColors: Col[],
  extra?: (kind: string, plane: Plane, part: number) => Behavior | undefined,
  prepare?: (book: TileBook) => void,
): LevelSet {
  const book = new TileBook(level.theme, rulesFor({ level: level.n, extra }));
  pinHidden(book);
  prepare?.(book);
  const built = buildLevel(book, level);
  const blocks = { near: book.blocks('near'), far: book.blocks('far') };
  const pics = book.renderAll(level.n * 1000);
  const bytes: Uint8Array[] = [];
  for (const p of PLANES) pics[p].forEach((pic, n) => pic && !isHidden(book, n) && bytes.push(toBytes(pic)));
  const { pal, matcher } = levelPalette(spriteColors, bytes);
  for (const p of PLANES)
    pics[p].forEach((pic, n) => {
      if (pic) blocks[p][n].pixels = matcher.ordered(toBytes(pic), 20, 20, 9);
    });
  overlayHidden(book, blocks, pal, matcher);
  return { level, built, book, blocks, pal };
}
