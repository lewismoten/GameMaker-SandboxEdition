import { describe, expect, it } from 'vitest';
import { fullText, upTo } from './limitNote';

describe('limit notes', () => {
  it('words a full list in plain terms', () => {
    expect(fullText(256, 'blocks', 'a set')).toBe('DOS Game-Maker holds 256 blocks in a set; this one is full.');
  });
  it('words a length cap', () => {
    expect(upTo(19)).toBe('up to 19 letters in DOS');
  });
});
