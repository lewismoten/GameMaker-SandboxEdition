// The level check's ways back and ways through (wayBack.ts), with steady hands' moves
// (inputs.ts steadyMoves), on the tiny game in testGame.ts and on runs made up by hand.
import { describe, expect, it } from 'vitest';
import { MLEN } from '../../../formats/map';
import { explore, type Exploration, type ExitReach } from '../explore';
import { steadyMoves, type Move } from '../inputs';
import { playtestScene, type Playtest, type SceneRun } from '../playtest';
import { startCharInfo } from '../sim';
import { LEFT, RIGHT, testGame } from '../testGame';
import { describeMove, leftBehind, oneWay, softlocks, steadyFindings } from './wayBack';

// prettier-ignore
const LEDGE = [
  '##########',
  '#........#',
  '#..S.....#',
  '#####....#',
  '#........#',
  '#E.......#',
  '##########',
];
const cell = (x: number, y: number) => y * MLEN + x;

describe('one-way spots', () => {
  it('finds the drop off a ledge the hero can’t climb back', async () => {
    const run = (await playtestScene(testGame(LEDGE).game, testGame(LEDGE), 2))!;
    expect(run.ex.complete).toBe(true);
    const f = oneWay(run, undefined);
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/^One-way at \(4, 2\): the hero can’t get back to the start from \(\d, 5\)$/);
    expect(f[0].detail).toMatch(/^A 3-block drop/);
  });

  it('finds none on a flat floor', async () => {
    const t = testGame(['##########', '#........#', '#........#', '#E.S.....#', '##########']);
    expect(oneWay((await playtestScene(t.game, t, 2))!, undefined)).toEqual([]);
  });
});

describe('things left behind', () => {
  const ci = (inv: number[], money = 0) => {
    const c = startCharInfo();
    inv.forEach((b, i) => (c.inv[i] = b));
    c.meter[3] = money;
    return c;
  };
  const exit = (toScene: number): ExitReach => ({ toScene }) as ExitReach;
  const run = (scene: number, exits: ExitReach[], c = ci([])): SceneRun => ({
    scene,
    name: '',
    from: { scene: scene - 1, link: 0 },
    ex: { exits, complete: true } as unknown as Exploration,
    stuck: [],
    hpIn: 100,
    entry: { start: { x: 5, y: 5 }, ci: c, clock: 1 },
  });

  it('says what the poorer run left behind', () => {
    expect(leftBehind(ci([37, 40], 5), ci([40], 2))).toEqual(['block 37', '3 money']);
  });

  it('finds the scene a run carrying less can’t finish', () => {
    const main: Playtest = { runs: [run(2, [exit(3)]), run(3, [exit(1)], ci([37]))], unreached: [], won: true, cancelled: false };
    const poor: Playtest = { runs: [run(2, [exit(3)]), run(3, [], ci([]))], unreached: [], won: false, cancelled: false };
    const f = softlocks(main, poor, [], (n) => `Level ${n}`);
    expect(f.map((x) => x.title)).toEqual(['Coming in with less, the hero can’t finish Level 3: without block 37']);
    expect(f[0].where).toEqual({ scene: 3, map: undefined, cell: cell(5, 5) });
    expect(softlocks(main, { ...poor, won: true }, [], String)).toEqual([]);
  });
});

describe('steady hands', () => {
  const walk = (k: number): Move => ({ name: `walk ${k}`, steps: [{ keys: [k], until: 'cell', max: 30 }] });
  const jump: Move = {
    name: 'jump 72 1 running 77',
    steps: [
      { keys: [77, 72], until: 'ticks', max: 1 },
      { keys: [77], until: 'land', max: 60 },
    ],
  };
  const hop: Move = {
    name: 'jump 72 6 then 77',
    steps: [
      { keys: [72], until: 'ticks', max: 2 },
      { keys: [77], until: 'land', max: 60 },
    ],
  };

  it('plays one key at a time, holds each a while and lets go before the next', () => {
    const moves = steadyMoves([walk(RIGHT), jump, hop], 6);
    expect(moves.map((m) => m.name)).toEqual([`walk ${RIGHT} steady`, 'jump 72 6 then 77 steady']);
    expect(moves[0].steps[0]).toMatchObject({ min: 6 });
    expect(moves[0].settle).toBe(6);
    expect(moves[1].steps).toEqual([
      { keys: [72], until: 'ticks', max: 6 },
      { keys: [], until: 'ticks', max: 6 },
      { keys: [77], until: 'land', max: 60, min: 6 },
    ]);
  });

  it('says what a steady hand can’t do', () => {
    expect(describeMove(jump, 6)).toBe('Right and Up held together');
    expect(describeMove(hop, 6)).toBe('Up held only 0.11 s before the next key');
    expect(describeMove(walk(LEFT), 6)).toBe('Left');
  });

  it('gets through the test level with steady hands, so says nothing', async () => {
    const t = testGame(LEDGE);
    const main = (await playtestScene(t.game, t, 2))!;
    const ex = await explore(t.game, 2, t, main.entry, { steadyTicks: 6 });
    expect(ex.exits.map((e) => e.toScene)).toEqual([1]);
    expect(steadyFindings(main, { ...main, ex }, undefined, 6)).toEqual([]);
  });

  it('points at the last place on the ordinary way through that the steady run reached', async () => {
    const t = testGame(LEDGE);
    const main = (await playtestScene(t.game, t, 2))!;
    // a steady run that never got off the ledge
    const heat = new Uint32Array(main.ex.heat.length);
    for (let x = 1; x <= 4; x++) heat[cell(x, 2)] = heat[cell(x, 1)] = 1;
    const steady = { ...main, ex: { ...main.ex, exits: [], heat, complete: true } };
    const f = steadyFindings(main, steady, undefined, 6);
    expect(f).toHaveLength(1);
    expect(f[0].title).toMatch(/^With steady hands the bot can’t get past \(4, 2\)$/);
    expect(f[0].detail).toContain('at least 330 ms between changes');
  });
});
