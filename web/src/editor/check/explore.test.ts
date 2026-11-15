// The level check's explorer and stuck finder on a tiny game built in memory (testGame.ts).
import { describe, expect, it, vi } from 'vitest';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { explore } from './explore';
import { playtestGame } from './playtest';
import { SceneSim, startCharInfo } from './sim';
import { stuckAreas } from './stuck';
import { pathTo, replayPath } from './walk/replayPath';
import { RIGHT, testGame } from './testGame';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

// The explorer searches whole scenes; under full-suite load the default 5 s timed out
// ('keeps climbing actual footings', Kaylee's Linux full run, Nov 13). Same work, more time.
vi.setConfig({ testTimeout: 60_000 });

// prettier-ignore
const ROWS = [
  '##########',
  '#........#',
  '#........#',
  '#E.S.....#',
  '######..##',
  '#c####..##',
  '######..##',
  '######..##',
  '##########',
];
const cell = (x: number, y: number) => y * MLEN + x;

describe('the level check explorer', () => {
  it('plays back a snapshot exactly', async () => {
    const t = testGame(ROWS);
    const sim = new SceneSim(t.game, 2, t, { x: 3, y: 3 });
    for (let i = 0; i < 5; i++) await sim.tick();
    const s = sim.snapshot();
    sim.hold([RIGHT]);
    for (let i = 0; i < 6; i++) await sim.tick();
    const a = sim.px;
    sim.restore(s);
    sim.hold([RIGHT]);
    for (let i = 0; i < 6; i++) await sim.tick();
    expect(sim.px).toEqual(a);
    expect(a.x).toBeGreaterThan(3 * 20);
  });

  it('finds the exit, the floor it walked, the pit it falls into, and leaves the sealed coin', async () => {
    const t = testGame(ROWS);
    const ex = await explore(t.game, 2, t, { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 });
    expect(ex.complete).toBe(true);
    expect(ex.exits.map((e) => e.toScene)).toEqual([1]);
    for (const x of [2, 4, 5]) expect(ex.heat[cell(x, 3)]).toBeGreaterThan(0);
    expect(ex.heat[cell(6, 7)]).toBeGreaterThan(0);
    expect(ex.heat[cell(1, 5)]).toBe(0);
    const stuck = stuckAreas(ex, parseMap(t.files.get('test.map')!).blocks, parseBlocks(t.files.get('test.bbl')!, BACKBL));
    expect(stuck).toHaveLength(1);
    expect(stuck[0].cells.every((c) => Math.floor(c / MLEN) === 7)).toBe(true);
    expect(stuck[0].reason).toBe('drop');
  });

  it('plays a whole game from the title link to the won scene', async () => {
    const t = testGame(ROWS);
    const run = await playtestGame(t.game, t);
    expect(run.won).toBe(true);
    expect(run.runs.map((r) => r.scene)).toEqual([2]);
  });

  it('calls a pit the hero only dies in a death, not a place to get stuck', async () => {
    // the same pit, its floor spikes that hurt on every tick: in it, every move ends in a death
    const t = testGame(ROWS.map((r, y) => (y === 7 ? '######^^##' : r)));
    const ex = await explore(t.game, 2, t, { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 });
    expect(ex.complete).toBe(true);
    expect(ex.incidents.some((i) => i.kind === 'death')).toBe(true);
    expect(stuckAreas(ex, parseMap(t.files.get('test.map')!).blocks, parseBlocks(t.files.get('test.bbl')!, BACKBL))).toHaveLength(0);
  });

  it('knows spikes the hero can step off don’t hold him', async () => {
    // spikes on the open floor by the start: the bot walks and waits on them, but a step gets away
    const t = testGame(['##########', '#........#', '#........#', '#E.S^^...#', '##########']);
    const ex = await explore(t.game, 2, t, { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 }, { waitEverywhere: true });
    expect(ex.places.some((p) => p.cell === cell(6, 3) && p.hp < 100)).toBe(true);
    expect(ex.incidents.filter((i) => i.kind === 'hurt-lock')).toHaveLength(0);
  });
});

it('can replay a steering decision during a fall before the hero lands', async () => {
  const t = testGame(['############', ...Array.from({ length: 14 }, () => '#..........#'), '############']);
  const entry = { start: { x: 3, y: 2 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, {
    steadyTicks: 3,
    steerAirborne: true,
    stopWhen: (w) => w.ci.gravy > 0 && w.chr.y[0] > entry.start.y,
  });
  expect(ex.reached).toBeDefined();
  const place = ex.places[ex.reached!];
  expect(place.cell / 100).toBeLessThan(14);
  expect(place.via!.ticks).toBeGreaterThanOrEqual(9);
  const replay = await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, place.via!));
  expect(replay?.link).toBe(-1);
  expect(replay?.ci.gravy).toBeGreaterThan(0);
  expect(replay!.world.chr.y[0] * 100 + replay!.world.chr.x[0]).toBe(place.cell);
});

it('keeps a healed return to a state first reached with fewer hit points', async () => {
  const t = testGame(['##########', '#........#', '#........#', '#S..c...E#', '##########']);
  const blocks = parseBlocks(t.files.get('test.bbl')!, BACKBL);
  Object.assign(blocks[2], { scorePts: 0, chHitPt: 20 });
  t.files.set('test.bbl', serializeBlocks(blocks));
  const ci = startCharInfo();
  ci.hitpts = 1;
  const ex = await explore(
    t.game,
    2,
    t,
    { start: { x: 1, y: 3 }, ci, clock: 1 },
    { goal: [301], steadyTicks: 3, stopWhen: (w) => w.chr.x[0] === 1 && w.ci.hitpts > 1 },
  );
  expect(ex.reached).toBeDefined();
  expect(ex.places[ex.reached!].hp).toBeGreaterThan(1);
});

it('keeps replayable routes to the same exit with different supplies', async () => {
  const t = testGame(['##########', '#........#', '#........#', '#E.S.c...#', '##########']);
  const blocks = parseBlocks(t.files.get('test.bbl')!, BACKBL);
  Object.assign(blocks[2], { scorePts: 0, effect: 20, eamt: 1 });
  t.files.set('test.bbl', serializeBlocks(blocks));
  const entry = { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, { steerAirborne: true, steadyTicks: 3, maxNodes: 2000 });
  expect(ex.exits.some((e) => e.ci.meter[20] === 1)).toBe(true);
  const loaded = ex.exits.find((e) => e.ci.meter[20] > 1);
  expect(loaded).toBeDefined();
  const replay = await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, loaded!.via));
  expect(replay?.link).toBe(loaded!.link);
  expect(replay?.ci.meter[20]).toBe(loaded!.ci.meter[20]);
});

it('steers through a narrow shaft before jumping onto its upper ledge', async () => {
  const t = testGame(['##########', '#........#', '#.......E#', '#.#.######', '#S.......#', '##.......#', '##########']);
  const chr = parseCharacter(t.get('test.chr')!);
  for (const [seq, key, dx] of [
    [7, 72, 0],
    [8, 71, -8],
    [9, 73, 8],
  ]) {
    const s = chr.sequences[seq];
    s.key = key << 8;
    for (let i = 0; i < 4; i++) Object.assign(s.frames[i], { x: dx, y: i === 3 ? -10 : -12, pic1: 0, pic2: 1, pause: 1 });
  }
  t.files.set('test.chr', serializeCharacter(chr));
  const entry = { start: { x: 1, y: 4 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, {
    goal: [208],
    steerAirborne: true,
    steadyTicks: 3,
    steadySteering: true,
    exact: true,
    stopAt: () => true,
    maxNodes: 20000,
  });
  expect(ex.exits).not.toHaveLength(0);
  const replay = await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, ex.exits[0].via));
  expect(replay?.link).toBe(0);
});

it('steers a continuously flying character through a vertical passage', async () => {
  const t = testGame(['#####', '#E..#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#S..#', '#####']);
  const blocks = parseBlocks(t.get('test.bbl')!, BACKBL);
  blocks[0].grav = 15; // Opposing directions cancel, as in a free-flight area.
  t.files.set('test.bbl', serializeBlocks(blocks));
  const chr = parseCharacter(t.get('test.chr')!);
  const up = chr.sequences[7];
  up.key = 0x4800;
  for (const frame of up.frames) Object.assign(frame, { x: 0, y: -2, pic1: 0, pic2: 1, pause: 1 });
  t.files.set('test.chr', serializeCharacter(chr));
  const entry = { start: { x: 1, y: 8 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, {
    goal: [101],
    steerAirborne: true,
    steadyTicks: 3,
    steadySteering: true,
    moveFilter: (move) => move.name.startsWith('walk'),
    stopAt: () => true,
  });
  expect(ex.exits).not.toHaveLength(0);
  const r = await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, ex.exits[0].via));
  expect(r?.link).toBe(0);
});

it('keeps climbing actual footings rather than chasing nearby platforms in the air', async () => {
  const rows = Array.from({ length: 34 }, (_, y) => (y === 0 || y === 33 ? '#'.repeat(18) : '#' + '.'.repeat(16) + '#'));
  rows[2] = '#...............E#';
  rows[3] = '#.#.##############';
  for (let y = 5; y <= 31; y += 2) {
    const x = y % 4 === 1 ? 1 : 2;
    rows[y] = rows[y].slice(0, x) + '#' + rows[y].slice(x + 1);
  }
  const t = testGame(rows);
  const chr = parseCharacter(t.get('test.chr')!);
  for (const s of chr.sequences) for (const f of s.frames) if (f.pic2 < 50) f.pic1 = 50;
  for (const [seq, key, dx] of [
    [7, 72, 0],
    [8, 71, -8],
    [9, 73, 8],
  ]) {
    const s = chr.sequences[seq];
    s.key = key << 8;
    for (let i = 0; i < 4; i++) Object.assign(s.frames[i], { x: dx, y: i === 3 ? -10 : -12, pic1: 50, pic2: 0, pause: 1 });
  }
  t.files.set('test.chr', serializeCharacter(chr));
  const entry = { start: { x: 2, y: 32 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, {
    goal: [216],
    steadyTicks: 3,
    steadySteering: true,
    steerAirborne: true,
    stopAt: () => true,
    maxNodes: 12000,
    now: () => 0,
  });
  expect(ex.exits).not.toHaveLength(0);
  expect((await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, ex.exits[0].via)))?.link).toBe(0);
});

it('can turn in a one-cell top-down corridor before a long walk animation finishes', async () => {
  const t = testGame(['##########', '#S.......#', '#####.####', '#####.####', '#####E####', '##########']);
  const blocks = parseBlocks(t.get('test.bbl')!, BACKBL);
  blocks[0].grav = 0;
  t.files.set('test.bbl', serializeBlocks(blocks));
  const chr = parseCharacter(t.get('test.chr')!);
  for (const [seq, key, dx, dy] of [
    [5, 77, 10, 0],
    [6, 75, -10, 0],
    [7, 80, 0, 10],
    [8, 72, 0, -10],
  ]) {
    const s = chr.sequences[seq];
    s.key = key << 8;
    for (let i = 0; i < 6; i++) Object.assign(s.frames[i], { x: dx, y: dy, pic1: 50, pic2: 0, pause: 1 });
  }
  chr.sequences[0].frames[0].pic1 = 50;
  t.files.set('test.chr', serializeCharacter(chr));
  const entry = { start: { x: 1, y: 1 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, {
    goal: [405],
    steerAirborne: true,
    alignTurns: true,
    steadyTicks: 3,
    steadySteering: true,
    stopAt: () => true,
    maxNodes: 3000,
    now: () => 0,
  });
  expect(ex.exits).not.toHaveLength(0);
  const r = await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, ex.exits[0].via));
  expect(r?.link).toBe(0);
});

it('keeps short vertical steps aligned in a corridor when other terrain has gravity', async () => {
  const t = testGame(['#####', '#S.c#', '#.###', '#.###', '#E###', '#####']);
  const blocks = parseBlocks(t.get('test.bbl')!, BACKBL);
  blocks[0].grav = 15; // Canceled pulls in the corridor, downward pull on the coin.
  t.files.set('test.bbl', serializeBlocks(blocks));
  const chr = parseCharacter(t.get('test.chr')!);
  const down = chr.sequences[7];
  down.key = 0x5000;
  down.norepeat = 1;
  for (let i = 0; i < 3; i++) Object.assign(down.frames[i], { x: 0, y: 1, pic1: 50, pic2: 0, pause: 1 });
  chr.sequences[0].frames[0].pic1 = 50;
  t.files.set('test.chr', serializeCharacter(chr));
  const entry = { start: { x: 1, y: 1 }, ci: startCharInfo(), clock: 1 };
  const ex = await explore(t.game, 2, t, entry, {
    goal: [401],
    steerAirborne: true,
    alignTurns: true,
    steadyTicks: 3,
    steadySteering: true,
    moveFilter: (move) => move.name.startsWith('walk 80'),
    stopAt: () => true,
    maxNodes: 500,
    now: () => 0,
  });
  expect(ex.gravity).toBe(true);
  expect(ex.exits).not.toHaveLength(0);
  const replay = await replayPath(t.game, t, 2, entry, ex.moves, pathTo(ex, ex.exits[0].via));
  expect(replay?.link).toBe(0);
});
