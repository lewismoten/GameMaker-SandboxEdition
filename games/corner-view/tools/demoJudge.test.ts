// The Corner View demo check must fail on a replay error, even when the scenes and keys look right.
import { expect, it } from 'vitest';
import { judgeDemo } from './demoJudge';

const good = { scenes: [2, 3, 4, 1], keysLeft: 0 };

it('passes a clean replay', () => expect(judgeDemo(good)).toBeUndefined());
it('fails when an error was captured in the ending', () => {
  expect(judgeDemo({ ...good, error: new Error('boom in the ending') })).toMatch(/boom in the ending/);
});
it('fails on a skipped scene or unplayed keys', () => {
  expect(judgeDemo({ scenes: [2, 3, 1], keysLeft: 0 })).toMatch(/expected scenes/);
  expect(judgeDemo({ ...good, keysLeft: 5 })).toMatch(/5 keys unplayed/);
});
