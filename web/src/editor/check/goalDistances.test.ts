// Goal ranking must allow detours, wrapped routes, and blocks that can open.
import { expect, it } from 'vitest';
import { goalDistances } from './goalDistances';
import { SceneSim } from './sim';
import { testGame } from './testGame';

it('prefers the passage around a wall over the nearby dead end', () => {
  const t = testGame(['#########', '#...#..E#', '#...#...#', '#...#...#', '#.......#', '#########']);
  const w = new SceneSim(t.game, 2, t, { x: 1, y: 1 }).w;
  const d = goalDistances(w, [107]);
  expect(d[103]).toBe(10);
  expect(d[403]).toBe(7);
  expect(d[104]).toBe(0xffff);
});

it('allows a counter gate and a timed transformation cycle that can open', () => {
  const t = testGame(['#######', '#S...E#', '#######']);
  const w = new SceneSim(t.game, 2, t, { x: 1, y: 1 }).w;
  Object.assign(w.bg[4], { solid: 15, effect: 20, eamt: -1, touchBl: 5 });
  Object.assign(w.bg[5], { solid: 15, touchBl: 4, ntime: 2, nextBl: 0 });
  w.map[103] = 4;
  expect(goalDistances(w, [105])[101]).toBe(4);
  w.bg[5].ntime = 0;
  expect(goalDistances(w, [105])[101]).toBe(0xffff);
});

it('wraps at both map boundaries and uses the nearest of several goals', () => {
  const t = testGame(['S.E']);
  const w = new SceneSim(t.game, 2, t, { x: 0, y: 0 }).w;
  w.map.fill(0);
  expect(goalDistances(w, [0, 5050])[99]).toBe(1);
  expect(goalDistances(w, [0])[9900]).toBe(1);
  expect(goalDistances(w, [0, 5050])[5051]).toBe(1);
});
