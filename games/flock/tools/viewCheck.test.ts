// Exercise the visibility report with a fixed camera and six gameplay ticks.
import { expect, it, vi } from 'vitest';
import { BIRD } from '../src/monsters';

vi.mock('./sim', () => ({
  GameSim: class {
    scene = 2;
    w = { mx: 0, my: 0, scroll: { nx: 0, ny: 0, littleShiftx: 0, littleShifty: 0 }, mm: [], mi: [] };
    async tick() {}
  },
}));
vi.mock('../../kit/levelRun', () => ({
  async playLevels({ sim }: { sim: { tick(): Promise<void>; w: { mm: unknown[]; mi: unknown[] } } }) {
    for (const [count, x, y] of [
      [5, 292, 176],
      [5, 300, 100],
      [5, 100, 180],
      [1, 0, 0],
      [0, 0, 0],
      [1, -1, 0],
    ]) {
      sim.w.mm = Array.from({ length: count }, () => ({ monnum: BIRD }));
      sim.w.mi = sim.w.mm.map(() => ({ curx: [0, x], cury: [0, y] }));
      await sim.tick();
    }
  },
}));

it('counts every tick and only fully visible birds in the gameplay viewport', async () => {
  const log = vi.spyOn(console, 'log');
  try {
    await import('./viewCheck');
    expect(log).toHaveBeenCalledWith('scene 2: 6 ticks, all five birds in view 17%, some bird in view 33%');
  } finally {
    log.mockRestore();
  }
});
