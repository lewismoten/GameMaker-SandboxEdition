// The solid-monster push checks, on the tiny game in testGame.ts with monsters added: a lift to
// the map's top row, a pacer that walks up against a wall (and one that stops a block short), a
// lift that rises flush with the ceiling, two pacers closing in (and two moving together), and
// solid monsters that hurt.
import { describe, expect, it } from 'vitest';
import { SOLBOT, SOLTOP, newBlockSet, serializeBlocks } from '../../../formats/blocks';
import { serializeGame } from '../../../formats/game';
import { parseMap, serializeMap } from '../../../formats/map';
import { emptyMonster, serializeMonsters } from '../../../formats/monster';
import { scenesOf } from '../sceneData';
import { testGame } from '../testGame';
import { edgeRows, solidHurts, squeezes, wallGaps } from './solidPush';

interface Mon {
  at: [number, number];
  /** Corners: [x, y, speed]. */
  path?: [number, number, number][];
  solid?: number;
  hurt?: number;
  power?: number;
}

// prettier-ignore
const ROWS = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  '#..........#',
  '#S.........#',
  '############',
];

/** The test game's level with these monsters placed (each its own monster and picture). */
function scene(mons: Mon[], rows = ROWS, open?: (blocks: Uint8Array) => void) {
  const t = testGame(rows);
  const mon = Array.from({ length: 64 }, emptyMonster);
  const mbl = newBlockSet('mbl');
  const map = parseMap(t.files.get('test.map')!);
  open?.(map.blocks);
  mons.forEach((m, i) => {
    Object.assign(mon[i], { used: 1, power: m.power ?? 100 });
    mon[i].pic[0] = [i, 1];
    (m.path ?? []).forEach(([x, y, pic], k) => (mon[i].march[0][k] = { x, y, pic, orient: 0 }));
    mbl[i].solid = m.solid ?? 15;
    mbl[i].chHitPt = m.hurt ?? 0;
    mbl[i].pixels.fill(9);
    map.monsters[i] = { monnum: i, status: 0, xtra: 0, curx: m.at[0], cury: m.at[1], extra: 0 };
    map.mons[m.at[1] * 100 + m.at[0]] = i;
  });
  const level = t.game.scenes[2];
  level.files[3] = 'test.mon';
  level.files[4] = 'test.mbl';
  t.files.set('test.mon', serializeMonsters(mon));
  t.files.set('test.mbl', serializeBlocks(mbl));
  t.files.set('test.map', serializeMap(map));
  t.files.set('test.gam', serializeGame(t.game));
  return scenesOf(t.game, t)[0];
}

/** A pacer from (3, 5), `reach` blocks right and back. */
const pacer = (reach: number, speed = 2): Mon => ({
  at: [3, 5],
  path: [
    [reach, 0, speed],
    [0, 0, speed],
  ],
});

describe('solid monsters on the map’s edge', () => {
  // a shaft open to the top row, over open rows at the map's bottom (the far side of the edge)
  const shaft = (blocks: Uint8Array) => {
    for (let y = 0; y < 6; y++) blocks[y * 100 + 3] = 0;
    for (const y of [98, 99]) blocks[y * 100 + 3] = 0;
  };
  const lift = (to: number): Mon => ({
    at: [3, 4],
    solid: SOLBOT,
    path: [
      [0, to - 4, 1],
      [0, 0, 1],
    ],
  });

  it('finds a lift that carries the hero up to the top row', () => {
    const f = edgeRows(scene([lift(0)], ROWS, shaft));
    expect(f).toHaveLength(1);
    expect(f[0].check).toBe('push-edge');
    expect(f[0].where.cell).toBe(3);
  });

  it('passes one that stops a few rows in', () => {
    expect(edgeRows(scene([lift(2)], ROWS, shaft))).toHaveLength(0);
  });
});

describe('solid monsters that shove into walls', () => {
  it('finds a pacer that walks right up against a wall, and where it pushes the hero', () => {
    const f = wallGaps(scene([pacer(7)]));
    expect(f).toHaveLength(1);
    expect(f[0].where.monster?.n).toBe(0);
    expect(f[0].where.cell).toBe(5 * 100 + 11);
  });

  it('passes one that stops a block short, and one that isn’t solid toward the wall', () => {
    expect(wallGaps(scene([pacer(6)]))).toHaveLength(0);
    expect(wallGaps(scene([{ ...pacer(7), solid: SOLTOP | SOLBOT }]))).toHaveLength(0);
  });

  it('finds a lift that rises flush with the ceiling, with the hero on it', () => {
    const lift = (to: number): Mon => ({
      at: [5, 5],
      solid: SOLBOT,
      path: [
        [0, to - 5, 1],
        [0, 0, 1],
      ],
    });
    const f = wallGaps(scene([lift(1)]));
    expect(f.map((x) => x.where.cell)).toEqual([5]);
    // stopping with two blocks over it, the hero fits
    expect(wallGaps(scene([lift(3)]))).toHaveLength(0);
  });
});

describe('solid monsters that close in', () => {
  const left: Mon = {
    at: [2, 5],
    path: [
      [3, 0, 2],
      [0, 0, 2],
    ],
  };
  const right: Mon = {
    at: [8, 5],
    path: [
      [-3, 0, 2],
      [0, 0, 2],
    ],
  };

  it('finds two pacers that meet with the hero’s spot between them', () => {
    const f = squeezes(scene([left, right]));
    expect(f).toHaveLength(1);
    expect(f[0].check).toBe('push-squeeze');
    expect(f[0].title).toContain('0 and 1');
  });

  it('passes two that move together, as a platform of two blocks does', () => {
    const a: Mon = {
      at: [2, 5],
      path: [
        [4, 0, 2],
        [0, 0, 2],
      ],
    };
    const b: Mon = {
      at: [3, 5],
      path: [
        [4, 0, 2],
        [0, 0, 2],
      ],
    };
    expect(squeezes(scene([a, b]))).toHaveLength(0);
  });
});

describe('solid monsters that hurt', () => {
  it('notes a solid monster that hurts, offering to clear a solid top', () => {
    const f = solidHurts(scene([{ at: [5, 5], hurt: -5 }]));
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe('info');
    expect(f[0].fix).toBe('no-soltop');
    expect(solidHurts(scene([{ at: [5, 5], hurt: -5, solid: SOLBOT }]))[0].fix).toBeUndefined();
  });

  it('leaves out a hazard the hero passes through and one a touch uses up', () => {
    expect(solidHurts(scene([{ at: [5, 5], hurt: -5, solid: 0 }]))).toHaveLength(0);
    expect(solidHurts(scene([{ at: [5, 5], hurt: -5, power: 50 }]))).toHaveLength(0);
  });
});
