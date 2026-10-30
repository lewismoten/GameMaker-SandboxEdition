// Regression corpus for the CD characters reported as wrong, black, or emoji-only in the asset picker.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { characterPicture } from '../src/editor/widgets/characterPicture';
import { CHARBL, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

const root = new URL('../../cd/gameware/', import.meta.url);
const cases = [
  ['bcuda', 'bship'],
  ['bcuda', 'sub'],
  ['bcuda', 'subdiver'],
  ['bcuda', 'subintro'],
  ['donut', 'donut'],
  ['glub', 'glub'],
  ['heart', 'heart'],
  ['houses', 'heroine'],
  ['library', 'heroine'],
  ['nebula', 'star'],
  ['nebula', 'starspac'],
  ['penguin', 'penguin'],
  ['pipemare', 'pipes'],
  ['tutor', 'penguin'],
  ['tutor', 'pipes'],
  ['volume', 'bus'],
  ['volume', 'ship'],
  ['warrior', 'title'],
  ['warrior', 'wwar1'],
  ['warrior', 'wwar2'],
  ['warrior', 'wwar3'],
  ['warrior', 'wwopen'],
  ['zark', 'zark'],
];
function source(game: string) {
  const dir = new URL(`${game}/`, root);
  const names = readdirSync(dir);
  const paths = new Map(names.map((name) => [name.toLowerCase(), new URL(name, dir)]));
  return {
    names: () => names,
    get: (name: string | undefined) => {
      const path = name && paths.get(name.toLowerCase());
      return path ? new Uint8Array(readFileSync(path)) : undefined;
    },
  };
}

describe.skipIf(!existsSync(root))('CD character previews', () => {
  it.each(cases)('%s/%s uses actual character pixels', (game, name) => {
    const picture = characterPicture(source(game), `${name}.chr`);
    expect(picture).toBeDefined();
    expect(picture!.width).toBe(20);
    expect([20, 40]).toContain(picture!.height);
    expect(picture!.pixels.some((pixel) => pixel !== 255)).toBe(true);
  });

  it('uses the actual WWAR2 blocks and the Library HEROINE pair', () => {
    for (const [game, name, top, bottom] of [
      ['warrior', 'wwar2', 37, 38],
      ['library', 'heroine', 4, 5],
    ] as const) {
      const files = source(game);
      const blocks = parseBlocks(files.get(`${name}.cbl`)!, CHARBL);
      const picture = characterPicture(files, `${name}.chr`)!;
      expect(picture.pixels.slice(0, 400)).toEqual(blocks[top].pixels);
      expect(picture.pixels.slice(400, 800)).toEqual(blocks[bottom].pixels);
    }
  });
});
