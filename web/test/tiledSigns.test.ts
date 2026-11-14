// Tiled-sign regression checks: shared art, readable chunks, centered posts and budgets.
import { describe, expect, it } from 'vitest';
import { buildTiledSigns, stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { ORIGIN } from '../../games/kit/starter/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { buildLevels } from '../../games/first-steps/src/levels';
import { CREDITS } from '../../games/first-steps/src/text';

const options = { colors: { background: 0, paper: 1, ink: 2, wood: 3, highlight: 4, shadow: 5 } };

describe('game-wide tiled signs', () => {
  it('shares repeated rendered letters, borders/corners and one post across levels', () => {
    const { blocks, signs } = buildTiledSigns(
      { first: { rows: [['PICK STARS']] }, nextLevel: { rows: [['PICK ', 'STARS']] }, other: { rows: [['EXIT >']] } },
      options,
    );
    expect(signs.first).toEqual(signs.nextLevel);
    expect(signs.first.board).toHaveLength(1);
    expect(signs.first.board[0][0]).toBe(signs.other.board[0][0]);
    expect(signs.first.board[0].at(-1)).toBe(signs.other.board[0].at(-1));
    expect(signs.first.post).toEqual(signs.other.post);
    expect([...blocks.keys()].filter((k) => k.endsWith('.post'))).toHaveLength(1);
    expect(new Set([...blocks.values()].map((p) => p.px.join(','))).size).toBe(blocks.size);
    for (const p of blocks.values()) expect([p.w, p.h]).toEqual([20, 20]);
  });

  it('packs letters across tile boundaries with single spaces and centers each line', () => {
    for (const count of [3, 4, 5] as const) {
      const { blocks, signs } = buildTiledSigns(
        { packed: { rows: [['GRAVITY PULLS YOU DOWN'], ['EXIT >']] }, chunks: { rows: [['GRAVI', 'TY   ', 'PULLS', ' YOU ', ' DOWN'], ['EXIT >']] } },
        { ...options, lettersPerBlock: count },
      );
      expect(signs.packed).toEqual(signs.chunks);
      const board = signs.packed.board;
      expect(board).toHaveLength(2);
      const pitch = count === 3 ? 6 : count === 4 ? 5 : 4;
      const glyphWidth = count === 3 ? 5 : 3;
      const glyphHeight = count === 3 ? 10 : 5;
      ['GRAVITY PULLS YOU DOWN', 'EXIT >'].forEach((line, y) => {
        const ink: [number, number][] = [];
        board[y].forEach((id, bx) => {
          const p = blocks.get(id)!;
          for (let py = 0; py < 20; py++) for (let px = 0; px < 20; px++) if (p.get(px, py) === options.colors.ink) ink.push([bx * 20 + px, py]);
        });
        const xs = ink.map(([x]) => x),
          ys = ink.map(([, y]) => y);
        // Every ink pixel stays on the continuous character grid, including tiles
        // where a letter straddles the boundary. Text margins differ by at most 1 px.
        const x0 = 20 + Math.floor(((board[y].length - 2) * 20 - ((line.length - 1) * pitch + glyphWidth)) / 2);
        expect(Math.min(...xs)).toBe(x0);
        expect(Math.abs(Math.min(...xs) - (board[y].length * 20 - 1 - Math.max(...xs)))).toBeLessThanOrEqual(1);
        expect(Math.abs(Math.min(...ys) - (19 - Math.max(...ys)))).toBeLessThanOrEqual(1);
        expect(Math.max(...ys) - Math.min(...ys) + 1).toBe(glyphHeight);
        for (const [x] of ink) {
          const index = Math.floor((x - x0) / pitch);
          expect(line[index]).not.toBe(' ');
          expect((x - x0) % pitch).toBeLessThan(glyphWidth);
        }
      });
    }
  });

  it('uses the minimum odd interior width and stamps one centered post column', () => {
    for (const text of ['ONE', 'ONE TWO', 'ONE TWO THREE']) {
      const { signs } = buildTiledSigns({ sign: { rows: [[text]] } }, options);
      const writes: [number, number, string][] = [];
      stampTiledSign({ set: (...cell) => writes.push(cell) }, 10, 20, signs.sign, 2);
      const width = signs.sign.board[0].length;
      const needed = Math.ceil(((text.length - 1) * 4 + 3 + 4) / 20);
      expect(width - 2).toBe(needed % 2 ? needed : needed + 1);
      expect(writes.slice(-2)).toEqual([
        [10 + (width - 1) / 2, 21, 'tiledSign.post'],
        [10 + (width - 1) / 2, 22, 'tiledSign.post'],
      ]);
    }
  });

  it('omits posts for wall signs and rejects missing glyphs, empty rows and budget overflow', () => {
    const { blocks, signs } = buildTiledSigns({ wall: { rows: [['four']], post: false } }, { ...options, lettersPerBlock: 4 });
    expect(signs.wall.post).toBeUndefined();
    expect(blocks.has('tiledSign.post')).toBe(false);
    expect(signs.wall.board[0]).toHaveLength(4); // even interior: no post to center
    expect(() => buildTiledSigns({ a: { rows: [['☃']] } }, options)).toThrow('No tiny sign glyph');
    for (const rows of [[], [[]], [['   ']]]) expect(() => buildTiledSigns({ a: { rows } }, options)).toThrow('nonempty rows');
    expect(() => buildTiledSigns({ a: { rows: [['A']] } }, { ...options, maxBlocks: 2 })).toThrow('budget');
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
    for (const x of [34, 35]) for (const y of [8, 9]) expect(at(x, y)).toBe(book.n('brick'));
    for (let x = 40; x <= 48; x++) expect(at(x, 8)).toBe(book.n('grass'));
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
