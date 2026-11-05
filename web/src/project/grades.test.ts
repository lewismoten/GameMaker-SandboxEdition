import { describe, expect, it } from 'vitest';
import { betterGrade, gpa, gradeOfRun, parseGrades, recordRun, withFinished, type Run } from './grades';

const run = (o: Partial<Run>): Run => ({ furthest: 1, moved: true, deaths1: 0, won: false, ...o });

describe('gradeOfRun', () => {
  it('grades by how far the player got', () => {
    expect(gradeOfRun(run({ won: true, furthest: 3 }), 3)).toBe('A');
    expect(gradeOfRun(run({ furthest: 3 }), 3)).toBe('B');
    expect(gradeOfRun(run({ furthest: 4 }), 5)).toBe('B-');
    expect(gradeOfRun(run({ furthest: 3 }), 5)).toBe('B-');
    expect(gradeOfRun(run({ furthest: 2 }), 5)).toBe('C+');
    expect(gradeOfRun(run({ furthest: 2 }), 3)).toBe('B-');
    expect(gradeOfRun(run({}), 3)).toBe('C');
    expect(gradeOfRun(run({ moved: false }), 3)).toBe('C-');
    expect(gradeOfRun(run({ deaths1: 1 }), 3)).toBe('D+');
    expect(gradeOfRun(run({ furthest: 0, moved: false }), 3)).toBeUndefined();
  });
  it('a one-level game is an A or a start', () => {
    expect(gradeOfRun(run({ won: true }), 1)).toBe('A');
    expect(gradeOfRun(run({}), 1)).toBe('C');
  });
});

describe('best grade and GPA', () => {
  it('a retake only raises a grade', () => {
    let g = recordRun({}, 'x', run({ furthest: 2 }), 3);
    expect(g.x).toBe('B-');
    g = recordRun(g, 'x', run({ deaths1: 2 }), 3);
    expect(g.x).toBe('B-');
    g = recordRun(g, 'x', run({ won: true }), 3);
    expect(g.x).toBe('A');
    expect(betterGrade(undefined, 'C')).toBe('C');
  });
  it('averages on the 4.0 scale and leaves out ungraded courses', () => {
    expect(gpa(['A', 'B', undefined])).toBe(3.5);
    expect(gpa(['B-', 'C+', 'C', 'C-', 'D+'])).toBe(2);
    expect(gpa([undefined])).toBeUndefined();
  });
  it('a finished game is an A, and bad saved data is dropped', () => {
    expect(withFinished({ a: 'C' }, new Set(['a', 'b']))).toEqual({ a: 'A', b: 'A' });
    expect(parseGrades({ a: 'A', b: 'F', c: 5 })).toEqual({ a: 'A' });
    expect(parseGrades(null)).toEqual({});
  });
});
