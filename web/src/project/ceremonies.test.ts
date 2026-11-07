import { describe, expect, it } from 'vitest';
import {
  CEREMONIES,
  DIPLOMA,
  ceremonyState,
  certificateTitle,
  ceremonyTitle,
  courseGame,
  courseNumber,
  diplomaNudge,
  diplomaTier,
  highestLevel,
  isCeremony,
  needed,
  stageGames,
  transcript,
  unlockRule,
} from './ceremonies';
import type { Grades } from './grades';
import { STARTER_GROUPS, STARTER_ORDER } from './starter';
import { STARTER_HEROES } from './starterHeroes';

const basics = () => stageGames(CEREMONIES[0]);
const grade = (ids: string[], g: 'A' | 'B' | 'C'): Grades => Object.fromEntries(ids.map((id) => [id, g]));

describe('ceremonies', () => {
  it('names things as designed', () => {
    expect(ceremonyTitle(CEREMONIES[0])).toBe('Graduation: First Steps');
    expect(certificateTitle(CEREMONIES[0])).toBe('Honors in First Steps');
    expect(ceremonyTitle(DIPLOMA)).toBe('The Sandbox Diploma');
  });
  it('every stage names real groups, and each group is in exactly one stage', () => {
    const names = STARTER_GROUPS.map((g) => g.name);
    const used = CEREMONIES.flatMap((c) => c.groups);
    for (const g of used) expect(names).toContain(g);
    expect(new Set(used).size).toBe(used.length);
  });
  it('course numbers are the stage and the place in it, three digits, never twice', () => {
    expect(courseNumber(basics()[0])).toBe(101);
    expect(courseNumber(basics()[1])).toBe(102);
    expect(courseNumber(stageGames(CEREMONIES[1])[0])).toBe(201);
    expect(courseGame(102)).toBe(basics()[1]);
    expect(courseGame(999)).toBeUndefined();
    expect(courseNumber('graduation-basics')).toBeUndefined();
    const all = CEREMONIES.flatMap((c) => stageGames(c)).map((id) => courseNumber(id)!);
    expect(new Set(all).size).toBe(all.length);
    for (const n of all) expect(n >= 101 && n <= 699).toBe(true);
  });

  it('a Starter added later takes the next course number of its stage, so no other course number moves', () => {
    expect(courseNumber('dialog')).toBe(609);
    expect(courseNumber('under-the-hood')).toBe(617);
    expect(['around-the-room', 'ride-along'].map(courseNumber)).toEqual([618, 619]);
    expect(['lightning-bugs', 'fireworks', 'leaves'].map(courseNumber)).toEqual([620, 621, 622]);
    expect(courseGame(622)).toBe('leaves');
  });

  it('needs a B or better in at least three of every four, rounded up', () => {
    for (const c of CEREMONIES) expect(needed(c)).toBe(Math.ceil(stageGames(c).length * 0.75));
    expect(unlockRule(CEREMONIES[0])).toBe(`Get a B or better in ${needed(CEREMONIES[0])} of the ${basics().length} courses.`);
  });
  it('is locked with progress, opens at the threshold, and is earned once its id is finished', () => {
    const c = CEREMONIES[0];
    const need = needed(c);
    const locked = ceremonyState(c, grade(basics().slice(0, need - 1), 'B'), new Set());
    expect(locked.state).toBe('locked');
    if (locked.state === 'locked') {
      expect(locked.progress).toBe(`${need - 1} of ${need} needed`);
      expect(locked.missing.length).toBe(basics().length - (need - 1));
    }
    expect(ceremonyState(c, grade(basics().slice(0, need), 'B'), new Set()).state).toBe('open');
    expect(ceremonyState(c, {}, new Set(basics().slice(0, need))).state).toBe('open');
    expect(ceremonyState(c, grade(basics(), 'C'), new Set()).state).toBe('locked');
    expect(ceremonyState(c, {}, new Set([c.id])).state).toBe('earned');
  });
  it("one stage's honors do not unlock another stage", () => {
    expect(ceremonyState(CEREMONIES[1], {}, new Set([CEREMONIES[0].id])).state).toBe('locked');
  });
  it('the diploma needs all six honors', () => {
    const s = ceremonyState(DIPLOMA, {}, new Set(CEREMONIES.slice(0, 5).map((c) => c.id)));
    expect(s.state).toBe('locked');
    if (s.state === 'locked') expect(s.progress).toBe('5 of 6 needed');
    expect(ceremonyState(DIPLOMA, {}, new Set(CEREMONIES.map((c) => c.id))).state).toBe('open');
    expect(ceremonyState(DIPLOMA, {}, new Set([DIPLOMA.id])).state).toBe('earned');
  });
  it('the transcript lists every course with its grade, a GPA a stage and an overall one', () => {
    const t = transcript({ [basics()[0]]: 'B', [basics()[1]]: 'C' }, new Set([basics()[2]]));
    expect(t.stages).toHaveLength(6);
    expect(t.stages[0].rows).toHaveLength(basics().length);
    expect(t.stages[0].rows[0]).toEqual({ id: basics()[0], course: 101, grade: 'B' });
    expect(t.stages[0].rows[2].grade).toBe('A');
    expect(t.stages[0].gpa).toBe(3);
    expect(t.stages[1].gpa).toBeUndefined();
    expect(t.gpa).toBe(3);
  });
  it('levels follow the number of honors', () => {
    const ids = CEREMONIES.map((c) => c.id);
    expect(highestLevel(new Set())).toBeUndefined();
    expect(highestLevel(new Set(basics()))).toBeUndefined();
    const lv = (n: number) => highestLevel(new Set(ids.slice(0, n)));
    expect([1, 2, 3, 4, 5, 6].map(lv)).toEqual(['Beginner', 'Beginner', 'Maker', 'Maker', 'Designer', 'Master']);
    expect(highestLevel(new Set([...ids, DIPLOMA.id]))).toBe('Graduate');
  });
  it('graduations stay out of the Starter groups, order and heroes', () => {
    for (const c of [...CEREMONIES, DIPLOMA]) {
      expect(isCeremony(c.id)).toBe(true);
      expect(STARTER_ORDER).not.toContain(c.id);
      expect(STARTER_HEROES[c.id]).toBeUndefined();
    }
    expect(isCeremony('first-steps')).toBe(false);
  });

  describe('diploma tiers', () => {
    const all = () => CEREMONIES.flatMap(stageGames);
    const done = new Set([...CEREMONIES.map((c) => c.id), DIPLOMA.id]);
    it('is undefined before the diploma, plain with no grades', () => {
      expect(diplomaTier({}, new Set())).toBeUndefined();
      expect(diplomaTier({}, done)).toBe('diploma');
    });
    it('Highest Honors needs a B in every course; a perfect 4.0 needs an A in every course', () => {
      expect(diplomaTier(grade(all(), 'B'), done)).toBe('highest');
      expect(diplomaTier(grade(all(), 'A'), done)).toBe('perfect');
      expect(diplomaTier({ ...grade(all(), 'A'), [all()[0]]: 'C' }, done)).toBe('diploma');
      expect(diplomaTier(grade(all(), 'B'), new Set(CEREMONIES.map((c) => c.id)))).toBeUndefined();
    });
    it('the desk title follows the tier', () => {
      expect(highestLevel(done, {})).toBe('Graduate');
      expect(highestLevel(done, grade(all(), 'B'))).toBe('Honor Graduate');
      expect(highestLevel(done, grade(all(), 'A'))).toBe('Valedictorian');
    });
    it('nudges only toward Highest Honors, one to three courses out, never toward the 4.0', () => {
      const g = grade(all(), 'B');
      expect(diplomaNudge({ ...g, [all()[0]]: 'C' }, done)).toBe('One course left for Highest Honors!');
      expect(diplomaNudge({ ...g, [all()[0]]: 'C', [all()[1]]: 'C', [all()[2]]: 'C' }, done)).toBe('Three courses left for Highest Honors!');
      expect(diplomaNudge(grade(all().slice(4), 'B'), done)).toBeUndefined();
      expect(diplomaNudge(g, done)).toBeUndefined();
      expect(diplomaNudge(grade(all(), 'A'), done)).toBeUndefined();
    });
  });
});
