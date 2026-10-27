// The states of one place printed as one Level Map: which levels merge (the same map, a nearly
// identical one; not a similar one, a renumbered one or another part of the map), and that every
// state's marks survive. Then Depth Perception's near and far planes on the real disk.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADVTYPE, parseGame, type Game, type Scene } from '../../formats/game';
import { MLEN, MWID } from '../../formats/map';
import { levelsOf, type Level } from './levelMapLayout';
import { mergeStates, samePlace } from './levelStates';
import VIEWS from './levelViews.json';
import SECRETS from './levelSecrets.json';
import type { LevelViews } from './levelViews';

const scene = (desc: string, files: string[], links: [number, number, number][] = []): Scene =>
  ({
    gametype: ADVTYPE,
    pos: { x: 0, y: 0 },
    desc,
    files,
    numLinks: links.length,
    links: links.map(([toScene, fx, fy]) => ({ toScene, from: { x: fx, y: fy }, to: { x: 0, y: 0 } })),
  }) as unknown as Scene;

/** 0 and 1 unused; 2 near, 3 far (each pulls focus to the other at 12,10; both leave for 4 at 20,10); 4 next. */
const game = {
  scenes: [
    scene('', []),
    scene('', []),
    scene(
      '1. Near: Garden',
      ['a.pal', 'near.map', 'near.bbl'],
      [
        [3, 12, 10],
        [4, 20, 10],
      ],
    ),
    scene(
      '1. Far: Garden',
      ['a.pal', 'far.map', 'far.bbl'],
      [
        [2, 12, 10],
        [4, 20, 10],
        [5, 15, 12],
      ],
    ),
    scene('2. Next', ['b.pal', 'b.map', 'b.bbl']),
    scene('Hidden room', ['a.pal', 'far.map', 'far.bbl']),
  ],
} as unknown as Game;

/** A 30 x 12 room of block 1 walls with block 2 floor, padded with block 0. */
function room(): Uint8Array {
  const cells = new Uint8Array(MLEN * MWID);
  for (let y = 5; y < 17; y++) for (let x = 5; x < 35; x++) cells[y * MLEN + x] = y === 5 || y === 16 || x === 5 || x === 34 ? 1 : 2;
  return cells;
}

/** `n` cells of the room changed to block 3. */
function changed(n: number): Uint8Array {
  const cells = room();
  for (let k = 0; k < n; k++) cells[(6 + Math.floor(k / 28)) * MLEN + 6 + (k % 28)] = 3;
  return cells;
}

const level = (scenes: number[], map: string, bbl: string, cells: Uint8Array, marks: Level['marks'] = [], area = { x: 4, y: 4, w: 32, h: 14 }): Level => ({
  group: { map, bbl, scenes },
  cells,
  area,
  whole: area,
  marks,
  name: game.scenes[scenes[0]].desc,
  scene: scenes[0],
});

const mark = (kind: 'start' | 'exit' | 'end', x: number, y: number, scenes: number[]): Level['marks'][number] => ({ kind, x, y, w: 1, h: 1, scenes });

describe('one Level Map for the states of one place', () => {
  it('merges the same map in another block set, and a copy with a few blocks changed', () => {
    expect(samePlace(level([2], 'near.map', 'near.bbl', room()), level([3], 'near.map', 'far.bbl', room()))).toBe(true);
    // 4% of the 360 room cells changed: still the same place
    expect(samePlace(level([2], 'near.map', 'near.bbl', room()), level([3], 'far.map', 'far.bbl', changed(14)))).toBe(true);
  });

  it('keeps apart a similar map, one built alike from other blocks, and another part of the same map', () => {
    // 10% changed: a different level that looks like it
    expect(samePlace(level([2], 'near.map', 'near.bbl', room()), level([3], 'far.map', 'far.bbl', changed(36)))).toBe(false);
    // the same layout from other block numbers
    const renumbered = room().map((b) => (b ? b + 10 : 0));
    expect(samePlace(level([2], 'near.map', 'near.bbl', room()), level([3], 'far.map', 'far.bbl', renumbered))).toBe(false);
    // one map file, seen in two places that don't overlap
    expect(
      samePlace(
        level([2], 'near.map', 'near.bbl', room(), [], { x: 4, y: 4, w: 12, h: 14 }),
        level([3], 'near.map', 'far.bbl', room(), [], { x: 22, y: 4, w: 14, h: 14 }),
      ),
    ).toBe(false);
    // a course or a map that wraps stays its own
    const course = { ...level([3], 'near.map', 'far.bbl', room()), unrolled: { box: [0, 0, 100, 100], loops: [true, false] } } as Level;
    expect(samePlace(level([2], 'near.map', 'near.bbl', room()), course)).toBe(false);
  });

  it('prints one map: every scene, the union of the views, drawn from the first state, with what differs', () => {
    const near = level([2], 'near.map', 'near.bbl', room(), [], { x: 4, y: 4, w: 20, h: 14 });
    const far = level([3, 5], 'far.map', 'far.bbl', changed(2), [], { x: 10, y: 4, w: 26, h: 14 });
    const other = level([4], 'b.map', 'b.bbl', changed(100));
    const out = mergeStates(game, [near, other, far]);
    expect(out).toHaveLength(2);
    const [one] = out;
    expect(one.group.scenes).toEqual([2, 3, 5]);
    expect(one.group.bbl).toBe('near.bbl');
    expect(one.scene).toBe(2);
    expect(one.area).toEqual({ x: 4, y: 4, w: 32, h: 14 });
    expect(one.states).toBe(2);
    expect(one.name).toBe('1. Near: Garden');
    expect(one.note).toBe('near and far: one place, a block set each and 2 blocks change; drawn as near');
    expect(out[1]).toBe(other);
  });

  it('keeps every state’s marks: those on the same blocks joined, a way out only one state has saying which', () => {
    const near = level([2], 'near.map', 'near.bbl', room(), [mark('start', 11, 10, [2]), mark('exit', 12, 10, [3]), mark('exit', 20, 10, [4])]);
    const far = level([3, 5], 'far.map', 'far.bbl', room(), [
      mark('start', 13, 10, [3]),
      mark('exit', 12, 10, [2]),
      mark('exit', 20, 10, [4]),
      mark('exit', 15, 12, [5]),
    ]);
    const [one] = mergeStates(game, [near, far]);
    const show = (m: Level['marks'][number]) => `${m.kind} ${m.x},${m.y} ${m.scenes.join(',')}${m.text ? ` "${m.text}"` : ''}`;
    expect(one.marks.map(show)).toEqual(['start 11,10 2', 'start 13,10 3', 'exit 12,10 2,3', 'exit 20,10 4', 'exit 15,12 5 "5 from far"']);
  });

  it('leaves a level with no other state as it was', () => {
    const only = level([4], 'b.map', 'b.bbl', room());
    expect(mergeStates(game, [only])[0]).toBe(only);
  });
});

describe('Depth Perception', () => {
  it('prints each world once, its near and far planes together, every mark of both kept', () => {
    const id = 'depth';
    const v = (VIEWS as unknown as LevelViews)[id];
    const dir = join(__dirname, '../../../../games', id, 'disk');
    const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
    const g = parseGame(files.get('depth.gam')!);
    const levels = levelsOf(g, { get: (n) => files.get(n.toLowerCase()) }, (SECRETS as Record<string, Record<string, number[]>>)[id], v.maps, v.unrolled ?? {});
    const out = mergeStates(g, levels);
    expect(out.map((l) => l.group.scenes)).toEqual([
      [2, 3, 4],
      [5, 6, 7],
      [8, 9, 10, 20],
      [11, 12, 13],
      [14, 15, 16],
      [17, 18, 19],
    ]);
    for (const l of out) {
      expect(l.note).toMatch(/^near and far: one place, a block set each/);
      // every mark of every plane is on the merged map, at its place, with its scenes
      for (const m of levels.filter((x) => x.group.scenes.every((n) => l.group.scenes.includes(n))).flatMap((x) => x.marks))
        expect(l.marks.some((o) => o.kind === m.kind && o.x === m.x && o.y === m.y && m.scenes.every((n) => o.scenes.includes(n)))).toBe(true);
    }
  });
});
