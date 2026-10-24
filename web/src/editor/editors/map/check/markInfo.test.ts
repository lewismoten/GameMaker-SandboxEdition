// The Level check's mark words (markInfo.ts) and progress line (checkPanel.ts liveText).
import { describe, expect, it } from 'vitest';
import { describeCell, heatWords } from './markInfo';
import { liveText, secondsText } from './checkPanel';

const none = { stuck: false, deaths: 0, findings: [], focus: false, soon: false };

describe('Level check mark words', () => {
  it('says what each mark at a cell means, and the heat there', () => {
    expect(describeCell(none)).toEqual([]);
    expect(describeCell({ ...none, deaths: 2, heat: 6 })).toEqual(['✕ The hero died here (2 times)', 'Time spent: a lot']);
    expect(describeCell({ ...none, deaths: 1 })).toEqual(['✕ The hero died here (once)']);
    expect(describeCell({ ...none, deaths: -1 })).toEqual(['✕ The hero died here']);
    expect(describeCell({ ...none, stuck: true, findings: ['A dead end'], heat: 0 })).toEqual([
      '▨ Stuck spot: the bot found no way out of here',
      '○ A finding: A dead end',
      'The bot never got here',
    ]);
    expect(describeCell({ ...none, findings: ['a', 'b', 'c', 'd', 'e'] }).at(-1)).toBe('○ and 2 more findings');
    expect(describeCell({ ...none, focus: true })[0]).toBe('⬚ The place picked from the list');
  });

  it('puts heat steps into words both ways', () => {
    expect(heatWords(undefined, false)).toBeUndefined();
    expect(heatWords(1, false)).toBe('Time spent: a moment');
    expect(heatWords(6, true)).toBe('Reached: right away');
    expect(heatWords(1, true)).toBe('Reached: last of all');
  });

  it('tells the time left honestly', () => {
    expect(secondsText(400)).toBe('1 s');
    expect(secondsText(75_000)).toBe('1 min 15 s');
    expect(liveText({ leftMs: 12_000, sure: false, tried: 1, queued: 5, index: 0, total: 1 })).toBe('Up to 12 s left · 1 place tried, 5 waiting');
    expect(liveText({ leftMs: 3_000, sure: true, tried: 40, queued: 0, index: 1, total: 3 }, 'Desert')).toBe(
      'About 3 s left · 40 places tried, 0 waiting · scene 2 of up to 3 (Desert)',
    );
  });
});
