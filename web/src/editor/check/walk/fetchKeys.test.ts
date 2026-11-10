// The walkthrough bot fetches a key that sits off the route before the locked door on it.
import { describe, expect, it } from 'vitest';
import { newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameFiles } from '../../../project/files';
import { startCharInfo } from '../sim';
import { testGame, type TestGame } from '../testGame';
import { autoWalk } from './autoWalk';
import { lockedWhy } from './gates';
import { fetchKeys, locksAtEntry, MAX_KEY_TRIPS, tripCapReached } from './fetchKeys';
import { verifyWalk } from './verify';

// the start is in the middle: the key is to the left, the door and the exit to the right
// prettier-ignore
const ROWS = [
  '################',
  '#..............#',
  '#..............#',
  '#k.....S...D..E#',
  '################',
];
const KEY = 4;
const DOOR = 5;

/** testGame's level with the key and door painted in: both read counter 20, the door takes `takes`. */
function lockedGame(rows: string[] = ROWS, takes = 1): TestGame {
  const t = testGame(rows);
  const bbl = parseBlocks(t.files.get('test.bbl')!, newBlockSet('bbl').length);
  Object.assign(bbl[KEY], { grav: 4, effect: 20, eamt: 1, touchBl: 0 });
  bbl[KEY].pixels.fill(14);
  Object.assign(bbl[DOOR], { solid: 15, effect: 20, eamt: -takes, touchBl: 0 });
  bbl[DOOR].pixels.fill(6);
  const map = parseMap(t.files.get('test.map')!);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'k') map.blocks[y * MLEN + x] = KEY;
      if (ch === 'D') map.blocks[y * MLEN + x] = DOOR;
    }),
  );
  t.files.set('test.bbl', serializeBlocks(bbl));
  t.files.set('test.map', serializeMap(map));
  return t;
}

// two keys for the one door, at opposite ends: two trips from the middle
// prettier-ignore
const TWO = [
  '################',
  '#..............#',
  '#..............#',
  '#k.....S...D..E#',
  '################',
];
TWO[3] = '#k.....S..kD..E#';

describe('fetching keys', () => {
  it('sees the door and what adds to its counter', () => {
    const t = lockedGame();
    const l = locksAtEntry(t.game, t, 2, { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 });
    expect([...l.wanted]).toEqual([20]);
    expect(l.sources).toHaveLength(1);
  });

  it('reports a reachable key on a successful route', async () => {
    const t = lockedGame();
    const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
    const locks = locksAtEntry(t.game, t, 2, entry);
    const r = await fetchKeys(t.game, t, 2, entry, locks, { goal: [3 * MLEN + 14], wanted: new Set([0]), budgetMs: 10_000, now: () => 0 });
    expect(r.replay?.link).toBe(0);
    expect(r.diagnostics.cutoff).toBeNull();
    const keyRounds = r.diagnostics.rounds.filter((round) => round.kind === 'key');
    // Character initialization is not a pickup: one actual key, one key trip.
    expect(keyRounds).toHaveLength(1);
    const key = keyRounds[0];
    const exit = r.diagnostics.rounds.at(-1)!;
    expect(key).toMatchObject({
      kind: 'key',
      source: { counter: 20, cell: 3 * MLEN + 1 },
      candidates: [{ counter: 20, cell: 3 * MLEN + 1 }],
      budgetMs: 5_000,
      ms: 0,
      complete: false,
      nearestGoalDistance: 0,
      cutoff: null,
    });
    expect(key.places).toBeGreaterThan(1);
    expect(exit).toMatchObject({ kind: 'exit', source: null, candidates: [], budgetMs: 5_000, ms: 0, complete: false, cutoff: null });
    expect(exit.places).toBeGreaterThan(1);
    expect(r.diagnostics.rounds.every((round) => round.kind === 'key' || round.cutoff === null)).toBe(true);
    // the key is 6 cells back, the door 4 forward: far more than the direct 7 cells to the exit
    expect(r.replay!.ticks).toBeGreaterThan(60);
  }, 60_000);

  it('accounts for key rounds before the exit search', async () => {
    const t = lockedGame();
    const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
    const locks = locksAtEntry(t.game, t, 2, entry);
    const r = await fetchKeys(t.game, t, 2, entry, locks, { goal: [3 * MLEN + 14], wanted: new Set([0]), budgetMs: 10_000, now: () => 0 });
    expect(r.replay?.link).toBe(0);
    expect(r.diagnostics.cutoff).toBeNull();
    const exit = r.diagnostics.rounds.at(-1)!;
    expect(exit).toMatchObject({ kind: 'exit', source: null, candidates: [], cutoff: null });
    expect(r.diagnostics.rounds.slice(0, -1)).not.toHaveLength(0);
    expect(r.diagnostics.rounds.slice(0, -1).every((round) => round.kind === 'key' && round.source?.counter === 20 && round.cutoff === null)).toBe(true);
  }, 60_000);

  it('records an unreachable source as a completed no-reachable-state search', async () => {
    const t = lockedGame(ROWS.map((row) => row.replace('k', '.')));
    const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
    const locks = locksAtEntry(t.game, t, 2, entry);
    const sourceCell = 3 * MLEN;
    locks.wanted = new Set([20]);
    locks.sources = [{ counter: 20, cell: sourceCell }];
    const r = await fetchKeys(t.game, t, 2, entry, locks, { goal: [3 * MLEN + 14], wanted: new Set([0]), budgetMs: 10_000, now: () => 0 });
    expect(r.replay).toBeUndefined();
    expect(r.diagnostics.cutoff).toBe('no-reachable-state');
    expect(r.diagnostics.rounds.length).toBeGreaterThan(0);
    const terminal = r.diagnostics.rounds.at(-1)!;
    expect(terminal).toMatchObject({
      kind: 'key',
      source: { counter: 20, cell: sourceCell },
      candidates: [{ counter: 20, cell: sourceCell }],
      budgetMs: 5_000,
      ms: 0,
      complete: true,
      cutoff: 'no-reachable-state',
    });
    expect(terminal.places).toBeGreaterThan(1);
    expect(terminal.nearestGoalDistance).toBeGreaterThan(0);
  }, 60_000);

  it('records a budget cutoff without waiting', async () => {
    const t = lockedGame();
    const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
    const locks = locksAtEntry(t.game, t, 2, entry);
    const r = await fetchKeys(t.game, t, 2, entry, locks, { goal: [3 * MLEN + 14], wanted: new Set([0]), budgetMs: 0, now: () => 0 });
    expect(r.replay).toBeUndefined();
    expect(r.diagnostics.cutoff).toBe('budget');
    expect(r.diagnostics.rounds).toEqual([
      expect.objectContaining({
        kind: 'key',
        source: null,
        candidates: [{ counter: 20, cell: 3 * MLEN + 1 }],
        budgetMs: 0,
        ms: 0,
        places: 0,
        complete: false,
        nearestGoalDistance: 6,
        exits: 0,
        deaths: 0,
        incidents: 0,
        cutoff: 'budget',
      }),
    ]);
  });

  it('still finishes the level, and the engine agrees', async () => {
    const t = lockedGame();
    const r = await autoWalk(t.game, t, 'test', { budgetMs: 10_000 });
    expect(r.won).toBe(true);
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.won).toBe(true);
  }, 60_000);

  it('goes back for a second key when one trip is not enough', async () => {
    const t = lockedGame(TWO);
    const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
    const locks = locksAtEntry(t.game, t, 2, entry);
    const r = await fetchKeys(t.game, t, 2, entry, locks, { goal: [3 * MLEN + 14], wanted: new Set([0]), budgetMs: 10_000 });
    expect(r.replay?.link).toBe(0);
  }, 60_000);

  it('says plainly when a key exists but was never reached', () => {
    const t = lockedGame();
    const l = locksAtEntry(t.game, t, 2, { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 });
    const why = lockedWhy(l, new Set([20]))!;
    expect(why).toContain('counter 20');
    expect(why).toContain('never got to enough of it in its time');
    expect(why).toContain('dismiss');
  });
});

describe('the key trip cap', () => {
  // a door that takes both keys: each trip stops at the first key, so it takes two trips
  const entry = { start: { x: 7, y: 3 }, ci: startCharInfo(), clock: 1 };
  const fetchBoth = (maxTrips?: number) => {
    const t = lockedGame(TWO, 2);
    const locks = locksAtEntry(t.game, t, 2, entry);
    const unreached = new Set<number>();
    const run = fetchKeys(t.game, t, 2, entry, locks, {
      goal: [3 * MLEN + 14],
      wanted: new Set([0]),
      budgetMs: 10_000,
      unreached,
      ...(maxTrips ? { maxTrips } : {}),
    });
    return { locks, unreached, run };
  };

  it('is a named bound well above the audited 272 trips', () => {
    expect(MAX_KEY_TRIPS).toBe(400);
  });

  it('a normal door is paid well under the cap', async () => {
    const { unreached, run } = fetchBoth();
    const r = await run;
    expect(r.replay?.link).toBe(0);
    expect(r.diagnostics.cutoff).toBeNull();
    const trips = r.diagnostics.rounds.filter((round) => round.kind === 'key').length;
    expect(trips).toBeGreaterThanOrEqual(2);
    expect(trips).toBeLessThan(MAX_KEY_TRIPS);
    expect(tripCapReached(r.diagnostics)).toBeUndefined();
    expect(unreached.size).toBe(0);
  }, 60_000);

  it('stops cleanly at the cap and says so', async () => {
    const { locks, unreached, run } = fetchBoth(1);
    const r = await run;
    expect(r.replay).toBeUndefined();
    expect(r.diagnostics.cutoff).toBe('round-limit');
    expect(r.diagnostics.rounds).toHaveLength(1);
    expect(r.diagnostics.rounds[0]).toMatchObject({ kind: 'key', cutoff: 'round-limit' });
    expect([...unreached]).toEqual([20]);
    expect(tripCapReached(r.diagnostics, 1)).toBe(1);
    // the default cap was not what stopped it
    expect(tripCapReached(r.diagnostics)).toBeUndefined();
    const why = lockedWhy(locks, unreached, new Map(), tripCapReached(r.diagnostics, 1))!;
    expect(why).toBe(
      'The door at (11, 3) needs counter 20: a key for it is on the map (first at (1, 3)), but the bot stopped at its limit of 1 trip for keys before it had enough. That is only what the bot saw: it cannot judge a jump or a trick a player could make, so if you can reach it, dismiss this.',
    );
    expect(why).not.toContain('in its time');
  }, 60_000);
});

it('keeps a required pickup collected on the wanted exit', async () => {
  const t = testGame(['########', '#......#', '#......#', '#S....E#', '########']);
  const blocks = parseBlocks(t.files.get('test.bbl')!, newBlockSet('bbl').length);
  Object.assign(blocks[KEY], { grav: 4, effect: 20, eamt: 1, touchBl: 0 });
  const map = parseMap(t.files.get('test.map')!);
  map.blocks[306] = KEY;
  t.files.set('test.bbl', serializeBlocks(blocks));
  t.files.set('test.map', serializeMap(map));
  const required = { owed: new Map([[20, 1]]), wanted: new Set([20]), sources: [{ counter: 20, cell: 306 }] };
  const result = await fetchKeys(t.game, t, 2, { start: { x: 1, y: 3 }, ci: startCharInfo(), clock: 1 }, required, {
    goal: [306],
    wanted: new Set([0]),
    budgetMs: 1000,
    now: () => 0,
  });
  expect(result.replay?.link).toBe(0);
  expect(result.replay?.ci.meter[20]).toBe(2);
  expect(result.diagnostics.cutoff).toBeNull();
});
