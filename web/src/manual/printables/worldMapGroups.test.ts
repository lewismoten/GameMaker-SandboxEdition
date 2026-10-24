// The player's World Map: conversation and passage scenes fold into their place, a game's own
// groups win, and every scene a player walks through stays a place of its own.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADVTYPE, ENDTYPE, STARTTYPE, emptyLink, emptyScene, newGame, parseGame, type Game } from '../../formats/game';
import { graphOf } from '../../editor/editors/integrator/layoutCells';
import { groupScenes, hintProblems, isBlackPalette, placeLabels, placesGame, sceneRefs } from './worldMapGroups';
import type { PrintablesFile } from './types';

/** A game from [name, type, palette, map, links to] rows. */
function gameOf(rows: [string, number, string, string, number[]][]): Game {
  const g = newGame();
  g.scenes = rows.map(([desc, type, pal, map, to]) => {
    const s = emptyScene(type);
    s.desc = desc;
    s.files[0] = pal;
    s.files[1] = map;
    s.links = to.map((t) => ({ ...emptyLink(), toScene: t }));
    return s;
  });
  return g;
}

const T = STARTTYPE;
const E = ENDTYPE;
const A = ADVTYPE;
const TOWN = gameOf([
  ['TITLE', T, '', '', [2]],
  ['The End', E, '', '', []],
  ['Nowish', A, 'town.pal', 'town.map', [3, 4, 5, 6]],
  ['Signpost', A, 'dark.pal', 'pass.map', [2]],
  ['Grandma Pim', A, 'dark.pal', 'pass.map', [2]],
  ['Doc Leo', A, 'dark.pal', 'pass.map', [2]],
  ['The Woods', A, 'woods.pal', 'woods.map', [2, 7, 1]],
  ['Doc Leo', A, 'dark.pal', 'woods.map', [8]],
  ['The Den', A, 'den.pal', 'den.map', [6]],
]);
const dark = (g: Game) => (i: number) => g.scenes[i].files[0] === 'dark.pal';

describe('World Map places', () => {
  it('folds dark scenes into their place: the one sharing their map, else where they lead', () => {
    const g = groupScenes(TOWN, graphOf(TOWN), dark(TOWN));
    expect([...g.hostOf]).toEqual([
      [3, 2],
      [4, 2],
      [5, 2],
      [7, 6],
    ]);
    expect(placeLabels(TOWN, g, 2)).toEqual(['3 Signpost', '4 Grandma Pim', '5 Doc Leo']);
    // the woods' passage to the den is now a way from the woods to the den
    const player = graphOf(placesGame(TOWN, g));
    expect(player.nodes).toEqual([0, 1, 2, 6, 8]);
    expect(player.out.get(6)).toEqual([2, 1, 8]);
    expect(player.out.get(2)).toEqual([6]);
  });

  it('lets a game group and name its places, and label them', () => {
    const hints = { groups: [{ scenes: ['The Woods', '7-8'], name: 'Deep Woods', labels: ['The den'] }] };
    expect(hintProblems(TOWN, hints)).toEqual([]);
    const g = groupScenes(TOWN, graphOf(TOWN), dark(TOWN), hints);
    expect(g.hostOf.get(8)).toBe(6);
    expect(g.hostOf.get(7)).toBe(6);
    expect(placesGame(TOWN, g).scenes[6].desc).toBe('Deep Woods');
    expect(placeLabels(TOWN, g, 6)).toEqual(['The den']);
    expect(sceneRefs(TOWN, 'Doc Leo')).toEqual([]); // two scenes have that name
    expect(hintProblems(TOWN, { groups: [{ scenes: [2, 0, 'Doc Leo', 2] }] })).toHaveLength(3);
  });

  it('knows a black palette', () => {
    expect(isBlackPalette(new Uint8Array(768))).toBe(true);
    expect(isBlackPalette(new Uint8Array(768).fill(1, 9, 10))).toBe(false);
    expect(isBlackPalette(undefined)).toBe(false);
  });
});

describe('every game’s World Map', () => {
  const games = join(__dirname, '../../../../games');
  for (const id of readdirSync(games)) {
    const dir = join(games, id, 'disk');
    if (!existsSync(dir)) continue;
    const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), join(dir, n)]));
    const gam = [...files.keys()].find((n) => n.endsWith('.gam'));
    if (!gam) continue;
    it(`${id}: its hints name real scenes, and only conversations and its own groups fold`, () => {
      const game = parseGame(new Uint8Array(readFileSync(files.get(gam)!)));
      const pj = join(games, id, 'printables.json');
      const hints = existsSync(pj) ? (JSON.parse(readFileSync(pj, 'utf8')) as PrintablesFile).worldMap : undefined;
      expect(hintProblems(game, hints)).toEqual([]);
      const black = (i: number) => {
        const f = files.get(game.scenes[i].files[0]?.toLowerCase() ?? '');
        return !!f && isBlackPalette(new Uint8Array(readFileSync(f)));
      };
      const graph = graphOf(game);
      const g = groupScenes(game, graph, black, hints);
      const grouped = new Set((hints?.groups ?? []).flatMap((x) => x.scenes.flatMap((r) => sceneRefs(game, r))));
      for (const i of g.hostOf.keys()) expect(black(i) || grouped.has(i), `scene ${i}`).toBe(true);
      // every way between places is still on the map
      const player = graphOf(placesGame(game, g));
      const place = (i: number) => g.hostOf.get(i) ?? i;
      for (const [a, b] of graph.pairs)
        if (place(a) !== place(b)) expect(player.pairs.some(([x, y]) => (x === place(a) && y === place(b)) || (x === place(b) && y === place(a)))).toBe(true);
    });
  }
});
