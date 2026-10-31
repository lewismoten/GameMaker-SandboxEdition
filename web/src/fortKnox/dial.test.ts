// The safe's combination logic, spending and reading of old saved data.
import { describe, expect, it } from 'vitest';
import { COMBINATION, LASH, gates, newDial, opens, spin, turnDial, type Dial } from './dial';
import { balance, buy, emptySafe, mergeSafe, parseSafe } from './store';
import { parseMoney } from './money';

const turn = (d: Dial, ...moves: number[]) => moves.reduce(turnDial, d);
/** Ticks to turn from the dial's number to `target` the short way round in `dir`, plus `extra` whole turns. */
const to = (d: Dial, target: number, dir: 1 | -1, extra = 0) => {
  const short = dir === 1 ? (d.pos - target + 60) % 60 : (target - d.pos + 60) % 60;
  return turnDial(d, dir * (short + extra * 60));
};
const dialed = (d: Dial = newDial()) => to(to(to(d, COMBINATION[0], 1, 3), COMBINATION[1], -1, 1), COMBINATION[2], 1);

describe('combination dial', () => {
  it('wraps around 60 ticks; turning right lowers the number under the pointer', () => {
    expect(turn(newDial(), 1).pos).toBe(59);
    expect(turn(newDial(), -1).pos).toBe(1);
    expect(turn(newDial(), ...Array(61).fill(-1)).pos).toBe(1);
  });
  it('opens when dialed right three turns to 31, left past it once to 41, right to 59', () => {
    expect(opens(dialed())).toBe(true);
  });
  it('opens from any starting state, wheels anywhere', () => {
    for (const start of [0, 7, 31, 41, 59]) {
      for (const wander of [-170, -61, -5, 0, 3, 59, 140]) {
        expect(opens(dialed(turnDial({ ...newDial(), pos: start }, wander)))).toBe(true);
      }
    }
  });
  it('derives the opening from the wheels: the gates line up only when each wheel is where it was set', () => {
    const d = dialed();
    expect(d.wheels).toEqual(gates().slice(0, 2));
    expect(opens({ ...d, wheels: [d.wheels[0] + 1, d.wheels[1]] })).toBe(false);
    expect(opens({ ...d, wheels: [d.wheels[0], d.wheels[1] + 1] })).toBe(false);
    expect(opens({ ...d, pos: d.pos + 1 })).toBe(false);
  });
  it('fails with too few turns on the first number', () => {
    // the cam was last turned left, so the wheels are left behind it; one short lap right is not enough
    const behind = turnDial(newDial(), -70);
    const d = to(to(to(behind, COMBINATION[0], 1), COMBINATION[1], -1, 1), COMBINATION[2], 1);
    expect(opens(d)).toBe(false);
    expect(opens(to(to(to(behind, COMBINATION[0], 1, 2), COMBINATION[1], -1, 1), COMBINATION[2], 1))).toBe(true);
  });
  it('fails when the second number is taken the first time round, or one tick off', () => {
    const first = to(newDial(), COMBINATION[0], 1, 3);
    const stage = (second: Dial) => opens(to(second, COMBINATION[2], 1));
    expect(stage(to(first, COMBINATION[1], -1))).toBe(false); // stopped early, first time past 41
    expect(stage(to(first, COMBINATION[1] - 1, -1, 1))).toBe(false); // one tick short
    expect(stage(to(first, COMBINATION[1] + 1, -1, 1))).toBe(false); // one tick over
    expect(stage(to(first, COMBINATION[1], -1, 1))).toBe(true);
  });
  it('fails when the first number is off by one, or the last is passed or missed', () => {
    const run = (n: number, last: number) => opens(to(to(to(newDial(), n, 1, 3), COMBINATION[1], -1, 1), last, 1));
    expect(run(COMBINATION[0] + 1, COMBINATION[2])).toBe(false);
    expect(run(COMBINATION[0] - 1, COMBINATION[2])).toBe(false);
    expect(run(COMBINATION[0], COMBINATION[2] - 1)).toBe(false); // one tick on
    expect(opens(turnDial(dialed(), 1))).toBe(false);
    const second = to(to(newDial(), COMBINATION[0], 1, 3), COMBINATION[1], -1, 1);
    expect(opens(to(second, COMBINATION[2], 1, 1))).toBe(false); // a whole extra lap picks wheel B back up
  });
  it('picks wheels up a lash apart, so a reversal turns nearly a full turn before anything moves', () => {
    const d = to(newDial(), COMBINATION[0], 1, 3); // every wheel stacked on 31
    const moved = turnDial(d, -(LASH - 1));
    expect(moved.wheels).toEqual(d.wheels);
    expect(turnDial(moved, -2).wheels[1]).not.toBe(d.wheels[1]);
  });
  it('a full reset spin collects every wheel from any state', () => {
    for (const w of [0, 13, 29, 44, 59]) {
      for (const dir of [1, -1]) {
        const d = turnDial(turnDial(newDial(), dir * (w + 100)), -dir * w);
        const s = spin(d);
        expect(s.wheels).toEqual([s.pos, s.pos]);
      }
    }
  });
  it('reports the tick a pin picks a wheel up, and not while carrying one', () => {
    let d = dialed();
    let picked = 0;
    for (let i = 0; i < 130; i++) {
      d = turnDial(d, -1);
      picked += d.picks;
    }
    expect(picked).toBe(2);
    expect(turnDial(newDial(), 40).picks).toBe(0);
  });
});

describe('treat spending', () => {
  it('spends coins, tallies the treat and refuses what is too dear', () => {
    const a = buy(emptySafe(), 'bone', 10)!;
    expect(a.spent).toBe(5);
    expect(a.treats.bone).toBe(1);
    expect(balance(10, a)).toBe(5);
    expect(buy(a, 'cake', 10)).toBeUndefined();
    expect(buy(a, 'nothing-here', 10)).toBeUndefined();
  });
  it('lets the free treat be bought any number of times', () => {
    let r = emptySafe();
    for (let i = 0; i < 5; i++) r = buy(r, 'air', 0)!;
    expect(r.treats.air).toBe(5);
    expect(r.spent).toBe(0);
  });
  it('merges backups by keeping the most', () => {
    const m = mergeSafe({ opened: false, spent: 3, treats: { bone: 1 } }, { opened: true, spent: 2, treats: { bone: 2, popcorn: 1 } });
    expect(m).toEqual({ opened: true, spent: 3, treats: { bone: 2, popcorn: 1 } });
  });
});

describe('old and odd saved data', () => {
  const bytes = (v: unknown) => new TextEncoder().encode(JSON.stringify(v));
  it('still reads the piggy bank money record unchanged', () => {
    expect(parseMoney(bytes({ teddy: 23, bad: -1, text: 'x' }))).toEqual({ teddy: 23 });
  });
  it('starts a fresh safe from nothing or from junk', () => {
    expect(parseSafe(undefined)).toEqual(emptySafe());
    expect(parseSafe(new TextEncoder().encode('not json'))).toEqual(emptySafe());
    expect(parseSafe(bytes({ opened: true, spent: -4, treats: { bone: 2, gone: 9, popcorn: 'x' } }))).toEqual({ opened: true, spent: 0, treats: { bone: 2 } });
  });
});
