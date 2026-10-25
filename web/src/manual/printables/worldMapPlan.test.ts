// The World Map's plan for every game: each place placed once and apart from the others, no path
// running under a place it doesn't go to, few crossings; the router keeping to that; the
// themes and regions picked from what each game is.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame, type Game } from '../../formats/game';
import { graphOf } from '../../editor/editors/integrator/layoutCells';
import { groupScenes, isBlackPalette, placesGame } from './worldMapGroups';
import { planWorld } from './worldMapPlan';
import { crossings, overlaps, placeBox, throughPlaces } from './worldMapMeasure';
import { routePaths } from './worldMapRoute';
import { regionsOf } from './worldMapRegions';
import { themeOf } from './worldMapThemes';

const root = join(__dirname, '../../../../games');

/** Every game with a .GAM: the player's places (folded as the map folds them) and every scene. */
function games(): { id: string; player: Game; every: Game }[] {
  return readdirSync(root).flatMap((id) => {
    let names: string[];
    try {
      names = readdirSync(join(root, id, 'disk'));
    } catch {
      return [];
    }
    const files = new Map(names.map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(root, id, 'disk', n)))]));
    const gam = [...files.keys()].find((n) => n.endsWith('.gam'));
    if (!gam) return [];
    const every = parseGame(files.get(gam)!);
    let hints;
    try {
      hints = (JSON.parse(readFileSync(join(root, id, 'printables.json'), 'utf8')) as { worldMap?: Parameters<typeof groupScenes>[3] }).worldMap;
    } catch {
      hints = undefined;
    }
    const dark = (i: number) => isBlackPalette(files.get(every.scenes[i].files[0]?.toLowerCase() ?? ''));
    return [{ id, player: placesGame(every, groupScenes(every, graphOf(every), dark, hints)), every }];
  });
}

const plans = new Map<Game, ReturnType<typeof planWorld>>();
/** A game's plan, worked out once for every test that looks at it. */
const plan = (g: Game) =>
  plans.get(g) ??
  plans
    .set(
      g,
      planWorld(
        g,
        (i) => (g.scenes[i].desc || 'Untitled').slice(0, 24),
        () => 0,
      ),
    )
    .get(g)!;
const ALL = games();

describe('World Map plans', () => {
  it('places every place once, none over another', () => {
    for (const { id, player } of ALL) {
      const p = plan(player);
      expect(
        [...p.at.keys()].sort((a, b) => a - b),
        id,
      ).toEqual([...graphOf(player).nodes].sort((a, b) => a - b));
      expect(overlaps(p.boxes), id).toEqual([]);
      expect(p.paths.length, id).toBe(graphOf(player).pairs.length);
    }
  });

  it('runs no path under a place it doesn’t join, and crosses paths at most once', () => {
    for (const { id, player } of ALL) {
      const p = plan(player);
      expect(throughPlaces(p.paths, p.boxes).length, id).toBe(0);
      expect(crossings(p.paths), id).toBeLessThanOrEqual(1);
    }
  });

  it('keeps every path off the places in the every-scene view too', () => {
    for (const { id, every } of ALL) {
      if (graphOf(every).pairs.length > 120) continue; // a web of interviews: judged by shape alone
      const p = plan(every);
      expect(throughPlaces(p.paths, p.boxes).length, id).toBe(0);
    }
  }, 30000);

  it('lays a game of hubs out region by region', () => {
    const max = ALL.find((g) => g.id === 'maximus')!.player;
    const sectors = regionsOf(max, graphOf(max)).filter((r) => r.ids.length > 10);
    expect(sectors.map((r) => r.name)).toEqual(['The Cradle', 'Emberreach', 'The Shallows', 'Glasswind', 'The Deep Black']);
    const at = plan(max).at;
    // no sector's world sits among another sector's worlds
    for (const s of sectors) {
      const xs = s.ids.map((i) => at.get(i)!.x);
      const [lo, hi] = [Math.min(...xs), Math.max(...xs)];
      for (const o of sectors)
        if (o !== s) for (const i of o.ids.slice(1)) expect(at.get(i)!.x > lo && at.get(i)!.x < hi, `${o.name} in ${s.name}`).toBe(false);
    }
  });
});

describe('World Map paths', () => {
  const box = (x: number, y: number) => ({ c: { x, y }, r: 5.9, box: placeBox({ x, y }, 'A place', 0) });

  it('go round a place in the way, leaving from the top or sides', () => {
    const places = new Map([
      [0, box(20, 20)],
      [1, box(47, 20)],
      [2, box(74, 20)],
    ]);
    const [p] = routePaths(places, [[0, 2]], { x: 0, y: 0, w: 100, h: 60 });
    expect(throughPlaces([p], new Map([...places].map(([i, v]) => [i, v.box])))).toEqual([]);
    expect(p.line[0].y).toBeLessThanOrEqual(20);
    expect(p.line.every((q, k) => !k || q.x === p.line[k - 1].x || q.y === p.line[k - 1].y)).toBe(true);
  });

  it('counts crossings between paths, not where they share a place', () => {
    const a = {
      a: 0,
      b: 1,
      line: [
        { x: 0, y: 5 },
        { x: 10, y: 5 },
      ],
    };
    const b = {
      a: 2,
      b: 3,
      line: [
        { x: 5, y: 0 },
        { x: 5, y: 10 },
      ],
    };
    const c = {
      a: 0,
      b: 3,
      line: [
        { x: 5, y: 0 },
        { x: 5, y: 10 },
      ],
    };
    expect(crossings([a, b])).toBe(1);
    expect(crossings([a, c])).toBe(0);
  });
});

describe('World Map themes', () => {
  const theme = (id: string, title: string, blurb = '') => themeOf({ id, title, blurb }).id;
  it('reads a theme from what a game is', () => {
    expect(theme('a', 'Star Courier', 'Cross a galaxy of planets')).toBe('space');
    expect(theme('a', 'Bug Hunt', 'Shrink down onto the motherboard')).toBe('board');
    expect(theme('a', 'Night Shift', 'A library full of books')).toBe('library');
    expect(theme('a', 'Midnight Snack', 'Sneak to the fridge in the kitchen')).toBe('rooms');
    expect(theme('a', 'Paper Route', 'Ride down every street in town')).toBe('town');
    expect(theme('a', 'The Quest', 'Four dungeons across the kingdom')).toBe('land');
    expect(theme('a', 'Wander', 'Somewhere else')).toBe('land');
  });
  it('takes a hint where the words would mislead', () => {
    expect(theme('maximus', 'Maximus', 'a galaxy of 88 worlds')).toBe('space');
    expect(theme('logic', 'Ohm Sweet Ohm', 'circuit boards in a Smart Home')).toBe('rooms');
    expect(theme('year2000', 'In The Year 2000!', 'on the Moon')).toBe('town');
  });
});
