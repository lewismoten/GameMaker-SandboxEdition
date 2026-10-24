// The bot's route for one scene (botRoutes.ts) remembers what the scene played with, so a map
// edit since shows it is out of date, and moving or renaming the scene doesn't.
import { describe, expect, it } from 'vitest';
import type { Project } from '../../core/project';
import { parseGame, serializeGame, type Game } from '../../../formats/game';
import { GameFiles } from '../../../project/files';
import type { Walkthrough } from '../../../walkthrough/format';
import { testGame } from '../testGame';
import { keepBotRoute, routeState, sceneHash } from './botRoutes';

function fakeProject(): Project & { files: GameFiles } {
  const t = testGame(['#####', '#S.E#', '#####']);
  const files = new GameFiles([...t.files]);
  const data = new Map<string, unknown>();
  return {
    gam: 'test.gam',
    files,
    game: () => parseGame(files.get('test.gam')!),
    extras: (f: string, s: string, fb: unknown) => (data.has(`${f}|${s}`) ? data.get(`${f}|${s}`) : fb),
    setExtras: (f: string, s: string, v: unknown) => (v === undefined ? data.delete(`${f}|${s}`) : data.set(`${f}|${s}`, v)),
  } as unknown as Project & { files: GameFiles };
}

const walk = (scene: number) => ({ segments: [{ scene, keys: '' }], timeline: { frames: 10 } }) as unknown as Walkthrough;
const edit = (p: Project, fn: (g: Game) => void) => {
  const g = p.game();
  fn(g);
  p.files.set('test.gam', serializeGame(g));
};

describe('the bot’s route of a scene', () => {
  it('is out of date once the scene’s map changes, not when its box moves or is renamed', () => {
    const p = fakeProject();
    expect(routeState(p, 2)).toEqual({ from: 'none' });
    keepBotRoute(p, 2, walk(2), 'then');
    expect(routeState(p, 2)).toEqual({ from: 'scene', when: 'then', stale: false });
    edit(p, (g) => ((g.scenes[2].pos = { x: 9, y: 9 }), (g.scenes[2].desc = 'Renamed')));
    expect(routeState(p, 2)).toMatchObject({ stale: false });
    const map = p.files.get('test.map')!.slice();
    map[map.length - 1] ^= 1;
    p.files.set('test.map', map);
    expect(routeState(p, 2)).toMatchObject({ from: 'scene', stale: true });
    // made again: up to date
    keepBotRoute(p, 2, walk(2));
    expect(routeState(p, 2)).toMatchObject({ stale: false });
  });

  it('changes with the scene’s links and files, and a route kept without one is not called out of date', () => {
    const p = fakeProject();
    const before = sceneHash(p.game(), p.files, 2);
    edit(p, (g) => (g.scenes[2].links[0].to = { x: 3, y: 3 }));
    expect(sceneHash(p.game(), p.files, 2)).not.toBe(before);
    p.setExtras('test.gam', 'botRoutes', { 2: { when: 'old', walk: walk(2) } });
    expect(routeState(p, 2)).toMatchObject({ stale: false });
  });

  it('comes from the game’s walkthrough when that goes through the scene', () => {
    const p = fakeProject();
    p.setExtras('test.gam', 'walkthrough', { walk: walk(2) });
    expect(routeState(p, 2)).toEqual({ from: 'walkthrough' });
  });
});
