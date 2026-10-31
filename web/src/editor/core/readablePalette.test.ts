// The readable-palette choice and the saved palette pick round trip.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { Project } from './project';
import { darkShare, isTooDark, mostReadable } from './readablePalette';
import { parseCompanion, serializeCompanion } from '../../project/companion';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { PALETTE_SIZE } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

const pal = (rgb: [number, number, number]): Uint8Array => {
  const p = new Uint8Array(PALETTE_SIZE);
  for (let i = 0; i < 256; i++) p.set(rgb, i * 3);
  return p;
};
const used = new Uint8Array([1, 2, 3, 3, 0, 255]);

describe('readable palette', () => {
  it('counts near-black used colors and ignores see-through ones', () => {
    expect(darkShare(pal([0, 0, 0]), used)).toBe(1);
    expect(darkShare(pal([40, 40, 40]), used)).toBe(0);
    expect(isTooDark(pal([2, 2, 2]), used)).toBe(true);
    expect(darkShare(pal([0, 0, 0]), new Uint8Array([0, 255]))).toBe(0);
  });
  it('picks the first readable candidate, else the least dark, else the first', () => {
    expect(mostReadable([pal([0, 0, 0]), pal([40, 30, 20])], used)).toBe(1);
    expect(mostReadable([pal([40, 30, 20]), pal([0, 0, 0])], used)).toBe(0);
    const half = pal([0, 0, 0]);
    half.set([40, 40, 40], 3);
    expect(mostReadable([pal([0, 0, 0]), half], new Uint8Array([1, 2]))).toBe(1);
    expect(mostReadable([], used)).toBe(0);
  });
  it('paletteFor skips a dark .pal when the sprite colors are known', () => {
    const game = newGame('T');
    const files = new GameFiles([
      ['t.gam', serializeGame(game)],
      ['a.pal', pal([0, 0, 0])],
      ['b.pal', pal([40, 30, 20])],
    ]);
    const p = Project.fromFiles(files);
    expect(p.paletteFor('x.cbl').source).toBe('a.pal');
    expect(p.paletteFor('x.cbl', used).source).toBe('b.pal');
  });
  it('keeps the pick in the companion and restores it after a round trip', () => {
    const p = Project.fromFiles(new GameFiles([['t.gam', serializeGame(newGame('T'))]]));
    p.setExtras('hero.cbl', 'showPalette', 'b.pal');
    const back = parseCompanion(serializeCompanion(p.companion!));
    const q = Project.fromFiles(new GameFiles([['t.gam', serializeGame(newGame('T'))]]), undefined, 'id2', back);
    expect(q.extras('hero.cbl', 'showPalette', '')).toBe('b.pal');
  });
});
