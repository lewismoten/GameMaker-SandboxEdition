// The walkthrough bot keeps to walking paths (walkPaths.ts, pathRoute.ts): on a top-down map
// built in memory (testGame.ts, made top-down here) a road that bends round an open field is
// walked when it is only modestly longer than cutting across, and not when it is a long detour.
import { describe, expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '../../../formats/blocks';
import { parseCharacter, serializeCharacter } from '../../../formats/character';
import { MLEN, parseMap, serializeMap } from '../../../formats/map';
import { explore } from '../explore';
import { startCharInfo } from '../sim';
import { testGame, type TestGame } from '../testGame';
import { autoWalk } from './autoWalk';
import { preferPathRoute } from './pathRoute';
import { guessWalkPaths, readWalkPaths, setWalkPaths } from './walkPaths';

const PATH = 4;
const UP = 0x48;
const DOWN = 0x50;

/** rows: '#' wall, '.' grass, 'r' road, 'S' start and 'E' exit (both on the road). No gravity: four ways to walk. */
function topDown(rows: string[]): TestGame & { start: { x: number; y: number } } {
  const t = testGame(rows.map((r) => r.replace(/r/g, '.')));
  const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
  for (const b of bbl) b.grav = 0;
  bbl[PATH].pixels.fill(6);
  t.files.set('test.bbl', serializeBlocks(bbl));
  const map = parseMap(t.files.get('test.map')!);
  let start = { x: 1, y: 1 };
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if ('rSE'.includes(ch)) map.blocks[y * MLEN + x] = PATH;
      if (ch === 'S') start = { x, y };
    }),
  );
  t.files.set('test.map', serializeMap(map));
  const chr = parseCharacter(t.files.get('test.chr')!);
  const walk = (seq: number, key: number, dy: number) => {
    const s = chr.sequences[seq];
    s.key = key << 8;
    for (let i = 0; i < 4; i++) s.frames[i] = { x: 0, y: dy, orient: 0, pic1: 0, pic2: 1, pause: 1, extra: new Uint8Array(5) };
  };
  walk(7, UP, -4);
  walk(8, DOWN, 4);
  t.files.set('test.chr', serializeCharacter(chr));
  return { ...t, start };
}

// prettier-ignore
const BEND = [
  '##############',
  '#S..........E#',
  '#r..........r#',
  '#r..........r#',
  '#rrrrrrrrrrrr#',
  '##############',
];
// prettier-ignore
const DETOUR = [
  '##############',
  '#S..........E#',
  ...Array.from({ length: 9 }, () => '#r..........r#'),
  '#rrrrrrrrrrrr#',
  '##############',
];

const fit = (ticks: number, moving: number, onPath: number) => ({ ticks, moving, onPath });

describe('choosing the route that keeps to the paths', () => {
  it('takes the path route when it walks more of the paths for modestly more time', () => {
    expect(preferPathRoute(fit(100, 90, 20), fit(140, 130, 125))).toBe(true);
    // a short scene has two seconds of room even when that is more than half again
    expect(preferPathRoute(fit(40, 40, 0), fit(75, 75, 75))).toBe(true);
  });
  it('keeps the quickest route for a long detour, a path route no more on the paths, or none', () => {
    expect(preferPathRoute(fit(100, 90, 20), fit(200, 190, 190))).toBe(false);
    expect(preferPathRoute(fit(100, 90, 80), fit(110, 100, 90))).toBe(false);
    expect(preferPathRoute(fit(100, 90, 20), undefined)).toBe(false);
  });
});

describe('walking paths in the companion', () => {
  it('keeps whole block numbers in range, once each, and removes the section when empty', () => {
    const kept = new Map<string, unknown>();
    const store = {
      extras: <T>(f: string, s: string, d: T) => (kept.get(`${f}:${s}`) as T) ?? d,
      setExtras: (f: string, s: string, v: unknown) => (v === undefined ? kept.delete(`${f}:${s}`) : kept.set(`${f}:${s}`, v)),
    };
    setWalkPaths(store, 'town.bbl', [7, 3, 3, -1, 2.5, 999]);
    expect(readWalkPaths(store, 'town.bbl')).toEqual([3, 7]);
    setWalkPaths(store, 'town.bbl', []);
    expect(kept.size).toBe(0);
  });
  it('guesses the blocks of path terrains and of terrains named like roads, never the ground round them', () => {
    const terrains = [
      { kind: 'path' as const, name: 'Terrain 1', tiles: [5, 6, -1], outside: 0 },
      { kind: 'edges' as const, name: 'Dirt road', tiles: [9, 10, 0], outside: 0 },
      { kind: 'edges' as const, name: 'Pond', tiles: [20, 21], outside: 0 },
    ];
    expect(guessWalkPaths(terrains)).toEqual([5, 6, 9, 10]);
  });
});

describe('the bot keeps to the road', () => {
  it('searches along the road first when asked, and exactly as before when not', async () => {
    const t = topDown(BEND);
    const entry = { start: t.start, ci: startCharInfo(), clock: 1 };
    const goal = [1 * MLEN + 12];
    const plain = await explore(t.game, 2, t, entry, { goal, stopAt: () => true });
    const again = await explore(t.game, 2, t, entry, { goal, stopAt: () => true, paths: { blocks: new Set() } });
    expect(again.places.map((p) => p.cell)).toEqual(plain.places.map((p) => p.cell));
    const road = await explore(t.game, 2, t, entry, { goal, stopAt: () => true, paths: { blocks: new Set([PATH]) } });
    // the way to the exit, place by place: down the road, along it and up, never across the
    // field (a walk ends as the hero's cell changes, so he rests a pixel or so over the road's edge)
    const exit = road.exits[0];
    const cells: number[] = [];
    for (let p = exit.via.parent; p > 0; p = road.places[p].via!.parent) cells.push(road.places[p].cell);
    expect(cells.length).toBeGreaterThan(14);
    for (const c of cells) expect(Math.floor(c / MLEN) > 2 || c % MLEN < 2 || c % MLEN > 11).toBe(true);
  }, 30_000);

  it('walks the bend in the road instead of cutting across the field', async () => {
    const t = topDown(BEND);
    const direct = await autoWalk(t.game, t, 'test');
    expect(direct.won).toBe(true);
    expect(direct.scenes[0].paths).toBeUndefined();
    const r = await autoWalk(t.game, t, 'test', { paths: { 'test.bbl': [PATH] } });
    expect(r.won).toBe(true);
    expect(r.scenes[0].paths?.kept).toBe(true);
    expect(r.scenes[0].paths!.share).toBeGreaterThan(0.9);
    expect(r.scenes[0].ticks!).toBeGreaterThan(direct.scenes[0].ticks!);
  }, 60_000);

  it('cuts across when the road is a long way round', async () => {
    const t = topDown(DETOUR);
    const r = await autoWalk(t.game, t, 'test', { paths: { 'test.bbl': [PATH] } });
    expect(r.won).toBe(true);
    expect(r.scenes[0].paths?.kept).toBe(false);
  }, 60_000);
});
