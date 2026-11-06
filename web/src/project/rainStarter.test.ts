// Weather is visible after Drawing with Blocks, but never renumbers the existing courses.
import { describe, expect, it } from 'vitest';
import { ADDED_LATER, STARTER_GROUPS } from './starter';
import { STARTER_HEROES } from './starterHeroes';
import { courseNumber } from './ceremonies';

describe('rain Starter registration', () => {
  it('lists rain in Weather immediately after Drawing with Blocks', () => {
    const drawing = STARTER_GROUPS.findIndex((g) => g.name === 'Drawing with Blocks');
    expect(STARTER_GROUPS[drawing + 1].name).toBe('Weather');
    expect(STARTER_GROUPS.filter((g) => g.name === 'Weather')).toHaveLength(1);
    expect(STARTER_GROUPS[drawing + 1].tag).toBe('Rain, snow, lightning and heat, drawn and animated.');
    expect(STARTER_GROUPS[drawing + 1].games).toEqual(['heat-waves', 'lightning', 'rain']);
    expect(STARTER_GROUPS.find((g) => g.name === 'Worlds That Push Back')!.games).toContain('quicksand');
    expect(ADDED_LATER).toEqual([
      'under-the-hood',
      'around-the-room',
      'ride-along',
      'lightning-bugs',
      'fireworks',
      'leaves',
      'quicksand',
      'lightning',
      'heat-waves',
      'rain',
    ]);
  });
  it('keeps existing heroes and course numbers, appending rain to stage six', () => {
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
      'around-the-room',
      'ride-along',
      'lightning-bugs',
      'fireworks',
      'leaves',
    ];
    existing.forEach((id, i) => expect(courseNumber(id)).toBe(601 + i));
    expect(courseNumber('quicksand')).toBe(213);
    expect(courseNumber('lightning')).toBe(623);
    expect(courseNumber('heat-waves')).toBe(624);
    expect(courseNumber('rain')).toBe(625);
    expect(STARTER_HEROES['heat-waves']).toBe('KIT');
    expect(STARTER_HEROES.lightning).toBe('MARA');
    expect(STARTER_HEROES.rain).toBe('LIAN');
    expect(STARTER_HEROES.twinkle).toBe('RIMA');
  });
});
