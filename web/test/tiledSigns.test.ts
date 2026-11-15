// Tiled-sign regression checks: shared art, readable chunks, centered posts and budgets.
import { describe, expect, it } from 'vitest';
import { buildTiledSigns, stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { ORIGIN } from '../../games/kit/starter/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { buildLevels } from '../../games/first-steps/src/levels';
import { buildLevels as smashLevels } from '../../games/breakable-walls/src/levels';
import { buildGame as smashGame } from '../../games/breakable-walls/src/game';
import { buildLevels as heroLevels } from '../../games/choose-hero/src/levels';
import { buildGame as heroGame } from '../../games/choose-hero/src/game';
import { CREDITS } from '../../games/first-steps/src/text';

import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';

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

  it('allocates only a map’s selected vocabulary without relaxing its tile budget', () => {
    const texts = { roomA: { rows: [['ONE']] }, roomB: { rows: [['TWO']] } };
    const limited = { ...options, maxBlocks: 4 };
    expect(() => buildTiledSigns(texts, limited)).toThrow('budget');
    for (const key of ['roomA', 'roomB'] as const) {
      const local = buildTiledSigns(texts, { ...limited, include: [key, key] });
      expect(Object.keys(local.signs)).toEqual([key]);
      expect(local.blocks.size).toBe(4);
      expect(local).toEqual(buildTiledSigns({ [key]: texts[key] }, limited));
      expect(() => buildTiledSigns(texts, { ...limited, maxBlocks: 3, include: [key] })).toThrow('budget');
    }
    expect(buildTiledSigns(texts, { ...limited, include: [] }).blocks.size).toBe(0);
    expect(() => buildTiledSigns(texts, { ...limited, include: ['missing' as 'roomA'] })).toThrow('Unknown sign');
  });

  it('fits compact text to the total width, including odd interiors and both frame tiles', () => {
    for (const post of [true, false])
      for (const maxWidth of [5, 6, 7, 8, 9]) {
        const { signs } = buildTiledSigns({ a: { rows: [['AAAA AAAA AAAA AAAA AAAA AAAA']], post } }, { ...options, compact: true, maxWidth });
        const interior = maxWidth - 2 - (post && (maxWidth - 2) % 2 === 0 ? 1 : 0);
        const capacity = Math.floor((interior * 20 - 8) / 5) + 1;
        const wordsPerLine = Math.floor((capacity + 1) / 5);
        const lineCount = Math.ceil(6 / wordsPerLine);
        expect(signs.a.board[0].length).toBeLessThanOrEqual(maxWidth);
        expect(signs.a.board).toHaveLength(Math.ceil((lineCount * 9 + 5) / 20));
        if (post) expect(signs.a.post!.x).toBe((signs.a.board[0].length - 1) / 2);
      }
  });

  it('wraps whole words without dropping punctuation, preserves explicit rows and normalizes chunks', () => {
    const settings = { ...options, compact: true, maxWidth: 5 };
    const wrapped = buildTiledSigns({ a: { rows: [['  one  TWO ', 'THREE! FOUR?']] } }, settings);
    const explicit = buildTiledSigns({ a: { rows: [['ONE TWO'], ['THREE!'], ['FOUR?']] } }, settings);
    expect(wrapped).toEqual(explicit);
    expect(wrapped.signs.a.board).toHaveLength(2);
    expect(() => buildTiledSigns({ a: { rows: [['ABCDEFGHIJKL']] } }, settings)).toThrow('exceeds maxWidth');
    for (const maxWidth of [2, 4.5, NaN, Infinity]) expect(() => buildTiledSigns({ a: { rows: [['A']] } }, { ...settings, maxWidth })).toThrow('maxWidth');
    expect(() => buildTiledSigns({ a: { rows: [['A']] } }, { ...settings, lettersPerBlock: 3 })).toThrow('four letters');
  });

  it('honors individual board limits and wraps the larger font within an even wall board', () => {
    const { signs } = buildTiledSigns(
      { wide: { rows: [['ONE TWO THREE FOUR']] }, narrow: { rows: [['ONE TWO THREE FOUR']], maxWidth: 5 } },
      { ...options, compact: true, maxWidth: 9 },
    );
    expect(signs.wide.board[0]).toHaveLength(7);
    expect(signs.wide.board).toHaveLength(1);
    expect(signs.narrow.board[0]).toHaveLength(5);
    expect(signs.narrow.board).toHaveLength(2);
    const wall = buildTiledSigns({ a: { rows: [['ONE TWO THREE FOUR']], post: false } }, { ...options, lettersPerBlock: 3, maxWidth: 6 });
    const explicit = buildTiledSigns({ a: { rows: [['ONE TWO'], ['THREE FOUR']], post: false } }, { ...options, lettersPerBlock: 3 });
    expect(wall).toEqual(explicit);
  });

  it('draws compact capitals and digits at four by eight pixels, retaining shared frame and post art', () => {
    const compact = buildTiledSigns(
      { a: { rows: [['ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 .,:!?→']] } },
      { ...options, compact: true, maxWidth: 13, glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' } },
    );
    const standard = buildTiledSigns({ a: { rows: [['A'], ['B'], ['C']] } }, options);
    for (const name of ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'post'])
      expect(compact.blocks.get(`tiledSign.${name}`)).toEqual(standard.blocks.get(`tiledSign.${name}`));
    const { blocks, signs } = buildTiledSigns({ a: { rows: [['H']] } }, { ...options, compact: true });
    const ink = signs.a.board.flatMap((row, by) =>
      row.flatMap((id, bx) =>
        [...blocks.get(id)!.px].flatMap((c, i) => (c === options.colors.ink ? [[bx * 20 + (i % 20), by * 20 + Math.floor(i / 20)]] : [])),
      ),
    );
    expect(Math.max(...ink.map(([x]) => x)) - Math.min(...ink.map(([x]) => x)) + 1).toBe(4);
    expect(Math.max(...ink.map(([, y]) => y)) - Math.min(...ink.map(([, y]) => y)) + 1).toBe(8);
  });

  it('keeps pickups and gameplay block IDs intact when maps load separate sign books', () => {
    for (const [build, game, coins] of [
      [smashLevels, smashGame, [8, 9, 0]],
      [heroLevels, heroGame, [4, 8, 6]],
    ] as const) {
      const { book, levels } = build();
      for (const [i, level] of levels.entries()) {
        expect(level.book.index.size).toBeLessThanOrEqual(100);
        const cells = level.map.done().blocks;
        expect(cells.filter((n) => n === level.book.n('coin'))).toHaveLength(coins[i]);
        for (const name of ['sky', 'grass', 'dirt', 'coin', 'doorTop', 'doorBottom']) expect(level.book.n(name)).toBe(book.n(name));
      }
      const scenes = game(levels).scenes.slice(2);
      for (const scene of scenes) expect(scene.files[2]).toBe(scene.files[1].replace('.map', '.bbl'));
    }
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
