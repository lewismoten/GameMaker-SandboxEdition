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
  for (let i = 0; i < 255; i++) p.set(rgb, i * 3);
  p.set([63, 0, 63], 255 * 3); // the see-through color, so the palette is not one solid color
  return p;
};
const dim = pal([1, 1, 1]);
dim.set([3, 3, 3], 3);
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
  it('paletteFor skips a solid-color .pal and prefers the palette scenes use most', () => {
    const game = newGame('T');
    game.scenes[0].files[0] = 'c.pal';
    const files = new GameFiles([
      ['t.gam', serializeGame(game)],
      ['a.pal', new Uint8Array(PALETTE_SIZE)],
      ['b.pal', dim],
      ['c.pal', pal([40, 30, 20])],
    ]);
    expect(Project.fromFiles(files).paletteFor('x.cbl').source).toBe('c.pal');
    files.delete('c.pal');
    expect(Project.fromFiles(files).paletteFor('x.cbl').source).toBe('b.pal');
  });
  it('paletteFor skips a dark .pal when the sprite colors are known', () => {
    const game = newGame('T');
    const files = new GameFiles([
      ['t.gam', serializeGame(game)],
      ['a.pal', dim],
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

describe('which palette a preview of a file uses', () => {
  const build = () => {
    const game = newGame('T');
    const adv = (pal: string, ...rest: string[]) => {
      const s = newGame('T').scenes[0];
      s.gametype = 10;
      s.files = [pal, 'm.map', 'b.bbl', ...rest];
      game.scenes.push(s);
    };
    adv('x.pal');
    adv('y.pal');
    adv('y.pal');
    const files = new GameFiles([
      ['t.gam', serializeGame(game)],
      ['x.pal', pal([40, 30, 20])],
      ['y.pal', pal([10, 50, 20])],
      ['z.pal', pal([60, 60, 20])],
      ['m.map', new Uint8Array(4)],
      ['b.bbl', new Uint8Array(4)],
    ]);
    return Project.fromFiles(files);
  };
  it('takes the palette most of the scenes using the file use', () => {
    expect(build().paletteFor('b.bbl').source).toBe('y.pal');
  });
  it('a file no scene uses gets a usable palette, never a solid one', () => {
    expect(build().paletteFor('lonely.bbl').source).not.toBe('');
    expect(isTooDark(build().paletteFor('lonely.bbl').palette, new Uint8Array([1, 2, 3]))).toBe(false);
  });
  it('a tile shows the saved pick, a map follows its block set, and a vanished .pal falls back', () => {
    const p = build();
    const scene = p.paletteFor('b.bbl').palette;
    expect(p.shownPalette('b.bbl')).toEqual(scene);
    p.setExtras('b.bbl', 'showPalette', 'z.pal');
    const z = p.palette('z.pal');
    expect(p.shownPalette('b.bbl')).toEqual(z);
    expect(p.shownPalette('m.map')).toEqual(z);
    expect(p.shownPalette('other.cbl')).not.toEqual(z);
    p.files.delete('z.pal');
    expect(p.shownPalette('b.bbl')).toEqual(scene);
  });
});

describe('a sprite used in scenes with several palettes', () => {
  it('skips a scene palette that would show it dark on dark when its colors are known', () => {
    const game = newGame('T');
    for (const pn of ['a.pal', 'a.pal', 'b.pal']) {
      const s = newGame('T').scenes[0];
      s.gametype = 10;
      s.files = [pn, 'm.map', 'b.bbl', '', 'x.cbl'];
      game.scenes.push(s);
    }
    const p = Project.fromFiles(
      new GameFiles([
        ['t.gam', serializeGame(game)],
        ['a.pal', dim],
        ['b.pal', pal([40, 30, 20])],
      ]),
    );
    expect(p.paletteFor('x.cbl').source).toBe('a.pal');
    expect(p.paletteFor('x.cbl', used).source).toBe('b.pal');
  });
});
