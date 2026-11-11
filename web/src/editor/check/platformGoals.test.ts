// Footing guidance must respect walls, jump height, and the map's wrap.
import { expect, it } from 'vitest';
import { directionalGravity, platformGoals } from './platformGoals';
import { SceneSim } from './sim';
import { testGame } from './testGame';

function jumping(rows: string[]) {
  const t = testGame(rows);
  const w = new SceneSim(t.game, 2, t, { x: 1, y: 1 }).w;
  const s = w.chr.sequences[7];
  s.key = 0x4800;
  w.ci.seqon[7] = true;
  w.ci.meter[7] = 32767;
  Object.assign(s.frames[0], { x: 0, y: -10, pic1: 50, pic2: 0 });
  return w;
}

it('finds a two-block rise to a ledge with room for the jump arc', () => {
  const w = jumping([
    '############',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#...##.....#',
    '#..........#',
    '#.....##...#',
    '############',
  ]);
  const d = platformGoals(w, [505])!.normal;
  expect(d[505]).toBe(0);
  expect(d[706]).toBe(1);
});

it('does not call a fall through a permanent floor a route to the goal', () => {
  const w = jumping(['########', '#......#', '#......#', '########', '########', '#...E..#', '########']);
  const d = platformGoals(w, [504])!.normal;
  expect(d[202]).toBe(0xffff);
  expect(d[501]).toBeLessThan(0xffff);
});

it('finds a jump across the top/bottom boundary', () => {
  const w = jumping(['S']);
  w.map.fill(0);
  w.map[202] = 1;
  w.map[4] = 1;
  expect(platformGoals(w, [9904])!.normal[102]).toBe(1);
});

it('leaves a scene without a reusable jump to the ordinary search', () => {
  const t = testGame(['#####', '#S.E#', '#####']);
  expect(platformGoals(new SceneSim(t.game, 2, t, { x: 1, y: 1 }).w, [103])).toBeUndefined();
});

it('spends a finite jump at most once in its suggested footing route', () => {
  const w = jumping(['S']);
  w.map.fill(1);
  for (let y = 1; y < 99; y++) for (let x = 1; x <= 40; x++) w.map[y * 100 + x] = 0;
  w.map[8110] = 1;
  w.map[6115] = 1;
  w.map[4120] = 1;
  const boost = w.chr.sequences[19];
  boost.key = 0x1c00;
  boost.momentum = 1;
  Object.assign(boost.frames[0], { x: 0, y: -30, pic1: 50, pic2: 0 });
  w.ci.seqon[19] = true;
  w.ci.meter[19] = 1;
  const d = platformGoals(w, [4020])!;
  expect(d.normal[6015]).toBe(0xffff);
  expect(d.boosted![6015]).toBe(1);
  expect(d.boosted![8010]).toBe(0xffff);
});

it('looks beyond a closed timed passage while leaving its opening time to the engine', () => {
  const w = jumping(['#########', '#########', '#########', '#S....E.#', '#########']);
  Object.assign(w.bg[4], { solid: 15, nextBl: 5, ntime: 16 });
  Object.assign(w.bg[5], { solid: 0, nextBl: 4, ntime: 16 });
  w.map[304] = 4;
  expect(platformGoals(w, [306])!.normal[302]).toBeLessThan(0xffff);
});

it('allows a retracted block to become a footing on a later animation phase', () => {
  const w = jumping(['S']);
  w.map.fill(0);
  w.map[202] = 1;
  w.map[4] = 5;
  Object.assign(w.bg[4], { solid: 15, nextBl: 5, ntime: 16 });
  Object.assign(w.bg[5], { solid: 0, nextBl: 4, ntime: 16 });
  expect(platformGoals(w, [9904])!.normal[9904]).toBe(0);
  expect(platformGoals(w, [9904])!.normal[102]).toBe(1);
});

it('leaves continuous flight to the ordinary search instead of requiring landings', () => {
  const w = jumping(['########', '#......#', '#......#', '########']);
  for (const f of w.chr.sequences[7].frames) Object.assign(f, { x: 0, y: -2, pic1: 50, pic2: 0 });
  expect(platformGoals(w, [102])).toBeUndefined();
});

it('allows a sideways ascent out from under an overhang', () => {
  const w = jumping(['S']);
  w.map.fill(1);
  for (let y = 1; y <= 8; y++) for (let x = 1; x <= 8; x++) w.map[y * 100 + x] = 0;
  w.map[601] = 1;
  w.map[401] = 1;
  w.map[403] = 1;
  expect(platformGoals(w, [303])!.normal[501]).toBe(1);
});

it('ignores unused gravity blocks and canceled directions on placed terrain', () => {
  const w = jumping(['#####', '#S.E#', '#####']);
  w.bg[0].grav = 15;
  w.bg[12].grav = 4;
  expect(directionalGravity(w)).toBe(false);
  expect(platformGoals(w, [103])).toBeUndefined();
  w.map[102] = 12;
  expect(directionalGravity(w)).toBe(true);
});

it('does not turn top-down swimming into jumping because lethal terrain pulls downward', () => {
  const t = testGame(['########', '#S.^..E#', '########']);
  const w = new SceneSim(t.game, 2, t, { x: 1, y: 1 }).w;
  w.bg[0].grav = 0;
  w.bg[1].grav = 4; // Gravity inside a permanent wall is not a movement mode.
  w.bg[3].chHitPt = -w.ci.hitpts;
  expect(directionalGravity(w)).toBe(false);
  w.bg[0].grav = 4;
  expect(directionalGravity(w)).toBe(true);
});
