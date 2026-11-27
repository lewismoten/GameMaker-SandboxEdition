// Replay the title demo with only the middle projectile suppressed.
import { expect, it, vi } from 'vitest';
import { SCAN_ENTER } from '../src/hero';
import { GameSim } from './sim';

it('rejects a range demonstration where the middle star never spawns', async () => {
  const press = GameSim.prototype.press;
  let throws = 0;
  vi.spyOn(GameSim.prototype, 'press').mockImplementation(function (this: GameSim, scan) {
    if (scan === SCAN_ENTER && ++throws === 2) return;
    press.call(this, scan);
  });
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
    expect(throws).toBe(3);
  } finally {
    vi.restoreAllMocks();
  }
});
