// Item marks: labels, framing on the timeline, Previous / Next choice.
import { describe, expect, it } from 'vitest';
import { frameItems, itemLabel, nextItem, previousItem, currentItem, type WalkItem } from './items';

const at = (kind: WalkItem['kind'], name: string, time: number, num?: number): WalkItem => ({ kind, name, num, time });
const ms = 1000 / 60;

describe('itemLabel', () => {
  it('names each kind', () => {
    expect(itemLabel(at('picture', 'X.GIF', 0))).toBe('Picture: X.GIF');
    expect(itemLabel(at('cartoon', 'X.FLI', 0))).toBe('Cartoon: X.FLI');
    expect(itemLabel(at('text', 'X.TXT', 0))).toBe('Text: X.TXT');
    expect(itemLabel(at('slides', 'X.LST', 0))).toBe('Slide show: X.LST');
    expect(itemLabel(at('level', 'The Timing Beat', 0, 3))).toBe('Level 3: The Timing Beat');
    expect(itemLabel(at('menu', '', 0))).toBe('Menu');
    expect(itemLabel(at('scores', '', 0))).toBe('High scores');
    expect(itemLabel(at('credits', '', 0))).toBe('Credits');
  });
});

describe('stepping', () => {
  // chapter 0 began at run time 0 (frame 0); chapter 1 at run time 1000 ms but frame 100 on the file's timeline
  const items = frameItems(
    [at('picture', 'A.GIF', 0), at('menu', '', 30 * ms), at('level', 'L', 1000 + 30 * ms, 1), at('credits', '', 1000 + 300 * ms)],
    [{ time: 0 }, { time: 1000 }],
    [{ frame: 0 }, { frame: 100 }],
  );
  it('puts marks on the timeline by their chapter', () => {
    expect(items.map((i) => i.frame)).toEqual([0, 30, 130, 400]);
  });
  const sorted = [...items].sort((a, b) => a.frame - b.frame);
  it('Previous goes to the last mark, or the one before within a second', () => {
    expect(previousItem(sorted, 700)?.kind).toBe('credits');
    expect(previousItem(sorted, 130 + 61)?.kind).toBe('level');
    expect(previousItem(sorted, 130 + 59)?.kind).toBe('menu');
    expect(previousItem(sorted, 0)).toBeUndefined();
  });
  it('Next finds the first mark after now', () => {
    expect(nextItem(sorted, 130)?.kind).toBe('credits');
    expect(nextItem(sorted, 400)).toBeUndefined();
    expect(currentItem(sorted, 140)?.kind).toBe('level');
  });
});
