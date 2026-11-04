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

describe('dosStem', () => {
  it('tells when it cuts', async () => {
    const { dosStem } = await import('./limitNote');
    const said: string[] = [];
    expect(dosStem('longername.voc', (m) => said.push(m))).toBe('longerna');
    expect(said[0]).toContain('LONGERNA');
    expect(dosStem('short', (m) => said.push(m))).toBe('short');
    expect(said).toHaveLength(1);
  });
});
