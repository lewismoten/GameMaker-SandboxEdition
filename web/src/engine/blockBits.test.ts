// Block grav and solid values over 15 (Nebula's grav 20/36/48 and solid 48, Friction's grav 36):
// PLAYGAME only ever tests their low four bits (PLAYGAME.C 3750-3757 for gravity, 2636/2672 and
// 3571-3679 for walls, 2754-2765 for solid monsters), so the high bits change nothing.
import { describe, expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '../formats/blocks';
import { SceneSim } from '../editor/check/sim';
import { RIGHT, WALL, testGame } from '../editor/check/testGame';

// prettier-ignore
const ROWS = [
  '##########',
  '#........#',
  '#........#',
  '#E.......#',
  '##########',
];

/** The hero's path for 60 ticks, dropped in the air and walking right into the wall. */
async function path(air: { grav: number }, wall: { solid: number }): Promise<string[]> {
  const t = testGame(ROWS);
  const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
  bbl[0].grav = air.grav;
  bbl[WALL].solid = wall.solid;
  t.files.set('test.bbl', serializeBlocks(bbl));
  const sim = new SceneSim(t.game, 2, t, { x: 3, y: 1 });
  const out: string[] = [];
  for (let i = 0; i < 60; i++) {
    if (i === 20) sim.press(RIGHT);
    await sim.tick();
    const { x, y } = sim.w.chr;
    out.push(`${x[0]}.${x[1]},${y[0]}.${y[1]}`);
  }
  return out;
}

describe('block grav and solid over 15', () => {
  it('act on their low four bits only', async () => {
    const plain = await path({ grav: 4 }, { solid: 15 });
    // the hero falls to the floor and walks up to the right wall
    expect(plain[19]).not.toBe(plain[0]);
    expect(plain[59]).toBe(plain[58]);
    expect(await path({ grav: 20 }, { solid: 63 })).toEqual(plain); // 0x14, 0x3f
    expect(await path({ grav: 36 }, { solid: 31 })).toEqual(plain); // 0x24, 0x1f
  });

  it('with no low bits set, are no gravity and no wall', async () => {
    expect(await path({ grav: 48 }, { solid: 48 })).toEqual(await path({ grav: 0 }, { solid: 0 }));
  });
});
