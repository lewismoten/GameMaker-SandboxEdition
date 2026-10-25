// Tests for keepTogether.ts: words() splits text at spaces but never inside THE CHEZ.
import { describe, expect, it } from 'vitest';
import { words } from './keepTogether';

describe('words', () => {
  it('splits at spaces', () => expect(words('a big  dog')).toEqual(['a', 'big', 'dog']));
  it('keeps THE CHEZ as one word, however it is spaced', () => {
    expect(words('in THE CHEZ today')).toEqual(['in', 'THE CHEZ', 'today']);
    expect(words('in The\u00a0Chez')).toEqual(['in', 'The Chez']);
  });
});
