// The fan corridor needs deliberate, held cardinal inputs rather than rapid twitching.
import { describe, expect, it } from 'vitest';
import { flyOptionsOf } from './testkit';

describe('Blaster leg pilot timing', () => {
  it('uses slow, human-timed decisions through the Cooling Fan', () => {
    expect(flyOptionsOf('s5l')).toEqual({ every: 5, horizon: 5, stick: 0 });
  });

  it('keeps the standard pilot cadence on other legs', () => {
    expect(flyOptionsOf('s1s')).toEqual({});
  });
});
