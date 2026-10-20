import { describe, expect, it } from 'vitest';
import { emptyMonster, MAXMARCH } from '../src/formats/monster';
import { addCorner, clearPath, corners, insertCorner, moveCorner, pathLength, PathWalker, removeCorner } from '../src/editor/editors/monsterPath';

const walkerSpot = (w: PathWalker) => ({ x: w.bx, y: w.by, px: w.px, py: w.py });

describe('monster path editing', () => {
  it('adds, moves, inserts and removes corners of the normal path', () => {
    const m = emptyMonster();
    const path = m.march[0];
    expect(addCorner(path, 'normal', 3, 0)).toBe(0);
    expect(addCorner(path, 'normal', 3, -2)).toBe(1);
    expect(addCorner(path, 'normal', 0, 0)).toBe(2);
    expect(pathLength(path)).toBe(3);
    expect(corners(path, 'normal').map((c) => [c.x, c.y])).toEqual([
      [3, 0],
      [3, -2],
      [0, 0],
    ]);
    moveCorner(path, 'normal', 1, 40, -40);
    expect([path[1].x, path[1].y]).toEqual([14, -15]);
    expect(insertCorner(path, 'normal', 2)).toBe(2);
    expect(pathLength(path)).toBe(4);
    expect([path[2].x, path[2].y]).toEqual([7, -7]);
    removeCorner(path, 'normal', 0);
    expect(pathLength(path)).toBe(3);
    expect(path[3]).toEqual({ x: 0, y: 0, pic: 0, orient: 0 });
    clearPath(path);
    expect(pathLength(path)).toBe(0);
  });

  it('stops at MAXMARCH corners', () => {
    const path = emptyMonster().march[0];
    for (let i = 0; i < MAXMARCH; i++) expect(addCorner(path, 'normal', i, 0)).toBe(i);
    expect(addCorner(path, 'normal', 1, 1)).toBe(-1);
  });

  it('keeps corner 1 of an attack path as its anchor', () => {
    const m = emptyMonster();
    m.activate = 1;
    const path = m.march[1];
    expect(addCorner(path, 'attack', 2, 1)).toBe(1);
    expect(path[0].pic).toBeGreaterThan(0);
    expect(corners(path, 'attack').map((c) => [c.i, c.x, c.y])).toEqual([[1, 2, 1]]);
    // A shifted anchor (as old files have) still shows corners relative to it.
    path[0].x = 5;
    path[1].x = 7;
    expect(corners(path, 'attack')[0].x).toBe(2);
    removeCorner(path, 'attack', 1);
    expect(pathLength(path)).toBe(0);
  });
});

describe('PathWalker', () => {
  it('walks a square path and returns to the start like playgame', () => {
    const m = emptyMonster();
    m.pic[0] = [0, 2];
    const path = m.march[0];
    addCorner(path, 'normal', 2, 0);
    addCorner(path, 'normal', 2, 2);
    addCorner(path, 'normal', 0, 0);
    for (const c of path) if (c.pic) c.pic = 5;
    const w = new PathWalker(m, 0, { x: 10, y: 10 }, { x: 0, y: 0 });
    // 40 pixels at 5 per tick = 8 ticks to reach (12, 10).
    for (let i = 0; i < 8; i++) w.tick();
    expect(walkerSpot(w)).toEqual({ x: 12, y: 10, px: 0, py: 0 });
    for (let i = 0; i < 9; i++) w.tick();
    expect(walkerSpot(w)).toEqual({ x: 12, y: 12, px: 0, py: 0 });
    for (let i = 0; i < 300 && w.laps === 0; i++) w.tick();
    // The tick that ends the lap already starts the next one.
    expect(walkerSpot(w)).toEqual({ x: 10, y: 10, px: 5, py: 0 });
  });

  it('stops at walls when thru is set', () => {
    const m = emptyMonster();
    m.thru = 1;
    addCorner(m.march[0], 'normal', 5, 0);
    m.march[0][0].pic = 4;
    const w = new PathWalker(m, 0, { x: 10, y: 10 }, { x: 0, y: 0 }, (x) => (x === 12 ? 15 : 0));
    for (let i = 0; i < 40; i++) w.tick();
    expect(w.bx).toBe(11);
  });

  it('chases relative to the character', () => {
    const m = emptyMonster();
    m.activate = 2;
    addCorner(m.march[1], 'chase', 0, -2);
    m.march[1][1].pic = 10;
    const w = new PathWalker(m, 1, { x: 10, y: 10 }, { x: 20, y: 10 });
    for (let i = 0; i < 400 && w.laps === 0; i++) w.tick();
    expect([w.bx, w.by]).toEqual([20, 8]);
  });
});
