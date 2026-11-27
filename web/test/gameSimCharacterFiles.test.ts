// PLAYGAME keeps the previous character assets only for blank scene slots.
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { GameSim, readDisk } from '../packages/tools/src/kit/gameSim';

function sample() {
  return new GameSim(readDisk(fileURLToPath(new URL('../../cd/gameware/sample/', import.meta.url))));
}

it('keeps the loaded character and blocks for blank slots', () => {
  const sim = sample();
  const { chr, cblk } = sim.w;
  const files = sim.game.scenes[sim.scene].files;
  files[5] = '';
  files[6] = '';
  sim['enter'](sim.scene, 0, 0);
  expect(sim.w.chr).toBe(chr);
  expect(sim.w.cblk).toBe(cblk);
});

it.each([
  [5, 'missing.chr'],
  [6, 'missing.cbl'],
] as const)('rejects a missing file named in slot %i', (slot, name) => {
  const sim = sample();
  sim.game.scenes[sim.scene].files[slot] = name;
  expect(() => sim['enter'](sim.scene, 0, 0)).toThrow(name);
});
