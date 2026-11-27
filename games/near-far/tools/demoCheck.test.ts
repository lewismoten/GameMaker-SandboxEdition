// The checker must sample the landing at the recorded Escape press.
import { expect, it, vi } from 'vitest';
import { FLOOR, LAND_X } from '../src/levels';
import { demoRecording } from '../src/demo';

const { tick } = vi.hoisted(() => ({ tick: vi.fn() }));
vi.mock('node:fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs')>()),
  readFileSync: () => demoRecording(),
}));
vi.mock('./sim', () => ({
  GameSim: class {
    tick = tick;
    press = vi.fn();
    release = vi.fn();
    trail = [3];
    ci = { score: 20 };
    get pos() {
      expect(tick).toHaveBeenCalledTimes(64);
      return { x: 10 + LAND_X, y: 10 + FLOOR - 1 };
    }
  },
}));

it('checks the landing after the last 45 ticks with Right held', async () => {
  await import('./demoCheck');
});
