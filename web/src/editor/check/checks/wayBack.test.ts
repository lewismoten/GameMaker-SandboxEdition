// The level check's ways back and ways through (wayBack.ts), with slower hands' moves
// (inputs.ts steadyMoves), on the tiny game in testGame.ts and on runs made up by hand.
import { describe, expect, it } from 'vitest';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { explore, type Exploration, type ExitReach } from '../explore';
import { steadyMoves, type Move } from '../inputs';
import { playtestScene, type Playtest, type SceneRun } from '../playtest';
import { scenesOf } from '../sceneData';
import { startCharInfo } from '../sim';
import { LEFT, RIGHT, testGame } from '../testGame';
import { describeMove, leftBehind, noRouteNote, oneWay, softlocks, steadyFindings } from './wayBack';

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
    const main: Playtest = { runs: [run(2, [exit(3)]), run(3, [exit(1)], ci([37]))], unreached: [], won: true, canceled: false, failed: [] };
    const poor: Playtest = { runs: [run(2, [exit(3)]), run(3, [], ci([]))], unreached: [], won: false, canceled: false, failed: [] };
    const f = softlocks(main, poor, [], (n) => `Level ${n}`);
    expect(f.map((x) => x.title)).toEqual(['Coming in with less, the hero can’t finish Level 3: without block 37']);
    expect(f[0].where).toEqual({ scene: 3, map: undefined, cell: cell(5, 5) });
    expect(softlocks(main, { ...poor, won: true }, [], String)).toEqual([]);
  });
});

describe('slower hands', () => {
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

  it('gets through the test level with slower hands, so says nothing', async () => {
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
    expect(f[0].title).toMatch(/^In the bot’s runs with slower hands, it did not get past \(4, 2\)$/);
    expect(f[0].detail).toContain('at least 330 ms between changes');
  });
});

describe('slower hands when the bot found no route', () => {
  it('says plainly that slower hands were not checked, as a suggestion, and what the tool cannot see', () => {
    const n = noRouteNote(330, false);
    expect(n.title).toBe('Slower hands were not checked here: no route was found');
    expect(n.detail).toContain(
      'found no way through this scene, so a run with slower hands (at least 330 ms between key changes) had nothing to be compared with',
    );
    expect(n.detail).toContain('says nothing about whether a person can get through');
    expect(n.detail).toContain('Suggestion: play it once at an unhurried pace yourself.');
    expect(n.detail).toContain('can’t see how long a jump lasts');
    expect(n.detail).not.toContain('tap jump again in the air');
  });

  it('adds the air-tap timing where the hero can tap again in the air, and "in the time it had" when the search was cut short', () => {
    const n = noRouteNote(330, true, false);
    expect(n.detail).toContain('found no way through this scene in the time it had');
    expect(n.detail).toContain('Chaining those taps needs each press within about the jump’s air time of the last');
  });

  it('is an info finding where the scene has a link out the bot did not reach, in place of the silence a missing route used to give', async () => {
    const t = testGame(LEDGE);
    const main = (await playtestScene(t.game, t, 2))!;
    const noWay = { ...main, ex: { ...main.ex, exits: [] } };
    const d = scenesOf(t.game, t).find((s) => s.scene === 2)!;
    expect(d.links.length).toBeGreaterThan(0);
    const f = steadyFindings(noWay, noWay, d, 6);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ check: 'steady', severity: 'info', title: 'Slower hands were not checked here: no route was found' });
    expect(f[0].detail).toContain('at least 330 ms');
  });

  it('says nothing for a scene with no link to touch (an ending, a win scene, one the game leaves another way)', async () => {
    const t = testGame(LEDGE);
    const main = (await playtestScene(t.game, t, 2))!;
    const noWay = { ...main, ex: { ...main.ex, exits: [] } };
    const d = scenesOf(t.game, t).find((s) => s.scene === 2)!;
    expect(steadyFindings(noWay, noWay, { ...d, links: [] }, 6)).toEqual([]);
    expect(steadyFindings(noWay, noWay, undefined, 6)).toEqual([]);
  });
});
