// Tests: Auto-arrange and Spread out in the integrator (editors/integrator/layoutCells.ts, integratorLayout.ts), on the CD's games.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADVTYPE, ENDTYPE, NOSCENE, emptyScene, newGame, parseGame, serializeGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addReturnScenes } from '../../games/kit/starter/returnScenes';
import { CARD_UNITS, POS_MAX, POS_MIN, clampPos, sceneLayers, settle } from '../src/editor/editors/integrator/layoutCells';
import { SNUG_GAP, arrangements, autoArrange, closeGaps, gapSavings, layoutCost, spreadOut } from '../src/editor/editors/integrator/integratorLayout';

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

  it.each(
    [
      { name: 'a menu with two returning tales', edges: [[2], [], [3], [1, 4, 5], [3], [3]], levels: [3] },
      { name: 'two levels with returning talks', edges: [[2], [], [3, 4], [1, 5, 6], [2], [3], [3]], levels: [2, 3] },
    ].flatMap((motif) => [false, true].map((reorder) => ({ ...motif, reorder }))),
  )('arranges $name (reordered: $reorder) without crossing or hiding return links', ({ edges, levels, reorder }) => {
    const g = newGame('Returns');
    for (let i = 2; i < edges.length; i++) g.scenes.push(emptyScene(ADVTYPE));
    edges.forEach((targets, i) => {
      targets.forEach((toScene, k) => {
        g.scenes[i].links[k] = { toScene, from: { x: i + 1, y: k + 2 }, to: { x: k + 3, y: i + 4 } };
      });
    });
    for (const level of levels) {
      g.scenes[level].files[1] = `level${level}.map`;
      g.scenes[level].files[9] = `card${level}.lst`;
    }
    const originals = structuredClone(g);
    const copies = addReturnScenes(g, levels);
    expect(g.scenes).toHaveLength(edges.length + levels.length);
    for (const [level, copy] of copies) {
      expect(g.scenes[level].files[9]).toBe(`card${level}.lst`);
      expect(g.scenes[copy].files).toEqual(originals.scenes[level].files.map((f, i) => (i === 9 ? '' : f)));
      expect(g.scenes[copy].links).toEqual(g.scenes[level].links);
      for (const target of edges[level]) {
        originals.scenes[target].links.forEach((link, k) => {
          if (link.toScene === level) expect(g.scenes[target].links[k]).toEqual({ ...link, toScene: copy });
        });
      }
    }
    if (reorder) {
      g.scenes.reverse();
      for (const scene of g.scenes) for (const link of scene.links) if (link.toScene !== NOSCENE) link.toScene = g.scenes.length - 1 - link.toScene;
    }
    const before = structuredClone(g);
    const bytes = serializeGame(g);
    const pos = autoArrange(g);
    checkNoOverlap(g, pos);
    const pairs: [number, number][] = g.scenes.flatMap((s, i) => s.links.filter((l) => l.toScene !== NOSCENE).map((l): [number, number] => [i, l.toScene]));
    const cost = layoutCost(pairs, pos, { w: 22, h: 18 });
    expect(cost.cross).toBe(0);
    expect(cost.under).toBe(0);
    expect(g).toEqual(before); // arranging changes no files, links, arrivals or runtime return behavior
    expect(serializeGame(g)).toEqual(bytes);
  });

  it('clears a returning hub ending without adding arrows under its five side scenes', () => {
    const g = newGame('Hub');
    for (let i = 2; i < 8; i++) g.scenes.push(emptyScene(ADVTYPE));
    g.scenes[0].links[0].toScene = 2;
    [3, 4, 5, 6, 7, 1].forEach((s, k) => (g.scenes[2].links[k].toScene = s));
    for (let i = 3; i < 8; i++) g.scenes[i].links[0].toScene = 2;
    addReturnScenes(g, [2]);
    const pos = autoArrange(g);
    checkNoOverlap(g, pos);
    const pairs = g.scenes.flatMap((s, i) => s.links.filter((l) => l.toScene !== NOSCENE).map((l): [number, number] => [i, l.toScene]));
    const cost = layoutCost(pairs, pos, { w: 22, h: 18 });
    expect(cost.cross).toBe(0);
    expect(cost.under).toBeLessThanOrEqual(4); // the side-to-return links already pass under four cards
  });

  it('keeps multiple endings and an unreachable scene bounded, separate and deterministic', () => {
    const g = chain(2);
    g.scenes.push(emptyScene(ADVTYPE), emptyScene(ADVTYPE), emptyScene(ENDTYPE), emptyScene(ADVTYPE));
    g.scenes[3].links[1].toScene = 4;
    g.scenes[3].links[2].toScene = 5;
    g.scenes[3].links[3].toScene = 6;
    g.scenes[4].links[0].toScene = 3;
    g.scenes[5].links[0].toScene = 3;
    addReturnScenes(g, [3]);
    const before = structuredClone(g);
    const list = arrangements(g);
    for (const option of list) checkNoOverlap(g, option.positions);
    expect(autoArrange(g)).toEqual(list[0].positions);
    expect(arrangements(g)).toEqual(list);
    expect(g).toEqual(before);
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

  it('routes an ending shortcut around two branches that rejoin', () => {
    const g = newGame('Returning branches');
    for (let i = 0; i < 5; i++) g.scenes.push(emptyScene(ADVTYPE));
    const pairs: [number, number][] = [
      [0, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [3, 1],
      [4, 6],
      [5, 6],
      [6, 1],
    ];
    for (const [from, to] of pairs) g.scenes[from].links.find((l) => l.toScene === NOSCENE)!.toScene = to;
    const pos = autoArrange(g);
    checkNoOverlap(g, pos);
    const centers = new Map([...pos].map(([s, p]) => [s, { x: p.x + 2, y: p.y + 2 }]));
    expect(layoutCost(pairs, centers, { w: 22, h: 18 })).toMatchObject({ cross: 0, under: 0 });
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
    const centers = new Map([...pos].map(([s, p]) => [s, { x: p.x + 2, y: p.y + 2 }]));
    // Final Curtain's conversations are scenes that all link to one another (each answer is
    // a scene you can ask the next question from), so its graph cannot be drawn flat.
    if (!DENSE.has(_)) expect(layoutCost(pairs, centers, { w: 22, h: 18 }).cross).toBe(0);
    checkNoOverlap(g, spreadOut(g));
  });
});

describe('closeGaps', () => {
  it('closes the wide gaps of the DOS default column (title, level, end) but keeps it a column in order', () => {
    const g = newGame('Gaps');
    const lvl = emptyScene(ADVTYPE);
    lvl.pos = { x: 157, y: 110 };
    g.scenes.push(lvl);
    const out = closeGaps(g);
    const ys = [0, 1, 2].map((i) => out.get(i)!.y);
    const order = [ys[0], ys[2], ys[1]];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(ys[2] - ys[0]).toBe(CARD_UNITS.h + SNUG_GAP.y);
    expect(ys[1] - ys[2]).toBe(CARD_UNITS.h + SNUG_GAP.y);
    expect(new Set([0, 1, 2].map((i) => out.get(i)!.x)).size).toBe(1);
    expect(gapSavings(g).y).toBeGreaterThan(0.4);
    for (const [i, p] of out) g.scenes[i].pos = p;
    expect(gapSavings(g)).toEqual({ x: 0, y: 0 });
  });
});
