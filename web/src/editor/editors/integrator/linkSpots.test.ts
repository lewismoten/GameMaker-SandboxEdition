// The links read as places on the maps (linkSpots.ts) and changed from a map (linkEdits.ts).
import { describe, expect, it } from 'vitest';
import { ADVTYPE, ENDTYPE, NOSCENE, emptyScene, newGame, type Game } from '../../../formats/game';
import { exitsOf, sourceName, waysIn, waysInto, wayInLabel } from './linkSpots';
import { addLink, canLink, clampCell, moveSource, nextScene, removeLink, retarget, setFrom, setTo } from './linkEdits';

/** Title → Level 1 (two exits: to Level 2 and Game won) → Level 2 → Game won. */
function game(): Game {
  const g = newGame('Test');
  for (const name of ['Level 1', 'Level 2']) {
    const s = emptyScene(ADVTYPE);
    s.desc = name;
    g.scenes.push(s);
  }
  g.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 5, y: 6 } };
  // a stray second link on the start scene: play() never follows it
  g.scenes[0].links[1] = { toScene: 3, from: { x: 0, y: 0 }, to: { x: 9, y: 9 } };
  g.scenes[2].links[0] = { toScene: 3, from: { x: 40, y: 12 }, to: { x: 1, y: 2 } };
  g.scenes[2].links[1] = { toScene: 1, from: { x: 90, y: 90 }, to: { x: 0, y: 0 } };
  g.scenes[3].links[0] = { toScene: 1, from: { x: 50, y: 50 }, to: { x: 0, y: 0 } };
  return g;
}

describe('ways in', () => {
  it('lists the start link and the levels’ links into levels, not the start’s other links or links to Game won', () => {
    const w = waysIn(game());
    expect(w).toEqual([
      { from: 0, link: 0, to: 2, at: { x: 5, y: 6 } },
      { from: 2, link: 0, to: 3, at: { x: 1, y: 2 } },
    ]);
  });

  it('keeps to the scenes asked for', () => {
    expect(waysInto(game(), [3]).map((w) => w.from)).toEqual([2]);
  });

  it('names where each comes from', () => {
    const g = game();
    const [start, exit] = waysIn(g);
    expect(sourceName(g, start)).toBe('the title');
    expect(wayInLabel(g, start)).toBe('Level 1 at 5,6, from the title');
    // Level 1 has two exits, so the link is numbered
    expect(wayInLabel(g, exit)).toBe('Level 2 at 1,2, from Level 1’s exit 1');
    g.scenes[2].links[1].toScene = NOSCENE;
    expect(wayInLabel(g, exit)).toBe('Level 2 at 1,2, from Level 1’s exit');
  });
});

describe('exits', () => {
  it('lists a level’s links with the won ending', () => {
    const e = exitsOf(game(), [2]);
    expect(e.map((x) => [x.link, x.at, x.to, x.ending])).toEqual([
      [0, { x: 40, y: 12 }, 3, undefined],
      [1, { x: 90, y: 90 }, 1, 'won'],
    ]);
  });

  it('marks a link a lower one on the same block hides (chklnk takes the first)', () => {
    const g = game();
    g.scenes[2].links[1].from = { x: 40, y: 12 };
    const e = exitsOf(g, [2]);
    expect(e[0].shadowedBy).toBeUndefined();
    expect(e[1].shadowedBy).toBe(0);
  });

  it('has none for a start scene (it has no map)', () => {
    expect(exitsOf(game(), [0])).toEqual([]);
  });
});

describe('editing links from a map', () => {
  it('moves blocks, kept on the map', () => {
    const g = game();
    setFrom(g, 2, 0, { x: 120, y: -3 });
    setTo(g, 2, 0, { x: 7.4, y: 8.6 });
    expect(g.scenes[2].links[0].from).toEqual({ x: 99, y: 0 });
    expect(g.scenes[2].links[0].to).toEqual({ x: 7, y: 9 });
    expect(clampCell({ x: -1, y: 100 })).toEqual({ x: 0, y: 99 });
  });

  it('adds an exit in the first free link, and refuses what GRATOR refuses', () => {
    const g = game();
    expect(addLink(g, 3, 2, { x: 3, y: 3 }, { x: 4, y: 4 })).toBe(1);
    expect(g.scenes[3].links[1]).toEqual({ toScene: 2, from: { x: 3, y: 3 }, to: { x: 4, y: 4 } });
    expect(canLink(g, 2, 0)).toBe(false); // never to a start scene
    g.scenes[1].gametype = ENDTYPE;
    expect(canLink(g, 1, 2)).toBe(false); // never from an end scene
    expect(retarget(g, 2, 0, 0)).toBe(false);
    expect(retarget(g, 2, 0, 1)).toBe(true);
    expect(g.scenes[2].links[0].toScene).toBe(1);
  });

  it('a start scene has room for one link only', () => {
    const g = game();
    removeLink(g, 0, 1);
    expect(addLink(g, 0, 3, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(-1);
    removeLink(g, 0, 0);
    expect(g.scenes[0].links[0].toScene).toBe(NOSCENE);
    expect(addLink(g, 0, 3, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(0);
  });

  it('moves a link to another source scene', () => {
    const g = game();
    const at = moveSource(g, 2, 0, 3);
    expect(at).toBe(1);
    expect(g.scenes[2].links[0].toScene).toBe(NOSCENE);
    expect(g.scenes[3].links[1]).toEqual({ toScene: 3, from: { x: 40, y: 12 }, to: { x: 1, y: 2 } });
  });

  it('a new exit leads to the next level, else to Game won', () => {
    const g = game();
    expect(nextScene(g, 2)).toBe(3);
    expect(nextScene(g, 3)).toBe(1);
  });
});
