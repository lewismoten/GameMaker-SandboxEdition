// Weather is visible after Drawing with Blocks, but never renumbers the existing courses.
import { describe, expect, it } from 'vitest';
import { STARTER_GROUPS } from './starter';
import { STARTER_HEROES } from './starterHeroes';
import { courseNumber } from './ceremonies';

describe('rain Starter registration', () => {
  it('lists rain in Weather immediately after Drawing with Blocks', () => {
    const drawing = STARTER_GROUPS.findIndex((g) => g.name === 'Drawing with Blocks');
    expect(STARTER_GROUPS[drawing + 1].name).toBe('Weather');
    expect(STARTER_GROUPS[drawing + 1].games).toContain('rain');
  });
  it('keeps existing heroes and course numbers, appending weather to stage six', () => {
    const existing = [
      'road-tiles',
      'shore',
      'twinkle',
      'flicker',
      'lights-out',
      'color-doors',
      'shadows',
      'beams',
      'dialog',
      'popups',
      'scripted',
      'parallax',
      'horizon',
      'beltway',
      'corner-view',
      'slow-computers',
      'under-the-hood',
    ];
    existing.forEach((id, i) => expect(courseNumber(id)).toBe(601 + i));
    expect(courseNumber('rain')).toBe(601 + existing.length);
    expect(STARTER_HEROES.rain).toBe('KIT');
    expect(STARTER_HEROES.twinkle).toBe('RIMA');
  });
});
