// Exercise the demo verifier with crossing, pit-floor and late-exit trajectories.
import { beforeEach, expect, it, vi } from 'vitest';
import { demoRecording } from '../src/demo';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';

vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  readFileSync: () => demoRecording(),
}));

const keys = parseRecording(demoRecording());
const end = keys.slice(0, keys.findIndex((event) => event.key === 1) + 1).reduce((sum, event) => sum + event.delta, 0);
const fixture = vi.hoisted(() => ({ ticks: 0, drops: false, late: false }));
vi.mock('./sim', () => ({
  GameSim: class {
    ci = { score: 50 };
    trail = [2];
    scene = 2;
    pos = { x: 24, y: 19, sx: 0, sy: 0 };
    press() {}
    release() {}
    tick() {
      fixture.ticks++;
      if (fixture.ticks === 2) this.pos = { x: 27, y: fixture.drops ? 21 : 19, sx: 0, sy: 0 };
      if (fixture.ticks === 3) this.pos = { x: 30, y: 19, sx: 0, sy: 0 };
      if (fixture.ticks === (fixture.late ? end + 1 : end)) this.trail.push(3);
    }
  },
}));

beforeEach(() => {
  vi.resetModules();
  fixture.ticks = 0;
  fixture.drops = false;
  fixture.late = false;
});

async function rejected(): Promise<void> {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
  } finally {
    exit.mockRestore();
  }
}

it('accepts a jump across the gap', async () => {
  await expect(import('./demoCheck')).resolves.toBeDefined();
});

it('rejects a route across the pit floor despite the score and exit', async () => {
  fixture.drops = true;
  await rejected();
});

it('rejects an exit one tick after Escape', async () => {
  fixture.late = true;
  await rejected();
  expect(fixture.ticks).toBe(end);
});
