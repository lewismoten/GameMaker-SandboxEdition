// voiceReadme must not change the head it is given: the phone's README grew to 62 copies of its tables (5.7 MB shipped) when it did.
import { describe, expect, it } from 'vitest';
import { PHONE_README, voiceReadme } from './voiceReadme';

describe('voiceReadme', () => {
  it('writes the same README each time and leaves PHONE_README alone', () => {
    const lines = [{ id: 'a', chapter: 'mom', text: 'Hello.' }];
    const before = [...PHONE_README];
    const first = voiceReadme(lines, {}, PHONE_README);
    expect(voiceReadme(lines, {}, PHONE_README)).toBe(first);
    expect(PHONE_README).toEqual(before);
  });
});
