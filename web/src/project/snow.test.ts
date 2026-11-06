// Snow joins the normal Starter catalog without renumbering the existing block courses.
import { describe, expect, it } from 'vitest';
import { STARTER_GROUPS, starterGroupOf } from './starter';
import { courseNumber } from './ceremonies';
import { heroOfStarter } from './starterHeroes';

describe('snow Starter registration', () => {
  it('files snow in Weather immediately after Drawing with Blocks', () => {
    expect(starterGroupOf('snow')).toBe('Weather');
    const at = STARTER_GROUPS.findIndex((g) => g.name === 'Drawing with Blocks');
    expect(STARTER_GROUPS[at + 1].name).toBe('Weather');
    expect(heroOfStarter('snow')).toBe('KIT');
  });
  it('adds a course after the existing block and showcase courses', () => {
    expect(courseNumber('dialog')).toBe(609);
    expect(courseNumber('under-the-hood')).toBe(617);
    expect(courseNumber('leaves')).toBe(622);
    expect(courseNumber('snow')).toBe(623);
  });
});
