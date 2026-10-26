// The author's own heat map (myHeat.ts): recording ticks and deaths, keeping and adding sessions, and comparing with the bot's.
import { describe, expect, it } from 'vitest';
import { DIESEQ } from '../../../../formats/character';
import { HeatRecorder, combineSteps, compareSteps, coverage, coverageText, mergeMine, unpackMine } from './myHeat';
import { heatWords } from './markInfo';

/** A world as the recorder reads it: the hero at block (x, y), a whole block (no half steps). */
const world = (x: number, y: number, clock: number, cseq = 0) => ({ chr: { x: [x, 0], y: [y, 0], cseq }, ci: { topthere: false }, clock }) as never;

describe('my heat map', () => {
  it('records ticks spent, the first tick, and each death once', () => {
    const r = new HeatRecorder();
    r.enter();
    r.frame(world(5, 5, 100));
    r.frame(world(5, 5, 100)); // a frame with no tick counts for nothing
    r.frame(world(5, 5, 102));
    r.frame(world(6, 5, 103));
    r.frame(world(6, 5, 104, DIESEQ));
    r.frame(world(6, 5, 105, DIESEQ));
    expect(r.rec.heat[5 * 100 + 5]).toBe(2);
    expect(r.rec.heat[5 * 100 + 6]).toBe(3);
    expect(r.rec.first[5 * 100 + 6]).toBe(3);
    expect(r.rec.ticks).toBe(5);
    expect([...r.rec.deaths]).toEqual([[506, 1]]);
    // a new visit starts its clock over, even if the game's clock went back
    r.enter();
    r.frame(world(7, 5, 10));
    r.frame(world(7, 5, 11));
    expect(r.rec.first[5 * 100 + 7]).toBe(1);
  });

  it('adds sessions together and keeps the earliest first tick', () => {
    const a = new HeatRecorder();
    a.frame(world(1, 1, 0));
    a.frame(world(1, 1, 4));
    const kept = mergeMine(undefined, a.rec, 'then');
    expect(kept).toEqual({ when: 'then', sessions: 1, ticks: 4, cells: [101, 4, 4], deaths: [] });
    const b = new HeatRecorder();
    b.frame(world(1, 1, 0));
    b.frame(world(1, 1, 1));
    const both = unpackMine(mergeMine(kept, b.rec, 'now'));
    expect(both.heat[101]).toBe(5);
    expect(both.first[101]).toBe(1);
    expect(both.ticks).toBe(5);
    expect(mergeMine(kept, b.rec).sessions).toBe(2);
  });

  it('compares and combines with the bot', () => {
    const bot = Uint8Array.from([0, 3, 0, 2]);
    const mine = Uint8Array.from([0, 0, 5, 6]);
    expect([...compareSteps(bot, mine)]).toEqual([0, 1, 2, 3]);
    expect([...combineSteps(bot, mine)]).toEqual([0, 3, 5, 6]);
    expect(heatWords(1, false, 'compare')).toBe('Only the bot got here');
    expect(heatWords(2, false, 'compare')).toBe('Only you got here');
    expect(heatWords(3, false, 'compare')).toBe('You and the bot both got here');
    expect(heatWords(6, false, 'mine')).toBe('Time spent (you): a lot');
  });

  it('counts the bot’s places you came near, and the areas you missed', () => {
    const bot = new Uint8Array(10000);
    const mine = new Uint8Array(10000);
    // the bot walked row 10 from x 0 to 19; you walked row 11 from x 0 to 9 (a block below counts)
    for (let x = 0; x < 20; x++) bot[1000 + x] = 1;
    for (let x = 0; x < 10; x++) mine[1100 + x] = 1;
    // and the bot found a far corner by itself
    bot[9999] = 1;
    const c = coverage(bot, mine);
    expect(c.bot).toBe(21);
    expect(c.covered).toBe(11);
    expect(c.missed).toEqual([
      { cell: 1015, size: 9 },
      { cell: 9999, size: 1 },
    ]);
    expect(coverageText(c)).toBe('You’ve been to 52% of the places the bot reached; 2 areas it found that you haven’t.');
    expect(coverageText(coverage(mine, mine))).toBe('You’ve been everywhere the bot reached.');
    const far = new Uint8Array(10000).fill(1);
    const one = new Uint8Array(10000);
    one[0] = 1;
    expect(coverageText(coverage(far, one))).toMatch(/^You’ve been to less than 1% /);
  });
});
