// Micro plaque contracts: readable variable-width letters, shared pixels and single-post stacks.
import { describe, expect, it } from 'vitest';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { microSignGlyph, microSignLine } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSignFont';
import { buildTiledSigns, stampTiledSign, stampMicroPlaques } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../games/kit/starter/microPlaque';
import { Book, PULL } from '../../games/kit/starter/book';
import { buildStarterPalette, skyOf } from '../../games/kit/starter/palette';

const colors = { background: 0, paper: 1, ink: 2, wood: 3, highlight: 4, shadow: 5 };
const arrows = '←→↑↓↖↗↙↘';

describe('micro plaque font', () => {
  it('keeps the shared 3×5 repertoire and uses 5×5 W/M only while the line fits', () => {
    for (const glyph of Object.values(MICRO_GLYPHS)) expect(glyph).toMatch(/^[01]{15}$/);
    for (const word of ['WALK', 'JUMP', 'MORE', 'TIME']) {
      const wide = microSignLine(word, MICRO_GLYPHS, 18);
      expect(wide.width).toBe(17);
      expect(wide.glyphs.map((g) => g.length / 5)).toContain(5);
      const narrow = microSignLine(word, MICRO_GLYPHS, 16);
      expect(narrow.width).toBe(15);
      expect(narrow.glyphs.every((g) => g.length === 15)).toBe(true);
    }
    expect(microSignLine('MWMW', MICRO_GLYPHS, 18).glyphs.map((g) => g.length / 5)).toEqual([5, 3, 3, 3]);
    expect(microSignLine('MWMW', MICRO_GLYPHS, 38).width).toBe(23);
    const custom = { ...MICRO_GLYPHS, W: '111100111001111' };
    expect(microSignLine('W', custom, 18).glyphs).toEqual([custom.W]);
    expect(microSignGlyph('N', MICRO_GLYPHS.N)).toBe('101111111111101');
    for (const ch of 'NQ&@') expect(microSignGlyph(ch, MICRO_GLYPHS[ch])).not.toBe(microSignGlyph('H', MICRO_GLYPHS.H));
    expect(microSignLine('W', MICRO_GLYPHS, 18).glyphs).toEqual(['10001' + '10001' + '10101' + '10101' + '01010']);
    expect(microSignLine('M', MICRO_GLYPHS, 18).glyphs).toEqual(['10001' + '11011' + '10101' + '10001' + '10001']);
    expect(new Set([...'MNQW&@H'].map((ch) => microSignGlyph(ch, MICRO_GLYPHS[ch]))).size).toBe(7);
  });

  it('uses a diagonal capital N while it fits, with a full-height capital fallback', () => {
    const capital = '1001' + '1101' + '1101' + '1011' + '1001';
    const narrow = '101' + '111' + '111' + '111' + '101';
    for (const word of ['RUN', 'NOW!', 'NEW', 'NO']) {
      const line = microSignLine(word, MICRO_GLYPHS, 18);
      expect(line.width).toBeLessThanOrEqual(18);
      expect(line.glyphs[word.indexOf('N')]).toBe(capital);
    }
    expect(microSignLine('NNNN', MICRO_GLYPHS, 18).glyphs).toEqual([capital, capital, capital, narrow]);
    expect(microSignLine('NNNN', MICRO_GLYPHS, 15).glyphs).toEqual([narrow, narrow, narrow, narrow]);
    expect(microSignLine('NEW', MICRO_GLYPHS, 18).glyphs.map((g) => g.length / 5)).toEqual([4, 3, 5]);
    const custom = { ...MICRO_GLYPHS, N: '111100111001111' };
    expect(microSignLine('N', custom, 18).glyphs).toEqual([custom.N]);
  });

  it('centers wide and fallback lines inside a clean 1px frame', () => {
    for (const word of ['WALK', 'JUMP', 'MWMW']) {
      const { blocks, signs } = buildTiledSigns({ a: { rows: [[word]], post: false } }, { colors, font: 'micro' });
      const p = blocks.get(signs.a.board[0][0])!;
      const ink = [...p.px].flatMap((c, i) => (c === colors.ink ? [i % 20] : []));
      const width = 17;
      expect([Math.min(...ink), Math.max(...ink)]).toEqual([Math.floor((20 - width) / 2), Math.floor((20 - width) / 2) + width - 1]);
      for (let x = 1; x < 19; x++) {
        expect(p.get(x, 0)).toBe(colors.highlight);
        expect(p.get(x, 19)).toBe(colors.shadow);
      }
      expect(p.get(19, 0)).toBe(colors.wood);
      expect(p.get(0, 19)).toBe(colors.wood);
    }
  });

  it('provides eight distinct arrows, preserving existing horizontal pixels in every sign mode', () => {
    expect(MICRO_GLYPHS['→']).toBe('100110111110100');
    expect(MICRO_GLYPHS['←']).toBe('001011111011001');
    expect(new Set([...arrows].map((ch) => MICRO_GLYPHS[ch])).size).toBe(8);
    for (const font of [{ font: 'micro' as const }, { compact: true }, { lettersPerBlock: 3 as const }, {}]) {
      const text = { a: { rows: [['EXIT →']] } };
      expect(buildTiledSigns(text, { colors, ...font })).toEqual(
        buildTiledSigns(text, { colors, ...font, glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' } }),
      );
    }
    for (const ch of arrows) {
      const { blocks, signs } = buildTiledSigns({ a: { rows: [[ch]], post: false } }, { colors, font: 'micro' });
      const p = blocks.get(signs.a.board[0][0])!;
      for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) expect(p.get(8 + x, 7 + y)).toBe(MICRO_GLYPHS[ch][y * 3 + x] === '1' ? colors.ink : colors.paper);
    }
  });
});

describe('Starter micro plaques', () => {
  it('shares identical complete board bytes across two palettes, with sky only in posts', () => {
    const palettes = [
      buildStarterPalette(undefined, 'first-steps'),
      buildStarterPalette((b) => b.ramp('extra', 2, [0, 0, 0], [63, 63, 63]), 'meet-the-monsters'),
    ];
    const books = palettes.map(() => new Book('bbl'));
    const signs = books.map((book, i) =>
      addMicroPlaques(book, palettes[i], {
        walk: { lines: ['WALK', 'IN'] },
        wide: { lines: ['SPACE', 'JUMPS'] },
        float: { lines: ['EXIT', '→'], post: false },
      }),
    );
    for (const name of ['walk', 'wide', 'float'] as const) {
      const pictures = books.map((book, i) => signs[i][name].board.flat().map((id) => book.pics.get(id)!.px));
      expect(pictures[0]).toEqual(pictures[1]);
      for (const p of pictures[0]) expect(p.includes(skyOf(palettes[0]))).toBe(false);
    }
    expect(signs[0].wide.board).toHaveLength(1);
    expect(signs[0].wide.board[0]).toHaveLength(2);
    expect(signs[0].float.post).toBeUndefined();
    // Scene sky can use another index without changing any board byte.
    const alternate = buildTiledSigns({ a: { rows: [['WALK'], ['IN']] } }, { colors: { ...colors, background: 99 }, font: 'micro' });
    const original = buildTiledSigns({ a: { rows: [['WALK'], ['IN']] } }, { colors, font: 'micro' });
    expect(alternate.blocks.get(alternate.signs.a.board[0][0])!.px).toEqual(original.blocks.get(original.signs.a.board[0][0])!.px);
    expect(alternate.blocks.get(alternate.signs.a.post!.block)!.get(0, 0)).toBe(99);
    for (let i = 0; i < 2; i++) {
      const id = signs[i].walk.post!.block;
      expect(books[i].pics.get(id)!.get(0, 0)).toBe(skyOf(palettes[i]));
      expect(books[i].rulesOf(id).grav).toBe(PULL.down);
    }
  });

  it('places floating, tall-post and stacked plaques without extra posts between boards', () => {
    const book = new Book('bbl');
    const signs = addMicroPlaques(book, buildStarterPalette(), {
      top: { lines: ['TOO', 'SLOW'] },
      bottom: { lines: ['GO', 'BACK'] },
      wide: { lines: ['SPACE', 'JUMPS'] },
      float: { lines: ['EXIT', '→'], post: false },
    });
    const cells = new Map<string, string>();
    const map = { set: (x: number, y: number, id: string) => cells.set(`${x},${y}`, id) };
    stampTiledSign(map, 2, 3, signs.float);
    expect([...cells.keys()]).toEqual(['2,3']);
    cells.clear();
    stampTiledSign(map, 2, 3, signs.wide, 3);
    expect(cells.size).toBe(8);
    expect(cells.get('2,6')).toBe(signs.wide.post!.block);
    expect(cells.get('3,6')).toBe(signs.wide.post!.rightBlock);
    cells.clear();
    stampMicroPlaques(map, 2, 3, [signs.top, signs.bottom], 2);
    expect([...cells.entries()]).toEqual([
      ['2,3', signs.top.board[0][0]],
      ['2,4', signs.bottom.board[0][0]],
      ['2,5', signs.bottom.post!.block],
      ['2,6', signs.bottom.post!.block],
    ]);
    cells.clear();
    stampMicroPlaques(map, 0, 0, [signs.top, signs.bottom], 0);
    expect(cells.size).toBe(2);
    for (const height of [-1, 0.5]) expect(() => stampMicroPlaques(map, 0, 0, [signs.top], height)).toThrow('height');
    expect(() => stampMicroPlaques(map, 0, 0, [])).toThrow('at least one');
    expect(() => stampMicroPlaques(map, 0, 0, [signs.top, signs.wide])).toThrow('same width');
    expect(() => stampMicroPlaques(map, 0, 0, [signs.float])).toThrow('needs a post');
    expect(() => addMicroPlaques(new Book('bbl'), buildStarterPalette(), { bad: { lines: ['ONE', 'TWO', 'THREE'] } })).toThrow('one or two');
  });
});
