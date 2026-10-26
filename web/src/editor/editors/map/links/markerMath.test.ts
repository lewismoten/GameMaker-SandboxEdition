// The map's link markers in numbers (markerMath.ts): which links become markers, where they sit,
// and the block a drag or an arrow key moves one to.
import { describe, expect, it } from 'vitest';
import { ADVTYPE, emptyScene, newGame, type Game } from '../../../../formats/game';
import { cellAtPoint, mapMarkers, markerBox, MIN_MARK, nudge, stackIndex } from './markerMath';

function game(): Game {
  const g = newGame('Test');
  for (const name of ['Level 1', 'Level 2']) {
    const s = emptyScene(ADVTYPE);
    s.desc = name;
    g.scenes.push(s);
  }
  g.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 5, y: 6 } };
  g.scenes[2].links[0] = { toScene: 3, from: { x: 40, y: 12 }, to: { x: 1, y: 2 } };
  g.scenes[3].links[0] = { toScene: 2, from: { x: 3, y: 3 }, to: { x: 5, y: 6 } };
  g.scenes[3].links[1] = { toScene: 1, from: { x: 3, y: 3 }, to: { x: 0, y: 0 } };
  return g;
}

describe('link markers on a map', () => {
  it('turns the ways into a level and its exits into markers', () => {
    const m = mapMarkers(game(), [2]);
    expect(m.map((x) => [x.kind, x.key, x.at])).toEqual([
      ['in', 'in:0:0', { x: 5, y: 6 }],
      ['in', 'in:3:0', { x: 5, y: 6 }],
      ['out', 'out:2:0', { x: 40, y: 12 }],
    ]);
    expect(m[0]).toMatchObject({ start: true, label: 'Way in from the title, at 5,6' });
    expect(m[1]).toMatchObject({ start: false, label: 'Way in from Level 2’s exit 1, at 5,6' });
    expect(m[2].label).toBe('Exit 1 to Level 2, at 40,12');
  });

  it('says when an exit is never taken, and what wins the game', () => {
    const m = mapMarkers(game(), [3]).filter((x) => x.kind === 'out');
    expect(m.map((x) => x.label)).toEqual(['Exit 1 to Level 1, at 3,3', 'Exit 2 to Game won, at 3,3 (never taken: exit 1 is on the same block)']);
  });

  it('fans out markers on one block', () => {
    const m = mapMarkers(game(), [2]);
    expect([0, 1, 2].map((i) => stackIndex(m, i))).toEqual([0, 1, 0]);
  });

  it('puts a marker round its block, never smaller than a 24-pixel target', () => {
    // 100% zoom: blocks are 20 pixels, so the marker overhangs by 2 on each side
    expect(markerBox({ x: 5, y: 6 }, 20)).toEqual({ left: 98, top: 118, size: MIN_MARK });
    // 200%: the block is bigger than the minimum
    expect(markerBox({ x: 5, y: 6 }, 40)).toEqual({ left: 200, top: 240, size: 40 });
    // 10%: two-pixel blocks, the marker centered on one
    expect(markerBox({ x: 50, y: 50 }, 2)).toEqual({ left: 89, top: 89, size: 24 });
    expect(markerBox({ x: 5, y: 6 }, 20, 1)).toEqual({ left: 104, top: 124, size: 24 });
  });

  it('finds the block under a dragged pointer, kept on the map', () => {
    const rect = { left: 10, top: 20, width: 2000, height: 2000 };
    expect(cellAtPoint(10, 20, rect)).toEqual({ x: 0, y: 0 });
    expect(cellAtPoint(10 + 20 * 40 + 19, 20 + 20 * 12, rect)).toEqual({ x: 40, y: 12 });
    expect(cellAtPoint(-500, 99999, rect)).toEqual({ x: 0, y: 99 });
    // zoomed out to 10%: the same blocks in a 200-pixel map
    expect(cellAtPoint(10 + 81, 20 + 25, { left: 10, top: 20, width: 200, height: 200 })).toEqual({ x: 40, y: 12 });
  });

  it('nudges with the arrow keys, ten blocks with Shift, and stops at the edge', () => {
    expect(nudge({ x: 5, y: 5 }, 'ArrowRight')).toEqual({ x: 6, y: 5 });
    expect(nudge({ x: 5, y: 5 }, 'ArrowUp', true)).toEqual({ x: 5, y: 0 });
    expect(nudge({ x: 0, y: 5 }, 'ArrowLeft')).toBeUndefined();
    expect(nudge({ x: 99, y: 95 }, 'ArrowDown', true)).toEqual({ x: 99, y: 99 });
    expect(nudge({ x: 5, y: 5 }, 'a')).toBeUndefined();
  });
});
