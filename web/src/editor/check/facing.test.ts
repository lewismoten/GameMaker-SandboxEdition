// The facing check: a hero who walks sideways facing the player, and one whose head doesn’t turn.
import { describe, expect, it } from 'vitest';
import { BLEN } from '../../formats/blocks';
import { facing, sameKey } from './checks/facing';
import { scenesOf } from './sceneData';
import { testGame } from './testGame';

const ROWS = ['##########', '#E.S.....#', '##########'];

/** The test game's scene, with the hero's two blocks drawn by `draw(x, y)` (a color or 255). */
function scene(top: (x: number, y: number) => number, orientLeft: number) {
  const t = testGame(ROWS);
  const d = scenesOf(t.game, t)[0];
  for (const b of [0, 1]) for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) d.cbl[b].pixels[y * BLEN + x] = top(x, y);
  for (const f of d.chr.sequences[6].frames.slice(0, 4)) f.orient = orientLeft;
  return d;
}

/** A face on: the same both ways. */
const front = (x: number) => (x < 4 || x > 15 ? 255 : x === 7 || x === 12 ? 1 : 3);
/** A side view: a nose out to the right. */
const side = (x: number, y: number) => (x < 2 ? 255 : x > 11 ? (y > 6 && y < 13 ? 5 : 255) : x === 10 ? 1 : 3);

describe('the facing check', () => {
  it('finds a hero who walks sideways facing the player', () => {
    const d = scene(front, 0x44);
    expect(facing(d, [d]).map((f) => f.title)).toEqual(['The hero walks left and right facing the player']);
  });

  it('finds a head that doesn’t turn when only the bottom block is mirrored', () => {
    const d = scene(side, 0x40);
    expect(facing(d, [d]).map((f) => f.title)).toEqual(['The hero faces the same way walking left and right']);
  });

  it('leaves alone a hero marked as looking the same from every side', () => {
    const d = scene(front, 0x44);
    expect(facing(d, [d], new Set([sameKey('test.chr')]))).toEqual([]);
  });

  it('passes a side view mirrored both ways', () => {
    const d = scene(side, 0x44);
    expect(facing(d, [d])).toEqual([]);
  });
});
