// One Play and record session (playSession.ts): the frames on this map make the heat map, the
// keys of a try that reaches an exit make the take, and both are kept as the panel reads them.
import { describe, expect, it } from 'vitest';
import type { Project } from '../../../core/project';
import { decodeKeys } from '../../../../walkthrough/format';
import { RIGHT, testGame } from '../../../check/testGame';
import { TakeRecorder } from '../../../check/walk/takes';
import { keepPlay, myPlays } from '../../../check/walk/mine';
import { MY_HEAT, unpackMine, type MyHeatSaved } from './myHeat';
import { PlaySession, keepHeat } from './playSession';

const world = (x: number, y: number, clock: number) => ({ chr: { x: [x, 0], y: [y, 0], cseq: 0 }, ci: { topthere: false }, clock }) as never;

/** Just enough of a project for the companion's sections. */
function fakeProject(): Project {
  const data = new Map<string, unknown>();
  return {
    gam: 'test.gam',
    extras: (f: string, s: string, fb: unknown) => (data.has(`${f}|${s}`) ? data.get(`${f}|${s}`) : fb),
    setExtras: (f: string, s: string, v: unknown) => (v === undefined ? data.delete(`${f}|${s}`) : data.set(`${f}|${s}`, v)),
  } as unknown as Project;
}

describe('a Play and record session', () => {
  it('records heat on this map and cuts the try that reached an exit', () => {
    const t = testGame(['#####', '#S.E#', '#####']);
    const s = new PlaySession(t.game, 2, 'TEST.MAP');
    const rec = new TakeRecorder();
    rec.initRecord();
    s.begin(rec);
    const tick = (n: number) => {
      for (let i = 0; i < n; i++) rec.doPlayback();
    };
    expect(s.enter(2)).toBeUndefined();
    s.frame(world(1, 1, 50));
    tick(2);
    rec.doRecord(RIGHT);
    s.frame(world(1, 1, 52));
    tick(3);
    rec.doRecord(RIGHT | 0x80);
    s.frame(world(2, 1, 55));
    const take = s.enter(1)!; // won
    expect(take).toMatchObject({ scene: 2, next: 1 });
    expect(decodeKeys(take.keys)).toEqual([
      { delta: 2, key: RIGHT },
      { delta: 3, key: RIGHT | 0x80 },
    ]);
    // the won scene plays no map: no more heat
    s.frame(world(9, 9, 1));
    s.frame(world(9, 9, 40));
    expect(s.heat.rec.ticks).toBe(5);
    expect(s.heat.rec.heat[1 * 100 + 2]).toBe(3);
    expect(s.heat.rec.heat[9 * 100 + 9]).toBe(0);
  });

  it('keeps both: the heat grows by session, the latest kept play replaces the last', () => {
    const t = testGame(['#####', '#S.E#', '#####']);
    const p = fakeProject();
    for (const ticks of [5, 7]) {
      const s = new PlaySession(t.game, 2, 'test.map');
      s.enter(2);
      s.frame(world(1, 1, 0));
      s.frame(world(1, 1, ticks));
      keepHeat(p, 'test.map', s.heat.rec);
      keepPlay(p, { scene: 2, next: 1, keys: '', ticks });
    }
    const kept = p.extras<MyHeatSaved | undefined>('test.map', MY_HEAT, undefined)!;
    expect(kept).toMatchObject({ sessions: 2, ticks: 12 });
    expect(unpackMine(kept).heat[101]).toBe(12);
    expect(myPlays(p)[2]).toMatchObject({ ticks: 7, use: 'mine' });
    // a session with no play adds nothing
    expect(keepHeat(p, 'test.map', new PlaySession(t.game, 2, 'test.map').heat.rec)).toBe(kept);
  });
});
