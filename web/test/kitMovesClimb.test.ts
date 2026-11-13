// Kit's Moves: the ceilings stop a repeated Up (lift) from climbing out over the hedges or the low section,
// and the intended route (dash, let go, dash again) still wins.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { parseBlocks, BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

const files = () => readDisk(fileURLToPath(new URL('../../games/kit-moves/disk/', import.meta.url)));
const RIGHT = 77;
const UP = 72;
const x = (s: GameSim) => s.pos.x * 20 + s.pos.sx;
const y = (s: GameSim) => s.pos.y * 20 + s.pos.sy;

function atScene(scene: number): GameSim {
  const sim = new GameSim(files(), 1);
  sim['enter'](scene, scene === 2 ? 0 : 2, 0);
  return sim;
}

describe("Kit's Moves ceilings", () => {
  it('has a solid roof across both levels and over the whole low section (world x520-600)', () => {
    const disk = files();
    const blocks = parseBlocks(disk.get('km.bbl')!, BACKBL);
    const one = parseMap(disk.get('one.map')!);
    const two = parseMap(disk.get('two.map')!);
    for (let c = 10; c < 60; c++) expect(blocks[one.blocks[9 * 100 + c]].solid, `one roof ${c}`).toBeTruthy();
    for (let c = 10; c < 80; c++) expect(blocks[two.blocks[15 * 100 + c]].solid, `two roof ${c}`).toBeTruthy();
    for (let r = 16; r <= 18; r++) for (let c = 26; c <= 29; c++) expect(blocks[two.blocks[r * 100 + c]].solid, `low ${c},${r}`).toBeTruthy();
  });

  // Hold Right and pulse Up (on/off ticks), released at a start x, in the dash lesson: Kit must never rise over the ceiling.
  it.each([
    [1, 1],
    [2, 2],
    [3, 1],
    [2, 3],
  ])('cannot lift over the x520-600 ceiling (Up %i on, %i off)', async (on, off) => {
    const sim = atScene(3);
    sim.press(RIGHT);
    let top = Infinity;
    for (let tick = 1; tick <= 900; tick++) {
      if ((tick - 1) % (on + off) < on) sim.press(UP);
      else sim.release(UP);
      expect(await sim.tick()).toBeUndefined();
      if (x(sim) >= 500 && x(sim) <= 620) top = Math.min(top, y(sim));
    }
    // the ceiling's underside is world y 360 (map row 8's bottom edge, rows of 20); Kit's top must stay below row 5
    expect(top, 'highest y over x500-620').toBeGreaterThanOrEqual(5 * 20);
  });
});
