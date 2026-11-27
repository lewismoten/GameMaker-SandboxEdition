// Check how often the recorded demo enters Pip's conversation.
import { expect, it } from 'vitest';
import { talksToPipOnce } from './demoTrail';

it('requires exactly one entry into Pip’s talk scene', () => {
  expect(talksToPipOnce([2, 4])).toBe(true);
  expect(talksToPipOnce([2, 4, 2, 4])).toBe(false);
  expect(talksToPipOnce([2])).toBe(false);
});
