// Play test from a level: finding the level that plays a map, and starting a copy there.
import { describe, expect, it } from 'vitest';
import { ADVTYPE, emptyScene, newGame } from '../src/formats/game';
import { levelForMap, startingAt } from '../src/editor/editors/integrator/startAt';

describe('play test from a level', () => {
  const game = newGame('Test');
  const scene = emptyScene(ADVTYPE);
  scene.files[1] = 'LEVEL1.MAP';
  game.scenes.push(scene);
  const level = game.scenes.length - 1;

  it('finds the level that plays a map, whatever its case', () => {
    const map = game.scenes[level].files[1];
    expect(levelForMap(game, map.toLowerCase())).toBe(level);
    expect(levelForMap(game, 'nothere.map')).toBe(-1);
  });

  it('starts the copy at that level and leaves the game alone', () => {
    const before = structuredClone(game.scenes[0].links[0]);
    const copy = startingAt(game, level);
    expect(copy.scenes[0].links[0].toScene).toBe(level);
    expect(game.scenes[0].links[0]).toEqual(before);
  });
});
