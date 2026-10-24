// The level check's content generators: stretched hazard art, outlines, ladders and plain air.
import { describe, expect, it } from 'vitest';
import { TRANSPARENT, newBlockSet } from '../../../formats/blocks';
import { MLEN } from '../../../formats/map';
import { blockUse } from '../sceneData';
import { artBox, contrastColor, fillHazard, outline } from './blockArt';
import { airBlock, ladderBlock, ladderCells } from './mapFixes';
import { testGame, WALL } from '../testGame';
import { parseMap } from '../../../formats/map';
import { BACKBL, parseBlocks } from '../../../formats/blocks';

describe('the level check’s generators', () => {
  it('stretches a hazard drawn in the bottom rows over the whole cell', () => {
    const px = new Uint8Array(400).fill(1);
    for (let i = 300; i < 400; i++) px[i] = i % 2 ? 12 : 13;
    const sky = new Set([1]);
    expect(artBox(px, sky)).toEqual({ x0: 0, y0: 15, x1: 19, y1: 19 });
    const out = fillHazard(px, sky)!;
    expect(out.every((p) => p === 12 || p === 13)).toBe(true);
  });

  it('rims a sprite in the color that stands out most', () => {
    const pal = new Uint8Array(768);
    pal.set([63, 63, 63], 15 * 3);
    expect(contrastColor(pal, 0)).toBe(15);
    const px = new Uint8Array(400).fill(TRANSPARENT);
    px[10 * 20 + 10] = 4;
    const o = outline(px, 15);
    expect([o[10 * 20 + 9], o[10 * 20 + 11], o[9 * 20 + 10], o[11 * 20 + 10], o[9 * 20 + 9]]).toEqual([15, 15, 15, 15, TRANSPARENT]);
  });

  it('builds a ladder from the bottom of a pit to the floor beside its rim', () => {
    // prettier-ignore
    const t = testGame([
      '##########',
      '#........#',
      '#........#',
      '#E.S.....#',
      '######..##',
      '######..##',
      '######..##',
      '######..##',
      '##########',
    ]);
    const map = parseMap(t.files.get('test.map')!);
    const bg = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    const col = ladderCells(map.blocks, bg, 7 * MLEN + 6)!;
    expect(col.map((c) => Math.floor(c / MLEN))).toEqual([7, 6, 5, 4]);
    const use = blockUse(map);
    const air = airBlock(bg, use);
    expect(air).not.toBe(WALL);
    const rung = ladderBlock(bg, use, air)!;
    expect(rung.make?.grav).toBe(1);
    expect(newBlockSet('bbl')[rung.n].grav).toBe(0);
  });
});
