// Tiled-sign regression checks: shared art, readable chunks, centered posts and budgets.
import { describe, expect, it } from 'vitest';
import { buildTiledSigns, stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { ORIGIN } from '../../games/kit/starter/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { buildLevels } from '../../games/first-steps/src/levels';
import { CREDITS } from '../../games/first-steps/src/text';

const options = { colors: { background: 0, paper: 1, ink: 2, wood: 3, highlight: 4, shadow: 5 } };

describe('game-wide tiled signs', () => {
  it('reuses chunks across signs and levels, with eight separate frame tiles and one post', () => {
    const { blocks, signs } = buildTiledSigns(
      {
        first: { rows: [['PICK ', 'STARS']] },
        nextLevel: { rows: [['STARS', 'PICK '], ['STARS']] },
      },
      options,
    );
    expect(blocks.size).toBe(12); // eight borders, one post, two chunks and blank padding
    expect(signs.first.board[1][1]).toBe(signs.nextLevel.board[1][2]);
    expect(signs.first.board[1][2]).toBe(signs.nextLevel.board[2][2]);
    expect(signs.first.board[0]).toEqual(signs.nextLevel.board[0]);
    expect(signs.first.post).toEqual(signs.nextLevel.post);
    const bottom = blocks.get(signs.first.board.at(-1)![signs.first.post!.x])!;
    const post = blocks.get(signs.first.post!.block)!;
    expect(bottom.get(9, 19)).toBe(options.colors.shadow);
    expect(post.get(9, 0)).toBe(options.colors.wood);
    for (const [id, p] of blocks) {
      expect([p.w, p.h]).toEqual([20, 20]);
      if (id.includes('letters:')) expect([...p.px].every((c) => c === 1 || c === 2)).toBe(true);
    }
    const star = blocks.get(signs.first.board[1][2])!;
    expect([...star.px].filter((c) => c === 2).length).toBeGreaterThan(20);
  });

  it('stamps exactly one centered post column, including even chunk counts and taller posts', () => {
    for (const row of [['ONE'], ['ONE', 'TWO'], ['ONE', 'TWO', 'THREE']]) {
      const { signs } = buildTiledSigns({ sign: { rows: [row] } }, options);
      const writes: [number, number, string][] = [];
      stampTiledSign({ set: (...cell) => writes.push(cell) }, 10, 20, signs.sign, 2);
      const width = signs.sign.board[0].length;
      expect(width % 2).toBe(1);
      expect(writes.slice(-2)).toEqual([
        [10 + (width - 1) / 2, 23, 'tiledSign.post'],
        [10 + (width - 1) / 2, 24, 'tiledSign.post'],
      ]);
    }
  });

  it('omits posts for wall signs and supports four-letter tiles', () => {
    const { blocks, signs } = buildTiledSigns({ wall: { rows: [['four']], post: false } }, { ...options, lettersPerBlock: 4 });
    expect(signs.wall.post).toBeUndefined();
    expect(blocks.has('tiledSign.post')).toBe(false);
    expect(blocks.has('tiledSign.letters:FOUR')).toBe(true);
  });

  it('rejects overflow, unsupported letters, empty rows and insufficient block budgets', () => {
    expect(() => buildTiledSigns({ a: { rows: [['SIXSIX']] } }, options)).toThrow('exceeds 5');
    expect(() => buildTiledSigns({ a: { rows: [['☃']] } }, options)).toThrow('No tiny sign glyph');
    expect(() => buildTiledSigns({ a: { rows: [] } }, options)).toThrow('nonempty rows');
    expect(() => buildTiledSigns({ a: { rows: [[]] } }, options)).toThrow('nonempty rows');
    expect(() => buildTiledSigns({ a: { rows: [['A']] } }, { ...options, maxBlocks: 9 })).toThrow('budget');
    expect(() => buildTiledSigns({ a: { rows: [['A']] } }, { ...options, maxBlocks: 101 })).toThrow('0 to 100');
  });

  it('keeps First Steps pickups, terrain and doors intact while sharing signs across both levels', () => {
    const { book, levels } = buildLevels();
    // An extra credit page changes the committed walkthrough's running time.
    expect(CREDITS.split('\n')).toHaveLength(32);
    expect(book.index.size).toBeLessThan(55);
    expect([...book.index.keys()].filter((k) => k.startsWith('tiledSign.post'))).toEqual(['tiledSign.post']);
    // Original first-level coins under the wider gravity sign must survive stamping.
    const map = levels[0].map.done();
    const at = (x: number, y: number) => map.blocks[(ORIGIN + y) * MLEN + ORIGIN + x];
    for (const x of [45, 46, 47]) expect(at(x, 6)).toBe(book.n('coin'));
    expect(at(55, 10)).toBe(book.n('doorTop'));
    expect(at(55, 11)).toBe(book.n('doorBottom'));
    for (const level of levels) {
      const cells = level.map.done().blocks;
      expect(cells.filter((n) => n === book.n('coin'))).toHaveLength(level.file === 'walk' ? 14 : 16);
    }
    const climb = levels[1].map.done().blocks;
    expect(climb[(ORIGIN + 13) * MLEN + ORIGIN + 46]).toBe(book.n('doorTop'));
    expect(climb[(ORIGIN + 14) * MLEN + ORIGIN + 46]).toBe(book.n('doorBottom'));
    for (let y = 7; y <= 14; y++) expect(climb[(ORIGIN + y) * MLEN + ORIGIN + 14]).toBe(book.n('ladder'));
  });
});
