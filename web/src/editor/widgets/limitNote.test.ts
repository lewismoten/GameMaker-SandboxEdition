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

describe('heldText and resizedText', () => {
  it('say nothing when nothing was changed', async () => {
    const { heldText, resizedText } = await import('./limitNote');
    expect(heldText(70, 70, 'Speed', '0 and 1000')).toBe('');
    expect(resizedText(320, 200, 320, 200, 'fitted')).toBe('');
  });
  it('say what was held and what was resized', async () => {
    const { heldText, resizedText } = await import('./limitNote');
    expect(heldText(5000, 1000, 'Speed', '0 and 1000')).toBe('Speed is kept between 0 and 1000; 5000 became 1000.');
    expect(resizedText(640, 480, 320, 200, 'stretched')).toBe('The picture was 640×480; DOS pictures here are 320×200, so it was stretched.');
  });
});
