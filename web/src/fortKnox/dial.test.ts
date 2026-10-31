// The safe's combination logic, spending and reading of old saved data.
import { describe, expect, it } from 'vitest';
import { COMBINATION, newDial, opens, spin, turnDial, type Dial } from './dial';
import { balance, buy, emptySafe, mergeSafe, parseSafe } from './store';
import { parseMoney } from './money';

const turn = (d: Dial, ...moves: number[]) => moves.reduce(turnDial, d);
const to = (d: Dial, target: number, dir: 1 | -1) => {
  const steps = dir === 1 ? (target - d.pos + 60) % 60 : -((d.pos - target + 60) % 60);
  return Array.from({ length: Math.abs(steps) }).reduce<Dial>((x) => turnDial(x, dir), d);
};

describe('combination dial', () => {
  it('wraps around 60 ticks', () => {
    expect(turn(newDial(), -1).pos).toBe(59);
    expect(turn(newDial(), ...Array(61).fill(1)).pos).toBe(1);
  });
  it('opens on right, left, right to the three numbers', () => {
    let d = to(newDial(), COMBINATION[0], 1);
    d = to(d, COMBINATION[1], -1);
    d = to(d, COMBINATION[2], 1);
    expect(opens(d)).toBe(true);
  });
  it('does not open for the wrong direction, a wrong number or a spun dial', () => {
    let d = to(newDial(), COMBINATION[0], -1);
    d = to(d, COMBINATION[1], 1);
    d = to(d, COMBINATION[2], -1);
    expect(opens(d)).toBe(false);
    let e = to(newDial(), COMBINATION[0], 1);
    e = to(e, COMBINATION[1], -1);
    e = to(e, COMBINATION[2] - 1, 1);
    expect(opens(e)).toBe(false);
    expect(opens(spin(to(newDial(), 5, 1)))).toBe(false);
  });
  it('ignores earlier wandering before the last three runs', () => {
    let d = to(to(newDial(), 20, 1), 7, -1);
    d = to(d, COMBINATION[0], 1);
    d = to(d, COMBINATION[1], -1);
    d = to(d, COMBINATION[2], 1);
    expect(opens(d)).toBe(true);
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
