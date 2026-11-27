// The stage door added a playable level to the original 1.x release.
import { expect, it } from 'vitest';
import about from '../../games/sleuth/about.json';

it('ships the stage-door edition of Final Curtain at major version 2 or later', () => {
  expect(Number(about.version.split('.')[0])).toBeGreaterThanOrEqual(2);
});
