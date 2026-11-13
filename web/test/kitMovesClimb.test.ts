// Regressions for the built Kit's Moves boundaries and the dash lesson's lift-only shortcut.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { parseBlocks, BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { play } from '../../games/kit-moves/tools/play';

const files = () => readDisk(fileURLToPath(new URL('../../games/kit-moves/disk/', import.meta.url)));

function atScene(scene: number): GameSim {
  const sim = new GameSim(files(), 1);
  sim['enter'](scene, scene === 2 ? 0 : 2, 0);
  return sim;
}

const x = (sim: GameSim) => sim.pos.x * 20 + sim.pos.sx;

describe("Kit's Moves climb boundaries", () => {
  it('keeps a continuous solid roof above the level-1 sign and across level 2', () => {
    const disk = files();
    const blocks = parseBlocks(disk.get('km.bbl')!, BACKBL);
    for (const [name, row, width] of [
      ['one.map', 9, 50],
      ['two.map', 15, 70],
    ] as const) {
      const map = parseMap(disk.get(name)!);
      for (let x = 10; x < 10 + width; x++) {
        expect(blocks[map.blocks[row * 100 + x]].solid, `${name}, roof cell ${x},${row}`).toBeTruthy();
      }
    }
  });

  it.each([2, 3])('keeps Left plus Up two ticks on/two off inside scene %i', async (scene) => {
    const sim = atScene(scene);
    sim.press(75);
    for (let tick = 1; tick <= 600; tick++) {
      if ((tick - 1) % 4 < 2) sim.press(72);
      else sim.release(72);
      expect(await sim.tick()).toBeUndefined();
      expect(x(sim), `scene ${scene}, tick ${tick}`).toBeGreaterThanOrEqual(220);
    }
  });

  it('stops the recorded lift-only winning shortcut in the dash lesson', async () => {
    const sim = atScene(3);
    sim.press(77);
    for (let tick = 1; tick <= 1000; tick++) {
      if (tick <= 460 && tick % 2) sim.press(72);
      else sim.release(72);
      if (tick > 460 && x(sim) >= 1480) sim.release(77);
      if (await sim.tick()) break;
    }
    expect(sim.ended).not.toBe('won');
    expect(x(sim)).toBeLessThan(1180);
    expect(sim.deaths).toBe(0);
  });

  it.each([
    [1, 1],
    [2, 2],
    [4, 2],
    [1, 2],
    [1, 3],
    [2, 1],
    [3, 1],
    [3, 2],
    [4, 1],
    [6, 2],
    [8, 4],
    [12, 4],
  ])('stops sustained Up %i-on/%i-off from replacing the dash lesson', async (on, off) => {
    const sim = atScene(3);
    sim.press(77);
    let descend = false;
    for (let tick = 1; tick <= 3000; tick++) {
      if (x(sim) >= 1180) descend = true;
      if (!descend && (tick - 1) % (on + off) < on) sim.press(72);
      else sim.release(72);
      if (descend && x(sim) >= 1480) sim.release(77);
      if (await sim.tick()) break;
    }
    expect(sim.ended).not.toBe('won');
    expect(x(sim)).toBeLessThan(1180);
    expect(sim.deaths).toBe(0);
  });

  it('preserves the complete intended lift and dash route, all coins and no deaths', async () => {
    const { sim } = await play();
    expect(sim.ended).toBe('won');
    expect(sim.deaths).toBe(0);
    expect(sim.ci.score).toBe(120);
  });
});
