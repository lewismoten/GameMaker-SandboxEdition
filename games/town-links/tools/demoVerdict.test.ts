// The title demo must complete its exact route without a replay error.
import { describe, expect, it } from 'vitest';
import { checkDemo } from './demoVerdict';

const complete = { scenes: [2, 3, 2, 3, 4, 3, 4, 1], keysLeft: 0, won: true };

describe('town-links demo verdict', () => {
  it('accepts the full winning route', () => {
    expect(() => checkDemo(complete)).not.toThrow();
  });
  it.each([{ scenes: [...complete.scenes, 2] }, { won: false }, { error: new Error('unexpected restart') }, { keysLeft: 1 }])(
    'rejects an unsuccessful replay %o',
    (change) => {
      expect(() => checkDemo({ ...complete, ...change })).toThrow();
    },
  );
});
