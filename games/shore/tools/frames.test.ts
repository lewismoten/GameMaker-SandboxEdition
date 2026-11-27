// Exercise timed-block preview boundaries beyond the original transition limit.
import { expect, it } from 'vitest';
import { shownAt } from './frames';

it('shows the opposite frame at tick 100001 of a two-frame one-tick ring', () => {
  const timed = [
    { name: 'a', next: 'b', ticks: 1 },
    { name: 'b', next: 'a', ticks: 1 },
  ];
  expect(shownAt({ timed }, 100001)).toEqual(
    new Map([
      ['a', 'b'],
      ['b', 'a'],
    ]),
  );
});
