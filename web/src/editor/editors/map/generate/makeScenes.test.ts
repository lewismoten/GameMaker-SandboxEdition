// "Make these scenes": a town's doors become scenes with links both ways, within a scene's link limit.
import { describe, expect, it } from 'vitest';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, SCENEDESCLEN, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { generate, type GenResult } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { makeScenes, planScenes } from './makeScenes';

const set = (...pairs: [number, string[]][]): RoleMap => Object.fromEntries(pairs.map(([n, roles]) => [n, { roles }])) as RoleMap;
const roles = set([1, ['wall']], [2, ['floor']], [3, ['path']], [4, ['tree']], [5, ['door']], [6, ['decoration']], [7, ['wall-top']]);

function town(seed = 5): GenResult {
  const o = generate(roles, { kind: 'town', seed, rect: { x: 0, y: 0, w: 100, h: 100 } });
  if (!o.ok) throw new Error(o.message);
  return o.result;
}

function hostGame(taken = 0): Game {
  const g = newGame('T');
  const s = emptyScene(ADVTYPE);
  s.desc = 'Town';
  s.files = ['x.pal', 'town.map', 'x.bbl', 'x.mon', 'x.mbl', 'x.chr', 'x.cbl', '', 'x.cmf', 'intro.gif', 'exit.gif', ...new Array(9).fill('')].slice(
    0,
    s.files.length,
  );
  for (let i = 0; i < taken; i++) s.links[i] = { toScene: 1, from: { x: 90 + i, y: 1 }, to: { x: 0, y: 0 } };
  g.scenes.push(s);
  return g;
}

const run = (game: Game, result: GenResult, files = new Map<string, Uint8Array>()) =>
  makeScenes({ game, hostScene: 2, result, roles, terrains: [], bg: undefined, seed: 7, has: (n) => files.has(n), put: (n, b) => files.set(n, b) });

describe('make scenes from a layout’s links', () => {
  it('makes a scene per usable door, linked both ways with arrival spots beside the doors', () => {
    const r = town();
    const game = hostGame();
    const files = new Map<string, Uint8Array>();
    const out = run(game, r, files);
    // the gates lead to an overworld, which these roles cannot draw (no water or rock marked)
    expect(out.skipped.every((s) => s.label.includes('gate'))).toBe(true);
    expect(out.made.length).toBeGreaterThan(0);
    expect(out.made.length + out.skipped.length).toBe(r.links.length);
    const host = game.scenes[2];
    const used = host.links.filter((l) => l.toScene !== NOSCENE);
    expect(used).toHaveLength(out.made.length);
    for (const m of out.made) {
      const s = game.scenes[m.scene];
      expect(s.desc.length).toBeLessThan(SCENEDESCLEN);
      expect(s.files[1]).toBe(m.map);
      expect(s.files[2]).toBe('x.bbl');
      expect(s.files[9]).toBe('');
      const into = used.find((l) => l.toScene === m.scene)!;
      expect(into).toBeTruthy();
      expect(s.links[0].toScene).toBe(2);
      // the way in lands on a spot that is not the cell the way out leaves from, and the way back lands beside the door
      expect(`${into.to.x},${into.to.y}`).not.toBe(`${s.links[0].from.x},${s.links[0].from.y}`);
      expect(Math.abs(s.links[0].to.x - into.from.x) + Math.abs(s.links[0].to.y - into.from.y)).toBe(1);
      expect(`${s.links[0].to.x},${s.links[0].to.y}`).not.toBe(`${into.from.x},${into.from.y}`);
      expect(parseMap(files.get(m.map)!).blocks).toHaveLength(MLEN * MLEN);
    }
    expect(new Set(out.made.map((m) => m.map)).size).toBe(out.made.length);
  });
  it('makes only as many scenes as the host has free links, and says what it skipped', () => {
    const r = town();
    const game = hostGame(MAXSCENELINKS - 2);
    const plan = planScenes(game, 2, r, roles);
    expect(plan.make).toHaveLength(2);
    expect(plan.skipped.some((s) => s.why.includes(`${MAXSCENELINKS} links`))).toBe(true);
    const out = run(game, r);
    expect(out.made.length).toBeLessThanOrEqual(2);
  });
  it('skips a door whose block already has a link, and makes nothing when no scene plays the map', () => {
    const r = town();
    const first = planScenes(hostGame(), 2, r, roles).make[0];
    const game = hostGame();
    game.scenes[2].links[0] = { toScene: 1, from: first.door, to: { x: 0, y: 0 } };
    expect(planScenes(game, 2, r, roles).skipped.some((s) => s.why.includes('already has a link'))).toBe(true);
    expect(planScenes(newGame('X'), 9, r, roles).make).toHaveLength(0);
  });
  it('skips a kind whose blocks are not marked, naming why', () => {
    const noDoor = set([1, ['wall']], [2, ['floor']], [3, ['path']], [7, ['wall-top']]);
    const plan = planScenes(hostGame(), 2, town(), noDoor);
    expect(plan.skipped.length).toBeGreaterThan(0);
    expect(plan.skipped[0].why).toContain('not marked');
  });
});
