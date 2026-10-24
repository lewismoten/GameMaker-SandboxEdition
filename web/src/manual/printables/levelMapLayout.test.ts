// The printed Level Maps' arithmetic: shared maps, the part in use, hidden cells, marks and page
// packing.
import { describe, expect, it } from 'vitest';
import { emptyBlock } from '../../formats/blocks';
import { ADVTYPE, ENDTYPE, NOSCENE, STARTTYPE, type Game, type Scene } from '../../formats/game';
import { MLEN, MWID } from '../../formats/map';
import { fillerBlock, hideSecrets, levelMarks, mapGroups, markLabel, packPages, usedArea } from './levelMapLayout';

const scene = (gametype: number, files: string[], links: [number, number, number, number, number][] = []): Scene =>
  ({
    gametype,
    pos: { x: 0, y: 0 },
    desc: '',
    files,
    numLinks: links.length,
    links: links.map(([toScene, fx, fy, tx, ty]) => ({ toScene, from: { x: fx, y: fy }, to: { x: tx, y: ty } })),
  }) as unknown as Scene;

/** Title -> 2 (arrive 5,5); 2 exits at 9,5 and 9,6 to 3, and at 1,1 to the end; 3 shares 2's map. */
const game = {
  scenes: [
    scene(STARTTYPE, ['t.lst'], [[2, 0, 0, 5, 5]]),
    scene(ENDTYPE, ['won.lst']),
    scene(
      ADVTYPE,
      ['a.pal', 'a.map', 'a.bbl'],
      [
        [3, 9, 5, 2, 2],
        [3, 9, 6, 2, 2],
        [1, 1, 1, 0, 0],
        [NOSCENE, 0, 0, 0, 0],
      ],
    ),
    scene(ADVTYPE, ['a.pal', 'A.MAP', 'a.bbl'], [[2, 2, 3, 8, 5]]),
    scene(ADVTYPE, ['b.pal', 'b.map', 'b.bbl']),
  ],
} as unknown as Game;

const blank = (fill = 0) => new Uint8Array(MLEN * MWID).fill(fill);

describe('Level Maps layout', () => {
  it('makes one map of the scenes that share a map and block set', () => {
    expect(mapGroups(game)).toEqual([
      { map: 'a.map', bbl: 'a.bbl', scenes: [2, 3] },
      { map: 'b.map', bbl: 'b.bbl', scenes: [4] },
    ]);
  });

  it('crops to what is in use, round the padding block', () => {
    const cells = blank(7);
    cells[20 * MLEN + 30] = 1;
    cells[25 * MLEN + 41] = 2;
    expect(fillerBlock(cells)).toBe(7);
    expect(usedArea(cells)).toEqual({ x: 29, y: 19, w: 14, h: 8 });
    expect(usedArea(cells, [{ x: 50, y: 20 }], 0)).toEqual({ x: 30, y: 20, w: 21, h: 6 });
    expect(usedArea(blank(3))).toEqual({ x: 0, y: 0, w: MLEN, h: MWID });
  });

  it('marks arrivals and ways out, joining a row of door blocks, and the end its own kind', () => {
    const marks = levelMarks(game, [2, 3]);
    expect(marks).toEqual([
      { kind: 'start', x: 2, y: 2, w: 1, h: 1, scenes: [3] },
      { kind: 'start', x: 5, y: 5, w: 1, h: 1, scenes: [2] },
      { kind: 'start', x: 8, y: 5, w: 1, h: 1, scenes: [2] },
      { kind: 'exit', x: 2, y: 3, w: 1, h: 1, scenes: [2] },
      { kind: 'exit', x: 9, y: 5, w: 1, h: 2, scenes: [3] },
      { kind: 'end', x: 1, y: 1, w: 1, h: 1, scenes: [1] },
    ]);
  });

  it('never marks a hidden cell', () => {
    const hidden = new Set([5 * MLEN + 5, 1 * MLEN + 1]);
    const marks = levelMarks(game, [2, 3], hidden);
    expect(marks.some((m) => hidden.has(m.y * MLEN + m.x))).toBe(false);
    expect(marks.map((m) => m.kind)).toEqual(['start', 'start', 'exit', 'exit']);
  });

  it('draws secret blocks as the ground they turn into, else their neighbors’ ground', () => {
    const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
    blocks[40].touchBl = 3; // a heart: touched, it is ground 3
    blocks[41].touchBl = 41; // an egg that stays put
    const cells = blank(0);
    cells[10 * MLEN + 10] = 40;
    cells[12 * MLEN + 12] = 41;
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, 1],
    ])
      cells[(12 + dy) * MLEN + 12 + dx] = 5;
    const { cells: out, hidden } = hideSecrets(cells, blocks, new Set([40, 41]));
    expect(out[10 * MLEN + 10]).toBe(3);
    expect(out[12 * MLEN + 12]).toBe(5);
    expect([...hidden].sort((a, b) => a - b)).toEqual([10 * MLEN + 10, 12 * MLEN + 12]);
    expect(out.includes(40) || out.includes(41)).toBe(false);
  });

  it('labels marks with scene numbers, runs shortened', () => {
    expect(markLabel(game, [2, 3])).toBe('2, 3');
    expect(markLabel(game, [1])).toBe('⚑');
    expect(markLabel(game, [0, 2])).toBe('★, 2');
    const many = { scenes: Array.from({ length: 10 }, () => scene(ADVTYPE, [])) } as unknown as Game;
    expect(markLabel(many, [1, 2, 3, 4, 7, 8])).toBe('1–4, 7, 8');
  });

  it('packs small maps in rows, a page at a time; a big one gets its own page', () => {
    const area = { w: 100, h: 60 };
    expect(
      packPages(
        [
          { w: 60, h: 20 },
          { w: 30, h: 20 },
          { w: 60, h: 30 },
          { w: Infinity, h: Infinity },
          { w: 40, h: 50 },
          { w: 50, h: 20 },
        ],
        area,
        2,
      ),
    ).toEqual([
      { page: 0, x: 0, y: 0 },
      { page: 0, x: 62, y: 0 },
      { page: 0, x: 0, y: 22 },
      { page: 1, x: 0, y: 0 },
      { page: 2, x: 0, y: 0 },
      { page: 2, x: 42, y: 0 },
    ]);
  });
});
