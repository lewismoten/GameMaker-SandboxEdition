// Verify the demo checker rejects an exit that returns to level 1.
import { beforeEach, expect, it, vi } from 'vitest';
import { demoRecording } from '../src/demo';

vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  readFileSync: () => demoRecording(),
}));
const fixture = vi.hoisted(() => ({ destination: 3 }));
vi.mock('./sim', () => ({
  GameSim: class {
    ci = { score: 130 };
    trail = [2, fixture.destination];
    press() {}
    release() {}
    tick() {}
  },
}));

beforeEach(() => {
  vi.resetModules();
  fixture.destination = 3;
});

it('accepts the exit to level 2', async () => {
  await expect(import('./demoCheck')).resolves.toBeDefined();
});

it('rejects an exit back to level 1 despite the score and trail length', async () => {
  fixture.destination = 2;
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
  } finally {
    exit.mockRestore();
  }
});
