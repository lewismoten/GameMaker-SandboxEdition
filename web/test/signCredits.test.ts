// Keep the DOS sign credits and magazine notice in step with the shipped content.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CREDITS as around } from '../../games/around-the-room/src/text';
import { CREDITS as brains } from '../../games/block-brains/src/text';
import { CREDITS as coins } from '../../games/coins-and-score/src/text';
import { CREDITS as doors } from '../../games/color-doors/src/text';
import { DICT } from '../scripts/oldWebPages';

describe('content credits', () => {
  it('dates the old web pages to the dictionary update', () => {
    const year = /Last updated 4 Jan (\d{4})/.exec(DICT.html)![1];
    expect(readFileSync(new URL('../../NOTICE.md', import.meta.url), 'utf8')).toContain(`made-up ${year} web pages`);
  });
  it.each([
    ['Around the Room', around],
    ['Block Brains', brains],
    ['Coins and Score', coins],
    ['Color Doors', doors],
  ])('%s credits its signs on the DOS credits screen', (_, credits) => {
    expect(credits.replace(/\s+/g, ' ')).toMatch(/(?:signs|plaques)[^.]*OpenAI Codex \(GPT-6\.1 Sol\)/i);
  });
});
