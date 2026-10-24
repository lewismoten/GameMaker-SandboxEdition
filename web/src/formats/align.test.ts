// games/kit/align.ts: the multi-block object checks the games' tools/check.ts run on their disks.
import { describe, expect, it } from 'vitest';
import { autoParts, brokenSeams, checkParts, gridParts, pair, seams, shape, sizesOf, type NameAt } from '../../../games/kit/align';

/** A map from rows of names (one name per cell, separated by spaces); '.' is empty. */
const grid = (rows: string[]): NameAt => {
  const cells = rows.map((r) => r.split(' '));
  return (x, y) => {
    const n = cells[y]?.[x];
    return n === undefined || n === '.' ? 'sky' : n;
  };
};

describe('checkParts', () => {
  it('passes a whole pair and reports a broken one', () => {
    const rules = pair('table', 'tableL', 'tableR', 1, 0);
    expect(checkParts(grid(['tableL tableR .']), rules, 3, 1)).toEqual([]);
    const bad = checkParts(grid(['tableL . tableR']), rules, 3, 1);
    expect(bad).toHaveLength(2);
    expect(bad[0]).toContain('wanted tableR at 1,0, found sky');
  });

  it('counts a part at the map edge as broken (maps wrap)', () => {
    expect(checkParts(grid(['. tableL']), pair('table', 'tableL', 'tableR', 1, 0), 2, 1)).toEqual([
      'table (tableL) at 1,0: wanted tableR at 1,0, found off the map',
    ]);
  });

  it('lets a part repeated in a shape stand at any of its places', () => {
    const seat = /^seat\d$/;
    const rules = shape('couch', [['armL', seat, seat, 'armR']]);
    expect(checkParts(grid(['armL seat1 seat2 armR']), rules, 4, 1)).toEqual([]);
    expect(checkParts(grid(['armL seat1 armR .']), rules, 4, 1).length).toBeGreaterThan(0);
  });

  it('collects the joined pairs for the art check', () => {
    const joined = new Set<string>();
    checkParts(grid(['top', 'bot']), pair('post', 'top', 'bot', 0, 1), 1, 2, joined);
    expect([...joined]).toEqual([JSON.stringify(['top', 'bot', 'v'])]);
  });
});

describe('gridParts', () => {
  it('checks objects named by column and row, with stand-ins', () => {
    const re = /^(cat)(\d)(\d)$/;
    const sizes = sizesOf(['cat00', 'cat10', 'cat01', 'cat11'], re);
    expect(sizes.get('cat')).toEqual([2, 2]);
    const rule = gridParts(
      re,
      sizes,
      (o, c, r) => `${o}${c}${r}`,
      (g) => (g === 'blink' ? 'cat11' : g),
    );
    expect(checkParts(grid(['cat00 cat10', 'cat01 blink']), [rule], 2, 2)).toEqual([]);
    expect(checkParts(grid(['cat00 cat10', 'cat01 sky']), [rule], 2, 2)).toHaveLength(3);
  });
});

describe('autoParts', () => {
  it('finds numbered objects from how the maps place them, not animation frames', () => {
    const at = grid(['sign0 sign1 sign2 fire0 . fire1', 'sign0 sign1 sign2 . . .']);
    const rules = autoParts([at], ['sign0', 'sign1', 'sign2', 'fire0', 'fire1']);
    expect(rules.map((r) => r.part)).toEqual(['sign0', 'sign1', 'sign1', 'sign2']);
    expect(checkParts(grid(['sign0 sign1 . sign2']), rules, 4, 1).length).toBeGreaterThan(0);
  });
});

describe('seams', () => {
  const pal = new Uint8Array(768);
  pal.set([0, 0, 0, 63, 63, 63], 0);
  it('flags art that jumps at the shared edge, not art that runs on or an edge line', () => {
    const right = (x: number) => (x >= 10 ? 1 : 0); // an object's left half, running on right
    const full = () => 1; // ...its right half
    const late = (x: number) => (x >= 5 ? 1 : 0); // a right half drawn half a block over
    const grout = (x: number) => (x === 0 ? 0 : 1); // a pattern with a line on its edge
    const pics: Record<string, (x: number) => number> = { right, full, late, grout };
    const s = seams((n) => pics[n], pal, [
      ['right', 'full', 'h'],
      ['right', 'late', 'h'],
      ['full', 'grout', 'h'],
    ]);
    expect(brokenSeams(s).map((x) => x.b)).toEqual(['late']);
  });
});
