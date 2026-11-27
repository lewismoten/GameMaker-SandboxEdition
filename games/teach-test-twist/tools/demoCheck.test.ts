// Exercise the demo verifier with a simulated exit just beyond the recorded ending.
import { expect, it, vi } from 'vitest';
import { demoRecording } from '../src/demo';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';

vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  readFileSync: () => demoRecording(),
}));

const keys = parseRecording(demoRecording());
const end = keys.slice(0, keys.findIndex((event) => event.key === 1) + 1).reduce((sum, event) => sum + event.delta, 0);
let ticks = 0;
vi.mock('./sim', () => ({
  GameSim: class {
    ci = { score: 50 };
    trail = [2];
    press() {}
    release() {}
    tick() {
      if (++ticks === end + 1) this.trail.push(3);
    }
  },
}));

it('rejects an exit one tick after Escape', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
    expect(ticks).toBe(end);
  } finally {
    exit.mockRestore();
  }
});
