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
import { buildLevels as monsterLevels } from '../../games/meet-the-monsters/src/levels';

import { microSignLine } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSignFont';
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
    expect(signs.first.post).toEqual(signs.nextLevel.post);
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
      const pitch = count === 3 ? 7 : count === 4 ? 5 : 4;
      const glyphWidth = count === 3 ? 6 : 3;
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
        const advance = (ch: string) => (ch === ' ' && count === 3 ? 3 : pitch);
        const textWidth = [...line].reduce((sum, ch) => sum + advance(ch), 0) - pitch + glyphWidth;
        const x0 = 20 + Math.floor(((board[y].length - 2) * 20 - textWidth) / 2);
        expect(Math.min(...xs)).toBe(x0);
        expect(Math.abs(Math.min(...xs) - (board[y].length * 20 - 1 - Math.max(...xs)))).toBeLessThanOrEqual(1);
        expect(Math.abs(Math.min(...ys) - (19 - Math.max(...ys)))).toBeLessThanOrEqual(1);
        expect(Math.max(...ys) - Math.min(...ys) + 1).toBe(glyphHeight);
        let pen = x0;
        for (const ch of line) {
          const glyph = MICRO_GLYPHS[ch];
          const scale = count === 3 ? 2 : 1;
          for (let gy = 0; gy < glyphHeight; gy++)
            for (let gx = 0; gx < glyphWidth; gx++) {
              const bx = Math.floor((pen + gx) / 20);
              const p = blocks.get(board[y][bx])!;
              if (glyph[Math.floor(gy / scale) * 3 + Math.floor(gx / scale)] === '1')
                expect(p.get((pen + gx) % 20, Math.floor((20 - glyphHeight) / 2) + gy)).toBe(options.colors.ink);
            }
          pen += advance(ch);
        }
      });
    }
  });

  it('uses minimum interior width and centers posts even at a tile boundary', () => {
    for (const text of ['ONE', 'ONE TWO', 'ONE TWO THREE']) {
      const { blocks, signs } = buildTiledSigns({ sign: { rows: [[text]] } }, options);
      const sign = signs.sign;
      const width = sign.board[0].length;
      const needed = Math.ceil(((text.length - 1) * 4 + 3 + 4) / 20);
      expect(width - 2).toBe(needed);
      const cells = new Map<string, string>();
      stampTiledSign({ set: (x, y, block) => cells.set(`${x},${y}`, block) }, 0, 0, sign, 2);
      for (const y of [1, 2]) {
        const wood: number[] = [];
        for (let bx = 0; bx < width; bx++) {
          const id = cells.get(`${bx},${y}`);
          if (id) for (let x = 0; x < 20; x++) if (blocks.get(id)!.get(x, 0) !== options.colors.background) wood.push(bx * 20 + x);
        }
        expect(wood).toEqual([width * 10 - 2, width * 10 - 1, width * 10, width * 10 + 1]);
      }
    }
  });

  it('expands every source font pixel to an identical 2×2 square', () => {
    for (let sourceY = 0; sourceY < 5; sourceY++)
      for (let sourceX = 0; sourceX < 3; sourceX++) {
        const glyph = '0'.repeat(sourceY * 3 + sourceX) + '1' + '0'.repeat(14 - sourceY * 3 - sourceX);
        const { blocks, signs } = buildTiledSigns({ a: { rows: [['A']] } }, { ...options, lettersPerBlock: 3, glyphs: { A: glyph } });
        const ink: number[][] = [];
        signs.a.board[0].forEach((id, bx) => {
          const p = blocks.get(id)!;
          for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (p.get(x, y) === options.colors.ink) ink.push([bx * 20 + x, y]);
        });
        const x = 27 + sourceX * 2,
          y = 5 + sourceY * 2;
        expect(ink).toEqual([
          [x, y],
          [x + 1, y],
          [x, y + 1],
          [x + 1, y + 1],
        ]);
      }
  });

  it('packs JUMP OVER IT into four large text tiles without per-word or per-tile padding', () => {
    const settings = { ...options, lettersPerBlock: 3 as const };
    const whole = buildTiledSigns({ a: { rows: [['JUMP OVER IT']] } }, settings);
    expect(whole.signs.a.board[0]).toHaveLength(6); // four text tiles plus two edges
    expect(whole).toEqual(buildTiledSigns({ a: { rows: [['JU', 'MP O', 'VER ', 'IT']] } }, settings));
    const canvas = whole.signs.a.board[0].flatMap((id) => [whole.blocks.get(id)!]);
    // The M's strokes cross the first text tile boundary: neither half is discarded.
    expect(canvas[2].px.some((c) => c === options.colors.ink)).toBe(true);
    let pen = 22;
    for (let i = 0; i < 12; i++) {
      if ('JUMP OVER IT'[i] === ' ') {
        pen += 3;
        continue;
      }
      const glyph = MICRO_GLYPHS['JUMP OVER IT'[i]];
      for (let y = 0; y < 10; y++)
        for (let x = 0; x < 6; x++) {
          const px = pen + x;
          expect(canvas[Math.floor(px / 20)].get(px % 20, 5 + y)).toBe(
            glyph[Math.floor(y / 2) * 3 + Math.floor(x / 2)] === '1' ? options.colors.ink : options.colors.paper,
          );
        }
      pen += 7;
    }
  });

  it('wraps whole words across a single micro board, centering both text lines', () => {
    const cases = [
      ['JUMP OVER IT', 2, ['JUMP', 'OVER IT']],
      ['MONSTERS WALK A PATH', 3, ['MONSTERS', 'WALK A PATH']],
      ['TOUCHING HURTS', 2, ['TOUCHING', 'HURTS']],
      ['WATCH YOUR LIVES', 3, ['WATCH YOUR', 'LIVES']],
    ] as const;
    for (const [text, width, lines] of cases) {
      const { blocks, signs } = buildTiledSigns({ a: { rows: [[text]] } }, { ...options, font: 'micro' });
      const board = signs.a.board;
      expect(board).toHaveLength(1);
      expect(board[0]).toHaveLength(width);
      const pixel = (x: number, y: number) => blocks.get(board[0][Math.floor(x / 20)])!.get(x % 20, y);
      // Compare the continuous line, including wide W/M and letters crossing tile seams.
      lines.forEach((line, row) => {
        const rendered = microSignLine(line, MICRO_GLYPHS, width * 20 - 2);
        const x0 = Math.floor((width * 20 - rendered.width) / 2);
        let pen = x0;
        const expected = new Map<string, boolean>();
        for (const glyph of rendered.glyphs) {
          const gw = glyph.length / 5;
          for (let y = 0; y < 5; y++) for (let x = 0; x < gw; x++) if (glyph[y * gw + x] === '1') expected.set(`${pen + x},${y}`, true);
          pen += gw + 1;
        }
        for (let y = 0; y < 5; y++)
          for (let x = 1; x < width * 20 - 1; x++)
            expect(pixel(x, 4 + row * 7 + y)).toBe(expected.has(`${x},${y}`) ? options.colors.ink : options.colors.paper);
      });
      expect(pixel(0, 10)).toBe(options.colors.highlight);
      expect(pixel(width * 20 - 1, 10)).toBe(options.colors.shadow);
    }
    for (const ch of Object.keys(MICRO_GLYPHS).filter((ch) => ch !== ' '))
      expect(() => buildTiledSigns({ a: { rows: [[ch]] } }, { ...options, font: 'micro' })).not.toThrow();
    expect(() => buildTiledSigns({ a: { rows: [['MONSTERS']] } }, { ...options, font: 'micro', maxWidth: 1 })).toThrow('exceeds maxWidth');
    expect(() => buildTiledSigns({ a: { rows: [['A']] } }, { ...options, font: 'micro', compact: true })).toThrow('Micro signs');
  });

  it('keeps a micro frame around multiple block rows and centers an unpaired line', () => {
    const { blocks, signs } = buildTiledSigns({ a: { rows: [['JUMP OVER IT']] } }, { ...options, font: 'micro', maxWidth: 1 });
    expect(signs.a.board).toHaveLength(2);
    const top = blocks.get(signs.a.board[0][0])!,
      bottom = blocks.get(signs.a.board[1][0])!;
    for (let x = 2; x < 18; x++) {
      expect(top.get(x, 19)).toBe(options.colors.paper);
      expect(bottom.get(x, 0)).toBe(options.colors.paper);
    }
    const ys = [...bottom.px].flatMap((color, i) => (color === options.colors.ink ? [Math.floor(i / 20)] : []));
    expect([Math.min(...ys), Math.max(...ys)]).toEqual([7, 11]);
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

  it('leaves two pixels of paper between compact text and each three-pixel rail', () => {
    for (let count = 1; count <= 16; count++) {
      const rows = Array.from({ length: count }, () => ['E']);
      const { blocks, signs } = buildTiledSigns({ sign: { rows } }, { ...options, compact: true });
      const board = signs.sign.board;
      for (const id of board[0]) expect(blocks.get(id)!.px.slice(0, 100)).not.toContain(options.colors.ink);
      for (const id of board.at(-1)!) expect(blocks.get(id)!.px.slice(-100)).not.toContain(options.colors.ink);
    }
  });

  it('fits compact text to the total width, including both frame tiles', () => {
    for (const post of [true, false])
      for (const maxWidth of [5, 6, 7, 8, 9]) {
        const { signs } = buildTiledSigns({ a: { rows: [['AAAA AAAA AAAA AAAA AAAA AAAA']], post } }, { ...options, compact: true, maxWidth });
        const interior = maxWidth - 2;
        const capacity = Math.floor((interior * 20 - 8) / 5) + 1;
        const wordsPerLine = Math.floor((capacity + 1) / 5);
        const lineCount = Math.ceil(6 / wordsPerLine);
        expect(signs.a.board[0].length).toBeLessThanOrEqual(maxWidth);
        expect(signs.a.board).toHaveLength(Math.ceil((lineCount * 9 + 5) / 20));
        if (post) expect(signs.a.post!.x).toBe(Math.floor((signs.a.board[0].length - 1) / 2));
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
    buildTiledSigns(
      { a: { rows: [['ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 .,:!?→']] } },
      { ...options, compact: true, maxWidth: 13, glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' } },
    );
    const standard = buildTiledSigns({ a: { rows: [['A'], ['B'], ['C']] } }, options);
    const compactFrame = buildTiledSigns({ a: { rows: [['A'], ['B'], ['C'], ['D'], ['E']] } }, { ...options, compact: true });
    for (const name of ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'post'])
      expect(compactFrame.blocks.get(`tiledSign.${name}`)).toEqual(standard.blocks.get(`tiledSign.${name}`));
    const { blocks, signs } = buildTiledSigns({ a: { rows: [['H']] } }, { ...options, compact: true });
    const ink = signs.a.board.flatMap((row, by) =>
      row.flatMap((id, bx) =>
        [...blocks.get(id)!.px].flatMap((c, i) => (c === options.colors.ink ? [[bx * 20 + (i % 20), by * 20 + Math.floor(i / 20)]] : [])),
      ),
    );
    expect(Math.max(...ink.map(([x]) => x)) - Math.min(...ink.map(([x]) => x)) + 1).toBe(4);
    expect(Math.max(...ink.map(([, y]) => y)) - Math.min(...ink.map(([, y]) => y)) + 1).toBe(8);
  });

  it('keeps Meet the Monsters pickups while placing one-block plaques on grounded posts', () => {
    const { book, levels } = monsterLevels();
    expect(book.index.size).toBeLessThanOrEqual(24);
    for (const level of levels) expect(level.map.done().blocks.filter((n) => n === book.n('coin'))).toHaveLength(8);
    const cells = levels[0].map.done().blocks;
    const at = (x: number, y: number) => cells[(ORIGIN + y) * MLEN + ORIGIN + x];
    expect(at(19, 9)).toBe(book.n('flower'));
    expect(at(20, 9)).toBe(book.n('microPlaque.post'));
    expect(at(20, 10)).toBe(book.n('grass'));
    expect(at(21, 9)).toBe(book.n('sky'));
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
    // The scroll review credit adds a page; the walkthrough was re-recorded with it.
    expect(CREDITS.split('\n')).toHaveLength(48);
    expect(book.index.size).toBeLessThanOrEqual(30);
    expect([...book.index.keys()].filter((k) => k.startsWith('microPlaque.post')).sort()).toEqual([
      'microPlaque.post',
      'microPlaque.post-left',
      'microPlaque.post-right',
    ]);
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
