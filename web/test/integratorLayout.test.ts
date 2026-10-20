import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADVTYPE, NOSCENE, emptyScene, newGame, parseGame, type Game } from '../src/formats/game';
import { CARD_UNITS, POS_MAX, POS_MIN, autoArrange, clampPos, sceneLayers } from '../src/editor/integratorLayout';

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
  });
});
