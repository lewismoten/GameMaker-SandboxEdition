// The hidden-exit check: a link out on plain wall is found; a door, sign, open sky or the map's edge beside it is not.
import { describe, expect, it } from 'vitest';
import { scenesOf } from '../sceneData';
import { testGame } from '../testGame';
import { hiddenExits } from './hiddenExit';

const LINK = { x: 20, y: 20 };

/** A level of wall with its exit link at (20, 20); `paint` draws block `n` at offsets from the link. */
function level(paint: Record<string, number> = {}, link = LINK) {
  const t = testGame(['##########', '#S.......#', '##########']);
  t.game.scenes[2].links[0] = { toScene: 1, from: link, to: { x: 0, y: 0 } };
  const d = scenesOf(t.game, t)[0];
  d.map.blocks.fill(1);
  for (const [k, n] of Object.entries(paint)) {
    const [dx, dy] = k.split(',').map(Number);
    d.map.blocks[(link.y + dy) * 100 + link.x + dx] = n;
  }
  d.bbl[30].pixels.fill(6); // a door
  d.bbl[31].pixels.fill(9); // a sign
  return { t, d };
}

describe('hidden exit', () => {
  it('flags a link on plain wall', () => {
    const { t, d } = level();
    expect(hiddenExits(t.game, d).map((f) => [f.check, f.where.cell])).toEqual([['hidden-exit', 20 * 100 + 20]]);
  });
  it('is fine under a door, even one cell off', () => {
    for (const k of ['0,0', '0,-1', '1,0']) {
      const { t, d } = level({ [k]: 30 });
      expect(hiddenExits(t.game, d)).toEqual([]);
    }
  });
  it('is fine beside a sign', () => {
    const { t, d } = level({ '-1,-1': 31 });
    expect(hiddenExits(t.game, d)).toEqual([]);
  });
  it('is fine in open sky, and at the map edge', () => {
    const sky = level({ '0,0': 0 });
    expect(hiddenExits(sky.t.game, sky.d)).toEqual([]);
    const edge = level({}, { x: 99, y: 40 });
    expect(hiddenExits(edge.t.game, edge.d)).toEqual([]);
  });
});
