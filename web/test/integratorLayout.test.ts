import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADVTYPE, NOSCENE, emptyScene, newGame, parseGame, type Game } from '../src/formats/game';
import { CARD_UNITS, POS_MAX, POS_MIN, clampPos, sceneLayers, settle } from '../src/editor/editors/integrator/layoutCells';
import { arrangements, autoArrange, layoutCost, spreadOut } from '../src/editor/editors/integrator/integratorLayout';

function chain(n: number): Game {
  const g = newGame('Test');
  for (let i = 0; i < n; i++) g.scenes.push(emptyScene(ADVTYPE));
  g.scenes[0].links[0].toScene = 2;
  for (let i = 2; i < 2 + n; i++) g.scenes[i].links[0].toScene = i + 1 < 2 + n ? i + 1 : 1;
  return g;
}

function checkNoOverlap(game: Game, pos: Map<number, { x: number; y: number }>): void {
  const used = game.scenes.map((_, i) => i).filter((i) => game.scenes[i].gametype !== NOSCENE);
  expect([...pos.keys()].sort((a, b) => a - b)).toEqual(used);
  for (const p of pos.values()) {
    expect(p.x).toBeGreaterThanOrEqual(POS_MIN.x);
    expect(p.y).toBeGreaterThanOrEqual(POS_MIN.y);
    expect(p.x).toBeLessThanOrEqual(POS_MAX.x);
    expect(p.y).toBeLessThanOrEqual(POS_MAX.y);
  }
  const all = [...pos.values()];
  for (let a = 0; a < all.length; a++)
    for (let b = a + 1; b < all.length; b++) {
      const apart = Math.abs(all[a].x - all[b].x) >= CARD_UNITS.w - 1 || Math.abs(all[a].y - all[b].y) >= CARD_UNITS.h - 1;
      expect(apart, `${JSON.stringify(all[a])} vs ${JSON.stringify(all[b])}`).toBe(true);
    }
}

describe('integrator layout', () => {
  it('clamps positions into the DOS world', () => {
    expect(clampPos({ x: -5, y: 500 })).toEqual({ x: POS_MIN.x, y: POS_MAX.y });
  });

  it('layers scenes by distance from the start, the end last', () => {
    const g = chain(3);
    g.scenes.push(emptyScene(ADVTYPE)); // unreachable
    expect(sceneLayers(g)).toEqual([[0], [2], [3], [4], [5], [1]]);
  });

  it('lays out a short chain as columns, left to right', () => {
    const g = chain(4);
    const pos = autoArrange(g);
    checkNoOverlap(g, pos);
    expect(pos.get(0)!.x).toBeLessThan(pos.get(2)!.x);
    expect(pos.get(5)!.x).toBeLessThan(pos.get(1)!.x);
  });

  it('falls back to a grid for long games without overlaps', () => {
    const g = chain(100);
    checkNoOverlap(g, autoArrange(g));
  });

  it('arranges Maximus', () => {
    const file = resolve(__dirname, '../../games/maximus/disk/maximus.gam');
    if (!existsSync(file)) return;
    const g = parseGame(new Uint8Array(readFileSync(file)));
    checkNoOverlap(g, autoArrange(g));
    checkNoOverlap(g, spreadOut(g));
  });

  it('spreads out piled-up scenes, keeping left and right', () => {
    const g = chain(6);
    g.scenes.forEach((s, i) => (s.pos = { x: 100 + (i % 2), y: 100 }));
    g.scenes[0].pos = { x: 10, y: 100 };
    g.scenes[1].pos = { x: 300, y: 100 };
    const pos = spreadOut(g);
    checkNoOverlap(g, pos);
    expect(pos.get(0)!.x).toBeLessThan(pos.get(3)!.x);
    expect(pos.get(1)!.x).toBeGreaterThan(pos.get(3)!.x);
  });

  it('settles wanted columns in order, one apart, as near as can be', () => {
    expect(settle([0, 5, 9])).toEqual([0, 5, 9]);
    expect(settle([3, 3, 3])).toEqual([2, 3, 4]);
    expect(settle([1, 0, 0], 0)).toEqual([0, 1, 2]);
  });

  it('leaves a tidy arrangement alone when spreading out', () => {
    const g = chain(3);
    g.scenes.forEach((s, i) => (s.pos = { x: 20 + i * 40, y: 60 + (i % 2) * 30 }));
    const pos = spreadOut(g);
    g.scenes.forEach((s, i) => expect(pos.get(i)).toEqual(s.pos));
  });

  it('offers other arrangements, best first', () => {
    const list = arrangements(chain(5));
    expect(list.length).toBeGreaterThan(1);
    for (let i = 1; i < list.length; i++) expect(list[i].cost).toBeGreaterThanOrEqual(list[i - 1].cost);
  });

  // every game on the CD and in games/: clean layouts, fast
  const DENSE = new Set(['games/sleuth/disk/final.gam']);
  const root = resolve(__dirname, '../..');
  const gams: string[] = [];
  for (const dir of ['cd/gameware', 'cd/sharware', 'games'])
    if (existsSync(resolve(root, dir)))
      for (const d of readdirSync(resolve(root, dir))) {
        const base = existsSync(resolve(root, dir, d, 'disk')) ? resolve(root, dir, d, 'disk') : resolve(root, dir, d);
        if (statSync(base).isDirectory()) for (const f of readdirSync(base)) if (/\.gam$/i.test(f)) gams.push(resolve(base, f));
      }
  it.each(gams.map((f) => [f.slice(root.length + 1), f]))('arranges %s cleanly', (_, file) => {
    const g = parseGame(new Uint8Array(readFileSync(file)));
    const t = performance.now();
    const pos = autoArrange(g);
    expect(performance.now() - t).toBeLessThan(1500);
    checkNoOverlap(g, pos);
    const pairs: [number, number][] = [];
    g.scenes.forEach((s, i) => {
      if (s.gametype === NOSCENE) return;
      for (const l of s.links)
        if (l.toScene !== NOSCENE && l.toScene !== i && g.scenes[l.toScene] && g.scenes[l.toScene].gametype !== NOSCENE) pairs.push([i, l.toScene]);
    });
    const centres = new Map([...pos].map(([s, p]) => [s, { x: p.x + 2, y: p.y + 2 }]));
    // Final Curtain's conversations are scenes that all link to one another (each answer is
    // a scene you can ask the next question from), so its graph cannot be drawn flat.
    if (!DENSE.has(_)) expect(layoutCost(pairs, centres, { w: 22, h: 18 }).cross).toBe(0);
    checkNoOverlap(g, spreadOut(g));
  });
});
