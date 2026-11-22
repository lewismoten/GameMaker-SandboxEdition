// Kit's Moves: the ceilings stop a repeated Up (lift) from climbing out over the hedges, the top sign or the
// low section. Positions are the feet block's top-left in world pixels; Kit is two blocks tall, so his head
// is 20 px above it. The bot's own route (dash, let go, dash again) is played by games/kit-moves/tools/check.ts.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { parseBlocks, BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { SOLID } from '../../games/kit/starter/book';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

const files = () => readDisk(fileURLToPath(new URL('../../games/kit-moves/disk/', import.meta.url)));
const RIGHT = 77;
const UP = 72;
const head = (s: GameSim) => s.pos.y * 20 + s.pos.sy - 20;

/** The world y of the underside of map row `row`. */
const underside = (row: number) => (row + 1) * 20;
/** Level 1's roof is map row 9; level 2's is map row 15, with a brick hanging from it to row 18 over world x520-600. */
const ROOF_1 = underside(9);
const ROOF_2 = underside(15);
const LOW_UNDERSIDE = underside(18);

function atScene(scene: number): GameSim {
  const sim = new GameSim(files(), 1);
  sim['enter'](scene, scene === 2 ? 0 : 2, 0);
  return sim;
}

/** Holds Right and pulses Up (`on` ticks down, `off` up) for `ticks` or until he walks through the door; calls `each` after every tick. */
async function liftRight(sim: GameSim, on: number, off: number, ticks: number, each: () => void): Promise<void> {
  sim.press(RIGHT);
  for (let tick = 1; tick <= ticks; tick++) {
    if ((tick - 1) % (on + off) < on) sim.press(UP);
    else sim.release(UP);
    const out = await sim.tick();
    expect(out, 'no life lost').not.toBe('dead');
    if (out) return;
    each();
  }
}

const RHYTHMS = [
  [1, 1],
  [2, 2],
  [3, 1],
  [2, 3],
  [5, 5],
  [12, 18],
  [40, 1],
];

describe("Kit's Moves ceilings", () => {
  it('has a solid roof across both levels and over the whole low section (world x520-600)', () => {
    const disk = files();
    const blocks = parseBlocks(disk.get('km.bbl')!, BACKBL);
    const one = parseMap(disk.get('one.map')!);
    const two = parseMap(disk.get('two.map')!);
    for (let c = 10; c < 60; c++) expect(blocks[one.blocks[9 * 100 + c]].solid, `one roof ${c}`).toBe(SOLID);
    for (let c = 10; c < 80; c++) expect(blocks[two.blocks[15 * 100 + c]].solid, `two roof ${c}`).toBe(SOLID);
    for (let r = 16; r <= 18; r++) for (let c = 26; c <= 29; c++) expect(blocks[two.blocks[r * 100 + c]].solid, `low ${c},${r}`).toBe(SOLID);
  });

  // Level 1: walking right while lifting, Kit's head never passes the roof, so he cannot leave over the top sign.
  it.each(RHYTHMS)('level 1: Kit stays under the roof (Up %i on, %i off)', async (on, off) => {
    const sim = atScene(2);
    let top = head(sim);
    await liftRight(sim, on, off, 900, () => (top = Math.min(top, head(sim))));
    expect(top, 'highest head y').toBeGreaterThanOrEqual(ROOF_1);
  });

  // Level 2: the continuous roof also covers the dash lesson.
  it.each(RHYTHMS)('level 2: Kit stays under the roof (Up %i on, %i off)', async (on, off) => {
    const sim = atScene(3);
    let top = head(sim);

    await liftRight(sim, on, off, 900, () => {
      top = Math.min(top, head(sim));
    });
    expect(top, 'highest head y').toBeGreaterThanOrEqual(ROOF_2);
  });

  it('stops a lift directly beneath the hanging bricks', async () => {
    const sim = atScene(3);
    sim.w.chr.x = [26, 0]; // Under the same ceiling, before the headwind.
    sim.w.chr.y = [21, 0];
    expect(head(sim)).toBeGreaterThan(LOW_UNDERSIDE);
    let highest = head(sim);
    sim.press(UP);
    for (let t = 0; t < 80; t++) {
      if (t === 40) sim.release(UP);
      expect(await sim.tick()).toBeUndefined();
      expect(sim.pos.x * 20 + sim.pos.sx).toBe(520);
      highest = Math.min(highest, head(sim));
    }
    expect(highest).toBe(LOW_UNDERSIDE);
  });
});
