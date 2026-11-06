import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADVTYPE, emptyScene, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CEREMONIES, stageGames } from '../project/ceremonies';
import { CourseRun, GRADES_KEY, clearGrades, levelNumbers, loadGrades } from './courseGrades';

const course = stageGames(CEREMONIES[0])[0];
const game = (levels: number) => {
  const g = newGame('T');
  for (let i = 0; i < levels; i++) g.scenes.push(emptyScene(ADVTYPE));
  return g;
};

beforeEach(() => {
  const kept = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => kept.get(k) ?? null,
    setItem: (k: string, v: string) => void kept.set(k, v),
    removeItem: (k: string) => void kept.delete(k),
  });
});

describe('course grades', () => {
  it('numbers the level scenes after the title and the ending', () => {
    const n = levelNumbers(game(3));
    expect([n.levelOf(0), n.levelOf(1), n.levelOf(2), n.levelOf(4)]).toEqual([0, 0, 1, 3]);
    expect(n.levels).toBe(3);
  });
  it('records the best grade of a play as it goes, and a worse retake changes nothing', () => {
    const run = new CourseRun(course, game(3));
    run.scene(2);
    expect(loadGrades()[course]).toBeUndefined();
    run.moved();
    run.end();
    expect(loadGrades()[course]).toBe('C');
    run.scene(3);
    expect(loadGrades()[course]).toBe('B-');
    const again = new CourseRun(course, game(3));
    again.scene(2);
    again.lifeLost();
    again.end();
    expect(loadGrades()[course]).toBe('B-');
    again.scene(1);
    expect(loadGrades()[course]).toBe('A');
  });
  it('a life lost on level 1 is a D+, and a game that is not a course is not recorded', () => {
    const run = new CourseRun(course, game(2));
    run.scene(2);
    run.moved();
    run.lifeLost();
    run.end();
    expect(loadGrades()[course]).toBe('D+');
    const idle = new CourseRun(stageGames(CEREMONIES[0])[1], game(2));
    idle.scene(2);
    idle.end();
    expect(loadGrades()[stageGames(CEREMONIES[0])[1]]).toBe('C-');
    const other = new CourseRun('not-a-starter', game(2));
    other.scene(2);
    other.moved();
    expect(loadGrades()['not-a-starter']).toBeUndefined();
  });
  it('is forgotten by a reset and survives bad data', () => {
    const r = new CourseRun(course, game(2));
    r.scene(2);
    r.end();
    clearGrades();
    expect(loadGrades()).toEqual({});
    localStorage.setItem(GRADES_KEY, '{oops');
    expect(loadGrades()).toEqual({});
  });
});
