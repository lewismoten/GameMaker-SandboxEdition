// findCourse: a ride lap after lap corner to corner through the wrap is a course; a lap racer, a
// ride that comes round to its own blocks and one that only cuts across a corner are not.
import { describe, expect, it } from 'vitest';
import { findCourse } from './course';

const mod = (v: number, n: number) => ((v % n) + n) % n;
/** A ride along unwrapped blocks, as the engine has them (0 to 99). */
const wrapped = (ride: [number, number][]) => ride.map(([x, y]) => [mod(x, 100), mod(y, 100)] as [number, number]);

/** Up and to the right at 45 degrees for 80 columns, then flat for 20 (the kink): a lap moves the way 20 rows down the map. */
function diagonal(laps: number): [number, number][] {
  const out: [number, number][] = [];
  let y = 50;
  for (let x = 0; x < laps * 100; x++) {
    out.push([x, y]);
    if (mod(x, 100) < 80) y -= 1;
  }
  return out;
}

describe('a course through the wrap', () => {
  it('finds a diagonal ride that crosses the wrap lap after lap, straightened', () => {
    const c = findCourse(wrapped(diagonal(4)));
    expect(c).toBeDefined();
    expect(c![0]).toEqual([0, 50]);
    expect(c![c!.length - 1]).toEqual([399, -270]);
    // a corner at each kink, not a point a block
    expect(c!.length).toBeLessThan(12);
  });

  it('keeps the longest unbroken ride: a restart is a jump', () => {
    const ride = [...wrapped(diagonal(1)).slice(0, 30), ...wrapped(diagonal(4))];
    expect(findCourse(ride)![0]).toEqual([0, 50]);
  });

  it('is not a lap racer going round and round one way', () => {
    const laps: [number, number][] = [];
    for (let k = 0; k < 5; k++) for (let x = 0; x < 100; x++) laps.push([x, 40 + (x % 7 < 3 ? 1 : 0)]);
    expect(findCourse(laps)).toBeUndefined();
  });

  it('is not a diagonal that comes round to its own blocks (no kink)', () => {
    const ride: [number, number][] = [];
    for (let k = 0; k < 400; k++) ride.push([mod(k, 100), mod(50 - k, 100)]);
    expect(findCourse(ride)).toBeUndefined();
  });

  it('is not a ride that only cuts across a corner of a wrapping map', () => {
    const ride: [number, number][] = [];
    for (let k = 0; k < 60; k++) ride.push([mod(70 + k, 100), mod(70 + k, 100)]);
    expect(findCourse(ride)).toBeUndefined();
  });
});
